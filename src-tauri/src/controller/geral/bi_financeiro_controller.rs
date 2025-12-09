use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::financeiro_bi::{FiltrosDashboardPayload, AuditoriaDetalheResponse, KpiResponse};
use crate::config::get_api_url;

#[command]
pub async fn listar_auditoria_financeira_tauri(
    app_handle: AppHandle,
    filtros: FiltrosDashboardPayload
) -> Result<ApiResponse<Vec<AuditoriaDetalheResponse>>, ApiResponse<()>> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    // Constrói a URL com Query Params
    let mut url = format!("{}/financeiro/auditoria?", api_url);
    
    if let Some(d) = filtros.data_inicio { url.push_str(&format!("data_inicio={}&", d)); }
    if let Some(d) = filtros.data_fim { url.push_str(&format!("data_fim={}&", d)); }
    if let Some(c) = filtros.cliente_id { url.push_str(&format!("cliente_id={}&", c)); }
    if let Some(e) = filtros.apenas_erros { url.push_str(&format!("apenas_erros={}&", e)); }

    // Faz a requisição para a API REST
    match client.get(&url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                // Tenta converter o JSON da API para a Struct do Tauri
                match res.json::<Vec<AuditoriaDetalheResponse>>().await {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados com sucesso.".to_string(), Some(data))),
                    Err(e) => {
                        println!("Erro de deserialização (Tauri): {:?}", e); // Log para debug no terminal do Tauri
                        Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e)))
                    }
                }
            } else {
                Err(ApiResponse::error(format!("API retornou erro: {}", res.status())))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Falha de conexão com a API: {}", e)))
    }
}

#[command]
pub async fn obter_kpis_financeiros_tauri(
    app_handle: AppHandle,
    filtros: FiltrosDashboardPayload
) -> Result<ApiResponse<KpiResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let mut url = format!("{}/financeiro/kpis?", api_url);
    
    if let Some(d) = filtros.data_inicio { url.push_str(&format!("data_inicio={}&", d)); }
    if let Some(d) = filtros.data_fim { url.push_str(&format!("data_fim={}&", d)); }
    if let Some(c) = filtros.cliente_id { url.push_str(&format!("cliente_id={}&", c)); }

    match client.get(&url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<KpiResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("KPIs carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro JSON KPI: {}", e)))
                }
            } else {
                Err(ApiResponse::error(format!("Erro API KPI: {}", res.status())))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro Conexão KPI: {}", e)))
    }
}