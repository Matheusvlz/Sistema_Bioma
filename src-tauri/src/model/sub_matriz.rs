use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubMatriz {
    pub id: u32,
    pub idmatriz: u32,
    pub nome: Option<String>,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Deserialize, Serialize)]
pub struct SubMatrizPayload {
    pub id: Option<u32>,
    pub idmatriz: u32,
    pub nome: String,
}
