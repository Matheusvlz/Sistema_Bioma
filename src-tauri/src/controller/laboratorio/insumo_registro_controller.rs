// src-tauri/src/controller/laboratorio/insumo_registro_controller.rs

use crate::config::get_api_url;
use crate::model::api_response::ApiResponse;
use crate::model::insumo_registro::{
    FornecedorOption, InsumoOption, InsumoRegistroDetalhado, NovoRegistroInsumoApiPayload,
    ReceitaEstoqueItem, RegistroInsumoFrontendPayload,InsumoTipoOption,
};
use reqwest::Client;
use tauri::{command, AppHandle};

// --- COMANDOS CRUD ---

#[command]
pub async fn listar_insumos_registros_tauri(
    app_handle: AppHandle,
    tipo_id: u32,
    insumo_id: Option<u32>, // Frontend envia Some(0) para "Todos"
    obsoletos: bool,
) -> Result<ApiResponse<Vec<InsumoRegistroDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros", api_url);

    let mut params = vec![
        ("tipo_id", tipo_id.to_string()),
        ("obsoletos", obsoletos.to_string()),
    ];

    let insumo_id_filtrado = insumo_id.filter(|&id| id > 0);
    
    let mut insumo_id_str = String::new(); 

    if let Some(id) = insumo_id_filtrado {
        insumo_id_str = id.to_string();
        params.push(("insumo_id", insumo_id_str.clone()));
    }

    match client.get(&url).query(&params).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // ATENÇÃO: Se o erro de "decoding" voltar,
                // é porque a struct 'InsumoRegistroDetalhado' em
                // 'src-tauri/src/model/insumo_registro.rs'
                // está com os tipos errados (ex: Option<u32> em vez de Option<String>)
                match response.json::<Vec<InsumoRegistroDetalhado>>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Registros listados com sucesso.".to_string(),
                        Some(data),
                    )),
                    Err(e) => {
                        let err_msg = format!("Erro no JSON (Tauri não conseguiu ler a resposta da API): {}. Verifique se as structs no Tauri e na API estão idênticas.", e);
                        eprintln!("!!! ERRO TAURI: {}", err_msg);
                        Err(ApiResponse::error(err_msg))
                    }
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn criar_insumo_registro_tauri(
    app_handle: AppHandle,
    payload: RegistroInsumoFrontendPayload,
) -> Result<ApiResponse<InsumoRegistroDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros", api_url);

    let api_payload = NovoRegistroInsumoApiPayload {
        insumo_id: payload.insumo_id,
        registro: payload.registro,
        fabricante: payload.fabricante,
        volume: payload.volume,
        data_preparo: payload.data_preparo,
        validade: payload.validade,
        quantidade: payload.quantidade,
        fator_correcao: payload.fator_correcao,
        nota_fiscal: payload.nota_fiscal,
        garantia: payload.garantia,
        garantia_tempo: payload.garantia_tempo,
        fornecedor_id: payload.fornecedor_id,
        data_compra: payload.data_compra,
        valor_equipamento: payload.valor_equipamento,
        modelo: payload.modelo,
        numero_serie: payload.numero_serie,
        observacao: payload.observacao,
        faixa_min: payload.faixa_min,
        faixa_max: payload.faixa_max,
        desvios: payload.desvios,
        fora_de_uso: payload.fora_de_uso,
        portatil: payload.portatil,
        materias_primas: payload.materias_primas,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<InsumoRegistroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Registro cadastrado com sucesso.".to_string(),
                        Some(data),
                    )),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn editar_insumo_registro_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: RegistroInsumoFrontendPayload,
) -> Result<ApiResponse<InsumoRegistroDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros/{}", api_url, id);

    let api_payload = NovoRegistroInsumoApiPayload {
        insumo_id: payload.insumo_id,
        registro: payload.registro,
        fabricante: payload.fabricante,
        volume: payload.volume,
        data_preparo: payload.data_preparo,
        validade: payload.validade,
        quantidade: payload.quantidade,
        fator_correcao: payload.fator_correcao,
        nota_fiscal: payload.nota_fiscal,
        garantia: payload.garantia,
        garantia_tempo: payload.garantia_tempo,
        fornecedor_id: payload.fornecedor_id,
        data_compra: payload.data_compra,
        valor_equipamento: payload.valor_equipamento,
        modelo: payload.modelo,
        numero_serie: payload.numero_serie,
        observacao: payload.observacao,
        faixa_min: payload.faixa_min,
        faixa_max: payload.faixa_max,
        desvios: payload.desvios,
        fora_de_uso: payload.fora_de_uso,
        portatil: payload.portatil,
        materias_primas: payload.materias_primas,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<InsumoRegistroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Registro atualizado com sucesso.".to_string(),
                        Some(data),
                    )),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn deletar_insumo_registro_tauri(
    app_handle: AppHandle,
    id: u32,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos-registros/{}", api_url, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success(
                    "Registro removido com sucesso!".to_string(),
                    None,
                ))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// --- COMANDOS DE SUPORTE (FORMULÁRIO) ---

#[command]
pub async fn listar_fornecedores_dropdown_tauri(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<FornecedorOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/suporte/fornecedores", api_url);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<FornecedorOption>>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Fornecedores carregados.".to_string(),
                        Some(data),
                    )),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn listar_insumos_por_tipo_tauri(
    app_handle: AppHandle,
    tipo_id: u32,
) -> Result<ApiResponse<Vec<InsumoOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/suporte/insumos-por-tipo/{}", api_url, tipo_id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // --- CORREÇÃO APLICADA AQUI ---
                // Mudei de 'InsoOption' para 'InsumoOption'
                match response.json::<Vec<InsumoOption>>().await { 
                    Ok(data) => Ok(ApiResponse::success(
                        "Insumos carregados.".to_string(),
                        Some(data),
                    )),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn listar_insumo_tipos_tauri(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<InsumoTipoOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    
    let url = format!("{}/laboratorio/suporte/insumo-tipos", api_url); 

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<InsumoTipoOption>>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Tipos de insumo carregados.".to_string(),
                        Some(data),
                    )),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn buscar_receita_e_estoque_mp_tauri(
    app_handle: AppHandle,
    insumo_id: u32,
) -> Result<ApiResponse<Vec<ReceitaEstoqueItem>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/suporte/receita-e-estoque/{}", api_url, insumo_id);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<ReceitaEstoqueItem>>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Receita e estoque carregados.".to_string(),
                        Some(data),
                    )),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!(
                    "API retornou erro ({}) {}",
                    status, err_body
                )))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}