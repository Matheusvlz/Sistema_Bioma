use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::lab_terceirizado::{LaboratorioTerceirizado, LaboratorioTerceirizadoPayload};

// NOTA: Verifique se esta URL corresponde à da sua API REST.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

/// [GET] Busca todos os laboratórios terceirizados da API.
#[command]
pub async fn listar_labs_terceirizados() -> Result<ApiResponse<Vec<LaboratorioTerceirizado>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorios-terceirizados", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<LaboratorioTerceirizado>>().await {
                    Ok(labs) => Ok(ApiResponse::success("Laboratórios carregados".to_string(), Some(labs))),
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

/// [POST] Cadastra um novo laboratório terceirizado via API.
#[command]
pub async fn cadastrar_lab_terceirizado(lab_data: LaboratorioTerceirizadoPayload) -> Result<ApiResponse<LaboratorioTerceirizado>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorios-terceirizados", API_BASE_URL);

    match client.post(&url).json(&lab_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<LaboratorioTerceirizado>().await {
                    Ok(lab) => Ok(ApiResponse::success("Laboratório cadastrado com sucesso!".to_string(), Some(lab))),
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

/// [PUT] Edita um laboratório terceirizado existente.
#[command]
pub async fn editar_lab_terceirizado(lab_data: LaboratorioTerceirizadoPayload) -> Result<ApiResponse<LaboratorioTerceirizado>, ApiResponse<()>> {
    let lab_id = match lab_data.ID {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID do laboratório é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/laboratorios-terceirizados/{}", API_BASE_URL, lab_id);

    match client.put(&url).json(&lab_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<LaboratorioTerceirizado>().await {
                    Ok(lab) => Ok(ApiResponse::success("Laboratório atualizado com sucesso!".to_string(), Some(lab))),
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

/// [DELETE] Deleta um laboratório terceirizado.
#[command]
pub async fn deletar_lab_terceirizado(id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorios-terceirizados/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Laboratório removido com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}
