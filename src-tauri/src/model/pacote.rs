// src-tauri/src/model/pacote.rs

use serde::{Serialize, Deserialize};

// Representa um pacote na lista de visualização.
// Esta struct está correta.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Pacote {
    pub id: u32,
    pub nome: Option<String>,
    pub legislacao: Option<u32>,
    pub ativo: Option<i8>,
}

// Representa o payload enviado do frontend para criar/editar um pacote.
// Esta struct está correta.
#[derive(Debug, Serialize, Deserialize)]
pub struct PacotePayload {
    pub nome: String,
    pub legislacao: u32,
    pub parametros: Vec<u32>,
}

// Representa um pacote completo com a lista de IDs dos seus parâmetros.
// ✅ CORREÇÃO: Removidas as anotações `#[serde(rename = "...")]` para
// corresponder ao JSON com chaves minúsculas enviado pela nossa nova API.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PacoteCompleto {
    pub id: u32,
    pub nome: Option<String>,
    pub legislacao: Option<u32>,
    pub ativo: Option<i8>,
    pub parametros: Vec<u32>,
}