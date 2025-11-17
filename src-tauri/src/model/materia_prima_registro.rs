// src-tauri/src/models/laboratorio/materia_prima_registro.rs

use serde::{Serialize, Deserialize};
use rust_decimal::Decimal as BigDecimal;
use chrono::NaiveDate;
// REMOVEMOS O 'use serde_with::...' COMPLETAMENTE

// -----------------------------------------------------------------------------
// STRUCT PARA RECEBER DADOS DA API (Leitura)
// -----------------------------------------------------------------------------
// REMOVEMOS O '#[serde_as]' DAQUI
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct MateriaPrimaRegistroDetalhado {
    pub id: u32,
    
    // REMOVEMOS AS ANOTAÇÕES '#[serde_as(...)]' DE TODOS OS CAMPOS
    // O seu Cargo.toml já lida com Option<String> e ""
    pub fabricante: Option<String>,
    pub lote_fabricante: Option<String>,
    
    // O feature "serde" do chrono no Cargo.toml já lida com isso
    pub data_fabricacao: Option<NaiveDate>,
    pub validade: Option<NaiveDate>,
    
    pub nf: Option<String>,

    // O feature "serde-with-str" do rust_decimal no Cargo.toml já lida com isso
    pub quantidade: Option<BigDecimal>,
    pub pureza: Option<BigDecimal>,
    
    pub observacao: Option<String>,
    
    pub obsoleto: bool,
    pub finalizado: bool,
    pub ativo: bool,

    pub materia_prima_id: Option<u32>,
    pub nome_materia_prima: Option<String>,
    pub unidade: Option<String>,

    pub materia_prima_tipo_id: Option<u32>,
    pub nome_materia_prima_tipo: Option<String>,
}

// Struct para a resposta paginada (deve corresponder à API)
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct PaginatedMateriaPrimaRegistroResponse {
    pub items: Vec<MateriaPrimaRegistroDetalhado>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}

// -----------------------------------------------------------------------------
// STRUCT PARA RECEBER DADOS DO FRONTEND (Escrita)
// -----------------------------------------------------------------------------
// Esta struct estava correta e não é alterada
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct MateriaPrimaRegistroPayload {
    pub materia_prima: u32,
    pub fabricante: String,
    pub lote_fabricante: String,
    pub validade: String, // Ex: "31/12/2025"
    pub data_fabricacao: String, // Ex: "01/01/2025"
    pub quantidade: String, // Ex: "123,45"
    pub pureza: String, // Ex: "99,5"
    pub nf: String,
    pub observacao: String,
}

// -----------------------------------------------------------------------------
// STRUCTS PARA ENVIAR DADOS PARA A API (Escrita)
// -----------------------------------------------------------------------------
// Estas structs estavam corretas e não são alteradas

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovaMateriaPrimaRegistroApiPayload {
    pub materia_prima: u32,
    pub fabricante: String,
    pub lote_fabricante: String,
    pub validade: NaiveDate,
    pub data_fabricacao: NaiveDate,
    pub quantidade: BigDecimal,
    pub pureza: BigDecimal,
    pub nf: String,
    pub observacao: String,
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoMateriaPrimaRegistroApiPayload {
    pub materia_prima: u32,
    pub fabricante: String,
    pub lote_fabricante: String,
    pub validade: NaiveDate,
    pub data_fabricacao: NaiveDate,
    pub quantidade: BigDecimal,
    pub pureza: BigDecimal,
    pub nf: String,
    pub observacao: String,
}

// Para o PATCH de 'obsoleto' (idêntico ao da API)
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoObsoletoPayload {
    pub obsoleto: bool,
}