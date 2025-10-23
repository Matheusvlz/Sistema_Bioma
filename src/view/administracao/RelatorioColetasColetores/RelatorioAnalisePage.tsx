// Ficheiro: src/view/administracao/RelatorioAnalise/RelatorioAnalisePage.tsx

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FiDownload, FiPrinter, FiSearch } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import styles from './RelatorioAnalise.module.css';

import {
    ApiResponse, PaginatedResponse, AnaliseDetalhada, AnaliseAgregada, Filtros, FiltrosPayload, KpiData, DropdownOption, ClienteDropdown, UsuarioDropdown
} from './types';
import { BarraFerramentas } from './components/BarraFerramentas';
import { KpiDashboard } from './components/KpiDashboard';
import { TabelaDetalhada } from './components/TabelaDetalhada';
import { TabelaAgregada } from './components/TabelaAgregada';
import { PdfOptionsModal } from './components/PdfOptionsModal';
import { generatePdf } from './pdfGenerator';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Componente de overlay para feedback visual durante a geração do PDF
const LoadingOverlay: React.FC<{ text: string }> = ({ text }) => (
    <div className={styles.loadingOverlay}>
        <div className={styles.loadingSpinner}></div>
        {text}
    </div>
);


const RelatorioAnalisePage: React.FC = () => {
    const hoje = new Date().toISOString().split('T')[0];
    
    // --- ESTADOS PRINCIPAIS ---
    const [filtros, setFiltros] = useState<Filtros>({ clienteId: null, coletorId: null, cidade: null, dataInicial: hoje, dataFinal: hoje });
    const [dadosDetalhados, setDadosDetalhados] = useState<AnaliseDetalhada[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(0);
    const [totalItens, setTotalItens] = useState(0);
    const [dadosAgregados, setDadosAgregados] = useState<AnaliseAgregada[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'detalhado' | 'agregado'>('detalhado');
    const [buscaRapida, setBuscaRapida] = useState('');
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [loadingStateText, setLoadingStateText] = useState<string | null>(null);
    const [dropdownData, setDropdownData] = useState<{ clientes: DropdownOption[], coletores: DropdownOption[] }>({ clientes: [], coletores: [] });

    const chartRef = useRef<ChartJS<'bar'>>(null);

    // --- BUSCA DE DADOS PARA FILTROS (DROPDOWNS) ---
    useEffect(() => {
        const carregarDropdowns = async () => {
            try {
                const [resClientes, resColetores] = await Promise.all([
                    invoke<ApiResponse<ClienteDropdown[]>>('get_clientes_analise_command'),
                    invoke<ApiResponse<UsuarioDropdown[]>>('get_coletores_analise_command'),
                ]);
                const clientesOpts = (resClientes.success && resClientes.data) ? resClientes.data.map(c => ({ value: c.id, label: c.nome_fantasia })) : [];
                const coletoresOpts = (resColetores.success && resColetores.data) ? resColetores.data.map(u => ({ value: u.id, label: u.nome })) : [];
                setDropdownData({ clientes: clientesOpts, coletores: coletoresOpts });
            } catch (error) {
                console.error("Erro ao carregar dados dos filtros:", error);
                setError("Falha ao carregar opções de filtros.");
            }
        };
        carregarDropdowns();
    }, []);

    // --- FUNÇÃO DE BUSCA DE DADOS REUTILIZÁVEL ---
    const buscarDados = useCallback(async (
        payloadOverride: Partial<FiltrosPayload> = {},
        view: 'detalhado' | 'agregado'
    ) => {
        const finalPayload: FiltrosPayload = { ...filtros, buscaRapida: buscaRapida, page: paginaAtual, per_page: 20, ...payloadOverride };
        try {
            if (view === 'detalhado') {
                const res = await invoke<ApiResponse<PaginatedResponse<AnaliseDetalhada>>>('get_analises_detalhadas_command', { payload: finalPayload });
                if (res.success && res.data) return res.data;
                throw new Error(res.message || "Erro ao buscar dados detalhados.");
            } else {
                const res = await invoke<ApiResponse<AnaliseAgregada[]>>('get_analise_agregada_command', { payload: finalPayload });
                if (res.success && res.data) return res.data;
                throw new Error(res.message || "Erro ao buscar dados agregados.");
            }
        } catch (err: any) {
            console.error("Falha no comando Tauri:", err);
            setError(err.message || "Ocorreu um erro desconhecido.");
            throw err;
        }
    }, [filtros, paginaAtual, buscaRapida]);

    // --- EFEITOS PARA CONTROLE DA TELA ---
    useEffect(() => {
        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                setError(null);
                if (viewMode === 'detalhado') {
                    const data = await buscarDados({}, 'detalhado') as PaginatedResponse<AnaliseDetalhada>;
                    setDadosDetalhados(data.items);
                    setTotalItens(data.total);
                    setTotalPaginas(Math.ceil(data.total / data.per_page));
                } else {
                    const data = await buscarDados({}, 'agregado') as AnaliseAgregada[];
                    setDadosAgregados(data);
                    setTotalItens(data.length);
                    setTotalPaginas(1);
                }
            } catch (e) { /* Erro já tratado em buscarDados */ } 
            finally { setLoading(false); }
        }, 500);
        return () => clearTimeout(timer);
    }, [buscarDados, viewMode]);
    
    useEffect(() => {
        if (paginaAtual !== 1) setPaginaAtual(1);
    }, [filtros, viewMode, buscaRapida]);

    // --- LÓGICA DE GERAÇÃO DE PDF ---
    const handleConfirmPdf = async (options: { tipo: 'detalhado' | 'agregado' }) => {
        setIsPdfModalOpen(false);
        setLoadingStateText("Buscando todos os registros para o PDF...");
        try {
            const payloadPdf: FiltrosPayload = { ...filtros, buscaRapida: buscaRapida, export: true };
            
            let todosOsDadosParaPdf: any[] = [];
            
            if (options.tipo === 'detalhado') {
                const res = await invoke<ApiResponse<PaginatedResponse<AnaliseDetalhada>>>('get_analises_detalhadas_command', { payload: payloadPdf });
                if (res.success && res.data) {
                    todosOsDadosParaPdf = res.data.items;
                } else {
                    throw new Error(res.message || "Falha ao buscar dados completos para o PDF detalhado.");
                }
            } else {
                const res = await invoke<ApiResponse<AnaliseAgregada[]>>('get_analise_agregada_command', { payload: payloadPdf });
                if (res.success && res.data) {
                    todosOsDadosParaPdf = res.data;
                } else {
                    throw new Error(res.message || "Falha ao buscar dados completos para o PDF agregado.");
                }
            }

            if (todosOsDadosParaPdf.length === 0) {
                alert("Nenhum dado encontrado com os filtros atuais para gerar o relatório.");
                setLoadingStateText(null);
                return;
            }

            setLoadingStateText("Preparando gráfico e montando PDF...");
            let chartImage: string | null = null;
            let dadosAgregadosParaGrafico: AnaliseAgregada[] = [];

            if (options.tipo === 'agregado') {
                dadosAgregadosParaGrafico = todosOsDadosParaPdf as AnaliseAgregada[];
            } else {
                const resAgregado = await invoke<ApiResponse<AnaliseAgregada[]>>('get_analise_agregada_command', { payload: payloadPdf });
                if (resAgregado.success && resAgregado.data) {
                    dadosAgregadosParaGrafico = resAgregado.data;
                }
            }

            if (chartRef.current && dadosAgregadosParaGrafico.length > 0) {
                chartRef.current.data.labels = dadosAgregadosParaGrafico.slice(0, 5).map(d => d.cliente_fantasia.substring(0, 20) + '...');
                chartRef.current.data.datasets[0].data = dadosAgregadosParaGrafico.slice(0, 5).map(d => d.total_coletas);
                chartRef.current.update();
                chartImage = chartRef.current.toBase64Image();
            }
            
            await generatePdf(options, todosOsDadosParaPdf, filtros, dropdownData, chartImage);
        } catch (e: any) {
            console.error("Erro ao gerar PDF:", e);
            alert(`Ocorreu um erro ao gerar o PDF: ${e.message || 'Erro desconhecido'}`);
        } finally {
            setLoadingStateText(null);
        }
    };
    
    const kpiData = useMemo<KpiData>(() => ({ total: totalItens, coletado: totalItens, agendado: 0, aproveitamento: '100'}), [totalItens]);

    const chartData = useMemo(() => ({
        labels: [], datasets: [{ label: 'Total de Coletas', data: [], backgroundColor: 'rgba(0, 106, 78, 0.6)', borderColor: 'rgba(0, 106, 78, 1)', borderWidth: 1, }],
    }), []);
    
    return (
        <div className={styles.pageLayout}>
            {loadingStateText && <LoadingOverlay text={loadingStateText} />}
            <PdfOptionsModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} onConfirm={handleConfirmPdf} />
            <div style={{ width: '800px', height: '400px', position: 'absolute', zIndex: -1, left: '-9999px', top: 0 }}>
                <Bar ref={chartRef} data={chartData} options={{ animation: { duration: 0 }, responsive: true, plugins: { legend: { display: false } } }} />
            </div>
            <header className={styles.headerGlobal}>
                <div className={styles.headerTitles}>
                    <h1>Relatório de Análise Operacional</h1>
                    <p>Visualize, filtre e gerencie o desempenho das coletas.</p>
                </div>
                <div className={styles.headerActions}>
                    <button onClick={() => alert('Exportar Excel a ser implementado!')} className={styles.actionButtonSecondary} disabled={!!loadingStateText}>
                        <FiDownload /> Exportar (Excel)
                    </button>
                    <button onClick={() => setIsPdfModalOpen(true)} className={styles.actionButtonSecondary} disabled={!!loadingStateText}>
                        <FiPrinter /> Gerar PDF
                    </button>
                </div>
            </header>
            <KpiDashboard data={kpiData} />
            <BarraFerramentas filtros={filtros} onFiltroChange={setFiltros} viewMode={viewMode} onViewModeChange={setViewMode} />
            <main className={styles.mainContent}>
                <div className={styles.dataHeader}>
                    <div className={styles.searchDataWrapper}>
                        <FiSearch className={styles.searchIcon} />
                        <input type="text" placeholder="Busca rápida por cliente, coletor ou cidade..." className={styles.searchInput} value={buscaRapida} onChange={(e) => setBuscaRapida(e.target.value)} />
                    </div>
                    <div className={styles.dataActions}>
                        <span className={styles.statsText}>
                            Exibindo {totalItens > 0 ? Math.min((paginaAtual - 1) * 20 + 1, totalItens) : 0}-
                            {Math.min(paginaAtual * 20, totalItens)} de {totalItens}
                        </span>
                    </div>
                </div>
                <div className={styles.dataContainer}>
                    {loading && <div className={styles.loadingState}>Carregando dados...</div>}
                    {error && <div className={styles.errorState}>{error}</div>}
                    {!loading && !error && totalItens === 0 && (<div className={styles.emptyState}>Nenhuma coleta encontrada para os filtros selecionados.</div>)}
                    {!loading && !error && totalItens > 0 && (viewMode === 'detalhado' ? <TabelaDetalhada dados={dadosDetalhados} /> : <TabelaAgregada dados={dadosAgregados} />)}
                </div>
                {viewMode === 'detalhado' && !loading && totalPaginas > 1 && (
                    <div className={styles.paginationFooter}>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(page => (
                            <button key={page} onClick={() => setPaginaAtual(page)} className={paginaAtual === page ? styles.activePage : ''}>{page}</button>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default RelatorioAnalisePage;