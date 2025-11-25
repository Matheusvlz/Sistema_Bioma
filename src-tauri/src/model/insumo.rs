// src-tauri/src/models/insumo.rs

use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr};

// --- ESTRUTURAS DE LEITURA (Recebidas da API) ---

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoDetalhado {
    pub id: u32,
    pub nome: String,
    pub tipo_id: u32,
    pub tipo_nome: String,
    pub unidade: Option<String>,
    pub editable: bool,
}

#[serde_as] // Necessário para o BigDecimal
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct InsumoMateriaPrimaDetalhado {
    pub insumo_materia_prima_id: u32,
    pub materia_prima_id: u32,
    pub materia_prima_nome: String,
    #[serde_as(as = "DisplayFromStr")] // API envia BigDecimal como string
    pub quantidade: BigDecimal,
    pub unidade: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoCompletoDetalhado {
    pub id: u32,
    pub nome: String,
    pub tipo_id: u32,
    pub tipo_nome: String,
    pub unidade: Option<String>,
    pub editable: bool,
    pub materias_primas: Vec<InsumoMateriaPrimaDetalhado>,
}

// --- ESTRUTURAS DE SUPORTE (Recebidas da API) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnidadeOption {
    pub nome: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InsumoTipoOption {
    pub id: u32,
    pub nome: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MateriaPrimaOption {
    pub id: u32,
    pub nome: String,
    pub tipo: u32, // ID do materia_prima_tipo
    pub unidade: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct MateriaPrimaGrupo {
    pub tipo_id: u32,
    pub tipo_nome: String,
    pub itens: Vec<MateriaPrimaOption>,
}

/// Otimização V8.0: Struct unificada para carregar todo o formulário
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoSuporteFormulario {
    pub tipos: Vec<InsumoTipoOption>,
    pub unidades: Vec<UnidadeOption>,
    pub grupos_mp: Vec<MateriaPrimaGrupo>,
}

// --- ESTRUTURAS DE PAYLOAD (Enviadas pelo Frontend e para a API) ---

/// Sub-struct para a "receita" no payload
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoMateriaPrimaPayload {
    pub materia_prima_id: u32,
    pub quantidade: String, // Frontend envia String, API (Axum) parseia para BigDecimal
}

/// Payload recebido do Frontend (via comando Tauri)
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct InsumoPayload {
    pub nome: String,
    pub tipo_id: u32,
    pub unidade: Option<String>,
    pub materias_primas: Vec<InsumoMateriaPrimaPayload>,
}

/// Payload formatado para a API de CRIAÇÃO
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovaInsumoApiPayload {
    pub nome: String,
    pub tipo_id: u32,
    pub unidade: Option<String>,
    pub materias_primas: Vec<InsumoMateriaPrimaPayload>,
}

/// Payload formatado para a API de ATUALIZAÇÃO
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct AtualizacaoInsumoApiPayload {
    pub nome: String,
    pub tipo_id: u32,
    pub unidade: Option<String>,
    pub materias_primas: Vec<InsumoMateriaPrimaPayload>,
}