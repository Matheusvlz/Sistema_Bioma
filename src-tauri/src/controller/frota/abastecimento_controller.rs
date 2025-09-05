use tauri::{AppHandle, Manager};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use crate::config::get_api_url;
use bigdecimal::BigDecimal;
use std::collections::HashMap;

// Struct para input de criação de abastecimento (do frontend)
#[derive(Debug, Deserialize, Serialize)]
pub struct FrotaAbastecimentoInput {
    pub veiculo: Option<u32>,
    pub motorista: Option<u32>,
    pub valor_litro: Option<BigDecimal>,
    pub litro: Option<BigDecimal>,
    pub valor: Option<BigDecimal>,
    pub combustivel: Option<u8>,
    pub posto: Option<u16>,
    pub data: Option<String>, // String porque vem do frontend
    pub notafiscal: Option<String>,
    pub quilometragem: Option<i32>,
    pub foto: Option<Vec<u8>>,
}

// Struct para a resposta da API do backend Axum
#[derive(Debug, Deserialize, Serialize)]
pub struct FrotaAbastecimento {
    pub id: u32,
    pub veiculo: Option<u32>,
    pub motorista: Option<u32>,
    pub valor_litro: Option<BigDecimal>,
    pub litro: Option<BigDecimal>,
    pub valor: Option<BigDecimal>,
    pub combustivel: Option<u8>,
    pub posto: Option<u16>,
    pub data: Option<String>,
    pub notafiscal: Option<String>,
    pub quilometragem: Option<i32>,
    pub foto: Option<Vec<u8>>,
}

// Struct para atualização de abastecimento
#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFrotaAbastecimentoInput {
    pub veiculo: Option<u32>,
    pub motorista: Option<u32>,
    pub valor_litro: Option<BigDecimal>,
    pub litro: Option<BigDecimal>,
    pub valor: Option<BigDecimal>,
    pub combustivel: Option<u8>,
    pub posto: Option<u16>,
    pub data: Option<String>,
    pub notafiscal: Option<String>,
    pub quilometragem: Option<i32>,
    pub foto: Option<Vec<u8>>,
}

// Struct para filtros de busca
#[derive(Debug, Deserialize, Serialize)]
pub struct FiltrosAbastecimento {
    pub veiculo_id: Option<u32>,
    pub motorista_id: Option<u32>,
    pub posto_id: Option<u16>,
    pub combustivel_id: Option<u8>,
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
    pub valor_minimo: Option<BigDecimal>,
    pub valor_maximo: Option<BigDecimal>,
}

// Estrutura genérica para a resposta da API
#[derive(Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GenericResponse {
    pub success: bool,
    pub message: String,
}

#[command]
pub async fn criar_frota_abastecimento(app_handle: AppHandle, payload: FrotaAbastecimentoInput) -> Result<FrotaAbastecimento, String> {
    println!("Recebido comando criar_frota_abastecimento com payload: {:?}", payload);
    
    // Validações básicas no lado do Rust
    if let Some(ref valor_litro) = payload.valor_litro {
        if *valor_litro <= BigDecimal::from(0) {
            return Err("Valor por litro deve ser maior que zero".to_string());
        }
    }
    
    if let Some(ref litro) = payload.litro {
        if *litro <= BigDecimal::from(0) {
            return Err("Quantidade de litros deve ser maior que zero".to_string());
        }
    }
    
    if let Some(quilometragem) = payload.quilometragem {
        if quilometragem < 0 {
            return Err("Quilometragem deve ser um valor positivo".to_string());
        }
    }

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let api_url = get_api_url(&app_handle);
    let url = format!("{}/criar_frota_abastecimento", api_url);
    
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

    let api_response: ApiResponse<FrotaAbastecimento> = serde_json::from_str(&response_text)
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}. Resposta: {}", e, response_text))?;

    if api_response.success {
        api_response.data
            .ok_or_else(|| "A API retornou sucesso, mas sem dados de abastecimento.".to_string())
    } else {
        Err(api_response.message
            .unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
    }
}

#[command]
pub async fn buscar_abastecimento(app_handle: tauri::AppHandle) -> Result<Vec<FrotaAbastecimento>, String> {
    println!("Recebido comando buscar_abastecimento");

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let api_url = get_api_url(&app_handle);
    let url = format!("{}/frota/abastecimentos/sem-foto", api_url);

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

    let api_response: ApiResponse<Vec<FrotaAbastecimento>> = serde_json::from_str(&response_text)
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}. Resposta: {}", e, response_text))?;

    if api_response.success {
        api_response.data
            .ok_or_else(|| "A API retornou sucesso, mas sem dados de abastecimentos.".to_string())
    } else {
        Err(api_response.message
            .unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
    }
}

// Nova função para buscar abastecimentos com filtros
#[command]
pub async fn buscar_abastecimento_filtrado(
    app_handle: tauri::AppHandle, 
    filtros: FiltrosAbastecimento
) -> Result<Vec<FrotaAbastecimento>, String> {
    println!("Recebido comando buscar_abastecimento_filtrado com filtros: {:?}", filtros);

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let api_url = get_api_url(&app_handle);
    let mut url = format!("{}/frota/abastecimentos/sem-foto", api_url);
    
    // Construir query parameters
    let mut params = Vec::new();
    
    if let Some(veiculo_id) = filtros.veiculo_id {
        params.push(format!("veiculo_id={}", veiculo_id));
    }
    
    if let Some(motorista_id) = filtros.motorista_id {
        params.push(format!("motorista_id={}", motorista_id));
    }
    
    if let Some(posto_id) = filtros.posto_id {
        params.push(format!("posto_id={}", posto_id));
    }
    
    if let Some(combustivel_id) = filtros.combustivel_id {
        params.push(format!("combustivel_id={}", combustivel_id));
    }
    
    if let Some(ref data_inicio) = filtros.data_inicio {
        params.push(format!("data_inicio={}", data_inicio));
    }
    
    if let Some(ref data_fim) = filtros.data_fim {
        params.push(format!("data_fim={}", data_fim));
    }
    
    if let Some(ref valor_minimo) = filtros.valor_minimo {
        params.push(format!("valor_minimo={}", valor_minimo));
    }
    
    if let Some(ref valor_maximo) = filtros.valor_maximo {
        params.push(format!("valor_maximo={}", valor_maximo));
    }
    
    if !params.is_empty() {
        url.push('?');
        url.push_str(&params.join("&"));
    }

    println!("Buscando dados filtrados da API: {}", url);

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

    let api_response: ApiResponse<Vec<FrotaAbastecimento>> = serde_json::from_str(&response_text)
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}. Resposta: {}", e, response_text))?;

    if api_response.success {
        api_response.data
            .ok_or_else(|| "A API retornou sucesso, mas sem dados de abastecimentos.".to_string())
    } else {
        Err(api_response.message
            .unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
    }
}

#[command]
pub async fn atualizar_frota_abastecimento(app_handle: AppHandle, id: u32, payload: UpdateFrotaAbastecimentoInput) -> Result<FrotaAbastecimento, String> {
    println!("Recebido comando atualizar_frota_abastecimento para o ID: {}", id);

    // Validações básicas no lado do Rust
    if let Some(ref valor_litro) = payload.valor_litro {
        if *valor_litro <= BigDecimal::from(0) {
            return Err("Valor por litro deve ser maior que zero".to_string());
        }
    }
    
    if let Some(ref litro) = payload.litro {
        if *litro <= BigDecimal::from(0) {
            return Err("Quantidade de litros deve ser maior que zero".to_string());
        }
    }
    
    if let Some(quilometragem) = payload.quilometragem {
        if quilometragem < 0 {
            return Err("Quilometragem deve ser um valor positivo".to_string());
        }
    }

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/atualizar_frota_abastecimento/{}", api_url, id);

    println!("Enviando dados de atualização para a API: {}", url);

    let response = client
        .put(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao atualizar abastecimento: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Falha ao ler corpo do erro".into());
        return Err(format!("A API retornou um erro: {}", err_body));
    }

    let api_response: ApiResponse<FrotaAbastecimento> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta da atualização: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados do abastecimento atualizado.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha na atualização sem mensagem.".to_string()))
    }
}

#[command]
pub async fn deletar_frota_abastecimento(app_handle: AppHandle, id: u32) -> Result<String, String> {
    println!("Recebido comando deletar_frota_abastecimento para o ID: {}", id);

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/deletar_frota_abastecimento/{}", api_url, id);

    println!("Enviando requisição de exclusão para a API: {}", url);

    let response = client
        .delete(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao deletar abastecimento: {}", e))?;

    if !response.status().is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Falha ao ler corpo do erro".into());
        return Err(format!("A API retornou um erro na exclusão: {}", err_body));
    }

    let api_response: GenericResponse = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta da exclusão: {}", e))?;

    if api_response.success {
        Ok(api_response.message)
    } else {
        Err(api_response.message)
    }
}
