use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct PG {
    pub ID: u32,
    pub NOME: Option<String>,
    pub NUMERO1: Option<i8>,
    pub NUMERO2: Option<i8>,
    pub NUMERO3: Option<i8>,
    pub REVISAO: Option<i8>,
    pub ATIVO: Option<i8>,
}

// Struct para receber os dados do formulário do Frontend ao criar uma nova versão.
// 👇 CORREÇÃO: Adicionado `Serialize` aqui.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct NovaVersaoPGPayload {
    pub NOME: String,
    pub NUMERO1: i8,
    pub NUMERO2: i8,
    pub NUMERO3: i8,
    pub REVISAO: i8,
}
