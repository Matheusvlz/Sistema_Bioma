use tauri::{command, AppHandle};
use reqwest::Client;
use std::process::Command;
use crate::model::api_response::ApiResponse;
use crate::config::get_api_url;

// Importa os models completos
use crate::model::financeiro_bi::{
    PaginatedBoletoResponse, 
    FiltrosAuditoriaPayload, FiltrosBoletoApiPayload,
    ArquivoRedePayload, ArquivoRedeApiPayload
};

#[derive(serde::Deserialize)]
struct CaminhoResponse { caminho: String }

// =====================================================================
// COMANDO 1: LISTAR RASTREABILIDADE (BOLETOS)
// =====================================================================
#[command]
pub async fn listar_rastreabilidade_boletos_tauri(
    app_handle: AppHandle,
    payload: FiltrosAuditoriaPayload
) -> Result<ApiResponse<PaginatedBoletoResponse>, ApiResponse<()>> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    // Rota da API
    let url = format!("{}/financeiro/auditoria", api_url);

    println!("\n=== TAURI DEBUG: RASTREABILIDADE BOLETOS ===");
    println!("1. URL Alvo: {}", url);
    
    // Isso agora vai compilar porque o Model tem 'data_inicio'
    println!("2. Filtros (Vencimento): {:?} até {:?}", payload.data_inicio, payload.data_fim);

    // DE-PARA: Mapeia 'data_inicio' (Front) para 'data_vencimento_inicio' (API)
    let api_payload = FiltrosBoletoApiPayload {
        data_vencimento_inicio: payload.data_inicio,
        data_vencimento_fim: payload.data_fim,
        cliente_id: payload.cliente_id,
        cidade: payload.cidade,
        pagina: payload.pagina,
        itens_por_pagina: payload.itens_por_pagina,
    };

    match client.get(&url).query(&api_payload).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<PaginatedBoletoResponse>().await {
                    Ok(data) => {
                        println!("3. SUCESSO! Boletos encontrados: {}", data.total_registros);
                        Ok(ApiResponse::success("OK".to_string(), Some(data)))
                    },
                    Err(e) => {
                        println!("ERRO PARSE JSON: {:?}", e);
                        Err(ApiResponse::error(format!("Erro Parse JSON (Estrutura incorreta?): {}", e)))
                    },
                }
            } else {
                let s = response.status();
                let t = response.text().await.unwrap_or_default();
                println!("ERRO API: {} - {}", s, t);
                Err(ApiResponse::error(format!("API Erro ({}): {}", s, t)))
            }
        },
        Err(e) => {
            println!("ERRO CONEXAO: {:?}", e);
            Err(ApiResponse::error(format!("Sem conexão com a API: {}", e)))
        },
    }
}

// =====================================================================
// COMANDO 2: ABRIR ARQUIVO DA REDE
// =====================================================================
#[command]
pub async fn abrir_arquivo_rede_bioma_tauri(
    app_handle: AppHandle,
    payload: ArquivoRedePayload
) -> Result<ApiResponse<String>, ApiResponse<()>> {

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/financeiro/arquivo-rede", api_url); 

    let api_payload = ArquivoRedeApiPayload {
        tipo: payload.tipo,
        numero: payload.numero,
        ano: payload.ano,
        nf: payload.nf,
        data_competencia: payload.data_competencia,
    };

    let caminho = match client.get(&url).query(&api_payload).send().await {
        Ok(res) => {
            if res.status().is_success() {
                match res.json::<CaminhoResponse>().await {
                    Ok(j) => j.caminho,
                    Err(_) => return Err(ApiResponse::error("Erro ao ler JSON de caminho".to_string())),
                }
            } else {
                return Err(ApiResponse::error("Arquivo não encontrado pelo servidor".to_string()));
            }
        },
        Err(e) => return Err(ApiResponse::error(format!("Erro conexão: {}", e))),
    };

    if caminho.is_empty() { return Err(ApiResponse::error("Caminho retornado vazio".to_string())); }

    println!("Tentando abrir no SO: {}", caminho);

    #[cfg(target_os = "windows")]
    {
        // Sanitização para Windows
        let caminho_win = caminho.replace("/", "\\"); 
        Command::new("explorer").arg(&caminho_win).spawn().map_err(|e| ApiResponse::error(e.to_string()))?; 
    }

    #[cfg(not(target_os = "windows"))]
    { 
        Command::new("xdg-open").arg(&caminho).spawn().map_err(|e| ApiResponse::error(e.to_string()))?; 
    }

    Ok(ApiResponse::success(format!("Abrindo: {}", caminho), Some(caminho)))
}