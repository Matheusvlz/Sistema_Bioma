// src-tauri/src/controller/geral/pacote_controller.rs

use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::pacote::{Pacote, PacotePayload, PacoteCompleto};
use crate::config::get_api_url;

// ✅ CORREÇÃO: A função agora aceita os filtros opcionais `nome` e `legislacao_id`.
#[command]
pub async fn listar_pacotes_tauri(
    app_handle: AppHandle, 
    nome: Option<String>, 
    legislacao_id: Option<u32>
) -> Result<ApiResponse<Vec<Pacote>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/pacotes", api_url);
    
    // ✅ CORREÇÃO: O método `.query()` é usado para adicionar os filtros à URL.
    // Ele lida automaticamente com `Option`, ignorando os que forem `None`.
    let request_builder = client.get(&url).query(&[
        ("nome", nome), 
        ("legislacao_id", legislacao_id.map(|id| id.to_string()))
    ]);

    match request_builder.send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Pacote>>().await {
                    Ok(data) => Ok(ApiResponse::success("Pacotes carregados com sucesso".to_string(), Some(data))),
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

#[command]
pub async fn buscar_pacote_por_id_tauri(app_handle: AppHandle, id: u32) -> Result<ApiResponse<PacoteCompleto>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/pacotes/{}", api_url, id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PacoteCompleto>().await {
                    Ok(data) => Ok(ApiResponse::success("Pacote carregado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
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

#[command]
pub async fn criar_pacote_tauri(app_handle: AppHandle, payload: PacotePayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/pacotes", api_url);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Pacote criado com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn editar_pacote_tauri(app_handle: AppHandle, id: u32, payload: PacotePayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/pacotes/{}", api_url, id);

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Pacote atualizado com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn deletar_pacote_tauri(app_handle: AppHandle, id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/pacotes/{}", api_url, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Pacote removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}