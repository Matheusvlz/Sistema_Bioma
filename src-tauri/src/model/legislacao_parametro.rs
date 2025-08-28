use serde::{Serialize, Deserialize};
use bigdecimal::BigDecimal;

// Struct para receber dados detalhados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct LegislacaoParametroDetalhado {
    pub id: u32,
    pub legislacao: u32,
    pub nome_legislacao: Option<String>,
    pub tipo: Option<String>,
    pub matriz: Option<String>,
    pub parametro_pop: u32,
    pub nome_parametro: Option<String>,
    pub nome_tecnica: Option<String>,
    pub pop_codigo: Option<String>,
    pub pop_numero: Option<String>,
    pub pop_revisao: Option<String>,
    pub unidade: Option<String>,
    pub limite_min: Option<String>,
    pub limite_simbolo: Option<String>,
    pub limite_max: Option<String>,
    pub valor: Option<BigDecimal>,
    #[serde(deserialize_with = "deserialize_ativo_para_bool", default)]
    pub ativo: bool,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Deserialize)]
pub struct LegislacaoParametroPayload {
    pub id: Option<u32>,
    pub legislacao: u32,
    pub tipo: String,
    pub matriz: String,
    pub parametro_pop: u32,
    pub unidade: String,
    pub limite_min: Option<String>,
    pub limite_simbolo: Option<String>,
    pub limite_max: Option<String>,
    pub valor: Option<BigDecimal>,
    pub ativo: bool,
}

// Structs para ENVIAR dados para a API REST.

#[derive(Debug, Serialize)]
pub struct NovaLegislacaoParametroApiPayload {
    pub legislacao: u32,
    pub tipo: String,
    pub matriz: String,
    pub parametro_pop: u32,
    pub unidade: String,
    pub limite_min: Option<String>,
    pub limite_simbolo: Option<String>,
    pub limite_max: Option<String>,
    pub valor: Option<BigDecimal>,
}

#[derive(Debug, Serialize)]
pub struct AtualizacaoLegislacaoParametroApiPayload {
    pub legislacao: u32,
    pub tipo: String,
    pub matriz: String,
    pub parametro_pop: u32,
    pub unidade: String,
    pub limite_min: Option<String>,
    pub limite_simbolo: Option<String>,
    pub limite_max: Option<String>,
    pub valor: Option<BigDecimal>,
    pub ativo: bool,
}

// Função para deserializar o `Option<i8>` da API REST para um `bool` no Tauri.
fn deserialize_ativo_para_bool<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Option::<i8>::deserialize(deserializer).map(|opt| opt.unwrap_or(0) == 1)
}
