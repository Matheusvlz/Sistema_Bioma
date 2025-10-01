// Em: src-tauri/src/model/estoque.rs
use bigdecimal::BigDecimal;
use serde::{Serialize, Deserialize};
use chrono::{NaiveDate, NaiveTime};

// Struct para receber os detalhes de um item da API
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct EstoqueItemDetalhado {
    pub id: u32,
    pub nome: String,
    pub minimo: i32,
    pub ativo: bool,
    pub unidade: String,
    // --- CORREÇÃO ---
    // Alterado de Option<i64> para Option<BigDecimal>
    pub saldo_atual: Option<BigDecimal>,
}

// Struct para receber um registro de movimentação da API
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct EstoqueRegistro {
    pub data: NaiveDate,
    pub hora: NaiveTime,
    pub entrada: bool,
    pub quantidade: i32,
    pub observacao: Option<String>,
}

// Struct para a resposta completa da API (detalhes + histórico)
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct EstoqueCompletoResponse {
    pub detalhes: EstoqueItemDetalhado,
    pub historico: Vec<EstoqueRegistro>,
}

// Estrutura para a resposta paginada da API
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct PaginatedEstoqueResponse {
    pub items: Vec<EstoqueItemDetalhado>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}


// --- PAYLOADS ---
// Struct para RECEBER os dados do formulário de Item de Estoque do Frontend
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct EstoqueItemPayload {
    pub nome: String,
    // pub unidade_id: u32, // <-- REMOVER
    pub unidade: String, // <-- CORREÇÃO
    pub minimo: i32,
    pub ativo: Option<bool>,
}

// Struct para ENVIAR dados de um NOVO item para a API REST
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovoEstoqueItemApiPayload {
    pub nome: String,
    // pub unidade_id: u32, // <-- REMOVER
    pub unidade: String, // <-- CORREÇÃO
    pub minimo: i32,
}

// Struct para ENVIAR dados de um item ATUALIZADO para a API REST
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoEstoqueItemApiPayload {
    pub nome: String,
    // pub unidade_id: u32, // <-- REMOVER
    pub unidade: String, // <-- CORREÇÃO
    pub minimo: i32,
    pub ativo: bool,
}

// Struct para RECEBER os dados do formulário de REGISTRO do Frontend
#[derive(Debug, Serialize, Deserialize)] // <-- ADICIONE Serialize AQUI
#[allow(non_snake_case)]
pub struct EstoqueRegistroPayload {
    pub data: NaiveDate,
    pub hora: NaiveTime,
    pub entrada: bool,
    pub quantidade: i32,
    pub observacao: String,
}