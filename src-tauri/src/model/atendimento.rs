use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AtendimentoItem {
    pub id: u32,
    pub numero: Option<u32>,
    pub prefixo: Option<String>,
    pub data_coleta: Option<String>, // Assuming string format
    pub cliente: Option<String>,
}