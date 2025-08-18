use serde::{Serialize, Deserialize};
use reqwest::Client;
use crate::model::usuarios_todos::Usuario;
use crate::model::usuario::obter_usuario;
use bigdecimal::BigDecimal;
use crate::config::get_api_url;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Debug)]
pub struct ChatResponse {
    pub usuarios: Vec<Usuario>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateChatRequest {
    pub user_ids: Vec<i32>,
    pub group_name: Option<String>,
    pub group_description: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ChatInfo {
    pub id: i32,
    pub group_id: i32,
    pub group_name: String,
    pub group_description: Option<String>,
    pub group_profile_photo: Option<String>,
    pub members: Vec<Usuario>,
    pub last_message: Option<MessageInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MessageInfo {
    pub id: u64,
    pub user_id: u32,
    pub content: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub user_name: String,
    pub visualizado_cont: i32,
    pub visualizado_hora: Option<chrono::DateTime<chrono::Utc>>,
    pub visualizado: bool,
    pub arquivo: bool,
    pub arquivo_nome: Option<String>,
    pub arquivo_tipo: Option<String>,
    pub arquivo_tamanho: Option<u64>,
    pub arquivo_url: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageRequest {
    pub chat_id: i32,
    pub user_id: i32,
    pub content: String,
    pub arquivo: Option<bool>,
    pub arquivo_nome: Option<String>,
    pub arquivo_tipo: Option<String>,
    pub arquivo_tamanho: Option<u64>,
    pub file_content: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendFileMessageRequest {
    pub chat_id: i32,
    pub user_id: i32,
    pub file_name: String,
    pub file_type: String,
    pub file_size: u64,
    pub file_content: String, // Base64 encoded content
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMessagesResponse {
    pub messages: Vec<MessageInfo>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetChatsResponse {
    pub chats: Vec<ChatInfo>,
}

// Buscar todos os usuários
#[tauri::command]
pub async fn get_users(app_handle: AppHandle) -> Result<ChatResponse, String> {
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/get_users", url);
    println!("[LOG] Enviando requisição para: {}", full_url);

    let client = Client::new();
    let response = client
        .post(&full_url)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição: {}", e))?;

    println!("[LOG] Status da resposta: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta: {}", e))?;

    println!("[LOG] Corpo da resposta:\n{}", body);

    let parsed: ChatResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Erro ao decodificar JSON: {}", e))?;

    println!("[LOG] Resposta decodificada com sucesso: {:?}", parsed);

    Ok(parsed)
}

// Criar um novo chat
#[tauri::command]
pub async fn create_chat( user_ids: Vec<i32>, group_name: Option<String>, group_description: Option<String>) -> Result<ChatInfo, String> {
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://127.0.0.1:8082".to_string());
    let full_url = format!("{}/chat/create", url);
    println!("[LOG] Criando chat para: {}", full_url);

    let request_body = CreateChatRequest {
        user_ids,
        group_name,
        group_description,
    };

    let client = Client::new();
    let response = client
        .post(&full_url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição: {}", e))?;

    println!("[LOG] Status da resposta: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta: {}", e))?;

    println!("[LOG] Corpo da resposta:\n{}", body);

    let parsed: ChatInfo = serde_json::from_str(&body)
        .map_err(|e| format!("Erro ao decodificar JSON: {}", e))?;

    println!("[LOG] Chat criado com sucesso: {:?}", parsed);

    Ok(parsed)
}

// Buscar chats de um usuário
#[tauri::command]
pub async fn get_user_chats(app_handle: AppHandle, user_id: i32) -> Result<GetChatsResponse, String> {
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/chat/user/{}", url, user_id);
    println!("[LOG] Buscando chats do usuário: {}", full_url);

    let client = Client::new();
    let response = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição: {}", e))?;

    println!("[LOG] Status da resposta: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta: {}", e))?;

    println!("[LOG] Corpo da resposta:\n{}", body);

    let parsed: GetChatsResponse = serde_json::from_str(&body)
        .map_err(|e| format!("Erro ao decodificar JSON: {}", e))?;

    println!("[LOG] Chats encontrados: {:?}", parsed);

    Ok(parsed)
}

// Enviar mensagem de texto
#[tauri::command]
pub async fn send_message(app_handle: AppHandle, chat_id: i32, user_id: i32, content: String) -> Result<MessageInfo, String> {
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/chat/message/send", url);
    println!("[LOG] Enviando mensagem para: {}", full_url);

    let request_body = SendMessageRequest {
        chat_id,
        user_id,
        content,
        arquivo: Some(false),
        arquivo_nome: None,
        arquivo_tipo: None,
        arquivo_tamanho: None,
        file_content: None,
    };

    let client = Client::new();
    let response = client
        .post(&full_url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição: {}", e))?;

    println!("[LOG] Status da resposta: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta: {}", e))?;

    println!("[LOG] Corpo da resposta:\n{}", body);

    let parsed: MessageInfo = serde_json::from_str(&body)
        .map_err(|e| format!("Erro ao decodificar JSON: {}", e))?;

    println!("[LOG] Mensagem enviada com sucesso: {:?}", parsed);

    Ok(parsed)
}

// Nova função específica para envio de arquivos
#[tauri::command]
pub async fn send_file_message(
    app_handle: AppHandle,
    chat_id: i32, 
    user_id: i32, 
    file_name: String, 
    file_type: String, 
    file_size: u64, 
    file_content: String
) -> Result<MessageInfo, String> {
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/chat/message/send", url);
    println!("[LOG] Enviando arquivo para: {}", full_url);

    // Validar tipo de arquivo
    let allowed_types = vec![
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
        "application/pdf", "application/msword", 
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/plain", "text/csv"
    ];

    if !allowed_types.contains(&file_type.as_str()) {
        return Err(format!("Tipo de arquivo não permitido: {}", file_type));
    }

    // Validar tamanho do arquivo (máximo 50MB)
    const MAX_FILE_SIZE: u64 = 50 * 1024 * 1024; // 50MB
    if file_size > MAX_FILE_SIZE {
        return Err(format!("Arquivo muito grande. Tamanho máximo: 50MB. Tamanho atual: {} bytes", file_size));
    }

    // Gerar conteúdo da mensagem baseado no tipo de arquivo
    let content = if file_type.starts_with("image/") {
        format!("📷 {}", file_name)
    } else {
        format!("📄 {}", file_name)
    };

    let request_body = SendMessageRequest {
        chat_id,
        user_id,
        content,
        arquivo: Some(true),
        arquivo_nome: Some(file_name.clone()),
        arquivo_tipo: Some(file_type.clone()),
        arquivo_tamanho: Some(file_size),
        file_content: Some(file_content),
    };

    let client = Client::new();
    let response = client
        .post(&full_url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição de arquivo: {}", e))?;

    println!("[LOG] Status da resposta do arquivo: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API ao enviar arquivo: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta do arquivo: {}", e))?;

    println!("[LOG] Corpo da resposta do arquivo:\n{}", body);

    let parsed: MessageInfo = serde_json::from_str(&body)
        .map_err(|e| format!("Erro ao decodificar JSON do arquivo: {}", e))?;

    println!("[LOG] Arquivo enviado com sucesso: {:?}", parsed);

    Ok(parsed)
}

// Buscar mensagens de um chat
#[tauri::command]
pub async fn get_chat_messages(app_handle: AppHandle, chat_id: i32) -> Result<GetMessagesResponse, String> {
    // [LOG] Início da função e validação da URL da API
        let url = get_api_url(&app_handle);

    // Obter o ID do usuário logado
    let user_id = match obter_usuario() {
        Some(usuario) => usuario.id,
        None => {
            let error_msg = "Usuário não logado. Não é possível buscar mensagens do chat sem um ID de usuário.";
            eprintln!("[ERRO] {}", error_msg);
            return Err(error_msg.to_string());
        }
    };

    // Alterado para enviar user_id como parte da rota, conforme a nova API
    let full_url = format!("{}/chat/{}/messages/user/{}", url, chat_id, user_id);
    println!("[LOG] Buscando mensagens do chat para ID: {}. URL: {}", chat_id, full_url);

    let client = Client::new();

    // [LOG] Tentativa de envio da requisição
    println!("[LOG] Enviando requisição GET para: {}", full_url);
    let response = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| {
            // [LOG] Erro ao enviar requisição
            let error_msg = format!("Erro ao enviar requisição para {}: {}", full_url, e);
            eprintln!("[ERRO] {}", error_msg); // Usar eprintln para erros
            error_msg
        })?;

    // [LOG] Status da resposta recebida
    println!("[LOG] Resposta recebida. Status: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        // [LOG] Erro da API com status não bem-sucedido
        let error_msg = format!("Erro da API para {}: Status {}. Resposta: {}", full_url, status_code, body_text);
        eprintln!("[ERRO] {}", error_msg);
        return Err(error_msg);
    }

    // [LOG] Tentativa de leitura do corpo da resposta
    println!("[LOG] Lendo corpo da resposta...");
    let body = response
        .text()
        .await
        .map_err(|e| {
            // [LOG] Erro ao ler corpo da resposta
            let error_msg = format!("Erro ao ler corpo da resposta de {}: {}", full_url, e);
            eprintln!("[ERRO] {}", error_msg);
            error_msg
        })?;

    // [LOG] Conteúdo completo do corpo da resposta (cuidado com dados sensíveis em produção)
    println!("[LOG] Corpo da resposta JSON (parcial, se muito longo):\n{}", &body[..std::cmp::min(body.len(), 500)]); // Loga os primeiros 500 caracteres ou menos

    // [LOG] Tentativa de decodificação JSON
    println!("[LOG] Decodificando JSON para GetMessagesResponse...");
    let parsed: GetMessagesResponse = serde_json::from_str(&body)
        .map_err(|e| {
            // [LOG] Erro ao decodificar JSON
            let error_msg = format!("Erro ao decodificar JSON da resposta de {}: {}. Conteúdo: {}", full_url, e, body);
            eprintln!("[ERRO] {}", error_msg);
            error_msg
        })?;

    // [LOG] Sucesso na operação e detalhes das mensagens encontradas
    println!("[LOG] Mensagens encontradas com sucesso para o chat ID {}. Total de mensagens: {}", chat_id, parsed.messages.len());

    Ok(parsed)
}

// Função auxiliar para criar chat entre dois usuários (mais comum)
#[tauri::command]
pub async fn create_direct_chat(current_user_id: i32, target_user_id: i32) -> Result<ChatInfo, String> {
    create_chat(vec![current_user_id, target_user_id], None, None).await
}
