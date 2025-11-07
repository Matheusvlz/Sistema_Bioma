// Adicione estes comandos no seu arquivo main.rs ou tauri_commands.rs

use serde::{Deserialize, Serialize};
use reqwest::Client;
use tauri::command;
use tauri::AppHandle;
use crate::config::get_api_url;

#[derive(Serialize, Deserialize, Debug)]
pub struct AmostraBloqueadaDetalhada {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub data_coleta: Option<String>,
    pub hora_coleta: Option<String>,
    pub data_lab: Option<String>,
    pub hora_lab: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
    pub usuario_bloqueio: Option<String>,
    pub bloqueio_ip: Option<String>,
    pub bloqueio_pc: Option<String>,
    pub data_bloqueio: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ListarAmostrasBloqueadasResponse {
    pub success: bool,
    pub amostras: Vec<AmostraBloqueadaDetalhada>,
    pub total: usize,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DesbloquearAmostraPayload {
    pub ids_analise: Vec<u32>,
    pub id_usuario: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct DesbloquearAmostraResponse {
    pub success: bool,
    pub total_desbloqueadas: usize,
    pub message: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HistoricoBloqueio {
    pub id: u32,
    pub usuario: Option<String>,
    pub ip: Option<String>,
    pub computador: Option<String>,
    pub data_hora: Option<String>,
    pub bloqueado: bool,
}

/// Lista amostras bloqueadas
#[command]
pub async fn listar_amostras_bloqueadas(    app_handle: AppHandle,
    grupos: Vec<String>,
    
) -> Result<ListarAmostrasBloqueadasResponse, String> {
       let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let url = format!("{}/laboratorio/amostras-bloqueadas", api_url);
    
    match client
        .post(&url)
        .json(&grupos)
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<ListarAmostrasBloqueadasResponse>().await {
                Ok(data) => Ok(data),
                Err(e) => Err(format!("Erro ao parsear resposta: {}", e))
            }
        }
        Err(e) => Err(format!("Erro na requisição: {}", e))
    }
}

/// Desbloqueia amostras selecionadas
#[command]
pub async fn desbloquear_amostras(    app_handle: AppHandle,
    payload: DesbloquearAmostraPayload
) -> Result<DesbloquearAmostraResponse, String> {
      let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let url = format!("{}/laboratorio/amostras-bloqueadas/desbloquear", api_url);
    
    match client
        .post(&url)
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<DesbloquearAmostraResponse>().await {
                Ok(data) => Ok(data),
                Err(e) => Err(format!("Erro ao parsear resposta: {}", e))
            }
        }
        Err(e) => Err(format!("Erro na requisição: {}", e))
    }
}

/// Bloqueia amostras selecionadas
#[command]
pub async fn bloquear_amostras(     app_handle: AppHandle,
    payload: DesbloquearAmostraPayload // Reutiliza o mesmo payload
) -> Result<DesbloquearAmostraResponse, String> {
      let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let url = format!("{}/laboratorio/amostras-bloqueadas/bloquear", api_url);
    
    match client
        .post(&url)
        .json(&payload)
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<DesbloquearAmostraResponse>().await {
                Ok(data) => Ok(data),
                Err(e) => Err(format!("Erro ao parsear resposta: {}", e))
            }
        }
        Err(e) => Err(format!("Erro na requisição: {}", e))
    }
}

/// Busca histórico de bloqueios
#[command]
pub async fn buscar_historico_bloqueio(     app_handle: AppHandle,
    id_analise: u32
) -> Result<Vec<HistoricoBloqueio>, String> {
       let client = Client::new();
    let api_url = get_api_url(&app_handle);
       
    
    let url = format!("{}/laboratorio/amostras-bloqueadas/{}/historico", api_url, id_analise);
    
    match client
        .get(&url)
        .send()
        .await
    {
        Ok(response) => {
            match response.json::<Vec<HistoricoBloqueio>>().await {
                Ok(data) => Ok(data),
                Err(e) => Err(format!("Erro ao parsear resposta: {}", e))
            }
        }
        Err(e) => Err(format!("Erro na requisição: {}", e))
    }
}

