use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Grupo {
    pub nome: Option<String>,
    pub LABORATORIO: Option<u16>,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct GrupoPayload {
    pub nome: String,
    pub LABORATORIO: u16,
}
