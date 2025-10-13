import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './styles/VisualizarResultadosPesquisa.module.css';

// --- Tipagens ---
interface ApiResponse<T> { success: boolean; data?: T; message?: string; }
interface DestinatarioPesquisa { id: number; nome: string; email?: string; enviado: boolean; respondido: boolean; dataEnvio?: string; dataResposta?: string; }
interface ResultadoItem { resposta: string; total: number; }
interface PesquisaItem { id: number; descricao: string; }
interface PesquisaDetalhada { id: number; descricao: string; dataInicial: string; dataTermino: string; modeloId: number; nomeModelo: string; finalizada: boolean; }
interface PayloadAnaliseCritica { observacao: string; aprovado: boolean; dataVisto: string; }
interface VisualizarResultadosProps {}
type Tab = 'analise' | 'envios';

const COLORS: { [key: string]: string } = { 'Ótimo': '#28a745', 'Bom': '#82ca9d', 'Regular': '#ffc658', 'Ruim': '#dc3545', 'N.A.': '#6c757d' };

const VisualizarResultadosPesquisa: React.FC<VisualizarResultadosProps> = () => {
    const [pesquisaId, setPesquisaId] = useState<number | undefined>();
    
    const [activeTab, setActiveTab] = useState<Tab>('analise');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pesquisaInfo, setPesquisaInfo] = useState<PesquisaDetalhada | null>(null);
    const [destinatarios, setDestinatarios] = useState<DestinatarioPesquisa[]>([]);
    const [filtroDestinatarios, setFiltroDestinatarios] = useState('todos');
    const [itens, setItens] = useState<PesquisaItem[]>([]);
    const [itemSelecionado, setItemSelecionado] = useState<string>('');
    const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
    const [loadingGrafico, setLoadingGrafico] = useState(false);
    const [analiseForm, setAnaliseForm] = useState({ observacao: '', aprovado: true, dataVisto: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        // --- O ESPIÃO ESTÁ AQUI ---
        console.log("Conteúdo do window.history.state:", window.history.state);

        const id = (window.history.state as { pesquisaId?: number })?.pesquisaId;

        if (id) {
            setPesquisaId(id);
        } else {
            setError("ID da pesquisa não encontrado no 'state' da janela. Verifique a chamada no WindowManager.");
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!pesquisaId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [infoRes, destRes] = await Promise.all([
                    invoke<ApiResponse<PesquisaDetalhada>>("buscar_pesquisa_por_id_tauri", { id: pesquisaId }),
                    invoke<ApiResponse<DestinatarioPesquisa[]>>("listar_destinatarios_tauri", { pesquisaId })
                ]);

                if (!infoRes.success || !infoRes.data) throw new Error(infoRes.message || 'Falha ao carregar dados da pesquisa.');
                setPesquisaInfo(infoRes.data);
                
                if (!destRes.success || !destRes.data) throw new Error(destRes.message || 'Falha ao carregar destinatários.');
                setDestinatarios(destRes.data);

                const itensRes = await invoke<ApiResponse<PesquisaItem[]>>("listar_itens_por_modelo_tauri", { modeloId: infoRes.data.modeloId });
                if (itensRes.success && itensRes.data) {
                    setItens(itensRes.data);
                    if (itensRes.data.length > 0) {
                        setItemSelecionado(itensRes.data[0].descricao);
                    }
                } else { throw new Error(itensRes.message || 'Falha ao carregar itens da pesquisa.'); }

            } catch (err: any) { setError(err.message);
            } finally { setLoading(false); }
        };
        fetchData();
    }, [pesquisaId]);

    useEffect(() => {
        if (!itemSelecionado || !pesquisaId) return;
        const fetchChartData = async () => {
            setLoadingGrafico(true);
            try {
                const res: ApiResponse<ResultadoItem[]> = await invoke("obter_resultados_por_item_tauri", {
                    pesquisaId,
                    itemDescricao: itemSelecionado,
                });
                if (res.success && res.data) {
                    const totalRespostas = res.data.reduce((sum, item) => sum + item.total, 0);
                    const chartData = ["Ótimo", "Bom", "Regular", "Ruim", "N.A."].map(resposta => {
                        const item = res.data.find(d => d.resposta === resposta);
                        const total = item ? item.total : 0;
                        return { name: resposta, Quantidade: total, porcentagem: totalRespostas > 0 ? ((total / totalRespostas) * 100) : 0 };
                    });
                    setDadosGrafico(chartData);
                } else { setDadosGrafico([]); }
            } catch (err: any) { setError(err.message);
            } finally { setLoadingGrafico(false); }
        };
        fetchChartData();
    }, [itemSelecionado, pesquisaId]);

    const destinatariosFiltrados = useMemo(() => {
        if (filtroDestinatarios === 'respondido') return destinatarios.filter(d => d.respondido);
        if (filtroDestinatarios === 'nao-respondido') return destinatarios.filter(d => !d.respondido);
        return destinatarios;
    }, [destinatarios, filtroDestinatarios]);

    const handleSalvarAnalise = async () => {
        if (!pesquisaId) return;
        try {
            const res: ApiResponse<void> = await invoke("salvar_analise_critica_tauri", { pesquisaId, payload: analiseForm });
            if (res.success) {
                alert('Análise crítica salva com sucesso!');
            } else { throw new Error(res.message); }
        } catch (err: any) {
            alert(`Erro ao salvar: ${err.message}`);
        }
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className={styles.tooltip}>
              <p className={styles.tooltipLabel}>{label}</p>
              <p className={styles.tooltipValue} style={{ color: payload[0].fill }}>{`Quantidade: ${payload[0].value}`}</p>
              <p className={styles.tooltipPercentage}>{`Porcentagem: ${payload[0].payload.porcentagem.toFixed(2)}%`}</p>
            </div>
          );
        }
        return null;
    };
    
    if (error) return <div className={styles.error}>Erro ao carregar: {error}</div>;
    if (loading || !pesquisaInfo) return <div className={styles.loading}>Carregando dados da pesquisa...</div>;
    
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{pesquisaInfo?.descricao || `Resultados da Pesquisa #${pesquisaId}`}</h1>
            <div className={styles.tabs}>
                <button onClick={() => setActiveTab('analise')} className={activeTab === 'analise' ? styles.tabActive : styles.tab}>Análise Crítica</button>
                <button onClick={() => setActiveTab('envios')} className={activeTab === 'envios' ? styles.tabActive : styles.tab}>Gerenciar Envios</button>
            </div>

            {activeTab === 'envios' && (
                <div className={styles.tabContent}>
                    <div className={styles.destinatariosFilter}>
                        <label><input type="radio" value="todos" checked={filtroDestinatarios === 'todos'} onChange={(e) => setFiltroDestinatarios(e.target.value)} /> Todos</label>
                        <label><input type="radio" value="respondido" checked={filtroDestinatarios === 'respondido'} onChange={(e) => setFiltroDestinatarios(e.target.value)} /> Respondidos</label>
                        <label><input type="radio" value="nao-respondido" checked={filtroDestinatarios === 'nao-respondido'} onChange={(e) => setFiltroDestinatarios(e.target.value)} /> Não Respondidos</label>
                    </div>
                    <div className={styles.tableContainer}>
                        <table>
                            <thead>
                                <tr><th>Nome</th><th>Email</th><th>Enviado Em</th><th>Respondido Em</th></tr>
                            </thead>
                            <tbody>
                                {destinatariosFiltrados.map(d => (
                                    <tr key={d.id}>
                                        <td>{d.nome}</td>
                                        <td>{d.email || '-'}</td>
                                        <td>{d.enviado ? d.dataEnvio : 'Não'}</td>
                                        <td>{d.respondido ? d.dataResposta : 'Não'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'analise' && (
                <div className={styles.tabContent}>
                    <div className={styles.chartArea}>
                        <label htmlFor="itemSelect" className={styles.itemSelectLabel}>Analisar resultado do item:</label>
                        <select id="itemSelect" value={itemSelecionado} onChange={e => setItemSelecionado(e.target.value)} className={styles.itemSelect}>
                            {itens.map(item => <option key={item.id} value={item.descricao}>{item.descricao}</option>)}
                        </select>
                        {loadingGrafico ? <div className={styles.loading}>Carregando gráfico...</div> : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} label={{ value: 'Quantidade', angle: -90, position: 'insideLeft', offset: -10 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Quantidade">
                                    {dadosGrafico.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        )}
                    </div>
                    <div className={styles.analiseForm}>
                        <h3>Formulário de Análise Crítica</h3>
                        <textarea rows={5} placeholder="Observações da análise..." value={analiseForm.observacao}
                            onChange={e => setAnaliseForm(f => ({ ...f, observacao: e.target.value }))} />
                        <div className={styles.formRow}>
                            <input type="date" value={analiseForm.dataVisto}
                                onChange={e => setAnaliseForm(f => ({ ...f, dataVisto: e.target.value }))} />
                            <div className={styles.radioGroup}>
                                <label><input type="radio" name="aprovado" checked={analiseForm.aprovado} onChange={() => setAnaliseForm(f => ({...f, aprovado: true}))} /> Aprovado</label>
                                <label><input type="radio" name="aprovado" checked={!analiseForm.aprovado} onChange={() => setAnaliseForm(f => ({...f, aprovado: false}))} /> Reprovado</label>
                            </div>
                        </div>
                        <button onClick={handleSalvarAnalise} className={styles.buttonPrimary}>Salvar Análise</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualizarResultadosPesquisa;