use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::grupo::{Grupo, GrupoPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todos os Grupos da API.
#[command]
pub async fn listar_grupos() -> Result<ApiResponse<Vec<Grupo>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/grupos", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Grupo>>().await {
                    Ok(grupos) => Ok(ApiResponse::success("Grupos carregados com sucesso".to_string(), Some(grupos))),
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

/// [POST] Cadastra um novo Grupo via API.
#[command]
pub async fn cadastrar_grupo(grupo_data: GrupoPayload) -> Result<ApiResponse<Grupo>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/grupos", API_BASE_URL);

    match client.post(&url).json(&grupo_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Grupo>().await {
                    Ok(grupo) => Ok(ApiResponse::success("Grupo cadastrado com sucesso!".to_string(), Some(grupo))),
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

/// [PUT] Edita um Grupo existente.
#[command]
pub async fn editar_grupo(nome_original: String, grupo_data: GrupoPayload) -> Result<ApiResponse<Grupo>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/grupos/{}", API_BASE_URL, nome_original);

    match client.put(&url).json(&grupo_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Grupo>().await {
                    Ok(grupo) => Ok(ApiResponse::success("Grupo atualizado com sucesso!".to_string(), Some(grupo))),
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

/// [DELETE] Deleta um Grupo existente.
#[command]
pub async fn deletar_grupo(nome: String) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/grupos/{}", API_BASE_URL, nome);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Grupo removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
