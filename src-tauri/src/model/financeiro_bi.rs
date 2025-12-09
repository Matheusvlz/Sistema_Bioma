use serde::{Serialize, Deserialize};
use bigdecimal::BigDecimal;
use serde_with::{serde_as, DisplayFromStr}; // Importante para lidar com os números que vêm como String

// --- Payload de Entrada (O que o React manda para filtrar) ---
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FiltrosDashboardPayload {
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
    pub cliente_id: Option<u32>,
    pub apenas_erros: Option<bool>,
}

// --- Resposta da Tabela (Espelho do JSON da API) ---
#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct AuditoriaDetalheResponse {
    pub id_parcela: u32,
    pub id_fatura: u32,
    pub numero_nf: Option<String>,
    pub numero_parcela: Option<u8>, // Option<u8> conforme corrigimos na API
    pub total_parcelas: i64,
    
    pub id_cliente: u32,
    pub nome_cliente: String,

    // Datas vêm como String "YYYY-MM-DD" do JSON, o serde trata isso nativamente para String
    pub data_vencimento: String, 
    pub data_pagamento: Option<String>,

    // Valores vêm como String "488.33". Usamos DisplayFromStr para o Rust entender como BigDecimal
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_previsto: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_pago: Option<BigDecimal>,
    
    pub status_financeiro: String,

    // Comercial
    pub orcamento_origem: Option<String>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_orcado: Option<BigDecimal>,
    pub responsavel_frete: Option<String>,
    pub responsavel_coleta: Option<String>,

    // Operacional
    pub data_coleta: Option<String>,
    pub coletor_nome: Option<String>,
    pub dias_delay_faturamento: Option<i64>,

    // RPA
    pub rpa_status: Option<String>,
    pub rpa_data_envio: Option<String>,
    pub rpa_erro: Option<String>,
}

// --- Resposta dos KPIs ---
#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
pub struct KpiResponse {
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub total_previsto: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub total_recebido: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub total_inadimplente: Option<BigDecimal>,
    
    pub qtd_falhas_robo: i64,
}