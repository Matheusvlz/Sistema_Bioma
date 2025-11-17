use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use crate::config::get_api_url; // Assumindo que get_api_url foi corrigida para aceitar &AppHandle
use std::collections::HashMap;
use tauri::AppHandle; // Importação correta

// --- DTOs (Corrigidos: u32 -> u64 para IDs) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChecagemItem {
    pub id: u64, // CORRIGIDO: u32 -> u64
    pub descricao: String,
    pub valor: Option<String>,
    pub comentario: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParametroResultado {
    pub id_resultado: u64, // CORRIGIDO: u32 -> u64
    pub id_parametro_pop: u32,
    pub nome_parametro: String,
    pub grupo_parametro: Option<String>,
    pub tecnica_nome: Option<String>,
    pub unidade: Option<String>,
    pub limite: Option<String>,
    pub resultado: Option<String>,
    pub em_campo: Option<u8>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AmostraAnalise {
    pub id_amostra: u64, // CORRIGIDO: u32 -> u64
    pub numero_amostra: u32,
    pub id_analise: u64, // CORRIGIDO: u32 -> u64
    pub hora_coleta_analise: Option<String>,
    pub coletada: Option<u8>,
    pub ncoletada_motivo: Option<String>,
    pub checagens: Vec<ChecagemItem>,
    pub parametros: Vec<ParametroResultado>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GrupoChecagem {
    pub id_grupo: u64, // CORRIGIDO: u32 -> u64
    pub amostra_min: u32,
    pub amostra_max: u32,
    pub data_coleta: Option<String>,
    pub hora_coleta: Option<String>,
    pub hora_coleta_ini: Option<String>,
    pub hora_coleta_ter: Option<String>,
    pub data_lab: Option<String>,
    pub hora_lab: Option<String>,
    pub data_checagem: Option<String>,
    pub usuario_checagem: Option<String>,
    pub versao: Option<String>,
    pub numero_versao: Option<String>,
    pub form_numero: u32,
    pub form_revisao: u32,
    pub amostras_analises: Vec<AmostraAnalise>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct BuscarChecagemPayload {
    pub numero_ini: Option<u32>,
    pub numero_fim: Option<u32>,
    pub id_grupo_edit: Option<u64>, // CORRIGIDO: u32 -> u64
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalvarChecagemPayload {
    pub grupos: Vec<GrupoChecagem>,
    pub id_usuario_verificacao: u32,
}


// --- Funções de Comando Corrigidas (Mantidas inalteradas, pois dependem apenas das DTOs) ---

#[tauri::command]
pub async fn buscar_checagens_client(app_handle: AppHandle, payload: BuscarChecagemPayload) -> Result<String, String> {
    let client = Client::new();
    // Passamos a referência de `app_handle` se `get_api_url` espera `&AppHandle`
    let api_url = get_api_url(&app_handle); 
    let url = format!("{}/laboratorio/coleta-checagem/buscar", api_url);

    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao buscar checagens: {}", e))?;

    let status = response.status();
    if status.is_success() {
        let response_json: Vec<GrupoChecagem> = response.json().await.map_err(|e| {
            format!("Falha ao parsear a resposta da API: {}", e)
        })?;
        
        serde_json::to_string(&response_json)
            .map_err(|e| format!("Falha ao serializar para JSON: {}", e))
            
    } else {
        let body_text = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo da resposta".to_string());
        let erro_msg = format!("Erro do servidor (Status: {}): {}", status, body_text);
        println!("Erro da API: {}", erro_msg);
        Err(erro_msg)
    }
}

#[tauri::command]
pub async fn salvar_checagens_client(app_handle: AppHandle, payload: SalvarChecagemPayload) -> Result<String, String> {
    let client = Client::new();
    // Passamos a referência de `app_handle` se `get_api_url` espera `&AppHandle`
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/coleta-checagem/salvar", api_url);

    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao salvar checagens: {}", e))?;

    let status = response.status();
    if status.is_success() {
        Ok("Dados salvos com sucesso!".to_string())
    } else {
        let body_text = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo da resposta".to_string());
        let erro_msg = format!("Erro do servidor (Status: {}): {}", status, body_text);
        println!("Erro da API: {}", erro_msg);
        Err(erro_msg)
    }
}