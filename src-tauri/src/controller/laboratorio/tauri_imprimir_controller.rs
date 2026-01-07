// src-tauri/src/commands/imprimir_commands.rs
use tauri::command;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::config::get_api_url;

// ==================== ESTRUTURAS ====================

#[derive(Serialize, Deserialize, Debug)]
pub struct FiltroImprimirRequest {
    pub impresso: Option<i32>,
    pub online: Option<i32>,
    pub enviado_email: Option<i32>,
    pub cliente_id: Option<String>,
    pub data_inicio: Option<String>,
    pub data_fim: Option<String>,
    pub pagina: i32,
    pub por_pagina: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RelatorioListagemDTO {
    pub id_grupo: u32,
    pub numero_relatorio: String,
    pub cliente_fantasia: String,
    pub amostras_texto: String,
    pub protocolo_cliente: Option<String>,
    pub data_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub impresso: bool,
    pub internet: bool,
    pub relatorio_email: bool,
    pub ano: String,
    pub mes: String,
    pub certificado_numero: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PaginacaoResponse {
    pub dados: Vec<RelatorioListagemDTO>,
    pub total: i64,
    pub pagina_atual: i32,
    pub total_paginas: i32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClienteDropdownDTO {
    pub id: String,
    pub fantasia: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ImprimirRelatoriosRequest {
    pub ids_grupos: Vec<u32>,
    pub usuario_id: i32,
    pub login_ftp: String,
    pub senha_ftp: String,
    pub servidor_ftp: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImprimirProgressoResponse {
    pub id_grupo: u32,
    pub status: String,
    pub mensagem: String,
    pub timestamp: String,
}

// ==================== COMANDOS TAURI ====================

// proxy_listar_clientes_imprimir, proxy_listar_relatorios_imprimir, proxy_imprimir_relatorios, proxy_visualizar_relatorio_imprimir
#[command]
pub async fn proxy_listar_clientes_imprimir(
    app_handle: tauri::AppHandle,
) -> Result<Vec<ClienteDropdownDTO>, String> {
    let url = format!(
        "{}/laboratorio/imprimir/clientes",
        get_api_url(&app_handle)
    );

    let client = Client::new();
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com API: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro na API: {}", response.status()));
    }

    response
        .json::<Vec<ClienteDropdownDTO>>()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))
}

/// Lista relatórios com filtros e paginação
#[command]
pub async fn proxy_listar_relatorios_imprimir(
    app_handle: tauri::AppHandle,
    filtro: FiltroImprimirRequest,
) -> Result<PaginacaoResponse, String> {
    let url = format!(
        "{}/laboratorio/imprimir/listar",
        get_api_url(&app_handle)
    );

    let client = Client::new();
    let response = client
        .post(&url)
        .json(&filtro)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com API: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Erro na API: {}", error_text));
    }

    response
        .json::<PaginacaoResponse>()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))
}

/// Processa impressão de relatórios (chama API que gera PDF, envia FTP e atualiza banco)
#[command]
pub async fn proxy_imprimir_relatorios(
    app_handle: tauri::AppHandle,
    request: ImprimirRelatoriosRequest,
) -> Result<Vec<ImprimirProgressoResponse>, String> {
    println!("📤 Iniciando impressão de {} relatórios", request.ids_grupos.len());

    let url = format!(
        "{}/laboratorio/imprimir/processar",
        get_api_url(&app_handle)
    );

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(300)) // 5 minutos
        .build()
        .unwrap();

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com API: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Erro na API: {}", error_text));
    }

    let resultados = response
        .json::<Vec<ImprimirProgressoResponse>>()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))?;

    println!("✅ Impressão concluída: {} resultados", resultados.len());
    Ok(resultados)
}

/// Busca dados de um relatório específico para visualização
#[command]
pub async fn proxy_visualizar_relatorio_imprimir(
    id_grupo: u32,
    data_criacao: String,
) -> Result<String, String> {
    let url = format!(
        "http://localhost:8083/api/relatorios/final/{}?data={}",
        id_grupo, data_criacao
    );

    println!("📄 Gerando preview de relatório: {}", id_grupo);

    let client = Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .unwrap();

    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com microserviço: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Microserviço retornou erro: {}", response.status()));
    }

    let json_response: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    if let Some(erro) = json_response.get("erro") {
        return Err(format!("Erro no relatório: {}", erro));
    }

    if let Some(pdf_base64) = json_response.get("pdfBase64").and_then(|v| v.as_str()) {
        println!("✅ PDF gerado com sucesso");
        Ok(pdf_base64.to_string())
    } else {
        Err("PDF não retornado pelo microserviço".to_string())
    }
}