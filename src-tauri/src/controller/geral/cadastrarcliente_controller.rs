use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;
use crate::config::get_api_url;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClienteCategoria {
    pub id: u32,
    pub nome: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Consultor {
    pub id: u32,
    pub nome: Option<String>,
    pub documento: Option<String>,
    pub telefone: Option<String>,
    pub email: Option<String>,
    pub ativo: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetorPortal {
    pub id: u32,
    pub nome: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum GeralData {
    ClienteCategoria(Vec<ClienteCategoria>),
    Consultor(Vec<Consultor>),
    SetorPortal(Vec<SetorPortal>),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GeralResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub message: Option<String>,
    pub tipo: String,
}

#[derive(Serialize)]
struct GeralRequest {
    consulta_tipo: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DadosGerais {
    pub tipo_documento: String,
    pub documento: String,
    pub fantasia: String,
    pub razao: String,
    pub tipo_registro: String,
    pub registro: Option<String>,
    pub cep: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
    pub telefone: Option<String>,
    pub celular: Option<String>,
    pub email: Option<String>,
    pub site: Option<String>,
    pub observacao: Option<String>,
    pub consultor_id: Option<u32>,
    pub setores_portal: Vec<u32>,
    pub origem: Option<String>,
    pub id_pre_cad: u32,
    pub ativo: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DadosCobranca {
    pub tipo_documento: String,
    pub documento: String,
    pub fantasia: String,
    pub razao: String,
    pub tipo_registro: String,
    pub registro: Option<String>,
    pub cep: Option<String>,
    pub endereco: Option<String>,
    pub numero: Option<String>,
    pub bairro: Option<String>,
    pub cidade: Option<String>,
    pub uf: Option<String>,
    pub telefone: Option<String>,
    pub celular: Option<String>,
    pub email: Option<String>,
    pub site: Option<String>,
    pub observacao: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Contato {
    pub id: Option<u32>,
    pub nome: String,
    pub cargo: Option<String>,
    pub email: Option<String>,
    pub telefone: Option<String>,
    pub data_nascimento: Option<String>,
    pub setores_contato: Vec<u32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DadosCliente {
    pub cliente_id: Option<u32>,
    pub dados_gerais: DadosGerais,
    pub dados_cobranca: DadosCobranca,
    pub categorias: Vec<u32>,
    pub contatos: Vec<Contato>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SalvarClienteRequest {
    pub dados: DadosCliente,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SalvarClienteResponse {
    pub success: bool,
    pub message: Option<String>,
    pub cliente_id: Option<u32>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetClientDataRequest {
    pub client_id: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClientDataResponse {
    pub success: bool,
    pub data: Option<DadosCliente>,
    pub message: Option<String>,
}

#[command]
pub async fn cliente_categoria() -> GeralResponse {
    consulta_geral("cliente_categoria".to_string()).await
}

#[command]
pub async fn consultor() -> GeralResponse {
    consulta_geral("consultor".to_string()).await
}

#[command]
pub async fn setor_portal() -> GeralResponse {
    consulta_geral("setor_portal".to_string()).await
}

#[command]
pub async fn salvar_cliente(app_handle: AppHandle, dados: serde_json::Value) -> Result<SalvarClienteResponse, String> {
    let client = Client::new();
      let url = get_api_url(&app_handle);
    let full_url = format!("{}/salvar_cliente", url);
    
    let res = client
        .post(&full_url)
        .json(&dados)
        .send()
        .await;

    let res = match res {
        Ok(response) => response,
        Err(e) => {
            let msg = format!("Erro de conexão: {:?}", e);
            eprintln!("{}", msg);
            return Err(msg);
        }
    };

    if !res.status().is_success() {
        let msg = format!("Falha ao salvar cliente: status HTTP {}", res.status());
        eprintln!("{}", msg);
        return Err(msg);
    }

    match res.json::<SalvarClienteResponse>().await {
        Ok(response) => Ok(response),
        Err(e) => {
            let msg = format!("Erro ao parsear resposta: {:?}", e);
            eprintln!("{}", msg);
            Err(msg)
        }
    }
}

#[command]
pub async fn editar_cliente(app_handle: AppHandle, dados: serde_json::Value) -> Result<SalvarClienteResponse, String> {
    let client = Client::new();
      let url = get_api_url(&app_handle);
    let full_url = format!("{}/editar_cliente", url);
    println!("Dados recebidos em editar_cliente_api: {:#?}", dados);

    let res = client
        .post(&full_url)
        .json(&dados)
        .send()
        .await;

    let res = match res {
        Ok(response) => response,
        Err(e) => {
            let msg = format!("Erro de conexão: {:?}", e);
            eprintln!("{}", msg);
            return Err(msg);
        }
    };

    if !res.status().is_success() {
        let msg = format!("Falha ao editar cliente: status HTTP {}", res.status());
        eprintln!("{}", msg);
        return Err(msg);
    }

    match res.json::<SalvarClienteResponse>().await {
        Ok(response) => Ok(response),
        Err(e) => {
            let msg = format!("Erro ao parsear resposta: {:?}", e);
            eprintln!("{}", msg);
            Err(msg)
        }
    }
}

#[command]
pub async fn get_cliente_data(app_handle: AppHandle, client_id: u32) -> GeralResponse {
    let client = Client::new();
      let url = get_api_url(&app_handle);
    let full_url = format!("{}/cadastrar-cliente", url);
    let request_data = serde_json::json!({
        "client_id": client_id,
        "consulta_tipo": "cliente_data"
    });

    let res = match client
        .post(&full_url)
        .json(&request_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão ao buscar dados do cliente: {:?}", e);
            return GeralResponse {
                success: false,
                data: None,
                message: Some(
                    "Erro de conexão com o servidor ao buscar dados do cliente".to_string(),
                ),
                tipo: "erro".to_string(),
            };
        }
    };

    if !res.status().is_success() {
        println!(
            "Status não sucesso ao buscar dados do cliente: {}",
            res.status()
        );
        return GeralResponse {
            success: false,
            data: None,
            message: Some("Erro na requisição ao buscar dados do cliente".to_string()),
            tipo: "erro".to_string(),
        };
    }

    match res.json::<GeralResponse>().await {
        Ok(response) => {
            println!("Dados recebidos do cliente: {:#?}", response);
            response
        }
        Err(e) => {
            println!("Erro ao parsear JSON de dados do cliente: {:?}", e);
            GeralResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta de dados do cliente".to_string()),
                tipo: "erro".to_string(),
            }
        }
    }
}

async fn consulta_geral(consulta_tipo: String) -> GeralResponse {
    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://192.168.15.26:8082".to_string());

    let full_url = format!("{}/cadastrar-cliente", url);
    let request_data = GeralRequest { consulta_tipo };

    let res = match client
        .post(&full_url)
        .json(&request_data)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return GeralResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
                tipo: "erro".to_string(),
            };
        }
    };

    if !res.status().is_success() {
        println!("Status não sucesso: {}", res.status());
        return GeralResponse {
            success: false,
            data: None,
            message: Some("Erro na requisição".to_string()),
            tipo: "erro".to_string(),
        };
    }

    match res.json::<GeralResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            GeralResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
                tipo: "erro".to_string(),
            }
        }
    }
}
