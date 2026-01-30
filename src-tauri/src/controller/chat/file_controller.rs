use serde::{Serialize, Deserialize};
use reqwest::Client;
use base64::{Engine as _, engine::general_purpose};
use std::path::Path;
use tauri::AppHandle;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileMetadata {
    pub original_name: String,
    pub stored_name: String,
    pub file_type: String,
    pub file_size: u64,
    pub file_path: String,
    pub is_code: bool,
    pub code_language: Option<String>,
    pub file_extension: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct MessageInfo {
    pub id: u64,
    pub user_id: u32,
    pub content: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
    pub user_name: String,
    pub visualizado_cont: i32,
    pub visualizado_hora: Option<chrono::DateTime<chrono::Utc>>,
    pub visualizado: bool,
    pub arquivo: bool,
    pub arquivo_nome: Option<String>,
    pub arquivo_tipo: Option<String>,
    pub arquivo_tamanho: Option<u64>,
    pub arquivo_url: Option<String>,
    pub is_code: Option<bool>,
    pub code_language: Option<String>,
    pub file_extension: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendMessageRequest {
    pub chat_id: i32,
    pub user_id: i32,
    pub content: String,
    pub arquivo: Option<bool>,
    pub arquivo_nome: Option<String>,
    pub arquivo_tipo: Option<String>,
    pub arquivo_tamanho: Option<u64>,
    pub file_content: Option<String>,
}

// Estrutura de mapeamento de linguagens (sincronizado com o backend)
fn detect_code_language(filename: &str) -> Option<(String, String)> {
    let path_obj = Path::new(filename);
    let extension = path_obj.extension()?.to_str()?.to_lowercase();
    
    let language_map: Vec<(&str, &str)> = vec![
        // Linguagens principais
        ("rs", "rust"),
        ("java", "java"),
        ("kt", "kotlin"), ("kts", "kotlin"),
        ("php", "php"),
        ("js", "javascript"), ("mjs", "javascript"), ("cjs", "javascript"),
        ("jsx", "javascriptreact"),
        ("ts", "typescript"), ("mts", "typescript"), ("cts", "typescript"),
        ("tsx", "typescriptreact"),
        ("c", "c"),
        ("cpp", "cpp"), ("cc", "cpp"), ("cxx", "cpp"), ("c++", "cpp"),
        ("h", "c"),
        ("hpp", "cpp"), ("hh", "cpp"), ("hxx", "cpp"), ("h++", "cpp"),
        ("cs", "csharp"), ("csx", "csharp"),
        ("py", "python"), ("pyw", "python"), ("pyi", "python"),
        ("rb", "ruby"),
        ("go", "go"),
        ("swift", "swift"),
        ("m", "objective-c"), ("mm", "objective-c"),
        
        // Web
        ("html", "html"), ("htm", "html"),
        ("css", "css"),
        ("scss", "scss"),
        ("sass", "sass"),
        ("less", "less"),
        ("vue", "vue"),
        ("svelte", "svelte"),
        
        // Config/Data
        ("json", "json"), ("jsonc", "json"),
        ("xml", "xml"),
        ("yaml", "yaml"), ("yml", "yaml"),
        ("toml", "toml"),
        ("md", "markdown"), ("markdown", "markdown"),
        ("ini", "ini"), ("cfg", "ini"), ("conf", "ini"),
        
        // Shell
        ("sh", "bash"), ("bash", "bash"), ("zsh", "bash"),
        ("fish", "fish"),
        ("ps1", "powershell"), ("psm1", "powershell"), ("psd1", "powershell"),
        ("bat", "bat"), ("cmd", "bat"),
        
        // SQL
        ("sql", "sql"),
        
        // Outros
        ("r", "r"),
        ("dart", "dart"),
        ("lua", "lua"),
        ("pl", "perl"), ("pm", "perl"),
        ("groovy", "groovy"), ("gradle", "groovy"),
        ("scala", "scala"),
        ("clj", "clojure"), ("cljs", "clojure"),
        ("ex", "elixir"), ("exs", "elixir"),
        ("erl", "erlang"), ("hrl", "erlang"),
        ("hs", "haskell"), ("lhs", "haskell"),
        ("ml", "ocaml"), ("mli", "ocaml"),
        ("vim", "vim"),
        ("dockerfile", "dockerfile"),
    ];
    
    for (ext, lang) in language_map {
        if extension == ext {
            return Some((extension.to_string(), lang.to_string()));
        }
    }
    
    // Arquivos especiais
    let filename_lower = filename.to_lowercase();
    if filename_lower == "dockerfile" || filename_lower == "makefile" {
        return Some((String::new(), filename_lower));
    }
    
    None
}

fn is_allowed_file_type(file_type: &str, filename: &str) -> bool {
    if detect_code_language(filename).is_some() {
        return true;
    }
    
    let allowed_types = vec![
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp",
        "image/svg+xml", "image/bmp", "image/tiff",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain", "text/csv", "text/html", "text/css",
        "text/javascript", "application/javascript",
        "application/json", "application/xml", "text/xml",
        "application/zip", "application/x-zip-compressed",
        "application/x-rar-compressed", "application/x-7z-compressed",
        "application/x-tar", "application/gzip",
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/webm",
        "video/mp4", "video/webm", "video/ogg", "video/quicktime",
    ];
    
    allowed_types.contains(&file_type)
}

#[tauri::command]
pub async fn send_file_message_enhanced(
    app_handle: AppHandle,
    chat_id: i32,
    user_id: i32,
    file_name: String,
    file_type: String,
    file_size: u64,
    file_content: String, // Base64
) -> Result<MessageInfo, String> {
    // Validacoes
    if !is_allowed_file_type(&file_type, &file_name) {
        return Err(format!("Tipo de arquivo nao permitido: {} - {}", file_type, file_name));
    }
    
    const MAX_FILE_SIZE: u64 = 50 * 1024 * 1024; // 50MB
    if file_size > MAX_FILE_SIZE {
        return Err(format!("Arquivo muito grande. Maximo: 50MB. Atual: {} bytes", file_size));
    }
    
    // Detectar se e codigo
    let (is_code, language, extension) = if let Some((ext, lang)) = detect_code_language(&file_name) {
        (true, Some(lang), Some(ext))
    } else {
        (false, None, None)
    };
    
    // Gerar mensagem adequada
    let content = if is_code {
        format!("Code File: {} [{}]", file_name, language.as_ref().unwrap_or(&"code".to_string()))
    } else if file_type.starts_with("image/") {
        format!("Image: {}", file_name)
    } else if file_type == "application/pdf" {
        format!("PDF: {}", file_name)
    } else if file_type.starts_with("video/") {
        format!("Video: {}", file_name)
    } else if file_type.starts_with("audio/") {
        format!("Audio: {}", file_name)
    } else {
        format!("File: {}", file_name)
    };
    
    let request_body = SendMessageRequest {
        chat_id,
        user_id,
        content,
        arquivo: Some(true),
        arquivo_nome: Some(file_name),
        arquivo_tipo: Some(file_type),
        arquivo_tamanho: Some(file_size),
        file_content: Some(file_content),
    };
    
    // Obter URL da API usando funcao auxiliar
    let api_url = get_api_url(&app_handle);
    let full_url = format!("{}/chat/message/send", api_url);
    
    let client = Client::new();
    let response = client
        .post(&full_url)
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar arquivo: {}", e))?;
    
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_else(|_| "N/A".to_string());
        return Err(format!("Erro da API: Status {}. Resposta: {}", status, body));
    }
    
    let body = response.text().await
        .map_err(|e| format!("Erro ao ler resposta: {}", e))?;
    
    let mut parsed: MessageInfo = serde_json::from_str(&body)
        .map_err(|e| format!("Erro ao decodificar JSON: {}", e))?;
    
    // Adicionar informacoes de codigo
    parsed.is_code = Some(is_code);
    parsed.code_language = language;
    parsed.file_extension = extension;
    
    Ok(parsed)
}

#[tauri::command]
pub async fn get_code_file_content(
    app_handle: AppHandle,
    file_url: String,
) -> Result<String, String> {
    let client = Client::new();
    
    // Construir URL completa
    let base_url = get_api_url(&app_handle);
    
    let full_url = if file_url.starts_with("http") {
        file_url
    } else {
        format!("{}{}", base_url, file_url)
    };
    
    let response = client
        .get(&full_url)
        .send()
        .await
        .map_err(|e| format!("Erro ao buscar arquivo: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Erro ao buscar arquivo: {}", response.status()));
    }
    
    response.text().await
        .map_err(|e| format!("Erro ao ler conteudo: {}", e))
}

#[tauri::command]
pub async fn read_file_as_base64(file_path: String) -> Result<String, String> {
    use std::fs;
    
    let file_bytes = fs::read(&file_path)
        .map_err(|e| format!("Erro ao ler arquivo: {}", e))?;
    
    Ok(general_purpose::STANDARD.encode(&file_bytes))
}

#[tauri::command]
pub async fn get_file_info(file_path: String) -> Result<FileMetadata, String> {
    use std::fs;
    
    let metadata = fs::metadata(&file_path)
        .map_err(|e| format!("Erro ao obter informacoes do arquivo: {}", e))?;
    
    let file_size = metadata.len();
    let file_name = Path::new(&file_path)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unknown")
        .to_string();
    
    // Detectar tipo MIME basico
    let file_type = if let Some(ext) = Path::new(&file_path).extension() {
        match ext.to_str().unwrap_or("") {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "gif" => "image/gif",
            "pdf" => "application/pdf",
            "txt" => "text/plain",
            _ => "application/octet-stream",
        }
    } else {
        "application/octet-stream"
    }.to_string();
    
    let (is_code, code_language, file_extension) = if let Some((ext, lang)) = detect_code_language(&file_name) {
        (true, Some(lang), Some(ext))
    } else {
        (false, None, None)
    };
    
    Ok(FileMetadata {
        original_name: file_name.clone(),
        stored_name: file_name,
        file_type,
        file_size,
        file_path,
        is_code,
        code_language,
        file_extension,
    })
}

// Funcao auxiliar para obter URL da API
fn get_api_url(app_handle: &AppHandle) -> String {
    std::env::var("API_URL")
        .unwrap_or_else(|_| {
            // Tentar obter do config do Tauri
            app_handle
                .config()
                .app
                .windows
                .first()
                .and_then(|_| Some("http://127.0.0.1:8082".to_string()))
                .unwrap_or_else(|| "http://127.0.0.1:8082".to_string())
        })
}