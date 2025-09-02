import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarLegislacaoParametro from './CadastrarLegislacaoParametro';
import styles from './css/VisualizarLegislacaoParametro.module.css';

// --- Interfaces para os dados ---
interface DropdownOption {
    id: number;
    nome: string;
}

interface LegislacaoParametroDetalhado {
    id: number;
    nome_legislacao?: string;
    tipo?: string;
    matriz?: string;
    nome_parametro?: string;
    grupo?: string;
    nome_tecnica?: string;
    pop_codigo?: string;
    pop_numero?: string;
    pop_revisao?: string;
    objetivo?: string;
    incerteza?: string;
    lqi?: string;
    lqs?: string;
    unidade?: string;
    limite_min?: string;
    limite_simbolo?: string;
    limite_max?: string;
    valor?: string;
    ativo: boolean;
}

interface PaginatedResponse {
    items: LegislacaoParametroDetalhado[];
    total: number;
    page: number;
    per_page: number;
}

// ✅ CORREÇÃO: Adicionamos a interface para a "encomenda grande"
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const ITENS_POR_PAGINA = 15;

const VisualizarLegislacaoParametro: React.FC = () => {
    // --- Estados do Componente ---
    const [legislacoes, setLegislacoes] = useState<DropdownOption[]>([]);
    const [legislacaoSelecionada, setLegislacaoSelecionada] = useState<number | null>(null);
    const [nomeLegislacaoSelecionada, setNomeLegislacaoSelecionada] = useState('');
    
    const [dados, setDados] = useState<LegislacaoParametroDetalhado[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [itemEmEdicao, setItemEmEdicao] = useState<LegislacaoParametroDetalhado | null>(null);
    
    const [filtroLegislacao, setFiltroLegislacao] = useState('');
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    const [filtroTabela, setFiltroTabela] = useState('');

    // --- Carregamento de Dados ---
    useEffect(() => {
        const carregarLegislacoes = async () => {
            try {
                // ✅ CORREÇÃO: O invoke agora espera a "encomenda grande"
                const res: ApiResponse<DropdownOption[]> = await invoke("listar_legislacoes_ativas_tauri");
                // ✅ CORREÇÃO: Abrimos a "encomenda" e usamos os dados de dentro
                if (res.success && Array.isArray(res.data)) {
                    setLegislacoes(res.data);
                } else {
                    setError(res.message || "Falha ao carregar a lista de legislações.");
                }
            } catch (err) {
                setError("Falha grave ao carregar a lista de legislações.");
            } finally {
                setLoading(false);
            }
        };
        carregarLegislacoes();
    }, []);

    const carregarDados = useCallback(async () => {
        if (!legislacaoSelecionada) {
            setDados([]);
            setTotalPaginas(1);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // ✅ CORREÇÃO: O invoke para os dados principais também espera a "encomenda grande"
            const res: ApiResponse<PaginatedResponse> = await invoke("listar_legislacao_parametro_tauri", {
                legislacaoId: legislacaoSelecionada,
                page: paginaAtual,
                perPage: ITENS_POR_PAGINA,
            });

            if (res.success && res.data) {
                setDados(res.data.items);
                setTotalPaginas(Math.ceil(res.data.total / res.data.per_page) || 1);
            } else {
                 setError(res.message || "Erro ao carregar os dados da tabela.");
            }
        } catch (err: any) {
            setError(`Erro grave ao carregar dados: ${err.toString()}`);
        } finally {
            setLoading(false);
        }
    }, [legislacaoSelecionada, paginaAtual]);

    useEffect(() => {
        if(legislacaoSelecionada) {
            carregarDados();
        }
    }, [carregarDados, legislacaoSelecionada]);

    // --- Lógica do Autocomplete de Legislação ---
    const legislacoesFiltradas = filtroLegislacao
        ? legislacoes.filter(l => l.nome.toLowerCase().includes(filtroLegislacao.toLowerCase()))
        : legislacoes;

    const handleSelecionarLegislacao = (leg: DropdownOption) => {
        setLegislacaoSelecionada(leg.id);
        setNomeLegislacaoSelecionada(leg.nome);
        setFiltroLegislacao(leg.nome);
        setMostrarSugestoes(false);
        setPaginaAtual(1);
        setFiltroTabela('');
    };

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFiltroLegislacao(value);
        setMostrarSugestoes(true);
        
        if (legislacaoSelecionada !== null || nomeLegislacaoSelecionada !== value) {
            setLegislacaoSelecionada(null);
            setNomeLegislacaoSelecionada('');
        }
    };
    
    useEffect(() => {
        const handleClickFora = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setMostrarSugestoes(false);
                if (!legislacaoSelecionada) {
                    setFiltroLegislacao('');
                } else {
                    setFiltroLegislacao(nomeLegislacaoSelecionada);
                }
            }
        };
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, [legislacaoSelecionada, nomeLegislacaoSelecionada]);

    // --- Lógica da Busca na Tabela ---
    const dadosFiltrados = dados.filter(item => {
        const searchTerm = filtroTabela.toLowerCase();
        if (!searchTerm) return true;
        return Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );
    });
    
    // --- Handlers de Ações ---
    const handleSalvar = () => {
        setMostrarFormulario(false);
        setSuccessMessage("Operação realizada com sucesso!");
        setTimeout(() => setSuccessMessage(null), 3000);
        carregarDados();
    };

    const handleRemover = async (item: LegislacaoParametroDetalhado) => {
        if (!window.confirm(`Tem certeza que deseja remover o relacionamento para "${item.nome_parametro}"?`)) return;
        try {
            await invoke("deletar_legislacao_parametro_tauri", { id: item.id });
            setSuccessMessage("Relacionamento removido com sucesso!");
            setTimeout(() => setSuccessMessage(null), 3000);
            carregarDados();
        } catch (err: any) {
            setError(`Erro ao remover: ${err.toString()}`);
        }
    };

    if (mostrarFormulario) {
        return <CadastrarLegislacaoParametro legislacaoIdSelecionada={legislacaoSelecionada!} onSalvar={handleSalvar} onCancelar={() => setMostrarFormulario(false)} />;
    }
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gerir Legislação x Parâmetro</h2>
                <button onClick={() => setMostrarFormulario(true)} className={styles.buttonPrimary} disabled={!legislacaoSelecionada} title={!legislacaoSelecionada ? "Selecione uma legislação para cadastrar" : "Novo Relacionamento"}>
                    Novo Relacionamento
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.filters}>
                <div className={styles.autocompleteContainer} ref={autocompleteRef}>
                    <input
                        type="text"
                        placeholder="Digite para buscar uma legislação..."
                        value={filtroLegislacao}
                        onChange={handleFiltroChange}
                        onFocus={() => setMostrarSugestoes(true)}
                        className={styles.searchInput}
                    />
                    {mostrarSugestoes && (
                        <ul className={styles.suggestionsList}>
                            {legislacoesFiltradas.length > 0 ? legislacoesFiltradas.map(leg => (
                                <li key={leg.id} onClick={() => handleSelecionarLegislacao(leg)}>{leg.nome}</li>
                            )) : <li>Nenhuma legislação encontrada.</li>}
                        </ul>
                    )}
                </div>
                
                <input
                    type="text"
                    placeholder="Buscar na tabela atual..."
                    value={filtroTabela}
                    onChange={(e) => setFiltroTabela(e.target.value)}
                    className={styles.searchInput}
                    disabled={!legislacaoSelecionada || dados.length === 0}
                />
            </div>
            
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Parâmetro</th>
                            <th>Grupo</th>
                            <th>Técnica</th>
                            <th>Limite</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && dados.length === 0 ? (
                            <tr><td colSpan={5} className={styles.loadingCell}><div className={styles.spinner}></div></td></tr>
                        ) : dadosFiltrados.length > 0 ? (
                            dadosFiltrados.map((item) => (
                                <tr key={item.id}>
                                    <td><strong>{item.nome_parametro}</strong><br/><small>{`Objetivo: ${item.objetivo || '-'}`}</small></td>
                                    <td>{item.grupo}</td>
                                    <td>{item.nome_tecnica}</td>
                                    <td>{`${item.limite_min || ''} ${item.limite_simbolo || ''} ${item.limite_max || ''}`.trim()}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => { setItemEmEdicao(item); setMostrarFormulario(true); }} className={styles.buttonEdit} title="Editar">✏️</button>
                                            <button onClick={() => handleRemover(item)} className={styles.buttonDelete} title="Remover">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className={styles.empty}>
                                    {!legislacaoSelecionada ? "Selecione uma legislação acima para começar." : "Nenhum parâmetro encontrado para esta legislação."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {dados.length > 0 && totalPaginas > 1 && (
                 <div className={styles.pagination}>
                    <button onClick={() => setPaginaAtual(p => p - 1)} disabled={paginaAtual <= 1 || loading} className={styles.buttonPrimary}>Anterior</button>
                    <span>Página {paginaAtual} de {totalPaginas}</span>
                    <button onClick={() => setPaginaAtual(p => p + 1)} disabled={paginaAtual >= totalPaginas || loading} className={styles.buttonPrimary}>Próxima</button>
                </div>
            )}
        </div>
    );
};

export default VisualizarLegislacaoParametro;

