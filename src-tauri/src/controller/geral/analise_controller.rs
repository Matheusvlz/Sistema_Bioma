// Ficheiro: src/controllers/analise_controller.rs

use tauri::{AppHandle, Manager};
use crate::{
    config,
    // Adicionando as novas structs ao import
    model::analise::{AtividadeAnalise, CidadeAnalise, ClienteDropdown, UsuarioDropdown},
};

// --- ADICIONADO ---
// Comando para buscar a lista de clientes para o dropdown.
// O nome `buscar_clientes_dropdown` corresponde ao que o frontend chama.
#[tauri::command]
pub async fn get_clientes_analise_command(app_handle: AppHandle) -> Result<Vec<ClienteDropdown>, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/analise/clientes-dropdown", api_url)) // Chama o endpoint que criamos na API
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        response.json::<Vec<ClienteDropdown>>().await.map_err(|e| e.to_string())
    } else {
        Err(format!("Erro da API ao buscar clientes: {}", response.status()))
    }
}

// --- ADICIONADO ---
// Comando para buscar a lista de usuários (coletores) para o dropdown.
// O nome `get_users` corresponde ao que o frontend chama.
#[tauri::command]
pub async fn get_coletores_analise_command(app_handle: AppHandle) -> Result<Vec<UsuarioDropdown>, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/analise/usuarios-dropdown", api_url)) // Chama o endpoint que criamos na API
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        response.json::<Vec<UsuarioDropdown>>().await.map_err(|e| e.to_string())
    } else {
        Err(format!("Erro da API ao buscar usuários: {}", response.status()))
    }
}

// Comando para buscar a lista de cidades distintas para o filtro.
#[tauri::command]
pub async fn get_cidades_analise_command(app_handle: AppHandle) -> Result<Vec<CidadeAnalise>, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/analise/cidades", api_url))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        response.json::<Vec<CidadeAnalise>>().await.map_err(|e| e.to_string())
    } else {
        Err(format!("Erro da API ao buscar cidades: {}", response.status()))
    }
}

// Comando principal para buscar as atividades (coletas e agendamentos) com base nos filtros.
#[tauri::command]
pub async fn get_atividades_filtradas_command(
    app_handle: AppHandle,
    cliente_id: Option<u32>,
    coletor_id: Option<u32>,
    cidade: Option<String>,
    data_inicial: Option<String>,
    data_final: Option<String>,
) -> Result<Vec<AtividadeAnalise>, String> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();

    let mut params = Vec::new();
    if let Some(id) = cliente_id { params.push(("clienteId", id.to_string())); }
    if let Some(id) = coletor_id { params.push(("coletorId", id.to_string())); }
    if let Some(c) = cidade { if !c.is_empty() { params.push(("cidade", c)); } }
    if let Some(di) = data_inicial { if !di.is_empty() { params.push(("dataInicial", di)); } }
    if let Some(df) = data_final { if !df.is_empty() { params.push(("dataFinal", df)); } }

    let response = client
        .get(format!("{}/analise/atividades", api_url))
        .query(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if response.status().is_success() {
        response
            .json::<Vec<AtividadeAnalise>>()
            .await
            .map_err(|e| e.to_string())
    } else {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Corpo de erro ilegível".to_string());
        Err(format!(
            "Erro da API ao buscar atividades: {} - {}",
            status,
            error_body
        ))
    }
}