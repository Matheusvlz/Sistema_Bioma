use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Pacote {
    pub id: u32,
    pub nome: Option<String>,
    pub legislacao: Option<u32>,
    pub ativo: Option<i8>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PacotePayload {
    pub nome: String,
    pub legislacao: u32,
    pub parametros: Vec<u32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PacoteCompleto {
    pub id: u32,
    pub nome: Option<String>,
    pub legislacao: Option<u32>,
    pub ativo: Option<i8>,
    pub parametros: Vec<u32>,
    pub parametros_texto: Option<Vec<String>>
}