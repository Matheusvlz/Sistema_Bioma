use tauri::command;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::model::usuario::obter_usuario; 


#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelaPermitida {
    pub id: i32,
    pub nome: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")] 
pub struct RespostaTela<T> {
    pub telas: Vec<TelaPermitida>,
    pub dados: T,
    #[serde(rename = "firstScreenName")] 
    pub first_screen_name: Option<String>,
}

// --- Structs for Coleta data (as previously defined) ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgendamentoComCliente {
    pub descricao: Option<String>,
    pub data: Option<String>, // Assuming this comes as a string from DB/API
    pub hora: Option<String>, // Assuming this comes as a string from DB/API
    pub recibo_gerado: Option<bool>,
    pub recibo_assinado: Option<bool>,
    pub cliente_nome: Option<String>,
    pub cliente_cod: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColetaResponse {
    pub total_agendamentos: i64,
    pub total_recibos_gerados: i64,
    pub agendamentos: Vec<AgendamentoComCliente>,
}

// --- Structs for Atendimento data (as previously defined) ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtendimentoItem {
    pub id: u32,
    pub numero: Option<u32>,
    pub prefixo: Option<String>,
    pub data_coleta: Option<String>, // Assuming string format
    pub cliente: Option<String>,
}

// --- NEW Structs for Microbiologia data (matching `case_micro_biologia_controller.rs`) ---
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicrobiologiaPendenteItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub tempo: Option<String>, // Formatted date string "dd/mm/YYYY HH:MM"
    pub passou: bool,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicrobiologiaLiberacaoPendenteItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

// In your `main.rs` or `commands.rs` file where these structs are defined:

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicrobiologiaResponse {
    // REMOVE #[serde(rename = "pendenciasPrazo")]
    pub pendencias_prazo: Vec<MicrobiologiaPendenteItem>,
    // REMOVE #[serde(rename = "totalPendenciasPrazo")]
    pub total_pendencias_prazo: i64,
    // REMOVE #[serde(rename = "pendenciasLiberacao")]
    pub pendencias_liberacao: Vec<MicrobiologiaLiberacaoPendenteItem>,
    // REMOVE #[serde(rename = "totalPendenciasLiberacao")]
    pub total_pendencias_liberacao: i64,
}

// --- AllResponseData Enum (UPDATED to include Microbiologia) ---
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum AllResponseData {
    Coleta(ColetaResponse),
    Atendimento(Vec<AtendimentoItem>),
    Microbiologia(MicrobiologiaResponse), // ADDED THIS VARIANT
    Message(String),
}

// --- Payloads for sending data to the Axum API ---
#[derive(Serialize)]
struct PayloadInicio {
    user_id: u32,
}

#[derive(Deserialize, Serialize)] // Needs both for sending and receiving (if applicable)
pub struct PayloadInicio2 {
    user_id: u32,
    tela: String, // tela enviada no JSON
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

    // Attempt to deserialize the JSON response
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
    let full_url = format!("{}/get/tela", url); // Ensure this matches your Axum route
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

    // Attempt to deserialize the JSON response
    let parsed: RespostaTela<AllResponseData> =
        serde_json::from_str(&body).map_err(|e| format!("Erro ao decodificar JSON de /get/tela: {}", e))?;

    println!("[LOG] Resposta decodificada com sucesso de /get/tela: {:?}", parsed);

    Ok(parsed)
}