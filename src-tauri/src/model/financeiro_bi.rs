use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal;
use serde_with::{serde_as, DisplayFromStr};

// =====================================================================
// ESTRUTURAS DE LEITURA (Mirror da API -> Tauri)
// =====================================================================

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct BoletoAuditoriaDetalhado {
    // Dados do Boleto Pai
    pub id: u32,
    pub id_cliente: u32,
    pub nome_cliente: String,
    pub descricao: Option<String>,
    pub boleto_path: Option<String>, // Número da Nota Principal
    
    pub data_vencimento: Option<String>,
    pub data_emissao: Option<String>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_total: Option<BigDecimal>,      // Valor total esperado
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_pago_acumulado: Option<BigDecimal>, // Soma dos pagamentos
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_fatura_original: Option<BigDecimal>, 

    pub status_pagamento: String, // "PAGO", "PARCIAL", "PENDENTE", "ATRASADO"

    // Filhos
    pub itens_nf: Vec<BoletoItemNFDetalhado>,
    pub orcamento_vinculado: Option<OrcamentoVinculadoDetalhado>,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct BoletoItemNFDetalhado {
    pub id: u32,
    pub nf_numero: Option<String>,
    pub caminho_nf: Option<String>,
    pub data_emissao: Option<String>,
    pub data_vencimento: Option<String>,
    
    pub pago: bool,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_pago: Option<BigDecimal>,
    
    pub empresa: Option<String>, 
    
    #[serde(default)]
    pub arquivos_boletos: Vec<ArquivoFisicoDetalhado>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArquivoFisicoDetalhado {
    pub id: u32,
    pub caminho: String,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct OrcamentoVinculadoDetalhado {
    pub id: u32,
    pub numero_completo: String,
    pub data: String,
    
    // Matemática Financeira (Strings numéricas para o Front)
    #[serde_as(as = "DisplayFromStr")]
    pub valor_base_itens: BigDecimal,
    
    #[serde_as(as = "DisplayFromStr")]
    pub valor_frete_real: BigDecimal,
    
    #[serde_as(as = "DisplayFromStr")]
    pub valor_descontos: BigDecimal,
    
    #[serde_as(as = "DisplayFromStr")]
    pub valor_final_calculado: BigDecimal,

    // Operacional
    pub qtd_coletas: i64,
    pub resumo_coletas: Vec<String>,
}

// =====================================================================
// PAYLOADS DE FILTRO (ENTRADA DO FRONTEND)
// =====================================================================

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct FiltrosAuditoriaPayload {
    // CORREÇÃO: Campos renomeados para bater com o React e com o Controller
    pub data_inicio: String, 
    pub data_fim: String,
    
    pub cliente_id: Option<u32>,
    pub cidade: Option<String>,
    pub termo_busca: Option<String>,
    pub apenas_problemas: Option<bool>,
    pub pagina: Option<i64>,
    pub itens_por_pagina: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct ArquivoRedePayload {
    pub tipo: String,
    pub numero: Option<u32>,
    pub ano: Option<String>,
    pub nf: Option<String>,
    pub data_competencia: Option<String>,
}

// =====================================================================
// PAYLOADS DE SAÍDA (PARA A API)
// =====================================================================

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct FiltrosBoletoApiPayload {
    // A API espera 'data_vencimento...', então aqui mantemos o nome longo
    pub data_vencimento_inicio: String,
    pub data_vencimento_fim: String,
    pub cliente_id: Option<u32>,
    pub cidade: Option<String>,
    pub pagina: Option<i64>,
    pub itens_por_pagina: Option<i64>,
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct ArquivoRedeApiPayload {
    pub tipo: String,
    pub numero: Option<u32>,
    pub ano: Option<String>,
    pub nf: Option<String>,
    pub data_competencia: Option<String>,
}

// =====================================================================
// RESPOSTA PAGINADA
// =====================================================================
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct PaginatedBoletoResponse {
    pub data: Vec<BoletoAuditoriaDetalhado>,
    pub total_registros: i64,
    pub total_paginas: i64,
    pub pagina_atual: i64,
}