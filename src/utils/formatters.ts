/**
 * Utilitários para formatação de documentos, telefones e outros dados
 * Utilizados no sistema de cadastro de consultores
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 * @param doc - String com documento (CPF/CNPJ) ou qualquer texto
 * @returns String apenas com números
 */
export const cleanDocument = (doc: string): string => {
  if (!doc) return '';
  return doc.replace(/\D/g, '');
};

/**
 * Formata string numérica como CPF (000.000.000-00)
 * @param cpf - String com números do CPF
 * @returns CPF formatado ou string original se inválida
 */
export const formatCpf = (cpf: string): string => {
  if (!cpf) return '';
  
  const cleaned = cleanDocument(cpf);
  
  // Se passou de 11 dígitos, retorna o valor original
  if (cleaned.length > 11) return cpf;
  
  // Aplica a formatação progressivamente
  return cleaned
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2');
};

/**
 * Formata string numérica como CNPJ (00.000.000/0000-00)
 * @param cnpj - String com números do CNPJ
 * @returns CNPJ formatado ou string original se inválida
 */
export const formatCnpj = (cnpj: string): string => {
  if (!cnpj) return '';
  
  const cleaned = cleanDocument(cnpj);
  
  // Se passou de 14 dígitos, retorna o valor original
  if (cleaned.length > 14) return cnpj;
  
  // Aplica a formatação progressivamente
  return cleaned
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

/**
 * Formata string numérica como telefone brasileiro
 * Celular: (00)00000-0000 | Fixo: (00)0000-0000
 * @param phone - String com números do telefone
 * @returns Telefone formatado
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Limita a 11 dígitos (celular)
  if (cleaned.length > 11) {
    return formatPhone(cleaned.substring(0, 11));
  }
  
  if (cleaned.length > 10) {
    // Celular (11 dígitos): (XX)XXXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1)$2-$3');
  } else if (cleaned.length === 10) {
    // Telefone fixo (10 dígitos): (XX)XXXX-XXXX
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1)$2-$3');
  } else if (cleaned.length > 6) {
    // Formatação parcial durante digitação
    return cleaned.replace(/(\d{2})(\d{4,5})(\d*)/, '($1)$2-$3');
  } else if (cleaned.length > 2) {
    // Formatação parcial - apenas DDD
    return cleaned.replace(/(\d{2})(\d*)/, '($1)$2');
  }
  
  return cleaned;
};

/**
 * Valida se um CPF tem formato e dígitos verificadores corretos
 * @param cpf - String com CPF (formatado ou não)
 * @returns true se CPF é válido
 */
export const isValidCpf = (cpf: string): boolean => {
  if (!cpf) return false;
  
  const cleaned = cleanDocument(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let soma = 0;
  let resto;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
};

/**
 * Valida se um CNPJ tem formato e dígitos verificadores corretos
 * @param cnpj - String com CNPJ (formatado ou não)
 * @returns true se CNPJ é válido
 */
export const isValidCnpj = (cnpj: string): boolean => {
  if (!cnpj) return false;
  
  const cleaned = cleanDocument(cnpj);
  
  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validação dos dígitos verificadores
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let soma = 0;
  let pos = length - 7;
  
  // Primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    soma += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digits.charAt(0))) return false;
  
  // Segundo dígito verificador
  length = length + 1;
  numbers = cleaned.substring(0, length);
  soma = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    soma += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
  if (resultado !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

/**
 * Valida se um telefone brasileiro tem formato correto
 * @param phone - String com telefone (formatado ou não)
 * @returns true se telefone tem formato válido
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  
  const cleaned = cleanDocument(phone);
  
  // Telefone deve ter 10 ou 11 dígitos
  if (cleaned.length < 10 || cleaned.length > 11) return false;
  
  // Verifica se o DDD é válido (códigos de área brasileiros)
  const ddd = parseInt(cleaned.substring(0, 2));
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ/ES
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF/GO
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99 // MA
  ];
  
  return validDDDs.includes(ddd);
};

/**
 * Formata um documento automaticamente baseado no tamanho
 * @param document - String com documento
 * @returns Documento formatado como CPF ou CNPJ
 */
export const formatDocument = (document: string): string => {
  if (!document) return '';
  
  const cleaned = cleanDocument(document);
  
  if (cleaned.length <= 11) {
    return formatCpf(document);
  } else {
    return formatCnpj(document);
  }
};

/**
 * Valida um documento automaticamente baseado no tamanho
 * @param document - String com documento
 * @returns true se documento é válido (CPF ou CNPJ)
 */
export const isValidDocument = (document: string): boolean => {
  if (!document) return false;
  
  const cleaned = cleanDocument(document);
  
  if (cleaned.length === 11) {
    return isValidCpf(document);
  } else if (cleaned.length === 14) {
    return isValidCnpj(document);
  }
  
  return false;
};

/**
 * Utilitários para formatação de outros dados
 */

/**
 * Formata CEP brasileiro (00000-000)
 * @param cep - String com números do CEP
 * @returns CEP formatado
 */
export const formatCep = (cep: string): string => {
  if (!cep) return '';
  
  const cleaned = cleanDocument(cep);
  
  if (cleaned.length > 8) return cep;
  
  return cleaned.replace(/(\d{5})(\d)/, '$1-$2');
};

/**
 * Formata valor monetário brasileiro
 * @param value - Número ou string com valor
 * @returns Valor formatado como R$ 0.000,00
 */
export const formatCurrency = (value: number | string): string => {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

/**
 * Capitaliza a primeira letra de cada palavra
 * @param text - String para capitalizar
 * @returns String com primeira letra de cada palavra maiúscula
 */
export const capitalizeWords = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};