use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal; 
use chrono::NaiveDate;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnpaidBoletoNF {
    pub id_boleto: i32,
    pub nome_cliente: Option<String>,
    pub descricao_boleto: Option<String>,
    pub valor_boleto: Option<BigDecimal>,
    pub data_vencimento_boleto: Option<NaiveDate>,

    pub id_boleto_nf: Option<i32>,
    pub nf_numero: Option<String>,
    pub data_emissao_nf: Option<NaiveDate>,
    pub data_vencimento_nf: Option<NaiveDate>,
    pub nf_pago: Option<bool>,
    pub boleto_nf_caminho: Option<String>,
}

/// The overall response structure for the Financeiro screen,
/// focusing on categorized unpaid items.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FinanceiroResponse {
    pub boletos_vencidos: Vec<UnpaidBoletoNF>,
    pub boletos_vencem_hoje: Vec<UnpaidBoletoNF>,
    pub boletos_vencem_este_mes: Vec<UnpaidBoletoNF>,
    pub total_itens_nao_pagos: i64,
}