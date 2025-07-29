use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::command;

#[derive(Debug, Deserialize, Serialize)] // Added Serialize here
pub struct PrintOptions {
    pub orientation: Option<String>,
    pub paper_size: Option<String>,
    pub margins: Option<PrintMargins>,
    pub scale: Option<f64>,
    pub print_background: Option<bool>,
    pub header_footer: Option<bool>,
    pub header_template: Option<String>,
    pub footer_template: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)] // Added Serialize here
pub struct PrintMargins {
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub left: f64,
}

#[derive(Debug, Serialize)]
pub struct PrintResult {
    pub success: bool,
    pub path: Option<String>,
    pub error: Option<String>,
}

/// Gera PDF a partir de HTML usando bibliotecas nativas
#[command]
pub async fn generate_pdf_from_html(
    html: String,
    options: PrintOptions,
) -> Result<PrintResult, String> {
    use std::fs;
    use uuid::Uuid;

    let temp_dir = std::env::temp_dir();
    let file_id = Uuid::new_v4().to_string();
    let html_path = temp_dir.join(format!("print_{}.html", file_id));
    let pdf_path = temp_dir.join(format!("print_{}.pdf", file_id));

    // Escrever HTML temporário
    if let Err(e) = fs::write(&html_path, &html) {
        return Ok(PrintResult {
            success: false,
            path: None,
            error: Some(format!("Erro ao escrever arquivo HTML: {}", e)),
        });
    }

    // Para esta implementação simplificada, vamos usar wkhtmltopdf como alternativa
    // ou você pode implementar sua própria lógica de conversão HTML->PDF
    
    // Exemplo usando comando do sistema (requer wkhtmltopdf instalado)
    let result = std::process::Command::new("wkhtmltopdf")
        .arg("--enable-local-file-access")
        .arg("--page-size")
        .arg(options.paper_size.as_deref().unwrap_or("A4"))
        .arg(if options.orientation.as_deref() == Some("landscape") { 
            "--orientation" 
        } else { 
            "--orientation" 
        })
        .arg(if options.orientation.as_deref() == Some("landscape") { 
            "Landscape" 
        } else { 
            "Portrait" 
        })
        .arg(&html_path)
        .arg(&pdf_path)
        .output();

    match result {
        Ok(output) => {
            if output.status.success() {
                // Limpar arquivo HTML temporário
                let _ = fs::remove_file(&html_path);
                
                Ok(PrintResult {
                    success: true,
                    path: Some(pdf_path.to_string_lossy().to_string()),
                    error: None,
                })
            } else {
                let error_msg = String::from_utf8_lossy(&output.stderr);
                Ok(PrintResult {
                    success: false,
                    path: None,
                    error: Some(format!("Erro na conversão PDF: {}", error_msg)),
                })
            }
        }
        Err(e) => {
            // Limpar arquivo HTML temporário
            let _ = fs::remove_file(&html_path);
            
            Ok(PrintResult {
                success: false,
                path: None,
                error: Some(format!("wkhtmltopdf não encontrado. Instale wkhtmltopdf ou use uma alternativa: {}", e)),
            })
        }
    }
}

/// Imprime HTML usando sistema nativo
#[command]
pub async fn print_html(
    html: String,
    options: PrintOptions,
) -> Result<PrintResult, String> {
    use std::process::Command;
    use std::fs;
    use uuid::Uuid;

    let temp_dir = std::env::temp_dir();
    let file_id = Uuid::new_v4().to_string();
    let html_path = temp_dir.join(format!("print_{}.html", file_id));

    // Escrever HTML temporário
    if let Err(e) = fs::write(&html_path, &html) {
        return Ok(PrintResult {
            success: false,
            path: None,
            error: Some(format!("Erro ao escrever arquivo HTML: {}", e)),
        });
    }

    // Converter PathBuf para String para evitar erro de trait
    let html_path_str = html_path.to_string_lossy().to_string();

    // Tentar imprimir usando comando do sistema
    let result = if cfg!(target_os = "windows") {
        // Windows: usar Internet Explorer para impressão
        Command::new("cmd")
            .args(&["/C", "start", "/wait", "iexplore.exe", "-k", &html_path_str])
            .output()
    } else if cfg!(target_os = "macos") {
        // macOS: usar Safari
        Command::new("open")
            .args(&["-a", "Safari", &html_path_str])
            .output()
    } else {
        // Linux: usar xdg-open
        Command::new("xdg-open")
            .arg(&html_path_str)
            .output()
    };

    match result {
        Ok(_) => {
            // Aguardar um pouco antes de limpar o arquivo
            tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            let _ = fs::remove_file(&html_path);
            
            Ok(PrintResult {
                success: true,
                path: None,
                error: None,
            })
        }
        Err(e) => Ok(PrintResult {
            success: false,
            path: None,
            error: Some(format!("Erro ao imprimir: {}", e)),
        }),
    }
}

/// Salva HTML em arquivo especificado pelo usuário
#[command]
pub async fn save_print_html(
    html: String,
    file_path: String,
) -> Result<PrintResult, String> {
    use std::fs;

    match fs::write(&file_path, &html) {
        Ok(_) => Ok(PrintResult {
            success: true,
            path: Some(file_path),
            error: None,
        }),
        Err(e) => Ok(PrintResult {
            success: false,
            path: None,
            error: Some(format!("Erro ao salvar arquivo: {}", e)),
        }),
    }
}

/// Obtém impressoras disponíveis no sistema
#[command]
pub async fn get_available_printers() -> Result<Vec<String>, String> {
    use std::process::Command;

    let output = if cfg!(target_os = "windows") {
        Command::new("wmic")
            .args(&["printer", "get", "name"])
            .output()
    } else if cfg!(target_os = "macos") {
        Command::new("lpstat")
            .args(&["-p"])
            .output()
    } else {
        Command::new("lpstat")
            .args(&["-p"])
            .output()
    };

    match output {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let printers: Vec<String> = output_str
                .lines()
                .filter_map(|line| {
                    let line = line.trim();
                    if !line.is_empty() && !line.contains("Name") && !line.contains("printer") {
                        Some(line.to_string())
                    } else {
                        None
                    }
                })
                .collect();
            Ok(printers)
        }
        Err(e) => Err(format!("Erro ao obter impressoras: {}", e)),
    }
}

/// Valida se uma impressora está disponível
#[command]
pub async fn validate_printer(printer_name: String) -> Result<bool, String> {
    let printers = get_available_printers().await?;
    Ok(printers.iter().any(|p| p.contains(&printer_name)))
}

/// Obtém configurações padrão de impressão do sistema
#[command]
pub fn get_default_print_settings() -> Result<PrintOptions, String> {
    // Retornar configurações padrão baseadas no sistema
    Ok(PrintOptions {
        orientation: Some("portrait".to_string()),
        paper_size: Some("A4".to_string()),
        margins: Some(PrintMargins {
            top: 1.0,
            right: 1.0,
            bottom: 1.0,
            left: 1.0,
        }),
        scale: Some(0.8),
        print_background: Some(true),
        header_footer: Some(false),
        header_template: None,
        footer_template: None,
    })
}