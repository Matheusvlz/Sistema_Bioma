// src/view/geral/CadastrarPacote.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';
import styles from './css/CadastrarPacote.module.css';

// --- Ícones SVG ---
const ChevronsRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 17 5-5-5-5m7 10 5-5-5-5"/></svg>;
const ChevronsLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m11 17-5-5 5-5m7 10-5-5 5-5"/></svg>;

// --- Interfaces ---
interface Legislacao { id: number; nome: string; }
interface ParametroSimples { id: number; nome: string; }
interface PacoteCompleto { id: number; nome: string | null; legislacao: number | null; parametros: number[]; }
interface PacotePayload { nome: string; legislacao: number; parametros: number[]; }
interface ApiResponse<T> { success: boolean; data?: T; message?: string; }
interface Message { type: 'success' | 'error'; text: string; }

export const CadastrarPacote: React.FC = () => {
    const [idPacote, setIdPacote] = useState<number | null>(null);
    const isEditMode = useMemo(() => idPacote !== null, [idPacote]);
    
    const [nomePacote, setNomePacote] = useState('');
    const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
    const [legislacaoSelecionada, setLegislacaoSelecionada] = useState<Legislacao | null>(null);
    
    const [allParamsForLeg, setAllParamsForLeg] = useState<ParametroSimples[]>([]);
    const [parametrosDisponiveis, setParametrosDisponiveis] = useState<ParametroSimples[]>([]);
    const [parametrosSelecionados, setParametrosSelecionados] = useState<ParametroSimples[]>([]);
    
    const [filtroDisponiveis, setFiltroDisponiveis] = useState('');
    const [filtroSelecionados, setFiltroSelecionados] = useState('');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);

    // Estados para o autocomplete de legislação
    const [searchTermLegislacao, setSearchTermLegislacao] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        if (id) {
            setIdPacote(Number(id));
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        invoke<ApiResponse<Legislacao[]>>("listar_legislacoes_ativas_tauri")
            .then(res => res.success && res.data && setLegislacoes(res.data));
    }, []);

    useEffect(() => {
        if (!legislacaoSelecionada) {
            setAllParamsForLeg([]);
            setParametrosDisponiveis([]);
            return;
        }
        setLoading(true);
        invoke<ApiResponse<ParametroSimples[]>>("listar_parametros_simples_tauri", { legislacaoId: legislacaoSelecionada.id })
            .then(res => {
                if (res.success && res.data) {
                    const sortedParams = res.data.sort((a, b) => a.nome.localeCompare(b.nome));
                    setAllParamsForLeg(sortedParams);
                }
            }).finally(() => setLoading(false));
    }, [legislacaoSelecionada]);

    useEffect(() => {
        if (isEditMode && idPacote && allParamsForLeg.length > 0) {
            invoke<ApiResponse<PacoteCompleto>>("buscar_pacote_por_id_tauri", { id: idPacote })
            .then(res => {
                if (res.success && res.data) {
                    const pacote = res.data;
                    const selectedIds = new Set(pacote.parametros);
                    
                    const newSelected = allParamsForLeg.filter(p => selectedIds.has(p.id));
                    const newAvailable = allParamsForLeg.filter(p => !selectedIds.has(p.id));
                    
                    setParametrosSelecionados(newSelected);
                    setParametrosDisponiveis(newAvailable);
                }
            });
        } else if (!isEditMode) {
             setParametrosDisponiveis(allParamsForLeg);
             setParametrosSelecionados([]);
        }
    }, [idPacote, isEditMode, allParamsForLeg]);

    useEffect(() => {
        if (isEditMode && idPacote && legislacoes.length > 0) {
            invoke<ApiResponse<PacoteCompleto>>("buscar_pacote_por_id_tauri", { id: idPacote })
            .then(res => {
                if (res.success && res.data) {
                    const pacote = res.data;
                     setNomePacote(pacote.nome || '');
                     const leg = legislacoes.find(l => l.id === pacote.legislacao);
                     if(leg) {
                        setLegislacaoSelecionada(leg);
                        setSearchTermLegislacao(leg.nome); // Preenche o campo de busca
                     }
                }
            })
        }
    }, [idPacote, isEditMode, legislacoes])
    
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

    const moveItems = (itemsToMove: ParametroSimples[], source: 'disponiveis' | 'selecionados') => {
        const idsToMove = new Set(itemsToMove.map(p => p.id));
        if (source === 'disponiveis') {
            setParametrosSelecionados(prev => [...prev, ...itemsToMove].sort((a, b) => a.nome.localeCompare(b.nome)));
            setParametrosDisponiveis(prev => prev.filter(p => !idsToMove.has(p.id)));
        } else {
            setParametrosDisponiveis(prev => [...prev, ...itemsToMove].sort((a, b) => a.nome.localeCompare(b.nome)));
            setParametrosSelecionados(prev => prev.filter(p => !idsToMove.has(p.id)));
        }
    };

    const handleSave = async () => {
        if (!nomePacote || !legislacaoSelecionada || parametrosSelecionados.length === 0) {
            setMessage({ type: 'error', text: "Preencha o nome, selecione uma legislação e ao menos um parâmetro." });
            return;
        }
        setSubmitting(true);
        setMessage(null);
        const payload: PacotePayload = {
            nome: nomePacote,
            legislacao: legislacaoSelecionada.id,
            parametros: parametrosSelecionados.map(p => p.id)
        };

        try {
            const command = isEditMode ? "editar_pacote_tauri" : "criar_pacote_tauri";
            const args = isEditMode ? { id: idPacote!, payload } : { payload };
            const res: ApiResponse<null> = await invoke(command, args);
            
            if (res.success) {
                await emit('pacote-salvo');
                const currentWindow = Window.getCurrent();
                await currentWindow.close();
            } else {
                setMessage({ type: 'error', text: res.message || "Ocorreu um erro ao salvar." });
            }
        } catch(err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            setMessage({ type: 'error', text: `Erro de comunicação: ${errorMsg}`});
        } finally {
            setSubmitting(false);
        }
    };
    
    const filteredDisponiveis = useMemo(() => parametrosDisponiveis.filter(p => p.nome.toLowerCase().includes(filtroDisponiveis.toLowerCase())), [parametrosDisponiveis, filtroDisponiveis]);
    const filteredSelecionados = useMemo(() => parametrosSelecionados.filter(p => p.nome.toLowerCase().includes(filtroSelecionados.toLowerCase())), [parametrosSelecionados, filtroSelecionados]);

    return (
        <div className={styles.container}>
            {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

            <header>
                <h2>{isEditMode ? 'Editar Pacote de Parâmetros' : 'Novo Pacote de Parâmetros'}</h2>
                {isEditMode && <span className={styles.packageId}>ID do Pacote: {idPacote}</span>}
            </header>

            <section className={styles.formGrid}>
                <div className={styles.formGroup}>
                    <label>Nome do Pacote</label>
                    <input type="text" value={nomePacote} onChange={e => setNomePacote(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                    <label>Legislação Base</label>
                    <div className={styles.autocompleteContainer} ref={autocompleteRef}>
                         <input
                            type="text"
                            placeholder="Buscar por legislação..."
                            className={styles.input}
                            value={searchTermLegislacao}
                            onChange={(e) => {
                                setSearchTermLegislacao(e.target.value);
                                setIsDropdownOpen(true);
                                if (e.target.value === '') {
                                    setLegislacaoSelecionada(null);
                                }
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            disabled={isEditMode}
                        />
                        {isDropdownOpen && (
                            <div className={styles.autocompleteDropdown}>
                                {legislacoes
                                    .filter(leg => leg.nome.toLowerCase().includes(searchTermLegislacao.toLowerCase()))
                                    .map(leg => (
                                        <div
                                            key={leg.id}
                                            className={styles.autocompleteOption}
                                            onMouseDown={() => {
                                                setLegislacaoSelecionada(leg);
                                                setSearchTermLegislacao(leg.nome);
                                                setIsDropdownOpen(false);
                                                if (!isEditMode) setParametrosSelecionados([]);
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
            </section>

            <section className={styles.shuttleContainer}>
                <div className={styles.listContainer}>
                    <h3>Disponíveis ({filteredDisponiveis.length})</h3>
                    <input type="text" placeholder="Buscar..." value={filtroDisponiveis} onChange={e => setFiltroDisponiveis(e.target.value)} className={styles.listSearchInput} disabled={!legislacaoSelecionada} />
                    <ul className={styles.list}>
                        {loading && !allParamsForLeg.length ? <li className={styles.noResults}>Carregando...</li> : filteredDisponiveis.map(p => <li key={p.id} onDoubleClick={() => moveItems([p], 'disponiveis')}>{p.nome}</li>)}
                    </ul>
                </div>

                <div className={styles.shuttleControls}>
                    <button onClick={() => moveItems(filteredDisponiveis, 'disponiveis')} title="Adicionar Todos" disabled={!legislacaoSelecionada}><ChevronsRight /></button>
                    <button onClick={() => moveItems(filteredSelecionados, 'selecionados')} title="Remover Todos" disabled={!legislacaoSelecionada}><ChevronsLeft /></button>
                </div>

                <div className={styles.listContainer}>
                    <h3>Selecionados ({filteredSelecionados.length})</h3>
                    <input type="text" placeholder="Buscar..." value={filtroSelecionados} onChange={e => setFiltroSelecionados(e.target.value)} className={styles.listSearchInput} disabled={!legislacaoSelecionada} />
                    <ul className={styles.list}>
                        {filteredSelecionados.map(p => <li key={p.id} onDoubleClick={() => moveItems([p], 'selecionados')}>{p.nome}</li>)}
                    </ul>
                </div>
            </section>

            <footer>
                <button 
                    onClick={async () => {
                        const currentWindow = Window.getCurrent();
                        await currentWindow.close();
                    }}
                    className={styles.buttonSecondary} 
                    disabled={submitting}
                >
                    Cancelar
                </button>
                <button onClick={handleSave} className={styles.buttonPrimary} disabled={submitting || loading}>
                    {submitting ? <div className={styles.actionSpinner}></div> : (isEditMode ? 'Salvar Alterações' : 'Criar Pacote')}
                </button>
            </footer>
        </div>
    );
};