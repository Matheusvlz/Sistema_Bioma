use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct FormaContato {
    pub ID: u8,
    pub NOME: Option<String>,
}

// Struct para RECEBER os dados do formulário do Frontend.
// Usa convenções de Rust/JS (snake_case ou camelCase).
#[derive(Debug, Deserialize)]
pub struct FormaContatoPayload {
    pub id: Option<u8>,
    pub nome: String,
}

// Struct para ENVIAR dados para a API REST.
// Usa convenções da API (UPPERCASE) e deriva `Serialize`.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct FormaContatoApiPayload {
    pub NOME: String,
}
