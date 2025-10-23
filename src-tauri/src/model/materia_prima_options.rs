// src-tauri/src/model/materia_prima_options.rs

use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MateriaPrimaTipoOption {
    pub id: u32,
    pub nome: String,
}

// ADICIONE A STRUCT ABAIXO
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnidadeOption {
    pub nome: String,
}