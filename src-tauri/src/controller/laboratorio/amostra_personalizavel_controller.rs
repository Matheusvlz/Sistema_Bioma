// src-tauri/src/controllers/laboratorio/amostra_personalizavel_controller.rs

use tauri::{command, AppHandle};
use reqwest::Client;

use crate::config::get_api_url;
use crate::model::api_response::ApiResponse;
use crate::model::amostra_personalizavel::{
    AmostraPersonalizavelDetalhado, AmostraPersonalizavelPayload,
};


#[command]
pub async fn listar_amostras_por_faixa_tauri(
    app_handle: AppHandle,
    inicio: u32,
    fim: u32,
) -> Result<ApiResponse<Vec<AmostraPersonalizavelDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/amostras/por-faixa/{}/{}", api_url, inicio, fim);

    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                // --- NOSSO ESPIÃO ---
                // 1. Primeiro, lemos a resposta como TEXTO puro, sem tentar adivinhar o formato.
                let response_text_result = response.text().await;

                // 2. Verificamos se a leitura do texto em si falhou.
                if let Err(e) = &response_text_result {
                    return Err(ApiResponse::error(format!("Erro ao ler o corpo da resposta da API: {}", e)));
                }
                let text = response_text_result.unwrap();

                // 3. IMPRIMIMOS O TEXTO no console do `cargo run` para podermos ver!
                println!("\n\n--- RESPOSTA DA API (ESPIÃO) ---");
                println!("{}", text);
                println!("---------------------------------\n\n");

                // 4. AGORA, tentamos converter o texto que capturamos para JSON.
                // Isto provavelmente ainda vai falhar, mas o print acima nos dará a prova do porquê.
                match serde_json::from_str::<Vec<AmostraPersonalizavelDetalhado>>(&text) {
                    Ok(data) => Ok(ApiResponse::success("Dados carregados.".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON da API: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}


#[command]
pub async fn atualizar_amostras_em_lote_tauri(
    app_handle: AppHandle,
    payload: Vec<AmostraPersonalizavelPayload>,
) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/amostras/personalizar", api_url);

    match client.put(&url).json(&payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Amostras atualizadas com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        }
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão com a API: {}", e))),
    }
}