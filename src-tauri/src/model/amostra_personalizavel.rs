// src-tauri/src/model/laboratorio/amostra_personalizavel.rs

use serde::{Deserialize, Serialize};

// Struct para receber os dados detalhados da API.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct AmostraPersonalizavelDetalhado {
    pub id: u32,
    pub numero: u32,
    pub hora_coleta: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub condicoes_amb: Option<String>,
    pub unidade: Option<String>,
    pub formacoleta: Option<String>,
    pub area_amostrada: Option<String>,
    pub unidade_amostrada: Option<String>,
    pub protocolo_cliente: Option<String>,
    pub remessa_cliente: Option<String>,
    pub certificado_tipo_nome: String,
    pub is_editavel: i64,
}

// Struct para o payload enviado do Frontend para o Tauri, e do Tauri para a API.
// Neste caso, é idêntico ao que a API espera.
#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct AmostraPersonalizavelPayload {
    pub id: u32,
    pub hora_coleta: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub condicoes_amb: Option<String>,
    pub unidade: Option<String>,
    pub formacoleta: Option<String>,
    pub area_amostrada: Option<String>,
    pub unidade_amostrada: Option<String>,
    pub protocolo_cliente: Option<String>,
    pub remessa_cliente: Option<String>,
}