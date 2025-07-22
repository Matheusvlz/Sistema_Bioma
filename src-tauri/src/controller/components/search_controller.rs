use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Cliente {
    pub id: u32,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
    pub documento: Option<String>,
    pub cidade: Option<String>,
    pub telefone: Option<String>,
}
#[derive(Serialize, Deserialize, Debug)]
pub struct ClienteResponse {
    pub success: bool,
    pub data: Option<Vec<Cliente>>,
    pub message: Option<String>,
    pub total: Option<u32>,
}
#[derive(Serialize)]
struct ClienteRequest {
    filters: HashMap<String, String>,
    page: u32,
    limit: u32,
}
#[derive(Serialize)]
struct ClienteDropdownRequest {
    query: String,
}

#[command]
pub async fn buscar_clientes_filtros(
    filters: HashMap<String, String>,
    page: u32,
    limit: u32,
) -> ClienteResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/clientes/buscar", url);
    let request_data = ClienteRequest {
        filters,
        page,
        limit,
    };

    let res = match client
        .post(&full_url)
        .json(&request_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
                total: None,
            };
        }
    };
    if !res.status().is_success() {
        println!("Status não sucesso: {}", res.status());
        return ClienteResponse {
            success: false,
            data: None,
            message: Some("Erro na requisição".to_string()),
            total: None,
        };
    }
    match res.json::<ClienteResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
                total: None,
            }
        }
    }
}

#[command]
pub async fn buscar_clientes_dropdown(query: String) -> ClienteResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/clientes/dropdown", url);
    let request_data = ClienteDropdownRequest { query };

    let res = match client
        .post(&full_url)
        .json(&request_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
                total: None,
            };
        }
    };
    if !res.status().is_success() {
        println!("Status não sucesso: {}", res.status());
        return ClienteResponse {
            success: false,
            data: None,
            message: Some("Erro na requisição".to_string()),
            total: None,
        };
    }
    match res.json::<ClienteResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
                total: None,
            }
        }
    }
}

//adicionar ao controller front
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Usuario {
    pub id: u32,
    pub nome: Option<String>,
    pub usuario: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UsuarioResponse {
    pub success: bool,
    pub data: Option<Vec<Usuario>>,
    pub message: Option<String>,
}

#[derive(Serialize)]
struct UsuarioDropdownRequest {
    query: String,
}

#[command]
pub async fn buscar_usuarios_dropdown(query: String) -> UsuarioResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/usuarios/dropdown", url);
    let request_data = UsuarioDropdownRequest { query };

    let res = match client.post(&full_url).json(&request_data).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return UsuarioResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        return UsuarioResponse {
            success: false,
            data: None,
            message: Some("Erro na requisição".to_string()),
        };
    }

    match res.json::<UsuarioResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            UsuarioResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}