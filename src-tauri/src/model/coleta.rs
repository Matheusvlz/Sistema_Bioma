use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgendamentoComCliente {
    pub descricao: Option<String>,
    pub data: Option<String>, // Assuming this comes as a string from DB/API
    pub hora: Option<String>, // Assuming this comes as a string from DB/API
    pub recibo_gerado: Option<bool>,
    pub recibo_assinado: Option<bool>,
    pub cliente_nome: Option<String>,
    pub cliente_cod: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ColetaResponse {
    pub total_agendamentos: i64,
    pub total_recibos_gerados: i64,
    pub agendamentos: Vec<AgendamentoComCliente>,
}