import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
    FiDollarSign, FiAlertTriangle, FiCheckCircle, FiRefreshCw, 
    FiServer, FiFilter, FiCalendar, FiUser, FiFileText 
} from 'react-icons/fi';
import styles from './css/DashboardFinanceiro.module.css'; 

// --- Tipagem ---
interface FiltrosPayload {
    dataInicio: string;
    dataFim: string;
    clienteId?: number;
    apenasErros?: boolean;
}

interface AuditoriaItem {
    id_parcela: number;
    numero_nf: string | null;
    numero_parcela: number | null;
    total_parcelas: number;
    nome_cliente: string;
    data_vencimento: string;
    data_pagamento: string | null;
    valor_previsto: string; 
    valor_pago: string | null;
    status_financeiro: 'Pago' | 'Aberto' | 'Atrasado';
    orcamento_origem: string | null;
    valor_orcado: string | null;
    data_coleta: string | null;
    coletor_nome: string | null;
    dias_delay_faturamento: number | null;
    rpa_status: 'SUCESSO' | 'FALHA' | null;
    rpa_erro: string | null;
}

interface KpiData {
    total_previsto: string;
    total_recebido: string;
    total_inadimplente: string;
    qtd_falhas_robo: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const DashboardFinanceiroPage: React.FC = () => {
    // Datas Iniciais (1º dia do mês até hoje)
    const hoje = new Date().toISOString().split('T')[0];
    const primeiroDia = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    const [filtros, setFiltros] = useState<FiltrosPayload>({
        dataInicio: primeiroDia,
        dataFim: hoje,
        apenasErros: false
    });

    const [items, setItems] = useState<AuditoriaItem[]>([]);
    const [kpis, setKpis] = useState<KpiData | null>(null);
    const [loading, setLoading] = useState(false);

    // --- Formatadores ---
    const fmtMoeda = (val: string | number | null) => {
        if (!val) return '-';
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const fmtData = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            const resLista = await invoke<ApiResponse<AuditoriaItem[]>>('listar_auditoria_financeira_tauri', { filtros });
            if (resLista.success && resLista.data) setItems(resLista.data);

            const resKpi = await invoke<ApiResponse<KpiData>>('obter_kpis_financeiros_tauri', { filtros });
            if (resKpi.success && resKpi.data) setKpis(resKpi.data);

        } catch (error) {
            console.error("Erro crítico:", error);
            alert("Falha ao carregar dados financeiro.");
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    return (
        <div className={styles.container}>
            {/* TOPO */}
            <div className={styles.header}>
                <div className={styles.titleSection}>
                    <h1>Auditoria Financeira</h1>
                    <p>Rastreabilidade completa: Orçamento ➔ Coleta ➔ Fatura ➔ Robô</p>
                </div>
                
                <div className={styles.controls}>
                    <div className={styles.dateGroup}>
                        <FiCalendar color="#666"/>
                        <input 
                            type="date" className={styles.inputDate}
                            value={filtros.dataInicio} 
                            onChange={e => setFiltros({...filtros, dataInicio: e.target.value})} 
                        />
                        <span>a</span>
                        <input 
                            type="date" className={styles.inputDate}
                            value={filtros.dataFim} 
                            onChange={e => setFiltros({...filtros, dataFim: e.target.value})} 
                        />
                    </div>
                    
                    <button 
                        className={`${styles.filterBtn} ${filtros.apenasErros ? styles.active : ''}`}
                        onClick={() => setFiltros({...filtros, apenasErros: !filtros.apenasErros})}
                        title="Filtra apenas boletos vencidos, com erro de valor ou falha de envio"
                    >
                        <FiFilter /> {filtros.apenasErros ? 'Focando Erros' : 'Todos'}
                    </button>

                    <button onClick={carregarDados} className={styles.refreshBtn} disabled={loading} title="Atualizar Dados">
                        <FiRefreshCw className={loading ? styles.spin : ''} size={18} />
                    </button>
                </div>
            </div>

            {/* KPIS */}
            {kpis && (
                <div className={styles.kpiContainer}>
                    <div className={styles.kpiCard}>
                        <div className={styles.icon} style={{ background: '#e0f2f1', color: '#00695c' }}><FiDollarSign /></div>
                        <div>
                            <h3>Recebido (Realizado)</h3>
                            <div className={styles.valueGreen}>{fmtMoeda(kpis.total_recebido)}</div>
                            <div className={styles.sub}>Meta: {fmtMoeda(kpis.total_previsto)}</div>
                        </div>
                    </div>

                    <div className={`${styles.kpiCard} ${parseFloat(kpis.total_inadimplente) > 0 ? styles.alerta : ''}`}>
                        <div className={styles.icon} style={{ background: '#ffebee', color: '#c62828' }}><FiAlertTriangle /></div>
                        <div>
                            <h3>Inadimplência</h3>
                            <div className={styles.valueRed}>{fmtMoeda(kpis.total_inadimplente)}</div>
                            <div className={styles.sub}>Vencidos no período</div>
                        </div>
                    </div>

                    <div className={styles.kpiCard}>
                        <div className={styles.icon} style={{ background: '#fff3e0', color: '#ef6c00' }}><FiServer /></div>
                        <div>
                            <h3>Falhas Robô</h3>
                            <div className={kpis.qtd_falhas_robo > 0 ? styles.valueRed : styles.valueNormal}>
                                {kpis.qtd_falhas_robo} Falhas
                            </div>
                            <div className={styles.sub}>Envios não realizados</div>
                        </div>
                    </div>
                </div>
            )}

            {/* TABELA */}
            <div className={styles.tableBox}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Vencimento</th>
                                <th>Cliente / Origem</th>
                                <th>NF / Parc.</th>
                                <th>Valores (A vs B)</th>
                                <th>Operacional (Coleta)</th>
                                <th>Automação (RPA)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 && !loading && (
                                <tr><td colSpan={7} className={styles.empty}>Nenhum registro encontrado para o período.</td></tr>
                            )}
                            {items.map(item => {
                                const isAtrasado = item.status_financeiro === 'Atrasado';
                                const valPrevisto = parseFloat(item.valor_previsto);
                                const valPago = item.valor_pago ? parseFloat(item.valor_pago) : 0;
                                const diferenca = item.valor_pago ? valPago - valPrevisto : 0;
                                const temDiferenca = Math.abs(diferenca) > 0.05; // Margem de centavos

                                return (
                                    <tr key={item.id_parcela} className={isAtrasado ? styles.rowLate : ''}>
                                        <td>
                                            <span className={`${styles.badge} ${styles[item.status_financeiro]}`}>
                                                {item.status_financeiro}
                                            </span>
                                        </td>
                                        <td>
                                            <strong>{fmtData(item.data_vencimento)}</strong>
                                            {item.data_pagamento && <div className={styles.paidDate}>Pago: {fmtData(item.data_pagamento)}</div>}
                                        </td>
                                        <td>
                                            <div className={styles.client}><FiUser size={10} style={{marginRight:4}}/> {item.nome_cliente}</div>
                                            <div className={styles.orcamento}>
                                                <FiFileText size={10} style={{marginRight:4}}/> 
                                                {item.orcamento_origem ? `Orç: ${item.orcamento_origem}` : 'Orçamento n/ enc.'}
                                            </div>
                                        </td>
                                        <td>
                                            <div>NF: {item.numero_nf || 'S/N'}</div>
                                            <small style={{color:'#666'}}>Parc. {item.numero_parcela}/{item.total_parcelas}</small>
                                        </td>
                                        <td>
                                            <div className={styles.valor} title="Valor do Boleto">{fmtMoeda(valPrevisto)}</div>
                                            {item.valor_pago && (
                                                <div className={styles.valOk} title="Valor Pago no Banco">
                                                    Pg: {fmtMoeda(valPago)}
                                                </div>
                                            )}
                                            {temDiferenca && item.valor_pago && (
                                                <div className={styles.valDiff} title="Diferença (Juros ou Desconto)">
                                                    {diferenca > 0 ? '+' : ''}{fmtMoeda(diferenca)}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            {item.data_coleta ? (
                                                <div className={styles.coletaBox}>
                                                    <div className={styles.coletaDate}><FiCheckCircle color="#059669"/> {fmtData(item.data_coleta)}</div>
                                                    <small>{item.coletor_nome}</small>
                                                    {(item.dias_delay_faturamento || 0) > 15 && (
                                                        <span className={styles.tagDelay} title="Tempo entre Coleta e Emissão da NF">
                                                            Delay {item.dias_delay_faturamento}d
                                                        </span>
                                                    )}
                                                </div>
                                            ) : <span className={styles.dash}>-</span>}
                                        </td>
                                        <td>
                                            {item.rpa_status === 'SUCESSO' && <span className={styles.roboSuccess}>Enviado</span>}
                                            {item.rpa_status === 'FALHA' && (
                                                <div className={styles.roboFail} title={item.rpa_erro || 'Erro desconhecido'}>
                                                    Falha Envio
                                                </div>
                                            )}
                                            {!item.rpa_status && <span className={styles.dash}>-</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default DashboardFinanceiroPage;