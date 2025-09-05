use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::legislacao_parametro::{
    LegislacaoParametroDetalhado, 
    LegislacaoParametroPayload, 
    NovaLegislacaoParametroApiPayload, 
    AtualizacaoLegislacaoParametroApiPayload
};
use crate::config::get_api_url;

/// [GET] Busca todos os relacionamentos Legislação x Parâmetro da API.
#[command]
pub async fn listar_legislacao_parametro(app_handle: AppHandle) -> Result<ApiResponse<Vec<LegislacaoParametroDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/legislacao-parametro", api_url);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<LegislacaoParametroDetalhado>>().await {
                    Ok(data) => Ok(ApiResponse::success("Relacionamentos carregados com sucesso".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
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

/// [POST] Cadastra um novo relacionamento Legislação x Parâmetro via API.
#[command]
pub async fn cadastrar_legislacao_parametro(app_handle: AppHandle, payload: LegislacaoParametroPayload) -> Result<ApiResponse<LegislacaoParametroDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/legislacao-parametro", api_url);

    let api_payload = NovaLegislacaoParametroApiPayload {
        legislacao: payload.legislacao,
        tipo: payload.tipo,
        matriz: payload.matriz,
        parametro_pop: payload.parametro_pop,
        unidade: payload.unidade,
        limite_min: payload.limite_min,
        limite_simbolo: payload.limite_simbolo,
        limite_max: payload.limite_max,
        valor: payload.valor,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<LegislacaoParametroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Relacionamento cadastrado com sucesso!".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [PUT] Edita um relacionamento Legislação x Parâmetro existente.
#[command]
pub async fn editar_legislacao_parametro(app_handle: AppHandle, payload: LegislacaoParametroPayload) -> Result<ApiResponse<LegislacaoParametroDetalhado>, ApiResponse<()>> {
    let id = match payload.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID do relacionamento é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/legislacao-parametro/{}", api_url, id);
    
    let api_payload = AtualizacaoLegislacaoParametroApiPayload {
        legislacao: payload.legislacao,
        tipo: payload.tipo,
        matriz: payload.matriz,
        parametro_pop: payload.parametro_pop,
        unidade: payload.unidade,
        limite_min: payload.limite_min,
        limite_simbolo: payload.limite_simbolo,
        limite_max: payload.limite_max,
        valor: payload.valor,
        ativo: payload.ativo,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<LegislacaoParametroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Relacionamento atualizado com sucesso!".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta da API: {}", e))),
                }
            } else {
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [DELETE] Deleta um relacionamento Legislação x Parâmetro existente.
#[command]
pub async fn deletar_legislacao_parametro(app_handle: AppHandle, id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/legislacao-parametro/{}", api_url, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Relacionamento removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
