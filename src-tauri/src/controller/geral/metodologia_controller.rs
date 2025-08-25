use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::metodologia::{Metodologia, MetodologiaPayload, MetodologiaApiPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Metodologias da API.
#[command]
pub async fn listar_metodologias() -> Result<ApiResponse<Vec<Metodologia>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/metodologias", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Metodologia>>().await {
                    Ok(metodologias) => Ok(ApiResponse::success("Metodologias carregadas com sucesso".to_string(), Some(metodologias))),
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

/// [POST] Cadastra uma nova Metodologia via API.
#[command]
pub async fn cadastrar_metodologia(metodologia_data: MetodologiaPayload) -> Result<ApiResponse<Metodologia>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/metodologias", API_BASE_URL);

    // Converte o payload do frontend para o formato que a API REST espera.
    let api_payload = MetodologiaApiPayload {
        NOME: metodologia_data.nome,
        ATIVO: if metodologia_data.ativo { 1 } else { 0 },
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Metodologia>().await {
                    Ok(metodologia) => Ok(ApiResponse::success("Metodologia cadastrada com sucesso!".to_string(), Some(metodologia))),
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

/// [PUT] Edita uma Metodologia existente.
#[command]
pub async fn editar_metodologia(metodologia_data: MetodologiaPayload) -> Result<ApiResponse<Metodologia>, ApiResponse<()>> {
    let metodologia_id = match metodologia_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da metodologia é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/metodologias/{}", API_BASE_URL, metodologia_id);

    let api_payload = MetodologiaApiPayload {
        NOME: metodologia_data.nome,
        ATIVO: if metodologia_data.ativo { 1 } else { 0 },
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Metodologia>().await {
                    Ok(metodologia) => Ok(ApiResponse::success("Metodologia atualizada com sucesso!".to_string(), Some(metodologia))),
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

/// [DELETE] Deleta uma Metodologia existente.
#[command]
pub async fn deletar_metodologia(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/metodologias/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Metodologia removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
