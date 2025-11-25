// src-tauri/src/model/insumo_registro.rs
// Migração de Cadastro_Insumo_Registro.java para a Camada 2 (Tauri)

use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};
use serde_with::{serde_as, DisplayFromStr,formats::PreferMany};

// --- ESTRUTURAS DE LEITURA (Recebidas da API) ---

#[serde_as] // Habilita serde_with
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct InsumoRegistroDetalhado {
    pub id: u32,
    pub insumo_id: u32,
    pub insumo_nome: String,
    pub tipo_id: u32,
    pub tipo_nome: String,
    pub editable: bool,
    pub obsoleto: bool,
    pub fora_de_uso: bool,
    pub portatil: bool,
    pub registro: Option<String>,
    pub data_preparo: Option<String>, // API envia NaiveDate, que serde serializa como "YYYY-MM-DD"
    pub validade: Option<String>,
    #[serde_as(as = "Option<DisplayFromStr>")] // API envia BigDecimal como string
    pub quantidade: Option<BigDecimal>,
    pub fabricante: Option<String>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub fator_correcao: Option<BigDecimal>,
    pub volume: Option<String>,
    pub nota_fiscal: Option<String>,
    pub garantia: Option<String>,
    pub garantia_tempo: Option<String>,
    pub data_compra: Option<String>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub valor_equipamento: Option<BigDecimal>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub fornecedor_id: Option<u32>,
    pub observacao: Option<String>,
    pub faixa_min: Option<String>,
    pub faixa_max: Option<String>,
    #[serde_as(as = "Option<DisplayFromStr>")]
    pub desvios: Option<BigDecimal>,
}

// --- ESTRUTURAS DE PAYLOAD (Frontend -> Tauri -> API) ---
// Padrão V8.0: O Frontend envia tudo como string/primitivo,
// e a Ponte converte para o formato que a API espera.

/// Sub-struct para a "receita" no payload (ambas direções)
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct RegistroMateriaPrimaPayload {
    pub materia_prima_registro_id: u32,
    pub quantidade: String, // Frontend envia String, API (Axum) parseia para BigDecimal
}

/// Payload recebido do Frontend (via comando Tauri)
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct RegistroInsumoFrontendPayload {
    pub insumo_id: u32,
    pub registro: Option<String>,
    pub fabricante: Option<String>,
    pub volume: Option<String>,
    pub data_preparo: Option<String>, // Frontend envia string "YYYY-MM-DD" ou null
    pub validade: Option<String>,
    pub quantidade: Option<String>, // Frontend envia string "123.45" ou null
    pub fator_correcao: Option<String>,
    pub nota_fiscal: Option<String>,
    pub garantia: Option<u32>,
    pub garantia_tempo: Option<String>,
    pub fornecedor_id: Option<u32>,
    pub data_compra: Option<String>,
    pub valor_equipamento: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub observacao: Option<String>,
    pub faixa_min: Option<String>,
    pub faixa_max: Option<String>,
    pub desvios: Option<String>,
    pub fora_de_uso: bool,
    pub portatil: bool,
    pub materias_primas: Vec<RegistroMateriaPrimaPayload>,
}

/// Payload formatado para a API (Axum)
/// Neste caso, a API espera os mesmos tipos do frontend (strings para datas/decimais)
/// então a struct é quase idêntica, mas separada por segurança (Padrão V8.0)
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovoRegistroInsumoApiPayload {
    pub insumo_id: u32,
    pub registro: Option<String>,
    pub fabricante: Option<String>,
    pub volume: Option<String>,
    pub data_preparo: Option<String>,
    pub validade: Option<String>,
    pub quantidade: Option<String>,
    pub fator_correcao: Option<String>,
    pub nota_fiscal: Option<String>,
    pub garantia: Option<u32>,
    pub garantia_tempo: Option<String>,
    pub fornecedor_id: Option<u32>,
    pub data_compra: Option<String>,
    pub valor_equipamento: Option<String>,
    pub modelo: Option<String>,
    pub numero_serie: Option<String>,
    pub observacao: Option<String>,
    pub faixa_min: Option<String>,
    pub faixa_max: Option<String>,
    pub desvios: Option<String>,
    pub fora_de_uso: bool,
    pub portatil: bool,
    pub materias_primas: Vec<RegistroMateriaPrimaPayload>,
}

// --- ESTRUTURAS DE SUPORTE (Recebidas da API) ---

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FornecedorOption {
    pub id: u32,
    pub nome: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InsumoOption {
    pub id: u32,
    pub nome: String,
    pub unidade: Option<String>,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct MateriaPrimaRequerida {
    pub id: u32,
    pub nome: String,
    pub unidade: Option<String>,
    #[serde_as(as = "DisplayFromStr")]
    pub quantidade: BigDecimal,
}

#[serde_as]
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct MateriaPrimaRegistroDisponivel {
    pub id: u32,
    pub fabricante: Option<String>,
    pub lote_fabricante: Option<String>,
    pub validade: Option<String>, // API envia NaiveDate como "YYYY-MM-DD"
    #[serde_as(as = "DisplayFromStr")]
    pub quant_restante: BigDecimal,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct ReceitaEstoqueItem {
    pub mp_requerida: MateriaPrimaRequerida,
    pub estoque_disponivel: Vec<MateriaPrimaRegistroDisponivel>,
}

/// Estrutura unificada para carregar o formulário (Padrão V8.0)
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct RegistroSuporteFormulario {
    pub fornecedores: Vec<FornecedorOption>,
    pub receita_com_estoque: Vec<ReceitaEstoqueItem>,
}

// +++ ADICIONE A NOVA STRUCT AQUI +++
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InsumoTipoOption {
    pub id: u32,
    pub nome: String,
}