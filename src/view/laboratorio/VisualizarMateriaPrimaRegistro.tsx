import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/VisualizarMateriaPrimaRegistro.module.css';
import CadastrarMateriaPrimaRegistro from './CadastrarMateriaPrimaRegistro';

// --- Interfaces ---

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface DropdownOption {
    id: number;
    nome: string;
}

interface MateriaPrimaRegistroDetalhado {
    id: number;
    fabricante: string | null;
    lote_fabricante: string | null;
    data_fabricacao: string | null;
    validade: string | null;
    nf: string | null;
    quantidade: string | null;
    pureza: string | null;
    observacao: string | null;
    obsoleto: boolean;
    finalizado: boolean;
    ativo: boolean;
    materia_prima_id: number | null;
    nome_materia_prima: string | null;
    unidade: string | null;
    materia_prima_tipo_id: number | null;
    nome_materia_prima_tipo: string | null;
}

interface PaginatedResponse {
    items: MateriaPrimaRegistroDetalhado[];
    total: number;
    page: number;
    per_page: number;
}

// --- Constantes ---
const ITENS_POR_PAGINA = 20;

const VisualizarMateriaPrimaRegistro: React.FC = () => {
    // --- Estados de Filtro ---
    const [tipos, setTipos] = useState<DropdownOption[]>([]);
    const [tipoSelecionado, setTipoSelecionado] = useState<number | null>(null);
    const [materiasPrimas, setMateriasPrimas] = useState<DropdownOption[]>([]);
    const [materiaPrimaSelecionada, setMateriaPrimaSelecionada] = useState<number | null>(null);
    const [mostrarObsoletos, setMostrarObsoletos] = useState(false);
    const [filtroTabela, setFiltroTabela] = useState('');

    // --- Estados da Tabela e UI ---
    const [dados, setDados] = useState<MateriaPrimaRegistroDetalhado[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Estados de Formulário ---
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [itemEmEdicao, setItemEmEdicao] = useState<MateriaPrimaRegistroDetalhado | null>(null);

    // --- Carregamento Inicial (Tipos) ---
    const carregarTipos = async () => {
        try {
            const res: ApiResponse<DropdownOption[]> = await invoke("listar_tipos_materia_prima_tauri");
            if (res.success && res.data) {
                setTipos(res.data);
            } else {
                setError(res.message || "Falha ao carregar tipos de matéria-prima.");
            }
        } catch (err: any) {
            const errorMessage = err.message || err.toString() || "Erro desconhecido";
            setError(`Erro ao carregar tipos: ${errorMessage}`);
        }
    };

    // --- Carregamento de Matérias-Primas (Cascata) ---
    const carregarMateriasPrimas = async (tipoId: number) => {
        try {
            // Chama o endpoint existente que lista MPs filtradas por tipo
            const res: ApiResponse<DropdownOption[]> = await invoke("listar_materia_prima_tauri", { tipoId: tipoId });
            if (res.success && res.data) {
                setMateriasPrimas(res.data);
            } else {
                setMateriasPrimas([]);
            }
        } catch (err: any) {
            const errorMessage = err.message || err.toString() || "Erro desconhecido";
            setError(`Erro ao carregar matérias-primas: ${errorMessage}`);
            setMateriasPrimas([]);
        }
    };

    useEffect(() => {
        setLoading(true);
        carregarTipos().finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (tipoSelecionado) {
            setLoading(true);
            carregarMateriasPrimas(tipoSelecionado).finally(() => setLoading(false));
        } else {
            setMateriasPrimas([]);
            setMateriaPrimaSelecionada(null);
        }
    }, [tipoSelecionado]);

    // --- Carregamento Principal da Tabela ---
    const carregarDados = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res: ApiResponse<PaginatedResponse> = await invoke("listar_materia_prima_registro_tauri", {
                page: paginaAtual,
                perPage: ITENS_POR_PAGINA,
                tipoId: tipoSelecionado,
                materiaPrimaId: materiaPrimaSelecionada,
                mostrarObsoletos: mostrarObsoletos,
            });

            if (res.success && res.data) {
                setDados(res.data.items);
                setTotalPaginas(Math.ceil(res.data.total / res.data.per_page) || 1);
            } else {
                setError(res.message || "Erro ao carregar os dados da tabela.");
                setDados([]);
                setTotalPaginas(1);
            }
        } catch (err: any) {
            const errorMessage = err.message || err.toString() || "Erro desconhecido";
            setError(`Erro ao carregar dados: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }, [paginaAtual, tipoSelecionado, materiaPrimaSelecionada, mostrarObsoletos]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // --- Ações (Salvar, Editar, Remover, Obsoleto) ---

    const handleSalvar = () => {
        setMostrarFormulario(false);
        setItemEmEdicao(null);
        setSuccessMessage("Registro salvo com sucesso!");
        setTimeout(() => setSuccessMessage(null), 3000);
        carregarDados();
    };

    const handleAbrirFormulario = (item: MateriaPrimaRegistroDetalhado | null) => {
        setItemEmEdicao(item);
        setMostrarFormulario(true);
    };

    const handleRemover = async (item: MateriaPrimaRegistroDetalhado) => {
        if (!window.confirm(`Tem certeza que deseja remover o lote "${item.lote_fabricante}"? (ID: ${item.id})`)) return;
        
        try {
            const res: ApiResponse<null> = await invoke("deletar_materia_prima_registro_tauri", { id: item.id });
            if (res.success) {
                setSuccessMessage("Registro removido com sucesso!");
                setTimeout(() => setSuccessMessage(null), 3000);
                carregarDados();
            } else {
                setError(res.message || "Falha ao remover o registro.");
            }
        } catch (err: any) {
            const errorMessage = err.message || err.toString() || "Erro desconhecido";
            setError(`Erro ao remover: ${errorMessage}`);
        }
    };

    const handleToggleObsoleto = async (item: MateriaPrimaRegistroDetalhado) => {
        const novoStatus = !item.obsoleto;
        try {
            const res: ApiResponse<null> = await invoke("atualizar_obsoleto_materia_prima_registro_tauri", {
                id: item.id,
                obsoleto: novoStatus,
            });
            if (res.success) {
                setDados(prev => prev.map(d => d.id === item.id ? { ...d, obsoleto: novoStatus } : d));
                if (!mostrarObsoletos && novoStatus) {
                    setDados(prev => prev.filter(d => d.id !== item.id));
                }
            } else {
                setError(res.message || "Falha ao atualizar status.");
            }
        } catch (err: any) {
            const errorMessage = err.message || err.toString() || "Erro desconhecido";
            setError(`Erro ao atualizar: ${errorMessage}`);
        }
    };

    // --- Helpers ---
    const formatarData = (dataISO: string | null) => {
        if (!dataISO) return '-';
        try {
            const [ano, mes, dia] = dataISO.split('T')[0].split('-');
            return `${dia}/${mes}/${ano}`;
        } catch { return dataISO; }
    };

    const dadosFiltrados = dados.filter(item => {
        const searchTerm = filtroTabela.toLowerCase();
        if (!searchTerm) return true;
        
        // Procura em todos os campos relevantes
        const searchString = `
            ${item.id} 
            ${item.nome_materia_prima} 
            ${item.lote_fabricante} 
            ${item.fabricante}
        `.toLowerCase();
        
        return searchString.includes(searchTerm);
    });

    // --- Renderização ---

    if (mostrarFormulario) {
        return (
            <CadastrarMateriaPrimaRegistro
                itemParaEdicao={itemEmEdicao}
                onSalvar={handleSalvar}
                onCancelar={() => {
                    setMostrarFormulario(false);
                    setItemEmEdicao(null);
                }}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Gerenciar Registros de Matéria-Prima (Lotes)</h2>
                <button onClick={() => handleAbrirFormulario(null)} className={styles.buttonPrimary}>
                    Novo Registro (Lote)
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}

            <div className={styles.filters}>
                <select
                    value={tipoSelecionado || ''}
                    onChange={(e) => setTipoSelecionado(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading}
                >
                    <option value="">Selecione um Tipo</option>
                    {tipos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>

                <select
                    value={materiaPrimaSelecionada || ''}
                    onChange={(e) => setMateriaPrimaSelecionada(e.target.value ? Number(e.target.value) : null)}
                    disabled={loading || !tipoSelecionado}
                >
                    <option value="">Selecione uma Matéria-Prima</option>
                    {materiasPrimas.map(mp => <option key={mp.id} value={mp.id}>{mp.nome}</option>)}
                </select>

                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={mostrarObsoletos}
                        onChange={(e) => setMostrarObsoletos(e.target.checked)}
                        disabled={loading}
                    />
                    Mostrar obsoletos
                </label>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <input
                        type="text"
                        placeholder="Buscar por ID, Nome ou Lote..."
                        value={filtroTabela}
                        onChange={(e) => setFiltroTabela(e.target.value)}
                        className={styles.searchInput}
                        disabled={loading || dados.length === 0}
                    />
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>ID</th>
                            <th style={{ minWidth: '200px' }}>Matéria-Prima</th>
                            <th style={{ minWidth: '180px' }}>Lote / Fabricante</th>
                            <th style={{ minWidth: '100px' }}>Fabricação</th>
                            <th style={{ minWidth: '100px' }}>Validade</th>
                            <th style={{ minWidth: '120px' }}>Qtd. / Pureza</th>
                            <th style={{ width: '80px', textAlign: 'center' }}>Obsol.</th>
                            <th style={{ width: '100px', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && dados.length === 0 ? (
                            <tr><td colSpan={8} className={styles.loadingCell}><div className={styles.spinner}></div></td></tr>
                        ) : dadosFiltrados.length > 0 ? (
                            dadosFiltrados.map((item) => (
                                <tr key={item.id} className={item.obsoleto ? styles.obsoleto : ''}>
                                    <td>{item.id}</td>
                                    <td>
                                        <strong>{item.nome_materia_prima || '-'}</strong>
                                        <small style={{ display: 'block', color: '#666' }}>{item.nome_materia_prima_tipo || '-'}</small>
                                    </td>
                                    <td>
                                        <strong>{item.lote_fabricante || '-'}</strong>
                                        <small style={{ display: 'block', color: '#666' }}>{item.fabricante || '-'}</small>
                                    </td>
                                    <td>{formatarData(item.data_fabricacao)}</td>
                                    <td>{formatarData(item.validade)}</td>
                                    <td>
                                        <strong>{item.quantidade || '0'} {item.unidade || ''}</strong>
                                        <small style={{ display: 'block', color: '#666' }}>{item.pureza || '0'}%</small>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            checked={item.obsoleto}
                                            onChange={() => handleToggleObsoleto(item)}
                                            title="Marcar como obsoleto"
                                        />
                                    </td>
                                    <td>
                                        <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                            <button onClick={() => handleAbrirFormulario(item)} className={styles.buttonEdit} title="Editar">✏️</button>
                                            <button onClick={() => handleRemover(item)} className={styles.buttonDelete} title="Remover">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className={styles.empty}>
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {dados.length > 0 && totalPaginas > 1 && (
                <div className={styles.pagination}>
                    <button onClick={() => setPaginaAtual(p => p - 1)} disabled={paginaAtual <= 1 || loading}>Anterior</button>
                    <span>Página {paginaAtual} de {totalPaginas}</span>
                    <button onClick={() => setPaginaAtual(p => p + 1)} disabled={paginaAtual >= totalPaginas || loading}>Próxima</button>
                </div>
            )}
        </div>
    );
};

export default VisualizarMateriaPrimaRegistro;