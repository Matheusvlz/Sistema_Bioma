import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiSearch, FiRefreshCw, FiChevronRight, FiChevronDown, 
  FiAlertTriangle, FiCheckCircle, FiClock, FiFileText, 
  FiDollarSign, FiTruck, FiBox, FiLink, FiDownload
} from 'react-icons/fi';
import styles from './css/DashboardFinanceiro.module.css';
import { AuditoriaService } from './services/auditoriaService';
import { 
    BoletoRastreabilidade, 
    FiltrosAuditoriaPayload 
} from './types/auditoria';

const DashboardFinanceiroPage: React.FC = () => {
    
    // --- Estados ---
    const [items, setItems] = useState<BoletoRastreabilidade[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [totais, setTotais] = useState({ registros: 0, paginas: 1 });

    // --- Filtros (Padrão: Últimos 30 dias por Vencimento) ---
    const [filtros, setFiltros] = useState<FiltrosAuditoriaPayload>({
        data_inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        data_fim: new Date().toISOString().split('T')[0],
        termo_busca: '',
        apenas_problemas: false, // Mantido para compatibilidade, mas o foco agora é rastreio
        pagina: 1,
        itens_por_pagina: 20
    });

    const carregarDados = useCallback(async () => {
        setLoading(true);
        try {
            // Agora a resposta vem no formato PaginatedBoletoResponse
            const res = await AuditoriaService.listarAuditoria(filtros);
            // O Service precisa retornar 'any' ou o tipo correto atualizado se você estiver usando TS estrito no service.
            // Assumindo que o service retorna o data correto:
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

    // --- Helpers de Formatação ---
    const fmtBRL = (val?: string) => {
        if (!val) return 'R$ 0,00';
        return parseFloat(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const fmtData = (val?: string) => {
        if (!val) return '-';
        return val.split('-').reverse().join('/');
    };

    // --- Ações ---
    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const handlePageChange = (novaPagina: number) => {
        if (novaPagina >= 1 && novaPagina <= totais.paginas) {
            setFiltros(prev => ({ ...prev, pagina: novaPagina }));
        }
    };

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
            
            {/* Título e Header */}
            <div style={{marginBottom: '1rem'}}>
                <h2 style={{margin:0, display:'flex', alignItems:'center', gap:'10px'}}>
                    <FiDollarSign /> Rastreabilidade de Boletos
                </h2>
                <p style={{color:'#666', fontSize:'0.9rem', margin:'5px 0 0 0'}}>
                    Visualize os boletos (contas a receber) e rastreie a origem no orçamento e operacional.
                </p>
            </div>

            {/* === BARRA DE FILTROS === */}
            <div className={styles.filterBar}>
                <div className={styles.inputGroup}>
                    <label>Vencimento Inicial</label>
                    <input type="date" className={styles.input} value={filtros.data_inicio} onChange={e => setFiltros({...filtros, data_inicio: e.target.value, pagina: 1})} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Vencimento Final</label>
                    <input type="date" className={styles.input} value={filtros.data_fim} onChange={e => setFiltros({...filtros, data_fim: e.target.value, pagina: 1})} />
                </div>
                <div className={styles.inputGroup}>
                    <label>Busca (Cliente/Cidade)</label>
                    <input className={styles.searchInput} placeholder="Nome do Cliente, Cidade..." value={filtros.cidade || ''} onChange={e => setFiltros({...filtros, cidade: e.target.value, pagina: 1})} onKeyDown={e => e.key === 'Enter' && carregarDados()} />
                </div>
                <button className={styles.btnPrimary} onClick={carregarDados} disabled={loading}>
                    {loading ? <FiRefreshCw className="spin" /> : <FiSearch />} Buscar
                </button>
            </div>

            {/* === TABELA === */}
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            <th>NF / Descrição</th>
                            <th>Cliente</th>
                            <th>Vencimento / Valor</th>
                            <th>Status</th>
                            <th>Rastreio (Origem)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && !loading && (
                            <tr><td colSpan={6} style={{textAlign:'center', padding:'2rem'}}>Nenhum boleto encontrado neste período.</td></tr>
                        )}

                        {items.map(bol => (
                            <React.Fragment key={bol.id}>
                                {/* LINHA MESTRE (BOLETO) */}
                                <tr className={`${styles.masterRow} ${expandedId === bol.id ? styles.active : ''}`} onClick={() => toggleExpand(bol.id)}>
                                    <td style={{textAlign: 'center'}}>{expandedId === bol.id ? <FiChevronDown /> : <FiChevronRight className={styles.iconExpand} />}</td>
                                    
                                    {/* NF / Descrição */}
                                    <td>
                                        <div style={{fontWeight:'bold', color: '#4f46e5'}}>
                                            {bol.boleto_path ? `NF ${bol.boleto_path}` : 'S/N'}
                                        </div>
                                        <div style={{fontSize:'0.8rem', color:'#666'}}>{bol.descricao}</div>
                                    </td>

                                    {/* Cliente */}
                                    <td>
                                        <div style={{fontWeight:500}}>{bol.nome_cliente}</div>
                                    </td>

                                    {/* Financeiro */}
                                    <td>
                                        <div style={{fontSize:'0.85rem', color:'#666'}}>Venc: {fmtData(bol.data_vencimento)}</div>
                                        <div style={{fontWeight:'bold', color: '#1e293b'}}>{fmtBRL(bol.valor_total)}</div>
                                    </td>

                                    {/* Status */}
                                    <td>
                                        {bol.status_pagamento === "PAGO" ? (
                                            <span className={`${styles.badge} ${styles.badgeOk}`}>Pago</span>
                                        ) : bol.status_pagamento === "ATRASADO" ? (
                                            <span className={`${styles.badge} ${styles.badgeDanger}`}>Atrasado</span>
                                        ) : bol.status_pagamento === "PARCIAL" ? (
                                            <span className={`${styles.badge} ${styles.badgeWarning}`}>Parcial</span>
                                        ) : (
                                            <span className={`${styles.badge} ${styles.badgeInfo}`}>Pendente</span>
                                        )}
                                        {bol.valor_pago_acumulado && parseFloat(bol.valor_pago_acumulado) > 0 && (
                                            <div style={{fontSize:'0.7rem', color:'#16a34a', marginTop:'2px'}}>
                                                Pago: {fmtBRL(bol.valor_pago_acumulado)}
                                            </div>
                                        )}
                                    </td>

                                    {/* Rastreio */}
                                    <td>
                                        {bol.orcamento_vinculado ? (
                                            <div style={{display:'flex', alignItems:'center', gap:'5px', color:'#2563eb', fontSize:'0.9rem'}}>
                                                <FiLink /> Orç: {bol.orcamento_vinculado.numero_completo}
                                            </div>
                                        ) : (
                                            <div style={{color:'#9ca3af', fontSize:'0.8rem', fontStyle:'italic'}}>
                                                Sem vínculo direto
                                            </div>
                                        )}
                                    </td>
                                </tr>

                                {/* DETALHES EXPANDIDOS */}
                                {expandedId === bol.id && (
                                    <tr className={styles.detailsRow}>
                                        <td colSpan={6}>
                                            <div className={styles.detailsContainer}>
                                                <div className={styles.gridTwoColumns}>
                                                    
                                                    {/* ESQUERDA: ITENS DO BOLETO (NFs) */}
                                                    <div className={styles.detailSection}>
                                                        <h4><FiFileText /> Itens do Boleto (Notas Fiscais)</h4>
                                                        {bol.itens_nf.length === 0 ? (
                                                            <div className={styles.emptyState}>Nenhum item detalhado encontrado.</div>
                                                        ) : (
                                                            <table className={styles.miniTable}>
                                                                <thead><tr><th>NF</th><th>Emissão</th><th>Valor</th><th>Ações</th></tr></thead>
                                                                <tbody>
                                                                    {bol.itens_nf.map((item, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{item.nf_numero || '-'}</td>
                                                                            <td>{fmtData(item.data_emissao)}</td>
                                                                            <td>{fmtBRL(item.valor)}</td>
                                                                            <td style={{display:'flex', gap:'5px'}}>
                                                                                {item.caminho_nf && (
                                                                                    <button className={styles.btnIconMini} 
                                                                                        onClick={() => handleAbrirArquivo('BOLETO', { nf: item.nf_numero, data_competencia: item.data_emissao })} 
                                                                                        title="Abrir PDF da Nota">
                                                                                        NF <FiDownload size={10}/>
                                                                                    </button>
                                                                                )}
                                                                                {item.arquivos_boletos.length > 0 && (
                                                                                    <button className={styles.btnIconMini} 
                                                                                        onClick={() => handleAbrirArquivo('BOLETO', { nf: item.nf_numero, data_competencia: item.data_emissao })} // Simplificado, ideal seria passar ID do arquivo
                                                                                        title="Abrir Boleto Bancário">
                                                                                        Bol <FiDollarSign size={10}/>
                                                                                    </button>
                                                                                )}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>

                                                    {/* DIREITA: ORIGEM (ORÇAMENTO) */}
                                                    <div className={styles.detailSection}>
                                                        <h4><FiBox /> Origem (Rastreabilidade)</h4>
                                                        
                                                        {bol.orcamento_vinculado ? (
                                                            <div className={styles.orcamentoCard}>
                                                                <div className={styles.orcHeader}>
                                                                    <strong>Orçamento: {bol.orcamento_vinculado.numero_completo}</strong>
                                                                    <span>Data: {fmtData(bol.orcamento_vinculado.data)}</span>
                                                                    <button className={styles.linkBtn} onClick={() => handleAbrirArquivo('ORCAMENTO', { numero: parseInt(bol.orcamento_vinculado!.numero_completo.split('/')[0]), ano: bol.orcamento_vinculado!.numero_completo.split('-')[1] })}>
                                                                        Abrir PDF
                                                                    </button>
                                                                </div>

                                                                {/* MATEMÁTICA DO ORÇAMENTO (O CÁLCULO) */}
                                                                <div className={styles.calcBox}>
                                                                    <div className={styles.calcRow}>
                                                                        <span>Itens + Coletas:</span>
                                                                        <span>{fmtBRL(bol.orcamento_vinculado.valor_base_itens)}</span>
                                                                    </div>
                                                                    {parseFloat(bol.orcamento_vinculado.valor_frete_real) > 0 && (
                                                                        <div className={styles.calcRow} style={{color:'#2563eb'}}>
                                                                            <span>(+) Frete:</span>
                                                                            <span>{fmtBRL(bol.orcamento_vinculado.valor_frete_real)}</span>
                                                                        </div>
                                                                    )}
                                                                    {parseFloat(bol.orcamento_vinculado.valor_descontos) > 0 && (
                                                                        <div className={styles.calcRow} style={{color:'#dc2626'}}>
                                                                            <span>(-) Descontos:</span>
                                                                            <span>{fmtBRL(bol.orcamento_vinculado.valor_descontos)}</span>
                                                                        </div>
                                                                    )}
                                                                    <div className={`${styles.calcRow} ${styles.calcTotal}`}>
                                                                        <span>Total Contratado:</span>
                                                                        <span>{fmtBRL(bol.orcamento_vinculado.valor_final_calculado)}</span>
                                                                    </div>
                                                                </div>

                                                                {/* RESUMO OPERACIONAL */}
                                                                <div style={{marginTop:'10px'}}>
                                                                    <div style={{fontSize:'0.8rem', fontWeight:'bold', marginBottom:'4px'}}>
                                                                        <FiTruck /> Coletas Vinculadas ({bol.orcamento_vinculado.qtd_coletas}):
                                                                    </div>
                                                                    <div style={{display:'flex', flexWrap:'wrap', gap:'5px'}}>
                                                                        {bol.orcamento_vinculado.resumo_coletas.map((col, i) => (
                                                                            <span key={i} style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px', fontSize:'0.75rem', color:'#475569'}}>
                                                                                {col}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={styles.emptyState}>
                                                                <FiAlertTriangle size={24} style={{marginBottom:'10px'}}/>
                                                                <br/>
                                                                Não foi encontrado um orçamento aprovado para este cliente com data anterior ao vencimento deste boleto.
                                                            </div>
                                                        )}
                                                    </div>

                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={6} className={styles.footer}>
                                <div>Mostrando {items.length} de {totais.registros} registros</div>
                                <div style={{display:'flex', gap:'10px'}}>
                                    <button className={styles.btnIcon} disabled={filtros.pagina <= 1} onClick={() => handlePageChange(filtros.pagina - 1)}>Anterior</button>
                                    <span>Página {filtros.pagina} de {totais.paginas}</span>
                                    <button className={styles.btnIcon} disabled={filtros.pagina >= totais.paginas} onClick={() => handlePageChange(filtros.pagina + 1)}>Próxima</button>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default DashboardFinanceiroPage;