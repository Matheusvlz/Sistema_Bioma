use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use chrono::{DateTime, Utc, NaiveDateTime};

use crate::config::get_api_url;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Debug)]
pub struct FiltrosAmostra {
    pub cliente: Option<String>,
    pub numero_amostra_ini: Option<String>,
    pub numero_amostra_fin: Option<String>,
    pub protocolo: Option<String>,
    pub laudo: Option<String>,
    pub primeira_versao: Option<bool>,
    pub sigla: Option<String>,
    pub data_pesq1: Option<String>,
    pub data_pesq2: Option<String>,
    pub consultor_id: Option<i32>,
    pub legislacao_id: Option<i32>,
    pub cidade: Option<String>,
    pub pop_codigo: Option<String>,
    pub pop_numero: Option<String>,
    pub pop_revisao: Option<String>,
    pub parametro_id: Option<i32>,
    pub identificacao: Option<String>,
    pub relatorios: Option<i32>, // 0=todos, 1=sem certificado, 2=com certificado
    pub terceirizacao: Option<i32>, // 0=todos, 1=não, 2=sim, 3=parcial, 4=total
    pub laboratorio_terceirizado_id: Option<i32>,
    pub coletado_por: Option<String>,
}

// Estrutura para o resultado da consulta
#[derive(Deserialize, Serialize, Debug)]
pub struct AmostraResult {
    pub analise: Option<u32>,
    pub idgrupo: Option<u32>,
    pub cliente_cod: Option<u32>,
    pub numero_amostras: Option<String>,
    pub relatorio: Option<String>,
    pub cert: String,
    pub cert_versao: Option<i32>,
    pub sigla: String,
    pub numero: String,
    pub fantasia: String,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub datalab: Option<String>,
    pub horalab: Option<String>,
    pub versao: Option<String>,
    pub numero_versao: Option<u8>,
    pub status: String,
    pub protocolo_cliente: Option<String>,
    pub ano: String,
    pub mes: String,
    pub terceirizada_emitido: Option<bool>,
}

// Estrutura de resposta
#[derive(Serialize, Deserialize)]
pub struct AmostraResponse {
    pub success: bool,
    pub data: Option<Vec<AmostraResult>>,
    pub message: Option<String>,
}


#[command]
pub async fn buscar_amostras(
    app_handle: AppHandle,
    data_type: FiltrosAmostra,
) -> Result<AmostraResponse, String> {
    let endpoint = format!("visualizar/amostra");
    let client = reqwest::Client::new();
    let url = format!("{}/{}", get_api_url(&app_handle), endpoint);

    let res = client
        .post(&url)
        // A LINHA ABAIXO É A CORREÇÃO
        .json(&data_type) // Serializa a struct 'data_type' e a envia como corpo JSON
        .send()
        .await
        .map_err(|e| format!("Erro de conexão com o servidor: {:?}", e))?;

    let status = res.status();
    let body_text = res
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta do servidor: {:?}", e))?;

    if body_text.is_empty() {
        return Err(format!(
            "Resposta vazia do servidor (Status: {}) - URL: {}",
            status, url
        ));
    }

    serde_json::from_str::<AmostraResponse>(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))
}