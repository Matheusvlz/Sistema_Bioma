// src-tauri/src/model/parametro_insumo.rs
use serde::{Serialize, Deserialize};

// Structs de Leitura (Idênticas às da API)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct ParametroPopDropdown {
    pub id: u32,
    pub nome_parametro: String,
    pub nome_tecnica: String,
    pub pop_numero: String,
    pub pop_revisao: String,
    pub pop_codigo: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct InsumoRelacionadoDetalhado {
    pub relacao_id: u32,
    pub insumo_id: u32,
    pub descricao: String,
    pub tipo: String,
    pub mc_temperatura: Option<String>,
    pub mc_tempo: Option<String>,
    pub validade: Option<String>,
    pub is_preservante: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct InsumoDisponivel {
    pub id: u32,
    pub nome: String,
    pub tipo_id: u32,
    pub tipo_nome: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoDisponivelAgrupado {
    pub tipo_nome: String,
    pub insumos: Vec<InsumoDisponivel>,
}

// Structs de Escrita (Payloads para a API)

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoParaRelacionar {
    pub insumo_id: u32,
    pub tipo_nome: String,
    pub mc_temperatura: Option<String>,
    pub mc_tempo: Option<String>,
    pub validade: Option<String>,
}

// Payload do Frontend (Tauri) e para a API (Axum)
// (Neste caso, são idênticos, sem necessidade de ...ApiPayload)
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct RelacionarInsumoPayload {
   pub insumos: Vec<InsumoParaRelacionar>,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct RemoverInsumoPayload {
    pub relacao_id: u32,
    pub is_preservante: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PaginatedInsumoResponse {
    pub items: Vec<InsumoRelacionadoDetalhado>,
    pub total: i64, // ou usize
    pub page: usize,
    pub per_page: usize,
}