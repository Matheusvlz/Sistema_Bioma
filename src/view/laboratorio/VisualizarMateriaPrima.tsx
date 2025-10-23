// src/view/insumo/VisualizarMateriaPrima.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarMateriaPrima from './CadastrarMateriaPrima';
import styles from './styles/VisualizarMateriaPrima.module.css';

// --- Interfaces (sem alterações) ---
interface MateriaPrimaDetalhado {
    id: number;
    nome: string;
    tipo_id: number;
    nome_tipo: string;
    quantidade_min: string;
    unidade: string;
    editavel: boolean;
}

interface PaginatedResponse {
    items: MateriaPrimaDetalhado[];
    total: number;
    page: number;
    per_page: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const ITENS_POR_PAGINA = 20;

const VisualizarMateriaPrima: React.FC = () => {
    // ESTADO MESTRE: Guarda TODOS os itens, sem filtro e sem paginação.
    const [todosOsDados, setTodosOsDados] = useState<MateriaPrimaDetalhado[]>([]);
    
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [filtroTabela, setFiltroTabela] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [itemEmEdicao, setItemEmEdicao] = useState<MateriaPrimaDetalhado | null>(null);

    // Função para carregar TODOS os dados do backend de uma vez
    const carregarTodosOsDados = async () => {
        setLoading(true);
        setError(null);
        try {
            // Pedimos uma página gigante para trazer todos os registros de uma vez.
            const res: ApiResponse<PaginatedResponse> = await invoke("listar_materia_prima_tauri", {
                page: 1,
                perPage: 9999, // Um número alto para garantir que todos os dados venham
                filtro: null,  // Garantimos que não há filtro no backend
            });

            if (res.success && res.data) {
                setTodosOsDados(res.data.items);
            } else {
                setError(res.message || "Erro ao carregar os dados da tabela.");
            }
        } catch (err: any) {
            setError(`Erro grave ao carregar dados: ${err.toString()}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Carrega todos os dados apenas uma vez, quando o componente monta
    useEffect(() => {
        carregarTodosOsDados();
    }, []);

    // LÓGICA DE FILTRO: Filtra a lista MESTRE (todosOsDados)
    const dadosFiltrados = useMemo(() => {
        if (!filtroTabela) {
            return todosOsDados;
        }
        const termoBusca = filtroTabela.toLowerCase();
        return todosOsDados.filter(item =>
            item.nome.toLowerCase().includes(termoBusca) ||
            item.nome_tipo.toLowerCase().includes(termoBusca) ||
            item.unidade.toLowerCase().includes(termoBusca)
        );
    }, [todosOsDados, filtroTabela]);

    // LÓGICA DE PAGINAÇÃO: Calcula o total de páginas e a fatia a ser exibida
    const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
    const dadosExibidos = useMemo(() => {
        const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
        const fim = inicio + ITENS_POR_PAGINA;
        return dadosFiltrados.slice(inicio, fim);
    }, [dadosFiltrados, paginaAtual]);

    // Efeito para resetar a página para 1 sempre que o filtro mudar
    useEffect(() => {
        if (paginaAtual !== 1) {
            setPaginaAtual(1);
        }
    }, [filtroTabela]);


    const handleSalvar = () => {
        setMostrarFormulario(false);
        setItemEmEdicao(null);
        setSuccessMessage("Operação realizada com sucesso!");
        setTimeout(() => setSuccessMessage(null), 3000);
        // Recarrega a lista mestre para incluir o novo item
        carregarTodosOsDados(); 
    };
    
    // As funções handleAbrirFormulario e handleRemover não mudam significativamente
    const handleAbrirFormulario = (item: MateriaPrimaDetalhado | null) => {
        setItemEmEdicao(item);
        setMostrarFormulario(true);
    };

    const handleRemover = async (item: MateriaPrimaDetalhado) => {
        if (!window.confirm(`Tem certeza que deseja remover a matéria-prima "${item.nome}"?`)) return;
        try {
            const res: ApiResponse<null> = await invoke("deletar_materia_prima_tauri", { id: item.id });
            if (res.success) {
                setSuccessMessage(res.message || "Item removido com sucesso!");
                setTimeout(() => setSuccessMessage(null), 3000);
                carregarTodosOsDados(); // Recarrega a lista mestre
            } else {
                setError(res.message || "Falha ao remover item.");
            }
        } catch (err: any) {
            setError(`Erro ao remover: ${err.toString()}`);
        }
    };
    
    if (mostrarFormulario) {
        return <CadastrarMateriaPrima 
            itemParaEdicao={itemEmEdicao} 
            onSalvar={handleSalvar} 
            onCancelar={() => { setMostrarFormulario(false); setItemEmEdicao(null); }} 
        />;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gerenciar Matérias-Primas</h2>
                <button onClick={() => handleAbrirFormulario(null)} className={styles.buttonPrimary}>
                    Nova Matéria-Prima
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.filters}>
                <input 
                    type="text" 
                    placeholder="Buscar em toda a tabela..." 
                    value={filtroTabela} 
                    onChange={(e) => setFiltroTabela(e.target.value)} 
                    className={styles.searchInput}
                />
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            {/* CABEÇALHO CORRIGIDO E COMPLETO */}
                            <th>Descrição</th>
                            <th>Tipo</th>
                            <th>Qtd. Mínima</th>
                            <th>Unidade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className={styles.loadingCell}><div className={styles.spinner}></div></td></tr>
                        ) : dadosExibidos.length > 0 ? (
                            dadosExibidos.map((item) => (
                                <tr key={item.id}>
                                    {/* COLUNAS CORRIGIDAS PARA EXIBIR OS DADOS CORRETAMENTE */}
                                    <td>{item.nome}</td>
                                    <td>{item.nome_tipo}</td>
                                    <td>{item.quantidade_min}</td>
                                    <td>{item.unidade}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button onClick={() => handleAbrirFormulario(item)} className={styles.buttonEdit} disabled={!item.editavel} title={!item.editavel ? "Não é possível editar pois possui registros" : "Editar"}>✏️</button>
                                            <button onClick={() => handleRemover(item)} className={styles.buttonDelete} disabled={!item.editavel} title={!item.editavel ? "Não é possível remover pois possui registros" : "Remover"}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className={styles.empty}>
                                    Nenhuma matéria-prima encontrada{filtroTabela && " para o filtro atual"}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {dadosFiltrados.length > ITENS_POR_PAGINA && (
                <div className={styles.pagination}>
                    <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual <= 1 || loading}>Anterior</button>
                    <span>Página {paginaAtual} de {totalPaginas}</span>
                    <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual >= totalPaginas || loading}>Próxima</button>
                </div>
            )}
        </div>
    );
};

export default VisualizarMateriaPrima;