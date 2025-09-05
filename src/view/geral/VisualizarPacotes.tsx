// src/view/geral/VisualizarPacotes.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { WindowManager } from '../../hooks/WindowManager';
import styles from './css/VisualizarPacotes.module.css';

// --- Ícones SVG como Componentes ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const AddIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;

// --- Interfaces ---
interface Pacote {
    id: number;
    nome: string | null;
    legislacao: number | null;
}
interface Legislacao {
    id: number;
    nome: string;
}
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}
interface Message {
    type: 'success' | 'error';
    text: string;
}

// --- Hook Customizado para Debounce ---
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

export const VisualizarPacotes: React.FC = () => {
    const [pacotes, setPacotes] = useState<Pacote[]>([]);
    const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [message, setMessage] = useState<Message | null>(null);
    
    const [filtroNome, setFiltroNome] = useState('');
    const [filtroLegislacao, setFiltroLegislacao] = useState('');
    
    const debouncedFiltroNome = useDebounce(filtroNome, 300);
    
    const [searchTermLegislacao, setSearchTermLegislacao] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const legislacaoMap = useMemo(() => {
        return new Map(legislacoes.map(leg => [leg.id, leg.nome]));
    }, [legislacoes]);

    const carregarLegislacoes = async () => {
        try {
            const res: ApiResponse<Legislacao[]> = await invoke("listar_legislacoes_ativas_tauri");
            if (res.success && res.data) {
                setLegislacoes(res.data);
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Falha ao carregar legislações.' });
        }
    };
    
    const carregarPacotes = useCallback(async () => {
        setLoading(true);
        try {
            const legislacaoId = filtroLegislacao ? parseInt(filtroLegislacao, 10) : undefined;
            const res: ApiResponse<Pacote[]> = await invoke("listar_pacotes_tauri", {
                nome: debouncedFiltroNome || null,
                legislacaoId: legislacaoId,
            });

            if (res.success && res.data) {
                setPacotes(res.data);
            } else {
                setMessage({ type: 'error', text: res.message || "Falha ao carregar pacotes." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Erro de comunicação com o backend." });
        } finally {
            setLoading(false);
        }
    }, [debouncedFiltroNome, filtroLegislacao]);

    useEffect(() => {
        carregarLegislacoes();
    }, []);

    useEffect(() => {
        carregarPacotes();
    }, [carregarPacotes]);

    useEffect(() => {
        const unlistenPromise = listen('pacote-salvo', () => {
            setMessage({ type: 'success', text: 'Lista atualizada com sucesso!' });
            carregarPacotes();
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, [carregarPacotes]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleNovoPacote = () => {
        WindowManager.openCadastrarPacote();
    };
    
    const handleEditarPacote = (id: number) => {
        WindowManager.openCadastrarPacote(id);
    };

    const handleRemover = async (id: number) => {
        if (!window.confirm("Tem certeza que deseja remover este pacote? A ação não pode ser desfeita.")) return;
        
        setDeletingId(id);
        setMessage(null);
        try {
            const res: ApiResponse<null> = await invoke("deletar_pacote_tauri", { id });
            if(res.success) {
                setMessage({ type: 'success', text: "Pacote removido com sucesso!" });
                carregarPacotes();
            } else {
                setMessage({ type: 'error', text: res.message || "Erro ao remover pacote." });
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setMessage({ type: 'error', text: `Erro ao remover: ${errorMsg}` });
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className={styles.container}>
            {message && (
                <div className={`${styles.message} ${styles[message.type]}`}>
                    {message.text}
                    <button onClick={() => setMessage(null)} className={styles.closeMessage}>&times;</button>
                </div>
            )}

            <header className={styles.header}>
                <h2>Gerir Pacotes de Parâmetros</h2>
                <button onClick={handleNovoPacote} className={styles.buttonPrimary} disabled={loading}>
                    <AddIcon /> Novo Pacote
                </button>
            </header>

            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Buscar por nome do pacote..."
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    className={styles.searchInput}
                />
                
                <div className={styles.autocompleteContainer} ref={autocompleteRef}>
                    <input
                        type="text"
                        placeholder="Buscar por legislação..."
                        className={styles.autocompleteInput}
                        value={searchTermLegislacao}
                        onChange={(e) => {
                            setSearchTermLegislacao(e.target.value);
                            setIsDropdownOpen(true);
                            if (e.target.value === '') {
                                setFiltroLegislacao('');
                            }
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                    />
                    {isDropdownOpen && (
                        <div className={styles.autocompleteDropdown}>
                            <div
                                className={styles.autocompleteOption}
                                onMouseDown={() => {
                                    setFiltroLegislacao('');
                                    setSearchTermLegislacao('');
                                    setIsDropdownOpen(false);
                                }}
                            >
                                Todas as Legislações
                            </div>
                            {legislacoes
                                .filter(leg => leg.nome.toLowerCase().includes(searchTermLegislacao.toLowerCase()))
                                .map(leg => (
                                    <div
                                        key={leg.id}
                                        className={styles.autocompleteOption}
                                        onMouseDown={() => {
                                            setFiltroLegislacao(String(leg.id));
                                            setSearchTermLegislacao(leg.nome);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {leg.nome}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>

            <main className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome do Pacote</th>
                            <th>Legislação Associada</th>
                            <th style={{ width: '120px' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className={styles.statusMessage}>
                                        <div className={styles.spinner}></div>
                                        <p>Carregando pacotes...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : pacotes.length === 0 ? (
                            <tr>
                                <td colSpan={4}>
                                    <div className={styles.emptyState}>
                                        <span className={styles.emptyIcon}>📦</span>
                                        <p>Nenhum pacote encontrado.<br/>Tente ajustar os filtros ou crie um novo pacote.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            pacotes.map(pacote => (
                                <tr key={pacote.id}>
                                    <td>{pacote.id}</td>
                                    <td>{pacote.nome || 'N/A'}</td>
                                    <td>{pacote.legislacao ? (legislacaoMap.get(pacote.legislacao) || 'Inválida') : 'N/A'}</td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button 
                                                onClick={() => handleEditarPacote(pacote.id)} 
                                                className={styles.buttonEdit}
                                                title="Editar pacote"
                                                aria-label="Editar pacote"
                                                disabled={deletingId === pacote.id}
                                            >
                                                <EditIcon />
                                            </button>
                                            <button 
                                                onClick={() => handleRemover(pacote.id)} 
                                                className={styles.buttonDelete}
                                                title="Remover pacote"
                                                aria-label="Remover pacote"
                                                disabled={deletingId === pacote.id}
                                            >
                                                {deletingId === pacote.id ? <div className={styles.actionSpinner}></div> : <DeleteIcon />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </main>
        </div>
    );
};