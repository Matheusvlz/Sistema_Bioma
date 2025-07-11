use serde::{Deserialize, Serialize};

// Common structs for the overall response structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelaPermitida {
    pub id: i32,
    pub nome: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RespostaTela<T> {
    pub telas: Vec<TelaPermitida>,
    pub dados: T,
    #[serde(rename = "firstScreenName")]
    pub first_screen_name: Option<String>,
}

// Payloads for sending data to the Axum API
#[derive(Serialize)]
pub struct PayloadInicio {
    pub user_id: u32,
}

#[derive(Deserialize, Serialize)]
pub struct PayloadInicio2 {
    pub user_id: u32,
    pub tela: String, // tela enviada no JSON
}