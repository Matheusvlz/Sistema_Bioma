use tauri::command;
use reqwest;
use std::path::PathBuf;
use std::fs;
use std::io::Write;
use dirs;
use tokio::time::{timeout, Duration};

#[command]
pub async fn download_file_to_downloads(url: String, file_name: String) -> Result<String, String> {
    println!("Iniciando download de: {}", url);
    
    // Timeout de 30 segundos para a requisição
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    // Fazer o download do arquivo
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro ao fazer requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro HTTP: {} - {}", response.status(), response.status().canonical_reason().unwrap_or("Unknown")));
    }

    let bytes = response.bytes()
        .await
        .map_err(|e| format!("Erro ao ler bytes: {}", e))?;

    // Obter o diretório Downloads do usuário
    let downloads_dir = dirs::download_dir()
        .ok_or("Não foi possível encontrar o diretório Downloads")?;

    // Criar o diretório se não existir
    if !downloads_dir.exists() {
        fs::create_dir_all(&downloads_dir)
            .map_err(|e| format!("Erro ao criar diretório Downloads: {}", e))?;
    }

    // Verificar se o arquivo já existe e criar um nome único se necessário
    let mut file_path = downloads_dir.join(&file_name);
    let mut counter = 1;
    let original_name = file_name.clone();
    
    while file_path.exists() {
        let name_parts: Vec<&str> = original_name.rsplitn(2, '.').collect();
        let new_name = if name_parts.len() == 2 {
            format!("{} ({}).{}", name_parts[1], counter, name_parts[0])
        } else {
            format!("{} ({})", original_name, counter)
        };
        file_path = downloads_dir.join(&new_name);
        counter += 1;
    }

    // Salvar o arquivo
    let mut file = fs::File::create(&file_path)
        .map_err(|e| format!("Erro ao criar arquivo: {}", e))?;

    file.write_all(&bytes)
        .map_err(|e| format!("Erro ao escrever arquivo: {}", e))?;

    let final_path = file_path.to_string_lossy().to_string();
    println!("Arquivo salvo em: {}", final_path);
    
    Ok(final_path)
}

// Função alternativa que retorna os bytes diretamente
#[command]
pub async fn download_file_bytes(url: String) -> Result<Vec<u8>, String> {
    println!("Baixando bytes de: {}", url);
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .build()
        .map_err(|e| format!("Erro ao criar cliente HTTP: {}", e))?;

    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| format!("Erro ao fazer requisição: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Erro HTTP: {}", response.status()));
    }

    let bytes = response.bytes()
        .await
        .map_err(|e| format!("Erro ao ler bytes: {}", e))?;

    Ok(bytes.to_vec())
}