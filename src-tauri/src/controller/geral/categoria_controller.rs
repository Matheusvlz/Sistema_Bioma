use tauri::command;
use reqwest::Client;
use crate::model::api_response::ApiResponse;
use crate::model::categoria::{Categoria, CategoriaPayload};

// Usamos a nossa constante padrão para o endereço da API.
const API_BASE_URL: &str = "http://127.0.0.1:8082";

// Mantemos os nomes das funções antigas para compatibilidade.
#[command]
pub async fn buscar_categorias_cadastro() -> Result<ApiResponse<Vec<Categoria>>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/categorias", API_BASE_URL);
    
    match client.get(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<Categoria>>().await {
                    Ok(data) => Ok(ApiResponse::success("Categorias carregadas".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar JSON: {}", e))),
                }
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}) {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn criar_categoria(categoria_data: CategoriaPayload) -> Result<ApiResponse<Categoria>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/categorias", API_BASE_URL);

    match client.post(&url).json(&categoria_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Categoria>().await {
                    Ok(data) => Ok(ApiResponse::success("Categoria criada com sucesso!".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta: {}", e))),
                }
            } else {
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn editar_categoria(categoria_data: CategoriaPayload) -> Result<ApiResponse<Categoria>, ApiResponse<()>> {
    let id = match categoria_data.id {
        Some(id) => id,
        None => return Err(ApiResponse::error("ID da categoria é necessário para edição.".to_string())),
    };

    let client = Client::new();
    let url = format!("{}/categorias/{}", API_BASE_URL, id);

    match client.put(&url).json(&categoria_data).send().await {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<Categoria>().await {
                    Ok(data) => Ok(ApiResponse::success("Categoria atualizada com sucesso!".to_string(), Some(data))),
                    Err(e) => Err(ApiResponse::error(format!("Erro ao processar resposta: {}", e))),
                }
            } else {
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}

#[command]
pub async fn excluir_categoria(id: u8) -> Result<ApiResponse<()>, ApiResponse<()>> {
    let client = Client::new();
    let url = format!("{}/categorias/{}", API_BASE_URL, id);

    match client.delete(&url).send().await {
        Ok(response) => {
            if response.status().is_success() {
                Ok(ApiResponse::success("Categoria removida com sucesso!".to_string(), None))
            } else {
                let status = response.status();
                let err_body = response.text().await.unwrap_or_default();
                Err(ApiResponse::error(format!("API retornou erro ({}): {}", status, err_body)))
            }
        },
        Err(e) => Err(ApiResponse::error(format!("Erro de conexão: {}", e))),
    }
}
