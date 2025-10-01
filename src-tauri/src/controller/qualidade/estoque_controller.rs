// Em: src-tauri/src/controllers/qualidade/estoque_controller.rs
use serde_json;
use tauri::{command, AppHandle, State};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::estoque::{
    EstoqueItemDetalhado, EstoqueCompletoResponse, PaginatedEstoqueResponse,
    EstoqueItemPayload, NovoEstoqueItemApiPayload, AtualizacaoEstoqueItemApiPayload,
    EstoqueRegistroPayload
};
use crate::model::dropdown_options::DropdownOption2;
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
        unidade: payload.unidade, // <-- CORREÇÃO
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
        unidade: payload.unidade, // <-- CORREÇÃO
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
) -> Result<ApiResponse<Vec<DropdownOption2>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/qualidade/estoque/unidades-compra", api_url);

    // --- ESPIÃO DEFINITIVO (LADO TAURI) ---
    println!(">>> TAURI: Chamando API em: {}", url);

    match client.get(&url).send().await {
        Ok(response) => {
            println!(">>> TAURI: Resposta da API recebida com status: {}", response.status());

            if response.status().is_success() {
                // Primeiro, lemos a resposta como TEXTO para ver o conteúdo bruto.
                match response.text().await {
                    Ok(text_body) => {
                        println!(">>> TAURI: Corpo da resposta (TEXTO BRUTO):\n---\n{}\n---", text_body);

                        // Agora, tentamos "traduzir" o texto que acabamos de imprimir para a nossa struct.
                        match serde_json::from_str::<Vec<DropdownOption2>>(&text_body) {
                            Ok(data) => {
                                println!(">>> TAURI: JSON parseado com sucesso.");
                                Ok(ApiResponse::success("Unidades carregadas.".to_string(), Some(data)))
                            },
                            Err(e) => {
                                println!(">>> TAURI: ERRO CRÍTICO AO PARSEAR JSON: {:?}", e);
                                let error_message = format!("Erro no JSON de unidades: {}. Resposta recebida: {}", e, text_body);
                                Err(ApiResponse::error(error_message))
                            }
                        }
                    },
                    Err(e) => {
                        println!(">>> TAURI: ERRO ao ler o corpo da resposta como texto: {:?}", e);
                        Err(ApiResponse::error(format!("Erro ao ler corpo da resposta: {}", e)))
                    }
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                println!(">>> TAURI: API retornou erro {} com corpo: {}", status, err_body);
                Err(ApiResponse::error(format!("Falha ao buscar unidades. API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => {
            println!(">>> TAURI: Erro de conexão com a API: {:?}", e);
            Err(ApiResponse::error(format!("Erro de conexão ao buscar unidades: {}", e)))
        }
    }
}