use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Metodologia {
    pub ID: u32,
    pub NOME: Option<String>,
    // Converte o `0` ou `1` que vem da API em `true` ou `false` para o frontend.
    #[serde(deserialize_with = "deserialize_ativo_para_bool", default)]
    pub ATIVO: bool,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Deserialize)]
pub struct MetodologiaPayload {
    pub id: Option<u32>,
    pub nome: String,
    pub ativo: bool,
}

// Struct para ENVIAR dados para a API REST.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct MetodologiaApiPayload {
    pub NOME: String,
    pub ATIVO: i8,
}

// Função para deserializar o `Option<i8>` da API REST para um `bool` no Tauri.
fn deserialize_ativo_para_bool<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Option::<i8>::deserialize(deserializer).map(|opt| opt.unwrap_or(0) == 1)
}
