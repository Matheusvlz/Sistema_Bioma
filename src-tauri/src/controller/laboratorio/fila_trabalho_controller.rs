use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::config::get_api_url;
use crate::model::fila_trabalho::{PaginatedFilaResponse, IniciarAnalisePayload}; // Import atualizado

#[command]
pub async fn listar_fila_trabalho_tauri(
    app_handle: AppHandle,
    status: String,
    id_laboratorio: Option<u32>, // NOVO
    page: Option<u32>,           // NOVO
    per_page: Option<u32>        // NOVO
) -> Result<ApiResponse<PaginatedFilaResponse>, ApiResponse<()>> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    // Monta Query String
    let mut url = format!("{}/laboratorio/fila-trabalho?status={}", api_url, status);
    
    if let Some(id_lab) = id_laboratorio {
        url.push_str(&format!("&id_laboratorio={}", id_lab));
    }
    
    // Paginação
    let p = page.unwrap_or(1);
    let pp = per_page.unwrap_or(50);
    url.push_str(&format!("&page={}&per_page={}", p, pp));

    match client.get(&url).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<PaginatedFilaResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro JSON: {}", e))),
                }
            } else {
                let msg = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("Erro API ({}): {}", status, msg)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Falha conexão: {}", e))),
    }
}

// ... (iniciar_analises_tauri continua igual)
#[command]
pub async fn iniciar_analises_tauri(
    app_handle: AppHandle,
    payload: IniciarAnalisePayload
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/fila-trabalho/iniciar", api_url);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                Ok(ApiResponse::success("Iniciado com sucesso!".to_string(), None))
            } else {
                let msg = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("Erro ao iniciar ({}): {}", status, msg)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}