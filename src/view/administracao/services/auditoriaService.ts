import { invoke } from "@tauri-apps/api/core";
import { FiltrosAuditoriaPayload, PaginatedAuditoriaResponse } from "../types/auditoria";

// Interface interna para resposta genérica do Tauri
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// Interface específica para os dados de abertura de arquivo
// Isso garante que o componente passe exatamente o que o Rust precisa
interface DadosArquivo {
    numero?: number;      // Para Orçamento
    ano?: string;         // Para Orçamento
    nf?: string;          // Para Boleto
    data_competencia?: string; // NOVO: Essencial para achar a pasta do boleto (YYYY-MM-DD)
}

export const AuditoriaService = {
    
    // --- 1. BUSCAR DADOS (Lista Hierárquica) ---
    // Chama o Controller Rust para buscar a lista de orçamentos e seus detalhes
    listarAuditoria: async (filtros: FiltrosAuditoriaPayload): Promise<PaginatedAuditoriaResponse> => {
        try {
            console.log("Service: Buscando auditoria com filtros:", filtros);
            
            const res = await invoke<ApiResponse<PaginatedAuditoriaResponse>>("listar_auditoria_financeira_tauri", { 
                payload: filtros 
            });
            
            if (res.success && res.data) {
                return res.data;
            }
            throw new Error(res.message || "Erro desconhecido ao buscar auditoria.");
        } catch (error: any) {
            console.error("Erro no Service (Listar Auditoria):", error);
            throw error; // Repassa o erro para o componente tratar (loading/toast)
        }
    },

    // --- 2. ABRIR ARQUIVO NA REDE (PDF) ---
    // Chama a função Rust que varre as pastas da rede
    abrirArquivoRede: async (tipo: 'ORCAMENTO' | 'BOLETO', dados: DadosArquivo) => {
        try {
            console.log(`Service: Tentando abrir ${tipo}`, dados);

            const res = await invoke<ApiResponse<string>>("abrir_arquivo_rede_bioma_tauri", {
                payload: {
                    tipo,
                    numero: dados.numero,
                    ano: dados.ano,
                    nf: dados.nf,
                    data_competencia: dados.data_competencia // Campo crítico adicionado
                }
            });
            
            if (!res.success) {
                // Se o Rust não achou o arquivo ou deu erro, avisamos o usuário
                alert(`Atenção: ${res.message}`);
            } else {
                console.log("Arquivo aberto com sucesso:", res.data);
            }
        } catch (error) {
            console.error("Erro no Service (Abrir Arquivo):", error);
            alert("Falha técnica ao tentar comunicar com o sistema de arquivos. Verifique se a unidade de rede está acessível.");
        }
    }
};