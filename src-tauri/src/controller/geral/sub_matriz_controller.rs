use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::sub_matriz::{SubMatriz, SubMatrizPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Submatrizes de uma Matriz específica.
#[command]
pub async fn listar_sub_matrizes(idmatriz: u32) -> Result<ApiResponse<Vec<SubMatriz>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/matrizes/{}/submatrizes", API_BASE_URL, idmatriz);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<SubMatriz>>().await {
                    Ok(sub_matrizes) => Ok(ApiResponse::success("Submatrizes carregadas com sucesso".to_string(), Some(sub_matrizes))),
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

/// [POST] Cadastra uma nova Submatriz via API.
#[command]
pub async fn cadastrar_sub_matriz(sub_matriz_data: SubMatrizPayload) -> Result<ApiResponse<SubMatriz>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/submatrizes", API_BASE_URL);

    match client.post(&url).json(&sub_matriz_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<SubMatriz>().await {
                    Ok(sub_matriz) => Ok(ApiResponse::success("Submatriz cadastrada com sucesso!".to_string(), Some(sub_matriz))),
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

/// [PUT] Edita uma Submatriz existente.
#[command]
pub async fn editar_sub_matriz(sub_matriz_data: SubMatrizPayload) -> Result<ApiResponse<SubMatriz>, ApiResponse<()>> {
    let id = match sub_matriz_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da submatriz é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/submatrizes/{}", API_BASE_URL, id);

    match client.put(&url).json(&sub_matriz_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<SubMatriz>().await {
                    Ok(sub_matriz) => Ok(ApiResponse::success("Submatriz atualizada com sucesso!".to_string(), Some(sub_matriz))),
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

/// [DELETE] Deleta uma Submatriz existente.
#[command]
pub async fn deletar_sub_matriz(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/submatrizes/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Submatriz removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
