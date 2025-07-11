use serde::{Deserialize, Serialize};
use reqwest::Client;
use std::env;

// Certifique-se de que estas structs estão definidas ou importe-as corretamente
// Por exemplo, em `src/model/kanban_card.rs` ou similar:

// Estrutura para os dados do cartão Kanban vindo do frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct FrontendKanbanCardData {
    pub id: Option<i32>, // ID pode ser opcional para novos cartões, mas esperado para atualizações
    pub urgencia: i32,
    #[serde(rename = "type")] // Mapeia 'type' do JS para 'card_type' no Rust
    pub card_type: String,
    pub title: String,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub user_photo_url: Option<String>,
    pub tags: Option<String>, // Espera-se uma string JSON
    pub card_color: Option<String>,
}

// Estrutura para o payload enviado à API de backend (sem ID, pois irá na URL)
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKanbanPayload {
    pub urgencia: i32,
    #[serde(rename = "card_type")]
    pub card_type: String,
    pub title: String,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub user_photo_url: Option<String>,
    pub tags: Option<String>,
    pub card_color: Option<String>,
}



// Estrutura para atualização de urgência e índice do cartão
#[derive(Debug, Serialize, Deserialize)]
pub struct KanbanCardUrgencyAndIndexUpdate {
    pub id: i32,
    pub new_urgencia: i32
}

#[tauri::command]
pub async fn salvar_ticket(card_data: FrontendKanbanCardData) -> Result<(), String> {
    println!("Dados recebidos do frontend no Tauri (salvar_ticket): {:?}", card_data);

    let api_payload = ApiKanbanPayload {
        urgencia: card_data.urgencia,
        card_type: card_data.card_type,
        title: card_data.title,
        description: card_data.description,
        user_id: card_data.user_id,
        user_photo_url: card_data.user_photo_url,
        tags: card_data.tags,
        card_color: card_data.card_color,
    };

    let api_url = env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:8082".to_string());
    let endpoint = format!("{}/cadastrar/ticket", api_url);

    println!("Enviando requisição POST para: {}", endpoint);
    println!("Payload da requisição: {:?}", api_payload);

    let client = Client::new();
    let response = client.post(&endpoint)
        .json(&api_payload)
        .send()
        .await;

    match response {
        Ok(res) if res.status().is_success() => {
            println!("Ticket salvo com sucesso via API Axum. Status: {}", res.status());
            Ok(())
        }
        Ok(res) => {
            let status = res.status();
            let error_text = res.text().await.unwrap_or_else(|_| "Erro desconhecido".to_string());
            eprintln!("Erro da API Axum: Status: {}, Mensagem: {}", status, error_text);
            Err(format!("Erro da API: {}", error_text))
        }
        Err(e) => {
            eprintln!("Erro ao fazer requisição para a API Axum: {:?}", e);
            Err(format!("Falha na comunicação com o servidor: {}", e))
        }
    }
}

#[tauri::command]
pub async fn update_kanban(card_data: FrontendKanbanCardData) -> Result<(), String> {
    println!("Dados recebidos do frontend no Tauri (update_kanban): {:?}", card_data);

    let card_id = card_data.id.ok_or_else(|| "ID do cartão é necessário para atualização".to_string())?;

    // O payload para a API de atualização (sem o ID, que irá na URL)
    let api_payload = ApiKanbanPayload {
        urgencia: card_data.urgencia,
        card_type: card_data.card_type,
        title: card_data.title,
        description: card_data.description,
        user_id: card_data.user_id,
        user_photo_url: card_data.user_photo_url,
        tags: card_data.tags,
        card_color: card_data.card_color,
    };

    let api_url = env::var("API_URL")
        .unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());
    let endpoint = format!("{}/atualizar/ticket/{}", api_url, card_id); // Endpoint PUT com ID na URL

    println!("Enviando requisição PUT para: {}", endpoint);
    println!("Payload da requisição: {:?}", api_payload);

    let client = Client::new();
    let response = client.put(&endpoint) // Requisição PUT
        .json(&api_payload)
        .send()
        .await;

    match response {
        Ok(res) if res.status().is_success() => {
            println!("Ticket atualizado com sucesso via API Axum. Status: {}", res.status());
            Ok(())
        }
        Ok(res) => {
            let status = res.status();
            let error_text = res.text().await.unwrap_or_else(|_| "Erro desconhecido".to_string());
            eprintln!("Erro da API Axum na atualização: Status: {}, Mensagem: {}", status, error_text);
            Err(format!("Erro da API: {}", error_text))
        }
        Err(e) => {
            eprintln!("Erro ao fazer requisição PUT para a API Axum: {:?}", e);
            Err(format!("Falha na comunicação com o servidor: {}", e))
        }
    }
}
// Novo método para atualizar urgência e índice do cartão (quando movido entre painéis)
#[tauri::command]
pub async fn update_kanban_card_urgency_and_index(update_data: KanbanCardUrgencyAndIndexUpdate) -> Result<(), String> {
    println!("Atualizando urgência e índice do cartão Kanban: {:?}", update_data);

    let api_url = env::var("API_URL")
        .unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());
    let endpoint = format!("{}/kanban/card/{}/update-urgency-and-index", api_url, update_data.id);

    let payload = serde_json::json!({
        "new_urgencia": update_data.new_urgencia,
        "id": update_data.id
    });

    println!("Enviando requisição PATCH para: {}", endpoint);
    println!("Payload da requisição: {:?}", payload);

    let client = Client::new();
    let response = client.patch(&endpoint)
        .json(&payload)
        .send()
        .await;

    match response {
        Ok(res) if res.status().is_success() => {
            println!("Urgência e índice do cartão atualizados com sucesso. Status: {}", res.status());
            Ok(())
        }
        Ok(res) => {
            let status = res.status();
            let error_text = res.text().await.unwrap_or_else(|_| "Erro desconhecido".to_string());
            eprintln!("Erro da API ao atualizar urgência e índice: Status: {}, Mensagem: {}", status, error_text);
            Err(format!("Erro da API: {}", error_text))
        }
        Err(e) => {
            eprintln!("Erro ao fazer requisição PATCH para a API: {:?}", e);
            Err(format!("Falha na comunicação com o servidor: {}", e))
        }
    }
}