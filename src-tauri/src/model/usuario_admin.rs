// src-tauri/src/model/usuario_admin.rs

use serde::{Serialize, Deserialize};
use chrono::NaiveDateTime;

// ... (struct UsuarioAdmin não muda) ...
#[derive(Debug, Serialize, Deserialize)]
pub struct UsuarioAdmin {
    pub id: u32,
    pub nome: Option<String>,
    pub privilegio: Option<String>,
    pub empresa: Option<u32>,
    pub logado: Option<bool>,
    pub datalogin: Option<NaiveDateTime>,
    pub ativo: Option<bool>,
    #[serde(rename = "nome_completo")]
    pub nome_completo: Option<String>,
    pub cargo: Option<String>,
    #[serde(rename = "numero_doc")]
    pub numero_doc: Option<String>,
    pub recado: Option<String>,
    #[serde(rename = "cor_fonte")]
    pub cor_fonte: Option<String>,
    #[serde(rename = "profile_photo_path")]
    pub profile_photo_path: Option<String>,
    #[serde(rename = "dark_mode")]
    pub dark_mode: Option<bool>,
}


// 🔧 CORRIGIDO: Removido o atributo #[serde(rename_all = "camelCase")]
#[derive(Debug, Serialize, Deserialize)] 
pub struct CriarUsuarioAdminPayload {
    pub nome: String,
    pub nome_completo: String,
    pub senha: String,
    pub privilegio: String,
    pub cargo: Option<String>,
    pub empresa: Option<u32>,
}

// 🔧 CORRIGIDO: Removido o atributo #[serde(rename_all = "camelCase")]
#[derive(Debug, Serialize, Deserialize)]
pub struct AtualizarUsuarioAdminPayload {
    pub nome: Option<String>,
    pub nome_completo: Option<String>,
    pub privilegio: Option<String>,
    pub cargo: Option<String>,
    pub ativo: Option<bool>,
    pub empresa: Option<u32>,
}

// ... (restante do arquivo sem alterações) ...
#[derive(Debug, Serialize)]
pub struct AtualizarStatusPayload {
    pub ativo: bool,
}

#[derive(Debug, Deserialize)]
pub struct ApiResponseDaApi<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}