use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

use crate::config::get_api_url;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Categoria {
    pub id: u32,
    pub nome: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CategoriaResponse {
    pub success: bool,
    pub data: Option<Vec<Categoria>>,
    pub message: Option<String>,
}

#[command]
pub async fn buscar_categorias_cadastro(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/categoria/buscar", url);

    let res = match client.get(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<CategoriaResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn criar_categoria(app_handle: AppHandle, nome: String) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/categoria/criar", url);

    let payload = serde_json::json!({ "nome": nome });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<CategoriaResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn editar_categoria(app_handle: AppHandle, id: u32, nome: String) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/categoria/editar/{}", url, id);

    let payload = serde_json::json!({ "nome": nome });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<CategoriaResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn excluir_categoria(app_handle: AppHandle, id: u32) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/categoria/excluir/{}", url, id);

    let res = match client.delete(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<CategoriaResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            CategoriaResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}
