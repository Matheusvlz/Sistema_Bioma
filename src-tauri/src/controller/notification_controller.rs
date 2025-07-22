// src/controller/notification_controller.rs

use serde::{Serialize, Deserialize};
use tauri::command;
use reqwest::Client;
use crate::model::usuario::obter_usuario;

use crate::model::kanban_card::{FrontendKanbanCardData, DbKanbanCardData}; // These are your DB-mapping structs
use crate::model::notification_task::NotificationTask; // Corrected path for NotificationTask

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetInicioDataPayload {
    pub user_id: u32,
}

// Full API Response Structure (e.g., from /get/inicio-data)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiInicioResponse {
    pub pending_notifications: Vec<ApiNotification>,
    pub kanban_cards: Vec<ApiKanbanCard>,
    pub pending_messages: Option<u32>
}

// Structure for notifications returned by your API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiNotification {
    pub id: Option<i64>,
    #[serde(rename = "nome")]
    pub name: String, // Frontend expects 'name', API returns 'nome'
    pub descricao: String,
    pub icon: String,
    #[serde(rename = "notification_type")] // Corrected: API sends "notification_type" not "type"
    pub notification_type: String,
    pub finalizado: bool,
    #[serde(rename = "user_id")]
    pub user_id: u32,
    pub created_at: Option<String>,
}

// Structure for Kanban Cards returned by your API
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKanbanCard {
    pub id: i32,
    pub urgencia: i16, // Standardized to i16
    #[serde(rename = "card_type", skip_serializing_if = "Option::is_none")] // Make card_type optional and skip if none
    pub card_type: Option<String>, // Changed to Option<String>
    pub title: String,
    pub description: Option<String>,
    #[serde(rename = "user_id")]
    pub user_id: Option<i32>,
    #[serde(rename = "user_photo_url")]
    pub user_photo_url: Option<String>,
    pub tags: String,
    #[serde(rename = "card_color")]
    pub card_color: Option<String>,
}

#[derive(Serialize, Deserialize)]
struct FinalizeCardPayload {
    card_id: i32, // Or whatever type your card ID is (e.g., u32, i64)
}
// MODIFIED FUNCTION: get_inicio_data_from_api to fetch both notifications and kanban cards via API
#[tauri::command]
pub async fn get_inicio_data_from_api() -> Result<ApiInicioResponse, String> {
    let usuario = obter_usuario().ok_or("Usuário não autenticado")?;
    println!("[Backend] Usuário autenticado para buscar dados iniciais: {:?}", usuario.id);

    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());
    let full_url = format!("{}/get/notifications", api_url); // Make sure this matches your API route
    println!("[Backend] Enviando requisição para a API: {}", full_url);

    let client = Client::new();
    let payload = GetInicioDataPayload { user_id: usuario.id };

    let response = client
        .post(&full_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição HTTP para API de dados iniciais: {}", e))?;

    println!("[Backend] Status da resposta da API de dados iniciais: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API de dados iniciais: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta da API de dados iniciais: {}", e))?;

    println!("[Backend] Corpo da resposta da API de dados iniciais:\n{}", body);

    serde_json::from_str::<ApiInicioResponse>(&body)
        .map_err(|e| format!("Erro ao decodificar JSON da API de dados iniciais: {}. Corpo: {}", e, body))
}

#[tauri::command] 
pub async fn finalizar_notificacao() -> Result<(), String> {
    // Obtém o usuário autenticado. Retorna um erro se não houver usuário.
    let usuario = obter_usuario().ok_or("Usuário não autenticado")?;
    println!("[Backend] Usuário autenticado para limpar notificações: {:?}", usuario.id);

    // Obtém a URL da API do ambiente ou usa um valor padrão.
    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());
    // Constrói a URL completa para a rota de marcação de notificação como lida.
    let full_url = format!("{}/mark/notification/read", api_url);
    println!("[Backend] Enviando requisição para a API: {}", full_url);

    // Cria um novo cliente HTTP.
    let client = Client::new();
    // Prepara o payload com o ID do usuário.
    let payload = GetInicioDataPayload { user_id: usuario.id };

    // Envia a requisição POST com o payload JSON.
    let response = client
        .post(&full_url)
        .json(&payload)
        .send()
        .await
        // Mapeia erros de envio HTTP para uma String de erro.
        .map_err(|e| format!("Erro ao enviar requisição HTTP para API de limpar notificações: {}", e))?;

    println!("[Backend] Status da resposta da API de limpar notificações: {}", response.status());

    // Verifica se o status da resposta indica sucesso.
    if !response.status().is_success() {
        let status_code = response.status();
        // Tenta ler o corpo da resposta em caso de erro para depuração.
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        // Retorna um erro com o status e o corpo da resposta.
        return Err(format!("Erro da API de limpar notificações: Status {}. Resposta: {}", status_code, body_text));
    }

    // Se a requisição foi bem-sucedida, não precisamos processar o corpo da resposta.
    // Apenas imprimimos para fins de depuração.
    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta da API de limpar notificações: {}", e))?;

    println!("[Backend] Corpo da resposta (não processado): {}", body);

    // Retorna Ok(()) indicando sucesso, sem nenhum valor.
    Ok(())
}

#[tauri::command]
pub async fn mark_kanban_card_as_completed(card_id: i32) -> Result<String, String> {
    // Get the API URL from environment variables
    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());

    let client = Client::new();
    let payload = FinalizeCardPayload { card_id };

    let url = format!("{}/kanban/finalize_card", api_url); // Adjust this endpoint as needed

    println!("Attempting to finalize card_id: {} at URL: {}", card_id, url);

    match client.post(&url)
        .json(&payload)
        .send()
        .await {
        Ok(response) => {
            if response.status().is_success() {
                let response_text = response.text().await.map_err(|e| e.to_string())?;
                println!("API response for card {}: {}", card_id, response_text);
                Ok(format!("Task {} finalized successfully!", card_id))
            } else {
                let status = response.status();
                let error_text = response.text().await.unwrap_or_else(|_| "No response body".to_string());
                eprintln!("Failed to finalize task {}. Status: {}. Response: {}", card_id, status, error_text);
                Err(format!("Failed to finalize task {}. Status: {}. Details: {}", card_id, status, error_text))
            }
        },
        Err(e) => {
            eprintln!("Request to finalize task {} failed: {}", card_id, e);
            Err(format!("Failed to send request to finalize task {}: {}", card_id, e))
        }
    }
}
