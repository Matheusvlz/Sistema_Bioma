// src/types/financeiro.ts

export interface AuditoriaItem {
  // Identificadores
  id_parcela?: number;
  id_fatura?: number;
  id_coleta?: number;
  id_orcamento?: number;

  // Cliente
  id_cliente: number;
  nome_cliente: string;
  cidade_cliente?: string;

  // Operacional
  data_servico?: string;
  descricao_servico?: string; // O "Sherlock" achou isso aqui
  origem_dado: 'FINANCEIRO' | 'OPERACIONAL';

  // Financeiro
  numero_nf?: string;
  numero_parcela?: number;
  total_parcelas?: number;

  // Datas
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;

  // Valores (Vêm como string do Rust por causa do BigDecima/serde_as)
  valor_parcela?: string;
  valor_pago?: string;
  valor_total_documento?: string;

  // Status & Auditoria
  status_pagamento: string;
  auditoria_nivel: 'OK' | 'ALERTA' | 'ERRO_GRAVE';
  auditoria_mensagem: string;
}

export interface FiltrosAuditoria {
  data_inicio: string;
  data_fim: string;
  termo_busca: string;
  apenas_problemas: boolean;
  pagina: number;
  itens_por_pagina: number;
  order_by: string;
  order_dir: 'ASC' | 'DESC';
}

export interface PaginatedResponse {
  data: AuditoriaItem[];
  total_registros: number;
  total_paginas: number;
  pagina_atual: number;
}