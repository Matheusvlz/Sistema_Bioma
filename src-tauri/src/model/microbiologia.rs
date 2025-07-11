use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicrobiologiaPendenteItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub tempo: Option<String>, // Formatted date string "dd/mm/YYYY HH:MM"
    pub passou: bool,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicrobiologiaLiberacaoPendenteItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MicrobiologiaResponse {
    pub pendencias_prazo: Vec<MicrobiologiaPendenteItem>,
    pub total_pendencias_prazo: i64,
    pub pendencias_liberacao: Vec<MicrobiologiaLiberacaoPendenteItem>,
    pub total_pendencias_liberacao: i64,
}