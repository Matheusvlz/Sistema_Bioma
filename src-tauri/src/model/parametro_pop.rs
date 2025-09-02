use serde::{Serialize, Deserialize};
use rust_decimal::Decimal; 
use serde_with::{serde_as, DisplayFromStr};


// Struct para receber dados da API e para comunicação com o Frontend.
#[serde_as] 
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct ParametroPopDetalhado {
    pub id: u32,
    pub id_parametro: u32,
    pub nome_parametro: Option<String>,
    pub grupo: Option<String>,
    pub id_pop: u32,
    pub pop_codigo: Option<String>,
    pub pop_numero: Option<String>,
    pub pop_revisao: Option<String>,
    pub nome_tecnica: Option<String>,
    pub id_metodologia: Option<u32>,
    pub nome_metodologia: Option<String>,
    pub tempo: Option<u8>,
    pub quantidade_g: Option<i32>,
    pub quantidade_ml: Option<i32>,
    pub lqi: Option<Decimal>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub lqs: Option<Decimal>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub incerteza: Option<Decimal>,
    pub objetivo: Option<String>,
}

// Struct para RECEBER os dados do formulário do Frontend.
#[derive(Debug, Deserialize)]
pub struct ParametroPopPayload {
    pub id: Option<u32>,
    pub parametro: u32,
    pub pop: u32,
    pub metodologia: Option<u32>,
    pub tempo: u8,
    pub quantidade_g: i32,
    pub quantidade_ml: i32,
}

// 👇 ADICIONAMOS AS STRUCTS QUE FALTAVAM ABAIXO

// Struct para ENVIAR dados para a API REST ao criar.
#[derive(Debug, Serialize)]
pub struct NovoParametroApiPayload {
    pub parametro: u32,
    pub pop: u32,
    pub metodologia: Option<u32>,
    pub tempo: u8,
    pub quantidade_g: i32,
    pub quantidade_ml: i32,
}

// Struct para ENVIAR dados para a API REST ao editar.
#[derive(Debug, Serialize)]
pub struct AtualizacaoParametroPop {
    pub metodologia: Option<u32>,
    pub tempo: u8,
    pub quantidade_g: i32,
    pub quantidade_ml: i32,
}

// --- NOVA STRUCT ---
// Struct para receber o payload de atualização de LQ/Incerteza do Frontend
// e para enviar para a API.
#[derive(Debug, Serialize, Deserialize)]
pub struct AtualizacaoLqIncertezaPayload {
    pub lqi: Option<String>,
    pub incerteza: Option<String>,
}

