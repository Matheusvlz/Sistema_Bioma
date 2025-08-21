use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
#[allow(non_snake_case)]
pub struct Pop {
    pub id: u32,
    pub codigo: Option<String>,
    pub numero: Option<String>,
    pub revisao: Option<String>,
    pub tecnica: Option<String>,
    pub IDTECNICA: Option<u8>,
    pub obs: Option<String>,
    // Converte o `0` ou `1` que vem da API em `true` ou `false` para o frontend.
    #[serde(deserialize_with = "deserialize_estado_para_bool", default)]
    pub ESTADO: bool,
    pub OBJETIVO: Option<String>,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Deserialize)]
#[allow(non_snake_case)]
pub struct PopPayload {
    pub id: Option<u32>,
    pub codigo: String,
    pub numero: String,
    pub revisao: String,
    pub tecnica: String,
    pub IDTECNICA: u8,
    pub obs: Option<String>,
    pub ESTADO: bool,
    pub OBJETIVO: Option<String>,
}

// Struct para ENVIAR dados para a API REST.
#[derive(Debug, Serialize)]
#[allow(non_snake_case)]
pub struct NovoPopApiPayload {
    pub codigo: String,
    pub numero: String,
    pub revisao: String,
    pub tecnica: String,
    pub IDTECNICA: u8,
    pub obs: Option<String>,
    pub ESTADO: i8,
    pub OBJETIVO: Option<String>,
}

// Função para deserializar o `Option<i8>` da API REST para um `bool` no Tauri.
fn deserialize_estado_para_bool<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Option::<i8>::deserialize(deserializer).map(|opt| opt.unwrap_or(0) == 1)
}
