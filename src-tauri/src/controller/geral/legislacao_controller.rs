use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::legislacao::{Legislacao, LegislacaoPayload, LegislacaoApiPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Legislações da API.
#[command]
pub async fn listar_legislacoes() -> Result<ApiResponse<Vec<Legislacao>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/legislacoes", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Legislacao>>().await {
                    Ok(legislacoes) => Ok(ApiResponse::success("Legislações carregadas com sucesso".to_string(), Some(legislacoes))),
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

/// [POST] Cadastra uma nova Legislação via API.
#[command]
pub async fn cadastrar_legislacao(legislacao_data: LegislacaoPayload) -> Result<ApiResponse<Legislacao>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/legislacoes", API_BASE_URL);

    // Converte o payload do frontend para o formato que a API REST espera.
    let api_payload = LegislacaoApiPayload {
        nome: legislacao_data.nome,
        COMPLEMENTO: legislacao_data.complemento,
        ATIVO: if legislacao_data.ativo { 1 } else { 0 },
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Legislacao>().await {
                    Ok(legislacao) => Ok(ApiResponse::success("Legislação cadastrada com sucesso!".to_string(), Some(legislacao))),
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

/// [PUT] Edita uma Legislação existente.
#[command]
pub async fn editar_legislacao(legislacao_data: LegislacaoPayload) -> Result<ApiResponse<Legislacao>, ApiResponse<()>> {
    let id = match legislacao_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da legislação é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/legislacoes/{}", API_BASE_URL, id);

    let api_payload = LegislacaoApiPayload {
        nome: legislacao_data.nome,
        COMPLEMENTO: legislacao_data.complemento,
        ATIVO: if legislacao_data.ativo { 1 } else { 0 },
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Legislacao>().await {
                    Ok(legislacao) => Ok(ApiResponse::success("Legislação atualizada com sucesso!".to_string(), Some(legislacao))),
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

/// [DELETE] Deleta uma Legislação existente.
#[command]
pub async fn deletar_legislacao(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/legislacoes/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Legislação removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
