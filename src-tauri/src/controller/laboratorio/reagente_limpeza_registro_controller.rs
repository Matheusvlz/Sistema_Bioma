use tauri::{command, AppHandle};
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::config::get_api_url;
use serde::{Deserialize, Serialize};

// --- Structs ---
#[derive(Debug, Serialize, Deserialize)]
pub struct ReagenteItem { pub id: u32, pub nome: String, pub unidade: String }

#[derive(Debug, Serialize, Deserialize)]
#[allow(non_snake_case)]
pub struct ReagenteRegistroDetalhado {
    pub id: u32, pub lote: String, pub fabricante: String,
    pub preparo: String, pub validade: String,
    pub data_inicial: Option<String>, pub data_final: Option<String>,
    pub user_iniciado: Option<String>, pub user_finalizado: Option<String>
}

#[derive(Debug, Deserialize)]
pub struct NovoRegistroPayload {
    pub reagente_limpeza: u32, pub lote: String, pub fabricante: String, pub data_preparo: String, pub validade: String
}
#[derive(Debug, Serialize)]
pub struct NovoRegistroApiPayload {
    pub reagente_limpeza: u32, pub lote: String, pub fabricante: String, pub data_preparo: String, pub validade: String
}

#[derive(Debug, Deserialize)]
pub struct EdicaoRegistroPayload { pub lote: String, pub fabricante: String, pub data_preparo: String, pub validade: String }
#[derive(Debug, Serialize)]
pub struct EdicaoRegistroApiPayload { pub lote: String, pub fabricante: String, pub data_preparo: String, pub validade: String }

#[derive(Debug, Deserialize)]
pub struct UsoPayload { pub usuario_id: u32, pub data: String, pub tipo_registro: u8 }
#[derive(Debug, Serialize)]
pub struct UsoApiPayload { pub usuario_id: u32, pub data: String, pub tipo_registro: u8 }

fn br_to_iso(data: &str) -> String {
    let p: Vec<&str> = data.split('/').collect();
    if p.len() == 3 { format!("{}-{}-{}", p[2], p[1], p[0]) } else { data.to_string() }
}

// --- COMANDOS ---

// ITENS (Modal)
#[command]
pub async fn listar_reagentes_itens_tauri(app_handle: AppHandle) -> Result<ApiResponse<Vec<ReagenteItem>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/itens", get_api_url(&app_handle));
    match client.get(&url).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("OK".to_string(), Some(res.json().await.unwrap()))) } else { Err(ApiResponse::error("Erro API".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}

#[command]
pub async fn criar_reagente_item_tauri(app_handle: AppHandle, nome: String, unidade: String) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/itens", get_api_url(&app_handle));
    match client.post(&url).json(&serde_json::json!({ "nome": nome, "unidade": unidade })).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("Criado".to_string(), None)) } else { Err(ApiResponse::error("Erro (Duplicado?)".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}

#[command]
pub async fn deletar_reagente_item_tauri(app_handle: AppHandle, id: u32) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/itens/{}", get_api_url(&app_handle), id);
    match client.delete(&url).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("Deletado".to_string(), None)) } else { Err(ApiResponse::error("Erro (Em uso?)".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}

// REGISTROS (Tabela)
#[command]
pub async fn listar_registros_reagente_tauri(app_handle: AppHandle, reagente_id: u32) -> Result<ApiResponse<Vec<ReagenteRegistroDetalhado>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/{}/registros", get_api_url(&app_handle), reagente_id);
    match client.get(&url).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("OK".to_string(), Some(res.json().await.unwrap()))) } else { Err(ApiResponse::error("Erro API".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}

#[command]
pub async fn criar_registro_reagente_tauri(app_handle: AppHandle, payload: NovoRegistroPayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/registros", get_api_url(&app_handle));
    let api_payload = NovoRegistroApiPayload {
        reagente_limpeza: payload.reagente_limpeza, lote: payload.lote, fabricante: payload.fabricante,
        data_preparo: br_to_iso(&payload.data_preparo), validade: br_to_iso(&payload.validade),
    };
    match client.post(&url).json(&api_payload).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("Criado".to_string(), None)) } else { Err(ApiResponse::error("Erro API".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}

#[command]
pub async fn editar_registro_reagente_tauri(app_handle: AppHandle, id: u32, payload: EdicaoRegistroPayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/registros/{}", get_api_url(&app_handle), id);
    let api_payload = EdicaoRegistroApiPayload {
        lote: payload.lote, fabricante: payload.fabricante,
        data_preparo: br_to_iso(&payload.data_preparo), validade: br_to_iso(&payload.validade),
    };
    match client.put(&url).json(&api_payload).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("Editado".to_string(), None)) } else { Err(ApiResponse::error("Erro API".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}

#[command]
pub async fn registrar_uso_reagente_tauri(app_handle: AppHandle, id: u32, payload: UsoPayload) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/laboratorio/reagentes-limpeza/registros/{}/uso", get_api_url(&app_handle), id);
    let api_payload = UsoApiPayload {
        usuario_id: payload.usuario_id, data: br_to_iso(&payload.data), tipo_registro: payload.tipo_registro,
    };
    match client.patch(&url).json(&api_payload).send().await {
        Ok(res) => if res.status().is_success() { Ok(ApiResponse::success("Registrado".to_string(), None)) } else { Err(ApiResponse::error("Erro API".to_string())) },
        Err(e) => Err(ApiResponse::error(e.to_string()))
    }
}