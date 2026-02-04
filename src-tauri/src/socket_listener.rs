// src/socket_listener.rs

use tauri::AppHandle;
use tauri::Emitter;
use tokio_tungstenite::{connect_async, tungstenite::Message};
use futures_util::{StreamExt, SinkExt};
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_tungstenite::WebSocketStream;
use serde::{Deserialize, Serialize};

use lazy_static::lazy_static;

// Import the user module to access and modify the global user state
use crate::model::usuario::{obter_usuario, salvar_usuario, Usuario};

lazy_static! {
    static ref WS_SENDER: Arc<Mutex<Option<futures_util::stream::SplitSink<WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>, Message>>>> = Arc::new(Mutex::new(None));
}

/// Estrutura para mensagens de chamar atenção
#[derive(Debug, Serialize, Deserialize)]
struct AttentionMessage {
    #[serde(rename = "type")]
    msg_type: String,
    sender_id: u32,
    sender_name: String,
    chat_id: i32,
}

/// Helper function to check if a received message is a success confirmation.
fn is_success_message(message_payload: &str) -> bool {
    message_payload.starts_with("Conectado como usuário ") && message_payload.contains("Bem-vindo ao sistema!")
}

/// Inicia e mantém a conexão WebSocket.
pub async fn iniciar_socket(api_url: &str, app: AppHandle) {
    println!("[Tauri] Iniciando serviço WebSocket. Tentando conectar a: {}", api_url);

    loop {
        match tokio::time::timeout(std::time::Duration::from_secs(10), connect_async(api_url)).await {
            Ok(Ok((ws_stream, _))) => {
                println!("[Tauri] Conectado ao WebSocket da API");

                let (sender, mut receiver) = ws_stream.split();
                *WS_SENDER.lock().await = Some(sender);

                while let Some(msg) = receiver.next().await {
                    if let Ok(Message::Text(texto)) = msg {
                        let texto_string = texto.to_string();
                        println!("[Tauri] WS recebeu: {}", texto_string);

                        if is_success_message(&texto_string) {
                            if let Some(mut user) = obter_usuario() {
                                if user.conectado_com_websocket != Some(true) {
                                    user.conectado_com_websocket = Some(true);
                                    salvar_usuario(user);
                                    println!("[Tauri] Usuário logado marcado como CONECTADO.");
                                }
                            }
                        }

                        // Emite o evento para o frontend
                        let _ = app.emit("nova_mensagem_ws", &texto_string);
                    } else if let Err(e) = msg {
                        eprintln!("[Tauri] Erro de recebimento WS: {}", e);
                        if let Some(mut user) = obter_usuario() {
                            user.conectado_com_websocket = Some(false);
                            salvar_usuario(user);
                        }
                        break; 
                    }
                }
                println!("[Tauri] Conexão WebSocket perdida. Tentando reconectar...");
                if let Some(mut user) = obter_usuario() {
                    user.conectado_com_websocket = Some(false);
                    salvar_usuario(user);
                }
            }
            Ok(Err(e)) => {
                eprintln!("[Tauri] Falha ao conectar WebSocket: {}. Tentando novamente...", e);
            }
            Err(_) => {
                eprintln!("[Tauri] Timeout ao conectar ao WebSocket.");
            }
        }
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
    }
}

/// Comando Tauri para enviar uma mensagem genérica (texto puro)
#[tauri::command]
pub async fn send_ws_message(message: String) -> Result<(), String> {
    verificar_conexao()?;

    let mut sender_lock = WS_SENDER.lock().await;
    if let Some(sender) = sender_lock.as_mut() {
        match sender.send(Message::Text(message.clone().into())).await {
            Ok(_) => {
                println!("[Tauri] Mensagem WS enviada: {}", message);
                Ok(())
            },
            Err(e) => Err(format!("Erro ao enviar: {}", e))
        }
    } else {
        Err("WebSocket não está conectado.".to_string())
    }
}

/// Comando Tauri para enviar uma chamada de atenção (JSON formatado)
/// Segue a mesma lógica de segurança do send_ws_message
#[tauri::command]
pub async fn send_attention_call(chat_id: i32) -> Result<(), String> {
    // 1. Verifica se o usuário pode enviar mensagens (mesma lógica do send_ws_message)
    verificar_conexao()?;

    // 2. Obtém dados do usuário para montar o JSON
    let user = obter_usuario().ok_or("Nenhum usuário logado.".to_string())?;
    
    let attention_msg = AttentionMessage {
        msg_type: "attention_call".to_string(),
        sender_id: user.id,
        sender_name: user.nome_completo.clone(),
        chat_id,
    };

    let message_json = serde_json::to_string(&attention_msg)
        .map_err(|e| format!("Erro ao serializar JSON: {}", e))?;

    // 3. Envia via socket usando o mesmo padrão do send_ws_message
    let mut sender_lock = WS_SENDER.lock().await;
    if let Some(sender) = sender_lock.as_mut() {
        match sender.send(Message::Text(message_json.clone().into())).await {
            Ok(_) => {
                println!("[Tauri] Chamada de atenção enviada: {}", message_json);
                Ok(())
            },
            Err(e) => Err(format!("Erro ao enviar chamada de atenção: {}", e))
        }
    } else {
        Err("WebSocket não está conectado.".to_string())
    }
}

/// Função auxiliar para evitar repetição de código de validação
fn verificar_conexao() -> Result<(), String> {
    if let Some(user) = obter_usuario() {
        // Se já estiver conectado, permitimos o envio conforme seu requisito original
        // (Nota: você tinha uma trava aqui no send_ws_message que impedia o envio se conectado_com_websocket fosse true. 
        // Eu removi a trava para permitir o envio, mas mantive a verificação de existência do usuário)
        Ok(())
    } else {
        Err("Nenhum usuário logado.".to_string())
    }
}