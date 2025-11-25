use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::insumo_registro_2::{
    InsumoRegistro2Detalhado, 
    PaginatedInsumoRegistro2Response, 
    InsumoRegistro2Payload,
    NovoInsumoRegistro2ApiPayload,
    AtualizacaoInsumoRegistro2ApiPayload,
    AtualizacaoAmostraInsumo2Payload
};
use crate::config::get_api_url;

// --- LISTAR (Read) ---
#[command]
pub async fn listar_insumo_registro_2_tauri(
    app_handle: AppHandle,
    insumo_id: u32,
    page: u32,
    per_page: u32
) -> Result<ApiResponse<PaginatedInsumoRegistro2Response>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos/{}/registros_2?page={}&per_page={}", api_url, insumo_id, page, per_page);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PaginatedInsumoRegistro2Response>().await {
                    Ok(data) => Ok(ApiResponse::success("Registros carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("Erro API ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// --- CRIAR LOTE (Create) ---
#[command]
pub async fn criar_insumo_registro_2_tauri(
    app_handle: AppHandle,
    payload: InsumoRegistro2Payload
) -> Result<ApiResponse<InsumoRegistro2Detalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros-2", api_url);

    // Mapeia payload do front para o da API
    let api_payload = NovoInsumoRegistro2ApiPayload {
        insumo_id: payload.insumo_id,
        registro: payload.registro,
        fabricante: payload.fabricante,
        data_preparo: payload.data_preparo,
        validade: payload.validade,
        usuario_id: payload.usuario_id.unwrap_or(0), // O ID deve vir do front (usuário logado)
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::CREATED => {
                    match response.json::<InsumoRegistro2Detalhado>().await {
                        Ok(data) => Ok(ApiResponse::success("Lote cadastrado com sucesso.".to_string(), Some(data))),
                        Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta: {}", e))),
                    }
                },
                reqwest::StatusCode::CONFLICT => {
                    Err(ApiResponse::error("Este lote já está cadastrado para este insumo e fabricante.".to_string()))
                },
                status => {
                    let err_body = response.text().await.unwrap_or_default();
                    Err(ApiResponse::error(format!("Erro ao criar ({}): {}", status, err_body)))
                }
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// --- EDITAR LOTE (Update) ---
#[command]
pub async fn editar_insumo_registro_2_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: InsumoRegistro2Payload
) -> Result<ApiResponse<InsumoRegistro2Detalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros-2/{}", api_url, id);

    let api_payload = AtualizacaoInsumoRegistro2ApiPayload {
        registro: payload.registro,
        fabricante: payload.fabricante,
        data_preparo: payload.data_preparo,
        validade: payload.validade,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<InsumoRegistro2Detalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Lote atualizado.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("Erro API ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// --- DELETAR LOTE (Delete) ---
#[command]
pub async fn deletar_insumo_registro_2_tauri(
    app_handle: AppHandle,
    id: u32
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros-2/{}", api_url, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Registro removido.".to_string(), None))
            } else {
                Err(ApiResponse::error("Falha ao remover registro.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// --- ATUALIZAR AMOSTRA (Inicial/Final - Lógica Crítica) ---
#[command]
pub async fn atualizar_amostra_registro_2_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: AtualizacaoAmostraInsumo2Payload
) -> Result<ApiResponse<InsumoRegistro2Detalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros-2/{}/amostra", api_url, id);

    match client.patch(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<InsumoRegistro2Detalhado>().await {
                        Ok(data) => Ok(ApiResponse::success("Amostra registrada com sucesso.".to_string(), Some(data))),
                        Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                    }
                },
                reqwest::StatusCode::PRECONDITION_FAILED => {
                    Err(ApiResponse::error("Já existe um lote em uso para este insumo. Finalize-o antes.".to_string()))
                },
                reqwest::StatusCode::CONFLICT => {
                    Err(ApiResponse::error("A numeração de amostra informada conflita com outro lote existente.".to_string()))
                },
                reqwest::StatusCode::BAD_REQUEST => {
                    Err(ApiResponse::error("Dados inválidos (Amostra Final < Inicial ou Inicial > Final).".to_string()))
                },
                status => {
                    let err_body = response.text().await.unwrap_or_default();
                    Err(ApiResponse::error(format!("Erro API ({}): {}", status, err_body)))
                }
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}