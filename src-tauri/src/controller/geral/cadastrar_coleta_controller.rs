use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use crate::config::get_api_url;
use tauri::AppHandle;

// Estrutura para o request payload
#[derive(Debug, Serialize, Deserialize)]
pub struct ColetaRequest {
    pub id_coleta: u32,
    pub visualizacao: Option<bool>, 
}

// Estrutura para os dados das amostras
#[derive(Debug, Serialize, Deserialize)]
pub struct AmostraData {
    pub id: u32,
    pub numero: Option<u32>,
    pub hc: Option<String>, // hora formatada
    pub hora_coleta: Option<String>,
    pub identificacao: Option<String>,
    pub complemento: Option<String>,
    pub identificacao_frasco: Option<String>,
    pub condicoes_amb: Option<String>,
    pub ph: Option<String>,
    pub cloro: Option<String>,
    pub temperatura: Option<String>,
    pub solido_dissolvido_total: Option<String>,
    pub condutividade: Option<String>,
    pub oxigenio_dissolvido: Option<String>,
    pub pre_cadastrado: Option<bool>,
    pub idusuario: Option<u32>,
    pub observacao: Option<String>,
    pub terceirizada: Option<bool>,
    pub vazao: Option<String>,
    pub vazao_unidade: Option<String>,
    pub cor: Option<String>,
    pub turbidez: Option<String>,
    pub ncoletada_motivo: Option<String>,
    pub coletada: Option<bool>,
    pub responsavel_coleta: Option<String>,
    pub plano_amostragem: Option<String>,
    pub duplicata: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Equipamentos {
    pub nome: Option<String>,
    pub registro: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColetaCompleta {
    pub coleta: Option<Vec<AmostraColeta>>,
    pub amostras: Vec<AmostraData>,
    pub equipamentos: Vec<Equipamentos>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColetaData {
    pub numero: Option<u32>,
    pub prefixo: Option<String>,
    pub data_coleta: Option<String>,
    pub responsavel_coleta: Option<String>,
    pub plano_amostragem: Option<String>,
    pub cliente: Option<String>,
    pub acompanhante: Option<String>,
    pub acompanhante_doc: Option<String>,
    pub acompanhante_cargo: Option<String>,
    pub coletor: Option<String>,
    pub fantasia: Option<String>,
    pub pre_cadastrado: Option<bool>,
    pub observacao: Option<String>,
    pub registro: Option<String>,
    pub idcliente: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ColetaResponse {
    pub success: bool,
    pub data: Option<ColetaCompleta>,
    pub message: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SingleAmostraResponse {
    pub success: bool,
    pub data: Option<AmostraData>,
    pub message: Option<String>,
}

// Fixed struct with proper union type using an enum
#[derive(Debug, Serialize, Deserialize)]
pub struct AmostraColeta {
    pub id: Option<u32>,
    pub coletaid: Option<u32>,
    pub hora: Option<String>,
    pub identificacao: Option<IdentificacaoType>,
    pub complemento: Option<String>,
    pub ponto: Option<String>,
    pub coletadopor: Option<String>,
    pub condicoesambientais: Option<String>,
    pub vazao: Option<String>,
    pub ph: Option<String>,
    pub cloro: Option<String>,
    pub temperatura: Option<String>,
    pub cor: Option<String>,
    pub turbidez: Option<String>,
    pub sdt: Option<String>,
    pub condutividade: Option<String>,
}

// Enum to handle the union type for identificacao
#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum IdentificacaoType {
    Number(u32),
    Text(String),
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePayload {
    pub numero: u32,
}

#[command]
pub async fn buscar_coleta_referente(app_handle: AppHandle, id_coleta: u32) -> ColetaResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/retornar_coleta_referente", url);

    let payload = ColetaRequest {
        id_coleta,
        visualizacao: Some(true),
    };

    let res = match client
        .post(&full_url)
        .json(&payload) 
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return ColetaResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<ColetaResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            ColetaResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn atualizar_numero_amostra(app_handle: AppHandle, id_amostra: u32, novo_numero: u32) -> SingleAmostraResponse {
    let client = Client::new();
    let url_base = get_api_url(&app_handle);
    let full_url = format!("{}/atualizar_numero_amostra/{}", url_base, id_amostra);
    
    // Estrutura correta do payload
    let payload = UpdatePayload {
        numero: novo_numero,
    };

    println!("Enviando request para: {}", full_url);
    println!("Payload: {:?}", payload);

    let res = match client
        .put(&full_url)
        .json(&payload)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SingleAmostraResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor.".to_string()),
            };
        }
    };
    
    let status = res.status();
    println!("Status da resposta: {}", status);
    
    if !status.is_success() {
        // Tentar capturar o corpo da resposta para mais detalhes
        let error_body = match res.text().await {
            Ok(body) => body,
            Err(_) => "Não foi possível ler o corpo da resposta".to_string(),
        };
        
        let message = format!("Erro do servidor: Status {} - {}", status, error_body);
        println!("{}", message);
        return SingleAmostraResponse {
            success: false,
            data: None,
            message: Some(message),
        };
    }

    match res.json::<SingleAmostraResponse>().await {
        Ok(response) => {
            println!("Resposta recebida: {:?}", response);
            response
        },
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SingleAmostraResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta do servidor.".to_string()),
            }
        }
    }
}