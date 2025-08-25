use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::identificacao::{Identificacao, IdentificacaoPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Identificações da API.
#[command]
pub async fn listar_identificacoes() -> Result<ApiResponse<Vec<Identificacao>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/identificacoes", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Identificacao>>().await {
                    Ok(identificacoes) => Ok(ApiResponse::success("Identificações carregadas com sucesso".to_string(), Some(identificacoes))),
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

/// [POST] Cadastra uma nova Identificação via API.
#[command]
pub async fn cadastrar_identificacao(identificacao_data: IdentificacaoPayload) -> Result<ApiResponse<Identificacao>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/identificacoes", API_BASE_URL);

    match client.post(&url).json(&identificacao_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Identificacao>().await {
                    Ok(identificacao) => Ok(ApiResponse::success("Identificação cadastrada com sucesso!".to_string(), Some(identificacao))),
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

/// [PUT] Edita uma Identificação existente.
#[command]
pub async fn editar_identificacao(identificacao_data: IdentificacaoPayload) -> Result<ApiResponse<Identificacao>, ApiResponse<()>> {
    let id = match identificacao_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da identificação é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/identificacoes/{}", API_BASE_URL, id);

    match client.put(&url).json(&identificacao_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Identificacao>().await {
                    Ok(identificacao) => Ok(ApiResponse::success("Identificação atualizada com sucesso!".to_string(), Some(identificacao))),
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

/// [DELETE] Deleta uma Identificação existente.
#[command]
pub async fn deletar_identificacao(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/identificacoes/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Identificação removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
