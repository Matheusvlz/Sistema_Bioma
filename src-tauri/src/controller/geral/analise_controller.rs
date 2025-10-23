// Ficheiro: src-tauri/src/controllers/analise_controller.rs (VERSÃO COMPLETA E CORRIGIDA)

use tauri::{AppHandle, Manager};

use crate::{
    config,
    model::analise::{
        // Importa o nosso novo "molde"
        RequestParams, 
        AnaliseAgregadaPorCliente, AnaliseDetalhada, ApiResponse, CidadeDropdown,
        ClienteDropdown, FiltrosAnalisePayload, PaginatedAnalisesDetalhadasResponse,
        UsuarioDropdown,
    },
};

// As funções de dropdown não mudam
#[tauri::command]
pub async fn get_cidades_analise_command(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<CidadeDropdown>>, ApiResponse<()>> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    match client.get(format!("{}/analise/cidades", api_url)).send().await {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<CidadeDropdown>>().await {
                    Ok(data) => Ok(ApiResponse::success(data)),
                    Err(e) => Err(ApiResponse::error(format!("Falha ao deserializar resposta: {}", e))),
                }
            } else {
                Err(ApiResponse::error(format!("Erro da API: {}", res.status())))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[tauri::command]
pub async fn get_clientes_analise_command(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<ClienteDropdown>>, ApiResponse<()>> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    match client.get(format!("{}/analise/clientes-dropdown", api_url)).send().await {
         Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<ClienteDropdown>>().await {
                    Ok(data) => Ok(ApiResponse::success(data)),
                    Err(e) => Err(ApiResponse::error(format!("Falha ao deserializar resposta: {}", e))),
                }
            } else {
                Err(ApiResponse::error(format!("Erro da API: {}", res.status())))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[tauri::command]
pub async fn get_coletores_analise_command(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<UsuarioDropdown>>, ApiResponse<()>> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();
    match client.get(format!("{}/analise/usuarios-dropdown", api_url)).send().await {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<UsuarioDropdown>>().await {
                    Ok(data) => Ok(ApiResponse::success(data)),
                    Err(e) => Err(ApiResponse::error(format!("Falha ao deserializar resposta: {}", e))),
                }
            } else {
                Err(ApiResponse::error(format!("Erro da API: {}", res.status())))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// ==========================================================================================
// FUNÇÕES DE DADOS (CORRIGIDAS COM O NOVO MÉTODO)
// ==========================================================================================
#[tauri::command]
pub async fn get_analises_detalhadas_command(
    app_handle: AppHandle,
    payload: FiltrosAnalisePayload,
) -> Result<ApiResponse<PaginatedAnalisesDetalhadasResponse>, ApiResponse<()>> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();

    // Cria o nosso molde de requisição
    let params = RequestParams {
        cliente_id: payload.cliente_id,
        coletor_id: payload.coletor_id,
        cidade: payload.cidade.as_deref().filter(|s| !s.is_empty()),
        data_inicial: payload.data_inicial.as_deref().filter(|s| !s.is_empty()),
        data_final: payload.data_final.as_deref().filter(|s| !s.is_empty()),
        busca_rapida: payload.busca_rapida.as_deref().filter(|s| !s.is_empty()),
        
        // Lógica condicional para exportação vs. paginação
        export: if payload.export.unwrap_or(false) { Some(true) } else { None },
        page: if !payload.export.unwrap_or(false) { Some(payload.page.unwrap_or(1)) } else { None },
        per_page: if !payload.export.unwrap_or(false) { Some(payload.per_page.unwrap_or(20)) } else { None },
    };

    match client.get(format!("{}/analise/detalhado", api_url))
        .query(&params) // Passa o molde diretamente para o reqwest
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<PaginatedAnalisesDetalhadasResponse>().await {
                    Ok(data) => Ok(ApiResponse::success(data)),
                    Err(e) => Err(ApiResponse::error(format!("Falha ao deserializar resposta: {}", e))),
                }
            } else {
                let status = res.status();
                let body = res.text().await.unwrap_or_else(|_| "N/A".to_string());
                Err(ApiResponse::error(format!("Erro da API [{}]: {}", status, body)))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[tauri::command]
pub async fn get_analise_agregada_command(
    app_handle: AppHandle,
    payload: FiltrosAnalisePayload,
) -> Result<ApiResponse<Vec<AnaliseAgregadaPorCliente>>, ApiResponse<()>> {
    let api_url = config::get_api_url(&app_handle);
    let client = reqwest::Client::new();

    // Usa o mesmo molde, mas ignora os campos de paginação e export que não são necessários
    let params = RequestParams {
        cliente_id: payload.cliente_id,
        coletor_id: payload.coletor_id,
        cidade: payload.cidade.as_deref().filter(|s| !s.is_empty()),
        data_inicial: payload.data_inicial.as_deref().filter(|s| !s.is_empty()),
        data_final: payload.data_final.as_deref().filter(|s| !s.is_empty()),
        busca_rapida: payload.busca_rapida.as_deref().filter(|s| !s.is_empty()),
        export: None,
        page: None,
        per_page: None,
    };

    match client.get(format!("{}/analise/agregado-por-cliente", api_url))
        .query(&params) // Passa o molde diretamente para o reqwest
        .send()
        .await
    {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<Vec<AnaliseAgregadaPorCliente>>().await {
                    Ok(data) => Ok(ApiResponse::success(data)),
                    Err(e) => Err(ApiResponse::error(format!("Falha ao deserializar resposta: {}", e))),
                }
            } else {
                let status = res.status();
                let body = res.text().await.unwrap_or_else(|_| "N/A".to_string());
                Err(ApiResponse::error(format!("Erro da API [{}]: {}", status, body)))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}