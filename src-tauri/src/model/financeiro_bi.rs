use serde::{Deserialize, Serialize};
use bigdecimal::BigDecimal;
use serde_with::{serde_as, DisplayFromStr};

// =====================================================================
// ESTRUTURAS DE LEITURA (Vêm da API -> Tauri)
// =====================================================================

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct OrcamentoAuditoriaDetalhado {
    // --- Cabeçalho ---
    pub id: u32,
    pub numero: u32,
    pub versao: String,
    pub ano: String,
    pub numero_completo: String,
    pub data_criacao: String,
    
    // --- Cliente ---
    pub id_cliente: u32,
    pub nome_cliente: String,
    pub cidade_cliente: Option<String>,

    // --- Valores ---
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_total_itens: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_frete: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_desconto: Option<BigDecimal>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_final: Option<BigDecimal>,

    // --- Listas Aninhadas ---
    pub itens: Vec<ItemOrcamentoDetalhado>,
    pub ciclo_operacional: Vec<CicloOperacionalDetalhado>, // <--- O Ponto Chave
    pub ciclo_financeiro: Vec<CicloFinanceiroDetalhado>,

    // --- Status ---
    pub status_geral: String,
    pub alertas: Vec<String>,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ItemOrcamentoDetalhado {
    pub nome: String,
    #[serde_as(as = "DisplayFromStr")]
    pub quantidade: BigDecimal,
    #[serde_as(as = "DisplayFromStr")]
    pub preco_total: BigDecimal,
}

// --- ATENÇÃO: AQUI ESTAVA O PROBLEMA ANTES ---
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct CicloOperacionalDetalhado {
    pub id_agendamento: Option<u32>,
    pub data_agendada: Option<String>,
    
    pub id_coleta: Option<u32>,
    pub numero_coleta: Option<String>,
    pub data_coleta: Option<String>, // Data simples (YYYY-MM-DD)
    
    // --- NOVOS CAMPOS OBRIGATÓRIOS ---
    // Agora o Tauri aceita ler isso do JSON da API
    pub data_hora_registro: Option<String>, // Timestamp Completo
    pub nome_coletor: Option<String>,       // Nome do Usuário
    
    pub status: String,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct CicloFinanceiroDetalhado {
    pub id_fatura: u32,
    pub numero_nf: Option<String>,
    pub data_emissao: Option<String>,
    
    pub numero_parcela: u32,
    pub data_vencimento: Option<String>,
    pub data_pagamento: Option<String>,
    
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_parcela: Option<BigDecimal>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_pago: Option<BigDecimal>,
    
    pub status: String,
}

// --- Resposta Paginada ---
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct PaginatedAuditoriaResponse {
    pub data: Vec<OrcamentoAuditoriaDetalhado>,
    pub total_registros: i64,
    pub total_paginas: i64,
    pub pagina_atual: i64,
}

// =====================================================================
// PAYLOADS (Front -> Tauri -> API)
// =====================================================================

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct FiltrosAuditoriaPayload {
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
    pub termo_busca: Option<String>,
    pub apenas_problemas: Option<bool>,
    
    pub pagina: Option<i64>,
    pub itens_por_pagina: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct ArquivoRedePayload {
    pub tipo: String, // "ORCAMENTO", "BOLETO"
    pub numero: Option<u32>,
    pub ano: Option<String>,
    pub nf: Option<String>,
    pub data_competencia: Option<String>, 
}

// =====================================================================
// PAYLOADS API (Saída para API)
// =====================================================================

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct FiltrosAuditoriaApiPayload {
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
    pub termo_busca: Option<String>,
    pub apenas_problemas: Option<bool>,
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