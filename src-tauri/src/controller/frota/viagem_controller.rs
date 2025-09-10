use tauri::{AppHandle, Manager};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use crate::config::get_api_url;

// Definir as structs que mapeiam os dados do frontend
// Elas precisam ser idênticas às interfaces do TypeScript
#[derive(Debug, Deserialize, Serialize)]
pub struct FrotaViagemInput {
    pub descricao: String,
    pub origem: String,
    pub destino: String,
    pub data_inicio: String,
    pub quilometragem_inicial: u32, // Alterado para u32
    pub quilometragem_final: Option<u32>, // Alterado para u32
    pub veiculo: u32,
    pub motorista: u32,
    pub data_termino: Option<String>,
}

// Struct para a resposta da API do backend Axum
#[derive(Debug, Deserialize, Serialize)]
pub struct FrotaViagem {
    pub id: u32,
    pub descricao: Option<String>,
    pub origem: Option<String>,
    pub destino: Option<String>,
    pub data_inicio: String,
    pub quilometragem_inicial: Option<u32>,
    pub quilometragem_final: Option<u32>,
    pub veiculo: u32,
    pub motorista: u32,
    pub data_termino: Option<String>,
}

// Estrutura para motorista
#[derive(Debug, Deserialize, Serialize)]
pub struct Motorista {
    pub id: u32,
    pub nome: String,
    pub cnh: String,
}

// Estrutura para veículo
#[derive(Debug, Deserialize, Serialize)]
pub struct Veiculo {
    pub id: u32,
    pub nome: String,
    pub marca: String,
    pub placa: String,
    pub ano: String,
}

// Estrutura genérica para a resposta da API
#[derive(Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFrotaViagemInput {
    pub descricao: Option<String>,
    pub origem: Option<String>,
    pub destino: Option<String>,
    pub data_inicio: Option<String>,
    pub quilometragem_inicial: Option<u32>,
    pub quilometragem_final: Option<u32>,
    pub veiculo: Option<u32>,
    pub motorista: Option<u32>,
    pub data_termino: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GenericResponse {
    pub success: bool,
    pub message: String,
}

#[command]
pub async fn criar_frota_viagem(app_handle: AppHandle, payload: FrotaViagemInput) -> Result<FrotaViagem, String> {
    println!("Recebido comando criar_frota_viagem com payload: {:?}", payload);
    
    // Validações básicas no lado do Rust
    if payload.descricao.trim().is_empty() {
        return Err("Descrição não pode estar vazia".to_string());
    }
    
    if payload.origem.trim().is_empty() {
        return Err("Origem não pode estar vazia".to_string());
    }
    
    // As validações de quilometragem precisam ser ajustadas para u32
    if payload.quilometragem_inicial < 0 {
        return Err("Quilometragem inicial deve ser um valor positivo".to_string());
    }
    
    if let Some(km_final) = payload.quilometragem_final {
        if km_final <= payload.quilometragem_inicial {
            return Err("Quilometragem final deve ser maior que a inicial".to_string());
        }
    }

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let api_url = get_api_url(&app_handle);
    let url = format!("{}/criar_frota_viagem", api_url);
    
    println!("Enviando dados para a API: {}", url);
    println!("Payload sendo enviado: {:?}", payload);

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
        .map_err(|e| {
            eprintln!("Erro de conexão: {:?}", e);
            if e.is_timeout() {
                "Tempo limite de conexão excedido. Verifique se a API está rodando.".to_string()
            } else if e.is_connect() {
                format!("Não foi possível conectar à API em {}. Verifique se o servidor está rodando.", url)
            } else {
                format!("Erro de rede: {}", e)
            }
        })?;

    let status = response.status();
    println!("Status da resposta: {}", status);

    if !status.is_success() {
        let err_body = response.text().await
            .unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        eprintln!("Erro da API: {} - {}", status, err_body);
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let response_text = response.text().await
        .map_err(|e| format!("Erro ao ler resposta da API: {}", e))?;

    println!("Resposta da API: {}", response_text);

    let api_response: ApiResponse<FrotaViagem> = serde_json::from_str(&response_text)
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}. Resposta: {}", e, response_text))?;

    if api_response.success {
        api_response.data
            .ok_or_else(|| "A API retornou sucesso, mas sem dados de viagem.".to_string())
    } else {
        Err(api_response.message
            .unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
    }
}

#[command]
pub async fn buscar_viagens(app_handle: tauri::AppHandle) -> Result<Vec<FrotaViagem>, String> {
    println!("Recebido comando buscar_viagens");

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let api_url = get_api_url(&app_handle);
    let url = format!("{}/buscar_viagem", api_url);

    println!("Buscando dados da API: {}", url);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| {
            eprintln!("Erro de conexão: {:?}", e);
            if e.is_timeout() {
                "Tempo limite de conexão excedido. Verifique se a API está rodando.".to_string()
            } else if e.is_connect() {
                format!("Não foi possível conectar à API em {}. Verifique se o servidor está rodando.", url)
            } else {
                format!("Erro de rede: {}", e)
            }
        })?;

    let status = response.status();
    println!("Status da resposta: {}", status);

    if !status.is_success() {
        let err_body = response.text().await
            .unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        eprintln!("Erro da API: {} - {}", status, err_body);
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let response_text = response.text().await
        .map_err(|e| format!("Erro ao ler resposta da API: {}", e))?;

    println!("Resposta da API: {}", response_text);

    let api_response: ApiResponse<Vec<FrotaViagem>> = serde_json::from_str(&response_text)
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}. Resposta: {}", e, response_text))?;

    if api_response.success {
        api_response.data
            .ok_or_else(|| "A API retornou sucesso, mas sem dados de viagens.".to_string())
    } else {
        Err(api_response.message
            .unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
    }
}

#[command]
pub async fn atualizar_frota_viagem(app_handle: AppHandle, id: u32, payload: UpdateFrotaViagemInput) -> Result<FrotaViagem, String> {
    println!("Recebido comando atualizar_frota_viagem para o ID: {}", id);

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/atualizar_frota_viagem/{}", api_url, id); // Rota específica para o ID

    println!("Enviando dados de atualização para a API: {}", url);

    let response = client
        .put(&url) // Usando o método HTTP PUT
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao atualizar viagem: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Falha ao ler corpo do erro".into());
        return Err(format!("A API retornou um erro: {}", err_body));
    }

    let api_response: ApiResponse<FrotaViagem> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta da atualização: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados da viagem atualizada.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha na atualização sem mensagem.".to_string()))
    }
}

/// ## Comando para DELETAR uma viagem (DELETE)
#[command]
pub async fn deletar_frota_viagem(app_handle: AppHandle, id: u32) -> Result<String, String> {
    println!("Recebido comando deletar_frota_viagem para o ID: {}", id);

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/deletar_frota_viagem/{}", api_url, id); // Rota específica para o ID

    println!("Enviando requisição de exclusão para a API: {}", url);

    let response = client
        .delete(&url) // Usando o método HTTP DELETE
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao deletar viagem: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Falha ao ler corpo do erro".into());
        return Err(format!("A API retornou um erro na exclusão: {}", err_body));
    }

    let api_response: GenericResponse = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta da exclusão: {}", e))?;

    if api_response.success {
        Ok(api_response.message) // Retorna a mensagem de sucesso (ex: "Viagem deletada com sucesso")
    } else {
        Err(api_response.message)
    }
}