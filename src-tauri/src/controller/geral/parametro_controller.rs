use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::parametro::{Parametro, ParametroPayload, NovoParametroApiPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todos os Parâmetros da API.
#[command]
pub async fn listar_parametros() -> Result<ApiResponse<Vec<Parametro>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/parametros", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Parametro>>().await {
                    Ok(parametros) => Ok(ApiResponse::success("Parâmetros carregados com sucesso".to_string(), Some(parametros))),
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

/// [POST] Cadastra um novo Parâmetro via API.
#[command]
pub async fn cadastrar_parametro(parametro_data: ParametroPayload) -> Result<ApiResponse<Parametro>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/parametros", API_BASE_URL);

    // Converte o payload do frontend para o formato que a API REST espera.
    let api_payload = NovoParametroApiPayload {
        nome: parametro_data.nome,
        grupo: parametro_data.grupo,
        obs: parametro_data.obs,
        em_campo: if parametro_data.em_campo { 1 } else { 0 },
    };

    match client.post(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Parametro>().await {
                    Ok(parametro) => Ok(ApiResponse::success("Parâmetro cadastrado com sucesso!".to_string(), Some(parametro))),
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

/// [PUT] Edita um Parâmetro existente.
#[command]
pub async fn editar_parametro(parametro_data: ParametroPayload) -> Result<ApiResponse<Parametro>, ApiResponse<()>> {
    let parametro_id = match parametro_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID do parâmetro é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/parametros/{}", API_BASE_URL, parametro_id);

    let api_payload = NovoParametroApiPayload {
        nome: parametro_data.nome,
        grupo: parametro_data.grupo,
        obs: parametro_data.obs,
        em_campo: if parametro_data.em_campo { 1 } else { 0 },
    };

    match client.put(&url).json(&api_payload).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Parametro>().await {
                    Ok(parametro) => Ok(ApiResponse::success("Parâmetro atualizado com sucesso!".to_string(), Some(parametro))),
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

/// [DELETE] Deleta um Parâmetro existente.
#[command]
pub async fn deletar_parametro(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/parametros/{}", API_BASE_URL, id);
        // --- O NOSSO ESPIÃO NO BACKEND TAURI ---
        println!("[TAURI BACKEND] Recebido pedido para deletar ID: {}", id);
        println!("[TAURI BACKEND] A chamar a seguinte URL da API REST: {}", url);
        // -----------------------------------------

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Parâmetro removido com sucesso!".to_string(), None))
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
pub async fn listar_parametros_by_id() -> Result<ApiResponse<Vec<Parametro>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/parametros", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Parametro>>().await {
                    Ok(parametros) => Ok(ApiResponse::success("Parâmetros carregados com sucesso".to_string(), Some(parametros))),
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
