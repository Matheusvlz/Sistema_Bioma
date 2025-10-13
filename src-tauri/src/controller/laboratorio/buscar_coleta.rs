use tauri::{AppHandle, Manager};
use reqwest::Client;
use serde_json::json;
use crate::{
    config
};

use serde::{Serialize, Deserialize};
use chrono::NaiveTime;

// --- ESTRUTURA DE ERRO CORRIGIDA para resolver o Warning do Rust 2024 ---
// A struct de erro deve ser serializável e desserializável (Serialize + Deserialize).
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CommandError {
    pub message: String,
}

// Implementa From para conversão simples de String para CommandError
impl From<String> for CommandError {
    fn from(message: String) -> Self {
        CommandError { message }
    }
}

// Implementa From para conversão de reqwest::Error
impl From<reqwest::Error> for CommandError {
    fn from(error: reqwest::Error) -> Self {
        CommandError { message: format!("Erro de Requisição: {}", error) }
    }
}


// --- Structs de Dados (Inalteradas, mas completas para contexto) ---
#[derive(Debug, Serialize)]
pub struct ClientRequest {
    pub client_id: u32, // Alterado para u32 para consistência com cliente_id da função
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ColetaAmostra {
    pub id: u32,
    pub numero: Option<u32>, 
    pub hora_coleta: Option<NaiveTime>, 
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub identificacao_frasco: Option<String>,
    pub condicoes_amb: Option<String>,
    pub ph: Option<String>,
    pub cloro: Option<String>,
    pub temperatura: Option<String>,
    pub solido_dissolvido_total: Option<String>,
    pub condutividade: Option<String>,
    pub oxigenio_dissolvido: Option<String>,
    pub idusuario: Option<u32>, // Tipo ajustado para u32 (mais comum em IDs)
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ColetaComAmostras {
    pub id: u32,
    pub numero: Option<u32>, 
    pub ano: Option<String>, 
    pub amostras: Vec<ColetaAmostra>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ColetasResponse {
    pub coletas: Vec<ColetaComAmostras>,
}


// --- FUNÇÃO TAURI COMMAND CORRIGIDA ---
#[tauri::command]
pub async fn buscar_coletas_e_amostras_client_command(
    app_handle: AppHandle,  // <--- CORRIGIDO: Removido o '&'
    cliente_id: u32,        // <--- CORRIGIDO: Argumento anterior agora termina com ','
) -> Result<ColetasResponse, CommandError> { // <--- CORRIGIDO: Retorno usando CommandError
    
    let api_url = config::get_api_url(&app_handle);
    let client = Client::new();

    // 1. Constrói o payload JSON
    let payload = json!({
        "client_id": cliente_id
    });
    
    // 2. Faz a requisição POST para o endpoint
    let response = client
        .post(format!("{}/api/coletas/cliente", api_url))
        .json(&payload)
        .send()
        .await
        .map_err(CommandError::from)?; // Usa a conversão From<reqwest::Error>

    // 3. Verifica o status e desserializa a resposta
    if response.status().is_success() {
        // Retorna a struct completa ColetasResponse
        response.json::<ColetasResponse>()
            .await
            .map_err(|e| CommandError::from(format!("Erro ao desserializar a resposta da API: {}", e)))
    } else {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Corpo de erro ilegível".to_string());
        Err(CommandError::from(format!( // Usa a conversão From<String>
            "Erro da API ao buscar coletas e amostras (POST): {} - {}",
            status,
            error_body
        )))
    }
}