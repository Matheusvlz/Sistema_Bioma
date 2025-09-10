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

// Estrutura para os dados de um veículo
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Veiculo {
    pub id: u32,
    pub nome: String,
    pub marca: u32,
    pub ano: String,
    pub placa: String,
}

// Estrutura para os dados de uma marca
#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Marca {
    pub id: u32,
    pub nome: String,
}

// Estrutura para criar/editar veículo
#[derive(Deserialize, Serialize, Debug)]
pub struct VeiculoInput {
    pub nome: String,
    pub marca: u32,
    pub ano: String,
    pub placa: String,
}

// Estrutura para resposta de busca de veículos e marcas
#[derive(Deserialize, Serialize, Debug)]
pub struct VeiculosMarcasResponse {
    pub veiculos: Vec<Veiculo>,
    pub marcas: Vec<Marca>,
}




// Buscar veículos e marcas
#[command]
pub async fn buscar_veiculos_e_marcas(app_handle: AppHandle) -> Result<Vec<Veiculo>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/buscar_veiculos_e_marcas", api_url);

    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao buscar veículos: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Vec<Veiculo>>>().await {
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
pub async fn buscar_marcas(app_handle: AppHandle) -> Result<Vec<Marca>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/buscar_marcas", api_url);

    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao buscar veículos: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Vec<Marca>>>().await {
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
pub async fn criar_veiculo(
    app_handle: AppHandle, 
    nome: String, 
    marca: u32, 
    ano: String, 
    placa: String
) -> Result<Veiculo, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/criar_veiculo", api_url);

    let veiculo_input = VeiculoInput { nome, marca, ano, placa };

    let response = match client
        .post(&url)
        .json(&veiculo_input)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao criar veículo: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Veiculo>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_else(|| {
                    // Se a API retornou sucesso mas sem dados, criamos um veículo vazio
                    Veiculo {
                        id: 0,
                        nome: "".to_string(),
                        marca: 0,
                        ano: "".to_string(),
                        placa: "".to_string(),
                    }
                }))
            } else {
                Err(api_response.message.unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
            }
        }
        Err(e) => Err(format!("Erro ao processar o JSON da resposta: {}", e)),
    }
}

// Atualizar veículo
#[command]
pub async fn atualizar_veiculo(
    app_handle: AppHandle, 
    id: u32, 
    nome: Option<String>, 
    marca: Option<u32>, 
    ano: Option<String>, 
    placa: Option<String>
) -> Result<Veiculo, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/atualizar_veiculo/{}", api_url, id);

    // Estrutura para atualização parcial
    #[derive(Serialize)]
    struct UpdateVeiculo {
        nome: Option<String>,
        marca: Option<u32>,
        ano: Option<String>,
        placa: Option<String>,
    }

    let update_data = UpdateVeiculo { nome, marca, ano, placa };

    let response = match client
        .put(&url)
        .json(&update_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao atualizar veículo: {}", e)),
    };

    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    match response.json::<ApiResponse<Veiculo>>().await {
        Ok(api_response) => {
            if api_response.success {
                Ok(api_response.data.unwrap_or_else(|| {
                    // Se a API retornou sucesso mas sem dados, criamos um veículo vazio
                    Veiculo {
                        id,
                        nome: "".to_string(),
                        marca: 0,
                        ano: "".to_string(),
                        placa: "".to_string(),
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
pub async fn deletar_veiculo(app_handle: AppHandle, id: u32) -> Result<bool, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/deletar_veiculo/{}", api_url, id);

    let response = match client.delete(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao deletar veículo: {}", e)),
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

