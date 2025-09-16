// src/view/geral/CadastrarPacote.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/CadastrarPacote.module.css';

// --- Ícones SVG ---
const ChevronsRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 17 5-5-5-5m7 10 5-5-5-5"/></svg>;
const ChevronRight = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>;
const ChevronLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>;
const ChevronsLeft = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m11 17-5-5 5-5m7 10-5-5 5-5"/></svg>;

// --- Interfaces ---
interface Legislacao { id: number; nome: string; }
interface ParametroDetalhado {
    id: number;
    nome_parametro: string;
    grupo: string | null;
    unidade: string | null;
    limite_min: string | null;
    limite_simbolo: string | null;
    limite_max: string | null;
    nome_tecnica: string | null;
}
interface PacoteCompleto { id: number; nome: string | null; legislacao: number | null; parametros: number[]; }
interface PacotePayload { nome: string; legislacao: number; parametros: number[]; }
interface ApiResponse<T> { success: boolean; data?: T; message?: string; }
interface Message { type: 'success' | 'error'; text: string; }

interface CadastrarPacoteProps {
    pacoteParaEdicao?: PacoteCompleto;
    onSalvar: () => void;
    onCancelar: () => void;
}

const formatarNomeParametro = (p: ParametroDetalhado): string => {
    const parts = [];
    parts.push(p.nome_parametro);
    if (p.grupo) parts.push(`(${p.grupo})`);
    if (p.nome_tecnica) parts.push(`Téc: ${p.nome_tecnica}`);
    if (p.unidade) parts.push(`Unid: ${p.unidade}`);
    
    const limiteParts = [p.limite_min, p.limite_simbolo, p.limite_max].filter(val => val && val.trim() !== '');
    if (limiteParts.length > 0) {
        parts.push(`Limite: ${limiteParts.join(' ')}`);
    }

    return parts.join(' - ');
};

export const CadastrarPacote: React.FC<CadastrarPacoteProps> = ({ pacoteParaEdicao, onSalvar, onCancelar }) => {
    const isEditMode = !!pacoteParaEdicao;
    
    const [nomePacote, setNomePacote] = useState('');
    const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
    const [legislacaoSelecionada, setLegislacaoSelecionada] = useState<Legislacao | null>(null);
    
    
    const [parametrosDisponiveis, setParametrosDisponiveis] = useState<ParametroDetalhado[]>([]);
    const [parametrosSelecionados, setParametrosSelecionados] = useState<ParametroDetalhado[]>([]);
    
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const [selectedToRemove, setSelectedToRemove] = useState<number | null>(null);
    
    const [filtroDisponiveis, setFiltroDisponiveis] = useState('');
    const [filtroSelecionados, setFiltroSelecionados] = useState('');

    const [loadingParams, setLoadingParams] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<Message | null>(null);
    
    const [searchTermLegislacao, setSearchTermLegislacao] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        invoke<ApiResponse<Legislacao[]>>("listar_legislacoes_ativas_tauri")
            .then(res => {
                if(res.success && res.data) {
                    setLegislacoes(res.data);
                    if (pacoteParaEdicao) {
                        const leg = res.data.find(l => l.id === pacoteParaEdicao.legislacao);
                        if (leg) {
                            setLegislacaoSelecionada(leg);
                            setSearchTermLegislacao(leg.nome);
                        }
                    }
                }
            });

        if (pacoteParaEdicao) {
            setNomePacote(pacoteParaEdicao.nome || '');
        }
    }, [pacoteParaEdicao]);
    
    useEffect(() => {
        if (!legislacaoSelecionada) {
          
            return;
        }
        setLoadingParams(true);
        invoke<ApiResponse<{ items: ParametroDetalhado[] }>>("listar_legislacao_parametro_tauri", { 
            legislacaoId: legislacaoSelecionada.id, page: 1, perPage: 10000 
        })
        .then(res => {
            if (res.success && res.data?.items) {
                const allParams = res.data.items.sort((a, b) => a.nome_parametro.localeCompare(b.nome_parametro));
                if (isEditMode && pacoteParaEdicao) {
                    const selectedIds = new Set(pacoteParaEdicao.parametros);
                    setParametrosSelecionados(allParams.filter(p => selectedIds.has(p.id)));
                    setParametrosDisponiveis(allParams.filter(p => !selectedIds.has(p.id)));
                } else {
                    setParametrosDisponiveis(allParams);
                    setParametrosSelecionados([]);
                }
            } else {
                setMessage({ type: 'error', text: res.message || 'Falha ao carregar parâmetros.' });
            }
        }).finally(() => setLoadingParams(false));
    }, [legislacaoSelecionada, pacoteParaEdicao, isEditMode]);

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

    const handleCheckChange = (paramId: number) => {
        setCheckedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paramId)) newSet.delete(paramId);
            else newSet.add(paramId);
            return newSet;
        });
    };

    const moveCheckedItems = () => {
        const itemsToMove = parametrosDisponiveis.filter(p => checkedIds.has(p.id));
        setParametrosSelecionados(prev => [...prev, ...itemsToMove].sort((a, b) => a.nome_parametro.localeCompare(b.nome_parametro)));
        setParametrosDisponiveis(prev => prev.filter(p => !checkedIds.has(p.id)));
        setCheckedIds(new Set());
    };
    
    const removeSelectedItem = () => {
        if (selectedToRemove === null) return;
        const itemToRemove = parametrosSelecionados.find(p => p.id === selectedToRemove);
        if (itemToRemove) {
            setParametrosDisponiveis(prev => [...prev, itemToRemove].sort((a, b) => a.nome_parametro.localeCompare(b.nome_parametro)));
            setParametrosSelecionados(prev => prev.filter(p => p.id !== selectedToRemove));
            setSelectedToRemove(null);
        }
    };
    
    const moveAllItems = (source: 'disponiveis' | 'selecionados') => {
        if (source === 'disponiveis') {
            setParametrosSelecionados(prev => [...prev, ...parametrosDisponiveis].sort((a, b) => a.nome_parametro.localeCompare(b.nome_parametro)));
            setParametrosDisponiveis([]);
        } else {
            setParametrosDisponiveis(prev => [...prev, ...parametrosSelecionados].sort((a, b) => a.nome_parametro.localeCompare(b.nome_parametro)));
            setParametrosSelecionados([]);
        }
        setCheckedIds(new Set());
        setSelectedToRemove(null);
    };

    const handleSave = async () => {
        if (!nomePacote.trim() || !legislacaoSelecionada || parametrosSelecionados.length === 0) {
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
            const args = isEditMode ? { id: pacoteParaEdicao!.id, payload } : { payload };
            const res: ApiResponse<null> = await invoke(command, args);
            
            if (res.success) {
                onSalvar();
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
    
    const filteredDisponiveis = useMemo(() => parametrosDisponiveis.filter(p => formatarNomeParametro(p).toLowerCase().includes(filtroDisponiveis.toLowerCase())), [parametrosDisponiveis, filtroDisponiveis]);
    const filteredSelecionados = useMemo(() => parametrosSelecionados.filter(p => formatarNomeParametro(p).toLowerCase().includes(filtroSelecionados.toLowerCase())), [parametrosSelecionados, filtroSelecionados]);

    return (
        <div className={styles.container}>
            {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

            <header>
                <h2>{isEditMode ? 'Editar Pacote de Parâmetros' : 'Novo Pacote de Parâmetros'}</h2>
                {isEditMode && <span className={styles.packageId}>ID do Pacote: {pacoteParaEdicao?.id}</span>}
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
                                const newSearchTerm = e.target.value;
                                setSearchTermLegislacao(newSearchTerm);
                                setIsDropdownOpen(true);
                                if (!legislacoes.find(l => l.nome.toLowerCase() === newSearchTerm.toLowerCase())) {
                                    setLegislacaoSelecionada(null);
                                }
                            }}
                            onFocus={() => setIsDropdownOpen(true)}
                            disabled={isEditMode}
                        />
                        {isDropdownOpen && !isEditMode && (
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
                                                setParametrosSelecionados([]);
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
                    <div className={styles.listWrapper}>
                        <ul className={styles.list}>
                            {loadingParams ? <li className={styles.noResults}>Carregando...</li> : 
                            filteredDisponiveis.map(p => (
                                <li key={p.id} className={styles.checkItem}>
                                    <input type="checkbox" id={`param-${p.id}`} checked={checkedIds.has(p.id)} onChange={() => handleCheckChange(p.id)} />
                                    <label htmlFor={`param-${p.id}`}>{formatarNomeParametro(p)}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className={styles.shuttleControls}>
                    <button onClick={() => moveAllItems('disponiveis')} title="Adicionar Todos" disabled={!legislacaoSelecionada || filteredDisponiveis.length === 0}><ChevronsRight /></button>
                    <button onClick={moveCheckedItems} title="Adicionar Selecionados" disabled={!legislacaoSelecionada || checkedIds.size === 0}><ChevronRight /></button>
                    <button onClick={removeSelectedItem} title="Remover Selecionado" disabled={!legislacaoSelecionada || selectedToRemove === null}><ChevronLeft /></button>
                    <button onClick={() => moveAllItems('selecionados')} title="Remover Todos" disabled={!legislacaoSelecionada || parametrosSelecionados.length === 0}><ChevronsLeft /></button>
                </div>

                <div className={styles.listContainer}>
                    <h3>Selecionados ({filteredSelecionados.length})</h3>
                    <input type="text" placeholder="Buscar..." value={filtroSelecionados} onChange={e => setFiltroSelecionados(e.target.value)} className={styles.listSearchInput} disabled={!legislacaoSelecionada} />
                    <div className={styles.listWrapper}>
                        <ul className={styles.list}>
                            {filteredSelecionados.map(p => (
                                <li key={p.id} onClick={() => setSelectedToRemove(p.id)} className={`${styles.checkItem} ${selectedToRemove === p.id ? styles.selected : ''}`}>
                                    <label>{formatarNomeParametro(p)}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <footer>
                <button 
                    onClick={onCancelar}
                    className={styles.buttonSecondary} 
                    disabled={submitting}
                >
                    Cancelar
                </button>
                <button onClick={handleSave} className={styles.buttonPrimary} disabled={submitting || loadingParams}>
                    {submitting ? <div className={styles.actionSpinner}></div> : (isEditMode ? 'Salvar Alterações' : 'Criar Pacote')}
                </button>
            </footer>
        </div>
    );
};