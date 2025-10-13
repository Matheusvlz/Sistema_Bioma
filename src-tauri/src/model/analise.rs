// Ficheiro: src-tauri/src/model/analise.rs

use serde::{Deserialize, Serialize};

// ==========================================================================================
// PADRÃO DE RESPOSTA UNIFICADO (Sem alterações)
// ==========================================================================================
#[derive(Serialize, Debug)]
pub struct ApiResponse<T> {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self { success: true, data: Some(data), message: None }
    }
}

impl ApiResponse<()> {
    pub fn error(message: String) -> Self {
        Self { success: false, data: None, message: Some(message) }
    }
}

// ==========================================================================================
// PAYLOADS - DADOS RECEBIDOS DO FRONTEND
// Esta struct permanece com `rename_all = "camelCase"` porque ela traduz
// os dados que VÊM DO frontend para o Rust.
// ==========================================================================================
#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct FiltrosAnalisePayload {
    pub cliente_id: Option<u32>,
    pub coletor_id: Option<u32>,
    pub cidade: Option<String>,
    pub data_inicial: Option<String>,
    pub data_final: Option<String>,
    pub page: Option<u64>,
    pub per_page: Option<u64>,
    pub busca_rapida: Option<String>,
    pub export: Option<bool>,
}

// ==========================================================================================
// RESPOSTAS DA API - CORRIGIDAS PARA ESPERAR `snake_case`
// Todas as anotações `#[serde(rename = "...")]` foram removidas daqui para baixo.
// ==========================================================================================

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CidadeDropdown {
    pub cidade: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClienteDropdown {
    pub id: u32,
    pub nome_fantasia: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UsuarioDropdown {
    pub id: u32,
    pub nome: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnaliseDetalhada {
    pub coletor_nome: String,
    pub cliente_fantasia: String,
    pub cidade: String,
    pub endereco: Option<String>,
    pub bairro: Option<String>,
    pub numero: Option<String>,
    pub status: String,
    pub data_hora: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PaginatedAnalisesDetalhadasResponse {
    pub total: i64,
    pub page: u64,
    pub per_page: u64,
    pub items: Vec<AnaliseDetalhada>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnaliseAgregadaPorCliente {
    pub cliente_id: u32,
    pub cliente_fantasia: String,
    pub total_coletas: i64,
}

#[derive(Serialize, Debug)]
pub struct RequestParams<'a> {
    #[serde(rename = "clienteId", skip_serializing_if = "Option::is_none")]
    pub cliente_id: Option<u32>,
    #[serde(rename = "coletorId", skip_serializing_if = "Option::is_none")]
    pub coletor_id: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cidade: Option<&'a str>,
    #[serde(rename = "dataInicial", skip_serializing_if = "Option::is_none")]
    pub data_inicial: Option<&'a str>,
    #[serde(rename = "dataFinal", skip_serializing_if = "Option::is_none")]
    pub data_final: Option<&'a str>,
    #[serde(rename = "buscaRapida", skip_serializing_if = "Option::is_none")]
    pub busca_rapida: Option<&'a str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub export: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<u64>,
    #[serde(rename = "per_page", skip_serializing_if = "Option::is_none")]
    pub per_page: Option<u64>,
}