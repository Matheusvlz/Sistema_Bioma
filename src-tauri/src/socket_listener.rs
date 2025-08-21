// src/socket_listener.rs

use tauri::AppHandle;
use tauri::Emitter;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use futures_util::{StreamExt, SinkExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_tungstenite::WebSocketStream;

use lazy_static::lazy_static;
// Nao precisamos mais de serde_json::Value se a mensagem nao for JSON
// use serde_json::Value;

// Import the user module to access and modify the global user state
use crate::model::usuario::{obter_usuario, salvar_usuario, Usuario};

lazy_static! {
    static ref WS_SENDER: Arc<Mutex<Option<futures_util::stream::SplitSink<WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>, Message>>>> = Arc::new(Mutex::new(None));
}

/// Helper function to check if a received message is a success confirmation.
/// Adapte esta função para o formato EXATO da sua mensagem de sucesso.
fn is_success_message(message_payload: &str) -> bool {
    // Verifica se a mensagem começa com "Conectado como usuário " e contém "Bem-vindo ao sistema!"
    // Esta verificação é flexível para qualquer ID de usuário.
    message_payload.starts_with("Conectado como usuário ") && message_payload.contains("Bem-vindo ao sistema!")
}

/// Inicia e mantém a conexão WebSocket.
/// Tentará reconectar se a conexão cair.
pub async fn iniciar_socket(api_url: &str, app: AppHandle) {
    println!("[Tauri] Iniciando serviço WebSocket. Tentando conectar a: {}", api_url);

    loop {
        match tokio::time::timeout(std::time::Duration::from_secs(10), connect_async(api_url)).await {
            Ok(Ok((ws_stream, _))) => {
                println!("[Tauri] Conectado ao WebSocket da API");

                let (sender, mut receiver) = ws_stream.split();
                *WS_SENDER.lock().await = Some(sender);

                // IMPORTANTE: Não setamos conectado_com_websocket para true aqui.
                // Ele será definido quando uma *mensagem de sucesso* for recebida após o envio inicial.

                while let Some(msg) = receiver.next().await {
                    if let Ok(Message::Text(texto)) = msg {
                        println!("[Tauri] WS recebeu: {}", texto);

                        // --- AQUI ESTÁ A LÓGICA ATUALIZADA PARA O SUCESSO ---
                        if is_success_message(&texto) {
                            if let Some(mut user) = obter_usuario() {
                                // Só atualiza se o status atual não for Some(true)
                                // para evitar escritas desnecessárias no Arc<RwLock<Usuario>>
                                if user.conectado_com_websocket != Some(true) {
                                    user.conectado_com_websocket = Some(true);
                                    salvar_usuario(user); // Salva o estado atualizado do usuário
                                    println!("[Tauri] Usuário logado marcado como CONECTADO ao WebSocket (confirmação recebida).");
                                }
                            }
                        }
                        // --- FIM DA LÓGICA ATUALIZADA ---

                        // Emite o evento para o frontend com a mensagem recebida
                        let _ = app.emit("nova_mensagem_ws", texto.to_string());

                    } else if let Err(e) = msg {
                        eprintln!("[Tauri] Erro de recebimento WS: {}", e);
                        // Se a conexão cair devido a um erro, marca o usuário como desconectado novamente
                        if let Some(mut user) = obter_usuario() {
                            user.conectado_com_websocket = Some(false);
                            salvar_usuario(user);
                            println!("[Tauri] Usuário marcado como desconectado do WebSocket devido a erro.");
                        }
                        break; // Quebra o loop para tentar reconectar
                    }
                }
                println!("[Tauri] Conexão WebSocket perdida. Tentando reconectar...");
                // Quando a conexão é perdida (o loop termina), define o flag de volta para false
                if let Some(mut user) = obter_usuario() {
                    user.conectado_com_websocket = Some(false);
                    salvar_usuario(user);
                    println!("[Tauri] Usuário marcado como desconectado do WebSocket.");
                }
            }
            Ok(Err(e)) => {
                eprintln!("[Tauri] Falha ao conectar WebSocket: {}. Tentando novamente em 5 segundos...", e);
                // Em caso de falha na conexão, garante que o flag seja false
                if let Some(mut user) = obter_usuario() {
                    user.conectado_com_websocket = Some(false);
                    salvar_usuario(user);
                }
            }
            Err(_) => {
                eprintln!("[Tauri] Timeout ao tentar conectar ao WebSocket. Tentando novamente em 5 segundos...");
                // Em caso de timeout, garante que o flag seja false
                if let Some(mut user) = obter_usuario() {
                    user.conectado_com_websocket = Some(false);
                    salvar_usuario(user);
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    }
}

/// Comando Tauri para enviar uma mensagem através da conexão WebSocket.
/// Este comando será chamado pelo frontend.
#[tauri::command]
pub async fn send_ws_message(message: String) -> Result<(), String> {
    // Verifica o status do WebSocket do usuário antes de enviar.
    // Permite o envio apenas se ainda não estiver marcado como totalmente conectado (Some(true)).
    if let Some(user) = obter_usuario() {
        if user.conectado_com_websocket == Some(true) {
            return Err("Usuário já está conectado e pode apenas receber mensagens no momento.".to_string());
        }
    } else {
        // Se nenhum usuário estiver logado, impede o envio.
        return Err("Nenhum usuário logado. Não é possível enviar mensagem WS.".to_string());
    }

    let mut sender_lock = WS_SENDER.lock().await;
    if let Some(sender) = sender_lock.as_mut() {
        match sender.send(Message::Text(message.clone().into())).await {
            Ok(_) => {
                println!("[Tauri] Mensagem WS enviada: {}", message);
                Ok(())
            },
            Err(e) => {
                eprintln!("[Tauri] Erro ao enviar mensagem WS: {}", e);
                Err(format!("Erro ao enviar mensagem WS: {}", e))
            }
        }
    } else {
        Err("WebSocket não está conectado. Tentando reconectar...".to_string())
    }
}