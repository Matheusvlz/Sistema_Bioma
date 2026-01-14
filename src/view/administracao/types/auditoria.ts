// =====================================================================
// 1. SUB-ESTRUTURAS (DETALHES)
// =====================================================================

export interface ArquivoFisico {
    id: number;
    caminho: string;
}

export interface BoletoItemNF {
    id: number;
    nf_numero?: string;
    caminho_nf?: string;
    data_emissao?: string;
    data_vencimento?: string;
    
    pago: boolean;
    
    valor?: string;      // BigDecimal string
    valor_pago?: string; // BigDecimal string
    
    empresa?: string;
    
    arquivos_boletos: ArquivoFisico[];
}

export interface OrcamentoVinculado {
    id: number;
    numero_completo: string;
    data: string;
    
    // Matemática Financeira (Strings numéricas)
    valor_base_itens: string;
    valor_frete_real: string;
    valor_descontos: string;
    valor_final_calculado: string;

    // Resumo Operacional
    qtd_coletas: number;
    resumo_coletas: string[];
}

// =====================================================================
// 2. ESTRUTURA PRINCIPAL (AGORA É BOLETO, NÃO ORÇAMENTO)
// =====================================================================

export interface BoletoRastreabilidade {
    // Dados do Boleto Pai
    id: number;
    id_cliente: number;
    nome_cliente: string;
    descricao?: string;
    boleto_path?: string; // Geralmente o número da Nota Principal ou ID
    
    data_vencimento?: string;
    data_emissao?: string;
    
    valor_total?: string;          // Valor do Boleto
    valor_pago_acumulado?: string; // Quanto já foi pago
    valor_fatura_original?: string; 

    status_pagamento: string; // "PAGO", "PARCIAL", "PENDENTE", "ATRASADO"

    // Filhos
    itens_nf: BoletoItemNF[];
    orcamento_vinculado?: OrcamentoVinculado;
}

// =====================================================================
// 3. PAYLOADS E RESPOSTAS
// =====================================================================

// Filtros da Tela (O Front manda data_inicio/fim, o Backend converte para vencimento)
export interface FiltrosAuditoriaPayload {
    data_inicio: string;
    data_fim: string;
    cliente_id?: number; 
    cidade?: string;
    termo_busca: string; // Opcional no backend agora, mas mantemos no front
    apenas_problemas: boolean;
    pagina: number;
    itens_por_pagina: number;
}

// Resposta do Backend Tauri
export interface PaginatedBoletoResponse {
    data: BoletoRastreabilidade[];
    total_registros: number;
    total_paginas: number;
    pagina_atual: number;
}