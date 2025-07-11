use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Categoria {
    pub id: u32,
    pub nome: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Consultor {
    pub id: u32,
    pub nome: String,
    pub documento: Option<String>,
    pub telefone: Option<String>,
    pub email: Option<String>,
    pub ativo: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CategoriaResponse {
    pub success: bool,
    pub data: Option<Vec<Categoria>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConsultorResponse {
    pub success: bool,
    pub data: Option<Vec<Consultor>>,
    pub message: Option<String>,
}

#[command]
pub async fn buscar_categorias() -> CategoriaResponse {
    let client = Client::new();

    let res = match client
        .post("http://192.168.15.26:8082/clientes/buscar")
        .json(&request_data)
        .send()
        .await
    {
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
pub async fn buscar_consultores() -> ConsultorResponse {
    let client = Client::new();

    let res = match client
        .post("http://192.168.15.26:8082/clientes/dropdown")
        .json(&request_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return ConsultorResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<ConsultorResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            ConsultorResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}
