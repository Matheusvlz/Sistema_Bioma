use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

use crate::config::get_api_url;
use tauri::AppHandle;

//STRUCT ***********************************************************

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Usuario {
    pub id: u32,
    pub nome: String,
    pub usuario: String,
    pub ultimoacesso: Option<String>,
    pub ativo: bool,
    pub relatorio_email: bool,
    pub notif_cadastrada: bool,
    pub notif_iniciada: bool,
    pub notif_relatorio: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Cliente {
    pub id: u32,
    pub fantasia: Option<String>,
    pub razao: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetorPortal {
    pub id: u32,
    pub nome: String,
    pub do_usuario: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SetorClientePortal {
    pub id: u32,
    pub nome: String,
    pub do_cliente: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PermissaoSetor {
    pub setor_id: u32,
    pub permitido: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VerificarEmail {
    pub id: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Historico {
    pub descricao: String,
    pub login: Option<String>,
    pub ip: String,
    pub dt: String,
}

//RESPONSE ***********************************************************

#[derive(Serialize, Deserialize, Debug)]
pub struct UsuarioResponse {
    pub success: bool,
    pub data: Option<Vec<Usuario>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ClienteResponse {
    pub success: bool,
    pub data: Option<Vec<Cliente>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SetorResponse {
    pub success: bool,
    pub data: Option<Vec<SetorPortal>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SetorClienteResponse {
    pub success: bool,
    pub data: Option<Vec<SetorClientePortal>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct PermissoesResponse {
    pub success: bool,
    pub data: Option<Vec<PermissaoSetor>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct InvokeResponse {
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct VerificarEmailResponse {
    pub success: bool,
    pub data: Option<Vec<VerificarEmail>>,
    pub message: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct HistoricoResponse {
    pub success: bool,
    pub data: Option<Vec<Historico>>,
    pub message: Option<String>,
}

//JSON ***********************************************************

#[derive(Serialize)]
struct BuscarClientesRequest {
    usuario_id: u32,
}

#[derive(Serialize)]
struct ClienteCase {
    usuario_id: Option<u32>,
    cliente_id: u32,
}

#[derive(Deserialize)]
pub struct AlterarPermissaoRequest {
    #[serde(rename = "usuarioId")]
    usuario_id: Option<u32>,
    #[serde(rename = "clienteId")]
    cliente_id: Option<u32>,
    #[serde(rename = "setorId")]
    setor_id: u32,
    permitido: bool,
}

#[derive(Deserialize)]
pub struct ConfigurarNotificacoes {
    #[serde(rename = "usuarioId")]
    usuario_id: u32,
    status: bool,
    tipo: String,
}

#[derive(Serialize)]
pub struct Ativado {
    #[serde(rename = "usuarioId")]
    usuario_id: u32,
    ativar: bool,
}

#[derive(Deserialize)]
pub struct UserCase {
    #[serde(rename = "usuarioId")]
    usuario_id: Option<u32>,
    #[serde(rename = "clienteId")]
    cliente_id: Option<u32>,
    email: String,
    nome: Option<String>,
}

//FUNÇÕES SEGUNDA GUIA ***********************************************************

#[command]
pub async fn buscar_clientes_usuario(app_handle: AppHandle, usuario_id: u32) -> ClienteResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/clientes", url);
    let request_body = BuscarClientesRequest { usuario_id };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return ClienteResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<ClienteResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            ClienteResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn buscar_setores_portal(app_handle: AppHandle, usuario_id: u32, cliente_id: u32) -> SetorResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/setores", url);
    let request_body = ClienteCase {
        usuario_id: Some(usuario_id),
        cliente_id,
    };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SetorResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return SetorResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<SetorResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SetorResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn alterar_permissao_setor(app_handle: AppHandle, request: AlterarPermissaoRequest) -> InvokeResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/alterar-setor", url);
    let payload = serde_json::json!({
        "usuario_id": request.usuario_id,
        "setor_id": request.setor_id,
        "permitido": request.permitido
    });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn adicionar_cliente_usuario(app_handle: AppHandle, usuario_id: u32, cliente_id: u32) -> InvokeResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/adicionar-clientes", url);
    let request_body = ClienteCase {
        usuario_id: Some(usuario_id),
        cliente_id,
    };

    let res = match client.post(&full_url).json(&request_body).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn remover_cliente_usuario(app_handle: AppHandle, usuario_id: u32, cliente_id: u32) -> InvokeResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle); 
       let full_url = format!("{}/usuarios/portal/remover-clientes", url);
    let request_body = ClienteCase {
        usuario_id: Some(usuario_id),
        cliente_id,
    };

    let res = match client.post(&full_url).json(&request_body).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn buscar_todos_setores_cliente(app_handle: AppHandle, cliente_id: u32) -> SetorClienteResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/setores-total", url);
    let request_body = ClienteCase {
        cliente_id, usuario_id: None
    };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return SetorClienteResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return SetorClienteResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<SetorClienteResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            SetorClienteResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn alterar_setor_cliente(app_handle: AppHandle, request: AlterarPermissaoRequest) -> InvokeResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/alterar-setor-cliente", url);
    let payload = serde_json::json!({
        "cliente_id": request.cliente_id,
        "setor_id": request.setor_id,
        "permitido": request.permitido
    });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn buscar_usuarios_cliente(app_handle: AppHandle, cliente_id: u32) -> UsuarioResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/usuarios", url);
    let request_body = ClienteCase {
        cliente_id, usuario_id: None
    };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return UsuarioResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return UsuarioResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<UsuarioResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            UsuarioResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn configurar_usuarios(app_handle: AppHandle, request: ConfigurarNotificacoes) -> InvokeResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/configurar-notificacoes", url);
    let payload = serde_json::json!({
        "usuario_id": request.usuario_id,
        "status": request.status,
        "tipo": request.tipo
    });

    let res = match client.post(&full_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn remover_cadastro_usuario(app_handle: AppHandle, usuario_id: u32, cliente_id: u32) -> InvokeResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/cadastro", url);
    let request_body = ClienteCase {
        usuario_id: Some(usuario_id),
        cliente_id,
    };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return InvokeResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn excluir_usuario_cliente(app_handle: AppHandle, usuario_id: u32) -> InvokeResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/excluir", url);
    let request_body = BuscarClientesRequest {
        usuario_id: usuario_id
    };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return InvokeResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn reenviar_email_usuario(app_handle: AppHandle, request: UserCase) -> InvokeResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/email", url);
    let payload = serde_json::json!({
        "usuario_id": request.usuario_id,
        "email": request.email,
        "nome": request.nome
    });

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return InvokeResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn verificar_email(app_handle: AppHandle, request: UserCase) -> VerificarEmailResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/verificar-email", url);
    let payload = serde_json::json!({
        "email": request.email,
    });

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return VerificarEmailResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return VerificarEmailResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<VerificarEmailResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            VerificarEmailResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn cadastrar_usuario(app_handle: AppHandle, request: UserCase) -> InvokeResponse {
    let client = Client::new();
     let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/novo", url);
    let payload = serde_json::json!({
        "usuario_id": request.usuario_id,
        "cliente_id": request.cliente_id,
        "nome": request.nome,
        "email": request.email
    });

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&payload)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return InvokeResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<InvokeResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            InvokeResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}

#[command]
pub async fn historico_usuario(app_handle: AppHandle, usuario_id: u32) -> HistoricoResponse {
    let client = Client::new();
    let url = get_api_url(&app_handle);
    let full_url = format!("{}/usuarios/portal/historico", url);
    let request_body = BuscarClientesRequest {
        usuario_id: usuario_id
    };

    let res = match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => {
            println!("Erro de conexão: {:?}", e);
            return HistoricoResponse {
                success: false,
                data: None,
                message: Some("Erro de conexão com o servidor".to_string()),
            };
        }
    };

    if !res.status().is_success() {
        println!("Erro HTTP: {}", res.status());
        return HistoricoResponse {
            success: false,
            data: None,
            message: Some(format!("Erro HTTP: {}", res.status())),
        };
    }

    match res.json::<HistoricoResponse>().await {
        Ok(response) => response,
        Err(e) => {
            println!("Erro ao parsear JSON: {:?}", e);
            HistoricoResponse {
                success: false,
                data: None,
                message: Some("Erro ao processar resposta".to_string()),
            }
        }
    }
}
