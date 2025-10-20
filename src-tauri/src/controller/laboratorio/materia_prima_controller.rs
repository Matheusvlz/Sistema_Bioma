// src-tauri/src/controllers/materia_prima_controller.rs

use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::{
    api_response::ApiResponse,
    materia_prima::{
        MateriaPrimaDetalhado, PaginatedMateriaPrimaResponse, MateriaPrimaPayload,
        NovaMateriaPrimaApiPayload, AtualizacaoMateriaPrimaApiPayload
    },
    materia_prima_options::{MateriaPrimaTipoOption, UnidadeOption},
};
use crate::config::get_api_url;

// --- FUNÇÕES CRUD PRINCIPAIS ---

#[command]
pub async fn listar_materia_prima_tauri(
    app_handle: AppHandle, 
    page: u32, 
    per_page: u32
) -> Result<ApiResponse<PaginatedMateriaPrimaResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/materia-prima?page={}&per_page={}", api_url, page, per_page);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PaginatedMateriaPrimaResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON: {}", e))),
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

#[command]
pub async fn cadastrar_materia_prima_tauri(
    app_handle: AppHandle, 
    payload: MateriaPrimaPayload
) -> Result<ApiResponse<MateriaPrimaDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/materia-prima", api_url);

    let api_payload = NovaMateriaPrimaApiPayload {
        nome: payload.nome,
        tipo: payload.tipo,
        quantidade_min: payload.quantidade_min,
        unidade: payload.unidade,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<MateriaPrimaDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Matéria-prima cadastrada com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                 if status == 409 {
                    Err(ApiResponse::error("Já existe uma matéria-prima com este nome e tipo.".to_string()))
                } else {
                    Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
                }
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn editar_materia_prima_tauri(
    app_handle: AppHandle, 
    id: u32,
    payload: MateriaPrimaPayload
) -> Result<ApiResponse<MateriaPrimaDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/materia-prima/{}", api_url, id);

    let api_payload = AtualizacaoMateriaPrimaApiPayload {
        nome: payload.nome,
        tipo: payload.tipo,
        quantidade_min: payload.quantidade_min,
        unidade: payload.unidade,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<MateriaPrimaDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Matéria-prima atualizada com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
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

#[command]
pub async fn deletar_materia_prima_tauri(
    app_handle: AppHandle, 
    id: u32
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/materia-prima/{}", api_url, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Matéria-prima removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                 if status == 409 {
                    Err(ApiResponse::error("Não é possível remover. Matéria-prima possui registros associados.".to_string()))
                } else {
                    Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
                }
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}


// --- FUNÇÕES DE SUPORTE PARA DROPDOWNS ---

#[command]
pub async fn listar_tipos_materia_prima_tauri(
    app_handle: AppHandle
) -> Result<ApiResponse<Vec<MateriaPrimaTipoOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/materia-prima/tipos", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<MateriaPrimaTipoOption>>().await {
                    Ok(data) => Ok(ApiResponse::success("Tipos carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON de Tipos: {}", e))),
                }
            } else {
                let status = response.status();
                Err(ApiResponse::error(format!("API retornou erro ({})", status)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn listar_unidades_tauri(
    app_handle: AppHandle
) -> Result<ApiResponse<Vec<UnidadeOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/materia-prima/unidades", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // CORREÇÃO APLICADA AQUI: O tipo de desserialização agora é Vec<UnidadeOption>
                match response.json::<Vec<UnidadeOption>>().await {
                    Ok(data) => Ok(ApiResponse::success("Unidades carregadas.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON de Unidades: {}", e))),
                }
            } else {
                let status = response.status();
                Err(ApiResponse::error(format!("API retornou erro ({})", status)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}