// src/services/financeiroService.ts
import { invoke } from "@tauri-apps/api/core";
import { FiltrosAuditoria, PaginatedResponse } from "../types/financeiro";

// Wrapper para a resposta padrão da API (ApiResponse)
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

export const FinanceiroService = {
  listarAuditoria: async (filtros: FiltrosAuditoria): Promise<PaginatedResponse> => {
    try {
      const response = await invoke<ApiResponse<PaginatedResponse>>("listar_auditoria_financeira_tauri", { 
        payload: filtros 
      });

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || "Erro desconhecido ao buscar auditoria.");
      }
    } catch (error) {
      console.error("Erro no Service:", error);
      throw error;
    }
  },

  // Função genérica para abrir arquivos (PDFs de Boleto ou Orçamento)
  abrirArquivo: async (tipo: 'ORCAMENTO' | 'BOLETO', dados: any) => {
    try {
      // Reutilizando o comando que você já tinha ou criando um novo específico
      // Vou assumir que usamos o comando genérico de abrir arquivo da rede
      await invoke("abrir_arquivo_rede_bioma", { 
        payload: {
            tipo,
            orc_numero: dados.id_orcamento, // Ajuste conforme seu backend espera
            orc_ano: dados.orcamento_ano, // Precisa garantir que tenha esse dado ou extraia da data
            empresa: 'BIOMA', // Ou extrair do item
            data_competencia: dados.data_emissao,
            numero_nf: dados.numero_nf
        }
      });
    } catch (error) {
        console.error("Erro ao abrir arquivo:", error);
        alert("Não foi possível localizar o arquivo na rede.");
    }
  }
};