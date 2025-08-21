use serde::{Serialize, Deserialize};

// Struct para receber dados da API e para comunicação com o Frontend.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Parametro {
    pub id: u32,
    pub nome: Option<String>,
    pub grupo: Option<String>,
    pub obs: Option<String>,
    // Converte o `0` ou `1` que vem da API em `true` ou `false` para o frontend.
    #[serde(deserialize_with = "deserialize_em_campo_para_bool", default)]
    pub em_campo: bool,
}

// Struct para receber os dados do formulário do Frontend ao criar ou editar.
#[derive(Debug, Deserialize)]
pub struct ParametroPayload {
    pub id: Option<u32>,
    pub nome: String,
    pub grupo: String,
    pub obs: Option<String>,
    pub em_campo: bool,
}

// Struct para ENVIAR dados para a API REST.
#[derive(Debug, Serialize)]
pub struct NovoParametroApiPayload {
    pub nome: String,
    pub grupo: String,
    pub obs: Option<String>,
    pub em_campo: i8,
}

// Função para deserializar o `Option<i8>` da API REST para um `bool` no Tauri.
fn deserialize_em_campo_para_bool<'de, D>(deserializer: D) -> Result<bool, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Option::<i8>::deserialize(deserializer).map(|opt| opt.unwrap_or(0) == 1)
}
