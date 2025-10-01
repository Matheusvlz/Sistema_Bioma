// Em: src-tauri/src/controllers/qualidade/estoque_controller.rs

use tauri::{command, AppHandle, State};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::estoque::{
    EstoqueItemDetalhado, EstoqueCompletoResponse, PaginatedEstoqueResponse,
    EstoqueItemPayload, NovoEstoqueItemApiPayload, AtualizacaoEstoqueItemApiPayload,
    EstoqueRegistroPayload
};
use crate::model::dropdown_options::DropdownOption;
use crate::config::get_api_url;

#[command]
pub async fn listar_estoque_items_tauri(
    app_handle: AppHandle,
    page: u32,
    per_page: u32,
    nome: Option<String>,
    estoque_baixo: Option<bool>,
    mostrar_inativos: Option<bool>,
) -> Result<ApiResponse<PaginatedEstoqueResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);

    // Construir a query string dinamicamente
    let mut query_params = vec![
        ("page".to_string(), page.to_string()),
        ("per_page".to_string(), per_page.to_string())
    ];
    if let Some(n) = nome {
        query_params.push(("nome".to_string(), n));
    }
    if let Some(eb) = estoque_baixo {
        query_params.push(("estoque_baixo".to_string(), eb.to_string()));
    }
    if let Some(mi) = mostrar_inativos {
        query_params.push(("mostrar_inativos".to_string(), mi.to_string()));
    }

    let url = format!("{}/qualidade/estoque", api_url);

    match client.get(&url).query(&query_params).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PaginatedEstoqueResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn criar_estoque_item_tauri(
    app_handle: AppHandle,
    payload: EstoqueItemPayload,
) -> Result<ApiResponse<EstoqueItemDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/estoque", api_url);

    let api_payload = NovoEstoqueItemApiPayload {
        nome: payload.nome,
        unidade_id: payload.unidade_id,
        minimo: payload.minimo,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<EstoqueItemDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Item criado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn editar_estoque_item_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: EstoqueItemPayload,
) -> Result<ApiResponse<EstoqueItemDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/estoque/{}", api_url, id);

    let api_payload = AtualizacaoEstoqueItemApiPayload {
        nome: payload.nome,
        unidade_id: payload.unidade_id,
        minimo: payload.minimo,
        ativo: payload.ativo.unwrap_or(true),
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<EstoqueItemDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Item atualizado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn buscar_estoque_item_detalhado_tauri(
    app_handle: AppHandle,
    id: u32,
) -> Result<ApiResponse<EstoqueCompletoResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/estoque/{}", api_url, id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<EstoqueCompletoResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn criar_estoque_registro_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: EstoqueRegistroPayload,
) -> Result<ApiResponse<EstoqueCompletoResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/estoque/{}/registro", api_url, id);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<EstoqueCompletoResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Movimentação registrada com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn listar_unidades_compra_tauri(
    app_handle: AppHandle
) -> Result<ApiResponse<Vec<DropdownOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/unidades-compra", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<DropdownOption>>().await {
                    Ok(data) => Ok(ApiResponse::success("Unidades carregadas.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON de unidades: {}", e))),
                }
            } else {
                Err(ApiResponse::error("Falha ao buscar unidades.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}