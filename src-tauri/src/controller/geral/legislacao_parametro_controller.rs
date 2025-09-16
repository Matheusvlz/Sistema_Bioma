use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::legislacao_parametro::{
    LegislacaoParametroDetalhado, 
    LegislacaoParametroPayload, 
    NovaLegislacaoParametroApiPayload, 
    AtualizacaoLegislacaoParametroApiPayload,
    PaginatedLegislacaoParametroResponse
};
use crate::model::dropdown_options::{DropdownOption, ParametroOption, PopOption};
use crate::config::get_api_url;

// --- FUNÇÕES CRUD PRINCIPAIS ---

#[command]
pub async fn listar_legislacao_parametro_tauri(
    app_handle: AppHandle, 
    legislacao_id: u32, 
    page: u32, 
    per_page: u32
) -> Result<ApiResponse<PaginatedLegislacaoParametroResponse>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!(
        "{}/legislacao-parametro/por-legislacao/{}?page={}&per_page={}", 
        api_url, legislacao_id, page, per_page
    );
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PaginatedLegislacaoParametroResponse>().await {
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
pub async fn cadastrar_legislacao_parametro_tauri(app_handle: AppHandle, payload: LegislacaoParametroPayload) -> Result<ApiResponse<LegislacaoParametroDetalhado>, ApiResponse<()>> {
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
             if response.status().is_success() {
                match response.json::<LegislacaoParametroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Cadastrado com sucesso.".to_string(), Some(data))),
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

// ... as funções de editar e deletar seguiriam o mesmo padrão robusto ...

// --- FUNÇÕES DE SUPORTE PARA DROPDOWNS (CORRIGIDAS) ---

#[command]
pub async fn listar_legislacoes_ativas_tauri(app_handle: AppHandle) -> Result<ApiResponse<Vec<DropdownOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/legislacoes", api_url);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<DropdownOption>>().await {
                    Ok(data) => Ok(ApiResponse::success("Legislacoes carregadas.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                Err(ApiResponse::error("Falha ao buscar legislações.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn listar_parametros_simples_tauri(app_handle: AppHandle) -> Result<ApiResponse<Vec<ParametroOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametros", api_url);
    
     match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<ParametroOption>>().await {
                    Ok(data) => Ok(ApiResponse::success("Parâmetros carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON: {}", e))),
                }
            } else {
                Err(ApiResponse::error("Falha ao buscar parâmetros.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

// ✅ CORREÇÃO APLICADA AQUI
#[command]
pub async fn listar_pops_por_parametro_tauri(app_handle: AppHandle, parametro_id: u32) -> Result<ApiResponse<Vec<PopOption>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametros/{}/pops", api_url, parametro_id);
    
     match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<PopOption>>().await {
                    Ok(data) => Ok(ApiResponse::success("POPs carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro no JSON de POPs: {}", e))),
                }
            } else {
                Err(ApiResponse::error("Falha ao buscar POPs.".to_string()))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn deletar_legislacao_parametro_tauri(app_handle: AppHandle, id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
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

#[command]
pub async fn editar_legislacao_parametro_tauri(app_handle: AppHandle, id: u32, payload: LegislacaoParametroPayload) -> Result<ApiResponse<LegislacaoParametroDetalhado>, ApiResponse<()>> {
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
        ativo: payload.ativo.unwrap_or(true),
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
             if response.status().is_success() {
                match response.json::<LegislacaoParametroDetalhado>().await {
                    Ok(data) => Ok(ApiResponse::success("Relacionamento atualizado com sucesso.".to_string(), Some(data))),
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
