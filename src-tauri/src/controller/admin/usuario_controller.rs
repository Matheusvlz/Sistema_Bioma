// ✅ ESTE É O CÓDIGO CORRETO PARA:
// src-tauri/src/controller/admin/usuario_controller.rs

use tauri::AppHandle;
use reqwest::Client;
use crate::{
    config::get_api_url,
    model::api_response::ApiResponse,
    model::usuario_admin::{
        UsuarioAdmin,
        CriarUsuarioAdminPayload,
        AtualizarUsuarioAdminPayload,
        AtualizarStatusPayload,
    },
};

const API_RESOURCE: &str = "/admin/usuarios";

#[tauri::command]
pub async fn listar_usuarios_admin_command(app_handle: AppHandle) -> Result<ApiResponse<Vec<UsuarioAdmin>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}", api_url, API_RESOURCE);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // A API de listar retorna o Vec<Usuario> diretamente
                match response.json::<Vec<UsuarioAdmin>>().await {
                    Ok(data) => Ok(ApiResponse::success("Usuários carregados.".to_string(), Some(data))),
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
pub async fn buscar_usuario_admin_command(app_handle: AppHandle, id: u32) -> Result<ApiResponse<UsuarioAdmin>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}/{}", api_url, API_RESOURCE, id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // A API de buscar retorna o objeto Usuario diretamente
                match response.json::<UsuarioAdmin>().await {
                    Ok(data) => Ok(ApiResponse::success("Usuário encontrado.".to_string(), Some(data))),
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
pub async fn criar_usuario_admin_command(app_handle: AppHandle, payload: CriarUsuarioAdminPayload) -> Result<ApiResponse<UsuarioAdmin>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}", api_url, API_RESOURCE);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // A API de criar retorna o objeto Usuario diretamente
                match response.json::<UsuarioAdmin>().await {
                    Ok(data) => Ok(ApiResponse::success("Usuário criado com sucesso.".to_string(), Some(data))),
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
pub async fn atualizar_usuario_admin_command(app_handle: AppHandle, id: u32, payload: AtualizarUsuarioAdminPayload) -> Result<ApiResponse<UsuarioAdmin>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}/{}", api_url, API_RESOURCE, id);

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // A API de atualizar retorna o objeto Usuario diretamente
                match response.json::<UsuarioAdmin>().await {
                    Ok(data) => Ok(ApiResponse::success("Usuário atualizado com sucesso.".to_string(), Some(data))),
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
pub async fn atualizar_status_usuario_admin_command(app_handle: AppHandle, id: u32, ativo: bool) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}{}/{}/status", api_url, API_RESOURCE, id);
    let payload = AtualizarStatusPayload { ativo };

    match client.patch(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                return Ok(ApiResponse::success("Status atualizado com sucesso.".to_string(), None));
            }
            
            let status = response.status();
            let err_body = response.text().await.unwrap_or_default();
            Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}