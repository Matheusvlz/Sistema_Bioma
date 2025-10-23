// src-tauri/src/commands/amostra_controller.rs
use serde::{Deserialize, Serialize};
use reqwest::Client;
use tauri::command;
use tauri::AppHandle;
use crate::config::get_api_url;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AmostraNaoIniciadaItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ParametroItem {
    pub id: u32,
    pub nome_parametro: Option<String>,
    pub grupo_parametro: Option<String>,
    pub tecnica_nome: Option<String>,
    pub unidade: Option<String>,
    pub limite: Option<String>,
    pub resultado: Option<String>,
    pub data_inicio: Option<String>,
    pub hora_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub hora_termino: Option<String>,
    pub analista: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AmostraDetalheResponse {
    pub id_amostra: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub data_coleta: Option<String>,
    pub hora_coleta: Option<String>,
    pub data_entrada_lab: Option<String>,
    pub hora_entrada_lab: Option<String>,
    pub data_inicio_analise: Option<String>,
    pub parametros: Vec<ParametroItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct IniciarAmostraPayload {
    pub id_analise: u32,
    pub data_inicio: String,
    pub hora_inicio: String,
    pub id_usuario: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

// --- Comandos Tauri ---

#[tauri::command]
pub async fn buscar_amostras_nao_iniciadas(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<AmostraNaoIniciadaItem>>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/amostras-nao-iniciadas", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<Vec<AmostraNaoIniciadaItem>>().await {
                        Ok(data) => Ok(ApiResponse {
                            success: true,
                            data: Some(data),
                            message: None,
                        }),
                        Err(e) => Err(format!("Erro ao processar resposta: {}", e)),
                    }
                }
                status => Err(format!("Erro do servidor: {}", status)),
            }
        }
        Err(e) => Err(format!("Erro de conexão: {}", e)),
    }
}

// COMANDO CORRIGIDO - aceita id_analise com underscore
#[tauri::command]
pub async fn obter_detalhes_amostra(
    app_handle: AppHandle,
    id_analise: u32,  // IMPORTANTE: nome do parâmetro deve ser id_analise (snake_case)
) -> Result<ApiResponse<AmostraDetalheResponse>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/amostras-nao-iniciadas/{}", api_url, id_analise);

    println!("Buscando detalhes da amostra ID: {}", id_analise); // Debug

    match client.get(&url).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<AmostraDetalheResponse>().await {
                        Ok(data) => {
                            println!("Dados recebidos com sucesso"); // Debug
                            Ok(ApiResponse {
                                success: true,
                                data: Some(data),
                                message: None,
                            })
                        },
                        Err(e) => {
                            eprintln!("Erro ao processar JSON: {}", e);
                            Err(format!("Erro ao processar resposta: {}", e))
                        }
                    }
                }
                reqwest::StatusCode::NOT_FOUND => {
                    Err("Amostra não encontrada".to_string())
                }
                status => {
                    eprintln!("Erro do servidor: {}", status);
                    Err(format!("Erro do servidor: {}", status))
                }
            }
        }
        Err(e) => {
            eprintln!("Erro de conexão: {}", e);
            Err(format!("Erro de conexão: {}", e))
        }
    }
}

// COMANDO CORRIGIDO - recebe struct com snake_case
#[tauri::command]
pub async fn iniciar_amostra_analise(
    app_handle: AppHandle,
    id_analise: u32,  // snake_case
    data_inicio: String, // snake_case
    hora_inicio: String, // snake_case
    id_usuario: u32, // snake_case
) -> Result<ApiResponse<()>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/amostras-nao-iniciadas/iniciar", api_url);

    let payload = IniciarAmostraPayload {
        id_analise,
        data_inicio,
        hora_inicio,
        id_usuario,
    };

    println!("Enviando payload: {:?}", payload); // Debug

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    println!("Amostra iniciada com sucesso!"); // Debug
                    Ok(ApiResponse {
                        success: true,
                        data: None,
                        message: Some("Amostra iniciada com sucesso!".to_string()),
                    })
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    eprintln!("Erro do servidor: {} - {}", status, body);
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => {
            eprintln!("Erro de conexão: {}", e);
            Err(format!("Erro de conexão: {}", e))
        }
    }
}