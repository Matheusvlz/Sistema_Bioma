use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::forma_contato::{FormaContato, FormaContatoPayload, FormaContatoApiPayload};

const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todas as Formas de Contato da API.
#[command]
pub async fn listar_formas_contato() -> Result<ApiResponse<Vec<FormaContato>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/formas-contato", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<FormaContato>>().await {
                    Ok(formas) => Ok(ApiResponse::success("Formas de contato carregadas com sucesso".to_string(), Some(formas))),
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

/// [POST] Cadastra uma nova Forma de Contato via API.
#[command]
pub async fn cadastrar_forma_contato(forma_data: FormaContatoPayload) -> Result<ApiResponse<FormaContato>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/formas-contato", API_BASE_URL);

    // Converte o payload do frontend para o formato que a API REST espera.
    let api_payload = FormaContatoApiPayload {
        NOME: forma_data.nome,
    };

    // --- O NOSSO "ESPIÃO" ---
    println!("[TAURI CADASTRO] Enviando para a API: {:?}", serde_json::to_string(&api_payload).unwrap_or_default());
    // -------------------------

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<FormaContato>().await {
                    Ok(forma) => Ok(ApiResponse::success("Forma de contato cadastrada com sucesso!".to_string(), Some(forma))),
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

/// [PUT] Edita uma Forma de Contato existente.
#[command]
pub async fn editar_forma_contato(forma_data: FormaContatoPayload) -> Result<ApiResponse<FormaContato>, ApiResponse<()>> {
    let id = match forma_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da forma de contato é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/formas-contato/{}", API_BASE_URL, id);

    let api_payload = FormaContatoApiPayload {
        NOME: forma_data.nome,
    };

    // --- O NOSSO "ESPIÃO" ---
    println!("[TAURI EDIÇÃO] Enviando para a API: {:?}", serde_json::to_string(&api_payload).unwrap_or_default());
    // -------------------------

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<FormaContato>().await {
                    Ok(forma) => Ok(ApiResponse::success("Forma de contato atualizada com sucesso!".to_string(), Some(forma))),
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

/// [DELETE] Deleta uma Forma de Contato existente.
#[command]
pub async fn deletar_forma_contato(id: u8) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/formas-contato/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Forma de contato removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
