// Em src-tauri/src/models/qualidade/fornecedor.rs

use serde::{Serialize, Deserialize};

// --- ESTRUTURAS PARA DESERIALIZAR A RESPOSTA DA API ---
// Elas devem espelhar exatamente a estrutura JSON retornada pelo endpoint de busca.

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct FornecedorCategoria {
    // CORREÇÃO: Os nomes dos campos devem bater com o JSON gerado pela API.
    // A API serializa a partir do struct FornecedorCategoria do banco, que usa PascalCase.
    pub ID: u32,
    pub NOME: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct FornecedorObservacao {
    // A API retorna datas como strings no formato "YYYY-MM-DD".
    pub DATA_OBSERVACAO: Option<String>,
    pub OBSERVACAO: Option<String>,
    pub ESTADO: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct FornecedorQualificacao {
    pub ID: u32,
    pub DATA_QUALIFICACAO: Option<String>,
    pub RELATORIO: Option<String>,
    pub CERTIFICACAO: Option<String>,
    pub VALIDADE: Option<String>,
    pub AVALIACAO: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct FornecedorDetalhado {
    // Esta struct corresponde ao 'FornecedorDetalhado' da API.
    pub id: u32,
    pub nome: Option<String>,
    pub fantasia: Option<String>,
    pub documento: Option<String>,
    pub inscricao_estadual: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
    pub cep: Option<String>,
    pub telefone: Option<String>,
    pub celular: Option<String>,
    pub email: Option<String>,
    pub site: Option<String>,
    pub contato: Option<String>,
    pub qualificado: Option<i8>,
    pub obsoleto: Option<bool>,
    pub categorias: Vec<FornecedorCategoria>,
    pub observacoes: Vec<FornecedorObservacao>,
    pub qualificacoes: Vec<FornecedorQualificacao>,
}

// --- ESTRUTURAS PARA O PAYLOAD DE CRIAÇÃO/ATUALIZAÇÃO ---
// Elas devem espelhar exatamente a estrutura que o endpoint de salvar/editar da API espera receber.

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct NovaObservacaoPayload {
    // CORREÇÃO: Alinhado com a API, usando Option para maior flexibilidade.
    pub data_observacao: Option<String>, // Frontend envia data como string.
    pub observacao: Option<String>,
    pub estado: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct NovaQualificacaoPayload {
    // CORREÇÃO: Alinhado com a API.
    pub data_qualificacao: Option<String>,
    pub relatorio: Option<String>,
    pub certificacao: Option<String>,
    pub validade: Option<String>,
    pub avaliacao: Option<String>,
}

// Struct unificada para receber dados do Frontend e enviar para a API.
// CORREÇÃO: Renomeada e reestruturada para espelhar 'SalvarFornecedorPayload' da API.
// Isso elimina a necessidade de duas structs separadas e uma conversão 'From'.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct SalvarFornecedorPayload {
    pub nome: String,
    pub fantasia: String,
    pub documento: Option<String>,
    pub inscricao_estadual: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
    pub cep: Option<String>,
    pub telefone: Option<String>,
    pub celular: Option<String>,
    pub email: Option<String>,
    pub site: Option<String>,
    pub contato: Option<String>,
    pub qualificado: i8,
    pub obsoleto: bool,
    pub categorias: Option<Vec<u32>>,
    pub observacoes: Option<Vec<NovaObservacaoPayload>>,
    pub qualificacoes: Option<Vec<NovaQualificacaoPayload>>,
}

// NOVO: Struct para receber os dados da lista da API.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct FornecedorListagem {
    pub ID: u32,
    pub FANTASIA: Option<String>,
    pub NOME: Option<String>,
    pub DOCUMENTO: Option<String>,
    pub CONTATO: Option<String>,
}