use serde::{Serialize, Deserialize};

// 1. Struct para LER dados e mostrar no frontend (tem ID).
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Consultor {
    pub id: Option<u32>,
    pub nome: Option<String>,
    pub documento: Option<String>,
    pub telefone: Option<String>,
    pub email: Option<String>,
    pub ativo: Option<i8>,
}
// 2. Struct para ENVIAR dados para a API REST (tem o formato da API).
#[derive(Debug, Serialize)]
pub struct NovoConsultor {
    pub nome: Option<String>,
    pub documento: Option<String>,
    pub telefone: Option<String>,
    pub email: Option<String>,
    pub ativo: Option<i8>,
}

// 👇 3. Struct para RECEBER dados do formulário de criação (NÃO tem ID).
#[derive(Debug, Deserialize)]
pub struct CriarConsultorPayload {
    pub nome: String, // Nome pode ser String aqui se for obrigatório
    pub documento: Option<String>,
    pub telefone: Option<String>,
    pub email: Option<String>,
    pub ativo: bool,
}

// Função para deserializar o `Option<i8>` da API REST para um `bool` no Tauri.
fn deserialize_ativo_para_bool<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Option::<i8>::deserialize(deserializer).map(|opt| opt.unwrap_or(0) == 1)
}