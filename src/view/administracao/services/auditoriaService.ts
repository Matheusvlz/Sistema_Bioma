import { invoke } from '@tauri-apps/api/core'; // Ou 'tauri' dependendo da versão
import { 
    FiltrosAuditoriaPayload, 
    PaginatedAuditoriaResponse 
} from '../types/auditoria';

// Interface do Wrapper de Resposta (Igual ao do Rust ApiResponse)
interface ApiResponse<T> {
    message: string;
    data?: T;
    error?: string;
}

export const AuditoriaService = {
    
    /**
     * Busca os dados da Auditoria Financeira 360 chamando o Backend Tauri.
     */
    listarAuditoria: async (filtros: FiltrosAuditoriaPayload): Promise<PaginatedAuditoriaResponse> => {
        try {
            // Log para debug no Console do Navegador (F12)
            console.log("Service: Solicitando auditoria ao Tauri...", filtros);
            
            // O nome do comando aqui DEVE ser idêntico ao do #[command] no Rust
            const response = await invoke<ApiResponse<PaginatedAuditoriaResponse>>('listar_auditoria_financeira_tauri', {
                payload: filtros
            });

            // Verifica se o Backend retornou erro tratado
            if (response.error) {
                console.error("Service: Erro retornado pelo Backend:", response.error);
                throw new Error(response.error);
            }

            // Verifica se veio dado
            if (!response.data) {
                throw new Error("O Backend retornou sucesso, mas sem dados (data is null).");
            }

            return response.data;

        } catch (error) {
            // Erro de comunicação ou falha grave (Rust panic, etc)
            console.error("Service: Falha crítica na comunicação:", error);
            throw error;
        }
    },

    /**
     * Solicita ao SO para abrir o arquivo (PDF) na rede.
     */
    abrirArquivoRede: async (tipo: 'ORCAMENTO' | 'BOLETO', dados: any): Promise<void> => {
        try {
            const payload = {
                tipo,
                numero: dados.numero,
                ano: dados.ano,
                nf: dados.nf,
                data_competencia: dados.data_competencia
            };

            console.log("Service: Abrindo arquivo...", payload);

            const response = await invoke<ApiResponse<string>>('abrir_arquivo_rede_bioma_tauri', { 
                payload 
            });

            if (response.error) {
                console.warn("Service: Arquivo não aberto:", response.error);
                // Aqui você poderia disparar um Toast/Alerta visual se tiver uma lib de UI configurada
                alert("Não foi possível abrir o arquivo: " + response.error);
            } else {
                console.log("Service: Arquivo aberto com sucesso:", response.message);
            }

        } catch (error) {
            console.error("Service: Erro ao tentar abrir arquivo:", error);
            alert("Erro de sistema ao abrir arquivo.");
        }
    }
};