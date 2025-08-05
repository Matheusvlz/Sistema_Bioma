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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Identificacao {
    pub id: u32,
    pub id1: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IdentificacaoResponse {
    pub success: bool,
    pub data: Option<Vec<Identificacao>>,
    pub message: Option<String>,
}

// Função auxiliar para fazer requisições e extrair dados
async fn fazer_requisicao_categoria(app_handle: &AppHandle, endpoint: &str) -> Result<Vec<Categoria>, String> {
    let client = Client::new();
    let url = get_api_url(app_handle);
    let full_url = format!("{}/{}", url, endpoint);

    let res = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| {
            println!("Erro de conexão: {:?}", e);
            "Erro de conexão com o servidor".to_string()
        })?;

    let response: CategoriaResponse = res
        .json()
        .await
        .map_err(|e| {
            println!("Erro ao parsear JSON: {:?}", e);
            "Erro ao processar resposta".to_string()
        })?;

    if response.success {
        Ok(response.data.unwrap_or_default())
    } else {
        Err(response.message.unwrap_or("Erro desconhecido".to_string()))
    }
}

// Função auxiliar para identificação
async fn fazer_requisicao_identificacao(app_handle: &AppHandle, endpoint: &str) -> Result<Vec<Identificacao>, String> {
    let client = Client::new();
    let url = get_api_url(app_handle);
    let full_url = format!("{}/{}", url, endpoint);

    let res = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| {
            println!("Erro de conexão: {:?}", e);
            "Erro de conexão com o servidor".to_string()
        })?;

    let response: IdentificacaoResponse = res
        .json()
        .await
        .map_err(|e| {
            println!("Erro ao parsear JSON: {:?}", e);
            "Erro ao processar resposta".to_string()
        })?;

    if response.success {
        Ok(response.data.unwrap_or_default())
    } else {
        Err(response.message.unwrap_or("Erro desconhecido".to_string()))
    }
}

#[command]
pub async fn buscar_categoria_amostra(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_categoria(&app_handle, "buscar_categorias").await
}

#[command]
pub async fn buscar_acreditacao(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_categoria(&app_handle, "buscar_acreditacao").await
}

#[command]
pub async fn buscar_metodologias(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_categoria(&app_handle, "buscar_metodologias").await
}

#[command]
pub async fn buscar_legislacao(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_categoria(&app_handle, "buscar_legislacao").await
}

#[command]
pub async fn buscar_identificacao(app_handle: AppHandle) -> Result<Vec<Identificacao>, String> {
    fazer_requisicao_identificacao(&app_handle, "buscar_identificacao").await
}

#[command]
pub async fn buscar_tercerizado(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_categoria(&app_handle, "buscar_tercerizado").await
}

#[command]
pub async fn consultar_consultores(app_handle: AppHandle) -> Result<Vec<Categoria>, String> {
    fazer_requisicao_categoria(&app_handle, "consultar_consultores").await
}