use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemFilaTrabalho {
    pub analise_id: u32,
    pub amostra_numero: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub parametro_nome: Option<String>,
    pub pop_codigo: Option<String>,
    pub pop_numero: Option<String>,
    pub pop_revisao: Option<String>,
    pub tecnica_nome: Option<String>,
    pub data_coleta: Option<String>,
    pub data_lab: Option<String>,
    pub hora_lab: Option<String>,
    pub em_campo: Option<i8>,
    pub data_inicio: Option<String>,
    pub usuario_visto: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedFilaResponse {
    pub items: Vec<ItemFilaTrabalho>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IniciarAnalisePayload {
    pub analise_ids: Vec<u32>,
    pub id_parametro: u32,
    pub usuario_id: u32,
    pub data_inicio: String,
    pub hora_inicio: String,
    pub is_em_campo: bool,
}