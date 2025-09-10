use tauri::{AppHandle, Manager};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use crate::config::get_api_url;
use chrono::{NaiveDateTime, DateTime, Utc};
// Structs para o input da API
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CreateFrotaManutencaoInput {
      pub tipo: Option<u32>,
    pub veiculo: Option<u32>,
    pub data: NaiveDateTime, // Pode receber como String do JSON
    pub data_manutencao: Option<NaiveDateTime>,
    pub observacao: Option<String>,
    pub data_realizada: Option<NaiveDateTime>,
    pub km: Option<u32>,
    pub proxima: Option<NaiveDateTime>,
}


#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFrotaManutencaoInput {
    pub veiculo_id: Option<u32>,
    pub data_servico: Option<String>,
    pub descricao_servico: Option<String>,
    pub valor: Option<f64>,
    pub km: Option<u32>,
    pub tipo_manutencao_id: Option<u32>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct FrotaManutencao {
    pub id: u32,
    pub tipo: Option<u32>,
    pub veiculo: Option<u32>,
    pub data: String, // Pode receber como String do JSON
    pub data_manutencao: Option<String>,
    pub observacao: Option<String>,
    pub data_realizada: Option<String>,
    pub km: Option<u32>,
    pub proxima: Option<String>,
}
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct CreateTipoManutencaoInput {
    pub nome: String,
}



#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct TipoManutencao {
    pub id: Option<u32>,
    pub nome: String,
}

// Estrutura genérica para a resposta da API com sucesso
#[derive(Debug, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

// Estrutura genérica para respostas de sucesso/falha simples
#[derive(Debug, Deserialize)]
pub struct GenericResponse {
    pub success: bool,
    pub message: String,
}

/// Comando para criar um novo registro de manutenção
#[command]
pub async fn criar_frota_manutencao(app_handle: AppHandle, payload: CreateFrotaManutencaoInput) -> Result<FrotaManutencao, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/frota/manutencao", api_url);

    let response = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao criar registro de manutenção: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let api_response: ApiResponse<FrotaManutencao> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha sem mensagem.".to_string()))
    }
}

/// Comando para buscar todos os registros de manutenção
#[command]
pub async fn buscar_manutencoes(app_handle: AppHandle) -> Result<Vec<FrotaManutencao>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/frota/manutencao", api_url);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao buscar registros de manutenção: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let api_response: ApiResponse<Vec<FrotaManutencao>> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha sem mensagem.".to_string()))
    }
}

#[command]
pub async fn criar_tipo_manutencao(app_handle: AppHandle, payload: CreateTipoManutencaoInput) -> Result<TipoManutencao, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    // A URL deve corresponder ao endpoint da API para criar tipos de manutenção.
    // Baseado no seu outro arquivo (manutencao_controller.rs), o endpoint era 'criar_manutencao_categoria'.
    let url = format!("{}/criar_manutencao_categoria", api_url);

    let response = client
        .post(&url)
        .json(&payload) // <- Envia o payload com o nome do tipo
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao criar tipo de manutenção: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    // A API de criação deve retornar um único tipo, não uma lista.
    let api_response: ApiResponse<TipoManutencao> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha sem mensagem.".to_string()))
    }
}



/// Comando para atualizar um registro de manutenção
#[command]
pub async fn atualizar_frota_manutencao(app_handle: AppHandle, id: u32, payload: UpdateFrotaManutencaoInput) -> Result<FrotaManutencao, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/atualizar_frota_manutencao/{}", api_url, id);

    let response = client
        .put(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao atualizar registro de manutenção: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let api_response: ApiResponse<FrotaManutencao> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha sem mensagem.".to_string()))
    }
}

#[command]
pub async fn buscar_tipos_manutencao(app_handle: AppHandle) -> Result<Vec<TipoManutencao>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/frota/manutencao/tipos", api_url);

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao buscar tipos de manutenção: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let api_response: ApiResponse<Vec<TipoManutencao>> = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        api_response.data.ok_or_else(|| "API retornou sucesso sem dados.".to_string())
    } else {
        Err(api_response.message.unwrap_or_else(|| "API retornou falha sem mensagem.".to_string()))
    }
}

#[command]
pub async fn deletar_tipo_manutencao(app_handle: AppHandle, id: u32) -> Result<String, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/frota/manutencao/tipos/{}", api_url, id);

    let response = client
        .delete(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao deletar tipo de manutenção: {}", e))?;
    
    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let api_response: GenericResponse = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        Ok(api_response.message)
    } else {
        Err(api_response.message)
    }
}

#[command]
pub async fn deletar_frota_manutencao(app_handle: AppHandle, id: u32) -> Result<String, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/deletar/manutencao/{}", api_url, id);

    let response = client
        .delete(&url)
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao deletar manutenção: {}", e))?;
    
    let status = response.status();
    if !status.is_success() {
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".into());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    let api_response: GenericResponse = response.json().await
        .map_err(|e| format!("Erro ao processar JSON da resposta: {}", e))?;

    if api_response.success {
        Ok(api_response.message)
    } else {
        Err(api_response.message)
    }
}