use tauri::command;
use serde::{Deserialize, Serialize};
use reqwest::Client;

// Import common structs
use crate::model::common::{
    RespostaTela,
    PayloadInicio,
    PayloadInicio2,
};

// Import specific response structs for each screen
use crate::model::coleta::ColetaResponse;
use crate::model::atendimento::AtendimentoItem;
use crate::model::microbiologia::MicrobiologiaResponse;
use crate::model::fisico_quimico::FisicoQuimicoResponse;
use crate::model::financeiro::FinanceiroResponse;
// Adicione o import para o X9Response
use crate::model::x9::X9Response; // <-- ASSUMA ESTE CAMINHO, AJUSTE SE NECESSÁRIO!

// Import your user model (assuming it's in `src/model/usuario.rs`)
use crate::model::usuario::obter_usuario;

// --- AllResponseData Enum ---
// This enum will reside here as it combines types from multiple models
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AllResponseData {
    Coleta(ColetaResponse),
    Atendimento(Vec<AtendimentoItem>),
    Microbiologia(MicrobiologiaResponse),
    FisicoQuimico(FisicoQuimicoResponse),
    Financeiro(FinanceiroResponse),
    X9(X9Response), // <-- ADICIONADO: Novo variant para os dados do X9
    Message(String),
}

#[command]
pub async fn get_data_inicio() -> Result<RespostaTela<AllResponseData>, String> {
    let usuario = obter_usuario().ok_or("Usuário não autenticado")?;
    println!("[LOG] Usuário autenticado: {:?}", usuario);

    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/get/inicio", url);
    println!("[LOG] Enviando requisição para: {}", full_url);

    let client = Client::new();
    let response = client
        .post(&full_url)
        .json(&PayloadInicio { user_id: usuario.id })
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

    let parsed: RespostaTela<AllResponseData> =
        serde_json::from_str(&body).map_err(|e| format!("Erro ao decodificar JSON: {}", e))?;

    println!("[LOG] Resposta decodificada com sucesso: {:?}", parsed);

    Ok(parsed)
}

/// Tauri command to fetch data for a specific screen from the Axum API.
#[command]
pub async fn get_data_for_screen(screen_name: String) -> Result<RespostaTela<AllResponseData>, String> {
    let usuario = obter_usuario().ok_or("Usuário não autenticado")?;
    println!("[LOG] Usuário autenticado: {:?}", usuario);

    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/get/tela", url);
    println!("[LOG] Enviando requisição para: {}", full_url);

    let client = Client::new();
    let response = client
        .post(&full_url)
        .json(&PayloadInicio2 { user_id: usuario.id, tela: screen_name.clone() })
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição para /get/tela: {}", e))?;

    println!("[LOG] Status da resposta de /get/tela: {}", response.status());

    if !response.status().is_success() {
        let status_code = response.status();
        let body_text = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API em /get/tela: Status {}. Resposta: {}", status_code, body_text));
    }

    let body = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler corpo da resposta de /get/tela: {}", e))?;

    println!("[LOG] Corpo da resposta de /get/tela:\n{}", body);

    let parsed: RespostaTela<AllResponseData> =
        serde_json::from_str(&body).map_err(|e| format!("Erro ao decodificar JSON de /get/tela: {}", e))?;

    println!("[LOG] Resposta decodificada com sucesso de /get/tela: {:?}", parsed);

    Ok(parsed)
}