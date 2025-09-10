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

// Estrutura para os dados de um posto
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Posto {
    pub id: u32,
    pub nome: String,
    pub telefone: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
}

// Estrutura para criar/editar posto
#[derive(Deserialize, Serialize, Debug)]
pub struct PostoInput {
    pub nome: String,
    pub telefone: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
}

// Estrutura para atualizar posto (campos opcionais)
#[derive(Deserialize, Serialize, Debug)]
pub struct UpdatePostoInput {
    pub nome: Option<String>,
    pub telefone: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
}


#[command]
pub async fn buscar_postos(app_handle: AppHandle) -> Result<Vec<Posto>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/buscar_postos", api_url);

    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao buscar postos: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Vec<Posto>>>().await {
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
pub async fn criar_posto(
    app_handle: AppHandle, 
    nome: String, 
    telefone: Option<String>, 
    endereco: Option<String>,
    numero: Option<String>, 
    bairro: Option<String>, 
    cidade: Option<String>,
    uf: Option<String>
) -> Result<Posto, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/criar_postos", api_url);

    let posto_input = PostoInput { nome, telefone, endereco, numero, bairro, cidade, uf };

    let response = match client
        .post(&url)
        .json(&posto_input)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao criar posto: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Posto>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_else(|| {
                    Posto {
                        id: 0,
                        nome: "".to_string(),
                        telefone: None,
                        endereco: None,
                        numero: None,
                        bairro: None,
                        cidade: None,
                        uf: None,
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
pub async fn atualizar_posto(
    app_handle: AppHandle, 
    id: u32, 
    nome: Option<String>, 
    telefone: Option<String>, 
    endereco: Option<String>, 
    numero: Option<String>, 
    bairro: Option<String>, 
    cidade: Option<String>, 
    uf: Option<String>
) -> Result<Posto, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/atualizar_postos/{}", api_url, id);

    let update_data = UpdatePostoInput { nome, telefone, endereco, numero, bairro, cidade, uf };

    let response = match client
        .put(&url)
        .json(&update_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao atualizar posto: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Posto>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_else(|| {
                    Posto {
                        id,
                        nome: "".to_string(),
                        telefone: None,
                        endereco: None,
                        numero: None,
                        bairro: None,
                        cidade: None,
                        uf: None,
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
pub async fn deletar_posto(app_handle: AppHandle, id: u32) -> Result<bool, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/deletar_postos/{}", api_url, id);

    let response = match client.delete(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao deletar posto: {}", e)),
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
