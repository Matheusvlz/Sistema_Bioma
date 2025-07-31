import React, { useState, useEffect } from 'react';
import { Search, Calendar, User, MapPin, Filter, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './css/HistoricoUsuario.module.css';
import { listen } from '@tauri-apps/api/event';
import { emit } from '@tauri-apps/api/event';
import { core } from "@tauri-apps/api";

interface HistoricoItem {
    descricao: string;
    login: string;
    ip: string;
    dt: string;
}

interface Cliente {
    usuarioId: number;
}

interface UsuarioClienteResponse {
    success: boolean;
    data?: HistoricoItem[];
    message?: string;
}

export const HistoricoUsuario: React.FC = () => {
    const [historico, setHistorico] = useState<HistoricoItem[]>([]);
    const [historicoCompleto, setHistoricoCompleto] = useState<HistoricoItem[]>([]);
    const [usuarioId, setUsuarioId] = useState<Cliente | null>(null);
    const [filtroDescricao, setFiltroDescricao] = useState('');
    const [loading, setLoading] = useState(false);
    const [filtroAtivo, setFiltroAtivo] = useState(false);
    
    // Estados da paginação
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [itensPorPagina] = useState(50);
    const [inputPagina, setInputPagina] = useState('1');

    useEffect(() => {
        let unlisten: (() => void) | undefined;

        const setupListener = async () => {
            try {
                unlisten = await listen('window-data', (event) => {
                    
                    const dados = event.payload as Cliente;
                    if (dados) {
                        setUsuarioId(dados);
                    }
                });

                await emit('window-ready');
            } catch (error) {
                console.error('Erro ao configurar listener:', error);
            }
        };

        setupListener();

        return () => {
            if (unlisten) {
                unlisten();
            }
        };
    }, []);

    useEffect(() => {
        if (usuarioId) {
            carregarHistorico();
        }
    }, [usuarioId])

    useEffect(() => {
        setInputPagina(paginaAtual.toString());
    }, [paginaAtual]);
    
    const carregarHistorico = async () => {
        if (!usuarioId) return;
        
        setLoading(true);
        try {
            const response: UsuarioClienteResponse = await core.invoke('historico_usuario', { 
                usuarioId: usuarioId 
            });

            if (response.success && response.data) {
                setHistoricoCompleto(response.data);
                setHistorico(response.data);
                setPaginaAtual(1);
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFiltrar = () => {
        setFiltroAtivo(!!filtroDescricao.trim());
        
        if (filtroDescricao.trim()) {
            const dadosFiltrados = historicoCompleto.filter(item =>
                item.descricao.toLowerCase().includes(filtroDescricao.toLowerCase())
            );
            setHistorico(dadosFiltrados);
        } else {
            setHistorico(historicoCompleto);
        }
        setPaginaAtual(1);
    };

    const handleLimparFiltro = () => {
        setFiltroDescricao('');
        setFiltroAtivo(false);
        setHistorico(historicoCompleto);
        setPaginaAtual(1);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFiltrar();
        }
    };

    const totalPaginas = Math.ceil(historico.length / itensPorPagina);
    const indiceInicial = (paginaAtual - 1) * itensPorPagina;
    const indiceFinal = indiceInicial + itensPorPagina;
    const itensPaginaAtual = historico.slice(indiceInicial, indiceFinal);

    const irParaPagina = (numeroPagina: number) => {
        if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
            setPaginaAtual(numeroPagina);
        }
    };

    const handleInputPaginaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputPagina(e.target.value);
    };

    const handleInputPaginaKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const numeroPagina = parseInt(inputPagina);
            if (!isNaN(numeroPagina)) {
                irParaPagina(numeroPagina);
            } else {
                setInputPagina(paginaAtual.toString());
            }
        }
    };

    const handleInputPaginaBlur = () => {
        const numeroPagina = parseInt(inputPagina);
        if (!isNaN(numeroPagina)) {
            irParaPagina(numeroPagina);
        } else {
            setInputPagina(paginaAtual.toString());
        }
    };

    const handleInputPaginaFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.target.select();
    };

    return (
        <div className={styles["historico-container"]}>
            <div className={styles["historico-header"]}>
                <div className={styles["header-content"]}>
                    <div className={styles["title-section"]}>
                        <User className={styles["title-icon"]} />
                        <div>
                            <h1>Histórico do Cliente</h1>
                        </div>
                    </div>

                    <button
                        className={styles["refresh-btn"]}
                        onClick={() => carregarHistorico()}
                        disabled={loading}
                    >
                        <RefreshCw className={`${styles["refresh-icon"]} ${loading ? `${styles["spinning"]}` : ''}`} />
                    </button>
                </div>
            </div>

            <div className={styles["filter-section"]}>
                <div className={styles["filter-container"]}>
                    <div className={styles["search-input-group"]}>
                        <Search className={styles["search-icon"]} />
                        <input
                            type="text"
                            placeholder="Filtrar por descrição..."
                            value={filtroDescricao}
                            onChange={(e) => setFiltroDescricao(e.target.value)}
                            onKeyPress={handleKeyPress}
                            className={styles["search-input"]}
                        />
                    </div>

                    <div className={styles["filter-buttons"]}>
                        <button
                            className={`${styles["filter-btn"]} ${styles["primary"]}`}
                            onClick={handleFiltrar}
                            disabled={loading}
                        >
                            <Filter size={16} />
                            Filtrar
                        </button>

                        {filtroAtivo && (
                            <button
                                className={`${styles["filter-btn"]} ${styles["secondary"]}`}
                                onClick={handleLimparFiltro}
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={styles["table-container"]}>
                {loading ? (
                    <div className={styles["loading-state"]}>
                        <RefreshCw className={styles["loading-spinner"]} />
                        <p>Carregando histórico...</p>
                    </div>
                ) : historico.length === 0 ? (
                    <div className={styles["empty-state"]}>
                        <Calendar size={48} />
                        <h3>Nenhum registro encontrado</h3>
                        <p>
                            {filtroAtivo
                                ? 'Tente ajustar os filtros de busca'
                                : 'Não há histórico disponível para este cliente'
                            }
                        </p>
                    </div>
                ) : (
                    <div className={styles["table-wrapper"]}>
                        <table className={styles["historico-table"]}>
                            <thead>
                                <tr>
                                    <th>
                                        <Calendar size={16} />
                                        Data/Hora
                                    </th>
                                    <th>
                                        <User size={16} />
                                        Descrição
                                    </th>
                                    <th>
                                        <MapPin size={16} />
                                        IP
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {itensPaginaAtual.map((item, index) => (
                                    <tr key={`${item.dt}-${indiceInicial + index}`} className={styles["table-row"]}>
                                        <td className={styles["date-cell"]}>{item.dt}</td>
                                        <td className={styles["description-cell"]}>{item.descricao}</td>
                                        <td className={styles["ip-cell"]}>
                                            <span className={styles["ip-badge"]}>{item.ip}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {historico.length > 0 && (
                <div className={styles["pagination-section"]}>
                    <div className={styles["pagination-controls"]}>
                        <button
                            className={styles["pagination-btn"]}
                            onClick={() => irParaPagina(paginaAtual - 1)}
                            disabled={paginaAtual === 1}
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>

                        <div className={styles["pagination-info"]}>
                            <div className={styles["page-input-container"]}>
                                <span>Página </span>
                                <input
                                    type="text"
                                    value={inputPagina}
                                    onChange={handleInputPaginaChange}
                                    onKeyPress={handleInputPaginaKeyPress}
                                    onBlur={handleInputPaginaBlur}
                                    onFocus={handleInputPaginaFocus}
                                    className={styles["page-input"]}
                                />
                                <span> de {totalPaginas}</span>
                            </div>
                            <div className={styles["items-per-page"]}>
                                ({itensPorPagina} itens por página)
                            </div>
                        </div>

                        <button
                            className={styles["pagination-btn"]}
                            onClick={() => irParaPagina(paginaAtual + 1)}
                            disabled={paginaAtual === totalPaginas}
                        >
                            Próxima
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className={styles["footer-info"]}>
                <p>Total de registros: <strong>{historico.length}</strong></p>
                {historico.length > 0 && (
                    <p>
                        Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, historico.length)} de {historico.length} registros
                    </p>
                )}
                {filtroAtivo && (
                    <p className={styles["filter-info"]}>
                        Filtro ativo: "{filtroDescricao}"
                    </p>
                )}
            </div>
        </div>
    );
};