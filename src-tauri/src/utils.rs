use regex::Regex;

/// Valida um CPF brasileiro
pub fn is_valid_cpf(cpf: &str) -> bool {
    let cpf = clean_document(cpf);
    
    // CPF deve ter exatamente 11 dígitos
    if cpf.len() != 11 {
        return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if cpf.chars().all(|c| c == cpf.chars().next().unwrap()) {
        return false;
    }

    let digits: Vec<u32> = cpf.chars().map(|c| c.to_digit(10).unwrap()).collect();

    // Calcula o primeiro dígito verificador
    let mut sum = 0;
    for i in 0..9 {
        sum += digits[i] * (10 - i as u32);
    }
    let first_check = if sum % 11 < 2 { 0 } else { 11 - (sum % 11) };

    // Calcula o segundo dígito verificador
    sum = 0;
    for i in 0..10 {
        sum += digits[i] * (11 - i as u32);
    }
    let second_check = if sum % 11 < 2 { 0 } else { 11 - (sum % 11) };

    // Verifica se os dígitos calculados coincidem com os informados
    digits[9] == first_check && digits[10] == second_check
}

/// Valida um CNPJ brasileiro
pub fn is_valid_cnpj(cnpj: &str) -> bool {
    let cnpj = clean_document(cnpj);
    
    // CNPJ deve ter exatamente 14 dígitos
    if cnpj.len() != 14 {
        return false;
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if cnpj.chars().all(|c| c == cnpj.chars().next().unwrap()) {
        return false;
    }

    let digits: Vec<u32> = cnpj.chars().map(|c| c.to_digit(10).unwrap()).collect();

    // Calcula o primeiro dígito verificador
    let weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let mut sum = 0;
    for i in 0..12 {
        sum += digits[i] * weights1[i];
    }
    let first_check = if sum % 11 < 2 { 0 } else { 11 - (sum % 11) };

    // Calcula o segundo dígito verificador
    let weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for i in 0..13 {
        sum += digits[i] * weights2[i];
    }
    let second_check = if sum % 11 < 2 { 0 } else { 11 - (sum % 11) };

    // Verifica se os dígitos calculados coincidem com os informados
    digits[12] == first_check && digits[13] == second_check
}

/// Remove caracteres não numéricos de um documento
pub fn clean_document(document: &str) -> String {
    document.chars().filter(|c| c.is_ascii_digit()).collect()
}

/// Limpa e formata um número de telefone
pub fn clean_and_format_phone(phone: &str) -> String {
    let cleaned = phone.chars().filter(|c| c.is_ascii_digit()).collect::<String>();
    
    if cleaned.is_empty() {
        return String::new();
    }

    // Formata conforme o padrão brasileiro
    match cleaned.len() {
        10 => format!("({}) {}-{}", &cleaned[0..2], &cleaned[2..6], &cleaned[6..10]),
        11 => format!("({}) {}-{}", &cleaned[0..2], &cleaned[2..7], &cleaned[7..11]),
        _ => cleaned, // Retorna apenas os números se não seguir padrão conhecido
    }
}

/// Valida se um telefone tem formato válido
pub fn is_valid_phone(phone: &str) -> bool {
    let cleaned = clean_document(phone);
    cleaned.len() >= 10 && cleaned.len() <= 11
}

/// Valida se um email tem formato básico válido
pub fn is_valid_email(email: &str) -> bool {
    if email.trim().is_empty() {
        return true; // Email é opcional
    }
    
    let email_regex = Regex::new(r"^[^\s@]+@[^\s@]+\.[^\s@]+$").unwrap();
    email_regex.is_match(email.trim())
}

/// Formata um CPF para exibição
pub fn format_cpf(cpf: &str) -> String {
    let cleaned = clean_document(cpf);
    if cleaned.len() == 11 {
        format!("{}.{}.{}-{}", &cleaned[0..3], &cleaned[3..6], &cleaned[6..9], &cleaned[9..11])
    } else {
        cpf.to_string()
    }
}

/// Formata um CNPJ para exibição
pub fn format_cnpj(cnpj: &str) -> String {
    let cleaned = clean_document(cnpj);
    if cleaned.len() == 14 {
        format!("{}.{}.{}/{}-{}", &cleaned[0..2], &cleaned[2..5], &cleaned[5..8], &cleaned[8..12], &cleaned[12..14])
    } else {
        cnpj.to_string()
    }
}

/// Determina o tipo de documento baseado no tamanho
pub fn get_document_type(document: &str) -> Option<String> {
    let cleaned = clean_document(document);
    match cleaned.len() {
        11 => Some("CPF".to_string()),
        14 => Some("CNPJ".to_string()),
        _ => None,
    }
}

/// Valida um documento (CPF ou CNPJ) automaticamente
pub fn validate_document(document: &str) -> Result<bool, String> {
    let cleaned = clean_document(document);
    
    if cleaned.is_empty() {
        return Ok(true); // Documento é opcional
    }
    
    match cleaned.len() {
        11 => Ok(is_valid_cpf(&cleaned)),
        14 => Ok(is_valid_cnpj(&cleaned)),
        _ => Err("Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ)".to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cpf_validation() {
        assert!(is_valid_cpf("11144477735"));
        assert!(is_valid_cpf("111.444.777-35"));
        assert!(!is_valid_cpf("11111111111"));
        assert!(!is_valid_cpf("123456789"));
    }

    #[test]
    fn test_cnpj_validation() {
        assert!(is_valid_cnpj("11222333000181"));
        assert!(is_valid_cnpj("11.222.333/0001-81"));
        assert!(!is_valid_cnpj("11111111111111"));
        assert!(!is_valid_cnpj("123456789"));
    }

    #[test]
    fn test_phone_formatting() {
        assert_eq!(clean_and_format_phone("11987654321"), "(11) 98765-4321");
        assert_eq!(clean_and_format_phone("1133334444"), "(11) 3333-4444");
        assert_eq!(clean_and_format_phone("(11) 98765-4321"), "(11) 98765-4321");
    }

    #[test]
    fn test_document_type_detection() {
        assert_eq!(get_document_type("12345678901"), Some("CPF".to_string()));
        assert_eq!(get_document_type("12345678901234"), Some("CNPJ".to_string()));
        assert_eq!(get_document_type("123"), None);
    }

    #[test]
    fn test_email_validation() {
        assert!(is_valid_email("test@example.com"));
        assert!(is_valid_email(""));
        assert!(!is_valid_email("invalid-email"));
        assert!(!is_valid_email("@example.com"));
    }
}
