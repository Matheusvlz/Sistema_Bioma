// src/model/usuario_com_telas.rs
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use crate::model::common::TelaPermitida; // Certifique-se de que este caminho está correto
use crate::model::kanban_card::DbKanbanCardData; // Importe DbKanbanCardData

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UsuarioAtivoComTelas {
    pub id: u32,
    pub nome: String,
    pub privilegio: Option<String>,
    pub empresa: Option<u32>,
    pub ativo: bool,
    pub nome_completo: Option<String>,
    pub cargo: Option<String>,
    pub numero_doc: Option<String>,
    pub profile_photo_path: Option<String>,
    pub dark_mode: bool,
    pub cor: Option<String>,

    #[sqlx(skip)]
    pub telas_acesso: Vec<TelaPermitida>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct X9Response {
    pub usuarios_ativos_com_telas: Vec<UsuarioAtivoComTelas>,
    pub total_usuarios_ativos: i64,
    pub kanban_cards: Vec<DbKanbanCardData>, // Use DbKanbanCardData aqui
}