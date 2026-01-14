// src-tauri/src/lib.rs
use tauri::command;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use crate::config::get_api_url;

// URL base do Microserviço Spring (Relatórios) - Porta 8083
const SPRING_API_BASE: &str = "http://localhost:8083/api/relatorios";
use crate::model::usuario::obter_usuario;
// ==================== ESTRUTURAS ====================

#[derive(Serialize, Deserialize, Debug)]
pub struct ClienteDTO {
    pub id: i64,
    pub fantasia: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AnaliseRevisadaDTO {
    // CORRIGIDO: Deve ser u32 para corresponder ao INT UNSIGNED no banco de dados
    pub id_grupo: u32,
    pub cliente_fantasia: String,
    pub data_lab: Option<String>,
    pub data_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub data_agendada: Option<String>,
    pub ass_liberacao: Option<String>,
    pub amostras_texto: String,
    pub tem_observacao: bool,
    pub obs_texto: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct FiltroAnaliseRevisada {
    pub cliente_id: Option<i32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AssinarRequest {
    // CORRIGIDO: IDs de grupo devem ser u32
    pub ids: Vec<u32>,
    pub usuario_id: i32,
    pub usuario_nome: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RelatorioResponse {
    #[serde(rename = "pdfBase64")]
    pub pdf_base64: Option<String>,
    pub erro: Option<String>,
}

// ==================== COMANDOS TAURI (API RUST) ====================

/// Lista clientes que possuem análises revisadas
#[command]
pub async fn proxy_listar_clientes_revisao(
    app_handle: tauri::AppHandle,
) -> Result<Vec<ClienteDTO>, String> {
    // Usa a API Principal (Rust) via get_api_url
    let url = format!(
        "{}/laboratorio/analise-revisada/clientes",
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

    let clientes = response
        .json::<Vec<ClienteDTO>>()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))?;

    Ok(clientes)
}

/// Lista análises revisadas com filtro opcional de cliente
#[command]
pub async fn proxy_listar_analises_revisadas(
    app_handle: tauri::AppHandle,
    cliente_id: Option<i32>,
) -> Result<Vec<AnaliseRevisadaDTO>, String> {
    // Usa a API Principal (Rust) via get_api_url
    let url = format!(
        "{}/laboratorio/analise-revisada/listar",
        get_api_url(&app_handle)
    );

    let filtro = FiltroAnaliseRevisada { cliente_id };

    let client = Client::new();
    let response = client
        .post(&url)
        .json(&filtro)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com API: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro na API: {}", response.status()));
    }

    let analises = response
        .json::<Vec<AnaliseRevisadaDTO>>()
        .await
        .map_err(|e| format!("Erro ao parsear resposta: {}", e))?;

    Ok(analises)
}

/// Assina (autentica) relatórios selecionados
#[command]
pub async fn proxy_assinar_relatorios(
    app_handle: tauri::AppHandle,
    request: AssinarRequest,
) -> Result<String, String> {
    // Usa a API Principal (Rust) via get_api_url
    let url = format!(
        "{}/laboratorio/analise-revisada/assinar",
        get_api_url(&app_handle)
    );

    let client = Client::new();
    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com API: {}", e))?;

    if !response.status().is_success() {
        let error_msg = response.text().await.unwrap_or_else(|_| "Erro desconhecido".to_string());
        return Err(format!("Erro na API: {}", error_msg));
    }

    Ok("Relatórios assinados com sucesso".to_string())
}

// ==================== COMANDOS SPRING (RELATÓRIOS PDF) ====================

/// Gera relatório final em PDF via microserviço Kotlin
#[command]
pub async fn gerar_relatorio_final2(
    id_grupo: u32,
    data_entrada: String,
) -> Result<RelatorioResponse, String> {
    // Usa o Spring na porta 8083
    let url = format!(
        "{}/final/{}?data={}",
        SPRING_API_BASE, id_grupo, data_entrada
    );

    println!("🔄 Solicitando relatório (Spring): {}", url);

    let client = Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com microserviço: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("Microserviço retornou erro: {}", status));
    }

    let body_text = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta: {}", e))?;

    let relatorio_response: RelatorioResponse = serde_json::from_str(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON do relatório: {}", e))?;

    if let Some(erro) = &relatorio_response.erro {
        return Err(format!("Erro no relatório: {}", erro));
    }

    println!("✅ Relatório gerado com sucesso");
    Ok(relatorio_response)
}

/// Gera relatório de amostragem
#[command]
pub async fn gerar_relatorio_amostragem(
    id_grupo: u32,
    data_entrada: String,
) -> Result<RelatorioResponse, String> {
    // Usa o Spring na porta 8083
    let url = format!(
        "{}/amostragem/{}?data={}",
        SPRING_API_BASE, id_grupo, data_entrada
    );

    println!("🔄 Solicitando relatório de amostragem: {}", url);

    let client = Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com microserviço: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Microserviço retornou erro: {}", response.status()));
    }

    let body_text = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta: {}", e))?;

    let relatorio_response: RelatorioResponse = serde_json::from_str(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    if let Some(erro) = &relatorio_response.erro {
        return Err(format!("Erro no relatório: {}", erro));
    }

    println!("✅ Relatório de amostragem gerado");
    Ok(relatorio_response)
}

/// Gera relatório de controle de qualidade
#[command]
pub async fn gerar_relatorio_cq(
    id_grupo: u32,
    data_entrada: String,
) -> Result<RelatorioResponse, String> {
    // Usa o Spring na porta 8083
    let url = format!(
        "{}/cq/{}?data={}",
        SPRING_API_BASE, id_grupo, data_entrada
    );

    println!("🔄 Solicitando relatório CQ: {}", url);

    let client = Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com microserviço: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Microserviço retornou erro: {}", response.status()));
    }

    let body_text = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta: {}", e))?;

    let relatorio_response: RelatorioResponse = serde_json::from_str(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON: {}", e))?;

    if let Some(erro) = &relatorio_response.erro {
        return Err(format!("Erro no relatório: {}", erro));
    }

    println!("✅ Relatório CQ gerado");
    Ok(relatorio_response)
}


#[command]
pub async fn gerar_relatorio_preview(
    id_grupo: u32,
) -> Result<RelatorioResponse, String> {
    // Usa o Spring na porta 8083
    let url = format!(
        "{}/preview/{}",
        SPRING_API_BASE, id_grupo
    );

    println!("📄 Solicitando preview (PRÉ-ASSINATURA): {}", url);

    let client = Client::new();
    let response = client
        .get(&url)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
        .map_err(|e| format!("Erro ao conectar com microserviço: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        return Err(format!("Microserviço retornou erro: {}", status));
    }

    let body_text = response
        .text()
        .await
        .map_err(|e| format!("Erro ao ler resposta: {}", e))?;

    let relatorio_response: RelatorioResponse = serde_json::from_str(&body_text)
        .map_err(|e| format!("Erro ao parsear JSON do relatório: {}", e))?;

    if let Some(erro) = &relatorio_response.erro {
        return Err(format!("Erro no relatório: {}", erro));
    }

    println!("✅ Preview gerado com sucesso");
    Ok(relatorio_response)
}