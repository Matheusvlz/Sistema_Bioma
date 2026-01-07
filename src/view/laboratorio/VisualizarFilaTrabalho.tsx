import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { FaSearch, FaFlask, FaCheckDouble, FaMapMarkerAlt, FaClock, FaPlay } from 'react-icons/fa';
import styles from './styles/FilaTrabalho.module.css';

// --- Interfaces (Espelho do Rust) ---
interface ItemFilaTrabalho {
    analise_id: number;
    amostra_numero: string | null;
    identificacao: string | null;
    complemento: string | null;
    parametro_nome: string | null;
    pop_codigo: string | null;
    pop_numero: string | null;
    pop_revisao: string | null;
    tecnica_nome: string | null;
    data_coleta: string | null;
    data_lab: string | null;
    hora_lab: string | null;
    em_campo: number | null;
    data_inicio: string | null;
    usuario_visto: number | null;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

// --- Componente Principal ---
const VisualizarFilaTrabalho: React.FC = () => {
    // Estados de Dados
    const [items, setItems] = useState<ItemFilaTrabalho[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Estados de Controle
    const [statusFiltro, setStatusFiltro] = useState<'aguardando' | 'em_campo' | 'analisando' | 'finalizada'>('aguardando');
    const [busca, setBusca] = useState('');
    const [selecionados, setSelecionados] = useState<number[]>([]);
    
    // Estados do Modal de Início
    const [modalAberto, setModalAberto] = useState(false);
    const [dataInicio, setDataInicio] = useState('');
    const [horaInicio, setHoraInicio] = useState('');

    // 1. Carregamento de Dados (Chama a Ponte Tauri)
    const carregarFila = useCallback(async () => {
        setLoading(true);
        try {
            const res: ApiResponse<ItemFilaTrabalho[]> = await invoke("listar_fila_trabalho_tauri", { 
                status: statusFiltro,
                grupos: null // Futuro: Implementar filtro de grupos se necessário
            });
            
            if (res.success && res.data) {
                setItems(res.data);
            } else {
                alert("Erro ao carregar: " + res.message);
            }
        } catch (error) {
            console.error("Erro crítico:", error);
        } finally {
            setLoading(false);
            setSelecionados([]); // Limpa seleção ao recarregar/mudar filtro
        }
    }, [statusFiltro]);

    useEffect(() => {
        carregarFila();
    }, [carregarFila]);

    // 2. Filtragem Local (Busca Rápida)
    const dadosFiltrados = useMemo(() => {
        if (!busca) return items;
        const termo = busca.toLowerCase();
        return items.filter(item => 
            (item.identificacao?.toLowerCase().includes(termo)) ||
            (item.amostra_numero?.includes(termo)) ||
            (item.parametro_nome?.toLowerCase().includes(termo))
        );
    }, [items, busca]);

    // 3. Gestão de Seleção (Checkboxes)
    const toggleSelecao = (id: number) => {
        setSelecionados(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelecionarTudo = () => {
        if (selecionados.length === dadosFiltrados.length) {
            setSelecionados([]);
        } else {
            setSelecionados(dadosFiltrados.map(i => i.analise_id));
        }
    };

    // 4. Ação: Iniciar Análises (O Coração da Funcionalidade)
    const prepararInicio = () => {
        if (selecionados.length === 0) return;

        if (statusFiltro === 'em_campo') {
            // Fast-Track: Confirmação direta, sem modal de data
            if(window.confirm(`Confirma o início de ${selecionados.length} análises com a data da coleta?`)){
                enviarInicio(true);
            }
        } else {
            // Wizard: Abre modal para definir data/hora
            const agora = new Date();
            setDataInicio(agora.toISOString().split('T')[0]); // YYYY-MM-DD
            setHoraInicio(agora.toTimeString().substring(0, 5)); // HH:MM
            setModalAberto(true);
        }
    };

    const enviarInicio = async (isCampo: boolean) => {
        setLoading(true);
        try {
            const payload = {
                analise_ids: selecionados,
                id_parametro: 0, // O Backend resolve isso ou pegamos do contexto
                usuario_id: 1, // TODO: Pegar do Contexto de Autenticação Real
                data_inicio: dataInicio,
                hora_inicio: horaInicio,
                is_em_campo: isCampo
            };

            const res: ApiResponse<null> = await invoke("iniciar_analises_tauri", { payload });
            
            if (res.success) {
                setModalAberto(false);
                carregarFila(); // Refresh automático
                // TODO: Toast de sucesso aqui
            } else {
                alert("Erro ao iniciar: " + res.message);
            }
        } catch (error) {
            alert("Erro de comunicação com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* --- Cabeçalho Moderno --- */}
            <header className={styles.header}>
                <div className={styles.titleArea}>
                    <h1><FaFlask /> Fila de Trabalho</h1>
                    <div className={styles.searchBar}>
                        <FaSearch />
                        <input 
                            type="text" 
                            placeholder="Buscar por amostra, identificação..." 
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                {/* Abas de Navegação (Substitui o ComboBox) */}
                <div className={styles.tabs}>
                    <button 
                        className={statusFiltro === 'aguardando' ? styles.activeTab : ''}
                        onClick={() => setStatusFiltro('aguardando')}
                    >
                        <FaClock /> Aguardando
                    </button>
                    <button 
                        className={statusFiltro === 'em_campo' ? styles.activeTab : ''}
                        onClick={() => setStatusFiltro('em_campo')}
                    >
                        <FaMapMarkerAlt /> Em Campo
                    </button>
                    <button 
                        className={statusFiltro === 'analisando' ? styles.activeTab : ''}
                        onClick={() => setStatusFiltro('analisando')}
                    >
                        <FaPlay /> Em Análise
                    </button>
                    <button 
                        className={statusFiltro === 'finalizada' ? styles.activeTab : ''}
                        onClick={() => setStatusFiltro('finalizada')}
                    >
                        <FaCheckDouble /> Finalizadas
                    </button>
                </div>
            </header>

            {/* --- Tabela de Dados (Data Grid) --- */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{width: '40px'}}>
                                <input 
                                    type="checkbox" 
                                    checked={items.length > 0 && selecionados.length === dadosFiltrados.length}
                                    onChange={toggleSelecionarTudo}
                                />
                            </th>
                            <th>Amostra</th>
                            <th>Identificação</th>
                            <th>Parâmetro</th>
                            <th>POP / Técnica</th>
                            <th>Entrada Lab.</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className={styles.loadingState}>Carregando dados...</td></tr>
                        ) : dadosFiltrados.map(item => (
                            <tr 
                                key={item.analise_id} 
                                className={selecionados.includes(item.analise_id) ? styles.selectedRow : ''}
                                onClick={() => toggleSelecao(item.analise_id)}
                            >
                                <td onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selecionados.includes(item.analise_id)}
                                        onChange={() => toggleSelecao(item.analise_id)}
                                    />
                                </td>
                                <td className={styles.mono}>{item.amostra_numero}</td>
                                <td>
                                    <div className={styles.identificacao}>{item.identificacao}</div>
                                    <small>{item.complemento}</small>
                                </td>
                                <td>{item.parametro_nome}</td>
                                <td>
                                    <span className={styles.popTag}>
                                        {item.pop_codigo} {item.pop_numero}/{item.pop_revisao}
                                    </span>
                                    <br/><small>{item.tecnica_nome}</small>
                                </td>
                                <td>{item.data_lab} {item.hora_lab}</td>
                                <td>
                                    <span className={`${styles.statusBadge} ${styles[statusFiltro]}`}>
                                        {statusFiltro.replace('_', ' ')}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {!loading && dadosFiltrados.length === 0 && (
                            <tr><td colSpan={7} className={styles.emptyState}>Nenhum item encontrado nesta fila.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- Barra de Ações Flutuante (Floating Action Bar) --- */}
            {selecionados.length > 0 && (statusFiltro === 'aguardando' || statusFiltro === 'em_campo') && (
                <div className={styles.floatingBar}>
                    <div className={styles.selectionInfo}>
                        <strong>{selecionados.length}</strong> itens selecionados
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.btnPrimary} onClick={prepararInicio}>
                            {statusFiltro === 'em_campo' ? 'Confirmar Coleta' : 'Iniciar Análises'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- Modal de Início (Wizard) --- */}
            {modalAberto && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <h3>Iniciar Análises</h3>
                        <p>Informe a data e hora real do início das atividades no laboratório.</p>
                        
                        <div className={styles.formGroup}>
                            <label>Data de Início</label>
                            <input 
                                type="date" 
                                value={dataInicio} 
                                onChange={e => setDataInicio(e.target.value)} 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Hora de Início</label>
                            <input 
                                type="time" 
                                value={horaInicio} 
                                onChange={e => setHoraInicio(e.target.value)} 
                            />
                        </div>

                        <div className={styles.modalFooter}>
                            <button onClick={() => setModalAberto(false)} className={styles.btnCancel}>Cancelar</button>
                            <button onClick={() => enviarInicio(false)} className={styles.btnConfirm}>Confirmar Início</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisualizarFilaTrabalho;