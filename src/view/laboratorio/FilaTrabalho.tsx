import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { FaSearch, FaFlask, FaCheckDouble, FaMapMarkerAlt, FaClock, FaPlay, FaFolderOpen, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './css/FilaTrabalho.module.css';

// --- Interfaces ---

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
    em_campo: number | null; // Atualizado para number (0 ou 1) conforme banco
    data_inicio: string | null;
    usuario_visto: number | null;
}

interface PaginatedResponse {
    items: ItemFilaTrabalho[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface FilaProps {
    onAbrirMapa: (idParametro: number, idAmostra?: number) => void;
}

const FilaTrabalho: React.FC<FilaProps> = ({ onAbrirMapa }) => {
    // --- Estados de Dados ---
    const [items, setItems] = useState<ItemFilaTrabalho[]>([]);
    const [loading, setLoading] = useState(false);
    
    // --- Filtros Principais ---
    const [statusFiltro, setStatusFiltro] = useState('aguardando');
    const [idLaboratorio, setIdLaboratorio] = useState<number | null>(null); // Null = Todos
    
    // --- Paginação e Busca ---
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [busca, setBusca] = useState('');
    
    // --- Seleção ---
    const [selecionados, setSelecionados] = useState<number[]>([]);
    
    // --- Modal de Início ---
    const [modalAberto, setModalAberto] = useState(false);
    const [dataInicio, setDataInicio] = useState('');
    const [horaInicio, setHoraInicio] = useState('');

    // 1. Carregamento de Dados (Paginado)
    const carregarFila = useCallback(async () => {
        setLoading(true);
        try {
            // Chamada ao Backend com Paginação
            const res: ApiResponse<PaginatedResponse> = await invoke("listar_fila_trabalho_tauri", { 
                status: statusFiltro,
                idLaboratorio: idLaboratorio,
                page: page,
                perPage: 50 // Limite fixo de 50 itens por vez
            });
            
            if (res.success && res.data) {
                setItems(res.data.items);
                setTotalPages(res.data.total_pages);
                setTotalItems(res.data.total);
            } else {
                console.error(res.message);
                if (res.message?.includes("Erro")) alert(res.message);
            }
        } catch (error) {
            console.error(error);
            alert("Erro de comunicação com o servidor.");
        } finally {
            setLoading(false);
            setSelecionados([]); // Limpa seleção ao mudar página/filtro
        }
    }, [statusFiltro, idLaboratorio, page]);

    // Resetar para página 1 se mudar os filtros principais
    useEffect(() => {
        setPage(1);
    }, [statusFiltro, idLaboratorio]);

    // Carregar dados quando qualquer dependência mudar
    useEffect(() => {
        carregarFila();
    }, [carregarFila]);

    // 2. Filtragem Local (Busca Texto)
    // Nota: A busca filtra apenas os itens da página atual visualmente.
    const dadosFiltrados = useMemo(() => {
        if (!busca) return items;
        const termo = busca.toLowerCase();
        return items.filter(item => 
            (item.identificacao?.toLowerCase().includes(termo)) ||
            (item.amostra_numero?.includes(termo)) ||
            (item.parametro_nome?.toLowerCase().includes(termo))
        );
    }, [items, busca]);

    // 3. Gestão de Seleção
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

    // 4. Wizard de Inicialização
    const prepararInicio = () => {
        if (selecionados.length === 0) return;

        if (statusFiltro === 'em_campo') {
            if(window.confirm(`Confirma o início de ${selecionados.length} análises com a data da coleta?`)){
                enviarInicio(true);
            }
        } else {
            // Preenche com data/hora atual
            const agora = new Date();
            const yyyy = agora.getFullYear();
            const mm = String(agora.getMonth() + 1).padStart(2, '0');
            const dd = String(agora.getDate()).padStart(2, '0');
            setDataInicio(`${yyyy}-${mm}-${dd}`);
            
            const hh = String(agora.getHours()).padStart(2, '0');
            const min = String(agora.getMinutes()).padStart(2, '0');
            setHoraInicio(`${hh}:${min}`);
            
            setModalAberto(true);
        }
    };

    const enviarInicio = async (isCampo: boolean) => {
        setLoading(true);
        try {
            // Tenta pegar o parametro_pop do primeiro item selecionado (para compatibilidade SQL legado)
            // Se não encontrar, envia 0 (o backend deve ser robusto para lidar se possível)
            // Em produção real, o backend deveria usar apenas analise_id.
            const fakeIdParametro = 39; 

            const payload = {
                analise_ids: selecionados,
                id_parametro: fakeIdParametro, 
                usuario_id: 1, // TODO: Pegar do AuthContext
                data_inicio: dataInicio,
                hora_inicio: horaInicio,
                is_em_campo: isCampo
            };

            const res: ApiResponse<null> = await invoke("iniciar_analises_tauri", { payload });
            
            if (res.success) {
                setModalAberto(false);
                carregarFila(); // Recarrega dados
                alert("Análises iniciadas com sucesso!");
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
            <header className={styles.header}>
                {/* Linha Superior: Título, Filtro Lab, Busca e Paginação */}
                <div className={styles.topRow}>
                    <div className={styles.titleArea}>
                        <h1><FaFlask /> Fila de Trabalho</h1>
                        
                        {/* Seletor de Laboratório */}
                        <select 
                            className={styles.labSelect}
                            value={idLaboratorio || ''}
                            onChange={e => setIdLaboratorio(e.target.value ? Number(e.target.value) : null)}
                        >
                            <option value="">Todos Laboratórios</option>
                            <option value="1">Físico-Químico</option>
                            <option value="2">Microbiologia</option>
                        </select>

                        <div className={styles.searchBar}>
                            <FaSearch />
                            <input 
                                type="text" 
                                placeholder="Buscar na página..." 
                                value={busca}
                                onChange={e => setBusca(e.target.value)}
                            />
                        </div>
                    </div>
                    
                    {/* Controles de Paginação */}
                    <div className={styles.paginationControls}>
                        <span className={styles.pageInfo}>{totalItems} registros</span>
                        <button 
                            disabled={page <= 1 || loading} 
                            onClick={() => setPage(p => p - 1)}
                            title="Página Anterior"
                        >
                            <FaChevronLeft />
                        </button>
                        <span className={styles.pageNumber}>Pág {page} de {totalPages || 1}</span>
                        <button 
                            disabled={page >= totalPages || loading} 
                            onClick={() => setPage(p => p + 1)}
                            title="Próxima Página"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                {/* Linha Inferior: Abas de Status */}
                <div className={styles.tabs}>
                    <button onClick={() => setStatusFiltro('aguardando')} className={statusFiltro === 'aguardando' ? styles.activeTab : ''}><FaClock /> Aguardando</button>
                    <button onClick={() => setStatusFiltro('em_campo')} className={statusFiltro === 'em_campo' ? styles.activeTab : ''}><FaMapMarkerAlt /> Em Campo</button>
                    <button onClick={() => setStatusFiltro('analisando')} className={statusFiltro === 'analisando' ? styles.activeTab : ''}><FaPlay /> Em Análise</button>
                    <button onClick={() => setStatusFiltro('finalizada')} className={statusFiltro === 'finalizada' ? styles.activeTab : ''}><FaCheckDouble /> Finalizadas</button>
                </div>
            </header>

            {/* Tabela de Dados */}
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
                            <th>Entrada</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} className={styles.loadingState}>Carregando dados...</td></tr>
                        ) : dadosFiltrados.length === 0 ? (
                            <tr><td colSpan={7} className={styles.emptyState}>Nenhum item encontrado nesta página.</td></tr>
                        ) : dadosFiltrados.map((item) => (
                            <tr 
                                key={item.analise_id} 
                                onClick={() => toggleSelecao(item.analise_id)}
                                className={selecionados.includes(item.analise_id) ? styles.selectedRow : ''}
                            >
                                <td onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        checked={selecionados.includes(item.analise_id)}
                                        onChange={() => toggleSelecao(item.analise_id)}
                                    />
                                </td>
                                <td className={styles.mono}>{item.amostra_numero}</td>
                                <td>{item.identificacao} <br/><small>{item.complemento}</small></td>
                                <td>{item.parametro_nome}</td>
                                <td><span className={styles.popTag}>{item.pop_codigo} {item.pop_numero}</span></td>
                                <td>{item.data_lab} {item.hora_lab}</td>
                                <td>
                                    {statusFiltro !== 'aguardando' && (
                                        <button className={styles.btnGhost} onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Backend deve retornar ID do parametro_pop real.
                                            // Usando 39 como fallback temporário.
                                            onAbrirMapa(39, item.analise_id); 
                                        }}>
                                            <FaFolderOpen /> Abrir
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Barra Flutuante de Ação */}
            {selecionados.length > 0 && (statusFiltro === 'aguardando' || statusFiltro === 'em_campo') && (
                <div className={styles.floatingBar}>
                    <div className={styles.selectionInfo}>
                        <strong>{selecionados.length}</strong> itens selecionados
                    </div>
                    <div className={styles.actions}>
                        <button className={styles.btnPrimary} onClick={prepararInicio}>
                            {statusFiltro === 'em_campo' ? 'Confirmar Coleta (Fast)' : 'Iniciar Análises'}
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Início */}
            {modalAberto && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalCard}>
                        <h3>Iniciar Análises</h3>
                        <p>Informe a data e hora de início.</p>
                        
                        <div className={styles.formGroup}>
                            <label>Data Início</label>
                            <input 
                                type="date" 
                                value={dataInicio} 
                                onChange={e => setDataInicio(e.target.value)} 
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Hora Início</label>
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

export default FilaTrabalho;