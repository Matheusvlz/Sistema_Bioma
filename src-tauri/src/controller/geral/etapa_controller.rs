// Local: src-tauri/src/controller/geral/etapa_controller.rs

use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::etapa::{Etapa, EtapaPayload}; // Usando os novos models

const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Etapas da API.
#[command]
pub async fn listar_etapas() -> Result<ApiResponse<Vec<Etapa>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/etapas", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Etapa>>().await {
                    Ok(etapas) => Ok(ApiResponse::success("Etapas carregadas com sucesso".to_string(), Some(etapas))),
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

/// [POST] Cadastra uma nova Etapa via API.
#[command]
pub async fn cadastrar_etapa(etapa_data: EtapaPayload) -> Result<ApiResponse<Etapa>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/etapas", API_BASE_URL);

    match client.post(&url).json(&etapa_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Etapa>().await {
                    Ok(etapa) => Ok(ApiResponse::success("Etapa cadastrada com sucesso!".to_string(), Some(etapa))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [PUT] Edita uma Etapa existente.
#[command]
pub async fn editar_etapa(etapa_data: EtapaPayload) -> Result<ApiResponse<Etapa>, ApiResponse<()>> {
    let etapa_id = match etapa_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da etapa é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/etapas/{}", API_BASE_URL, etapa_id);

    match client.put(&url).json(&etapa_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Etapa>().await {
                    Ok(etapa) => Ok(ApiResponse::success("Etapa atualizada com sucesso!".to_string(), Some(etapa))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [DELETE] Deleta uma Etapa existente.
#[command]
pub async fn deletar_etapa(id: u8) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/etapas/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Etapa removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}