use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::tipo::{Tipo, TipoPayload, AtualizacaoTipoPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todos os Tipos da API.
#[command]
pub async fn listar_tipos() -> Result<ApiResponse<Vec<Tipo>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tipos", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Tipo>>().await {
                    Ok(tipos) => Ok(ApiResponse::success("Tipos carregados com sucesso".to_string(), Some(tipos))),
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

/// [POST] Cadastra um novo Tipo via API.
#[command]
pub async fn cadastrar_tipo(tipo_data: TipoPayload) -> Result<ApiResponse<Tipo>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tipos", API_BASE_URL);

    match client.post(&url).json(&tipo_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Tipo>().await {
                    Ok(tipo) => Ok(ApiResponse::success("Tipo cadastrado com sucesso!".to_string(), Some(tipo))),
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

/// [PUT] Edita um Tipo existente.
#[command]
pub async fn editar_tipo(codigo: String, tipo_data: TipoPayload) -> Result<ApiResponse<Tipo>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tipos/{}", API_BASE_URL, codigo);

    // A API REST espera apenas o nome para atualização.
    let payload_atualizacao = AtualizacaoTipoPayload {
        NOME: tipo_data.nome,
    };

    match client.put(&url).json(&payload_atualizacao).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Tipo>().await {
                    Ok(tipo) => Ok(ApiResponse::success("Tipo atualizado com sucesso!".to_string(), Some(tipo))),
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

/// [DELETE] Deleta um Tipo existente.
#[command]
pub async fn deletar_tipo(codigo: String) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tipos/{}", API_BASE_URL, codigo);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Tipo removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
