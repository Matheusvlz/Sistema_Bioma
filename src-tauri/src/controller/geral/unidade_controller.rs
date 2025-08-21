use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::unidade::{Unidade, UnidadePayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Unidades da API.
#[command]
pub async fn listar_unidades() -> Result<ApiResponse<Vec<Unidade>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/unidades", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Unidade>>().await {
                    Ok(unidades) => Ok(ApiResponse::success("Unidades carregadas com sucesso".to_string(), Some(unidades))),
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

/// [POST] Cadastra uma nova Unidade via API.
#[command]
pub async fn cadastrar_unidade(unidade_data: UnidadePayload) -> Result<ApiResponse<Unidade>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/unidades", API_BASE_URL);

    match client.post(&url).json(&unidade_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Unidade>().await {
                    Ok(unidade) => Ok(ApiResponse::success("Unidade cadastrada com sucesso!".to_string(), Some(unidade))),
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

/// [PUT] Edita uma Unidade existente.
#[command]
pub async fn editar_unidade(nome_original: String, unidade_data: UnidadePayload) -> Result<ApiResponse<Unidade>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/unidades/{}", API_BASE_URL, nome_original);

    match client.put(&url).json(&unidade_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Unidade>().await {
                    Ok(unidade) => Ok(ApiResponse::success("Unidade atualizada com sucesso!".to_string(), Some(unidade))),
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

/// [DELETE] Deleta uma Unidade existente.
#[command]
pub async fn deletar_unidade(nome: String) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/unidades/{}", API_BASE_URL, nome);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Unidade removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
