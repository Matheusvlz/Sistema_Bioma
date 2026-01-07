import React, { useState, useEffect, useCallback } from 'react';
import { 
    FiSearch, FiRefreshCw, FiChevronRight, FiChevronDown, 
    FiAlertTriangle, FiCheckCircle, FiClock, FiFileText, 
    FiDollarSign, FiTruck, FiBox, FiAlertOctagon, FiUser 
} from 'react-icons/fi';
import styles from './css/DashboardFinanceiro.module.css';
import { AuditoriaService } from './services/auditoriaService';
import { OrcamentoAuditoria, FiltrosAuditoriaPayload } from './types/auditoria';

const AuditoriaOrcamento: React.FC = () => {
    // --- Estados ---
    const [items, setItems] = useState<OrcamentoAuditoria[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [totais, setTotais] = useState({ registros: 0, paginas: 1 });

    // --- Filtros Iniciais ---
    const [filtros, setFiltros] = useState<FiltrosAuditoriaPayload>({
        // Padrão: Últimos 90 dias
        data_inicio: new Date(new Date().setDate(new Date().getDate() - 90)).toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        termo_busca: '',
        apenas_problemas: false,
        pagina: 1,
        itens_por_pagina: 20
    });

    // --- Carregamento ---
    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            const res = await AuditoriaService.listarAuditoria(filtros);
            setItems(res.data);
            setTotais({ registros: res.total_registros, paginas: res.total_paginas });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [filtros]);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    // --- Formatadores ---
    const fmtBRL = (val?: string) => {
        if (!val) return 'R$ 0,00';
        return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const fmtData = (val?: string) => {
        if (!val) return '-';
        return val.split('-').reverse().join('/');
    };

    // NOVO: Formata Data e Hora (YYYY-MM-DD HH:MM:SS -> DD/MM/YYYY HH:MM)
    const fmtDataHora = (val?: string) => {
        if (!val) return '-';
        const date = new Date(val);
        // Se a data for inválida (ex: string vazia), retorna original
        if (isNaN(date.getTime())) return val; 
        return date.toLocaleString('pt-BR');
    };

    // --- Handlers ---
    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handlePageChange = (novaPagina: number) => {
        if (novaPagina >= 1 && novaPagina <= totais.paginas) {
            setFiltros(prev => ({ ...prev, pagina: novaPagina }));
        }
    };

    // Abre PDF na rede
    const handleAbrirArquivo = (tipo: 'ORCAMENTO' | 'BOLETO', dados: any) => {
        AuditoriaService.abrirArquivoRede(tipo, {
            numero: dados.numero,
            ano: dados.ano,
            nf: dados.nf,
            data_competencia: dados.data_competencia
        });
    };

    return (
        <div className={styles.container}>
            {/* === BARRA DE FILTROS === */}
            <div className={styles.filterBar}>
                <div className={styles.inputGroup}>
                    <label>Início</label>
                    <input 
                        type="date" 
                        className={styles.input}
                        value={filtros.data_inicio}
                        onChange={e => setFiltros({...filtros, data_inicio: e.target.value, pagina: 1})}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label>Fim</label>
                    <input 
                        type="date" 
                        className={styles.input}
                        value={filtros.data_fim}
                        onChange={e => setFiltros({...filtros, data_fim: e.target.value, pagina: 1})}
                    />
                </div>
                
                <div className={styles.inputGroup}>
                    <label>Busca Inteligente</label>
                    <input 
                        className={styles.searchInput} 
                        placeholder="Nº Orçamento, Cliente, Cidade, NF..."
                        value={filtros.termo_busca}
                        onChange={e => setFiltros({...filtros, termo_busca: e.target.value, pagina: 1})}
                        onKeyDown={e => e.key === 'Enter' && carregarDados()}
                    />
                </div>

                <label className={styles.checkboxLabel}>
                    <input 
                        type="checkbox" 
                        checked={filtros.apenas_problemas}
                        onChange={e => setFiltros({...filtros, apenas_problemas: e.target.checked, pagina: 1})}
                    />
                    Somente Problemas
                </label>

                <button className={styles.btnPrimary} onClick={carregarDados} disabled={loading}>
                    {loading ? <FiRefreshCw className="spin" /> : <FiSearch />}
                    Buscar
                </button>
            </div>

            {/* === TABELA === */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>Orçamento</th>
                            <th>Data</th>
                            <th>Cliente / Cidade</th>
                            <th>Status Auditoria</th>
                            <th>Valor Total</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && !loading && (
                            <tr><td colSpan={7} style={{textAlign:'center', padding:'2rem'}}>Nenhum orçamento encontrado.</td></tr>
                        )}

                        {items.map(orc => (
                            <React.Fragment key={orc.id}>
                                {/* LINHA MESTRE */}
                                <tr 
                                    className={`${styles.masterRow} ${expandedId === orc.id ? styles.active : ''}`}
                                    onClick={() => toggleExpand(orc.id)}
                                >
                                    <td style={{textAlign: 'center'}}>
                                        {expandedId === orc.id ? <FiChevronDown /> : <FiChevronRight className={styles.iconExpand} />}
                                    </td>
                                    <td>
                                        <strong>{orc.numero_completo}</strong>
                                        {orc.status_geral === "Cancelado" && <span style={{marginLeft:'5px', color:'red', fontSize:'0.8rem'}}>(Cancelado)</span>}
                                    </td>
                                    <td>{fmtData(orc.data_criacao)}</td>
                                    <td>
                                        <div style={{fontWeight:500}}>{orc.nome_cliente}</div>
                                        <div style={{fontSize:'0.8rem', color:'#666'}}>{orc.cidade_cliente || 'Cidade n/d'}</div>
                                    </td>
                                    <td>
                                        {/* Status Badge */}
                                        {orc.status_geral === "Problema" || orc.alertas.length > 0 ? (
                                            <span className={`${styles.badge} ${styles.badgeDanger}`}>
                                                <FiAlertTriangle /> Atenção
                                            </span>
                                        ) : orc.status_geral === "Concluído" ? (
                                            <span className={`${styles.badge} ${styles.badgeOk}`}>
                                                <FiCheckCircle /> Concluído
                                            </span>
                                        ) : orc.status_geral === "Cancelado" ? (
                                            <span className={`${styles.badge} ${styles.badgeDanger}`}>
                                                Cancelado
                                            </span>
                                        ) : (
                                            <span className={`${styles.badge} ${styles.badgeInfo}`}>
                                                <FiClock /> Em Aberto
                                            </span>
                                        )}
                                    </td>
                                    <td style={{fontWeight: 'bold', color: '#111827'}}>
                                        {fmtBRL(orc.valor_final)}
                                    </td>
                                    <td>
                                        <button 
                                            className={styles.btnIcon}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAbrirArquivo('ORCAMENTO', { numero: orc.numero, ano: orc.ano });
                                            }}
                                            title="Abrir Orçamento PDF"
                                        >
                                            <FiFileText /> PDF
                                        </button>
                                    </td>
                                </tr>

                                {/* LINHA DETALHE (EXPANDIDA) */}
                                {expandedId === orc.id && (
                                    <tr className={styles.detailsRow}>
                                        <td colSpan={7}>
                                            <div className={styles.detailsContainer}>
                                                
                                                {/* 1. ESCOPO */}
                                                <div className={styles.detailSection}>
                                                    <h4><FiBox /> Escopo Contratado</h4>
                                                    <ul className={styles.detailList}>
                                                        {orc.itens.map((item, idx) => (
                                                            <li key={idx}>
                                                                <span>{parseFloat(item.quantidade)}x {item.nome}</span>
                                                                <strong>{fmtBRL(item.preco_total)}</strong>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    <div className={styles.totalRow}>
                                                        <div>Itens: {fmtBRL(orc.valor_total_itens)}</div>
                                                        <div style={{color:'#666', fontSize:'0.75rem'}}>
                                                            Frete: {fmtBRL(orc.valor_frete)} | Desc: <span style={{color:'red'}}>-{fmtBRL(orc.valor_desconto)}</span>
                                                        </div>
                                                        <div style={{marginTop:'5px', fontSize:'1rem'}}>Total: {fmtBRL(orc.valor_final)}</div>
                                                    </div>
                                                </div>

                                                {/* 2. OPERACIONAL (Agora com Coletor e Data) */}
                                                <div className={styles.detailSection}>
                                                    <h4><FiTruck /> Operacional (Coletas)</h4>
                                                    {orc.ciclo_operacional.length === 0 ? (
                                                        <div className={styles.emptyState}>Nenhuma operação registrada.</div>
                                                    ) : (
                                                        orc.ciclo_operacional.map((op, idx) => (
                                                            <div key={idx} className={op.status === 'Coletado' ? styles.cardOp : styles.cardOpPending}>
                                                                <div style={{display:'flex', justifyContent:'space-between', marginBottom: '4px'}}>
                                                                    <strong>{op.status}</strong>
                                                                    {/* Usa data_hora_registro se tiver, senão data_coleta */}
                                                                    <span style={{fontSize:'0.8rem'}}>
                                                                        {fmtDataHora(op.data_hora_registro) !== '-' ? fmtDataHora(op.data_hora_registro) : fmtData(op.data_coleta)}
                                                                    </span>
                                                                </div>
                                                                
                                                                {/* EXIBIÇÃO DO COLETOR (Se disponível) */}
                                                                {op.status === 'Coletado' && op.nome_coletor && (
                                                                    <div style={{fontSize:'0.8rem', color:'#4b5563', display:'flex', alignItems:'center', gap:'4px'}}>
                                                                        <FiUser size={12}/> {op.nome_coletor}
                                                                    </div>
                                                                )}
                                                                
                                                                {op.numero_coleta && <div style={{fontSize:'0.8rem', marginTop:'4px'}}>Coleta: <strong>#{op.numero_coleta}</strong></div>}
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* 3. FINANCEIRO */}
                                                <div className={styles.detailSection}>
                                                    <h4><FiDollarSign /> Financeiro (Faturas)</h4>
                                                    {orc.ciclo_financeiro.length === 0 ? (
                                                        <div className={styles.emptyState}>Nenhum faturamento encontrado (6 meses).</div>
                                                    ) : (
                                                        <table className={styles.miniTable}>
                                                            <thead><tr><th>NF</th><th>Parc</th><th>Venc</th><th>Valor</th><th>Status</th><th></th></tr></thead>
                                                            <tbody>
                                                                {orc.ciclo_financeiro.map((fin, idx) => (
                                                                    <tr key={idx}>
                                                                        <td>{fin.numero_nf || 'S/N'}</td>
                                                                        <td>{fin.numero_parcela}</td>
                                                                        <td>{fmtData(fin.data_vencimento)}</td>
                                                                        <td>{fmtBRL(fin.valor_parcela)}</td>
                                                                        <td className={
                                                                            fin.status === 'Pago' ? styles.textGreen : 
                                                                            fin.status === 'Atrasado' ? styles.textRed : styles.textOrange
                                                                        }>
                                                                            {fin.status}
                                                                        </td>
                                                                        <td>
                                                                            <button 
                                                                                className={styles.btnIcon} 
                                                                                title="Abrir Boleto/NF na Rede"
                                                                                onClick={() => handleAbrirArquivo('BOLETO', { 
                                                                                    nf: fin.numero_nf,
                                                                                    data_competencia: fin.data_emissao || fin.data_vencimento
                                                                                })}
                                                                            >
                                                                                <FiFileText size={12}/>
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                                    
                                                    {/* Auditoria IA */}
                                                    {orc.alertas.length > 0 && (
                                                        <div className={styles.alertBox}>
                                                            <div style={{fontWeight:'bold', marginBottom:'5px', display:'flex', alignItems:'center', gap:'5px'}}>
                                                                <FiAlertOctagon /> Diagnóstico do Auditor:
                                                            </div>
                                                            <ul style={{paddingLeft:'20px', margin:0}}>
                                                                {orc.alertas.map((alerta, i) => (
                                                                    <li key={i}>{alerta}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* === RODAPÉ === */}
            <div className={styles.footer}>
                <div>
                    Mostrando {items.length} de {totais.registros} registros.
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button 
                        className={styles.btnIcon} 
                        disabled={filtros.pagina <= 1}
                        onClick={() => handlePageChange(filtros.pagina - 1)}
                    >
                        Anterior
                    </button>
                    <span>Página {filtros.pagina} de {totais.paginas}</span>
                    <button 
                        className={styles.btnIcon} 
                        disabled={filtros.pagina >= totais.paginas}
                        onClick={() => handlePageChange(filtros.pagina + 1)}
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuditoriaOrcamento; 