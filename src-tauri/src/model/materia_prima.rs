// src-tauri/src/models/materia_prima.rs

use serde::{Serialize, Deserialize};
use bigdecimal::BigDecimal;
use serde_with::{serde_as, DisplayFromStr};

// Struct para DESSERIALIZAR a resposta da API (o que recebemos).
#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct MateriaPrimaDetalhado {
    pub id: u32,
    pub nome: String,
    pub tipo_id: u32,
    pub nome_tipo: String,
    // A anotação abaixo ensina o Serde a converter a string do JSON em um BigDecimal.
    #[serde_as(as = "DisplayFromStr")]
    pub quantidade_min: BigDecimal,
    pub unidade: String,
    pub editavel: bool,
}

// Struct para a resposta paginada da API.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct PaginatedMateriaPrimaResponse {
    pub items: Vec<MateriaPrimaDetalhado>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}

// Struct para RECEBER os dados do formulário do Frontend.
// Note que `quantidade_min` vem como String, pois campos de formulário são texto.
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct MateriaPrimaPayload {
    pub nome: String,
    pub tipo: u32,
    pub quantidade_min: String,
    pub unidade: String,
}

// Struct para ENVIAR dados para a API REST (payload de CRIAÇÃO).
// Corresponde à struct `NovaMateriaPrima` da API.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovaMateriaPrimaApiPayload {
    pub nome: String,
    pub tipo: u32,
    pub quantidade_min: String,
    pub unidade: String,
}

// Struct para ENVIAR dados para a API REST (payload de ATUALIZAÇÃO).
// Corresponde à struct `AtualizacaoMateriaPrima` da API.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoMateriaPrimaApiPayload {
    pub nome: String,
    pub tipo: u32,
    pub quantidade_min: String,
    pub unidade: String,
}