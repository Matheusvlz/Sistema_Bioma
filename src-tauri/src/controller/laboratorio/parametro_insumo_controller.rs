// src-tauri/src/controller/parametro_insumo_controller.rs
use tauri::{command, AppHandle};
use reqwest::{Client, StatusCode};
use crate::model::api_response::ApiResponse;
use crate::config::get_api_url;
use crate::model::parametro_insumo::{
    ParametroPopDropdown, InsumoRelacionadoDetalhado, InsumoDisponivelAgrupado,
    RelacionarInsumoPayload, RemoverInsumoPayload, PaginatedInsumoResponse
};

#[command]
pub async fn listar_parametros_pop_dropdown_tauri(
    app_handle: AppHandle
) -> Result<ApiResponse<Vec<ParametroPopDropdown>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/dropdown", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<ParametroPopDropdown>>().await {
                    Ok(data) => Ok(ApiResponse::success("Parâmetros carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                Err(ApiResponse::error(format!("API retornou erro ({})", response.status())))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn listar_insumos_relacionados_tauri(
    app_handle: AppHandle,
    parametro_pop_id: u32
) -> Result<ApiResponse<Vec<InsumoRelacionadoDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/{}/insumos", api_url, parametro_pop_id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<InsumoRelacionadoDetalhado>>().await {
                    Ok(data) => Ok(ApiResponse::success("Insumos carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                Err(ApiResponse::error(format!("API retornou erro ({})", response.status())))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn listar_insumos_disponiveis_tauri(
    app_handle: AppHandle
) -> Result<ApiResponse<Vec<InsumoDisponivelAgrupado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/insumos-disponiveis", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<InsumoDisponivelAgrupado>>().await {
                    Ok(data) => Ok(ApiResponse::success("Insumos disponíveis carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                Err(ApiResponse::error(format!("API retornou erro ({})", response.status())))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn relacionar_insumos_parametro_tauri(
    app_handle: AppHandle,
    parametro_pop_id: u32,
    payload: RelacionarInsumoPayload
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/{}/insumos", api_url, parametro_pop_id);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Relacionamento(s) criado(s) com sucesso.".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                if status == StatusCode::UNPROCESSABLE_ENTITY {
                     Err(ApiResponse::error(format!("Falha na validação: {}", err_body)))
                } else {
                     Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
                }
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn remover_insumo_relacionado_tauri(
    app_handle: AppHandle,
    payload: RemoverInsumoPayload
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/insumo-relacao", api_url);

    // DELETE com body reqwest
    match client.delete(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Relacionamento removido.".to_string(), None))
            } else {
                Err(ApiResponse::error(format!("API retornou erro ({})", response.status())))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}