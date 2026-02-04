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

/// Helper function to check if a received message is an attention call
fn is_attention_message(message_payload: &str) -> bool {
    message_payload.contains("\"type\":\"attention_call\"") || 
    message_payload.contains("\"type\": \"attention_call\"")
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
        // Convert the Utf8Bytes to a standard String immediately
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

        // Now emitting is safe because texto_string is a String (which is Serializable)
        let _ = app.emit("nova_mensagem_ws", &texto_string);
        let _ = app.emit("attention_call", &texto_string);

                    } else if let Err(e) = msg {
                        eprintln!("[Tauri] Erro de recebimento WS: {}", e);
                        // Se a conexão cair devido a um erro, marca o usuário como desconectado
                        if let Some(mut user) = obter_usuario() {
                            user.conectado_com_websocket = Some(false);
                            salvar_usuario(user);
                            println!("[Tauri] Usuário marcado como desconectado do WebSocket devido a erro.");
                        }
                        break; // Quebra o loop para tentar reconectar
                    }
                }
                println!("[Tauri] Conexão WebSocket perdida. Tentando reconectar...");
                // Quando a conexão é perdida, define o flag de volta para false
                if let Some(mut user) = obter_usuario() {
                    user.conectado_com_websocket = Some(false);
                    salvar_usuario(user);
                    println!("[Tauri] Usuário marcado como desconectado do WebSocket.");
                }
            }
            Ok(Err(e)) => {
                eprintln!("[Tauri] Falha ao conectar WebSocket: {}. Tentando novamente em 5 segundos...", e);
                if let Some(mut user) = obter_usuario() {
                    user.conectado_com_websocket = Some(false);
                    salvar_usuario(user);
                }
            }
            Err(_) => {
                eprintln!("[Tauri] Timeout ao tentar conectar ao WebSocket. Tentando novamente em 5 segundos...", );
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
#[tauri::command]
pub async fn send_ws_message(message: String) -> Result<(), String> {
    // Verifica o status do WebSocket do usuário antes de enviar.
    if let Some(user) = obter_usuario() {
        if user.conectado_com_websocket == Some(true) {
            return Err("Usuário já está conectado e pode apenas receber mensagens no momento.".to_string());
        }
    } else {
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

/// Comando Tauri para enviar uma mensagem de chamar atenção
#[tauri::command]
pub async fn send_attention_call(chat_id: i32) -> Result<(), String> {
    // Obtém informações do usuário atual
    let user = obter_usuario().ok_or("Nenhum usuário logado.".to_string())?;
    
    // Cria a mensagem de atenção
    let attention_msg = AttentionMessage {
        msg_type: "attention_call".to_string(),
        sender_id: user.id,
        sender_name: user.nome_completo.clone(),
        chat_id,
    };
    
    // Serializa para JSON
    let message_json = serde_json::to_string(&attention_msg)
        .map_err(|e| format!("Erro ao serializar mensagem: {}", e))?;
    
    let mut sender_lock = WS_SENDER.lock().await;
    if let Some(sender) = sender_lock.as_mut() {
        match sender.send(Message::Text(message_json.clone().into())).await {
            Ok(_) => {
                println!("[Tauri] Mensagem de chamar atenção enviada: {}", message_json);
                Ok(())
            },
            Err(e) => {
                eprintln!("[Tauri] Erro ao enviar mensagem de atenção: {}", e);
                Err(format!("Erro ao enviar mensagem de atenção: {}", e))
            }
        }
    } else {
        Err("WebSocket não está conectado.".to_string())
    }
}