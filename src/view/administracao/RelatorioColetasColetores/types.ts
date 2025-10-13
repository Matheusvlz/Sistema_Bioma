// Ficheiro: src/view/administracao/RelatorioAnalise/types.ts

// Estrutura genérica de resposta que vem do nosso backend Tauri (permanece igual)
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Interface para uso interno nos componentes de dropdown (permanece igual)
export interface DropdownOption {
  value: number | string;
  label: string;
}

// --- INTERFACES QUE MAPEIAM A RESPOSTA DA API (CORRIGIDAS PARA snake_case) ---

export interface ClienteDropdown {
  id: number;
  nome_fantasia: string; // Corrigido de nomeFantasia
}

export interface UsuarioDropdown {
  id: number;
  nome: string;
}

export interface CidadeDropdown {
  cidade: string;
}

export interface AnaliseDetalhada {
  coletor_nome: string;      // Corrigido de coletorNome
  cliente_fantasia: string;  // Corrigido de clienteFantasia
  cidade: string;
  endereco?: string;
  bairro?: string;
  numero?: string;
  status: 'Coletado' | 'Agendado'; // Mantemos a tipagem forte
  data_hora: string;         // Corrigido de dataHora
}

export interface AnaliseAgregada {
  cliente_id: number;        // Corrigido de clienteId
  cliente_fantasia: string;  // Corrigido de clienteFantasia
  total_coletas: number;     // Corrigido de totalColetas
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  per_page: number;          // Corrigido de perPage
  items: T[];
}

// --- INTERFACES PARA O ESTADO E PAYLOADS DO FRONTEND (permanecem camelCase por convenção) ---

// Objeto de filtros usado no estado do React
export interface Filtros {
  clienteId: number | null;
  coletorId: number | null;
  cidade: string | null;
  dataInicial: string;
  dataFinal: string;
}

// Objeto de payload enviado para os comandos Tauri
export interface FiltrosPayload {
  clienteId: number | null;
  coletorId: number | null;
  cidade: string | null;
  dataInicial: string;
  dataFinal: string;
  page?: number;
  per_page?: number;
  buscaRapida?: string;
  export?: boolean;
}

// Dados para os KPIs
export interface KpiData {
  total: number;
  coletado: number;
  agendado: number;
  aproveitamento: string;
}