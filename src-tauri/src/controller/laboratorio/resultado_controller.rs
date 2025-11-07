// src-tauri/src/commands/resultado_controller.rs - VERSÃO CORRIGIDA E COMPLETA
use serde::{Deserialize, Serialize};
use reqwest::Client;
use tauri::command;
use tauri::AppHandle;
use crate::config::get_api_url;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResultadoItem {
    pub id: u32,
    pub id_analise: u32,
    pub nome_parametro: Option<String>,
    pub grupo_parametro: Option<String>,
    pub tecnica_nome: Option<String>,
    pub unidade: Option<String>,
    pub limite: Option<String>,
    pub resultado: Option<String>,
    pub data_inicio: Option<String>,
    pub hora_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub hora_termino: Option<String>,
    pub analista: Option<String>,
    pub em_campo: bool,
    pub terceirizado: bool,
    // CAMPOS ADICIONADOS
    pub id_legislacao: u32,
    pub id_parametro: u32,
    pub id_legislacao_parametro: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AmostraResultadoInfo {
    pub id_analise: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub data_coleta: Option<String>,
    pub hora_coleta: Option<String>,
    pub data_entrada_lab: Option<String>,
    pub hora_entrada_lab: Option<String>,
    pub data_inicio_analise: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AmostraResultadosResponse {
    pub info: AmostraResultadoInfo,
    pub resultados: Vec<ResultadoItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResultadoDetalhes {
    pub id: u32,
    pub id_analise: u32,
    pub nome_parametro: Option<String>,
    pub grupo_parametro: Option<String>,
    pub tecnica_nome: Option<String>,
    pub unidade: Option<String>,
    pub limite: Option<String>,
    pub resultado: Option<String>,
    pub data_inicio: Option<String>,
    pub hora_inicio: Option<String>,
    pub data_termino: Option<String>,
    pub hora_termino: Option<String>,
    pub analista: Option<String>,
    pub em_campo: bool,
    pub terceirizado: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalvarResultadoPayload {
    pub id_resultado: u32,
    pub resultado: String,
    pub data_termino: String,
    pub hora_termino: String,
    pub id_usuario: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EtapaPayload {
    pub id: u32,
    pub valor: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VistarResultadoPayload {
    pub id_resultado: u32,
    pub id_usuario: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EtapaItem {
    pub id: u32,
    pub descricao: Option<String>,
    pub valor: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ResultadoDetalheResponse {
    pub resultado: ResultadoDetalhes,
    pub etapas: Vec<EtapaItem>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SalvarResultadoCompletoPayload {
    pub id_resultado: u32,
    pub resultado: String,
    pub data_termino: String,
    pub hora_termino: String,
    pub etapas: Vec<EtapaPayload>,
    pub id_usuario: u32,
}

// --- NOVOS STRUCTS PARA ALTERAR POP ---
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PopAlternativo {
    id_nova_leg_par: u32,
    pop: Option<String>,
    limite: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AlterarPopPayload {
    id_nova_legislacao_parametro: u32,
}
// --- FIM DOS NOVOS STRUCTS ---


// ============ COMANDOS ============

#[tauri::command]
pub async fn buscar_detalhes_resultado(
    app_handle: AppHandle,
    id_resultado: u32,
) -> Result<ApiResponse<ResultadoDetalheResponse>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/resultados/{}/detalhes", api_url, id_resultado);

    println!("📥 Buscando detalhes do resultado ID: {}", id_resultado);

    match client.get(&url).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<ResultadoDetalheResponse>().await {
                        Ok(data) => {
                            println!("✅ Detalhes carregados com sucesso");
                            Ok(ApiResponse {
                                success: true,
                                data: Some(data),
                                message: None,
                            })
                        }
                        Err(e) => {
                            eprintln!("Erro ao processar resposta: {}", e);
                            Err(format!("Erro ao processar resposta: {}", e))
                        }
                    }
                }
                reqwest::StatusCode::NOT_FOUND => {
                    Err("Resultado não encontrado".to_string())
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

#[tauri::command]
pub async fn salvar_resultado_completo(
    app_handle: AppHandle,
    id_resultado: u32,
    resultado: String,
    data_termino: String,
    hora_termino: String,
    etapas: Vec<EtapaPayload>,
    id_usuario: u32,
) -> Result<ApiResponse<()>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/resultados/{}/salvar-completo", api_url, id_resultado);

    let payload = SalvarResultadoCompletoPayload {
        id_resultado,
        resultado,
        data_termino,
        hora_termino,
        etapas,
        id_usuario,
    };

    println!("💾 Salvando resultado completo: {:?}", payload);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    println!("✅ Resultado salvo com sucesso");
                    Ok(ApiResponse {
                        success: true,
                        data: None,
                        message: Some("Resultado salvo com sucesso!".to_string()),
                    })
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

#[tauri::command]
pub async fn buscar_resultados_amostra(
    app_handle: AppHandle,
    id_analise: u32,
) -> Result<ApiResponse<AmostraResultadosResponse>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/amostras/{}/resultados", api_url, id_analise);

    match client.get(&url).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<AmostraResultadosResponse>().await {
                        Ok(data) => Ok(ApiResponse {
                            success: true,
                            data: Some(data),
                            message: None,
                        }),
                        Err(e) => Err(format!("Erro ao processar resposta: {}", e)),
                    }
                }
                reqwest::StatusCode::NOT_FOUND => {
                    Err("Amostra não encontrada".to_string())
                }
                status => Err(format!("Erro do servidor: {}", status)),
            }
        }
        Err(e) => Err(format!("Erro de conexão: {}", e)),
    }
}

#[tauri::command]
pub async fn salvar_resultado(
    app_handle: AppHandle,
    id_resultado: u32,
    resultado: String,
    data_termino: String,
    hora_termino: String,
    id_usuario: u32,
) -> Result<ApiResponse<()>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/resultados/{}/salvar", api_url, id_resultado);

    let payload = SalvarResultadoPayload {
        id_resultado,
        resultado,
        data_termino,
        hora_termino,
        id_usuario,
    };

    println!("Salvando resultado: {:?}", payload);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    Ok(ApiResponse {
                        success: true,
                        data: None,
                        message: Some("Resultado salvo com sucesso!".to_string()),
                    })
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

#[tauri::command]
pub async fn vistar_resultado(
    app_handle: AppHandle,
    id_resultado: u32,
    id_usuario: u32,
) -> Result<ApiResponse<()>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/resultados/{}/vistar", api_url, id_resultado);

    let payload = VistarResultadoPayload {
        id_resultado,
        id_usuario,
    };

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    Ok(ApiResponse {
                        success: true,
                        data: None,
                        message: Some("Resultado vistado com sucesso!".to_string()),
                    })
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => Err(format!("Erro de conexão: {}", e)),
    }
}

#[tauri::command]
pub async fn remover_visto_resultado(
    app_handle: AppHandle,
    id_resultado: u32,
    id_usuario: u32,
) -> Result<ApiResponse<()>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/resultados/{}/remover-visto", api_url, id_resultado);

    let payload = VistarResultadoPayload {
        id_resultado,
        id_usuario,
    };

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    Ok(ApiResponse {
                        success: true,
                        data: None,
                        message: Some("Visto removido com sucesso!".to_string()),
                    })
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => Err(format!("Erro de conexão: {}", e)),
    }
}

// ============ NOVOS COMANDOS TAURI ============

#[tauri::command]
pub async fn buscar_pops_alternativos(
    app_handle: AppHandle,
    id_legislacao: u32,
    id_parametro: u32,
    id_legislacao_parametro_atual: u32,
) -> Result<ApiResponse<Vec<PopAlternativo>>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!(
        "{}/resultados/pop-alternativos/{}/{}/{}",
        api_url, id_legislacao, id_parametro, id_legislacao_parametro_atual
    );

    println!("📥 Buscando POPs alternativos: {}", url);

    match client.get(&url).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    match response.json::<Vec<PopAlternativo>>().await {
                        Ok(data) => {
                            println!("✅ POPs alternativos carregados");
                            Ok(ApiResponse {
                                success: true,
                                data: Some(data),
                                message: None,
                            })
                        }
                        Err(e) => Err(format!("Erro ao processar resposta: {}", e)),
                    }
                }
                status => Err(format!("Erro do servidor: {}", status)),
            }
        }
        Err(e) => Err(format!("Erro de conexão: {}", e)),
    }
}

#[tauri::command]
pub async fn alterar_pop_resultado(
    app_handle: AppHandle,
    id_resultado: u32,
    id_nova_legislacao_parametro: u32,
) -> Result<ApiResponse<()>, String> {
    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let url = format!("{}/resultados/{}/alterar-pop", api_url, id_resultado);

    let payload = AlterarPopPayload {
        id_nova_legislacao_parametro,
    };

    println!("💾 Alterando POP do resultado: {:?}", payload);

    match client.post(&url).json(&payload).send().await {
        Ok(response) => {
            match response.status() {
                reqwest::StatusCode::OK => {
                    println!("✅ POP alterado com sucesso");
                    Ok(ApiResponse {
                        success: true,
                        data: None,
                        message: Some("POP alterado com sucesso!".to_string()),
                    })
                }
                status => {
                    let body = response.text().await.unwrap_or_default();
                    Err(format!("Erro do servidor: {} - {}", status, body))
                }
            }
        }
        Err(e) => Err(format!("Erro de conexão: {}", e)),
    }
}