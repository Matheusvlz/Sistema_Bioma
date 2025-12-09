use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::config::get_api_url;
// Certifique-se que este caminho reflete onde você salvou o arquivo de model
use crate::model::mapa_resultado::{MapaResponse, SalvarMapaPayload};

#[command]
pub async fn carregar_mapa_tauri(
    app_handle: AppHandle,
    id_parametro: u32,
    id_amostra: Option<u32>
) -> Result<ApiResponse<MapaResponse>, ApiResponse<()>> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let mut url = format!("{}/laboratorio/mapa-resultado?id_parametro={}", api_url, id_parametro);
    
    if let Some(id) = id_amostra {
        url.push_str(&format!("&id_amostra={}", id));
    }

    match client.get(&url).send().await {
        Ok(response) => {
            // CORREÇÃO CRÍTICA AQUI:
            let status = response.status(); // Guardamos o status antes de consumir o corpo
            
            if status.is_success() {
                match response.json::<MapaResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Mapa carregado.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro JSON Mapa: {}", e))),
                }
            } else {
                let msg = response.text().await.unwrap_or_default();
                // Agora usamos a variável 'status' capturada antes
                Err(ApiResponse::error(format!("Erro API ({}): {}", status, msg)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Falha de conexão: {}", e))),
    }
}

#[command]
pub async fn salvar_mapa_tauri(
    app_handle: AppHandle,
    payload: SalvarMapaPayload
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/mapa-resultado/salvar", api_url);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            // CORREÇÃO CRÍTICA AQUI TAMBÉM:
            let status = response.status();

            if status.is_success() {
                Ok(ApiResponse::success("Alterações salvas com sucesso!".to_string(), None))
            } else {
                let msg = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("Erro ao salvar ({}): {}", status, msg)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Falha de conexão: {}", e))),
    }
}