// src-tauri/src/controller/qualidade/pesquisa_controller.rs

use tauri::{command, AppHandle, http::Method};
use serde::de::DeserializeOwned;
use serde::Serialize;
// CORREÇÃO: Alterado de 'models' para 'model' para corresponder ao main.rs
use crate::model::api_response::ApiResponse;
use crate::model::pesquisa::{ // Imports atualizados e completos
    PesquisaModeloOption, PesquisaItem, PesquisaDetalhada, PaginatedPesquisasResponse,
    UpsertPesquisaPayload, UpdatePesquisaStatusPayload, PesquisaFiltros,
    DestinatarioPesquisa, ResultadoItem, PayloadAnaliseCritica,
};
use crate::config::get_api_url;

// ▼▼▼ ESTA É A CORREÇÃO PRINCIPAL PARA O ERRO 404 ▼▼▼
// Removendo o prefixo "/api/" para corresponder às rotas reais da sua API.
const API_PESQUISA_PREFIX: &str = "/qualidade/pesquisas";
const API_MODELO_PREFIX: &str = "/qualidade/pesquisa-modelos";

// --- Comandos Expostos para o Frontend ---

#[command]
pub async fn listar_modelos_pesquisa_tauri(
    app_handle: AppHandle
) -> Result<ApiResponse<Vec<PesquisaModeloOption>>, ApiResponse<()>> {
    api_request::<Vec<PesquisaModeloOption>, ()>(
        &app_handle,
        Method::GET,
        API_MODELO_PREFIX,
        None, // Sem payload
    ).await
}

#[command]
pub async fn listar_itens_por_modelo_tauri(
    app_handle: AppHandle,
    modelo_id: u32
) -> Result<ApiResponse<Vec<PesquisaItem>>, ApiResponse<()>> {
    let endpoint = format!("{}/{}/itens", API_MODELO_PREFIX, modelo_id);
    api_request::<Vec<PesquisaItem>, ()>(
        &app_handle,
        Method::GET,
        &endpoint,
        None,
    ).await
}

#[command]
pub async fn buscar_pesquisa_por_id_tauri(
    app_handle: AppHandle,
    id: u32
) -> Result<ApiResponse<PesquisaDetalhada>, ApiResponse<()>> {
    let endpoint = format!("{}/{}", API_PESQUISA_PREFIX, id);
    api_request::<PesquisaDetalhada, ()>(
        &app_handle,
        Method::GET,
        &endpoint,
        None,
    ).await
}

// NOVO: Command para listar, filtrar e paginar as pesquisas.
#[command]
pub async fn listar_pesquisas_tauri(
    app_handle: AppHandle,
    filtros: PesquisaFiltros
) -> Result<ApiResponse<PaginatedPesquisasResponse>, ApiResponse<()>> {
    // Constrói a query string a partir dos filtros
    let query_string = serde_qs::to_string(&filtros)
        .unwrap_or_else(|_| "".to_string());
    let endpoint = format!("{}?{}", API_PESQUISA_PREFIX, query_string);
    
    api_request::<PaginatedPesquisasResponse, ()>(
        &app_handle,
        Method::GET,
        &endpoint,
        None,
    ).await
}

#[command]
pub async fn cadastrar_pesquisa_tauri(
    app_handle: AppHandle,
    payload: UpsertPesquisaPayload
) -> Result<ApiResponse<PesquisaDetalhada>, ApiResponse<()>> {
    api_request(
        &app_handle,
        Method::POST,
        API_PESQUISA_PREFIX,
        Some(&payload),
    ).await
}

#[command]
pub async fn editar_pesquisa_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: UpsertPesquisaPayload
) -> Result<ApiResponse<PesquisaDetalhada>, ApiResponse<()>> {
    let endpoint = format!("{}/{}", API_PESQUISA_PREFIX, id);
    api_request(
        &app_handle,
        Method::PUT,
        &endpoint,
        Some(&payload),
    ).await
}

// NOVO: Command para atualizar o status (Finalizar/Ativar).
#[command]
pub async fn atualizar_status_pesquisa_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: UpdatePesquisaStatusPayload
) -> Result<ApiResponse<PesquisaDetalhada>, ApiResponse<()>> {
    let endpoint = format!("{}/{}/status", API_PESQUISA_PREFIX, id);
    api_request(
        &app_handle,
        Method::PATCH,
        &endpoint,
        Some(&payload),
    ).await
}


// --- Função Auxiliar Genérica para Chamadas de API ---
// Esta função encapsula toda a lógica repetitiva de fazer uma requisição.
async fn api_request<T, P>(
    app_handle: &AppHandle,
    method: Method,
    endpoint: &str,
    payload: Option<&P>,
) -> Result<ApiResponse<T>, ApiResponse<()>>
where
    T: DeserializeOwned, // T é o tipo do dado de sucesso que esperamos (e.g., PesquisaDetalhada)
    P: Serialize,      // P é o tipo do payload que estamos enviando
{
    let client = reqwest::Client::new();
    let api_url = get_api_url(app_handle);
    let url = format!("{}{}", api_url, endpoint);

    let mut request_builder = client.request(method, &url);
    if let Some(p) = payload {
        request_builder = request_builder.json(p);
    }
    
    match request_builder.send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<T>().await {
                    Ok(data) => Ok(ApiResponse::success("Operação bem-sucedida.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao deserializar resposta da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_else(|_| "Corpo da resposta indisponível.".to_string());
                Err(ApiResponse::error(format!("API retornou erro {}: {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn listar_destinatarios_tauri(
    app_handle: AppHandle,
    pesquisa_id: u32,
) -> Result<ApiResponse<Vec<DestinatarioPesquisa>>, ApiResponse<()>> {
    let endpoint = format!("/qualidade/pesquisas/{}/destinatarios", pesquisa_id);
    api_request(&app_handle, Method::GET, &endpoint, Option::<&()>::None).await
}

#[command]
pub async fn obter_resultados_por_item_tauri(
    app_handle: AppHandle,
    pesquisa_id: u32,
    item_descricao: String,
) -> Result<ApiResponse<Vec<ResultadoItem>>, ApiResponse<()>> {
    let endpoint = format!("/qualidade/pesquisas/{}/resultados/{}", pesquisa_id, item_descricao);
    api_request(&app_handle, Method::GET, &endpoint, Option::<&()>::None).await
}

#[command]
pub async fn salvar_analise_critica_tauri(
    app_handle: AppHandle,
    pesquisa_id: u32,
    payload: PayloadAnaliseCritica,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let endpoint = format!("/qualidade/pesquisas/{}/analise", pesquisa_id);
    // Para POST/PUT sem um corpo de resposta esperado, o tipo de sucesso é '()'
    api_request::<(), _>(&app_handle, Method::POST, &endpoint, Some(&payload)).await
}