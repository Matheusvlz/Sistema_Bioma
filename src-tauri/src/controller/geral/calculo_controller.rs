// Sistema_Bioma/src-tauri/src/controller/geral/calculo_controller.rs

use tauri::AppHandle; // Removido Manager, pois não usamos mais .state()
use std::collections::HashMap;

// Removida a linha 'use crate::config::Config;'
use crate::model::api_response::ApiResponse;
use crate::model::calculo::{Formula, CreateFormulaPayload, UpdateFormulaPayload};

#[derive(serde::Deserialize, serde::Serialize)]
pub struct ValidatePayload {
    expression: String,
}

#[derive(serde::Deserialize, serde::Serialize)]
pub struct TestPayload {
    expression: String,
    variables: HashMap<String, f64>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ValidationResponse {
    variables: Vec<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct TestResponse {
    result: f64,
}

#[tauri::command]
pub async fn validar_formula(
    app: AppHandle,
    payload: ValidatePayload,
) -> Result<ApiResponse<ValidationResponse>, String> {
    // CORRIGIDO: Usando a função get_api_url do seu config.rs
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/validar", api_url);

    let client = reqwest::Client::new();
    match client.post(&url).json(&payload).send().await {
        Ok(res) => match res.json::<ApiResponse<ValidationResponse>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}

#[tauri::command]
pub async fn testar_formula(
    app: AppHandle,
    payload: TestPayload,
) -> Result<ApiResponse<TestResponse>, String> {
    // CORRIGIDO: Usando a função get_api_url do seu config.rs
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/testar", api_url);

    let client = reqwest::Client::new();
    match client.post(&url).json(&payload).send().await {
        Ok(res) => match res.json::<ApiResponse<TestResponse>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}

#[tauri::command]
pub async fn salvar_calculo(
    app: AppHandle,
    payload: CreateFormulaPayload,
) -> Result<ApiResponse<Formula>, String> {
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/formulas", api_url);
    
    let client = reqwest::Client::new();
    match client.post(&url).json(&payload).send().await {
        Ok(res) => match res.json::<ApiResponse<Formula>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}

#[tauri::command]
pub async fn listar_calculos(app: AppHandle) -> Result<ApiResponse<Vec<Formula>>, String> {
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/formulas", api_url);
    
    match reqwest::get(&url).await {
        Ok(res) => match res.json::<ApiResponse<Vec<Formula>>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}

#[tauri::command]
pub async fn buscar_calculo_por_id(
    app: AppHandle,
    id: i32,
) -> Result<ApiResponse<Formula>, String> {
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/formulas/{}", api_url, id);
    
    match reqwest::get(&url).await {
        Ok(res) => match res.json::<ApiResponse<Formula>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}

#[tauri::command]
pub async fn editar_calculo(
    app: AppHandle,
    id: i32,
    payload: UpdateFormulaPayload,
) -> Result<ApiResponse<Formula>, String> {
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/formulas/{}", api_url, id);
    
    let client = reqwest::Client::new();
    match client.put(&url).json(&payload).send().await {
        Ok(res) => match res.json::<ApiResponse<Formula>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}

#[tauri::command]
pub async fn deletar_calculo(
    app: AppHandle,
    id: i32,
) -> Result<ApiResponse<()>, String> {
    let api_url = crate::config::get_api_url(&app);
    let url = format!("{}/calculadora/formulas/{}", api_url, id);

    let client = reqwest::Client::new();
    match client.delete(&url).send().await {
        Ok(res) => match res.json::<ApiResponse<()>>().await {
            Ok(parsed) => Ok(parsed),
            Err(e) => Err(format!("Falha ao deserializar a resposta da API: {}", e)),
        },
        Err(e) => Err(format!("Falha ao chamar a API: {}", e)),
    }
}