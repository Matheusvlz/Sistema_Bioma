use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Unidade {
    pub nome: Option<String>,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Serialize, Deserialize)]
pub struct UnidadePayload {
    pub nome: String,
}
