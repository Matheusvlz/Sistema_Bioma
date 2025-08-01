use tauri::command;
use serde::{Serialize, Deserialize};
use reqwest::Client; // Importe o cliente HTTP
use crate::model::usuario::{obter_usuario, salvar_usuario};

use crate::config::get_api_url;
use tauri::AppHandle;

// Struct para a requisição que será enviada para a API Axum
#[derive(Serialize, Debug)]
struct UpdateSettingsApiRequest {
    user_id: u32,
    profile_photo_base64: Option<String>, // Data URL da foto
    dark_mode: bool,
}

// Struct para a resposta que será recebida da API Axum
#[derive(Deserialize, Debug)]
struct UpdateSettingsApiResponse {
    success: bool,
    profile_photo_path: Option<String>, // Caminho da foto salvo pela API
    dark_mode: bool,
    message: Option<String>,
}

#[command]
pub async fn update_user_settings(
    app_handle: AppHandle,
    user_id: u32,
    profile_photo_base64: Option<String>, // Recebe o Data URL completo do frontend
    _background_color: String, // Não será persistido no backend da API neste exemplo
    is_dark_mode: bool,
) -> Result<bool, String> {
    println!("Recebendo configurações para o usuário {}:", user_id);
    println!("  Modo Escuro: {}", is_dark_mode);
    if profile_photo_base64.is_some() {
        println!("  Nova foto de perfil detectada.");
    } else {
        println!("  Nenhuma nova foto de perfil fornecida.");
    }

    let client = Client::new();
    let api_url = get_api_url(&app_handle);
    let update_url = format!("{}/update_user_settings", api_url); // Novo endpoint na sua API Axum

    let request_payload = UpdateSettingsApiRequest {
        user_id,
        profile_photo_base64,
        dark_mode: is_dark_mode,
    };

    let res = client
        .post(&update_url)
        .json(&request_payload)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar requisição para a API: {}", e))?;

    if !res.status().is_success() {
        let status = res.status();
        let body_text = res.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API: Status {}. Resposta: {}", status, body_text));
    }

    let api_response = res.json::<UpdateSettingsApiResponse>().await
        .map_err(|e| format!("Erro ao decodificar resposta da API: {}", e))?;

    if api_response.success {
        // Se a API retornou sucesso, atualize o usuário logado em memória com os dados mais recentes
        if let Some(mut current_user) = obter_usuario() {
            if current_user.id == user_id {
                current_user.profile_photo = api_response.profile_photo_path;
                current_user.dark_mode = api_response.dark_mode;
                salvar_usuario(current_user);
                println!("Configurações do usuário {} atualizadas com sucesso em memória.", user_id);
                Ok(true)
            } else {
                Err("Erro: ID do usuário logado não corresponde ao ID da requisição.".to_string())
            }
        } else {
            Err("Erro: Nenhum usuário logado encontrado.".to_string())
        }
    } else {
        Err(api_response.message.unwrap_or_else(|| "Falha desconhecida na API.".to_string()))
    }
}
