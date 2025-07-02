use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

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

async fn consulta_geral(consulta_tipo: String) -> GeralResponse {
    let client = Client::new();
    let request_data = GeralRequest { consulta_tipo };

    let res = match client
        .post("http://127.0.0.1:8082/cadastrar-cliente")
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
            }
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
        Ok(response) => {
            response
        },
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