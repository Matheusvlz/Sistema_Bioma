// Em Sistema_Bioma/src-tauri/src/model/setor.rs

use serde::{Serialize, Deserialize};

// Representa um Setor, como recebido da API.
#[derive(Debug, Serialize, Deserialize)]
pub struct Setor {
    pub id: u32,
    pub nome: Option<String>,
}

// Representa um Usuário Simplificado, como recebido da API.
#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)] // Clone e PartialEq para facilitar a manipulação no frontend
#[serde(rename_all = "camelCase")] // A API envia snake_case, mas vamos padronizar para o frontend
pub struct UsuarioSimplificado {
    pub id: u32,
    pub nome: Option<String>,
}

// Payload para criar um novo setor.
#[derive(Debug, Serialize)]
pub struct CriarSetorPayload {
    pub nome: String,
}

// Payload para atualizar a lista de usuários de um setor.
#[derive(Debug, Serialize)]
pub struct AtualizarUsuariosSetorPayload {
    pub usuarios_ids: Vec<u32>,
}