use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::pop::{Pop, PopPayload, NovoPopApiPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todos os POPs da API.
#[command]
pub async fn listar_pops() -> Result<ApiResponse<Vec<Pop>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/pops", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Pop>>().await {
                    Ok(pops) => Ok(ApiResponse::success("POPs carregados com sucesso".to_string(), Some(pops))),
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

/// [POST] Cadastra um novo POP via API.
#[command]
pub async fn cadastrar_pop(pop_data: PopPayload) -> Result<ApiResponse<Pop>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/pops", API_BASE_URL);

    // Converte o payload do frontend para o formato que a API REST espera.
    let api_payload = NovoPopApiPayload {
        codigo: pop_data.codigo,
        numero: pop_data.numero,
        revisao: pop_data.revisao,
        tecnica: pop_data.tecnica,
        IDTECNICA: pop_data.IDTECNICA,
        obs: pop_data.obs,
        ESTADO: if pop_data.ESTADO { 1 } else { 0 },
        OBJETIVO: pop_data.OBJETIVO,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Pop>().await {
                    Ok(pop) => Ok(ApiResponse::success("POP cadastrado com sucesso!".to_string(), Some(pop))),
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

/// [PUT] Edita um POP existente.
#[command]
pub async fn editar_pop(pop_data: PopPayload) -> Result<ApiResponse<Pop>, ApiResponse<()>> {
    let pop_id = match pop_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID do POP é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/pops/{}", API_BASE_URL, pop_id);

    let api_payload = NovoPopApiPayload {
        codigo: pop_data.codigo,
        numero: pop_data.numero,
        revisao: pop_data.revisao,
        tecnica: pop_data.tecnica,
        IDTECNICA: pop_data.IDTECNICA,
        obs: pop_data.obs,
        ESTADO: if pop_data.ESTADO { 1 } else { 0 },
        OBJETIVO: pop_data.OBJETIVO,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Pop>().await {
                    Ok(pop) => Ok(ApiResponse::success("POP atualizado com sucesso!".to_string(), Some(pop))),
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

/// [DELETE] Deleta um POP existente.
#[command]
pub async fn deletar_pop(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/pops/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("POP removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
