use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Usuario {
    pub id: u32,
    pub nome: String,
    pub usuario: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Cliente {
    pub id: u32,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetorPortal {
    pub id: u32,
    pub nome: String,
    pub do_usuario: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PermissaoSetor {
    pub setor_id: u32,
    pub permitido: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClienteResponse {
    pub success: bool,
    pub data: Option<Vec<Cliente>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SetorResponse {
    pub success: bool,
    pub data: Option<Vec<SetorPortal>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PermissoesResponse {
    pub success: bool,
    pub data: Option<Vec<PermissaoSetor>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InvokeResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub message: Option<String>,
}

#[command]
pub async fn buscar_clientes_usuario(usuario_id: u32) -> ClienteResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/usuarios/portal/{}/clientes", url, usuario_id);

    let res = match client.get(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<ClienteResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn buscar_setores_portal(usuario_id: u32, cliente_id: u32) -> SetorResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/usuarios/portal/{}/setores/{}", url, usuario_id, cliente_id);

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

// Adicionar cliente a um usuário
#[command]
pub async fn adicionar_cliente_usuario(usuario_id: u32, cliente_id: u32) -> InvokeResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!(
        "{}/portal/usuarios/{}/clientes/{}",
        url, usuario_id, cliente_id
    );

    let res = match client.post(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

// Buscar permissões de um usuário para um cliente específico
#[command]
pub async fn buscar_permissoes_usuario_cliente(
    usuario_id: u32,
    cliente_id: u32,
) -> PermissoesResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!(
        "{}/portal/usuarios/{}/clientes/{}/permissoes",
        url, usuario_id, cliente_id
    );

    let res = match client.get(&full_url).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return PermissoesResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<PermissoesResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            PermissoesResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

// Alterar permissão de setor para um usuário em um cliente
#[command]
pub async fn alterar_permissao_setor(
    usuario_id: u32,
    cliente_id: u32,
    setor_id: u32,
    permitido: bool,
) -> InvokeResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!(
        "{}/portal/usuarios/{}/clientes/{}/setores/{}/permissao",
        url, usuario_id, cliente_id, setor_id
    );

    let payload = serde_json::json!({
        "permitido": permitido
    });

    let res = match client.put(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}
