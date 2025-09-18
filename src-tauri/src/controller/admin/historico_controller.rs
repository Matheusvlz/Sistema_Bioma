// Em Sistema_Bioma/src-tauri/src/controller/admin/historico_controller.rs

use tauri::AppHandle;
use reqwest::Client;
use crate::{
    config::get_api_url,
    model::api_response::ApiResponse,
    // 🔧 CORREÇÃO: Importamos as structs com nomes novos e específicos
    model::historico::{
        PaginatedHistoricoResponseFromApi, 
        PaginatedHistoricoResponseToFrontend, 
        HistoricoFilterPayload
    },
};

const API_RESOURCE: &str = "/admin/historico";

#[tauri::command]
pub async fn listar_acoes_historico_command(app_handle: AppHandle) -> Result<ApiResponse<Vec<String>>, ApiResponse<()>> {
    // ... (Esta função não precisa de alterações, pois lida com um tipo simples: Vec<String>)
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}/acoes", api_url, API_RESOURCE);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<String>>().await {
                    Ok(data) => Ok(ApiResponse::success("Ações carregadas.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}


#[tauri::command]
pub async fn listar_historico_command(
    app_handle: AppHandle,
    page: u32,
    per_page: u32,
    filters: HistoricoFilterPayload,
) -> Result<ApiResponse<PaginatedHistoricoResponseToFrontend>, ApiResponse<()>> { // 🔧 CORREÇÃO: Retorna o tipo para o Frontend
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let mut url = format!("{}{}?page={}&per_page={}", api_url, API_RESOURCE, page, per_page);

    if let Some(id) = filters.usuario_id { url.push_str(&format!("&usuario_id={}", id)); }
    if let Some(acao) = filters.acao { if !acao.is_empty() { url.push_str(&format!("&acao={}", urlencoding::encode(&acao))); }}
    if let Some(inicio) = filters.data_inicio { if !inicio.is_empty() { url.push_str(&format!("&data_inicio={}", inicio)); }}
    if let Some(fim) = filters.data_fim { if !fim.is_empty() { url.push_str(&format!("&data_fim={}", fim)); }}

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // 🔧 CORREÇÃO: 1. Decodifica usando a struct `...FromApi`
                match response.json::<PaginatedHistoricoResponseFromApi>().await {
                    Ok(data_from_api) => {
                        // 2. Converte para a struct `...ToFrontend`
                        let data_for_frontend: PaginatedHistoricoResponseToFrontend = data_from_api.into();
                        // 3. Envia para o frontend
                        Ok(ApiResponse::success("Histórico carregado.".to_string(), Some(data_for_frontend)))
                    },
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}