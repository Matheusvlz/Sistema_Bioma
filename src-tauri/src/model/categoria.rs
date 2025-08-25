use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Categoria {
    pub ID: u8,
    pub NOME: Option<String>,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Serialize, Deserialize)]
pub struct CategoriaPayload {
    pub id: Option<u8>,
    pub NOME: String,
}
