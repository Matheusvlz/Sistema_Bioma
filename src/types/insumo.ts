// src/types/insumo.ts
// Arquivo de tipos unificado para Insumo e InsumoRegistro

// --- TIPOS GENÉRICOS ---

/**
 * Estrutura de resposta padrão da API (Padrão V8.0)
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
}

// --- TIPOS DE "GERENCIAR INSUMOS" (Insumo) ---

export interface InsumoDetalhado {
  id: number;
  nome: string;
  tipo_id: number;
  tipo_nome: string;
  unidade: string | null;
  editable: boolean;
}

export interface InsumoMateriaPrimaDetalhado {
  insumo_materia_prima_id: number;
  materia_prima_id: number;
  materia_prima_nome: string;
  quantidade: string; // Vem como string serializada do BigDecimal
  unidade: string | null;
}

export interface InsumoCompletoDetalhado extends InsumoDetalhado {
  materias_primas: InsumoMateriaPrimaDetalhado[];
}

export interface UnidadeOption {
  nome: string;
}

export interface InsumoTipoOption {
  id: number;
  nome: string;
}

export interface MateriaPrimaOption {
  id: number;
  nome: string;
  tipo: number;
  unidade: string | null;
}

export interface MateriaPrimaGrupo {
  tipo_id: number;
  tipo_nome: string;
  itens: MateriaPrimaOption[];
}

export interface InsumoSuporteFormulario {
  tipos: InsumoTipoOption[];
  unidades: UnidadeOption[];
  grupos_mp: MateriaPrimaGrupo[];
}

export interface InsumoMateriaPrimaPayload {
  materia_prima_id: number;
  quantidade: string; // Frontend envia como string
}

export interface InsumoPayload {
  nome: string;
  tipo_id: number;
  unidade: string | null;
  materias_primas: InsumoMateriaPrimaPayload[];
}

// --- TIPOS DE "REGISTRO DE INSUMOS" (InsumoRegistro) ---

/**
 * Detalhes do registro de insumo (estoque) - P/ Tabela Principal
 * Corresponde a InsumoRegistroDetalhado no Tauri
 */
export interface InsumoRegistroDetalhado {
  id: number;
  insumo_id: number;
  insumo_nome: string;
  tipo_id: number;
  tipo_nome: string;
  editable: boolean;
  obsoleto: boolean;
  fora_de_uso: boolean;
  portatil: boolean;
  registro: string | null; // Lote ou Patrimônio
  data_preparo: string | null; // "YYYY-MM-DD"
  validade: string | null; // "YYYY-MM-DD"
  quantidade: string | null; // String de BigDecimal
  fabricante: string | null;
  fator_correcao: string | null; // String de BigDecimal
  volume: string | null;
  nota_fiscal: string | null;
  garantia: number | null;
  garantia_tempo: string | null; // 'Dias' ou 'Meses'
  data_compra: string | null; // "YYYY-MM-DD"
  valor_equipamento: string | null; // String de BigDecimal
  modelo: string | null;
  numero_serie: string | null;
  fornecedor_id: number | null;
  observacao: string | null;
  faixa_min: string | null;
  faixa_max: string | null;
  desvios: string | null; // String de BigDecimal
}

/**
 * Opção de fornecedor para o dropdown do formulário
 */
export interface FornecedorOption {
  id: number;
  nome: string;
}

/**
 * Opção de insumo (filtrado por tipo) para o dropdown do formulário
 */
export interface InsumoOption {
  id: number;
  nome: string;
  unidade: string | null;
}

/**
 * A "receita" de um Meio/Reagente (o que ele precisa)
 */
export interface MateriaPrimaRequerida {
  id: number;
  nome: string;
  unidade: string | null;
  quantidade: string; // String de BigDecimal
}

/**
 * O "estoque" disponível de uma Matéria-Prima
 */
export interface MateriaPrimaRegistroDisponivel {
  id: number;
  fabricante: string | null;
  lote_fabricante: string | null;
  validade: string | null; // "YYYY-MM-DD"
  quant_restante: string; // String de BigDecimal
}

/**
 * Estrutura combinada da "receita" e seu "estoque"
 */
export interface ReceitaEstoqueItem {
  mp_requerida: MateriaPrimaRequerida;
  estoque_disponivel: MateriaPrimaRegistroDisponivel[];
}

/**
 * Sub-payload para matérias-primas consumidas
 */
export interface RegistroMateriaPrimaPayload {
  materia_prima_registro_id: number;
  quantidade: string; // Frontend envia como string
}

/**
 * Payload completo do formulário enviado do Frontend para o Tauri
 */
export interface RegistroInsumoFrontendPayload {
  insumo_id: number;
  registro: string | null;
  fabricante: string | null;
  volume: string | null;
  data_preparo: string | null;
  validade: string | null;
  quantidade: string | null;
  fator_correcao: string | null;
  nota_fiscal: string | null;
  garantia: number | null;
  garantia_tempo: string | null;
  fornecedor_id: number | null;
  data_compra: string | null;
  valor_equipamento: string | null;
  modelo: string | null;
  numero_serie: string | null;
  observacao: string | null;
  faixa_min: string | null;
  faixa_max: string | null;
  desvios: string | null;
  fora_de_uso: boolean;
  portatil: boolean;
  materias_primas: RegistroMateriaPrimaPayload[];
}
