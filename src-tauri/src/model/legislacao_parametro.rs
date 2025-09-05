// src-tauri/src/model/legislacao_parametro.rs

use serde::{Serialize, Deserialize};
use bigdecimal::BigDecimal;
// --- ADICIONADO ---
use serde_with::{serde_as, DisplayFromStr};

#[serde_as] // <-- ADICIONADO
#[derive(Debug, Serialize, Deserialize)] // FromRow não é necessário aqui
#[allow(non_snake_case)]
pub struct LegislacaoParametroDetalhado {
    pub id: u32,
    pub legislacao: u32,
    pub nome_legislacao: Option<String>,
    pub tipo: Option<String>,
    pub matriz: Option<String>,
    pub parametro_pop: u32,
    pub nome_parametro: Option<String>,
    pub grupo: Option<String>,
    pub nome_tecnica: Option<String>,
    pub pop_codigo: Option<String>,
    pub pop_numero: Option<String>,
    pub pop_revisao: Option<String>,
    pub objetivo: Option<String>,
    pub incerteza: Option<String>,
    pub lqi: Option<String>,
    pub lqs: Option<String>,
    pub unidade: Option<String>,
    pub limite_min: Option<String>,
    pub limite_simbolo: Option<String>,
    pub limite_max: Option<String>,
    // --- CAMPO CORRIGIDO ---
    // Esta anotação "ensina" o serde a converter o texto da API para BigDecimal
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor: Option<BigDecimal>,
    pub ativo: bool,
}


// Estrutura para a resposta paginada.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct PaginatedLegislacaoParametroResponse {
    pub items: Vec<LegislacaoParametroDetalhado>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}

// Estrutura para receber os dados do formulário do Frontend (via comando Tauri).
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct LegislacaoParametroPayload {
    pub legislacao: u32,
    pub tipo: String,
    pub matriz: String,
    pub parametro_pop: u32,
    pub unidade: String,
    pub limite_min: String,
    pub limite_simbolo: String,
    pub limite_max: String,
    pub valor: String,
    pub ativo: Option<bool>,
}

// Estrutura para enviar dados para a API REST (payload de CRIAÇÃO).
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovaLegislacaoParametroApiPayload {
    pub legislacao: u32,
    pub tipo: String,
    pub matriz: String,
    pub parametro_pop: u32,
    pub unidade: String,
    pub limite_min: String,
    pub limite_simbolo: String,
    pub limite_max: String,
    pub valor: String,
}

// Estrutura para enviar dados para a API REST (payload de ATUALIZAÇÃO).
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoLegislacaoParametroApiPayload {
    pub legislacao: u32,
    pub tipo: String,
    pub matriz: String,
    pub parametro_pop: u32,
    pub unidade: String,
    pub limite_min: String,
    pub limite_simbolo: String,
    pub limite_max: String,
    pub valor: String,
    pub ativo: bool,
}