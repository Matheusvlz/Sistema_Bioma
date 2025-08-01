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
pub struct Indentificao {
    pub id: u32,
    pub id1: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IndentificaoResponse {
    pub success: bool,
    pub data: Option<Vec<Indentificao>>,
    pub message: Option<String>,
}

#[command]
pub async fn buscar_categoria_amostra(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/buscar_categorias", url);

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
pub async fn buscar_acreditacao(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/buscar_acreditacao", url);

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
pub async fn buscar_metodologias(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/buscar_metodologias", url);

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
pub async fn buscar_legislacao(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/buscar_legislacao", url);

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
pub async fn buscar_identificacao(app_handle: AppHandle) -> IndentificaoResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/buscar_identificacao", url);

    let res = match client.get(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return IndentificaoResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<IndentificaoResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            IndentificaoResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}


#[command]
pub async fn buscar_tercerizado(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/buscar_tercerizado", url);

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
pub async fn consultar_consultores(app_handle: AppHandle) -> CategoriaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/consultar_consultores", url);

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


