use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

use crate::model::usuario::{salvar_usuario, Usuario};

#[derive(Serialize, Deserialize, Clone)]
pub struct UsuarioResponse {
    pub success: bool,
    pub id: u32,
    pub nome: String,
    pub privilegio: String,
    pub empresa: Option<String>,
    pub ativo: bool,
    pub nome_completo: String,
    pub cargo: String,
    pub numero_doc: String,
    pub profile_photo: Option<String>,
    pub dark_mode: bool,
    pub cor: Option<String> // Alterado para Option<String>
}

#[derive(Serialize)]
pub struct LoginStatus {
    pub success: bool,
}

#[derive(Serialize)]
struct LoginRequest {
    usuario: String,
    senha: String,
}


#[command]
pub async fn fazer_login(usuario: String, senha: String) -> LoginStatus {
    let client = Client::new();
    let login_data = LoginRequest { usuario, senha };

    let api_url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8080".to_string());
    let login_url = format!("{}/login", api_url);

    let res = match client
        .post(&login_url)
        .json(&login_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(_) => return LoginStatus { success: false },
    };

    if !res.status().is_success() {
        return LoginStatus { success: false };
    }

    let parsed = res.json::<UsuarioResponse>().await;

    match parsed {
        Ok(usuario_resp) => { // Renomeado para evitar conflito com a struct Usuario
            salvar_usuario(Usuario {
                success: usuario_resp.success,
                id: usuario_resp.id,
                nome: usuario_resp.nome,
                privilegio: usuario_resp.privilegio,
                empresa: usuario_resp.empresa,
                ativo: usuario_resp.ativo,
                nome_completo: usuario_resp.nome_completo,
                cargo: usuario_resp.cargo,
                numero_doc: usuario_resp.numero_doc,
                profile_photo: usuario_resp.profile_photo,
                dark_mode: usuario_resp.dark_mode,
                cor: usuario_resp.cor,
                conectado_com_websocket: Some(false),// Agora é Option<String>
            });

            LoginStatus { success: true }
        }
        Err(_) => LoginStatus { success: false },
    }
}


#[command]
pub async fn validate_user_credentials(usuario: String, senha: String) -> LoginStatus {
    let client = Client::new();
    let login_data = LoginRequest { usuario, senha };
    let res = match client
    
        .post("http://192.168.15.26:8082/login")
        .json(&login_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(_) => return LoginStatus { success: false },
    };

    if !res.status().is_success() {
        return LoginStatus { success: false };
    }

    let parsed = res.json::<UsuarioResponse>().await;

    match parsed {
        Ok(usuario_resp) => {

            LoginStatus { success: true }
        }
        Err(_) => LoginStatus { success: false },
    }
}
