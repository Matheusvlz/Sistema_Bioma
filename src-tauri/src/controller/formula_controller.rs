use crate::controller::formula_parser_controller::{FormulaParser, FormulaEvaluator, FormulaValue, parse_cell_reference, cell_reference_to_string};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellData {
    pub value: String,
    pub formula: Option<String>,
    pub computed_value: Option<String>,
    pub error: Option<String>,
    pub is_formula: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpreadsheetData {
    pub cells: HashMap<String, CellData>,
    pub rows: usize,
    pub cols: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormulaResult {
    pub success: bool,
    pub value: String,
    pub error: Option<String>,
    pub dependencies: Vec<String>,
    pub formula_type: String, // "number", "text", "boolean", "error", "array"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CellUpdateRequest {
    pub cell_ref: String,
    pub value: String,
    pub is_formula: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpreadsheetUpdateRequest {
    pub updates: Vec<CellUpdateRequest>,
    pub spreadsheet_data: SpreadsheetData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormulaFunction {
    pub name: String,
    pub description: String,
    pub syntax: String,
    pub example: String,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FormulaSuggestion {
    pub function_name: String,
    pub display_text: String,
    pub description: String,
    pub insert_text: String,
}

pub struct FormulaEngine {
    evaluator: FormulaEvaluator,
    dependency_graph: HashMap<String, Vec<String>>, // cell -> cells that depend on it
    reverse_dependencies: HashMap<String, Vec<String>>, // cell -> cells it depends on
}

impl FormulaEngine {
    pub fn new() -> Self {
        Self {
            evaluator: FormulaEvaluator::new(),
            dependency_graph: HashMap::new(),
            reverse_dependencies: HashMap::new(),
        }
    }

    pub fn update_cell(&mut self, cell_ref: &str, value: &str, is_formula: bool) -> FormulaResult {
        let cell_ref = cell_ref.to_uppercase();
        
        if is_formula {
            self.update_formula_cell(&cell_ref, value)
        } else {
            self.update_value_cell(&cell_ref, value)
        }
    }

    fn update_value_cell(&mut self, cell_ref: &str, value: &str) -> FormulaResult {
        // Parse the value
        let formula_value = if let Ok(num) = value.parse::<f64>() {
            FormulaValue::Number(num)
        } else if value.to_lowercase() == "true" {
            FormulaValue::Boolean(true)
        } else if value.to_lowercase() == "false" {
            FormulaValue::Boolean(false)
        } else {
            FormulaValue::Text(value.to_string())
        };

        // Update the evaluator
        self.evaluator.set_cell_value(cell_ref, formula_value.clone());

        // Clear any existing dependencies for this cell
        self.clear_dependencies(cell_ref);

        let formula_type = match formula_value {
            FormulaValue::Number(_) => "number",
            FormulaValue::Text(_) => "text",
            FormulaValue::Boolean(_) => "boolean",
            FormulaValue::Error(_) => "error",
            FormulaValue::Array(_) => "array",
            FormulaValue::Date(_) => "date",
        };

        FormulaResult {
            success: true,
            value: formula_value.to_string(),
            error: None,
            dependencies: vec![],
            formula_type: formula_type.to_string(),
        }
    }

    fn update_formula_cell(&mut self, cell_ref: &str, formula: &str) -> FormulaResult {
        // Remove leading '=' if present
        let formula = if formula.starts_with('=') {
            &formula[1..]
        } else {
            formula
        };

        // Parse the formula
        let mut parser = FormulaParser::new();
        let expr = match parser.parse(formula) {
            Ok(expr) => expr,
            Err(e) => {
                return FormulaResult {
                    success: false,
                    value: "#ERROR".to_string(),
                    error: Some(e),
                    dependencies: vec![],
                    formula_type: "error".to_string(),
                };
            }
        };

        // Get dependencies
        let dependencies = self.evaluator.get_cell_references(&expr);

        // Check for circular references
        if let Some(circular_ref) = self.check_circular_reference(cell_ref, &dependencies) {
            return FormulaResult {
                success: false,
                value: "#CIRCULAR".to_string(),
                error: Some(format!("Circular reference detected: {}", circular_ref)),
                dependencies,
                formula_type: "error".to_string(),
            };
        }

        // Evaluate the formula
        let result = self.evaluator.evaluate(&expr);

        // Update dependencies
        self.update_dependencies(cell_ref, &dependencies);

        // Update the evaluator with the result
        self.evaluator.set_cell_value(cell_ref, result.clone());

        let formula_type = match result {
            FormulaValue::Number(_) => "number",
            FormulaValue::Text(_) => "text",
            FormulaValue::Boolean(_) => "boolean",
            FormulaValue::Error(_) => "error",
            FormulaValue::Array(_) => "array",
            FormulaValue::Date(_) => "date",
        };

        match result {
            FormulaValue::Error(e) => FormulaResult {
                success: false,
                value: "#ERROR".to_string(),
                error: Some(e),
                dependencies,
                formula_type: "error".to_string(),
            },
            _ => FormulaResult {
                success: true,
                value: result.to_string(),
                error: None,
                dependencies,
                formula_type: formula_type.to_string(),
            },
        }
    }

    fn clear_dependencies(&mut self, cell_ref: &str) {
        // Remove this cell from dependency graph
        if let Some(deps) = self.reverse_dependencies.remove(cell_ref) {
            for dep in deps {
                if let Some(dependents) = self.dependency_graph.get_mut(&dep) {
                    dependents.retain(|x| x != cell_ref);
                }
            }
        }
    }

    fn update_dependencies(&mut self, cell_ref: &str, dependencies: &[String]) {
        // Clear existing dependencies
        self.clear_dependencies(cell_ref);

        // Add new dependencies
        self.reverse_dependencies.insert(cell_ref.to_string(), dependencies.to_vec());

        for dep in dependencies {
            self.dependency_graph
                .entry(dep.clone())
                .or_insert_with(Vec::new)
                .push(cell_ref.to_string());
        }
    }

    fn check_circular_reference(&self, cell_ref: &str, dependencies: &[String]) -> Option<String> {
        fn dfs(
            current: &str,
            target: &str,
            graph: &HashMap<String, Vec<String>>,
            visited: &mut HashMap<String, bool>,
            path: &mut Vec<String>,
        ) -> Option<String> {
            if current == target {
                return Some(path.join(" -> "));
            }

            if *visited.get(current).unwrap_or(&false) {
                return None;
            }

            visited.insert(current.to_string(), true);
            path.push(current.to_string());

            if let Some(deps) = graph.get(current) {
                for dep in deps {
                    if let Some(circular) = dfs(dep, target, graph, visited, path) {
                        return Some(circular);
                    }
                }
            }

            path.pop();
            visited.insert(current.to_string(), false);
            None
        }

        for dep in dependencies {
            let mut visited = HashMap::new();
            let mut path = Vec::new();
            if let Some(circular) = dfs(dep, cell_ref, &self.reverse_dependencies, &mut visited, &mut path) {
                return Some(circular);
            }
        }

        None
    }

    pub fn get_dependent_cells(&self, cell_ref: &str) -> Vec<String> {
        let mut dependents = Vec::new();
        let mut to_visit = vec![cell_ref.to_string()];
        let mut visited = std::collections::HashSet::new();

        while let Some(current) = to_visit.pop() {
            if visited.contains(&current) {
                continue;
            }
            visited.insert(current.clone());

            if let Some(deps) = self.dependency_graph.get(&current) {
                for dep in deps {
                    if !visited.contains(dep) {
                        dependents.push(dep.clone());
                        to_visit.push(dep.clone());
                    }
                }
            }
        }

        dependents
    }

    pub fn recalculate_dependents(&mut self, cell_ref: &str, formulas: &HashMap<String, String>) -> Vec<(String, FormulaResult)> {
        let dependents = self.get_dependent_cells(cell_ref);
        let mut results = Vec::new();

        for dependent in dependents {
            if let Some(formula) = formulas.get(&dependent) {
                let result = self.update_formula_cell(&dependent, formula);
                results.push((dependent.clone(), result));
            }
        }

        results
    }
}

// Tauri commands
#[command]
pub fn evaluate_formula(formula: String, cell_data: HashMap<String, String>) -> FormulaResult {
    let mut engine = FormulaEngine::new();
    
    // Load cell data into the evaluator
    for (cell_ref, value) in cell_data {
        let formula_value = if let Ok(num) = value.parse::<f64>() {
            FormulaValue::Number(num)
        } else if value.to_lowercase() == "true" {
            FormulaValue::Boolean(true)
        } else if value.to_lowercase() == "false" {
            FormulaValue::Boolean(false)
        } else {
            FormulaValue::Text(value)
        };
        
        engine.evaluator.set_cell_value(&cell_ref.to_uppercase(), formula_value);
    }
    
    // Remove leading '=' if present
    let formula = if formula.starts_with('=') {
        &formula[1..]
    } else {
        &formula
    };
    
    let mut parser = FormulaParser::new();
    match parser.parse(formula) {
        Ok(expr) => {
            let dependencies = engine.evaluator.get_cell_references(&expr);
            let result = engine.evaluator.evaluate(&expr);
            
            let formula_type = match result {
                FormulaValue::Number(_) => "number",
                FormulaValue::Text(_) => "text",
                FormulaValue::Boolean(_) => "boolean",
                FormulaValue::Error(_) => "error",
                FormulaValue::Array(_) => "array",
            FormulaValue::Date(_) => "date",
            };
            
            match result {
                FormulaValue::Error(e) => FormulaResult {
                    success: false,
                    value: "#ERROR".to_string(),
                    error: Some(e),
                    dependencies,
                    formula_type: "error".to_string(),
                },
                _ => FormulaResult {
                    success: true,
                    value: result.to_string(),
                    error: None,
                    dependencies,
                    formula_type: formula_type.to_string(),
                },
            }
        }
        Err(e) => FormulaResult {
            success: false,
            value: "#ERROR".to_string(),
            error: Some(e),
            dependencies: vec![],
            formula_type: "error".to_string(),
        },
    }
}

#[command]
pub fn update_spreadsheet_cell(
    cell_ref: String,
    value: String,
    is_formula: bool,
    spreadsheet_data: SpreadsheetData,
) -> Result<(FormulaResult, Vec<(String, FormulaResult)>), String> {
    let mut engine = FormulaEngine::new();
    let mut formulas = HashMap::new();
    
    // Load existing cell data
    for (cell_ref, cell_data) in &spreadsheet_data.cells {
        let formula_value = if let Some(computed) = &cell_data.computed_value {
            if let Ok(num) = computed.parse::<f64>() {
                FormulaValue::Number(num)
            } else if computed.to_lowercase() == "true" {
                FormulaValue::Boolean(true)
            } else if computed.to_lowercase() == "false" {
                FormulaValue::Boolean(false)
            } else {
                FormulaValue::Text(computed.clone())
            }
        } else if let Ok(num) = cell_data.value.parse::<f64>() {
            FormulaValue::Number(num)
        } else {
            FormulaValue::Text(cell_data.value.clone())
        };
        
        engine.evaluator.set_cell_value(&cell_ref.to_uppercase(), formula_value);
        
        // Store formulas for recalculation
        if let Some(formula) = &cell_data.formula {
            formulas.insert(cell_ref.to_uppercase(), formula.clone());
        }
    }
    
    // Update the specific cell
    let result = engine.update_cell(&cell_ref, &value, is_formula);
    
    // Store the new formula if it's a formula
    if is_formula {
        formulas.insert(cell_ref.to_uppercase(), value);
    }
    
    // Recalculate dependent cells
    let dependent_results = engine.recalculate_dependents(&cell_ref.to_uppercase(), &formulas);
    
    Ok((result, dependent_results))
}

#[command]
pub fn validate_formula(formula: String) -> FormulaResult {
    let formula = if formula.starts_with('=') {
        &formula[1..]
    } else {
        &formula
    };
    
    let mut parser = FormulaParser::new();
    match parser.parse(formula) {
        Ok(expr) => {
            let evaluator = FormulaEvaluator::new();
            let dependencies = evaluator.get_cell_references(&expr);
            
            FormulaResult {
                success: true,
                value: "Valid formula".to_string(),
                error: None,
                dependencies,
                formula_type: "validation".to_string(),
            }
        }
        Err(e) => FormulaResult {
            success: false,
            value: "#ERROR".to_string(),
            error: Some(e),
            dependencies: vec![],
            formula_type: "error".to_string(),
        },
    }
}

#[command]
pub fn get_formula_suggestions(partial_formula: String) -> Vec<FormulaSuggestion> {
    let functions = get_all_formula_functions();
    let partial = partial_formula.to_uppercase();
    let mut suggestions = Vec::new();
    
    for func in functions {
        if func.name.starts_with(&partial) {
            suggestions.push(FormulaSuggestion {
                function_name: func.name.clone(),
                display_text: format!("{}()", func.name),
                description: func.description.clone(),
                insert_text: format!("{}()", func.name),
            });
        }
    }
    
    suggestions.sort_by(|a, b| a.function_name.cmp(&b.function_name));
    suggestions
}

#[command]
pub fn get_all_formula_functions() -> Vec<FormulaFunction> {
    vec![
        // Funções matemáticas
        FormulaFunction {
            name: "SUM".to_string(),
            description: "Soma todos os números em um intervalo de células".to_string(),
            syntax: "SUM(number1, [number2], ...)".to_string(),
            example: "SUM(A1:A10)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "AVERAGE".to_string(),
            description: "Calcula a média aritmética dos números".to_string(),
            syntax: "AVERAGE(number1, [number2], ...)".to_string(),
            example: "AVERAGE(A1:A10)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "COUNT".to_string(),
            description: "Conta o número de células que contêm números".to_string(),
            syntax: "COUNT(value1, [value2], ...)".to_string(),
            example: "COUNT(A1:A10)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "COUNTA".to_string(),
            description: "Conta o número de células não vazias".to_string(),
            syntax: "COUNTA(value1, [value2], ...)".to_string(),
            example: "COUNTA(A1:A10)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "MAX".to_string(),
            description: "Retorna o maior valor em um conjunto de valores".to_string(),
            syntax: "MAX(number1, [number2], ...)".to_string(),
            example: "MAX(A1:A10)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "MIN".to_string(),
            description: "Retorna o menor valor em um conjunto de valores".to_string(),
            syntax: "MIN(number1, [number2], ...)".to_string(),
            example: "MIN(A1:A10)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "ROUND".to_string(),
            description: "Arredonda um número para um número especificado de dígitos".to_string(),
            syntax: "ROUND(number, num_digits)".to_string(),
            example: "ROUND(3.14159, 2)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "ABS".to_string(),
            description: "Retorna o valor absoluto de um número".to_string(),
            syntax: "ABS(number)".to_string(),
            example: "ABS(-5)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "SQRT".to_string(),
            description: "Retorna a raiz quadrada de um número".to_string(),
            syntax: "SQRT(number)".to_string(),
            example: "SQRT(16)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "POWER".to_string(),
            description: "Retorna o resultado de um número elevado a uma potência".to_string(),
            syntax: "POWER(number, power)".to_string(),
            example: "POWER(2, 3)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "MOD".to_string(),
            description: "Retorna o resto da divisão".to_string(),
            syntax: "MOD(number, divisor)".to_string(),
            example: "MOD(10, 3)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "INT".to_string(),
            description: "Arredonda um número para baixo até o inteiro mais próximo".to_string(),
            syntax: "INT(number)".to_string(),
            example: "INT(8.9)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "CEILING".to_string(),
            description: "Arredonda um número para cima".to_string(),
            syntax: "CEILING(number)".to_string(),
            example: "CEILING(4.2)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "FLOOR".to_string(),
            description: "Arredonda um número para baixo".to_string(),
            syntax: "FLOOR(number)".to_string(),
            example: "FLOOR(4.9)".to_string(),
            category: "Matemática".to_string(),
        },
        FormulaFunction {
            name: "MEDIAN".to_string(),
            description: "Retorna a mediana dos números dados".to_string(),
            syntax: "MEDIAN(number1, [number2], ...)".to_string(),
            example: "MEDIAN(A1:A10)".to_string(),
            category: "Estatística".to_string(),
        },

        // Funções lógicas
        FormulaFunction {
            name: "IF".to_string(),
            description: "Retorna um valor se a condição for verdadeira e outro se for falsa".to_string(),
            syntax: "IF(logical_test, value_if_true, [value_if_false])".to_string(),
            example: "IF(A1>10, \"Alto\", \"Baixo\")".to_string(),
            category: "Lógica".to_string(),
        },
        FormulaFunction {
            name: "AND".to_string(),
            description: "Retorna TRUE se todos os argumentos forem verdadeiros".to_string(),
            syntax: "AND(logical1, [logical2], ...)".to_string(),
            example: "AND(A1>5, B1<10)".to_string(),
            category: "Lógica".to_string(),
        },
        FormulaFunction {
            name: "OR".to_string(),
            description: "Retorna TRUE se qualquer argumento for verdadeiro".to_string(),
            syntax: "OR(logical1, [logical2], ...)".to_string(),
            example: "OR(A1>5, B1<10)".to_string(),
            category: "Lógica".to_string(),
        },
        FormulaFunction {
            name: "NOT".to_string(),
            description: "Inverte o valor lógico do argumento".to_string(),
            syntax: "NOT(logical)".to_string(),
            example: "NOT(A1>5)".to_string(),
            category: "Lógica".to_string(),
        },
        FormulaFunction {
            name: "TRUE".to_string(),
            description: "Retorna o valor lógico TRUE".to_string(),
            syntax: "TRUE()".to_string(),
            example: "TRUE()".to_string(),
            category: "Lógica".to_string(),
        },
        FormulaFunction {
            name: "FALSE".to_string(),
            description: "Retorna o valor lógico FALSE".to_string(),
            syntax: "FALSE()".to_string(),
            example: "FALSE()".to_string(),
            category: "Lógica".to_string(),
        },

        // Funções de texto
        FormulaFunction {
            name: "CONCATENATE".to_string(),
            description: "Une várias strings de texto em uma única string".to_string(),
            syntax: "CONCATENATE(text1, [text2], ...)".to_string(),
            example: "CONCATENATE(A1, \" \", B1)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "LEN".to_string(),
            description: "Retorna o número de caracteres em uma string de texto".to_string(),
            syntax: "LEN(text)".to_string(),
            example: "LEN(A1)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "UPPER".to_string(),
            description: "Converte texto para maiúsculas".to_string(),
            syntax: "UPPER(text)".to_string(),
            example: "UPPER(A1)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "LOWER".to_string(),
            description: "Converte texto para minúsculas".to_string(),
            syntax: "LOWER(text)".to_string(),
            example: "LOWER(A1)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "TRIM".to_string(),
            description: "Remove espaços extras do texto".to_string(),
            syntax: "TRIM(text)".to_string(),
            example: "TRIM(A1)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "LEFT".to_string(),
            description: "Retorna os caracteres mais à esquerda de uma string".to_string(),
            syntax: "LEFT(text, [num_chars])".to_string(),
            example: "LEFT(A1, 3)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "RIGHT".to_string(),
            description: "Retorna os caracteres mais à direita de uma string".to_string(),
            syntax: "RIGHT(text, [num_chars])".to_string(),
            example: "RIGHT(A1, 3)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "MID".to_string(),
            description: "Retorna caracteres do meio de uma string".to_string(),
            syntax: "MID(text, start_num, num_chars)".to_string(),
            example: "MID(A1, 2, 3)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "FIND".to_string(),
            description: "Localiza uma string dentro de outra string".to_string(),
            syntax: "FIND(find_text, within_text, [start_num])".to_string(),
            example: "FIND(\"abc\", A1)".to_string(),
            category: "Texto".to_string(),
        },
        FormulaFunction {
            name: "SUBSTITUTE".to_string(),
            description: "Substitui texto em uma string".to_string(),
            syntax: "SUBSTITUTE(text, old_text, new_text, [instance_num])".to_string(),
            example: "SUBSTITUTE(A1, \"old\", \"new\")".to_string(),
            category: "Texto".to_string(),
        },

        // Funções de data e hora
        FormulaFunction {
            name: "NOW".to_string(),
            description: "Retorna a data e hora atuais".to_string(),
            syntax: "NOW()".to_string(),
            example: "NOW()".to_string(),
            category: "Data e Hora".to_string(),
        },
        FormulaFunction {
            name: "TODAY".to_string(),
            description: "Retorna a data atual".to_string(),
            syntax: "TODAY()".to_string(),
            example: "TODAY()".to_string(),
            category: "Data e Hora".to_string(),
        },
        FormulaFunction {
            name: "YEAR".to_string(),
            description: "Retorna o ano de uma data".to_string(),
            syntax: "YEAR(serial_number)".to_string(),
            example: "YEAR(TODAY())".to_string(),
            category: "Data e Hora".to_string(),
        },
        FormulaFunction {
            name: "MONTH".to_string(),
            description: "Retorna o mês de uma data".to_string(),
            syntax: "MONTH(serial_number)".to_string(),
            example: "MONTH(TODAY())".to_string(),
            category: "Data e Hora".to_string(),
        },
        FormulaFunction {
            name: "DAY".to_string(),
            description: "Retorna o dia de uma data".to_string(),
            syntax: "DAY(serial_number)".to_string(),
            example: "DAY(TODAY())".to_string(),
            category: "Data e Hora".to_string(),
        },
    ]
}

#[command]
pub fn parse_cell_range(range: String) -> Result<Vec<String>, String> {
    if range.contains(':') {
        let parts: Vec<&str> = range.split(':').collect();
        if parts.len() != 2 {
            return Err("Invalid range format".to_string());
        }
        
        let start_ref = parts[0].trim();
        let end_ref = parts[1].trim();
        
        let start_pos = parse_cell_reference(start_ref)
            .ok_or("Invalid start cell reference")?;
        let end_pos = parse_cell_reference(end_ref)
            .ok_or("Invalid end cell reference")?;
        
        let mut cells = Vec::new();
        
        let min_row = start_pos.0.min(end_pos.0);
        let max_row = start_pos.0.max(end_pos.0);
        let min_col = start_pos.1.min(end_pos.1);
        let max_col = start_pos.1.max(end_pos.1);
        
        for row in min_row..=max_row {
            for col in min_col..=max_col {
                cells.push(cell_reference_to_string(row, col));
            }
        }
        
        Ok(cells)
    } else {
        // Single cell
        if parse_cell_reference(&range).is_some() {
            Ok(vec![range.to_uppercase()])
        } else {
            Err("Invalid cell reference".to_string())
        }
    }
}

#[command]
pub fn calculate_range_sum(range: String, cell_data: HashMap<String, String>) -> FormulaResult {
    match parse_cell_range(range) {
        Ok(cells) => {
            let mut sum = 0.0;
            let mut error_cells = Vec::new();
            
            for cell_ref in &cells {
                if let Some(value) = cell_data.get(cell_ref) {
                    if let Ok(num) = value.parse::<f64>() {
                        sum += num;
                    } else if !value.is_empty() {
                        error_cells.push(cell_ref.clone());
                    }
                }
            }
            
            if !error_cells.is_empty() {
                FormulaResult {
                    success: false,
                    value: "#ERROR".to_string(),
                    error: Some(format!("Non-numeric values in cells: {}", error_cells.join(", "))),
                    dependencies: cells,
                    formula_type: "error".to_string(),
                }
            } else {
                FormulaResult {
                    success: true,
                    value: sum.to_string(),
                    error: None,
                    dependencies: cells,
                    formula_type: "number".to_string(),
                }
            }
        }
        Err(e) => FormulaResult {
            success: false,
            value: "#ERROR".to_string(),
            error: Some(e),
            dependencies: vec![],
            formula_type: "error".to_string(),
        },
    }
}

#[command]
pub fn get_cell_dependencies(cell_ref: String, spreadsheet_data: SpreadsheetData) -> Vec<String> {
    if let Some(cell_data) = spreadsheet_data.cells.get(&cell_ref.to_uppercase()) {
        if let Some(formula) = &cell_data.formula {
            let formula = if formula.starts_with('=') {
                &formula[1..]
            } else {
                formula
            };
            
            let mut parser = FormulaParser::new();
            if let Ok(expr) = parser.parse(formula) {
                let evaluator = FormulaEvaluator::new();
                return evaluator.get_cell_references(&expr);
            }
        }
    }
    
    vec![]
}

#[command]
pub fn format_formula_result(value: String, format_type: String) -> String {
    match format_type.as_str() {
        "currency" => {
            if let Ok(num) = value.parse::<f64>() {
                format!("R$ {:.2}", num)
            } else {
                value
            }
        }
        "percentage" => {
            if let Ok(num) = value.parse::<f64>() {
                format!("{:.2}%", num * 100.0)
            } else {
                value
            }
        }
        "decimal_2" => {
            if let Ok(num) = value.parse::<f64>() {
                format!("{:.2}", num)
            } else {
                value
            }
        }
        "decimal_4" => {
            if let Ok(num) = value.parse::<f64>() {
                format!("{:.4}", num)
            } else {
                value
            }
        }
        "scientific" => {
            if let Ok(num) = value.parse::<f64>() {
                format!("{:.2e}", num)
            } else {
                value
            }
        }
        _ => value,
    }
}

#[command]
pub fn get_formula_categories() -> Vec<String> {
    vec![
        "Matemática".to_string(),
        "Lógica".to_string(),
        "Texto".to_string(),
        "Data e Hora".to_string(),
        "Estatística".to_string(),
        "Lookup".to_string(),
    ]
}

#[command]
pub fn get_functions_by_category(category: String) -> Vec<FormulaFunction> {
    let all_functions = get_all_formula_functions();
    all_functions.into_iter()
        .filter(|f| f.category == category)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_formula_engine_basic() {
        let mut engine = FormulaEngine::new();
        
        // Set some values
        let result1 = engine.update_cell("A1", "10", false);
        assert!(result1.success);
        
        let result2 = engine.update_cell("B1", "20", false);
        assert!(result2.success);
        
        // Test formula
        let result3 = engine.update_cell("C1", "=A1+B1", true);
        assert!(result3.success);
        assert_eq!(result3.value, "30");
    }

    #[test]
    fn test_circular_reference_detection() {
        let mut engine = FormulaEngine::new();
        
        let result1 = engine.update_cell("A1", "=B1", true);
        assert!(result1.success);
        
        let result2 = engine.update_cell("B1", "=A1", true);
        assert!(!result2.success);
        assert!(result2.error.unwrap().contains("Circular reference"));
    }

    #[test]
    fn test_parse_cell_range() {
        let result = parse_cell_range("A1:B2".to_string()).unwrap();
        assert_eq!(result, vec!["A1", "A2", "B1", "B2"]);
        
        let result = parse_cell_range("C3".to_string()).unwrap();
        assert_eq!(result, vec!["C3"]);
    }

    #[test]
    fn test_formula_suggestions() {
        let suggestions = get_formula_suggestions("SU".to_string());
        assert!(suggestions.iter().any(|s| s.function_name == "SUM"));
    }

    #[test]
    fn test_formula_validation() {
        let result = validate_formula("=SUM(A1:A10)".to_string());
        assert!(result.success);
        
        let result = validate_formula("=INVALID_FUNCTION()".to_string());
        assert!(!result.success);
    }
}