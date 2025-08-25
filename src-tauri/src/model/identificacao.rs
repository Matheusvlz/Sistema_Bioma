use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Identificacao {
    pub ID: u32,
    pub id1: Option<String>,
    pub id2: Option<String>,
    pub id3: Option<String>,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Serialize, Deserialize)]
pub struct IdentificacaoPayload {
    pub id: Option<u32>,
    pub id1: String,
}
