// Local: src-tauri/src/controller/geral/tecnica_etapa_controller.rs

use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::tecnica_etapa::{TecnicaEtapaView, RelacionarEtapasPayload, ReordenarEtapasPayload};

const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca as etapas relacionadas a uma técnica específica.
#[command]
pub async fn listar_etapas_por_tecnica(tecnica_id: u8) -> Result<ApiResponse<Vec<TecnicaEtapaView>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tecnicas/{}/etapas", API_BASE_URL, tecnica_id);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<TecnicaEtapaView>>().await {
                    Ok(etapas) => Ok(ApiResponse::success(format!("Etapas da técnica {} carregadas", tecnica_id), Some(etapas))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [POST] Relaciona uma ou mais etapas a uma técnica.
#[command]
pub async fn relacionar_etapas_a_tecnica(tecnica_id: u8, payload: RelacionarEtapasPayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tecnicas/{}/etapas", API_BASE_URL, tecnica_id);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Etapas relacionadas com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [DELETE] Remove um relacionamento tecnica-etapa.
#[command]
pub async fn remover_tecnica_etapa(id: u16) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tecnica-etapa/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Relacionamento removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [PATCH] Reordena as etapas de uma técnica.
#[command]
pub async fn reordenar_etapas_da_tecnica(tecnica_id: u8, payload: ReordenarEtapasPayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tecnicas/{}/etapas/reordenar", API_BASE_URL, tecnica_id);

    match client.patch(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Etapas reordenadas com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}