use tauri::command;
use serde::{Deserialize, Serialize};
use reqwest::Client;
use crate::model::usuario::obter_usuario;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelaPermitida {
    pub id: i32,
    pub nome: String,
}

#[derive(Serialize)]
struct PayloadInicio {
    user_id: u32,
}

#[command]
pub async fn get_data_inicio() -> Result<Vec<TelaPermitida>, String> {
    let usuario = obter_usuario().ok_or("Usuário não autenticado")?;

    let client = Client::new();
    let url = std::env::var("API_URL").unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/get/inicio", url);

    let res = client
        .post(&full_url)
        .json(&PayloadInicio { user_id: usuario.id })
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar: {}", e))?;

    if !res.status().is_success() {
        return Err("Erro ao buscar dados".into());
    }

    let projetos = res
        .json::<Vec<TelaPermitida>>()
        .await
        .map_err(|e| format!("Erro ao ler resposta: {}", e))?;

    Ok(projetos)
}
