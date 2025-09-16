// Sistema_Bioma/src-tauri/src/model/calculo.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Formula {
    pub id: i32,
    pub name: String,
    pub description: Option<String>,
    pub expression: String,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// Structs para os payloads que enviaremos para a API
// CORRIGIDO: Adicionado 'Deserialize' para que o Tauri possa receber esta struct do frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateFormulaPayload {
    pub name: String,
    pub description: Option<String>,
    pub expression: String,
}

// CORRIGIDO: Adicionado 'Deserialize'
#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateFormulaPayload {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expression: Option<String>,
}