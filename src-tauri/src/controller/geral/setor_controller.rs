use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Setor {
    pub id: u32,
    pub nome: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SetorResponse {
    pub success: bool,
    pub data: Option<Vec<Setor>>,
    pub message: Option<String>,
}

#[command]
pub async fn buscar_setores_cadastro() -> SetorResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/setor/buscar", url);

    let res = match client.get(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SetorResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<SetorResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SetorResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn criar_setor(nome: String) -> SetorResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/setor/criar", url);

    let payload = serde_json::json!({ "nome": nome });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SetorResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<SetorResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SetorResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn editar_setor(id: u32, nome: String) -> SetorResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/setor/editar/{}", url, id);

    let payload = serde_json::json!({ "nome": nome });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SetorResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<SetorResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SetorResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn excluir_setor(id: u32) -> SetorResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/setor/excluir/{}", url, id);

    let res = match client.delete(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SetorResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<SetorResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SetorResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}
