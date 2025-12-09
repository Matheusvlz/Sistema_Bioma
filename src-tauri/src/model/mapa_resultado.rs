use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// --- LEITURA (Espelho da API) ---

#[derive(Debug, Serialize, Deserialize)]
pub struct MapaCabecalho {
    pub parametro_nome: String,
    pub pop_codigo: Option<String>,
    pub pop_numero: Option<String>,
    pub pop_revisao: Option<String>,
    pub tecnica_nome: Option<String>,
    pub unidade: Option<String>,
    pub limite_min: Option<String>,
    pub limite_simbolo: Option<String>,
    pub limite_max: Option<String>,
    pub lqi: Option<String>,
    pub incerteza: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DefinicaoEtapa {
    pub etapa_id: u32,
    pub descricao: String,
    pub sequencia: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValorEtapa {
    pub resultado_etapa_id: u32,
    pub analise_id: u32,
    pub etapa_id: u32,
    pub valor: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LinhaMapa {
    pub analise_id: u32,
    pub resultado_id: u32,
    pub amostra_numero: String,
    pub identificacao: String,
    pub complemento: Option<String>,
    pub data_inicio: Option<String>,
    pub hora_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub hora_termino: Option<String>,
    pub resultado_final: Option<String>,
    pub usuario_ini: Option<String>,
    pub usuario_visto: Option<String>,
    
    // O Serde vai transformar isso num Objeto JSON: { "1": { ... }, "2": { ... } }
    // Onde a chave é o ID da etapa.
    pub etapas: HashMap<u32, ValorEtapa>, 
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MapaResponse {
    pub cabecalho: MapaCabecalho,
    pub colunas_etapas: Vec<DefinicaoEtapa>,
    pub linhas: Vec<LinhaMapa>,
}

// --- ESCRITA (Payload de Salvamento) ---

#[derive(Debug, Serialize, Deserialize)]
pub struct SalvarMapaPayload {
    pub itens: Vec<ItemSalvar>,
    pub usuario_id: u32,
    pub computador: Option<String>,
    pub ip: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemSalvar {
    pub resultado_id: u32,
    pub analise_id: u32,
    pub data_inicio: Option<String>,
    pub hora_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub hora_termino: Option<String>,
    pub resultado_final: Option<String>,
    
    // Chave: ID da Etapa (mapa_etapa.id), Valor: String digitada
    pub etapas: Option<HashMap<u32, String>>, 
    
    pub vistar: bool,
}