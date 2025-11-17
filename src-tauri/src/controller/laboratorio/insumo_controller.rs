// src-tauri/src/controller/laboratorio/insumo_controller.rs

use crate::config::get_api_url;
// CORREÇÃO: Usar 'model' (singular) como no seu projeto
use crate::model::api_response::ApiResponse;
use crate::model::insumo::{
    AtualizacaoInsumoApiPayload, InsumoCompletoDetalhado, InsumoDetalhado, InsumoPayload,
    InsumoSuporteFormulario, InsumoTipoOption, MateriaPrimaGrupo, NovaInsumoApiPayload,
    UnidadeOption,
};
// CORREÇÃO: Usar 'reqwest', não 'axum'
use reqwest::Client;
use tauri::{command, AppHandle};

// --- COMANDOS CRUD ---

#[command]
pub async fn listar_insumos_tauri(
    app_handle: AppHandle,
) -> Result<ApiResponse<Vec<InsumoDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos", api_url); // Rota corrigida

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<InsumoDetalhado>>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Insumos listados com sucesso.".to_string(),
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
pub async fn criar_insumo_tauri(
    app_handle: AppHandle,
    payload: InsumoPayload,
) -> Result<ApiResponse<InsumoCompletoDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos", api_url); // Rota corrigida

    let api_payload = NovaInsumoApiPayload {
        nome: payload.nome,
        tipo_id: payload.tipo_id,
        unidade: payload.unidade,
        materias_primas: payload.materias_primas,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<InsumoCompletoDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Insumo cadastrado com sucesso.".to_string(),
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
pub async fn editar_insumo_tauri(
    app_handle: AppHandle,
    id: u32,
    payload: InsumoPayload,
) -> Result<ApiResponse<InsumoCompletoDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos/{}", api_url, id); // Rota corrigida

    let api_payload = AtualizacaoInsumoApiPayload {
        nome: payload.nome,
        tipo_id: payload.tipo_id,
        unidade: payload.unidade,
        materias_primas: payload.materias_primas,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<InsumoCompletoDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Insumo atualizado com sucesso.".to_string(),
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
pub async fn deletar_insumo_tauri(
    app_handle: AppHandle,
    id: u32,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos/{}", api_url, id); // Rota corrigida

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success(
                    "Insumo removido com sucesso!".to_string(),
                    None,
                ))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                
                if status == reqwest::StatusCode::FORBIDDEN {
                    Err(ApiResponse::error(
                        "Não é possível excluir: Este insumo já possui registros de estoque."
                            .to_string(),
                    ))
                } else {
                    Err(ApiResponse::error(format!(
                        "API retornou erro ({}) {}",
                        status, err_body
                    )))
                }
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}
#[command]
pub async fn buscar_insumo_tauri(
    app_handle: AppHandle,
    id: u32,
) -> Result<ApiResponse<InsumoCompletoDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/insumos/{}", api_url, id); // Rota GET por ID

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<InsumoCompletoDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success(
                        "Insumo carregado.".to_string(),
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
pub async fn carregar_suporte_formulario_insumo_tauri(
    app_handle: AppHandle,
) -> Result<ApiResponse<InsumoSuporteFormulario>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);

    // Rotas corrigidas
    let tipos_url = format!("{}/laboratorio/insumos/suporte/tipos", api_url);
    let unidades_url = format!("{}/laboratorio/insumos/suporte/unidades", api_url);
    let grupos_mp_url = format!(
        "{}/laboratorio/insumos/suporte/materia-prima-grupos",
        api_url
    );

    // Lógica 'try_join!' corrigida
    let join_result = tokio::try_join!(
        client.get(tipos_url).send(),
        client.get(unidades_url).send(),
        client.get(grupos_mp_url).send()
    );

    let (tipos_res, unidades_res, grupos_mp_res) = match join_result {
        Ok(responses) => responses,
        Err(e) => {
            eprintln!("Erro de conexão no try_join: {:?}", e);
            return Err(ApiResponse::error(format!(
                "Erro de conexão ao carregar dados: {}",
                e
            )));
        }
    };

    // Processa Tipos
    let tipos = match tipos_res {
        res if res.status().is_success() => res.json::<Vec<InsumoTipoOption>>().await.unwrap_or_default(),
        _ => return Err(ApiResponse::error("Falha ao carregar tipos de insumo.".to_string())),
    };

    // Processa Unidades
    let unidades = match unidades_res {
        res if res.status().is_success() => res.json::<Vec<UnidadeOption>>().await.unwrap_or_default(),
        _ => return Err(ApiResponse::error("Falha ao carregar unidades.".to_string())),
    };

    // Processa Grupos de Matéria-Prima
    let grupos_mp = match grupos_mp_res {
        res if res.status().is_success() => res.json::<Vec<MateriaPrimaGrupo>>().await.unwrap_or_default(),
        _ => return Err(ApiResponse::error("Falha ao carregar matérias-primas.".to_string())),
    };

    let data = InsumoSuporteFormulario {
        tipos,
        unidades,
        grupos_mp,
    };

    Ok(ApiResponse::success(
        "Dados de suporte carregados.".to_string(),
        Some(data),
    ))
}