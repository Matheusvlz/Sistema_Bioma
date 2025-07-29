use std::collections::HashMap;
use std::fmt;
use serde::{Deserialize, Serialize};
use chrono::prelude::*;
use chrono::Duration;

// Helper function to convert Excel serial date to DateTime
fn excel_date_to_datetime(excel_date: f64) -> NaiveDateTime {
    // Excel's epoch is 1900-01-01. Rust's chrono uses 1970-01-01 as epoch.
    // There are 25569 days between 1900-01-01 and 1970-01-01 (excluding 1900-02-29 bug).
    // Excel treats 1900 as a leap year, but it's not. So, for dates after Feb 28, 1900,
    // we need to subtract one day from Excel's serial number.
    let mut days = excel_date as i64;
    if days > 60 { // After Feb 28, 1900
        days -= 1;
    }
    let seconds_in_day = 86400.0;
    let total_seconds = (days as f64 * seconds_in_day) + (excel_date.fract() * seconds_in_day);

    let naive_date = NaiveDate::from_ymd_opt(1899, 12, 30).unwrap();
    let naive_datetime = NaiveDateTime::new(naive_date, NaiveTime::from_hms_opt(0, 0, 0).unwrap());
    naive_datetime + Duration::seconds(total_seconds as i64)
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum FormulaValue {
    Number(f64),
    Text(String),
    Boolean(bool),
    Error(String),
    Array(Vec<FormulaValue>),
    Date(f64),
}

impl fmt::Display for FormulaValue {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            FormulaValue::Number(n) => {
                // Format the number to a string first, then trim
                let formatted = format!("{:.6}", n);
                let trimmed = formatted.trim_end_matches('0').trim_end_matches('.');
                write!(f, "{}", trimmed)
            },
            FormulaValue::Text(s) => write!(f, "{}", s),
            FormulaValue::Boolean(b) => write!(f, "{}", if *b { "TRUE" } else { "FALSE" }),
            FormulaValue::Error(e) => write!(f, "#ERROR: {}", e),
            FormulaValue::Array(arr) => {
                let values: Vec<String> = arr.iter().map(|v| v.to_string()).collect();
                write!(f, "[{}]", values.join(", "))
            }
            FormulaValue::Date(excel_date) => {
                // Convert Excel serial date to a readable date string
                let date = excel_date_to_datetime(*excel_date);
                write!(f, "{}", date.format("%d/%m/%Y").to_string())
            }
        }
    }
}

impl FormulaValue {
    pub fn to_number(&self) -> Result<f64, String> {
        match self {
            FormulaValue::Number(n) => Ok(*n),
            FormulaValue::Text(s) => {
                s.parse::<f64>().map_err(|_| format!("Cannot convert '{}' to number", s))
            },
            FormulaValue::Boolean(b) => Ok(if *b { 1.0 } else { 0.0 }),
            FormulaValue::Error(e) => Err(e.clone()),
            FormulaValue::Array(_) => Err("Cannot convert array to number".to_string()),
               FormulaValue::Date(date_value) => Ok(*date_value),
        }
    }

    pub fn to_text(&self) -> String {
        match self {
            FormulaValue::Text(s) => s.clone(),
            _ => self.to_string(),
        }
    }

    pub fn to_boolean(&self) -> bool {
        match self {
            FormulaValue::Boolean(b) => *b,
            FormulaValue::Number(n) => *n != 0.0,
            FormulaValue::Text(s) => !s.is_empty(),
            FormulaValue::Error(_) => false,
            FormulaValue::Array(arr) => !arr.is_empty(),
             FormulaValue::Date(date_value) => *date_value != 0.0,
        }
    }

    pub fn is_error(&self) -> bool {
        matches!(self, FormulaValue::Error(_))
    }

    pub fn is_number(&self) -> bool {
        matches!(self, FormulaValue::Number(_))
    }

    pub fn is_date(&self) -> bool {
        matches!(self, FormulaValue::Date(_))
    }}

#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Number(f64),
    Text(String),
    CellRef(String),
    Range(String, String),
    Function(String),
    Operator(char),
    LeftParen,
    RightParen,
    Comma,
    Colon,
    Semicolon,
    Dollar, // Para referências absolutas como $A$1
}

#[derive(Debug, Clone)]
pub enum Expr {
    Value(FormulaValue),
    CellRef(String),
    Range(String, String),
    BinaryOp {
        left: Box<Expr>,
        op: char,
        right: Box<Expr>,
    },
    UnaryOp {
        op: char,
        operand: Box<Expr>,
    },
    Function {
        name: String,
        args: Vec<Expr>,
    },
    Array(Vec<Expr>),
}

pub struct FormulaParser {
    tokens: Vec<Token>,
    position: usize,
}

impl FormulaParser {
    pub fn new() -> Self {
        Self {
            tokens: Vec::new(),
            position: 0,
        }
    }

    pub fn parse(&mut self, formula: &str) -> Result<Expr, String> {
        self.tokens = self.tokenize(formula)?;
        self.position = 0;
        self.parse_expression()
    }

    fn tokenize(&self, formula: &str) -> Result<Vec<Token>, String> {
        let mut tokens = Vec::new();
        let mut chars = formula.chars().peekable();
        
        while let Some(&ch) = chars.peek() {
            match ch {
                ' ' | '\t' | '\r' | '\n' => {
                    chars.next();
                }
                '(' => {
                    tokens.push(Token::LeftParen);
                    chars.next();
                }
                ')' => {
                    tokens.push(Token::RightParen);
                    chars.next();
                }
                ',' => {
                    tokens.push(Token::Comma);
                    chars.next();
                }
                ':' => {
                    tokens.push(Token::Colon);
                    chars.next();
                }
                ';' => {
                    tokens.push(Token::Semicolon);
                    chars.next();
                }
                '$' => {
                    tokens.push(Token::Dollar);
                    chars.next();
                }
                '+' | '-' | '*' | '/' | '^' | '=' | '<' | '>' | '&' => {
                    let mut op = ch;
                    chars.next();
                    
                    // Verificar operadores compostos
                    if let Some(&next_ch) = chars.peek() {
                        match (ch, next_ch) {
                            ('<', '=') | ('>', '=') | ('<', '>') => {
                                chars.next();
                                // Para operadores compostos, usar um caractere especial
                                op = match (ch, next_ch) {
                                    ('<', '=') => '≤',
                                    ('>', '=') => '≥',
                                    ('<', '>') => '≠',
                                    _ => op,
                                };
                            }
                            _ => {}
                        }
                    }
                    
                    tokens.push(Token::Operator(op));
                }
                '"' => {
                    chars.next(); // Skip opening quote
                    let mut text = String::new();
                    let mut escaped = false;
                    
                    while let Some(ch) = chars.next() {
                        if escaped {
                            text.push(ch);
                            escaped = false;
                        } else if ch == '\\' {
                            escaped = true;
                        } else if ch == '"' {
                            break;
                        } else {
                            text.push(ch);
                        }
                    }
                    tokens.push(Token::Text(text));
                }
                '\'' => {
                    chars.next(); // Skip opening quote
                    let mut text = String::new();
                    while let Some(ch) = chars.next() {
                        if ch == '\'' {
                            break;
                        }
                        text.push(ch);
                    }
                    tokens.push(Token::Text(text));
                }
                '0'..='9' | '.' => {
                    let mut number = String::new();
                    let mut has_dot = false;
                    
                    while let Some(&ch) = chars.peek() {
                        if ch.is_ascii_digit() {
                            number.push(ch);
                            chars.next();
                        } else if ch == '.' && !has_dot {
                            has_dot = true;
                            number.push(ch);
                            chars.next();
                        } else if ch == 'E' || ch == 'e' {
                            // Notação científica
                            number.push(ch);
                            chars.next();
                            if let Some(&next_ch) = chars.peek() {
                                if next_ch == '+' || next_ch == '-' {
                                    number.push(next_ch);
                                    chars.next();
                                }
                            }
                        } else {
                            break;
                        }
                    }
                    
                    let num = number.parse::<f64>()
                        .map_err(|_| format!("Invalid number: {}", number))?;
                    tokens.push(Token::Number(num));
                }
                'A'..='Z' | 'a'..='z' | '_' => {
                    let mut identifier = String::new();
                    
                    // Verificar se começa com $
                    let mut absolute_col = false;
                    if !tokens.is_empty() {
                        if let Some(Token::Dollar) = tokens.last() {
                            absolute_col = true;
                        }
                    }
                    
                    while let Some(&ch) = chars.peek() {
                        if ch.is_alphanumeric() || ch == '_' {
                            identifier.push(ch);
                            chars.next();
                        } else {
                            break;
                        }
                    }
                    
                    // Verificar se é seguido por número (referência de célula)
                    if let Some(&next_ch) = chars.peek() {
                        if next_ch.is_ascii_digit() || next_ch == '$' {
                           let mut cell_ref = identifier.clone();
                            
                            // Verificar $
                            let mut absolute_row = false;
                            if next_ch == '$' {
                                absolute_row = true;
                                chars.next();
                            }
                            
                            // Ler números
                            while let Some(&ch) = chars.peek() {
                                if ch.is_ascii_digit() {
                                    cell_ref.push(ch);
                                    chars.next();
                                } else {
                                    break;
                                }
                            }
                            
                            // Adicionar prefixos $ se necessário
                            if absolute_col || absolute_row {
                                let mut abs_ref = String::new();
                                if absolute_col {
                                    abs_ref.push('$');
                                }
                                abs_ref.push_str(&identifier);
                                if absolute_row {
                                    abs_ref.push('$');
                                }
                                abs_ref.push_str(&cell_ref[identifier.len()..]);
                                cell_ref = abs_ref;
                            }
                            
                            tokens.push(Token::CellRef(cell_ref));
                        } else if next_ch == '(' {
                            // É uma função
                            tokens.push(Token::Function(identifier));
                        } else {
                            // É um nome/identificador
                            tokens.push(Token::CellRef(identifier));
                        }
                    } else {
                        tokens.push(Token::CellRef(identifier));
                    }
                }
                _ => {
                    return Err(format!("Unexpected character: {}", ch));
                }
            }
        }
        
        Ok(tokens)
    }

    fn parse_expression(&mut self) -> Result<Expr, String> {
        self.parse_comparison()
    }

    fn parse_comparison(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_concatenation()?;
        
        while self.position < self.tokens.len() {
            let op = if let Token::Operator(op) = &self.tokens[self.position] {
                if matches!(*op, '=' | '<' | '>' | '≤' | '≥' | '≠') {
                    let op_char = *op;
                    self.position += 1;
                    op_char
                } else {
                    break;
                }
            } else {
                break;
            };
            
            let right = self.parse_concatenation()?;
            left = Expr::BinaryOp {
                left: Box::new(left),
                op,
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    fn parse_concatenation(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_addition()?;
        
        while self.position < self.tokens.len() {
            let op = if let Token::Operator(op) = &self.tokens[self.position] {
                if *op == '&' {
                    let op_char = *op;
                    self.position += 1;
                    op_char
                } else {
                    break;
                }
            } else {
                break;
            };
            
            let right = self.parse_addition()?;
            left = Expr::BinaryOp {
                left: Box::new(left),
                op,
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    fn parse_addition(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_multiplication()?;
        
        while self.position < self.tokens.len() {
            let op = if let Token::Operator(op) = &self.tokens[self.position] {
                if *op == '+' || *op == '-' {
                    let op_char = *op;
                    self.position += 1;
                    op_char
                } else {
                    break;
                }
            } else {
                break;
            };
            
            let right = self.parse_multiplication()?;
            left = Expr::BinaryOp {
                left: Box::new(left),
                op,
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    fn parse_multiplication(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_power()?;
        
        while self.position < self.tokens.len() {
            let op = if let Token::Operator(op) = &self.tokens[self.position] {
                if *op == '*' || *op == '/' {
                    let op_char = *op;
                    self.position += 1;
                    op_char
                } else {
                    break;
                }
            } else {
                break;
            };
            
            let right = self.parse_power()?;
            left = Expr::BinaryOp {
                left: Box::new(left),
                op,
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    fn parse_power(&mut self) -> Result<Expr, String> {
        let mut left = self.parse_unary()?;
        
        while self.position < self.tokens.len() {
            let op = if let Token::Operator(op) = &self.tokens[self.position] {
                if *op == '^' {
                    let op_char = *op;
                    self.position += 1;
                    op_char
                } else {
                    break;
                }
            } else {
                break;
            };
            
            let right = self.parse_unary()?;
            left = Expr::BinaryOp {
                left: Box::new(left),
                op,
                right: Box::new(right),
            };
        }
        
        Ok(left)
    }

    fn parse_unary(&mut self) -> Result<Expr, String> {
        if self.position < self.tokens.len() {
            if let Token::Operator(op) = &self.tokens[self.position] {
                if *op == '+' || *op == '-' {
                    let op_char = *op;
                    self.position += 1;
                    let operand = self.parse_primary()?;
                    return Ok(Expr::UnaryOp {
                        op: op_char,
                        operand: Box::new(operand),
                    });
                }
            }
        }
        
        self.parse_primary()
    }
    
    fn parse_primary(&mut self) -> Result<Expr, String> {
        if self.position >= self.tokens.len() {
            return Err("Digite a fórmula na barra a cima".to_string());
        }
        
        match &self.tokens[self.position].clone() {
            Token::Number(n) => {
                self.position += 1;
                Ok(Expr::Value(FormulaValue::Number(*n)))
            }
            Token::Text(s) => {
                self.position += 1;
                Ok(Expr::Value(FormulaValue::Text(s.clone())))
            }
            Token::CellRef(cell) => {
                self.position += 1;
                
                // Verificar se é parte de um range
                if self.position < self.tokens.len() {
                    if let Token::Colon = &self.tokens[self.position] {
                        self.position += 1;
                        if self.position < self.tokens.len() {
                            if let Token::CellRef(end_cell) = &self.tokens[self.position] {
                                self.position += 1;
                                return Ok(Expr::Range(cell.clone(), end_cell.clone()));
                            }
                        }
                        return Err("Expected cell reference after ':'".to_string());
                    }
                }
                
                Ok(Expr::CellRef(cell.clone()))
            }
            Token::Function(name) => {
                let func_name = name.clone();
                self.position += 1;
                
                if self.position >= self.tokens.len() || self.tokens[self.position] != Token::LeftParen {
                    return Err("Expected '(' after function name".to_string());
                }
                self.position += 1;
                
                let mut args = Vec::new();
                
                if self.position < self.tokens.len() && self.tokens[self.position] != Token::RightParen {
                    loop {
                        args.push(self.parse_expression()?);
                        
                        if self.position >= self.tokens.len() {
                            return Err("Expected ')' or ','".to_string());
                        }
                        
                        match &self.tokens[self.position] {
                            Token::Comma | Token::Semicolon => {
                                self.position += 1;
                            }
                            Token::RightParen => {
                                break;
                            }
                            _ => {
                                return Err("Expected ')' or ','".to_string());
                            }
                        }
                    }
                }
                
                if self.position >= self.tokens.len() || self.tokens[self.position] != Token::RightParen {
                    return Err("Expected ')'".to_string());
                }
                self.position += 1;
                
                Ok(Expr::Function {
                    name: func_name,
                    args,
                })
            }
            Token::LeftParen => {
                self.position += 1;
                let expr = self.parse_expression()?;
                
                if self.position >= self.tokens.len() || self.tokens[self.position] != Token::RightParen {
                    return Err("Expected ')'".to_string());
                }
                self.position += 1;
                
                Ok(expr)
            }
            _ => {
                Err(format!("Unexpected token: {:?}", self.tokens[self.position]))
            }
        }
    }
}

pub struct FormulaEvaluator {
    cell_data: HashMap<String, FormulaValue>,
}

impl FormulaEvaluator {
    pub fn new() -> Self {
        Self {
            cell_data: HashMap::new(),
        }
    }

    pub fn set_cell_value(&mut self, cell_ref: &str, value: FormulaValue) {
        self.cell_data.insert(cell_ref.to_uppercase(), value);
    }

    pub fn evaluate(&self, expr: &Expr) -> FormulaValue {
        match expr {
            Expr::Value(val) => val.clone(),
            Expr::CellRef(cell_ref) => {
                self.cell_data.get(&cell_ref.to_uppercase())
                    .cloned()
                    .unwrap_or(FormulaValue::Number(0.0))
            }
            Expr::Range(start, end) => {
                // Para ranges, retornar um array de valores
                let cells = self.expand_range(start, end);
                let values: Vec<FormulaValue> = cells.iter()
                    .map(|cell| self.cell_data.get(cell).cloned().unwrap_or(FormulaValue::Number(0.0)))
                    .collect();
                FormulaValue::Array(values)
            }
            Expr::BinaryOp { left, op, right } => {
                let left_val = self.evaluate(left);
                let right_val = self.evaluate(right);
                self.evaluate_binary_op(&left_val, *op, &right_val)
            }
            Expr::UnaryOp { op, operand } => {
                let val = self.evaluate(operand);
                self.evaluate_unary_op(*op, &val)
            }
            Expr::Function { name, args } => {
                self.evaluate_function(name, args)
            }
            Expr::Array(exprs) => {
                let values: Vec<FormulaValue> = exprs.iter()
                    .map(|expr| self.evaluate(expr))
                    .collect();
                FormulaValue::Array(values)
            }
        }
    }

    fn expand_range(&self, start: &str, end: &str) -> Vec<String> {
        let start_pos = parse_cell_reference(start);
        let end_pos = parse_cell_reference(end);
        
        if let (Some((start_row, start_col)), Some((end_row, end_col))) = (start_pos, end_pos) {
            let mut cells = Vec::new();
            
            let min_row = start_row.min(end_row);
            let max_row = start_row.max(end_row);
            let min_col = start_col.min(end_col);
            let max_col = start_col.max(end_col);
            
            for row in min_row..=max_row {
                for col in min_col..=max_col {
                    cells.push(cell_reference_to_string(row, col));
                }
            }
            
            cells
        } else {
            vec![]
        }
    }

    fn evaluate_binary_op(&self, left: &FormulaValue, op: char, right: &FormulaValue) -> FormulaValue {
        // Verificar erros primeiro
        if left.is_error() {
            return left.clone();
        }
        if right.is_error() {
            return right.clone();
        }

        match op {
            '&' => {
                // Concatenação
                FormulaValue::Text(format!("{}{}", left.to_text(), right.to_text()))
            }
            '+' | '-' | '*' | '/' | '^' => {
                // Operações matemáticas
                match (left.to_number(), right.to_number()) {
                    (Ok(a), Ok(b)) => {
                        match op {
                            '+' => FormulaValue::Number(a + b),
                            '-' => FormulaValue::Number(a - b),
                            '*' => FormulaValue::Number(a * b),
                            '/' => {
                                if b == 0.0 {
                                    FormulaValue::Error("Division by zero".to_string())
                                } else {
                                    FormulaValue::Number(a / b)
                                }
                            }
                            '^' => FormulaValue::Number(a.powf(b)),
                            _ => FormulaValue::Error(format!("Unknown operator: {}", op)),
                        }
                    }
                    (Err(e), _) | (_, Err(e)) => FormulaValue::Error(e),
                }
            }
            '=' | '<' | '>' | '≤' | '≥' | '≠' => {
                // Operações de comparação
                self.evaluate_comparison(left, op, right)
            }
            _ => FormulaValue::Error(format!("Unknown operator: {}", op)),
        }
    }

    fn evaluate_comparison(&self, left: &FormulaValue, op: char, right: &FormulaValue) -> FormulaValue {
        // Tentar comparação numérica primeiro
        if let (Ok(a), Ok(b)) = (left.to_number(), right.to_number()) {
            let result = match op {
                '=' => (a - b).abs() < f64::EPSILON,
                '<' => a < b,
                '>' => a > b,
                '≤' => a <= b,
                '≥' => a >= b,
                '≠' => (a - b).abs() >= f64::EPSILON,
                _ => false,
            };
            return FormulaValue::Boolean(result);
        }

        // Comparação de texto
        let left_text = left.to_text();
        let right_text = right.to_text();
        
        let result = match op {
            '=' => left_text == right_text,
            '<' => left_text < right_text,
            '>' => left_text > right_text,
            '≤' => left_text <= right_text,
            '≥' => left_text >= right_text,
            '≠' => left_text != right_text,
            _ => false,
        };
        
        FormulaValue::Boolean(result)
    }

    fn evaluate_unary_op(&self, op: char, operand: &FormulaValue) -> FormulaValue {
        if operand.is_error() {
            return operand.clone();
        }

        match operand.to_number() {
            Ok(n) => {
                match op {
                    '+' => FormulaValue::Number(n),
                    '-' => FormulaValue::Number(-n),
                    _ => FormulaValue::Error(format!("Unknown unary operator: {}", op)),
                }
            }
            Err(e) => FormulaValue::Error(e),
        }
    }

    fn evaluate_function(&self, name: &str, args: &[Expr]) -> FormulaValue {
        match name.to_uppercase().as_str() {
            // Funções matemáticas básicas
            "SUM" | "SOMA" => self.function_sum(args),
            "AVERAGE" | "AVG" | "DIVISAO" | "DIV" => self.function_average(args),
            "COUNT" | "CONTAR" => self.function_count(args),
            "COUNTA" => self.function_counta(args),
            "MAX" => self.function_max(args),
            "MIN" => self.function_min(args),
            "ROUND" | "AREDONDAR" => self.function_round(args),
            "ABS" => self.function_abs(args),
            "SQRT" => self.function_sqrt(args),
            "POWER" | "POW" => self.function_power(args),
            "MOD" => self.function_mod(args),
            "INT" => self.function_int(args),
            "CEILING" => self.function_ceiling(args),
            "FLOOR" => self.function_floor(args),
            
            // Funções lógicas
            "IF" | "SE" => self.function_if(args),
            "AND" | "E" => self.function_and(args),
            "OR"  | "OU" => self.function_or(args),
            "NOT" => self.function_not(args),
            "TRUE" => FormulaValue::Boolean(true),
            "FALSE" => FormulaValue::Boolean(false),
            
            // Funções de texto
            "CONCATENATE" | "CONCAT" => self.function_concatenate(args),
            "LEN" | "LENGTH" => self.function_length(args),
            "UPPER" => self.function_upper(args),
            "LOWER" => self.function_lower(args),
            "TRIM" => self.function_trim(args),
            "LEFT" => self.function_left(args),
            "RIGHT" => self.function_right(args),
            "MID" => self.function_mid(args),
            "FIND" => self.function_find(args),
            "SUBSTITUTE" => self.function_substitute(args),
            
            // Funções de data e hora
            "NOW" => self.function_now(args),
            "TODAY" => self.function_today(args),
            "YEAR" => self.function_year(args),
            "MONTH" => self.function_month(args),
            "DAY" => self.function_day(args),
            
            // Funções de lookup
            "VLOOKUP" => self.function_vlookup(args),
            "HLOOKUP" => self.function_hlookup(args),
            "INDEX" => self.function_index(args),
            "MATCH" => self.function_match(args),
            
            // Funções estatísticas
            "MEDIAN" => self.function_median(args),
            "MODE" => self.function_mode(args),
            "STDEV" => self.function_stdev(args),
            "VAR" => self.function_var(args),
            
            _ => FormulaValue::Error(format!("Unknown function: {}", name)),
        }
    }

    // Implementação das funções matemáticas
    fn function_sum(&self, args: &[Expr]) -> FormulaValue {
        let mut sum = 0.0;
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Number(n) => sum += n,
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if let Ok(n) = val.to_number() {
                            sum += n;
                        }
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => {} // Ignorar valores não numéricos
            }
        }
        FormulaValue::Number(sum)
    }

    fn function_average(&self, args: &[Expr]) -> FormulaValue {
        if args.is_empty() {
            return FormulaValue::Error("AVERAGE requires at least one argument".to_string());
        }
        
        let mut sum = 0.0;
        let mut count = 0;
        
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Number(n) => {
                    sum += n;
                    count += 1;
                }
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if let Ok(n) = val.to_number() {
                            sum += n;
                            count += 1;
                        }
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => {} // Ignorar valores não numéricos
            }
        }
        
        if count == 0 {
            FormulaValue::Error("No numeric values found".to_string())
        } else {
            FormulaValue::Number(sum / count as f64)
        }
    }

    fn function_count(&self, args: &[Expr]) -> FormulaValue {
        let mut count = 0;
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Number(_) => count += 1,
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if val.is_number() {
                            count += 1;
                        }
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => {} // Ignorar valores não numéricos
            }
        }
        FormulaValue::Number(count as f64)
    }

    fn function_counta(&self, args: &[Expr]) -> FormulaValue {
        let mut count = 0;
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if !matches!(val, FormulaValue::Text(s) if s.is_empty()) {
                            count += 1;
                        }
                    }
                }
                FormulaValue::Text(s) => {
                    if !s.is_empty() {
                        count += 1;
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => count += 1,
            }
        }
        FormulaValue::Number(count as f64)
    }

    fn function_max(&self, args: &[Expr]) -> FormulaValue {
        if args.is_empty() {
            return FormulaValue::Error("MAX requires at least one argument".to_string());
        }
        
        let mut max_val = f64::NEG_INFINITY;
        let mut found_number = false;
        
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Number(n) => {
                    if n > max_val {
                        max_val = n;
                    }
                    found_number = true;
                }
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if let Ok(n) = val.to_number() {
                            if n > max_val {
                                max_val = n;
                            }
                            found_number = true;
                        }
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => {} // Ignorar valores não numéricos
            }
        }
        
        if found_number {
            FormulaValue::Number(max_val)
        } else {
            FormulaValue::Error("No numeric values found".to_string())
        }
    }

    fn function_min(&self, args: &[Expr]) -> FormulaValue {
        if args.is_empty() {
            return FormulaValue::Error("MIN requires at least one argument".to_string());
        }
        
        let mut min_val = f64::INFINITY;
        let mut found_number = false;
        
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Number(n) => {
                    if n < min_val {
                        min_val = n;
                    }
                    found_number = true;
                }
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if let Ok(n) = val.to_number() {
                            if n < min_val {
                                min_val = n;
                            }
                            found_number = true;
                        }
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => {} // Ignorar valores não numéricos
            }
        }
        
        if found_number {
            FormulaValue::Number(min_val)
        } else {
            FormulaValue::Error("No numeric values found".to_string())
        }
    }

    // Implementação das funções lógicas
    fn function_if(&self, args: &[Expr]) -> FormulaValue {
        if args.len() < 2 || args.len() > 3 {
            return FormulaValue::Error("IF requires 2 or 3 arguments".to_string());
        }
        
        let condition = self.evaluate(&args[0]);
        let true_value = self.evaluate(&args[1]);
        let false_value = if args.len() == 3 {
            self.evaluate(&args[2])
        } else {
            FormulaValue::Boolean(false)
        };
        
        if condition.is_error() {
            return condition;
        }
        
        if condition.to_boolean() {
            true_value
        } else {
            false_value
        }
    }

    fn function_and(&self, args: &[Expr]) -> FormulaValue {
        if args.is_empty() {
            return FormulaValue::Error("AND requires at least one argument".to_string());
        }
        
        for arg in args {
            let val = self.evaluate(arg);
            if val.is_error() {
                return val;
            }
            if !val.to_boolean() {
                return FormulaValue::Boolean(false);
            }
        }
        
        FormulaValue::Boolean(true)
    }

    fn function_or(&self, args: &[Expr]) -> FormulaValue {
        if args.is_empty() {
            return FormulaValue::Error("OR requires at least one argument".to_string());
        }
        
        for arg in args {
            let val = self.evaluate(arg);
            if val.is_error() {
                return val;
            }
            if val.to_boolean() {
                return FormulaValue::Boolean(true);
            }
        }
        
        FormulaValue::Boolean(false)
    }

    fn function_not(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("NOT requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        FormulaValue::Boolean(!val.to_boolean())
    }

    // Implementação das funções de texto
    fn function_concatenate(&self, args: &[Expr]) -> FormulaValue {
        let mut result = String::new();
        for arg in args {
            let val = self.evaluate(arg);
            if val.is_error() {
                return val;
            }
            result.push_str(&val.to_text());
        }
        FormulaValue::Text(result)
    }

    fn function_length(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("LENGTH requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        FormulaValue::Number(val.to_text().len() as f64)
    }

    fn function_upper(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("UPPER requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        FormulaValue::Text(val.to_text().to_uppercase())
    }

    fn function_lower(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("LOWER requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        FormulaValue::Text(val.to_text().to_lowercase())
    }

    fn function_trim(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("TRIM requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        FormulaValue::Text(val.to_text().trim().to_string())
    }

    fn function_left(&self, args: &[Expr]) -> FormulaValue {
        if args.len() < 1 || args.len() > 2 {
            return FormulaValue::Error("LEFT requires 1 or 2 arguments".to_string());
        }
        
        let text_val = self.evaluate(&args[0]);
        if text_val.is_error() {
            return text_val;
        }
        
        let text = text_val.to_text();
        let num_chars = if args.len() == 2 {
            let num_val = self.evaluate(&args[1]);
            if num_val.is_error() {
                return num_val;
            }
            match num_val.to_number() {
                Ok(n) => n as usize,
                Err(e) => return FormulaValue::Error(e),
            }
        } else {
            1
        };
        
        let result = if num_chars >= text.len() {
            text
        } else {
            text.chars().take(num_chars).collect()
        };
        
        FormulaValue::Text(result)
    }

    fn function_right(&self, args: &[Expr]) -> FormulaValue {
        if args.len() < 1 || args.len() > 2 {
            return FormulaValue::Error("RIGHT requires 1 or 2 arguments".to_string());
        }
        
        let text_val = self.evaluate(&args[0]);
        if text_val.is_error() {
            return text_val;
        }
        
        let text = text_val.to_text();
        let num_chars = if args.len() == 2 {
            let num_val = self.evaluate(&args[1]);
            if num_val.is_error() {
                return num_val;
            }
            match num_val.to_number() {
                Ok(n) => n as usize,
                Err(e) => return FormulaValue::Error(e),
            }
        } else {
            1
        };
        
        let chars: Vec<char> = text.chars().collect();
        let start_pos = if num_chars >= chars.len() {
            0
        } else {
            chars.len() - num_chars
        };
        
        let result: String = chars[start_pos..].iter().collect();
        FormulaValue::Text(result)
    }

    fn function_mid(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 3 {
            return FormulaValue::Error("MID requires exactly 3 arguments".to_string());
        }
        
        let text_val = self.evaluate(&args[0]);
        if text_val.is_error() {
            return text_val;
        }
        
        let start_val = self.evaluate(&args[1]);
        if start_val.is_error() {
            return start_val;
        }
        
        let length_val = self.evaluate(&args[2]);
        if length_val.is_error() {
            return length_val;
        }
        
        let text = text_val.to_text();
        let start = match start_val.to_number() {
            Ok(n) => (n as usize).saturating_sub(1), // Excel usa índice baseado em 1
            Err(e) => return FormulaValue::Error(e),
        };
        let length = match length_val.to_number() {
            Ok(n) => n as usize,
            Err(e) => return FormulaValue::Error(e),
        };
        
        let chars: Vec<char> = text.chars().collect();
        let end = (start + length).min(chars.len());
        
        if start >= chars.len() {
            FormulaValue::Text(String::new())
        } else {
            let result: String = chars[start..end].iter().collect();
            FormulaValue::Text(result)
        }
    }

    fn function_find(&self, args: &[Expr]) -> FormulaValue {
        if args.len() < 2 || args.len() > 3 {
            return FormulaValue::Error("FIND requires 2 or 3 arguments".to_string());
        }
        
        let find_text_val = self.evaluate(&args[0]);
        if find_text_val.is_error() {
            return find_text_val;
        }
        
        let within_text_val = self.evaluate(&args[1]);
        if within_text_val.is_error() {
            return within_text_val;
        }
        
        let start_num = if args.len() == 3 {
            let start_val = self.evaluate(&args[2]);
            if start_val.is_error() {
                return start_val;
            }
            match start_val.to_number() {
                Ok(n) => (n as usize).saturating_sub(1),
                Err(e) => return FormulaValue::Error(e),
            }
        } else {
            0
        };
        
        let find_text = find_text_val.to_text();
        let within_text = within_text_val.to_text();
        
        if let Some(pos) = within_text[start_num..].find(&find_text) {
            FormulaValue::Number((start_num + pos + 1) as f64) // Excel usa índice baseado em 1
        } else {
            FormulaValue::Error("Text not found".to_string())
        }
    }

    fn function_substitute(&self, args: &[Expr]) -> FormulaValue {
        if args.len() < 3 || args.len() > 4 {
            return FormulaValue::Error("SUBSTITUTE requires 3 or 4 arguments".to_string());
        }
        
        let text_val = self.evaluate(&args[0]);
        if text_val.is_error() {
            return text_val;
        }
        
        let old_text_val = self.evaluate(&args[1]);
        if old_text_val.is_error() {
            return old_text_val;
        }
        
        let new_text_val = self.evaluate(&args[2]);
        if new_text_val.is_error() {
            return new_text_val;
        }
        
        let text = text_val.to_text();
        let old_text = old_text_val.to_text();
        let new_text = new_text_val.to_text();
        
        let result = if args.len() == 4 {
            let instance_val = self.evaluate(&args[3]);
            if instance_val.is_error() {
                return instance_val;
            }
            match instance_val.to_number() {
                Ok(n) => {
                    let instance = n as usize;
                    let mut result = text.clone();
                    let mut count = 0;
                    let mut start = 0;
                    
                    while let Some(pos) = result[start..].find(&old_text) {
                        count += 1;
                        if count == instance {
                            let actual_pos = start + pos;
                            result.replace_range(actual_pos..actual_pos + old_text.len(), &new_text);
                            break;
                        }
                        start += pos + old_text.len();
                    }
                    result
                }
                Err(e) => return FormulaValue::Error(e),
            }
        } else {
            text.replace(&old_text, &new_text)
        };
        
        FormulaValue::Text(result)
    }

    // Implementação das funções matemáticas adicionais
    fn function_round(&self, args: &[Expr]) -> FormulaValue {
        if args.len() < 1 || args.len() > 2 {
            return FormulaValue::Error("ROUND requires 1 or 2 arguments".to_string());
        }
        
        let number_val = self.evaluate(&args[0]);
        if number_val.is_error() {
            return number_val;
        }
        
        let number = match number_val.to_number() {
            Ok(n) => n,
            Err(e) => return FormulaValue::Error(e),
        };
        
        let digits = if args.len() == 2 {
            let digits_val = self.evaluate(&args[1]);
            if digits_val.is_error() {
                return digits_val;
            }
            match digits_val.to_number() {
                Ok(n) => n as i32,
                Err(e) => return FormulaValue::Error(e),
            }
        } else {
            0
        };
        
        let multiplier = 10.0_f64.powi(digits);
        FormulaValue::Number((number * multiplier).round() / multiplier)
    }

    fn function_abs(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("ABS requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        match val.to_number() {
            Ok(n) => FormulaValue::Number(n.abs()),
            Err(e) => FormulaValue::Error(e),
        }
    }

    fn function_sqrt(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("SQRT requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        match val.to_number() {
            Ok(n) => {
                if n < 0.0 {
                    FormulaValue::Error("SQRT of negative number".to_string())
                } else {
                    FormulaValue::Number(n.sqrt())
                }
            }
            Err(e) => FormulaValue::Error(e),
        }
    }

    fn function_power(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 2 {
            return FormulaValue::Error("POWER requires exactly two arguments".to_string());
        }
        
        let base_val = self.evaluate(&args[0]);
        if base_val.is_error() {
            return base_val;
        }
        
        let exponent_val = self.evaluate(&args[1]);
        if exponent_val.is_error() {
            return exponent_val;
        }
        
        let base = match base_val.to_number() {
            Ok(n) => n,
            Err(e) => return FormulaValue::Error(e),
        };
        
        let exponent = match exponent_val.to_number() {
            Ok(n) => n,
            Err(e) => return FormulaValue::Error(e),
        };
        
        FormulaValue::Number(base.powf(exponent))
    }

    fn function_mod(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 2 {
            return FormulaValue::Error("MOD requires exactly two arguments".to_string());
        }
        
        let number_val = self.evaluate(&args[0]);
        if number_val.is_error() {
            return number_val;
        }
        
        let divisor_val = self.evaluate(&args[1]);
        if divisor_val.is_error() {
            return divisor_val;
        }
        
        let number = match number_val.to_number() {
            Ok(n) => n,
            Err(e) => return FormulaValue::Error(e),
        };
        
        let divisor = match divisor_val.to_number() {
            Ok(n) => n,
            Err(e) => return FormulaValue::Error(e),
        };
        
        if divisor == 0.0 {
            FormulaValue::Error("Division by zero in MOD".to_string())
        } else {
            FormulaValue::Number(number % divisor)
        }
    }

    fn function_int(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("INT requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        match val.to_number() {
            Ok(n) => FormulaValue::Number(n.floor()),
            Err(e) => FormulaValue::Error(e),
        }
    }

    fn function_ceiling(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("CEILING requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        match val.to_number() {
            Ok(n) => FormulaValue::Number(n.ceil()),
            Err(e) => FormulaValue::Error(e),
        }
    }

    fn function_floor(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("FLOOR requires exactly one argument".to_string());
        }
        
        let val = self.evaluate(&args[0]);
        if val.is_error() {
            return val;
        }
        
        match val.to_number() {
            Ok(n) => FormulaValue::Number(n.floor()),
            Err(e) => FormulaValue::Error(e),
        }
    }

    // Implementação das funções de data (simplificadas)
    fn function_now(&self, _args: &[Expr]) -> FormulaValue {
        use std::time::{SystemTime, UNIX_EPOCH};
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as f64;
        // Converter para número de dias desde 1900-01-01 (formato Excel)
        let excel_epoch = 25569.0; // Dias entre 1900-01-01 e 1970-01-01
        FormulaValue::Date(excel_epoch + timestamp / 86400.0)
    }

    fn function_today(&self, _args: &[Expr]) -> FormulaValue {
        use std::time::{SystemTime, UNIX_EPOCH};
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as f64;
        let excel_epoch = 25569.0;
        let days = excel_epoch + timestamp / 86400.0;
        FormulaValue::Date(days.floor()) // Apenas a parte da data, sem hora
    }

    fn function_year(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("YEAR requires exactly one argument".to_string());
        }
        
        let date_val = self.evaluate(&args[0]);
        if date_val.is_error() {
            return date_val;
        }
        
        match date_val {
            FormulaValue::Date(excel_date) => {
                let datetime = excel_date_to_datetime(excel_date);
                FormulaValue::Number(datetime.year() as f64)
            }
            _ => FormulaValue::Error("YEAR requires a date value".to_string()),
        }
    }

    fn function_month(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("MONTH requires exactly one argument".to_string());
        }
        
        let date_val = self.evaluate(&args[0]);
        if date_val.is_error() {
            return date_val;
        }
        
        match date_val {
            FormulaValue::Date(excel_date) => {
                let datetime = excel_date_to_datetime(excel_date);
                FormulaValue::Number(datetime.month() as f64)
            }
            _ => FormulaValue::Error("MONTH requires a date value".to_string()),
        }
    }

    fn function_day(&self, args: &[Expr]) -> FormulaValue {
        if args.len() != 1 {
            return FormulaValue::Error("DAY requires exactly one argument".to_string());
        }
        
        let date_val = self.evaluate(&args[0]);
        if date_val.is_error() {
            return date_val;
        }
        
        match date_val {
            FormulaValue::Date(excel_date) => {
                let datetime = excel_date_to_datetime(excel_date);
                FormulaValue::Number(datetime.day() as f64)
            }
            _ => FormulaValue::Error("DAY requires a date value".to_string()),
        }
    }

    // Implementação simplificada das funções de lookup
    fn function_vlookup(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("VLOOKUP not yet implemented".to_string())
    }

    fn function_hlookup(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("HLOOKUP not yet implemented".to_string())
    }

    fn function_index(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("INDEX not yet implemented".to_string())
    }

    fn function_match(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("MATCH not yet implemented".to_string())
    }

    // Implementação simplificada das funções estatísticas
    fn function_median(&self, args: &[Expr]) -> FormulaValue {
        let mut numbers = Vec::new();
        
        for arg in args {
            match self.evaluate(arg) {
                FormulaValue::Number(n) => numbers.push(n),
                FormulaValue::Array(arr) => {
                    for val in arr {
                        if let Ok(n) = val.to_number() {
                            numbers.push(n);
                        }
                    }
                }
                FormulaValue::Error(e) => return FormulaValue::Error(e),
                _ => {} // Ignorar valores não numéricos
            }
        }
        
        if numbers.is_empty() {
            return FormulaValue::Error("No numeric values found".to_string());
        }
        
        numbers.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let len = numbers.len();
        
        let median = if len % 2 == 0 {
            (numbers[len / 2 - 1] + numbers[len / 2]) / 2.0
        } else {
            numbers[len / 2]
        };
        
        FormulaValue::Number(median)
    }

    fn function_mode(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("MODE not yet implemented".to_string())
    }

    fn function_stdev(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("STDEV not yet implemented".to_string())
    }

    fn function_var(&self, _args: &[Expr]) -> FormulaValue {
        FormulaValue::Error("VAR not yet implemented".to_string())
    }

    pub fn get_cell_references(&self, expr: &Expr) -> Vec<String> {
        let mut refs = Vec::new();
        self.collect_cell_references(expr, &mut refs);
        refs
    }

    fn collect_cell_references(&self, expr: &Expr, refs: &mut Vec<String>) {
        match expr {
            Expr::CellRef(cell_ref) => {
                refs.push(cell_ref.clone());
            }
            Expr::Range(start, end) => {
                let cells = self.expand_range(start, end);
                refs.extend(cells);
            }
            Expr::BinaryOp { left, right, .. } => {
                self.collect_cell_references(left, refs);
                self.collect_cell_references(right, refs);
            }
            Expr::UnaryOp { operand, .. } => {
                self.collect_cell_references(operand, refs);
            }
            Expr::Function { args, .. } => {
                for arg in args {
                    self.collect_cell_references(arg, refs);
                }
            }
            Expr::Array(exprs) => {
                for expr in exprs {
                    self.collect_cell_references(expr, refs);
                }
            }
            _ => {}
        }
    }
}

// Funções utilitárias para conversão de referências de células
pub fn parse_cell_reference(cell_ref: &str) -> Option<(usize, usize)> {
    let cell_ref = cell_ref.replace('$', ""); // Remover marcadores absolutos
    let mut chars = cell_ref.chars();
    let mut col_str = String::new();
    let mut row_str = String::new();
    
    // Parse column letters
    while let Some(ch) = chars.next() {
        if ch.is_ascii_alphabetic() {
            col_str.push(ch.to_ascii_uppercase());
        } else if ch.is_ascii_digit() {
            row_str.push(ch);
            break;
        } else {
            return None;
        }
    }
    
    // Parse remaining row digits
    for ch in chars {
        if ch.is_ascii_digit() {
            row_str.push(ch);
        } else {
            return None;
        }
    }
    
    if col_str.is_empty() || row_str.is_empty() {
        return None;
    }
    
    // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
    let mut col = 0;
    for ch in col_str.chars() {
        col = col * 26 + (ch as usize - 'A' as usize + 1);
    }
    col -= 1; // Convert to 0-based
    
    // Convert row string to number (1-based to 0-based)
    let row = row_str.parse::<usize>().ok()?.saturating_sub(1);
    
    Some((row, col))
}

pub fn cell_reference_to_string(row: usize, col: usize) -> String {
    let mut col_str = String::new();
    let mut col_num = col + 1; // Convert to 1-based
    
    while col_num > 0 {
        col_num -= 1;
        col_str.insert(0, (b'A' + (col_num % 26) as u8) as char);
        col_num /= 26;
    }
    
    format!("{}{}", col_str, row + 1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic_arithmetic() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("2 + 3 * 4").unwrap();
        
        let evaluator = FormulaEvaluator::new();
        let result = evaluator.evaluate(&expr);
        
        assert_eq!(result, FormulaValue::Number(14.0));
    }

    #[test]
    fn test_cell_reference() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("A1 + B2").unwrap();
        
        let mut evaluator = FormulaEvaluator::new();
        evaluator.set_cell_value("A1", FormulaValue::Number(10.0));
        evaluator.set_cell_value("B2", FormulaValue::Number(20.0));
        
        let result = evaluator.evaluate(&expr);
        assert_eq!(result, FormulaValue::Number(30.0));
    }

    #[test]
    fn test_function_sum() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("SUM(1, 2, 3, 4)").unwrap();
        
        let evaluator = FormulaEvaluator::new();
        let result = evaluator.evaluate(&expr);
        
        assert_eq!(result, FormulaValue::Number(10.0));
    }

    #[test]
    fn test_range_sum() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("SUM(A1:A3)").unwrap();
        
        let mut evaluator = FormulaEvaluator::new();
        evaluator.set_cell_value("A1", FormulaValue::Number(1.0));
        evaluator.set_cell_value("A2", FormulaValue::Number(2.0));
        evaluator.set_cell_value("A3", FormulaValue::Number(3.0));
        
        let result = evaluator.evaluate(&expr);
        assert_eq!(result, FormulaValue::Number(6.0));
    }

    #[test]
    fn test_if_function() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("IF(A1 > 5, \"High\", \"Low\")").unwrap();
        
        let mut evaluator = FormulaEvaluator::new();
        evaluator.set_cell_value("A1", FormulaValue::Number(10.0));
        
        let result = evaluator.evaluate(&expr);
        assert_eq!(result, FormulaValue::Text("High".to_string()));
    }

    #[test]
    fn test_concatenation() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("\"Hello\" & \" \" & \"World\"").unwrap();
        
        let evaluator = FormulaEvaluator::new();
        let result = evaluator.evaluate(&expr);
        
        assert_eq!(result, FormulaValue::Text("Hello World".to_string()));
    }

    #[test]
    fn test_comparison_operators() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("5 >= 3").unwrap();
        
        let evaluator = FormulaEvaluator::new();
        let result = evaluator.evaluate(&expr);
        
        assert_eq!(result, FormulaValue::Boolean(true));
    }

    #[test]
    fn test_parse_cell_reference() {
        assert_eq!(parse_cell_reference("A1"), Some((0, 0)));
        assert_eq!(parse_cell_reference("B2"), Some((1, 1)));
        assert_eq!(parse_cell_reference("Z26"), Some((25, 25)));
        assert_eq!(parse_cell_reference("AA1"), Some((0, 26)));
        assert_eq!(parse_cell_reference("$A$1"), Some((0, 0)));
    }

    #[test]
    fn test_cell_reference_to_string() {
        assert_eq!(cell_reference_to_string(0, 0), "A1");
        assert_eq!(cell_reference_to_string(1, 1), "B2");
        assert_eq!(cell_reference_to_string(25, 25), "Z26");
        assert_eq!(cell_reference_to_string(0, 26), "AA1");
    }

    #[test]
    fn test_text_functions() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("UPPER(\"hello\")").unwrap();
        
        let evaluator = FormulaEvaluator::new();
        let result = evaluator.evaluate(&expr);
        
        assert_eq!(result, FormulaValue::Text("HELLO".to_string()));
    }

    #[test]
    fn test_logical_functions() {
        let mut parser = FormulaParser::new();
        let expr = parser.parse("AND(TRUE, FALSE)").unwrap();
        
        let evaluator = FormulaEvaluator::new();
        let result = evaluator.evaluate(&expr);
        
        assert_eq!(result, FormulaValue::Boolean(false));
    }
}
