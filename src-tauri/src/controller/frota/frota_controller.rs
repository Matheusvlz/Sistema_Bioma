use chrono::{NaiveDate, NaiveTime};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;
use tauri::command;
use crate::config::get_api_url;

#[derive(Deserialize, Serialize, Debug)]
pub struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct AgendamentoDia {
    id: u32,
    descricao: String,
    data: NaiveDate,
    hora: Option<NaiveTime>,
    nome: Option<String>,
}

#[command]
pub async fn buscar_agendamentos_hoje(app_handle: AppHandle) -> Result<Vec<AgendamentoDia>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/buscar_agendamentos_hoje", api_url);

    // Realiza a chamada à API
    let response = match client.get(&url).send().await {
        Ok(res) => res,
        Err(e) => return Err(format!("Erro de conexão ao buscar agendamentos: {}", e)),
    };

    // Verifica se o status da resposta é de sucesso (ex: 200 OK)
    if !response.status().is_success() {
        let status = response.status();
        let err_body = response.text().await.unwrap_or_else(|_| "Não foi possível ler o corpo do erro".to_string());
        return Err(format!("A API retornou um erro ({}): {}", status, err_body));
    }

    // Tenta deserializar o JSON para a nossa estrutura ApiResponse
    match response.json::<ApiResponse<Vec<AgendamentoDia>>>().await {
        Ok(api_response) => {
            // Verifica o campo 'success' dentro do JSON
            if api_response.success {
                // Retorna os dados, ou um vetor vazio se 'data' for nulo
                Ok(api_response.data.unwrap_or_default())
            } else {
                // A API retornou success: false, usa a mensagem de erro dela
                Err(api_response.message.unwrap_or_else(|| "A API indicou uma falha sem fornecer uma mensagem.".to_string()))
            }
        }
        Err(e) => Err(format!("Erro ao processar o JSON da resposta: {}", e)),
    }
}