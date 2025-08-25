use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Observacao {
    pub NOME: Option<String>,
}

// Struct para RECEBER os dados do formulário do Frontend.
// Usa convenções de Rust/JS (snake_case ou camelCase).
#[derive(Debug, Serialize, Deserialize)]
pub struct ObservacaoPayload {
    // 👇 CORREÇÃO: Adicionado o atributo `rename` para que o JSON com "NOME"
    // seja corretamente mapeado para o campo "nome".
    #[serde(rename = "NOME")]
    pub nome: String,
}

// Struct para ENVIAR dados para a API REST.
// Usa convenções da API (UPPERCASE) e deriva `Serialize`.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct ObservacaoApiPayload {
    pub NOME: String,
}
