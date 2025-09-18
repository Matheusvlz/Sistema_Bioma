// Em Sistema_Bioma/src-tauri/src/model/historico.rs

use serde::{Serialize, Deserialize};
use chrono::NaiveDateTime;

// --- Structs para RECEBER da API (Deserializar, snake_case) ---

#[derive(Deserialize)]
pub struct HistoricoFromApi {
    pub usuario_nome: Option<String>,
    pub descricao: Option<String>,
    pub data_hora: Option<NaiveDateTime>,
    pub ip: Option<String>,
    pub computador: Option<String>,
}

#[derive(Deserialize)]
pub struct PaginatedHistoricoResponseFromApi {
    pub items: Vec<HistoricoFromApi>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

// --- Structs para ENVIAR para o Frontend (Serializar, camelCase) ---

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoricoToFrontend {
    pub usuario_nome: Option<String>,
    pub descricao: Option<String>,
    pub data_hora: Option<NaiveDateTime>,
    pub ip: Option<String>,
    pub computador: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginatedHistoricoResponseToFrontend {
    pub items: Vec<HistoricoToFrontend>,
    pub total: i64,
    pub page: u32,
    pub per_page: u32,
    pub total_pages: u32,
}

// --- Lógica de Conversão (Tradução) ---

impl From<HistoricoFromApi> for HistoricoToFrontend {
    fn from(api_item: HistoricoFromApi) -> Self {
        Self {
            usuario_nome: api_item.usuario_nome,
            descricao: api_item.descricao,
            data_hora: api_item.data_hora,
            ip: api_item.ip,
            computador: api_item.computador,
        }
    }
}

impl From<PaginatedHistoricoResponseFromApi> for PaginatedHistoricoResponseToFrontend {
    fn from(api_response: PaginatedHistoricoResponseFromApi) -> Self {
        Self {
            items: api_response.items.into_iter().map(Into::into).collect(),
            total: api_response.total,
            page: api_response.page,
            per_page: api_response.per_page,
            total_pages: api_response.total_pages,
        }
    }
}


// Payload que vem do frontend (já estava correto)
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoricoFilterPayload {
    pub usuario_id: Option<u32>,
    pub acao: Option<String>,
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
}