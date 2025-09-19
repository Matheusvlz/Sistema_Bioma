// src-tauri/src/controllers/laboratorio/amostra_personalizavel_controller.rs

use tauri::{command, AppHandle};
use reqwest::Client;

use crate::config::get_api_url;
use crate::model::api_response::ApiResponse;
use crate::model::amostra_personalizavel::{
    AmostraPersonalizavelDetalhado, AmostraPersonalizavelPayload,
};


#[command]
pub async fn listar_amostras_por_faixa_tauri(
    app_handle: AppHandle,
    inicio: u32,
    fim: u32,
) -> Result<ApiResponse<Vec<AmostraPersonalizavelDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/amostras/por-faixa/{}/{}", api_url, inicio, fim);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<AmostraPersonalizavelDetalhado>>().await {
                    Ok(data) => Ok(ApiResponse::success("Amostras carregadas.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn atualizar_amostras_em_lote_tauri(
    app_handle: AppHandle,
    payload: Vec<AmostraPersonalizavelPayload>,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/amostras/personalizar", api_url);

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Amostras atualizadas com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}