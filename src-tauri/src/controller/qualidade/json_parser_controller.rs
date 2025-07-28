use reqwest::Client;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct TemplateData {
    pub id: Option<u64>,
    pub caminho_arquivo: String,
    pub nome_arquivo: String,
    pub tag: Option<String>,
    pub tipo: String,
    pub json_data_base64: Option<String>,
    pub updated_at: Option<String>, 
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiRequest {
    caminho_arquivo: String,
    nome_arquivo: String,
    tag: Option<String>,
    tipo: String,
    json_data_base64: String,
}


#[derive(Debug, Serialize, Deserialize)]
pub struct ApiResponse {
    success: bool,
    message: String,
    id: Option<u64>,
}

#[command]
pub async fn save_template(template_data: TemplateData) -> Result<ApiResponse, String> {
    println!("Recebendo dados do template: {:?}", template_data);
    
    // Validar dados recebidos
    if template_data.nome_arquivo.trim().is_empty() {
        return Err("Nome do arquivo não pode estar vazio".to_string());
    }
    
    if template_data.tipo.trim().is_empty() {
        return Err("Tipo não pode estar vazio".to_string());
    }
    
    let json_data_base64 = template_data.json_data_base64
        .ok_or("Dados JSON não podem estar vazios".to_string())?;
    
    if json_data_base64.trim().is_empty() {
        return Err("Dados JSON não podem estar vazios".to_string());
    }

    // Preparar dados para envio à API
    let api_request = ApiRequest {
        caminho_arquivo: template_data.caminho_arquivo,
        nome_arquivo: template_data.nome_arquivo,
        tag: template_data.tag,
        tipo: template_data.tipo,
        json_data_base64,
    };

    // URL da sua API (substitua pela URL real)
    let api_url = std::env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/templates/save", api_url);

    // Criar cliente HTTP
    let client = reqwest::Client::new();

    // Fazer requisição POST para a API
    match client
        .post(&full_url)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        // Adicione headers de autenticação se necessário
        // .header("Authorization", "Bearer YOUR_TOKEN")
        .json(&api_request)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                // Tentar parsear a resposta JSON
                match response.json::<ApiResponse>().await {
                    Ok(api_response) => {
                        println!("Template salvo com sucesso: {:?}", api_response);
                        Ok(api_response)
                    }
                    Err(e) => {
                        println!("Erro ao parsear resposta da API: {}", e);
                        // Retornar resposta de sucesso genérica se não conseguir parsear
                        Ok(ApiResponse {
                            success: true,
                            message: "Template salvo com sucesso".to_string(),
                            id: None,
                        })
                    }
                }
            } else {
                // Capturar o status antes de consumir a response
                let status_code = response.status();
                // Tentar obter mensagem de erro da API
                let error_text = response.text().await
                    .unwrap_or_else(|_| "Erro desconhecido".to_string());
                let error_msg = format!("Erro da API ({}): {}", status_code, error_text);
                println!("{}", error_msg);
                Err(error_msg)
            }
        }
        Err(e) => {
            let error_msg = format!("Erro ao conectar com a API: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}

#[command]
pub async fn list_templates() -> Result<Vec<TemplateData>, String> {
    let api_url = std::env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/templates/list", api_url);
    
    let client = reqwest::Client::new();
    
    match client
        .get(&full_url)
        .header("Accept", "application/json")
        .send()
        .await
    {
        Ok(response) => {
            if response.status().is_success() {
                match response.json::<Vec<TemplateData>>().await {
                    Ok(templates) => {
                        println!("Templates carregados: {} itens", templates.len());
                        Ok(templates)
                    }
                    Err(e) => Err(format!("Erro ao parsear lista de templates: {}", e)),
                }
            } else {
                // Capturar o status antes de consumir a response
                let status_code = response.status();
                let error_text = response.text().await
                    .unwrap_or_else(|_| "Erro desconhecido".to_string());
                Err(format!("Erro ao buscar templates ({}): {}", status_code, error_text))
            }
        }
        Err(e) => Err(format!("Erro ao conectar com a API: {}", e)),
    }
}

#[command]
pub async fn get_template_by_id(id: u64) -> Result<TemplateData, String> {
    let api_url = std::env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/templates/{}", api_url, id);
    
    let client = reqwest::Client::new();
    
    match client
        .get(&full_url)
        .header("Accept", "application/json")
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<TemplateData>().await {
                    Ok(template) => {
                        println!("Template carregado: {:?}", template);
                        Ok(template)
                    }
                    Err(e) => Err(format!("Erro ao parsear template: {}", e)),
                }
            } else if status == 404 {
                Err("Template não encontrado".to_string())
            } else {
                // Capturar o status antes de consumir a response
                let status_code = response.status();
                let error_text = response.text().await
                    .unwrap_or_else(|_| "Erro desconhecido".to_string());
                Err(format!("Erro ao buscar template ({}): {}", status_code, error_text))
            }
        }
        Err(e) => Err(format!("Erro ao conectar com a API: {}", e)),
    }
}
#[command]
pub async fn delete_template(id: u64) -> Result<ApiResponse, String> {
    let api_url = std::env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/templates/{}", api_url, id);
    
    let client = reqwest::Client::new();
    
    match client
        .delete(&full_url)
        .header("Accept", "application/json")
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<ApiResponse>().await {
                    Ok(api_response) => {
                        println!("Template deletado: {:?}", api_response);
                        Ok(api_response)
                    }
                    Err(e) => {
                        println!("Erro ao parsear resposta: {}", e);
                        Ok(ApiResponse {
                            success: true,
                            message: "Template deletado com sucesso".to_string(),
                            id: Some(id),
                        })
                    }
                }
            } else {
                // Capturar o status antes de consumir a response
                let status_code = response.status();
                let error_text = response.text().await
                    .unwrap_or_else(|_| "Erro desconhecido".to_string());
                Err(format!("Erro ao deletar template ({}): {}", status_code, error_text))
            }
        }
        Err(e) => Err(format!("Erro ao conectar com a API: {}", e)),
    }
}

#[command]
pub fn decode_base64_to_json(encoded_string: String) -> Result<serde_json::Value, String> {
    // 1. Decodificar a string Base64
    let decoded_bytes = match base64::decode(&encoded_string) {
        Ok(bytes) => bytes,
        Err(e) => return Err(format!("Falha ao decodificar Base64: {}", e)),
    };

    // 2. Converter os bytes decodificados para uma string UTF-8
    let json_string = match String::from_utf8(decoded_bytes) {
        Ok(s) => s,
        Err(e) => return Err(format!("Falha ao converter bytes para UTF-8: {}", e)),
    };

    // 3. Parsear a string para um valor JSON
    match serde_json::from_str(&json_string) {
        Ok(json_value) => Ok(json_value),
        Err(e) => Err(format!("Falha ao parsear JSON: {}", e)),
    }
}
#[command]
pub async fn update_template(template_data: TemplateData) -> Result<ApiResponse, String> {
    // Validar dados recebidos
    if template_data.nome_arquivo.trim().is_empty() {
        return Err("Nome do arquivo não pode estar vazio".to_string());
    }
    if template_data.tipo.trim().is_empty() {
        return Err("Tipo não pode estar vazio".to_string());
    }
    let json_data_base64 = template_data.json_data_base64
        .ok_or("Dados JSON não podem estar vazios".to_string())?;
    if json_data_base64.trim().is_empty() {
        return Err("Dados JSON não podem estar vazios".to_string());
    }
    
    // Validar se ID existe (obrigatório para update)
    let id_value = template_data.id.ok_or("ID do template é obrigatório para atualização")?;

    // Preparar dados para envio à API
    let api_request = ApiRequest {  // Certifique-se de usar a struct correta
        caminho_arquivo: template_data.caminho_arquivo,
        nome_arquivo: template_data.nome_arquivo,
        tag: template_data.tag,
        tipo: template_data.tipo,
        json_data_base64,
    };

    // URL da sua API
    let api_url = std::env::var("API_URL")
        .unwrap_or_else(|_| "http://localhost:8082".to_string());
    let full_url = format!("{}/templates/update/{}", api_url, id_value);

    // Criar cliente HTTP
    let client = reqwest::Client::new();

    // Fazer requisição PUT para a API (PUT é mais apropriado para updates)
    match client
        .post(&full_url)  // PUT em vez de POST para updates
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&api_request)
        .send()
        .await
    {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                match response.json::<ApiResponse>().await {
                    Ok(api_response) => {
                        println!("Template atualizado com sucesso: {:?}", api_response);
                        Ok(api_response)
                    }
                    Err(e) => {
                        println!("Erro ao parsear resposta da API: {}", e);
                        Ok(ApiResponse {
                            success: true,
                            message: "Template salvo com sucesso".to_string(),
                            id: Some(id_value),
                        })
                    }
                }
            } else {
                let status_code = response.status();
                let error_text = response.text().await
                    .unwrap_or_else(|_| "Erro desconhecido".to_string());
                let error_msg = format!("Erro da API ({}): {}", status_code, error_text);
                println!("{}", error_msg);
                Err(error_msg)
            }
        }
        Err(e) => {
            let error_msg = format!("Erro ao conectar com a API: {}", e);
            println!("{}", error_msg);
            Err(error_msg)
        }
    }
}