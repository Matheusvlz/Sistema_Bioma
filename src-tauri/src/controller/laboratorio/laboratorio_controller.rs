use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value; // Para LaboratorioResponse genérica
use tauri::command;
use tauri::AppHandle;

use crate::config::get_api_url;

// ===================================================================================
// 1. STRUCTS DE COMUNICAÇÃO (Requisição e Resposta do AXUM, espelhadas no CLIENTE)
// ===================================================================================

// Requisição para buscar_finalizada2
#[derive(Serialize, Deserialize, Debug)]
pub struct FiltrosFinalizadas {
    pub grupos: Vec<Option<String>>,
    pub ordenar: Option<String>,
}

// Item detalhado de amostra finalizada (Espelha AmostraFinalizadaDetalhada do Servidor)
// Nota: Os campos refletem a query SQL complexa do servidor.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AmostraFinalizadaDetalhada {
    pub analise_id: u32,
    pub numero: String,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub dcoleta: Option<String>,
    pub hcoleta: Option<String>,
    pub dlab: String,
    pub hlab: String,
    pub dinicio: String,
    pub dtermino: Option<String>,
    pub dhtermino: Option<String>,
    pub hcoleta_amostra: Option<String>,
    pub fantasia: String,
    pub razao: String,
    pub datalab: String,
}

// Resposta para buscar_finalizada2
#[derive(Serialize, Deserialize, Debug)]
pub struct AmostraFinalizadaResponse {
    pub success: bool,
    pub data: Option<Vec<AmostraFinalizadaDetalhada>>,
    pub message: Option<String>,
}

// Requisição para revisar_amostras2
#[derive(Serialize, Deserialize, Debug)]
pub struct RevisarAmostrasRequest {
    pub id_usuario: String,
    pub amostras_ids: Vec<u32>,
}

// Resposta para revisar_amostras2
#[derive(Serialize, Deserialize, Debug)]
pub struct RevisarAmostrasResponse {
    pub success: bool,
    pub amostras_revisadas: usize,
    pub message: Option<String>,
}

// Requisição para bloquear_amostras2
#[derive(Serialize, Deserialize, Debug)]
pub struct BloquearAmostrasRequest {
    pub id_usuario: String,
    pub amostras_ids: Vec<u32>,
    pub bloquear: bool, // true = bloquear, false = desbloquear
}

// Resposta para bloquear_amostras2
#[derive(Serialize, Deserialize, Debug)]
pub struct BloquearAmostrasResponse {
    pub success: bool,
    pub amostras_afetadas: usize,
    pub message: Option<String>,
}

// Requisição para publicar_resultados2
#[derive(Serialize, Deserialize, Debug)]
pub struct PublicarResultadosRequest {
    pub amostras_ids: Vec<u32>,
}

// Resposta para publicar_resultados2
#[derive(Serialize, Deserialize, Debug)]
pub struct PublicarResultadosResponse {
    pub success: bool,
    pub resultados_publicados: usize,
    pub message: Option<String>,
}

// Item de laboratório para buscar_laboratorios2
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LaboratorioItem {
    pub id: u32,
    pub nome: Option<String>,
    pub grupos: Vec<String>,
}

// Resposta para buscar_laboratorios2
#[derive(Serialize, Deserialize, Debug)]
pub struct LaboratoriosResponse {
    pub success: bool,
    pub data: Vec<LaboratorioItem>,
    pub message: Option<String>,
}


// ===================================================================================
// 2. STRUCTS AUXILIARES E LEGADAS (Usadas por funções que retornam LaboratorioResponse genérica)
// ===================================================================================

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChecagemItem {
    pub fantasia: Option<String>,
    pub razao: Option<String>,
    pub max_numero: u32,
    pub min_numero: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SalvarTemperaturaResponse {
    pub success: bool,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct SalvarTemperaturaPayload {
    id: u32,        // ID do grupo_doble
    valor: String,  // Valor da temperatura digitado
    id_usuario: u32, // ID do usuário logado
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AmostraNaoIniciadaItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AmostraEmAnaliseItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub tempo: Option<String>,
    pub passou: bool,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TemperaturaItem {
    pub id: u32,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
    pub min_numero: Option<String>,
    pub max_numero: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AmostraBloqueadaItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
    pub usuario_bloqueio: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RegistroInsumoItem {
    pub id: u32,
    pub nome: Option<String>,
    pub data_registro: Option<String>,
    pub usuario_registro: Option<String>,
}

// STRUCT GENÉRICA DE RESPOSTA (com serde_json::Value no data)
// Usada pelas rotas genéricas para evitar definir centenas de structs.
#[derive(Serialize, Deserialize, Debug)]
pub struct LaboratorioResponse {
    pub success: bool,
    pub data: Option<Value>,
    pub message: Option<String>,
    pub tipo: String,
}

#[derive(Serialize)]
struct LaboratorioRequest {
    consulta_tipo: String,
}

// ===================================================================================
// 3. FUNÇÕES DE COMUNICAÇÃO TAURI (Client)
// ===================================================================================

async fn consulta_laboratorio(consulta_tipo: String) -> LaboratorioResponse {
    // Implementação da consulta legado...
    let client = Client::new();
    let request_data = LaboratorioRequest { consulta_tipo };
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://127.0.0.1:8082".to_string());
    let full_url = format!("{}/laboratorio", url);

    let res = match client
        .post(&full_url)
        .json(&request_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return LaboratorioResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
                tipo: "erro".to_string(),
            }
        }
    };

    if !res.status().is_success() {
        println!("Status não sucesso: {}", res.status());
        return LaboratorioResponse {
            success: false,
            data: None,
            message: Some("Erro na requisição".to_string()),
            tipo: "erro".to_string(),
        };
    }

    match res.json::<LaboratorioResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            LaboratorioResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
                tipo: "erro".to_string(),
            }
        }
    }
}

// Comandos Tauri Legados...

#[command]
pub async fn buscar_checagem() -> LaboratorioResponse {
    consulta_laboratorio("checagem".to_string()).await
}

#[command]
pub async fn buscar_nao_iniciada() -> LaboratorioResponse {
    consulta_laboratorio("nao_iniciada".to_string()).await
}

#[command]
pub async fn buscar_em_analise() -> LaboratorioResponse {
    consulta_laboratorio("em_analise".to_string()).await
}

#[command]
pub async fn buscar_temperatura() -> LaboratorioResponse {
    consulta_laboratorio("temperatura".to_string()).await
}

#[command]
pub async fn buscar_amostras_finalizadas() -> LaboratorioResponse {
    // Esta é a rota legada que retorna a estrutura LaboratorioResponse genérica.
    consulta_laboratorio("finalizada".to_string()).await
}

#[command]
pub async fn buscar_amostras_bloqueadas() -> LaboratorioResponse {
    consulta_laboratorio("bloqueada".to_string()).await
}

#[command]
pub async fn buscar_registro_insumo() -> LaboratorioResponse {
    consulta_laboratorio("registro_insumo".to_string()).await
}

#[command]
pub async fn buscar_amostras_disponiveis() -> LaboratorioResponse {
    consulta_laboratorio("amostra_disponivel".to_string()).await
}

#[command]
pub async fn salvar_temperatura_analise(
    app_handle: AppHandle,
    id: u32,
    valor: String,
    id_usuario: u32,
) -> Result<SalvarTemperaturaResponse, String> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);

    let url = format!("{}/laboratorio/salvar-temperatura", api_url); 

    let payload = SalvarTemperaturaPayload {
        id,
        valor,
        id_usuario,
    };
    
    println!("💾 Salvando temperatura: {:?}", payload);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                     match response.json::<SalvarTemperaturaResponse>().await {
                        Ok(response) => Ok(response),
                        Err(e) => {
                            eprintln!("Erro ao parsear JSON de sucesso: {:?}", e);
                            Err(e.to_string())
                        }
                    }
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    eprintln!("Erro do servidor: {} - {}", status, body);
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => {
             eprintln!("Erro de conexão: {}", e);
            Err(format!("Erro de conexão: {}", e))
        }
    }
}

// ===================================================================================
// MÉTODOS TAURI PARA A NOVA API AXUM (*2) - Usando as structs definidas acima
// ===================================================================================

#[command]
pub async fn buscar_finalizada2(
    app_handle: AppHandle,
    // Usa a struct definida localmente
    filtros: FiltrosFinalizadas, 
) -> Result<AmostraFinalizadaResponse, String> {
    
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/finalizadas", api_url);

    println!("🔎 Buscando amostras finalizadas com filtros: {:?}", filtros);
    
    let response = client
        .post(&url)
        .json(&filtros) // Envia os filtros recebidos como o payload da requisição
        .send()
        .await
        .map_err(|e| format!("Erro de rede ao buscar finalizadas: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        eprintln!("Erro do servidor ao buscar finalizadas: {} - {}", status, body);
        return Err(format!("Erro do servidor ({}): {}", status, body));
    }

    // Converte diretamente para a estrutura de resposta esperada
    match response.json::<AmostraFinalizadaResponse>().await {
        Ok(result) => Ok(result),
        Err(e) => {
            eprintln!("Erro ao parsear JSON de resposta finalizada: {:?}", e);
            Err(format!("Erro ao processar dados do servidor: {}", e))
        }
    }
}

#[command]
pub async fn revisar_amostras2(app_handle: AppHandle, request: RevisarAmostrasRequest) -> Result<RevisarAmostrasResponse, String> {
  
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/revisar", api_url);

    let response = client
        .post(&url)
        .json(&request)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    match response.json::<RevisarAmostrasResponse>().await {
        Ok(result) => Ok(result),
        Err(e) => {
            eprintln!("Erro ao parsear JSON de resposta de revisão: {:?}", e);
            Err(e.to_string())
        }
    }
}


#[command]
pub async fn bloquear_amostras2(
    app_handle: AppHandle,
    request: BloquearAmostrasRequest,
) -> Result<BloquearAmostrasResponse, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/bloquear", api_url);

    println!("🔒 Bloqueando/Desbloqueando amostras: {:?}", request);

    match client.post(&url).json(&request).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<BloquearAmostrasResponse>().await {
                        Ok(response) => Ok(response),
                        Err(e) => {
                            eprintln!("Erro ao parsear JSON de sucesso: {:?}", e);
                            Err(e.to_string())
                        }
                    }
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    eprintln!("Erro do servidor: {} - {}", status, body);
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => {
            eprintln!("Erro de conexão: {}", e);
            Err(format!("Erro de conexão: {}", e))
        }
    }
}

#[command]
pub async fn publicar_resultados2(
    app_handle: AppHandle,
    request: PublicarResultadosRequest,
) -> Result<PublicarResultadosResponse, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/publicar", api_url);

    println!("📤 Publicando resultados: {:?}", request);

    match client.post(&url).json(&request).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<PublicarResultadosResponse>().await {
                        Ok(response) => Ok(response),
                        Err(e) => {
                            eprintln!("Erro ao parsear JSON de sucesso: {:?}", e);
                            Err(e.to_string())
                        }
                    }
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    eprintln!("Erro do servidor: {} - {}", status, body);
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => {
            eprintln!("Erro de conexão: {}", e);
            Err(format!("Erro de conexão: {}", e))
        }
    }
}

#[command]
pub async fn buscar_laboratorios2(
    app_handle: AppHandle,
) -> Result<LaboratoriosResponse, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/laboratorio/labs", api_url);

    println!("🔬 Buscando laboratórios disponíveis");

    match client.get(&url).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<LaboratoriosResponse>().await {
                        Ok(response) => Ok(response),
                        Err(e) => {
                            eprintln!("Erro ao parsear JSON de sucesso: {:?}", e);
                            Err(e.to_string())
                        }
                    }
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    eprintln!("Erro do servidor: {} - {}", status, body);
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => {
            eprintln!("Erro de conexão: {}", e);
            Err(format!("Erro de conexão: {}", e))
        }
    }
}