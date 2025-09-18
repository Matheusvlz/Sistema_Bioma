// Local: src-tauri/src/model/tecnica_etapa.rs

use serde::{Serialize, Deserialize};

/// Struct para exibir uma etapa relacionada a uma técnica no frontend.
/// Corresponde à resposta da API.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct TecnicaEtapaView {
    pub ID: u16,
    pub descricao: Option<String>,
    pub sequencia: i8,
}

/// Payload enviado do frontend para a API para relacionar novas etapas.
#[derive(Debug, Serialize, Deserialize)]
pub struct RelacionarEtapasPayload {
    pub etapa_ids: Vec<u8>,
}

/// Payload enviado do frontend para a API para reordenar as etapas.
#[derive(Debug, Serialize, Deserialize)]
pub struct ReordenarEtapasPayload {
    pub tecnica_etapa_ids: Vec<u16>,
}