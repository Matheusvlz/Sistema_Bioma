// src-tauri/src/model/dropdown_options.rs

use serde::{Serialize, Deserialize};

// Estrutura genérica para dropdowns simples (ID, Nome)
#[derive(Debug, Serialize, Deserialize, Clone)] // Adicionado Clone para consistência
#[allow(non_snake_case)]
pub struct DropdownOption {
    pub id: String, // GARANTA QUE ESTÁ COMO String
    pub nome: String,
}

// Estrutura específica para o dropdown de Parâmetros, que inclui o grupo
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParametroOption {
    pub id: u32,
    pub nome: String,
    pub grupo: String,
}

// Estrutura específica para o dropdown de POPs
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct PopOption {
    pub id: u32, // ID do registro parametro_pop
    pub pop_id: u32, // ID do POP em si
    pub display_name: String, // Ex: "POP XXX-YYY RZ - NOME_TECNICA"
    pub objetivo: Option<String>,
    pub incerteza: Option<String>,
    pub lqi: Option<String>,
    pub lqs: Option<String>,
}


