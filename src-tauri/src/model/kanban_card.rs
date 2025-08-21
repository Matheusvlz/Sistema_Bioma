// src/model/kanban_card.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// Struct para dados recebidos do frontend (desserialização JSON)
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FrontendKanbanCardData {
    pub id: i32,

    #[serde(rename = "nivel_preocupacao")]
    pub urgencia: Option<i32>, 

    #[serde(rename = "type")]
    pub card_type: String,

    pub title: String,

    pub description: Option<String>,

    #[serde(rename = "userId")]
    pub user_id: Option<i32>,

    #[serde(rename = "userPhoto")]
    pub user_photo_url: Option<String>,

    pub tags: String, // Frontend envia String JSON

    #[serde(rename = "card_color")]
    pub card_color: Option<String>,
}

// Struct para dados armazenados/recuperados do banco de dados (SQLx FromRow)
// Esta struct deve corresponder EXATAMENTE às colunas da sua tabela `kanban_cards`.
#[derive(Debug, Serialize, Deserialize, FromRow, Clone)]
pub struct DbKanbanCardData {
    pub id: i32,
    pub urgencia: Option<i32>, 
    pub title: String,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub user_photo_url: Option<String>,
    pub tags: String, // CORRIGIDO: String (com 'S' maiúsculo)
    pub card_color: Option<String>, // Adicionado novamente, pois estava faltando
}


// Struct para o payload enviado para a API Axum (serialização JSON)
// Esta struct representa o que o Tauri envia para o backend Axum.
#[derive(Debug, Serialize)]
pub struct ApiKanbanPayload {
    pub urgencia: i8, // Corresponde ao i8 do frontend
    pub card_type: String,
    pub title: String,
    pub description: Option<String>,
    pub user_id: Option<i32>,
    pub user_photo_url: Option<String>,
    pub tags: String, // CORRIGIDO: String (com 'S' maiúsculo)
    pub card_color: Option<String>, // Adicionado novamente, pois estava faltando
}