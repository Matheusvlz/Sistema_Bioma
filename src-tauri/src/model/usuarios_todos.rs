use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Usuario {
    pub id: u32,
    pub nome: String,
    pub ativo: bool,
    pub nome_completo: Option<String>,
    pub cargo: Option<String>,
    pub profile_photo_path: Option<String>,
}
