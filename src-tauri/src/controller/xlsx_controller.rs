use calamine::{open_workbook_from_rs, Reader, Xlsx, Data, CellErrorType};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::Cursor;
use tauri::command;
use calamine::open_workbook;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CellStyle {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_weight: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_style: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_decoration: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_align: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_size: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub font_family: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_top: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_right: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_bottom: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_left: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub border_radius: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub padding: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub margin: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vertical_align: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_transform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub letter_spacing: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line_height: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text_shadow: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub box_shadow: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opacity: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CellData {
    pub value: String,
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub formula: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style: Option<CellStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locked: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct XlsxImportResult {
    pub success: bool,
    pub data: Option<Vec<Vec<CellData>>>,
    pub rows: Option<usize>,
    pub cols: Option<usize>,
    pub column_widths: Option<Vec<f64>>,
    pub row_heights: Option<Vec<f64>>,
    pub error: Option<String>,
    pub sheet_names: Option<Vec<String>>,
    pub imported_sheet: Option<String>,
}

impl Default for CellStyle {
    fn default() -> Self {
        CellStyle {
            font_weight: None,
            font_style: None,
            text_decoration: None,
            text_align: None,
            background_color: None,
            color: None,
            font_size: None,
            font_family: None,
            border: None,
            border_top: None,
            border_right: None,
            border_bottom: None,
            border_left: None,
            border_radius: None,
            padding: None,
            margin: None,
            width: None,
            height: None,
            vertical_align: None,
            text_transform: None,
            letter_spacing: None,
            line_height: None,
            text_shadow: None,
            box_shadow: None,
            opacity: None,
        }
    }
}

fn convert_data_type_to_string(data_type: &Data) -> String {
    match data_type {
        Data::Int(i) => i.to_string(),
        Data::Float(f) => f.to_string(),
        Data::String(s) => s.clone(),
        Data::Bool(b) => b.to_string(),
        Data::DateTime(dt) => format!("{}", dt),
        Data::DateTimeIso(dt) => dt.clone(),
        Data::DurationIso(d) => d.clone(),
        Data::Error(CellErrorType::Div0) => "#DIV/0!".to_string(),
        Data::Error(CellErrorType::NA) => "#N/A".to_string(),
        Data::Error(CellErrorType::Name) => "#NAME?".to_string(),
        Data::Error(CellErrorType::Null) => "#NULL!".to_string(),
        Data::Error(CellErrorType::Num) => "#NUM!".to_string(),
        Data::Error(CellErrorType::Ref) => "#REF!".to_string(),
        Data::Error(CellErrorType::Value) => "#VALUE!".to_string(),
        Data::Error(CellErrorType::GettingData) => "#GETTING_DATA!".to_string(),
        Data::Empty => String::new(),
    }
}

fn extract_basic_style_from_xlsx(value: &Data) -> CellStyle {
    let mut style = CellStyle::default();
    
    // Aplicar estilos básicos baseados no tipo de dados
    match value {
        Data::Int(_) | Data::Float(_) => {
            style.text_align = Some("right".to_string());
            style.font_family = Some("monospace".to_string());
        },
        Data::DateTime(_) | Data::DateTimeIso(_) => {
            style.text_align = Some("center".to_string());
            style.font_family = Some("monospace".to_string());
            style.color = Some("#7c3aed".to_string());
        },
        Data::DurationIso(_) => {
            style.text_align = Some("center".to_string());
            style.font_family = Some("monospace".to_string());
            style.color = Some("#059669".to_string());
        },
        Data::Bool(_) => {
            style.text_align = Some("center".to_string());
            style.font_weight = Some("bold".to_string());
        },
        Data::Error(_) => {
            style.background_color = Some("#fecaca".to_string());
            style.color = Some("#991b1b".to_string());
            style.font_weight = Some("bold".to_string());
        },
        _ => {
            style.text_align = Some("left".to_string());
        }
    }
    
    style
}

// Função original que usa caminho de arquivo (mantida para compatibilidade)
#[command]
pub async fn import_xlsx_file(file_path: String, sheet_name: Option<String>) -> Result<XlsxImportResult, String> {
    println!("Tentando importar arquivo XLSX: {}", file_path);
    
    // Abrir o arquivo XLSX
    let mut workbook: Xlsx<_> = match open_workbook(&file_path) {
        Ok(wb) => wb,
        Err(e) => {
            let error_msg = format!("Erro ao abrir arquivo XLSX: {}", e);
            println!("{}", error_msg);
            return Ok(XlsxImportResult {
                success: false,
                data: None,
                rows: None,
                cols: None,
                column_widths: None,
                row_heights: None,
                error: Some(error_msg),
                sheet_names: None,
                imported_sheet: None,
            });
        }
    };

    process_xlsx_workbook_generic(&mut workbook, sheet_name, None)
}

// Nova função que recebe bytes do arquivo
#[command]
pub async fn import_xlsx_from_bytes(
    file_bytes: Vec<u8>, 
    file_name: String, 
    sheet_name: Option<String>
) -> Result<XlsxImportResult, String> {
    println!("Tentando importar arquivo XLSX a partir de bytes: {} ({} bytes)", file_name, file_bytes.len());
    
    if file_bytes.is_empty() {
        let error_msg = "Arquivo vazio ou não foi possível ler os bytes".to_string();
        println!("{}", error_msg);
        return Ok(XlsxImportResult {
            success: false,
            data: None,
            rows: None,
            cols: None,
            column_widths: None,
            row_heights: None,
            error: Some(error_msg),
            sheet_names: None,
            imported_sheet: None,
        });
    }

    // Criar um cursor a partir dos bytes
    let cursor = Cursor::new(file_bytes);
    
    // Abrir o workbook a partir do cursor
    let mut workbook: Xlsx<_> = match open_workbook_from_rs(cursor) {
        Ok(wb) => wb,
        Err(e) => {
            let error_msg = format!("Erro ao abrir arquivo XLSX a partir dos bytes: {}", e);
            println!("{}", error_msg);
            return Ok(XlsxImportResult {
                success: false,
                data: None,
                rows: None,
                cols: None,
                column_widths: None,
                row_heights: None,
                error: Some(error_msg),
                sheet_names: None,
                imported_sheet: None,
            });
        }
    };

    process_xlsx_workbook_generic(&mut workbook, sheet_name, Some(file_name))
}

// Função auxiliar genérica para processar o workbook (funciona com qualquer Reader)
fn process_xlsx_workbook_generic<R: std::io::Read + std::io::Seek>(
    workbook: &mut Xlsx<R>, 
    sheet_name: Option<String>, 
    file_name: Option<String>
) -> Result<XlsxImportResult, String> {
    // Obter nomes das planilhas
    let sheet_names: Vec<String> = workbook.sheet_names().to_vec();
    println!("Planilhas encontradas: {:?}", sheet_names);

    // Determinar qual planilha usar
    let target_sheet = match sheet_name {
        Some(name) => {
            if sheet_names.contains(&name) {
                name
            } else {
                sheet_names.first().unwrap_or(&"Sheet1".to_string()).clone()
            }
        },
        None => sheet_names.first().unwrap_or(&"Sheet1".to_string()).clone(),
    };

    println!("Usando planilha: {}", target_sheet);

    // Ler dados da planilha
    let range = match workbook.worksheet_range(&target_sheet) {
        Ok(range) => range,
        Err(e) => {
            let error_msg = format!("Erro ao ler planilha '{}': {}", target_sheet, e);
            println!("{}", error_msg);
            return Ok(XlsxImportResult {
                success: false,
                data: None,
                rows: None,
                cols: None,
                column_widths: None,
                row_heights: None,
                error: Some(error_msg),
                sheet_names: Some(sheet_names),
                imported_sheet: Some(target_sheet),
            });
        }
    };

    let (height, width) = range.get_size();
    println!("Dimensões da planilha: {}x{}", height, width);

    if height == 0 || width == 0 {
        let error_msg = "Planilha não contém dados".to_string();
        return Ok(XlsxImportResult {
            success: false,
            data: None,
            rows: None,
            cols: None,
            column_widths: None,
            row_heights: None,
            error: Some(error_msg),
            sheet_names: Some(sheet_names),
            imported_sheet: Some(target_sheet),
        });
    }

    // Converter dados para o formato da aplicação
    let mut data: Vec<Vec<CellData>> = Vec::new();
    let mut column_widths: Vec<f64> = vec![100.0; width];
    let mut row_heights: Vec<f64> = vec![32.0; height];

    for row_idx in 0..height {
        let mut row_data: Vec<CellData> = Vec::new();
        
        for col_idx in 0..width {
            let cell_value = range.get_value((row_idx as u32, col_idx as u32))
                .unwrap_or(&Data::Empty);
            
            let value_string = convert_data_type_to_string(cell_value);
            let style = extract_basic_style_from_xlsx(cell_value);
            
            // Ajustar largura da coluna baseado no conteúdo
            let content_width = (value_string.len() as f64 * 8.0).max(60.0).min(300.0);
            if content_width > column_widths[col_idx] {
                column_widths[col_idx] = content_width;
            }
            
            // Ajustar altura da linha se necessário (para conteúdo longo)
            if value_string.len() > 50 {
                row_heights[row_idx] = 48.0;
            }

            let cell_data = CellData {
                value: value_string,
                id: format!("cell-{}-{}", row_idx, col_idx),
                formula: None,
                style: Some(style),
                locked: Some(false),
                comment: None,
            };
            
            row_data.push(cell_data);
        }
        
        data.push(row_data);
    }

    let source_info = if let Some(name) = file_name {
        format!("arquivo '{}'", name)
    } else {
        "arquivo".to_string()
    };

    println!("Importação concluída com sucesso do {}. Linhas: {}, Colunas: {}", source_info, height, width);

    Ok(XlsxImportResult {
        success: true,
        data: Some(data),
        rows: Some(height),
        cols: Some(width),
        column_widths: Some(column_widths),
        row_heights: Some(row_heights),
        error: None,
        sheet_names: Some(sheet_names),
        imported_sheet: Some(target_sheet),
    })
}

#[command]
pub async fn get_xlsx_sheet_names(file_path: String) -> Result<Vec<String>, String> {
    println!("Obtendo nomes das planilhas do arquivo: {}", file_path);
    
    let workbook: Xlsx<_> = match open_workbook(&file_path) {
        Ok(wb) => wb,
        Err(e) => {
            let error_msg = format!("Erro ao abrir arquivo XLSX: {}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };

    let sheet_names: Vec<String> = workbook.sheet_names().to_vec();
    println!("Planilhas encontradas: {:?}", sheet_names);
    
    Ok(sheet_names)
}

// Nova função para obter nomes das planilhas a partir de bytes
#[command]
pub async fn get_xlsx_sheet_names_from_bytes(file_bytes: Vec<u8>, file_name: String) -> Result<Vec<String>, String> {
    println!("Obtendo nomes das planilhas do arquivo: {} ({} bytes)", file_name, file_bytes.len());
    
    if file_bytes.is_empty() {
        let error_msg = "Arquivo vazio ou não foi possível ler os bytes".to_string();
        println!("{}", error_msg);
        return Err(error_msg);
    }

    // Criar um cursor a partir dos bytes
    let cursor = Cursor::new(file_bytes);
    
    let workbook: Xlsx<_> = match open_workbook_from_rs(cursor) {
        Ok(wb) => wb,
        Err(e) => {
            let error_msg = format!("Erro ao abrir arquivo XLSX a partir dos bytes: {}", e);
            println!("{}", error_msg);
            return Err(error_msg);
        }
    };

    let sheet_names: Vec<String> = workbook.sheet_names().to_vec();
    println!("Planilhas encontradas: {:?}", sheet_names);
    
    Ok(sheet_names)
}