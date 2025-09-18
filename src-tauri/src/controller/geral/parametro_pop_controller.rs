use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::parametro_pop::{ParametroPopDetalhado, ParametroPopPayload, NovoParametroApiPayload, AtualizacaoParametroPop, AtualizacaoLqIncertezaPayload};
use crate::config::get_api_url;
use serde_json;

/// [GET] Busca todos os relacionamentos Parametro x POP da API.
#[command]
pub async fn listar_parametros_pops(app_handle: AppHandle) -> Result<ApiResponse<Vec<ParametroPopDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop", api_url);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<ParametroPopDetalhado>>().await {
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

/// [POST] Cadastra um novo relacionamento Parametro x POP via API.
#[command]
pub async fn cadastrar_parametro_pop(app_handle: AppHandle, payload: ParametroPopPayload) -> Result<ApiResponse<ParametroPopDetalhado>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop", api_url);

    // Converte o payload do frontend para o formato que a API REST espera.
    let api_payload = NovoParametroApiPayload {
        parametro: payload.parametro,
        pop: payload.pop,
        metodologia: payload.metodologia,
        tempo: payload.tempo,
        quantidade_g: payload.quantidade_g,
        quantidade_ml: payload.quantidade_ml,
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<ParametroPopDetalhado>().await {
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

/// [PUT] Edita um relacionamento Parametro x POP existente.
#[command]
pub async fn editar_parametro_pop(app_handle: AppHandle, payload: ParametroPopPayload) -> Result<ApiResponse<ParametroPopDetalhado>, ApiResponse<()>> {
    let id = match payload.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID do relacionamento é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/{}", api_url, id);
    
    let api_payload = AtualizacaoParametroPop {
        metodologia: payload.metodologia,
        tempo: payload.tempo,
        quantidade_g: payload.quantidade_g,
        quantidade_ml: payload.quantidade_ml,
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<ParametroPopDetalhado>().await {
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

/// [DELETE] Deleta um relacionamento Parametro x POP existente.
#[command]
pub async fn deletar_parametro_pop(app_handle: AppHandle, id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/{}", api_url, id);

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

// --- NOVAS FUNÇÕES ADICIONADAS ABAIXO ---

/// [GET] Busca relacionamentos Parametro x POP por grupo.
// --- FUNÇÃO "ESPIÃ" TEMPORÁRIA ---
#[command]
pub async fn listar_parametros_pops_por_grupo(app_handle: AppHandle, grupo: String) -> Result<ApiResponse<Vec<ParametroPopDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let grupo_encoded = urlencoding::encode(&grupo);
    let url = format!("{}/parametro-pop/grupo/{}", api_url, grupo_encoded);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // --- O NOSSO "ESPIÃO" COMEÇA AQUI ---
                
                // Passo 1: Capturamos a resposta como texto puro, em vez de a converter diretamente.
                match response.text().await {
                    Ok(raw_json) => {
                        // Passo 2: Imprimimos o JSON bruto na consola do 'cargo run'.
                        // Esta é a nossa "caixa preta" que vai revelar tudo.
                        println!("\n\n--- RESPOSTA BRUTA DA API (ESPIÃO) ---\n");
                        println!("{}", &raw_json);
                        println!("\n-------------------------------------\n\n");

                        // Passo 3: Agora, tentamos converter o texto que recebemos para a nossa struct.
                        match serde_json::from_str::<Vec<ParametroPopDetalhado>>(&raw_json) {
                            Ok(data) => Ok(ApiResponse::success(format!("Dados para o grupo '{}' carregados.", grupo), Some(data))),
                            Err(e) => {
                                // Se a conversão falhar, este erro dir-nos-á exatamente porquê.
                                eprintln!("\n\n!!! ERRO DE DESERIALIZAÇÃO NO TAURI: {} !!!\n\n", e);
                                Err(ApiResponse::error(format!("Erro ao processar JSON da API no Tauri: {}", e)))
                            }
                        }
                    },
                    Err(e) => Err(ApiResponse::error(format!("Erro ao ler o corpo da resposta da API: {}", e)))
                }
                // --- FIM DO "ESPIÃO" ---
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}

/// [PUT] Atualiza o LQ e a Incerteza de um relacionamento.
#[command]
pub async fn atualizar_lq_incerteza_tauri(app_handle: AppHandle, id: u32, payload: AtualizacaoLqIncertezaPayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/parametro-pop/lq-incerteza/{}", api_url, id);

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Valores atualizados com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}