use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Tipo {
    pub nome: Option<String>,
    pub codigo: Option<String>,
}

// Struct para receber dados do Frontend ao criar/editar.

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct TipoPayload {
    pub nome: String,
    pub codigo: String,
}

// Struct para enviar dados de atualização para a API REST.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoTipoPayload {
    pub NOME: String,
}
