// src/view/geral/VisualizarLegislacaoParametro.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarLegislacaoParametro from './CadastrarLegislacaoParametro';
import styles from './css/VisualizarLegislacaoParametro.module.css';

// --- Interfaces para os dados ---
interface DropdownOption {
    id: number | string; // Permitindo ID como texto para se adaptar à API
    nome: string;
}

// ✅ NOVO: Interface para os dados que vêm da API de Tipos (com 'codigo')
interface TipoFromApi {
    nome: string;
    codigo: string;
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

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const ITENS_POR_PAGINA = 15;

const VisualizarLegislacaoParametro: React.FC = () => {
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

    // ✅ NOVO: Estados para guardar as listas de "lookup" (nossas "agendas de contatos")
    const [listaTipos, setListaTipos] = useState<TipoFromApi[]>([]);
    const [listaMatrizes, setListaMatrizes] = useState<DropdownOption[]>([]);


    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true); // Inicia o loading geral
            try {
                // Carrega tudo em paralelo para mais performance
                const [legislacoesRes, tiposRes, matrizesRes]: [ApiResponse<DropdownOption[]>, ApiResponse<TipoFromApi[]>, ApiResponse<DropdownOption[]>] = await Promise.all([
                    invoke("listar_legislacoes_ativas_tauri"),
                    invoke("listar_tipos"),       // ✅ NOVO: Carrega a lista de tipos
                    invoke("listar_matrizes")     // ✅ NOVO: Carrega a lista de matrizes
                ]);

                if (legislacoesRes.success && Array.isArray(legislacoesRes.data)) {
                    setLegislacoes(legislacoesRes.data);
                } else {
                    setError(legislacoesRes.message || "Falha ao carregar a lista de legislações.");
                }
                
                // ✅ NOVO: Guarda as listas carregadas nos novos estados
                if (tiposRes.success && Array.isArray(tiposRes.data)) {
                    setListaTipos(tiposRes.data);
                }
                if (matrizesRes.success && Array.isArray(matrizesRes.data)) {
                    setListaMatrizes(matrizesRes.data);
                }

            } catch (err) {
                setError("Falha grave ao carregar dados iniciais da página.");
            } finally {
                setLoading(false); // Finaliza o loading geral
            }
        };
        carregarDadosIniciais();
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

    // ✅ NOVO: Funções "tradutoras" que convertem ID/código em Nome.
    const getNomeTipo = useCallback((codigo: string) => {
        const tipoEncontrado = listaTipos.find(t => t.codigo === codigo);
        return tipoEncontrado ? tipoEncontrado.nome : codigo; // Se não achar, mostra o código original
    }, [listaTipos]);

    const getNomeMatriz = useCallback((id: string) => {
        const matrizEncontrada = listaMatrizes.find(m => String(m.id) === id);
        return matrizEncontrada ? matrizEncontrada.nome : id; // Se não achar, mostra o ID original
    }, [listaMatrizes]);


    useEffect(() => {
        if(legislacaoSelecionada) {
            carregarDados();
        }
    }, [carregarDados, legislacaoSelecionada]);

    const legislacoesFiltradas = filtroLegislacao
        ? legislacoes.filter(l => l.nome.toLowerCase().includes(filtroLegislacao.toLowerCase()))
        : legislacoes;

    const handleSelecionarLegislacao = (leg: DropdownOption) => {
        setLegislacaoSelecionada(leg.id as number);
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

    const dadosFiltrados = dados.filter(item => {
        const searchTerm = filtroTabela.toLowerCase();
        if (!searchTerm) return true;
        // ✅ ALTERADO: Busca também pelos nomes traduzidos
        const nomeTipo = getNomeTipo(item.tipo || '');
        const nomeMatriz = getNomeMatriz(item.matriz || '');
        const itemComNomes = {...item, tipo: nomeTipo, matriz: nomeMatriz};

        return Object.values(itemComNomes).some(value =>
            String(value).toLowerCase().includes(searchTerm)
        );
    });
    
    const handleSalvar = () => {
        setMostrarFormulario(false);
        setItemEmEdicao(null);
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
    
    const handleAbrirFormulario = (item: LegislacaoParametroDetalhado | null) => {
        setItemEmEdicao(item);
        setMostrarFormulario(true);
    };

    if (mostrarFormulario) {
        return <CadastrarLegislacaoParametro 
            legislacaoIdSelecionada={legislacaoSelecionada!} 
            itemParaEdicao={itemEmEdicao} // Corrigido de itemParaEditar para itemParaEdicao
            onSalvar={handleSalvar} 
            onCancelar={() => {
                setMostrarFormulario(false);
                setItemEmEdicao(null);
            }} 
        />;
    }
    
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gerir Legislação x Parâmetro</h2>
                <button 
                    onClick={() => handleAbrirFormulario(null)} 
                    className={styles.buttonPrimary} 
                    disabled={!legislacaoSelecionada} 
                    title={!legislacaoSelecionada ? "Selecione uma legislação para cadastrar" : "Novo Relacionamento"}
                >
                    Novo Relacionamento
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.filters}>
                <div className={styles.autocompleteContainer} ref={autocompleteRef}>
                    <input type="text" placeholder="Digite para buscar uma legislação..." value={filtroLegislacao} onChange={handleFiltroChange} onFocus={() => setMostrarSugestoes(true)} className={styles.searchInput} />
                    {mostrarSugestoes && (
                        <ul className={styles.suggestionsList}>
                            {legislacoesFiltradas.length > 0 ? legislacoesFiltradas.map(leg => (
                                <li key={leg.id} onClick={() => handleSelecionarLegislacao(leg)}>{leg.nome}</li>
                            )) : <li>Nenhuma legislação encontrada.</li>}
                        </ul>
                    )}
                </div>
                <input type="text" placeholder="Buscar na tabela atual..." value={filtroTabela} onChange={(e) => setFiltroTabela(e.target.value)} className={styles.searchInput} disabled={!legislacaoSelecionada || dados.length === 0} />
            </div>
            
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Parâmetro / Grupo</th>
                            <th>Tipo / Matriz</th>
                            <th>POP / Técnica</th>
                            <th>Unidade</th>
                            <th>LQ Inferior / Superior</th>
                            <th>Incerteza</th>
                            <th>Limite Legislação</th>
                            <th>Valor</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && dados.length === 0 ? (
                            <tr><td colSpan={10} className={styles.loadingCell}><div className={styles.spinner}></div></td></tr>
                        ) : dadosFiltrados.length > 0 ? (
                            dadosFiltrados.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.id}</td>
                                    <td><strong>{item.nome_parametro || '-'}</strong><br/><small>Grupo: {item.grupo || '-'}</small></td>
                                    {/* ✅ ALTERADO: Usando as funções "tradutoras" para exibir os nomes */}
                                    <td><strong>{getNomeTipo(item.tipo || '-')}</strong><br/><small>Matriz: {getNomeMatriz(item.matriz || '-')}</small></td>
                                    <td><strong>{item.pop_numero ? `${item.pop_codigo}/${item.pop_numero}` : '-'}</strong><br/><small>Téc: {item.nome_tecnica || '-'}</small></td>
                                    <td>{item.unidade || '-'}</td>
                                    <td>{`Inf: ${item.lqi || '-'} | Sup: ${item.lqs || '-'}`}</td>
                                    <td>{item.incerteza || '-'}</td>
                                    <td>{`${item.limite_min || ''} ${item.limite_simbolo || ''} ${item.limite_max || ''}`.trim() || 'N.A.'}</td>
                                    <td>{item.valor || '-'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => handleAbrirFormulario(item)} className={styles.buttonEdit} title="Editar">✏️</button>
                                            <button onClick={() => handleRemover(item)} className={styles.buttonDelete} title="Remover">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={10} className={styles.empty}>
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