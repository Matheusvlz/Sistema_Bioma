use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::observacao::{Observacao, ObservacaoPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Observações da API.
#[command]
pub async fn listar_observacoes() -> Result<ApiResponse<Vec<Observacao>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/observacoes", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Observacao>>().await {
                    Ok(observacoes) => Ok(ApiResponse::success("Observações carregadas com sucesso".to_string(), Some(observacoes))),
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

/// [POST] Cadastra uma nova Observação via API.
#[command]
pub async fn cadastrar_observacao(obs_data: ObservacaoPayload) -> Result<ApiResponse<Observacao>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/observacoes", API_BASE_URL);

    match client.post(&url).json(&obs_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Observacao>().await {
                    Ok(obs) => Ok(ApiResponse::success("Observação cadastrada com sucesso!".to_string(), Some(obs))),
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

/// [PUT] Edita uma Observação existente.
#[command]
pub async fn editar_observacao(nome_original: String, obs_data: ObservacaoPayload) -> Result<ApiResponse<Observacao>, ApiResponse<()>> {
    let client = Client::new();
    // A URL precisa ser codificada para lidar com caracteres especiais como '/'
    let encoded_nome = urlencoding::encode(&nome_original);
    let url = format!("{}/observacoes/{}", API_BASE_URL, encoded_nome);

    match client.put(&url).json(&obs_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Observacao>().await {
                    Ok(obs) => Ok(ApiResponse::success("Observação atualizada com sucesso!".to_string(), Some(obs))),
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

/// [DELETE] Deleta uma Observação existente.
#[command]
pub async fn deletar_observacao(nome: String) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let encoded_nome = urlencoding::encode(&nome);
    let url = format!("{}/observacoes/{}", API_BASE_URL, encoded_nome);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Observação removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
