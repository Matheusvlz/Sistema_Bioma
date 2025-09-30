// src-tauri/src/models/pesquisa.rs

use serde::{Serialize, Deserialize};

// As structs nesta camada devem ser um espelho quase exato das structs da API REST,
// garantindo que os dados possam fluir sem conversões manuais.

// --- STRUCTS PARA DADOS QUE VÊM DA API E VÃO PARA O FRONTEND ---

// Recebe da API e envia para o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PesquisaDetalhada {
    pub id: u32,
    pub descricao: Option<String>,
    pub data_inicial: Option<String>,
    pub data_termino: Option<String>,
    pub modelo_id: u32,
    pub nome_modelo: Option<String>,
    pub finalizada: bool,
}

// Recebe da API e envia para o Frontend (usado nos dropdowns).
#[derive(Debug, Serialize, Deserialize)]
pub struct PesquisaModeloOption {
    pub id: u32,
    pub descricao: String,
}

// Recebe da API e envia para o Frontend.
#[derive(Debug, Serialize, Deserialize)]
pub struct PesquisaItem {
    pub id: u32,
    pub descricao: String,
}

// Recebe a resposta paginada completa da API e a envia para o Frontend.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedPesquisasResponse {
    pub items: Vec<PesquisaDetalhada>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
}

// --- STRUCTS PARA DADOS QUE VÊM DO FRONTEND E VÃO PARA A API ---

// Recebe do Frontend e envia para a API (para criar/editar).
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpsertPesquisaPayload {
    pub descricao: String,
    pub data_inicial: String,
    pub data_termino: String,
    pub modelo_id: u32,
}

// Recebe do Frontend e envia para a API (para mudar o status).
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePesquisaStatusPayload {
    pub finalizada: bool,
}

// Recebe os filtros do Frontend para passar para a API.
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PesquisaFiltros {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub modelo_id: Option<u32>,
    pub data: Option<String>,
    pub finalizada: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DestinatarioPesquisa {
    pub id: u32,
    pub nome: String,
    pub email: Option<String>,
    pub enviado: bool,
    pub respondido: bool,
    pub data_envio: Option<String>,
    pub data_resposta: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ResultadoItem {
    pub resposta: String,
    pub total: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PayloadAnaliseCritica {
    pub observacao: String,
    pub aprovado: bool,
    pub data_visto: String,
}