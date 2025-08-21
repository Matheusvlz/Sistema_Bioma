// src/models/fisico_quimico.rs

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FisicoQuimicoPendente {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub tempo: Option<String>, // Formatted date string "dd/mm/YYYY HH:MM"
    pub passou: bool,          // True if the 'tempo' deadline has passed
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FisicoQuimicoLiberacao {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FisicoQuimicoResponse {
    pub pendencias_prazo: Vec<FisicoQuimicoPendente>,
    pub total_pendencias_prazo: i64,
    pub pendencias_liberacao: Vec<FisicoQuimicoLiberacao>,
    pub total_pendencias_liberacao: i64,
}