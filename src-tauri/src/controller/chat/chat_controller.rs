use serde::{Serialize, Deserialize};
use reqwest::Client; // Importação necessária para uso do reqwest
use crate::model::usuarios_todos::Usuario;


#[derive(Serialize, Deserialize, Debug)] // Add Deserialize here
pub struct ChatResponse {
    pub usuarios: Vec<Usuario>,
}
#[tauri::command]
pub async fn get_users() -> Result<ChatResponse, String> {
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
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
