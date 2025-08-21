use tauri::command;
use reqwest::Client;
use crate::model::api_response::{ApiResponse, ApiError};
use crate::model::consultor::{Consultor, NovoConsultor, CriarConsultorPayload};

const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todos os consultores da API.
#[command]
pub async fn show_cadastrados() -> Result<ApiResponse<Vec<Consultor>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/consultores", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Consultor>>().await {
                    Ok(consultores) => Ok(ApiResponse::success("Consultores carregados".to_string(), Some(consultores))),
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

/// [POST] Cadastra um novo consultor via API.
#[command]
pub async fn cadastrar_consultor(consultor_data: CriarConsultorPayload) -> Result<ApiResponse<Consultor>, ApiResponse<()>> {
    let novo_consultor = NovoConsultor {
        nome: Some(consultor_data.nome),
        documento: consultor_data.documento,
        telefone: consultor_data.telefone,
        email: consultor_data.email,
        ativo: Some(if consultor_data.ativo { 1 } else { 0 }),
    };

    let client = Client::new();
    let url = format!("{}/consultores", API_BASE_URL);

    match client.post(&url).json(&novo_consultor).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Consultor>().await {
                    Ok(c) => Ok(ApiResponse::success("Consultor cadastrado com sucesso!".to_string(), Some(c))),
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

/// [PUT] Edita um consultor existente.
#[command]
pub async fn editar_consultor(consultor: Consultor) -> Result<ApiResponse<Consultor>, ApiResponse<()>> {
    let consultor_id = match consultor.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID do consultor é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/consultores/{}", API_BASE_URL, consultor_id);

    match client.put(&url).json(&consultor).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Consultor>().await {
                    Ok(c) => Ok(ApiResponse::success("Consultor atualizado com sucesso!".to_string(), Some(c))),
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

/// [DELETE] Deleta um consultor.
#[command]
pub async fn deletar_consultor(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/consultores/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Consultor removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
