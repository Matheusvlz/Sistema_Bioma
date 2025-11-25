// src-tauri/src/model/reagente_limpeza_registro.rs

use serde::{Serialize, Deserialize};

// --- DADOS DE LEITURA (Vêm da API) ---

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ReagenteLimpezaRegistroDetalhado {
    pub id: u32,
    pub id_reagente: u32,
    pub nome_reagente: Option<String>,
    pub unidade: Option<String>,
    pub lote: String,
    pub fabricante: String,
    pub preparo: Option<String>,       // Vem da API formatado: dd/mm/yyyy
    pub validade: Option<String>,      // Vem da API formatado: dd/mm/yyyy
    pub data_inicial: Option<String>, 
    pub data_final: Option<String>,
    pub user_iniciado: Option<String>,
    pub user_finalizado: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ReagenteOpcao {
    pub id: u32,
    pub nome: String,
}

// --- DADOS DE ESCRITA (Vêm do Frontend) ---
// O Frontend vai enviar as datas como STRING (dd/mm/yyyy), igual ao Java antigo.
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct ReagenteLimpezaPayload {
    pub reagente_limpeza: u32,
    pub lote: String,
    pub fabricante: String,
    pub data_preparo: String, // formato esperado: dd/mm/yyyy
    pub validade: String,     // formato esperado: dd/mm/yyyy
}

// Payload para edição (só dados mutáveis)
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct ReagenteLimpezaEdicaoPayload {
    pub lote: String,
    pub fabricante: String,
    pub data_preparo: String,
    pub validade: String,
}

// Payload para Registro de Uso (Iniciar/Finalizar)
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct RegistroUsoPayload {
    pub usuario_id: u32,
    pub data: String, // formato esperado: dd/mm/yyyy
    pub tipo_registro: u8, // 1 = Início, 0 = Final
}

// --- DADOS PARA API (Saída da Ponte) ---
// A Ponte converte as datas BR para ISO (yyyy-mm-dd) antes de enviar para a API.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovoReagenteApiPayload {
    pub reagente_limpeza: u32,
    pub lote: String,
    pub fabricante: String,
    pub data_preparo: String, // ISO 8601: yyyy-mm-dd
    pub validade: String,     // ISO 8601: yyyy-mm-dd
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoReagenteApiPayload {
    pub lote: String,
    pub fabricante: String,
    pub data_preparo: String, 
    pub validade: String,
}

#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct RegistroUsoApiPayload {
    pub usuario_id: u32,
    pub data: String,
    pub tipo_registro: u8,
}