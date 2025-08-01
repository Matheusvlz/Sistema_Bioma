use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

use crate::config::get_api_url;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChecagemItem {
    pub fantasia: Option<String>,
    pub razao: Option<String>,
    pub max_numero: u32,
    pub min_numero: u32,
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

#[derive(Serialize, Deserialize, Debug)]
pub struct LaboratorioResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub message: Option<String>,
    pub tipo: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AmostraFinalizadaItem {
    pub id: u32,
    pub numero: Option<String>,
    pub identificacao: Option<String>,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
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

#[derive(Serialize)]
struct LaboratorioRequest {
    consulta_tipo: String,
}

async fn consulta_laboratorio(consulta_tipo: String) -> LaboratorioResponse {
    let client = Client::new();
    let request_data = LaboratorioRequest { consulta_tipo };
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());
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
        Ok(response) => {
            response
        },
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