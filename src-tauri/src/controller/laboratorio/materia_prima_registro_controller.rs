// src-tauri/src/controllers/laboratorio/materia_prima_registro_controller.rs

use tauri::{command, AppHandle, Wry};
use reqwest::Client;
use rust_decimal::Decimal as BigDecimal;
use chrono::NaiveDate;
use std::str::FromStr;

// Importa os models que definimos no passo anterior
use crate::model::materia_prima_registro::{
    MateriaPrimaRegistroDetalhado,
    PaginatedMateriaPrimaRegistroResponse,
    MateriaPrimaRegistroPayload, // Payload do Frontend
    NovaMateriaPrimaRegistroApiPayload, // Payload para a API (Criar)
    AtualizacaoMateriaPrimaRegistroApiPayload, // Payload para a API (Editar)
    AtualizacaoObsoletoPayload, // Payload para a API (Patch)
};

// Importa o padrão de resposta e o config da API
use crate::model::api_response::ApiResponse;
use crate::config::get_api_url;

// --- FUNÇÕES HELPER DE PARSING ---
// O Dossiê exige que a Ponte formate os dados.

/// Converte "dd/MM/yyyy" String para NaiveDate
fn parse_data_br(data_str: &str) -> Result<NaiveDate, String> {
    NaiveDate::parse_from_str(data_str, "%d/%m/%Y")
        .map_err(|e| format!("Data inválida (esperado dd/mm/yyyy): {}. Erro: {}", data_str, e))
}

/// Converte "123,45" String para BigDecimal
fn parse_decimal_br(decimal_str: &str) -> Result<BigDecimal, String> {
    if decimal_str.trim().is_empty() {
        return Ok(BigDecimal::from(0)); // Ou retornar erro, dependendo da regra
    }
    let corrected_str = decimal_str.replace(".", "").replace(",", ".");
    BigDecimal::from_str(&corrected_str)
        .map_err(|e| format!("Valor decimal inválido: {}. Erro: {}", decimal_str, e))
}

// --- COMMANDS TAURI (CRUD) ---

#[command]
pub async fn listar_materia_prima_registro_tauri(
    app_handle: AppHandle<Wry>,
    page: u32,
    per_page: u32,
    tipo_id: Option<u32>,
    materia_prima_id: Option<u32>,
    mostrar_obsoletos: bool,
) -> Result<ApiResponse<PaginatedMateriaPrimaRegistroResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);

    // Constrói a URL com parâmetros de query dinâmicos
    let mut url = format!(
        "{}/laboratorio/materia-prima-registros?page={}&per_page={}&mostrar_obsoletos={}",
        api_url, page, per_page, mostrar_obsoletos
    );
    if let Some(id) = tipo_id {
        url.push_str(&format!("&tipo_id={}", id));
    }
    if let Some(id) = materia_prima_id {
        url.push_str(&format!("&materia_prima_id={}", id));
    }

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PaginatedMateriaPrimaRegistroResponse>().await {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn cadastrar_materia_prima_registro_tauri(
    app_handle: AppHandle<Wry>,
    payload: MateriaPrimaRegistroPayload,
) -> Result<ApiResponse<MateriaPrimaRegistroDetalhado>, ApiResponse<()>> {
    
    // 1. Parsing e Mapeamento de Payload (Seção 3.2.2)
    let validade = match parse_data_br(&payload.validade) {
        Ok(data) => data,
        Err(e) => return Err(ApiResponse::error(e)),
    };
    let data_fabricacao = match parse_data_br(&payload.data_fabricacao) {
        Ok(data) => data,
        Err(e) => return Err(ApiResponse::error(e)),
    };
    let quantidade = match parse_decimal_br(&payload.quantidade) {
        Ok(val) => val,
        Err(e) => return Err(ApiResponse::error(e)),
    };
    let pureza = match parse_decimal_br(&payload.pureza) {
        Ok(val) => val,
        Err(e) => return Err(ApiResponse::error(e)),
    };

    let api_payload = NovaMateriaPrimaRegistroApiPayload {
        materia_prima: payload.materia_prima,
        fabricante: payload.fabricante,
        lote_fabricante: payload.lote_fabricante,
        validade,
        data_fabricacao,
        quantidade,
        pureza,
        nf: payload.nf,
        observacao: payload.observacao,
    };

    // 2. Chamada à API
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/materia-prima-registros", api_url);

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<MateriaPrimaRegistroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Cadastrado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn editar_materia_prima_registro_tauri(
    app_handle: AppHandle<Wry>,
    id: u32,
    payload: MateriaPrimaRegistroPayload,
) -> Result<ApiResponse<MateriaPrimaRegistroDetalhado>, ApiResponse<()>> {

    // 1. Parsing e Mapeamento de Payload
    let validade = match parse_data_br(&payload.validade) {
        Ok(data) => data,
        Err(e) => return Err(ApiResponse::error(e)),
    };
    let data_fabricacao = match parse_data_br(&payload.data_fabricacao) {
        Ok(data) => data,
        Err(e) => return Err(ApiResponse::error(e)),
    };
     let quantidade = match parse_decimal_br(&payload.quantidade) {
        Ok(val) => val,
        Err(e) => return Err(ApiResponse::error(e)),
    };
    let pureza = match parse_decimal_br(&payload.pureza) {
        Ok(val) => val,
        Err(e) => return Err(ApiResponse::error(e)),
    };

    let api_payload = AtualizacaoMateriaPrimaRegistroApiPayload {
        materia_prima: payload.materia_prima,
        fabricante: payload.fabricante,
        lote_fabricante: payload.lote_fabricante,
        validade,
        data_fabricacao,
        quantidade,
        pureza,
        nf: payload.nf,
        observacao: payload.observacao,
    };

    // 2. Chamada à API
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/materia-prima-registros/{}", api_url, id);

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
             if response.status().is_success() {
                match response.json::<MateriaPrimaRegistroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Atualizado com sucesso.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn deletar_materia_prima_registro_tauri(
    app_handle: AppHandle<Wry>,
    id: u32,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/materia-prima-registros/{}", api_url, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Registro removido (inativado) com sucesso.".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

#[command]
pub async fn atualizar_obsoleto_materia_prima_registro_tauri(
    app_handle: AppHandle<Wry>,
    id: u32,
    obsoleto: bool,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/materia-prima-registros/{}/obsoleto", api_url, id);
    
    let api_payload = AtualizacaoObsoletoPayload { obsoleto };

    match client.patch(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Status 'obsoleto' atualizado.".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}