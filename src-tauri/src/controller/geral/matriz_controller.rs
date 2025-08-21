use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::matriz::{Matriz, MatrizPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Matrizes da API.
#[command]
pub async fn listar_matrizes() -> Result<ApiResponse<Vec<Matriz>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/matrizes", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Matriz>>().await {
                    Ok(matrizes) => Ok(ApiResponse::success("Matrizes carregadas com sucesso".to_string(), Some(matrizes))),
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

/// [POST] Cadastra uma nova Matriz via API.
#[command]
pub async fn cadastrar_matriz(matriz_data: MatrizPayload) -> Result<ApiResponse<Matriz>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/matrizes", API_BASE_URL);

    match client.post(&url).json(&matriz_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Matriz>().await {
                    Ok(matriz) => Ok(ApiResponse::success("Matriz cadastrada com sucesso!".to_string(), Some(matriz))),
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

/// [PUT] Edita uma Matriz existente.
#[command]
pub async fn editar_matriz(matriz_data: MatrizPayload) -> Result<ApiResponse<Matriz>, ApiResponse<()>> {
    let matriz_id = match matriz_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da matriz é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/matrizes/{}", API_BASE_URL, matriz_id);

    match client.put(&url).json(&matriz_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Matriz>().await {
                    Ok(matriz) => Ok(ApiResponse::success("Matriz atualizada com sucesso!".to_string(), Some(matriz))),
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

/// [DELETE] Deleta uma Matriz existente.
#[command]
pub async fn deletar_matriz(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/matrizes/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Matriz removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
