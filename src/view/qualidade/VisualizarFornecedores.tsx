import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/Visualizar.module.css';

// Ícones
import { Search, Plus, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, Pencil, Trash2, AlertCircle } from 'lucide-react';

// IMPORTANDO SEU FORMULÁRIO
import FormularioFornecedor from './FormularioFornecedor'; 

// --- Interfaces ---
interface FornecedorListagem {
    ID: number;
    FANTASIA: string | null;
    NOME: string | null;
    DOCUMENTO: string | null;
    CONTATO: string | null; // Adicionado para cobrir todos os campos da API
    QUALIFICADO: number | null;
    OBSOLETO: boolean | null;
    QUALIFICACAO_DESCRICAO: string | null;
    QUALIFICACAO_VALIDADE: string | null;
}

interface RespostaPaginada {
    itens: FornecedorListagem[];
    total: number;
}

interface FornecedorCategoria {
    ID: number;
    NOME: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface FornecedorDetalhado {
    id: number;
    // Adicione outros campos se precisar usar os dados retornados
}

const ITENS_POR_PAGINA = 20;

const VisualizarFornecedores: React.FC = () => {
    // --- Estados da Aplicação ---
    const [fornecedores, setFornecedores] = useState<FornecedorListagem[]>([]);
    const [categorias, setCategorias] = useState<FornecedorCategoria[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estados de Paginação
    const [totalItens, setTotalItens] = useState(0);
    const [paginaAtual, setPaginaAtual] = useState(1);
    
    // Estados dos Filtros
    const [filtroTexto, setFiltroTexto] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState(0);
    const [filtroQualificado, setFiltroQualificado] = useState(99);

    // --- ESTADOS PARA CONTROLAR O FORMULÁRIO (REINTRODUZIDOS) ---
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | undefined>(undefined);

    const totalPaginas = Math.ceil(totalItens / ITENS_POR_PAGINA);

    const carregarDados = useCallback(async (pagina = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            if (categorias.length === 0) {
                const catRes = await invoke<ApiResponse<FornecedorCategoria[]>>('listar_categorias_fornecedor_tauri');
                if (catRes.success && catRes.data) {
                    setCategorias(catRes.data);
                } else {
                    console.error("Erro ao carregar categorias:", catRes.message);
                }
            }

            const fornRes = await invoke<ApiResponse<RespostaPaginada>>('listar_fornecedores_tauri', {
                filtroTexto: filtroTexto || null,
                categoriaId: filtroCategoria,
                qualificado: filtroQualificado,
                pagina: pagina,
                porPagina: ITENS_POR_PAGINA,
            });

            if (fornRes.success && fornRes.data) {
                setFornecedores(fornRes.data.itens);
                setTotalItens(fornRes.data.total);
                setPaginaAtual(pagina);
            } else {
                throw new Error(fornRes.message || 'Falha ao carregar fornecedores.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }, [filtroTexto, filtroCategoria, filtroQualificado, categorias.length]);

    useEffect(() => {
        carregarDados(1);
    }, [carregarDados]);

    // --- Handlers de Interação ---
    const handleBuscar = () => carregarDados(1);
    
    const handleNovo = () => {
        setEditingId(undefined);
        setIsFormOpen(true);
    };

    const handleEditar = (id: number) => {
        setEditingId(id);
        setIsFormOpen(true);
    };
    
    const handleExcluir = async (id: number) => {
        if (confirm(`Tem certeza que deseja excluir o fornecedor?`)) {
            try {
                await invoke('deletar_fornecedor_tauri', { id });
                const novaPagina = fornecedores.length === 1 && paginaAtual > 1 ? paginaAtual - 1 : paginaAtual;
                carregarDados(novaPagina);
            } catch (err: any) {
                setError(err.message || "Erro ao excluir fornecedor.");
            }
        }
    };
    
    // --- Handlers de Callback do Formulário ---
    const handleFormSave = (savedData: FornecedorDetalhado) => {
        setIsFormOpen(false);
        const paginaParaRecarregar = editingId ? paginaAtual : totalPaginas > 0 ? totalPaginas : 1;
        carregarDados(paginaParaRecarregar); 
    };
    
    const handleFormCancel = () => {
        setIsFormOpen(false);
    };

    // --- Funções de Renderização Auxiliares ---
    const getStatusQualificado = (status: number | null) => {
        if (status === 1) return <span className={`${styles.badge} ${styles.success}`}>Sim</span>;
        if (status === 0) return <span className={`${styles.badge} ${styles.danger}`}>Não</span>;
        if (status === -1) return <span className={`${styles.badge} ${styles.warning}`}>N.A.</span>;
        return <span className={`${styles.badge}`}>-</span>;
    };

    const isVencido = (data: string | null) => {
        if (!data) return false;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return new Date(`${data}T00:00:00`) < hoje;
    };
    
    // --- Renderização Condicional ---
    if (isFormOpen) {
        return (
            <FormularioFornecedor 
                fornecedorId={editingId} 
                onSave={handleFormSave} 
                onCancel={handleFormCancel} 
            />
        );
    }
    
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Gestão de Fornecedores</h1>
            </header>

            <div className={styles.filterCard}>
                <div className={styles.formGroup}>
                    <label htmlFor="filtroTexto">Fornecedor / Fantasia</label>
                    <input id="filtroTexto" type="text" value={filtroTexto} onChange={e => setFiltroTexto(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleBuscar()} />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="filtroCategoria">Categoria</label>
                    <select id="filtroCategoria" value={filtroCategoria} onChange={e => setFiltroCategoria(Number(e.target.value))}>
                        <option value={0}>Todas</option>
                        {categorias.map(c => <option key={c.ID} value={c.ID}>{c.NOME}</option>)}
                    </select>
                </div>
                <div className={styles.formGroup}>
                    <label>Qualificado</label>
                    <div className={styles.radioGroup}>
                        {[[99, 'Todos'], [1, 'Sim'], [0, 'Não'], [-1, 'N.A.']].map(([value, label]) => (
                            <React.Fragment key={value}>
                                <input type="radio" id={`q_${value}`} name="qualificado" value={value} checked={filtroQualificado === value} onChange={e => setFiltroQualificado(Number(e.target.value))} />
                                <label htmlFor={`q_${value}`}>{label}</label>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                <div className={styles.filterActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleBuscar} disabled={isLoading}>
                        <Search size={16} /> Buscar
                    </button>
                    <button className={`${styles.btn} ${styles.btnSuccess}`} onClick={handleNovo}>
                        <Plus size={16} /> Novo
                    </button>
                </div>
            </div>
            
            <div className={styles.tableContainer}>
                {error && (
                    <div className={styles.errorBanner}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Fantasia</th>
                            <th>Fornecedor (Razão Social)</th>
                            <th>Documento</th>
                            <th>Contato</th>
                            <th>Qualificado</th>
                            <th>Última Qualificação</th>
                            <th>Validade</th>
                            <th>Obsoleto</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={9} className={styles.loadingState}>Carregando dados...</td></tr>
                        ) : fornecedores.length === 0 ? (
                            <tr><td colSpan={9} className={styles.emptyState}>Nenhum fornecedor encontrado.</td></tr>
                        ) : (
                            fornecedores.map(f => (
                                <tr key={f.ID}>
                                    <td data-label="Fantasia">{f.FANTASIA || '-'}</td>
                                    <td data-label="Fornecedor">{f.NOME || '-'}</td>
                                    <td data-label="Documento">{f.DOCUMENTO || '-'}</td>
                                    <td data-label="Contato">{f.CONTATO || '-'}</td>
                                    <td data-label="Qualificado">{getStatusQualificado(f.QUALIFICADO)}</td>
                                    <td data-label="Qualificação">{f.QUALIFICACAO_DESCRICAO || '-'}</td>
                                    <td data-label="Validade" className={isVencido(f.QUALIFICACAO_VALIDADE) ? styles.vencido : ''}>
                                        {f.QUALIFICACAO_VALIDADE ? new Date(f.QUALIFICACAO_VALIDADE + 'T00:00:00').toLocaleDateString() : '-'}
                                    </td>
                                    <td data-label="Obsoleto">{f.OBSOLETO ? 'Sim' : 'Não'}</td>
                                    <td data-label="Ações">
                                        <div className={styles.actionButtons}>
                                            <button onClick={() => handleEditar(f.ID)} className={`${styles.btnIcon} ${styles.btnEdit}`} title="Visualizar / Editar"><Pencil size={16} /></button>
                                            <button onClick={() => handleExcluir(f.ID)} className={`${styles.btnIcon} ${styles.btnDelete}`} title="Excluir"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <footer className={styles.footer}>
                <span>Exibindo {fornecedores.length > 0 ? ((paginaAtual - 1) * ITENS_POR_PAGINA) + 1 : 0} - {Math.min(paginaAtual * ITENS_POR_PAGINA, totalItens)} de {totalItens}</span>
                <div className={styles.pagination}>
                    <button onClick={() => carregarDados(1)} disabled={paginaAtual <= 1 || isLoading}><ChevronsLeft size={16}/></button>
                    <button onClick={() => carregarDados(paginaAtual - 1)} disabled={paginaAtual <= 1 || isLoading}><ChevronLeft size={16}/></button>
                    <span>Página {paginaAtual} de {totalPaginas > 0 ? totalPaginas : 1}</span>
                    <button onClick={() => carregarDados(paginaAtual + 1)} disabled={paginaAtual >= totalPaginas || isLoading}><ChevronRight size={16}/></button>
                    <button onClick={() => carregarDados(totalPaginas)} disabled={paginaAtual >= totalPaginas || isLoading}><ChevronsRight size={16}/></button>
                </div>
            </footer>
        </div>
    );
};

export default VisualizarFornecedores;