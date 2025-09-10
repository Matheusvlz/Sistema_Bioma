// Local: src-tauri/src/model/etapa.rs

use serde::{Serialize, Deserialize};

/// Struct para receber dados da API (da tabela etapa_mapa) e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Etapa {
    pub ID: u8,
    pub descricao: Option<String>,
}

/// Struct para receber os dados do formulário do Frontend ao criar ou editar uma Etapa.
#[derive(Debug, Serialize, Deserialize)]
pub struct EtapaPayload {
    pub id: Option<u8>,
    pub descricao: String,
}