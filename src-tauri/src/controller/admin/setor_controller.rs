// Em Sistema_Bioma/src-tauri/src/controller/admin/setor_controller.rs

use tauri::AppHandle;
use reqwest::Client;
use crate::{
    config::get_api_url,
    model::api_response::ApiResponse,
    model::setor::{Setor, UsuarioSimplificado, CriarSetorPayload, AtualizarUsuariosSetorPayload},
};

const API_RESOURCE: &str = "/admin/setores";

#[tauri::command]
pub async fn listar_setores_command(app_handle: AppHandle) -> Result<ApiResponse<Vec<Setor>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}", api_url, API_RESOURCE);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Setor>>().await {
                    Ok(data) => Ok(ApiResponse::success("Setores carregados.".to_string(), Some(data))),
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
pub async fn criar_setor_command(app_handle: AppHandle, nome: String) -> Result<ApiResponse<Setor>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}", api_url, API_RESOURCE);
    let payload = CriarSetorPayload { nome };

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Setor>().await {
                    Ok(data) => Ok(ApiResponse::success("Setor criado com sucesso.".to_string(), Some(data))),
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
pub async fn listar_usuarios_por_setor_command(app_handle: AppHandle, setor_id: u32) -> Result<ApiResponse<Vec<UsuarioSimplificado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}/{}/usuarios", api_url, API_RESOURCE, setor_id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<UsuarioSimplificado>>().await {
                    Ok(data) => Ok(ApiResponse::success("Usuários do setor carregados.".to_string(), Some(data))),
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
pub async fn atualizar_usuarios_do_setor_command(app_handle: AppHandle, setor_id: u32, usuarios_ids: Vec<u32>) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}/{}/usuarios", api_url, API_RESOURCE, setor_id);
    let payload = AtualizarUsuariosSetorPayload { usuarios_ids };

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Permissões do setor atualizadas com sucesso.".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}