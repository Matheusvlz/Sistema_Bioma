import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/VisualizarHistorico.module.css';

// --- Interfaces de Tipagem ---

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface Historico {
  usuarioNome: string | null;
  descricao: string | null;
  dataHora: string | null; // Vem como string ISO 8601
  ip: string | null;
  computador: string | null;
}

interface PaginatedHistoricoResponse {
  items: Historico[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

interface HistoricoFilterPayload {
  usuarioId?: number;
  acao?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface UsuarioSimplificado {
    id: number;
    nome: string;
}

const ITENS_POR_PAGINA = 50;
const INITIAL_FILTERS = {
    usuarioId: '',
    acao: '',
    dataInicio: '',
    dataFim: '',
};

export const VisualizarHistorico: React.FC = () => {
    // Estados de controle da UI
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados dos dados
    const [logEntries, setLogEntries] = useState<Historico[]>([]);
    const [filterOptions, setFilterOptions] = useState<{ users: UsuarioSimplificado[], actions: string[] }>({ users: [], actions: [] });
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    
    // Estados da paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);

    // Carrega as opções dos filtros (usuários e ações) uma vez
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const [usersRes, actionsRes] = await Promise.all([
                    invoke<ApiResponse<UsuarioAdmin[]>>('listar_usuarios_admin_command'),
                    invoke<ApiResponse<string[]>>('listar_acoes_historico_command')
                ]);

                const users = usersRes.success && usersRes.data ? usersRes.data.map(u => ({ id: u.id, nome: u.nome_completo || 'Sem Nome' })) : [];
                const actions = actionsRes.success && actionsRes.data ? actionsRes.data : [];

                setFilterOptions({ users, actions });
            } catch (err: any) {
                setError(err.message || "Falha ao carregar opções de filtro.");
            }
        };

        loadFilterOptions().then(() => fetchHistorico(1)); // Carrega a primeira página após os filtros
    }, []);

    // Função principal para buscar os dados
    const fetchHistorico = useCallback(async (page: number) => {
        setLoading(true);
        setError(null);

        const payload: HistoricoFilterPayload = {
            usuarioId: filters.usuarioId ? Number(filters.usuarioId) : undefined,
            acao: filters.acao || undefined,
            dataInicio: filters.dataInicio || undefined,
            dataFim: filters.dataFim || undefined,
        };
        
        try {
            const res = await invoke<ApiResponse<PaginatedHistoricoResponse>>('listar_historico_command', {
                page,
                perPage: ITENS_POR_PAGINA,
                filters: payload,
            });

            if (res.success && res.data) {
                setLogEntries(res.data.items);
                setTotalPages(res.data.totalPages);
                setTotalItems(res.data.total);
                setCurrentPage(res.data.page);
            } else {
                setError(res.message || "Falha ao buscar histórico.");
            }
        } catch (err: any) {
            setError(err.message || "Erro grave ao comunicar com o backend.");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Handlers
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setCurrentPage(1); // Reseta para a primeira página ao buscar
        fetchHistorico(1);
    };

    const handleClearFilters = () => {
        setFilters(INITIAL_FILTERS);
        setCurrentPage(1);
        // O fetch será disparado pelo useEffect abaixo, se quisermos que seja automático
        // Ou chamamos aqui para ser explícito:
        // fetchHistorico(1, INITIAL_FILTERS); // precisaria ajustar o useCallback
    };
    
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            fetchHistorico(newPage);
        }
    };
    
    // Formata a data para exibição
    const formatDateTime = (isoString: string | null) => {
        if (!isoString) return '-';
        try {
            return new Date(isoString).toLocaleString('pt-BR');
        } catch {
            return isoString; // Fallback
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h2>Visualizar Histórico de Atividades</h2>
            </header>

            <main className={styles.main}>
                <div className={styles.filters}>
                    <div className={styles.formGroup}>
                        <label htmlFor="usuarioId" className={styles.label}>Usuário</label>
                        <select name="usuarioId" id="usuarioId" value={filters.usuarioId} onChange={handleFilterChange} className={styles.select}>
                            <option value="">Todos os Usuários</option>
                            {filterOptions.users.map(user => <option key={user.id} value={user.id}>{user.nome}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="acao" className={styles.label}>Ação</label>
                        <select name="acao" id="acao" value={filters.acao} onChange={handleFilterChange} className={styles.select}>
                            <option value="">Todas as Ações</option>
                            {filterOptions.actions.map(action => <option key={action} value={action}>{action}</option>)}
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="dataInicio" className={styles.label}>Data Início</label>
                        <input type="date" name="dataInicio" id="dataInicio" value={filters.dataInicio} onChange={handleFilterChange} className={styles.input} />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="dataFim" className={styles.label}>Data Fim</label>
                        <input type="date" name="dataFim" id="dataFim" value={filters.dataFim} onChange={handleFilterChange} className={styles.input} />
                    </div>
                    <div className={styles.filterActions}>
                        <button onClick={handleClearFilters} className={`${styles.button} ${styles.buttonSecondary}`} disabled={loading}>Limpar</button>
                        <button onClick={handleSearch} className={`${styles.button} ${styles.buttonPrimary}`} disabled={loading}>Buscar</button>
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Ação</th>
                                <th>Data / Hora</th>
                                <th>Computador</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className={styles.loadingCell}><div className={styles.spinner}></div></td></tr>
                            ) : logEntries.length > 0 ? (
                                logEntries.map((entry, index) => (
                                    <tr key={index}>
                                        <td>{entry.usuarioNome || '-'}</td>
                                        <td>{entry.descricao || '-'}</td>
                                        <td>{formatDateTime(entry.dataHora)}</td>
                                        <td>{entry.computador || '-'}</td>
                                        <td>{entry.ip || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className={styles.empty}>Nenhum registro encontrado para os filtros selecionados.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className={styles.pagination}>
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading} className={`${styles.button} ${styles.buttonSecondary}`}>
                            Anterior
                        </button>
                        <span>Página {currentPage} de {totalPages} ({totalItems} registros)</span>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages || loading} className={`${styles.button} ${styles.buttonSecondary}`}>
                            Próxima
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};