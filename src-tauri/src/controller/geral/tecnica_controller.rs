use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::tecnica::Tecnica;

const API_BASE_URL: &str = "http://127.0.0.1:8082";

#[command]
pub async fn listar_tecnicas() -> Result<ApiResponse<Vec<Tecnica>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/tecnicas", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Tecnica>>().await {
                    Ok(tecnicas) => Ok(ApiResponse::success("Técnicas carregadas".to_string(), Some(tecnicas))),
                    Err(e) => Err(ApiResponse::error(format!("Erro JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}
