// src/controller/admin/usuario_controller.rs

use tauri::{AppHandle, Manager};
use crate::{
    config,
    model::usuario_admin::{
        ApiResponse, 
        UsuarioAdmin, 
        CriarUsuarioAdminPayload, 
        AtualizarUsuarioAdminPayload
    },
};

// ... (as 4 primeiras funções: listar, buscar, criar, atualizar permanecem as mesmas) ...
const API_RESOURCE: &str = "/admin/usuarios";

#[tauri::command]
pub async fn listar_usuarios_admin_command(app_handle: AppHandle) -> Result<Vec<UsuarioAdmin>, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    let res = client.get(format!("{}{}", api_url, API_RESOURCE)).send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let api_response = res.json::<ApiResponse<Vec<UsuarioAdmin>>>().await.map_err(|e| e.to_string())?;
        Ok(api_response.data.unwrap_or_default())
    } else {
        Err(format!("Erro da API ao listar usuários: {}", res.status()))
    }
}

#[tauri::command]
pub async fn buscar_usuario_admin_command(app_handle: AppHandle, id: u32) -> Result<UsuarioAdmin, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    let res = client.get(format!("{}{}/{}", api_url, API_RESOURCE, id)).send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let api_response = res.json::<ApiResponse<Vec<UsuarioAdmin>>>().await.map_err(|e| e.to_string())?;
        api_response.data.and_then(|mut v| v.pop()).ok_or_else(|| "Nenhum usuário retornado.".to_string())
    } else {
        Err(format!("Erro da API ao buscar usuário: {}", res.status()))
    }
}

#[tauri::command]
pub async fn criar_usuario_admin_command(app_handle: AppHandle, payload: CriarUsuarioAdminPayload) -> Result<UsuarioAdmin, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    let res = client.post(format!("{}{}", api_url, API_RESOURCE)).json(&payload).send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let api_response = res.json::<ApiResponse<Vec<UsuarioAdmin>>>().await.map_err(|e| e.to_string())?;
        api_response.data.and_then(|mut v| v.pop()).ok_or_else(|| "API não retornou o usuário criado.".to_string())
    } else {
        Err(format!("Erro da API ao criar usuário: {}", res.status()))
    }
}

#[tauri::command]
pub async fn atualizar_usuario_admin_command(app_handle: AppHandle, id: u32, payload: AtualizarUsuarioAdminPayload) -> Result<UsuarioAdmin, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    let res = client.put(format!("{}{}/{}", api_url, API_RESOURCE, id)).json(&payload).send().await.map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let api_response = res.json::<ApiResponse<Vec<UsuarioAdmin>>>().await.map_err(|e| e.to_string())?;
        api_response.data.and_then(|mut v| v.pop()).ok_or_else(|| "API não retornou o usuário atualizado.".to_string())
    } else {
        Err(format!("Erro da API ao atualizar usuário: {}", res.status()))
    }
}


#[tauri::command]
pub async fn atualizar_status_usuario_admin_command(app_handle: AppHandle, id: u32, ativo: bool) -> Result<String, String> {
    // CORREÇÃO: Adicionado o `use` para `Deserialize` aqui dentro.
    use serde::Deserialize;

    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    let res = client.patch(format!("{}{}/{}/status", api_url, API_RESOURCE, id))
        .json(&serde_json::json!({ "ativo": ativo }))
        .send().await.map_err(|e| e.to_string())?;
    
    if res.status().is_success() {
        // A struct local precisa do `derive` para desserializar a resposta JSON.
        #[derive(Deserialize)] 
        struct StatusResponse { message: String }
        let status_res = res.json::<StatusResponse>().await.map_err(|e| e.to_string())?;
        Ok(status_res.message)
    } else {
        Err(format!("Erro da API ao atualizar status: {}", res.status()))
    }
}