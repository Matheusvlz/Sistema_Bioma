// Em src-tauri/src/controller/qualidade/fornecedor_controller.rs

use tauri::{command, AppHandle};
use tauri_plugin_opener::OpenerExt;
use crate::config::get_api_url;
use crate::model::api_response::ApiResponse;
use crate::model::fornecedor::{FornecedorDetalhado, SalvarFornecedorPayload, FornecedorListagem};
use std::path::Path;

// --- Comandos CRUD (Sem alterações) ---

#[command]
pub async fn buscar_fornecedor_detalhado_tauri(
    app_handle: AppHandle,
    id: u32
) -> Result<ApiResponse<FornecedorDetalhado>, ApiResponse<()>> {
    let client = reqwest::Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/fornecedores/{}", api_url, id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<FornecedorDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Fornecedor carregado.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro {}: {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn cadastrar_fornecedor_tauri(
    app_handle: AppHandle,
    payload: SalvarFornecedorPayload
) -> Result<ApiResponse<FornecedorDetalhado>, ApiResponse<()>> {
    let client = reqwest::Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/fornecedores", api_url);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<FornecedorDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Fornecedor cadastrado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro {}: {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn editar_fornecedor_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: SalvarFornecedorPayload
) -> Result<ApiResponse<FornecedorDetalhado>, ApiResponse<()>> {
    let client = reqwest::Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/fornecedores/{}", api_url, id);

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<FornecedorDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Fornecedor atualizado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro {}: {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn deletar_fornecedor_tauri(
    app_handle: AppHandle,
    id: u32
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = reqwest::Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/fornecedores/{}", api_url, id);
    
    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Fornecedor removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro {}: {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

// --- Comandos Adicionais ---

/// Comando para abrir a pasta do fornecedor no explorador de arquivos.
#[command]
pub async fn abrir_pasta_fornecedor_tauri(
    app_handle: AppHandle,
    fantasia: String
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let base_path = Path::new("\\\\192.168.15.2\\HD Gerência\\Bck HD IDE\\Qualidade\\Fornecedores");
    let full_path = base_path.join(fantasia);

    // CORREÇÃO DEFINITIVA:
    // O compilador nos mostrou que o método correto é '.open_url()'.
    // Este método aceita o caminho e um segundo argumento opcional para especificar
    // um programa. Passamos 'None' para usar o explorador de arquivos padrão do sistema.
    match app_handle.opener().open_url(full_path.to_string_lossy(), None::<String>) {
        Ok(_) => Ok(ApiResponse::success(format!("Pasta {} aberta.", full_path.display()), None)),
        Err(e) => {
            eprintln!("Erro ao abrir pasta {}: {}", full_path.display(), e);
            Err(ApiResponse::error(format!("Não foi possível abrir a pasta: {}", e)))
        }
    }
}

#[command]
pub async fn listar_categorias_fornecedor_tauri(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<crate::model::fornecedor::FornecedorCategoria>>, ApiResponse<()>> {
    let client = reqwest::Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/fornecedores/categorias", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json().await {
                    Ok(data) => Ok(ApiResponse::success("Categorias carregadas.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON das categorias: {}", e))),
                }
            } else {
                Err(ApiResponse::error("Falha ao buscar categorias da API.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn listar_fornecedores_tauri(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<FornecedorListagem>>, ApiResponse<()>> {
    let client = reqwest::Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/fornecedores", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<FornecedorListagem>>().await {
                    Ok(data) => Ok(ApiResponse::success("Lista de fornecedores carregada.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da lista: {}", e))),
                }
            } else {
                Err(ApiResponse::error("Falha ao buscar lista de fornecedores da API.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}