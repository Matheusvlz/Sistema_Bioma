import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/AnaliseAtividadesPage.module.css';
import { FiDownload, FiSearch, FiGrid, FiList, FiPrinter } from 'react-icons/fi';
import * as XLSX from 'xlsx';

// --- DEFINIÇÕES DE TIPOS ---
interface AtividadeAnalise {
    coletor_nome: string;
    cliente_fantasia: string;
    cidade: string;
    endereco: string | null;
    bairro: string | null;
    numero: string | null;
    status: 'Coletado' | 'Agendado';
    dataHora: string;
}
interface BackendDropdownOption {
    id: number;
    nome: string; 
    nome_fantasia: string;
}
interface FrontendDropdownOption {
    value: number;
    label: string;
}
interface CidadeOption { value: string; label: string; }
interface Filtros {
    clienteId: number | null;
    coletorId: number | null;
    cidade: string | null;
    dataInicial: string;
    dataFinal: string;
}
interface KpiData {
    totalAtividades: number;
    totalColetado: number;
    totalAgendado: number;
    taxaDeSucesso: number;
}


// --- SUB-COMPONENTES ---

const HeaderGlobal: React.FC<{ onExport: () => void }> = ({ onExport }) => (
    <header className={styles.headerGlobal}>
        <div className={styles.headerTitles}>
            <h1>Relatório de Coletores</h1>
            <p>Visualize, filtre e gerencie o desempenho das coletas e agendamentos.</p>
        </div>
        <div className={styles.headerActions}>
            <button onClick={onExport} className={styles.actionButtonSecondary}>
                <FiDownload /> Exportar Relatório (Excel)
            </button>
        </div>
    </header>
);

const KpiDashboard: React.FC<{ data: KpiData }> = ({ data }) => (
    <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
            <span className={styles.kpiValue}>{data.totalAtividades}</span>
            <span className={styles.kpiTitle}>Atividades no Período</span>
        </div>
        <div className={styles.kpiCard}>
            <span className={styles.kpiValue}>{data.totalColetado}</span>
            <span className={styles.kpiTitle}>Coletas Realizadas</span>
        </div>
        <div className={styles.kpiCard}>
            <span className={styles.kpiValue}>{data.totalAgendado}</span>
            <span className={styles.kpiTitle}>Agendamentos Pendentes</span>
        </div>
        <div className={styles.kpiCard}>
            <span className={styles.kpiValue}>{data.taxaDeSucesso}%</span>
            <span className={styles.kpiTitle}>Taxa de Sucesso</span>
        </div>
    </section>
);

const BarraFerramentas: React.FC<{
    filtros: Filtros;
    onFilterChange: (newFilters: Filtros) => void;
    viewMode: 'tabela' | 'cards';
    onViewModeChange: (mode: 'tabela' | 'cards') => void;
}> = ({ filtros, onFilterChange, viewMode, onViewModeChange }) => {
    const [clientes, setClientes] = useState<FrontendDropdownOption[]>([]);
    const [coletores, setColetores] = useState<FrontendDropdownOption[]>([]);
    const [cidades, setCidades] = useState<CidadeOption[]>([]);

    useEffect(() => {
        invoke<BackendDropdownOption[]>('get_clientes_analise_command')
            .then(data => setClientes(data.map(c => ({ value: c.id, label: c.nome_fantasia }))))
            .catch(console.error);
        invoke<BackendDropdownOption[]>('get_coletores_analise_command')
            .then(users => setColetores(users.map(u => ({ value: u.id, label: u.nome }))))
            .catch(console.error);
        invoke<{ cidade: string }[]>('get_cidades_analise_command')
            .then(cidadesResult => setCidades(cidadesResult.map(c => ({ value: c.cidade, label: c.cidade }))))
            .catch(console.error);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newFilters = { ...filtros, [name]: value === '' ? null : (name === 'clienteId' || name === 'coletorId' ? parseInt(value, 10) : value) };
        onFilterChange(newFilters);
    };

    const limparFiltros = () => {
        const hoje = new Date().toISOString().split('T')[0];
        onFilterChange({ clienteId: null, coletorId: null, cidade: null, dataInicial: hoje, dataFinal: hoje });
    };

    return (
        <div className={styles.toolbarContainer}>
            <div className={styles.toolbar}>
                <div className={`${styles.filtroItem} ${styles.filtroPeriodo}`}>
                    <label>Período</label>
                    <div className={styles.dateRangePicker}>
                        <input type="date" name="dataInicial" value={filtros.dataInicial} onChange={handleInputChange} />
                        <span>-</span>
                        <input type="date" name="dataFinal" value={filtros.dataFinal} onChange={handleInputChange} />
                    </div>
                </div>
                <div className={styles.filtroItem}>
                    <label>Cliente</label>
                    <select name="clienteId" value={filtros.clienteId ?? ''} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        {clientes.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <div className={styles.filtroItem}>
                    <label>Coletor</label>
                    <select name="coletorId" value={filtros.coletorId ?? ''} onChange={handleInputChange}>
                        <option value="">Todos</option>
                        {coletores.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <div className={styles.filtroItem}>
                    <label>Cidade</label>
                    <select name="cidade" value={filtros.cidade ?? ''} onChange={handleInputChange}>
                        <option value="">Todas</option>
                        {cidades.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
                <div className={styles.toolbarActions}>
                    <div className={styles.viewToggle}>
                        <button onClick={() => onViewModeChange('tabela')} className={viewMode === 'tabela' ? styles.active : ''} title="Visualizar em Tabela"><FiList /></button>
                        <button onClick={() => onViewModeChange('cards')} className={viewMode === 'cards' ? styles.active : ''} title="Visualizar em Cartões"><FiGrid /></button>
                    </div>
                    <button onClick={limparFiltros} className={styles.limparButton}>Limpar Tudo</button>
                </div>
            </div>
        </div>
    );
};

const TabelaAtividades: React.FC<{ atividades: AtividadeAnalise[] }> = ({ atividades }) => {
    const formatarDataHora = (dataString: string) => new Date(dataString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const formatarEndereco = (item: AtividadeAnalise) => [item.endereco, item.numero, item.bairro, item.cidade].filter(Boolean).join(', ');
    return (
        <table className={styles.dataTable}>
            <thead>
                <tr>
                    <th>Cliente</th><th>Coletor</th><th>Endereço Completo</th><th>Data & Hora</th><th>Status</th>
                </tr>
            </thead>
            <tbody>
                {atividades.map((item, index) => (
                    <tr key={index}>
                        <td>{item.cliente_fantasia}</td><td>{item.coletor_nome}</td><td>{formatarEndereco(item)}</td><td>{formatarDataHora(item.dataHora)}</td>
                        <td><span className={`${styles.statusBadge} ${item.status === 'Coletado' ? styles.coletado : styles.agendado}`}>{item.status}</span></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const CardsAtividades: React.FC<{ atividades: AtividadeAnalise[] }> = ({ atividades }) => {
    const atividadesPorColetor = useMemo(() => {
        return atividades.reduce((acc, atividade) => {
            (acc[atividade.coletor_nome] = acc[atividade.coletor_nome] || []).push(atividade);
            return acc;
        }, {} as Record<string, AtividadeAnalise[]>);
    }, [atividades]);
    
    const formatarDataHora = (dataString: string) => new Date(dataString).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const formatarEndereco = (item: AtividadeAnalise) => [item.endereco, item.numero, item.bairro].filter(Boolean).join(', ');
    return (
        <div className={styles.cardsContainer}>
            {Object.entries(atividadesPorColetor).map(([coletor, listaAtividades]) => (
                <div key={coletor} className={styles.collectorGroup}>
                    <h3 className={styles.collectorName}>{coletor}</h3>
                    <div className={styles.activitiesGrid}>
                        {listaAtividades.map((item, index) => (
                            <div key={index} className={styles.activityCard}>
                                <div className={styles.cardHeader}>
                                    <strong>{item.cliente_fantasia}</strong>
                                    <span className={`${styles.statusBadge} ${item.status === 'Coletado' ? styles.coletado : styles.agendado}`}>{item.status}</span>
                                </div>
                                <div className={styles.cardBody}><p>{formatarEndereco(item)}</p><p>{item.cidade}</p></div>
                                <div className={styles.cardFooter}><span>{formatarDataHora(item.dataHora)}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const AnaliseAtividadesPage: React.FC = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const [filtros, setFiltros] = useState<Filtros>({ clienteId: null, coletorId: null, cidade: null, dataInicial: hoje, dataFinal: hoje });
    const [atividades, setAtividades] = useState<AtividadeAnalise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buscaRapida, setBuscaRapida] = useState('');
    const [viewMode, setViewMode] = useState<'tabela' | 'cards'>('tabela');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    
    const formatarEndereco = (item: AtividadeAnalise) => [item.endereco, item.numero, item.bairro, item.cidade].filter(Boolean).join(', ');

    useEffect(() => {
        const buscarDados = async () => {
            setLoading(true);
            setError(null);
            setCurrentPage(1);
            try {
                const resultado = await invoke<AtividadeAnalise[]>('get_atividades_filtradas_command', { ...filtros });
                setAtividades(resultado);
            } catch (err) {
                console.error("Erro ao buscar atividades:", err);
                setError("Falha ao carregar os dados. Verifique a conexão e tente novamente.");
            } finally {
                setLoading(false);
            }
        };
        buscarDados();
    }, [filtros]);

    const { paginatedData, totalPages, startItem, endItem, totalItems, filteredData } = useMemo(() => {
        const filtered = atividades.filter(item => {
            const searchTerm = buscaRapida.toLowerCase();
            return item.cliente_fantasia.toLowerCase().includes(searchTerm) ||
                   item.coletor_nome.toLowerCase().includes(searchTerm) ||
                   formatarEndereco(item).toLowerCase().includes(searchTerm);
        });
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginatedData = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        return { paginatedData, totalPages, totalItems, startItem: totalItems > 0 ? startIndex + 1 : 0, endItem: Math.min(startIndex + ITEMS_PER_PAGE, totalItems), filteredData: filtered };
    }, [atividades, buscaRapida, currentPage]);

    const kpiData = useMemo<KpiData>(() => {
        const totalAtividades = atividades.length;
        const totalColetado = atividades.filter(a => a.status === 'Coletado').length;
        const totalAgendado = totalAtividades - totalColetado;
        const taxaDeSucesso = totalAtividades > 0 ? Math.round((totalColetado / totalAtividades) * 100) : 0;
        return { totalAtividades, totalColetado, totalAgendado, taxaDeSucesso };
    }, [atividades]);

    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            alert("Não há dados para exportar com os filtros atuais.");
            return;
        }
        try {
            const dataToExport = filteredData.map(item => ({
                'Cliente': item.cliente_fantasia, 'Coletor': item.coletor_nome,
                'Endereço': `${item.endereco || ''}, ${item.numero || ''}`,
                'Bairro': item.bairro, 'Cidade': item.cidade, 'Status': item.status,
                'Data': new Date(item.dataHora).toLocaleDateString('pt-BR'),
                'Hora': new Date(item.dataHora).toLocaleTimeString('pt-BR'),
            }));
    
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            ws['!cols'] = [ { wch: 30 }, { wch: 20 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 } ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Relatório de Atividades");
            
            const defaultFileName = `Relatorio_Atividades_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, defaultFileName);
        } catch (error) {
            console.error("Ocorreu um erro ao gerar o arquivo Excel:", error);
            alert("Não foi possível gerar o arquivo Excel. Verifique o console para mais detalhes.");
        }
    };
    
    const handlePrint = () => window.print();

    return (
        <div className={styles.pageLayout}>
            <div className={styles.printOnly}>
                <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Relatório de Atividades de Coletores</h1>
                <TabelaAtividades atividades={filteredData} />
            </div>

            <HeaderGlobal onExport={handleExportExcel} />
            <KpiDashboard data={kpiData} />
            <BarraFerramentas 
                filtros={filtros} 
                onFilterChange={setFiltros} 
                viewMode={viewMode} 
                onViewModeChange={setViewMode} 
            />
            
            <main className={styles.mainContent}>
                <div className={styles.dataHeader}>
                    <div className={styles.searchDataWrapper}>
                         <FiSearch className={styles.searchIcon} />
                         <input 
                            type="text" 
                            placeholder="Busca rápida por cliente, endereço ou coletor..." 
                            className={styles.searchInput} 
                            value={buscaRapida} 
                            onChange={(e) => setBuscaRapida(e.target.value)} 
                         />
                    </div>
                    <div className={styles.dataActions}>
                        <span className={styles.statsText}>Exibindo {startItem}-{endItem} de {totalItems} atividades</span>
                        <select className={styles.orderSelect}>
                            <option>Data (Mais Recente)</option>
                            <option>Cliente (A-Z)</option>
                            <option>Coletor (A-Z)</option>
                        </select>
                        <button onClick={handlePrint} className={styles.printButton}><FiPrinter /> Imprimir</button>
                    </div>
                </div>

                <div className={styles.dataContainer}>
                    {loading && <div className={styles.loadingState}>Carregando dados...</div>}
                    {error && <div className={styles.errorState}>{error}</div>}
                    {!loading && !error && paginatedData.length === 0 && (
                        <div className={styles.emptyState}>Nenhuma atividade encontrada para os filtros selecionados.</div>
                    )}
                    {!loading && !error && paginatedData.length > 0 && (
                        viewMode === 'tabela' 
                            ? <TabelaAtividades atividades={paginatedData} /> 
                            : <CardsAtividades atividades={paginatedData} />
                    )}
                </div>

                <div className={styles.paginationFooter}>
                    {totalPages > 1 && (
                         <div>
                             {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                 <button 
                                    key={page} 
                                    onClick={() => setCurrentPage(page)} 
                                    className={currentPage === page ? styles.activePage : ''}
                                 >
                                    {page}
                                 </button>
                             ))}
                         </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AnaliseAtividadesPage;