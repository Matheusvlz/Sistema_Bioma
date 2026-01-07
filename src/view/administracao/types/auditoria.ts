// src/types/auditoria.ts

// --- Sub-estruturas (Filhos) ---

export interface ItemOrcamento {
    nome: string;
    quantidade: string;
    preco_total: string;
}

export interface CicloOperacional {
    id_agendamento?: number;
    data_agendada?: string;
    
    id_coleta?: number;
    numero_coleta?: string;
    data_coleta?: string; // Data simples (YYYY-MM-DD)
    
    // --- CAMPOS NOVOS OBRIGATÓRIOS ---
    // Agora o Frontend sabe que pode receber isso
    data_hora_registro?: string; // Timestamp exato do sistema
    nome_coletor?: string;       // Nome do usuário que realizou a coleta
    
    status: string; // "Agendado", "Coletado", "Pendente"
}

export interface CicloFinanceiro {
    id_fatura: number;
    numero_nf?: string;
    data_emissao?: string;
    
    numero_parcela: number;
    data_vencimento?: string;
    data_pagamento?: string;
    
    valor_parcela?: string;
    valor_pago?: string;
    status: string; // "Pago", "Aberto", "Atrasado"
}

// --- Estrutura Principal (Pai) ---

export interface OrcamentoAuditoria {
    id: number;
    numero: number;
    versao: string;
    ano: string;
    numero_completo: string; // Ex: "055/A-2025"
    data_criacao: string;    // YYYY-MM-DD
    
    id_cliente: number;
    nome_cliente: string;
    cidade_cliente?: string;

    // Valores (Strings formatadas vindo do Rust/BigDecimal)
    valor_total_itens?: string;
    valor_frete?: string;
    valor_desconto?: string;
    valor_final?: string;

    // Listas Aninhadas
    itens: ItemOrcamento[];
    ciclo_operacional: CicloOperacional[];
    ciclo_financeiro: CicloFinanceiro[];

    // Diagnóstico
    status_geral: string; 
    alertas: string[];
}

// --- Filtros e Paginação ---

export interface FiltrosAuditoriaPayload {
    data_inicio: string;
    data_fim: string;
    termo_busca: string;
    apenas_problemas: boolean;
    pagina: number;
    itens_por_pagina: number;
}

export interface PaginatedAuditoriaResponse {
    data: OrcamentoAuditoria[];
    total_registros: number;
    total_paginas: number;
    pagina_atual: number;
}