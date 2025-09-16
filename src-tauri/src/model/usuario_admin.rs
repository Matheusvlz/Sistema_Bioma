// src/model/usuario_admin.rs

use serde::{Deserialize, Serialize};
use chrono::NaiveDateTime;

// ... outras structs (UsuarioAdmin, Payloads) permanecem as mesmas ...
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UsuarioAdmin {
    pub id: u32,
    pub nome: Option<String>,
    pub privilegio: Option<String>,
    pub cor: Option<String>,
    pub empresa: Option<u32>,
    pub logado: Option<bool>,
    pub datalogin: Option<NaiveDateTime>,
    pub ativo: Option<bool>,
    pub nome_completo: Option<String>,
    pub cargo: Option<String>,
    pub numero_doc: Option<String>,
    pub recado: Option<String>,
    pub cor_fonte: Option<String>,
    pub prefixo: Option<String>,
    pub profile_photo_path: Option<String>,
    pub dark_mode: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CriarUsuarioAdminPayload {
    pub nome: String,
    pub nome_completo: String,
    pub senha: String,
    pub privilegio: String,
    pub cargo: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AtualizarUsuarioAdminPayload {
    pub nome: Option<String>,
    pub nome_completo: Option<String>,
    pub privilegio: Option<String>,
    pub cargo: Option<String>,
    pub ativo: Option<bool>,
}

// CORREÇÃO: Adicionado `pub` aos campos para torná-los acessíveis por outros módulos.
#[derive(Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}