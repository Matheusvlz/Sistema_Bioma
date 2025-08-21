use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::pg::{PG, NovaVersaoPGPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca o PG de coleta ativo da API.
#[command]
pub async fn buscar_pg_ativo() -> Result<ApiResponse<Option<PG>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/pg-coleta/ativo", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Option<PG>>().await {
                    Ok(pg) => Ok(ApiResponse::success("PG ativo carregado".to_string(), Some(pg))),
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

/// [POST] Cria uma nova versão do PG de coleta via API.
#[command]
pub async fn criar_nova_versao_pg(pg_data: NovaVersaoPGPayload) -> Result<ApiResponse<PG>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/pg-coleta/nova-versao", API_BASE_URL);

    match client.post(&url).json(&pg_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<PG>().await {
                    Ok(pg) => Ok(ApiResponse::success("Nova versão do PG cadastrada com sucesso!".to_string(), Some(pg))),
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
