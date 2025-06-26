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
        Ok(usuario) => {
            salvar_usuario(Usuario {
                success: usuario.success,
                id: usuario.id,
                nome: usuario.nome,
                privilegio: usuario.privilegio,
                empresa: usuario.empresa,
                ativo: usuario.ativo,
                nome_completo: usuario.nome_completo,
                cargo: usuario.cargo,
                numero_doc: usuario.numero_doc,
            });

            LoginStatus { success: true }
        }
        Err(_) => LoginStatus { success: false },
    }
}
