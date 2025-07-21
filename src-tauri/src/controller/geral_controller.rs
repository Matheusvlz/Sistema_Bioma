use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClienteSemCadastro {
    pub id: u32,
    pub nome_cliente: Option<String>,
    pub documento: Option<String>,
    pub telefone: Option<String>,
    pub contato: Option<String>,
    pub email: Option<String>,
    pub origem: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AmostraPreCadastrada {
    pub id: u32,
    pub identificacao: Option<String>,
    pub dtcoleta_formatada: Option<String>,
    pub datacoleta: Option<String>,
    pub horacoleta: Option<String>,
    pub isfabricacao: Option<bool>,
    pub formatodata: Option<String>,
    pub fabricacao: Option<String>,
    pub validade: Option<String>,
    pub lote: Option<String>,
    pub total: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ColetaItem {
    pub id: u32,
    pub numero: Option<String>,
    pub prefixo: Option<String>,
    pub data_coleta: Option<String>,
    pub cliente: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SolicitacaoUsuario {
    pub id: u32,
    pub nome_completo: Option<String>,
    pub email: Option<String>,
    pub created_at: Option<String>,
    pub cliente: Option<u32>,
    pub fantasia: Option<String>,
    pub cliente_cod: Option<u32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ColetaPortal {
    pub id: u32,
    pub protocolo: Option<String>,
    pub num_protocolo: Option<String>,
    pub descricao: Option<String>,
    pub cliente_email: Option<String>,
    pub urgencia: Option<bool>,
    pub itens: Option<String>,
    pub created_at: Option<String>,
    pub finalizado: Option<bool>,
    pub fantasia: Option<String>,
    pub id_cliente: Option<u32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum GeralData {
    ClientesSemCadastro(Vec<ClienteSemCadastro>),
    AmostrasPreCadastradas(Vec<AmostraPreCadastrada>),
    Coletas(Vec<ColetaItem>),
    SolicitacoesUsuarios(Vec<SolicitacaoUsuario>),
    ColetasPortal(Vec<ColetaPortal>),
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
/*pub async fn buscar_clientes_sem_cadastro() -> GeralResponse {
    println!("=== BUSCANDO CLIENTES SEM CADASTRO ===");
    let res = consulta_geral("clientes_sem_cadastro".to_string()).await;
    
    if let Some(data) = &res.data {
        if let Ok(clientes) = serde_json::from_value::<Vec<ClienteSemCadastro>>(data.clone()) {
            println!("Total de clientes: {}", clientes.len());
            for cliente in clientes.iter().take(3) {
                println!("Cliente: {:?}", cliente);
            }
        }
    }
    res
}*/

pub async fn buscar_clientes_sem_cadastro() -> GeralResponse {
    consulta_geral("clientes_sem_cadastro".to_string()).await
}

#[command]
pub async fn buscar_amostras_pre_cadastradas() -> GeralResponse {
    consulta_geral("amostras_pre_cadastradas".to_string()).await
}

#[command]
pub async fn buscar_coletas() -> GeralResponse {
    consulta_geral("coletas".to_string()).await
}

#[command]
pub async fn buscar_solicitacoes_usuarios() -> GeralResponse {
    consulta_geral("solicitacoes_usuarios".to_string()).await
}

#[command]
pub async fn buscar_coletas_portal() -> GeralResponse {
    consulta_geral("coletas_portal".to_string()).await
}

async fn consulta_geral(consulta_tipo: String) -> GeralResponse {
    let client = Client::new();
    let request_data = GeralRequest { consulta_tipo };
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/geral", url);

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