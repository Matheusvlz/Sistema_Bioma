// Em: src/view/qualidade/VisualizarQualificacoes.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/Visualizar.module.css'; // Reutilizamos o mesmo estilo para consistência!
import { Search, AlertCircle, Eye } from 'lucide-react';

// --- Interfaces ---
interface QualificacaoListagem {
    RELATORIO: string | null;
    FANTASIA: string | null;
    DATA_QUALIFICACAO: string | null;
    VALIDADE: string | null;
    FORNECEDOR_ID: number;
}

// Usamos uma versão simplificada para o dropdown de fornecedores
interface FornecedorParaFiltro {
    ID: number;
    FANTASIA: string | null;
}

interface RespostaPaginadaFornecedores {
    itens: FornecedorParaFiltro[];
    total: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const VisualizarQualificacoes: React.FC = () => {
    // --- Estados ---
    const [qualificacoes, setQualificacoes] = useState<QualificacaoListagem[]>([]);
    const [fornecedores, setFornecedores] = useState<FornecedorParaFiltro[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados dos Filtros
    const [filtroAno, setFiltroAno] = useState<string>('');
    const [filtroFornecedorId, setFiltroFornecedorId] = useState<number>(0);

    // Gera uma lista de anos para o dropdown (ex: 2020 a 2030)
    const getAnosDisponiveis = () => {
        const anoAtual = new Date().getFullYear();
        const anos = [];
        for (let i = anoAtual + 5; i >= 2020; i--) {
            anos.push(i.toString().substring(2)); // Pega apenas '25', '24', etc.
        }
        return anos;
    };

    // --- Lógica de Dados ---
    const carregarDados = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Carrega a lista de todos os fornecedores para o dropdown (se ainda não carregou)
            if (fornecedores.length === 0) {
                // Usamos a listagem principal, mas pedimos muitos itens para garantir que todos venham
                const fornRes = await invoke<ApiResponse<RespostaPaginadaFornecedores>>('listar_fornecedores_tauri', {
                    porPagina: 10000, // Um número grande para buscar todos
                    pagina: 1,
                });
                if (fornRes.success && fornRes.data) {
                    setFornecedores(fornRes.data.itens);
                }
            }
            
            // Busca as qualificações com os filtros aplicados
            const qualRes = await invoke<ApiResponse<QualificacaoListagem[]>>('listar_qualificacoes_tauri', {
                ano: filtroAno || null,
                fornecedorId: filtroFornecedorId,
            });

            if (qualRes.success && qualRes.data) {
                setQualificacoes(qualRes.data);
            } else {
                throw new Error(qualRes.message || 'Falha ao carregar qualificações.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }, [filtroAno, filtroFornecedorId, fornecedores.length]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // --- Handlers ---
    const handleBuscar = () => carregarDados();
    const handleVisualizarFornecedor = (id: number) => {
        // A lógica de navegação ou abertura de modal/formulário iria aqui
        alert(`Navegar para o formulário do Fornecedor ID: ${id}`);
    };

    const isVencido = (data: string | null) => {
        if (!data) return false;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return new Date(`${data}T00:00:00`) < hoje;
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Relatório de Qualificações</h1>
            </header>

            <div className={styles.filterCard} style={{ gridTemplateColumns: '1fr 2fr auto' }}>
                <div className={styles.formGroup}>
                    <label htmlFor="filtroAno">Ano do Relatório</label>
                    <select id="filtroAno" value={filtroAno} onChange={e => setFiltroAno(e.target.value)}>
                        <option value="">Todos</option>
                        {getAnosDisponiveis().map(ano => <option key={ano} value={ano}>{`20${ano}`}</option>)}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="filtroFornecedor">Fornecedor</label>
                    <select id="filtroFornecedor" value={filtroFornecedorId} onChange={e => setFiltroFornecedorId(Number(e.target.value))}>
                        <option value={0}>Todos</option>
                        {fornecedores.sort((a, b) => a.FANTASIA?.localeCompare(b.FANTASIA || '') || 0).map(f => (
                            <option key={f.ID} value={f.ID}>{f.FANTASIA}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.filterActions}>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleBuscar} disabled={isLoading}>
                        <Search size={16} /> Buscar
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                {error && (
                    <div className={styles.errorBanner}>
                        <AlertCircle size={18} /> <span>{error}</span>
                    </div>
                )}
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Relatório</th>
                            <th>Fornecedor (Fantasia)</th>
                            <th>Data Qualificação</th>
                            <th>Validade</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan={5} className={styles.loadingState}>Carregando...</td></tr>
                        ) : qualificacoes.length === 0 ? (
                            <tr><td colSpan={5} className={styles.emptyState}>Nenhuma qualificação encontrada para os filtros selecionados.</td></tr>
                        ) : (
                            qualificacoes.map((q, index) => (
                                <tr key={`${q.FORNECEDOR_ID}-${index}`}>
                                    <td data-label="Relatório">{q.RELATORIO || '-'}</td>
                                    <td data-label="Fornecedor">{q.FANTASIA || '-'}</td>
                                    <td data-label="Data Qualificação">{q.DATA_QUALIFICACAO ? new Date(q.DATA_QUALIFICACAO + 'T00:00:00').toLocaleDateString() : '-'}</td>
                                    <td data-label="Validade" className={isVencido(q.VALIDADE) ? styles.vencido : ''}>
                                        {q.VALIDADE ? new Date(q.VALIDADE + 'T00:00:00').toLocaleDateString() : '-'}
                                    </td>
                                    <td data-label="Ações">
                                        <button onClick={() => handleVisualizarFornecedor(q.FORNECEDOR_ID)} className={`${styles.btnIcon} ${styles.btnEdit}`} title="Visualizar Fornecedor">
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <footer className={styles.footer}>
                <span>Total de registros encontrados: {qualificacoes.length}</span>
            </footer>
        </div>
    );
};

export default VisualizarQualificacoes;