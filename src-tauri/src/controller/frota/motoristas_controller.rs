use chrono::{NaiveDate, NaiveTime};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::command;
use crate::config::get_api_url;

// Estrutura de resposta da API genérica para ser reutilizável
#[derive(Deserialize, Serialize, Debug)]
pub struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
}

// Estrutura para os dados de um motorista
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Motorista {
    pub id: u32,
    pub nome: String,
    pub cnh: String,
}

// Estrutura para criar/editar motorista
#[derive(Deserialize, Serialize, Debug)]
pub struct MotoristaInput {
    pub nome: String,
    pub cnh: String,
}

#[command]
pub async fn buscar_motoristas(app_handle: AppHandle) -> Result<Vec<Motorista>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/buscar_motoristas", api_url);

    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao buscar motoristas: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Vec<Motorista>>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_default())
            } else {
                Err(api_response.message.unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
            }
        }
        Err(e) => Err(format!("Erro ao processar o JSON da resposta: {}", e)),
    }
}

#[command]
pub async fn criar_motorista(app_handle: AppHandle, nome: String, cnh: String) -> Result<Motorista, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/criar_motorista", api_url);

    let motorista_input = MotoristaInput { nome, cnh };

    let response = match client
        .post(&url)
        .json(&motorista_input)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao criar motorista: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Motorista>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_else(|| {
                    // Se a API retornou sucesso mas sem dados, criamos um motorista vazio
                    Motorista {
                        id: 0,
                        nome: "".to_string(),
                        cnh: "".to_string(),
                    }
                }))
            } else {
                Err(api_response.message.unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
            }
        }
        Err(e) => Err(format!("Erro ao processar o JSON da resposta: {}", e)),
    }
}

#[command]
pub async fn atualizar_motorista(app_handle: AppHandle, id: u32, nome: String, cnh: String) -> Result<Motorista, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/atualizar_motorista/{}", api_url, id);

    let motorista_input = MotoristaInput { nome, cnh };

    let response = match client
        .put(&url)
        .json(&motorista_input)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao atualizar motorista: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Motorista>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_else(|| {
                    // Se a API retornou sucesso mas sem dados, criamos um motorista vazio
                    Motorista {
                        id,
                        nome: "".to_string(),
                        cnh: "".to_string(),
                    }
                }))
            } else {
                Err(api_response.message.unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
            }
        }
        Err(e) => Err(format!("Erro ao processar o JSON da resposta: {}", e)),
    }
}

#[command]
pub async fn deletar_motorista(app_handle: AppHandle, id: u32) -> Result<bool, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/deletar_motorista/{}", api_url, id);

    let response = match client.delete(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao deletar motorista: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<()>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(true)
            } else {
                Err(api_response.message.unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
            }
        }
        Err(e) => Err(format!("Erro ao processar o JSON da resposta: {}", e)),
    }
}