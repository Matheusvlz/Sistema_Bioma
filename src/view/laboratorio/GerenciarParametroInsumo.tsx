import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './styles/GerenciarParametroInsumo.module.css';

// --- Interfaces (Padrão Dossiê V8) ---
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface ParametroGrupoNome {
    grupo: string;
}

// Para Painel 1 (Tabela de Parâmetros)
interface ParametroPop {
    id: number;
    nome_parametro: string;
    pop_numero: string;
    pop_revisao: string;
    nome_tecnica: string;
    objetivo: string;
}

// Para Painel 2 (Insumos Disponíveis)
interface InsumoDisponivel {
    id: number;
    nome: string;
    tipo_id: number;
    tipo_nome: string;
}
interface InsumoDisponivelAgrupado {
    tipo_nome: string;
    insumos: InsumoDisponivel[];
}

// Para Painel 3 (Insumos Relacionados)
interface InsumoRelacionadoDetalhado {
    relacao_id: number;
    insumo_id: number;
    descricao: string;
    tipo: string;
    mc_temperatura?: string;
    mc_tempo?: string;
    validade?: string;
    is_preservante: boolean;
}

// --- Interfaces de Estado Interno ---
interface InsumoParaRelacionar {
    insumo_id: number;
    tipo_nome: string;
    mc_temperatura?: string;
    mc_tempo?: string;
    validade?: string;
}
interface InsumoSelectionState {
    checked: boolean;
    mc_temperatura: string;
    mc_tempo: string;
    validade: string;
}
type SelectionMap = Record<number, InsumoSelectionState>;

type ParametroMap = Record<string, ParametroPop[] | undefined>;

// --- O COMPONENTE ---
const GerenciarParametroInsumo: React.FC = () => {
    
    const [paramGroupNames, setParamGroupNames] = useState<string[]>([]);
    const [parametroMap, setParametroMap] = useState<ParametroMap>({});
    const [availableInsumoGroups, setAvailableInsumoGroups] = useState<InsumoDisponivelAgrupado[]>([]);
    const [relatedInsumos, setRelatedInsumos] = useState<InsumoRelacionadoDetalhado[]>([]);
    const [insumoSelectionState, setInsumoSelectionState] = useState<SelectionMap>({});

    const [activeParamTab, setActiveParamTab] = useState<string | null>(null);
    const [activeInsumoTab, setActiveInsumoTab] = useState(0);
    
    const [activeParametro, setActiveParametro] = useState<ParametroPop | null>(null);
    const [selectedParametros, setSelectedParametros] = useState<Set<number>>(new Set());
    const [selectedRelatedInsumo, setSelectedRelatedInsumo] = useState<InsumoRelacionadoDetalhado | null>(null);
    
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    
    const [filtroPainel1, setFiltroPainel1] = useState('');
    const [filtroPainel2, setFiltroPainel2] = useState('');

    const [loadingP1Abas, setLoadingP1Abas] = useState(true);
    const [loadingP1Conteudo, setLoadingP1Conteudo] = useState(false);
    const [loadingP2, setLoadingP2] = useState(true);
    const [loadingP3, setLoadingP3] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // --- Efeitos de Carregamento ---

    // ETAPA 1: Carrega Abas (P1) e Insumos (P2)
    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoadingP1Abas(true);
            setLoadingP2(true);
            setError(null);
            try {
                const [resP1, resP2] = await Promise.all([
                    invoke<ApiResponse<ParametroGrupoNome[]>>("listar_grupos_parametros_tauri"),
                    invoke<ApiResponse<InsumoDisponivelAgrupado[]>>("listar_insumos_disponiveis_tauri")
                ]);

                if (resP1.success && resP1.data) {
                    const groupNames = resP1.data.map(g => g.grupo);
                    setParamGroupNames(groupNames);
                    if (groupNames.length > 0) setActiveParamTab(groupNames[0]);
                } else {
                    setError(resP1.message || "Falha ao carregar grupos de parâmetros.");
                }

                if (resP2.success && resP2.data) {
                    setAvailableInsumoGroups(resP2.data);
                    const initialState: SelectionMap = {};
                    resP2.data.forEach(grupo => {
                        grupo.insumos.forEach(insumo => {
                            initialState[insumo.id] = { checked: false, mc_temperatura: '', mc_tempo: '', validade: '' };
                        });
                    });
                    setInsumoSelectionState(initialState);
                    if (resP2.data.length > 0) setActiveInsumoTab(0);
                } else {
                    setError(resP2.message || "Falha ao carregar insumos disponíveis.");
                }

            } catch (err: any) {
                const errorMessage = typeof err === 'string' ? err : (err.message || 'Erro desconhecido');
                setError("Erro grave ao carregar dados iniciais: " + errorMessage);
            } finally {
                setLoadingP1Abas(false);
                setLoadingP2(false);
            }
        };
        carregarDadosIniciais();
    }, []);

    // ETAPA 2: Carrega o CONTEÚDO da aba de parâmetros ATIVA
    useEffect(() => {
        const carregarConteudoAbaParametro = async () => {
            if (!activeParamTab || parametroMap[activeParamTab]) return; 
            
            const tabName = activeParamTab; 

            setLoadingP1Conteudo(true);
            setError(null);
            try {
                const res = await invoke<ApiResponse<ParametroPop[]>>("listar_parametros_pops_por_grupo", {
                    grupo: tabName 
                });

                if (res.success && res.data) {
                    setParametroMap(prev => ({ ...prev, [tabName]: res.data }));
                } else {
                    setError(res.message || `Falha ao carregar parâmetros para ${tabName}.`);
                }
            } catch (err: any) {
                const errorMessage = typeof err === 'string' ? err : (err.message || 'Erro desconhecido');
                setError(`Erro ao carregar parâmetros: ${errorMessage}`);
            } finally {
                setLoadingP1Conteudo(false);
            }
        };
        carregarConteudoAbaParametro();
    }, [activeParamTab, parametroMap]);

    // ETAPA 3: Carrega Painel 3 (Insumos Relacionados)
    const carregarInsumosRelacionados = useCallback(async () => {
        if (!activeParametro) {
            setRelatedInsumos([]);
            setTotalPaginas(1);
            return;
        }

        setLoadingP3(true);
        setError(null);
        setSelectedRelatedInsumo(null);
        try {
            // <<< MUDANÇA 1: O tipo de retorno esperado é um array simples
            const res = await invoke<ApiResponse<InsumoRelacionadoDetalhado[]>>("listar_insumos_relacionados_tauri", {
                // <<< MUDANÇA 2: Passar apenas o ID, sem paginação
                parametroPopId: activeParametro.id,
            });
            if (res.success && res.data) {
                // <<< MUDANÇA 3: res.data É o array, não res.data.items
                setRelatedInsumos(res.data); 
                // <<< MUDANÇA 4: Como a API não pagina, tratamos tudo como 1 página
                setTotalPaginas(1); 
            } else {
                setError(res.message || "Erro ao carregar insumos relacionados.");
                setRelatedInsumos([]);
                setTotalPaginas(1);
            }
        } catch (err: any) {
            const errorMessage = typeof err === 'string' ? err : (err.message || 'Erro desconhecido');
            setError("Erro grave ao carregar relacionados: " + errorMessage);
        } finally {
            setLoadingP3(false);
        }
    }, [activeParametro]); // <<< MUDANÇA 5: Removido `paginaAtual` das dependências

    useEffect(() => {
        carregarInsumosRelacionados();
    }, [carregarInsumosRelacionados]);

    // --- Handlers de Interação ---

    const handleTrocarAbaParametro = (groupName: string) => {
        setActiveParamTab(groupName);
        setActiveParametro(null); 
        setSelectedParametros(new Set());
        setRelatedInsumos([]);
        setTotalPaginas(1);
        setFiltroPainel1(''); 
    };

    const handleParametroClick = (e: React.MouseEvent, param: ParametroPop) => {
        setActiveParametro(param);
        setPaginaAtual(1); 
        const paramId = param.id;
        if (e.ctrlKey) { 
            setSelectedParametros(prev => {
                const newSet = new Set(prev);
                if (newSet.has(paramId)) newSet.delete(paramId);
                else newSet.add(paramId);
                return newSet;
            });
        } else { 
            setSelectedParametros(new Set([paramId]));
        }
    };
    
    const handleInsumoSelectionChange = (id: number, field: keyof InsumoSelectionState, value: string | boolean) => {
        setInsumoSelectionState(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };
    
    const handleClearClick = () => {
        const clearedState: SelectionMap = {};
        Object.keys(insumoSelectionState).forEach(key => {
            const numKey = parseInt(key, 10);
            clearedState[numKey] = { checked: false, mc_temperatura: '', mc_tempo: '', validade: '' };
        });
        setInsumoSelectionState(clearedState);
        setError(null);
        setSuccessMessage(null);
    };

    const handleRelacionarClick = async () => {
        if (selectedParametros.size === 0) {
            setError("Nenhum parâmetro foi selecionado no painel da esquerda.");
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        
        const payloadInsumos: InsumoParaRelacionar[] = [];
        let validationError: string | null = null;
        
        for (const grupo of availableInsumoGroups) {
            for (const insumo of grupo.insumos) {
                const state = insumoSelectionState[insumo.id];
                if (state.checked) {
                    const tipoNome = grupo.tipo_nome;
                    if (tipoNome === "Meio de cultura" && (!state.mc_temperatura.trim() || !state.mc_tempo.trim())) {
                        validationError = `Meio de Cultura "${insumo.nome}" requer Temperatura e Tempo.`;
                    }
                    if (tipoNome === "Preservante" && !state.validade.trim()) {
                        validationError = `Preservante "${insumo.nome}" requer Validade.`;
                    }
                    if (validationError) break;

                    payloadInsumos.push({
                        insumo_id: insumo.id,
                        tipo_nome: tipoNome,
                        mc_temperatura: state.mc_temperatura.trim() || undefined,
                        mc_tempo: state.mc_tempo.trim() || undefined,
                        validade: state.validade.trim() || undefined,
                    });
                }
            }
            if (validationError) break;
        }

        if (validationError) {
            setError(validationError);
            setSaving(false);
            return;
        }
        if (payloadInsumos.length === 0) {
            setError("Nenhum insumo foi selecionado no painel da direita.");
            setSaving(false);
            return;
        }

        try {
            const promises = [];
            for (const parametroPopId of selectedParametros) {
                promises.push(invoke("relacionar_insumos_parametro_tauri", {
                    parametroPopId,
                    payload: { insumos: payloadInsumos }
                }));
            }
            await Promise.all(promises); 
            setSuccessMessage(`${payloadInsumos.length} insumo(s) relacionados a ${selectedParametros.size} parâmetro(s).`);
            handleClearClick(); 
            carregarInsumosRelacionados(); 
        } catch (err: any) {
            const errorMessage = typeof err === 'string' ? err : (err.message || 'Erro desconhecido');
            setError("Erro ao salvar: " + errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleRemoverClick = async () => {
        if (!selectedRelatedInsumo) {
            setError("Nenhum insumo selecionado na tabela de relacionados.");
            return;
        }
        if (!window.confirm(`Tem certeza que deseja remover o insumo "${selectedRelatedInsumo.descricao}"?`)) return;

        setSaving(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const payload = { 
                relacaoId: selectedRelatedInsumo.relacao_id, 
                isPreservante: selectedRelatedInsumo.is_preservante 
            };
            const res = await invoke<ApiResponse<void>>("remover_insumo_relacionado_tauri", { payload });
            
            if (res.success) {
                setSuccessMessage(res.message || "Relacionamento removido!");
                setSelectedRelatedInsumo(null);
                
                // Apenas recarrega a lista
                carregarInsumosRelacionados();

            } else {
                setError(res.message || "Falha ao remover.");
            }
        } catch (err: any) {
            const errorMessage = typeof err === 'string' ? err : (err.message || 'Erro desconhecido');
            setError("Erro grave ao remover: " + errorMessage);
        } finally {
            setSaving(false);
        }
    };

    // --- Listas Filtradas (para as barras de busca) ---

    const activeParamListFiltered = useMemo(() => {
        const list = activeParamTab ? parametroMap[activeParamTab] || [] : [];
        if (!filtroPainel1) return list;
        const search = filtroPainel1.toLowerCase();
        
        return list.filter(param => 
            (param.nome_parametro || '').toLowerCase().includes(search) ||
            (param.pop_numero || '').toLowerCase().includes(search) ||
            (param.nome_tecnica || '').toLowerCase().includes(search) ||
            (param.objetivo || '').toLowerCase().includes(search)
        );
    }, [parametroMap, activeParamTab, filtroPainel1]);

    const activeInsumoListFiltered = useMemo(() => {
        const group = availableInsumoGroups[activeInsumoTab];
        if (!group || !group.insumos) return []; 
        if (!filtroPainel2) return group.insumos;
        const search = filtroPainel2.toLowerCase();
        return group.insumos.filter(insumo => 
            (insumo.nome || '').toLowerCase().includes(search)
        );
    }, [availableInsumoGroups, activeInsumoTab, filtroPainel2]);


    // --- RENDERIZAÇÃO PRINCIPAL ---
    return (
        <div className={styles.container}>
            
            {error && <div className={styles.error}>{error}</div>}
            {successMessage && <div className={styles.success}>{successMessage}</div>}
            
            <div className={styles.mainLayout}>
                {/* ====================================================================== */}
                {/* PAINEL 1: PARÂMETROS (ESQUERDA) */}
                {/* ====================================================================== */}
                <div className={`${styles.panelBox} ${styles.leftPanel}`}>
                    <div className={styles.tabHeader}>
                        {loadingP1Abas && <div className={styles.spinner} style={{ margin: '10px 16px' }}></div>}
                        {paramGroupNames.map(groupName => (
                            <button
                                key={groupName}
                                className={`${styles.tabButton} ${activeParamTab === groupName ? styles.active : ''}`}
                                onClick={() => handleTrocarAbaParametro(groupName)}
                            >
                                {groupName}
                            </button>
                        ))}
                    </div>
                    
                    {!loadingP1Abas && (
                        <input
                            type="text"
                            placeholder="Buscar parâmetros nesta aba..."
                            className={styles.filterInput}
                            value={filtroPainel1}
                            onChange={(e) => setFiltroPainel1(e.target.value)}
                        />
                    )}
                    
                    <div className={styles.contentArea}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Parâmetro</th>
                                    <th>POP</th>
                                    <th>Técnica</th>
                                    <th>Objetivo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingP1Conteudo ? (
                                    <tr><td colSpan={4} className={styles.loadingOrEmpty}><div className={styles.spinner}></div></td></tr>
                                ) : activeParamListFiltered.length > 0 ? (
                                    activeParamListFiltered.map(param => (
                                        <tr 
                                            key={param.id} 
                                            className={selectedParametros.has(param.id) ? styles.selected : ''}
                                            onClick={(e) => handleParametroClick(e, param)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{param.nome_parametro}</td>
                                            <td>{param.pop_numero}/{param.pop_revisao}</td>
                                            <td>{param.nome_tecnica || '-'}</td>
                                            <td>{param.objetivo || '-'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    !loadingP1Abas && (
                                        <tr>
                                            <td colSpan={4} className={styles.loadingOrEmpty}>
                                                {filtroPainel1 ? 'Nenhum parâmetro encontrado na busca.' : 'Nenhum parâmetro neste grupo.'}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ====================================================================== */}
                {/* PAINEL 2: INSUMOS DISPONÍVEIS (DIREITA-CIMA) */}
                {/* ====================================================================== */}
                <div className={`${styles.panelBox} ${styles.rightPanel}`}>
                    <div className={`${styles.panelBox} ${styles.topRight}`}>
                        <div className={styles.tabHeader}>
                            {loadingP2 && <div className={styles.spinner} style={{ margin: '10px 16px' }}></div>}
                            {availableInsumoGroups.map((group, index) => (
                                <button
                                    key={group.tipo_nome} 
                                    className={`${styles.tabButton} ${activeInsumoTab === index ? styles.active : ''}`}
                                    onClick={() => {
                                        setActiveInsumoTab(index);
                                        setFiltroPainel2('');
                                    }}
                                >
                                    {group.tipo_nome}
                                </button>
                            ))}
                        </div>

                        {!loadingP2 && (
                            <input
                                type="text"
                                placeholder="Buscar insumos nesta aba..."
                                className={styles.filterInput}
                                value={filtroPainel2}
                                onChange={(e) => setFiltroPainel2(e.target.value)}
                            />
                        )}

                        <div className={styles.contentArea}>
                            {loadingP2 ? (
                                <div className={styles.loadingOrEmpty}><div className={styles.spinner}></div></div>
                            ) : (
                                <div className={styles.checkboxList}>
                                    {activeInsumoListFiltered.map(insumo => {
                                        const group = availableInsumoGroups[activeInsumoTab];
                                        const state = insumoSelectionState[insumo.id];
                                        const tipoNome = group?.tipo_nome; 
                                        
                                        return (
                                            <div key={insumo.id} className={styles.checkboxRow}>
                                                <input
                                                    type="checkbox"
                                                    id={`insumo-${insumo.id}`}
                                                    checked={state?.checked || false}
                                                    onChange={(e) => handleInsumoSelectionChange(insumo.id, 'checked', e.target.checked)}
                                                />
                                                <label htmlFor={`insumo-${insumo.id}`}>{insumo.nome}</label>
                                                
                                                {tipoNome === "Meio de cultura" && (
                                                    <>
                                                        <input type="text" placeholder="Temp. °C" value={state?.mc_temperatura || ''} disabled={!state?.checked} onChange={(e) => handleInsumoSelectionChange(insumo.id, 'mc_temperatura', e.target.value)} className={styles.smallInput} />
                                                        <input type="text" placeholder="Tempo (hs)" value={state?.mc_tempo || ''} disabled={!state?.checked} onChange={(e) => handleInsumoSelectionChange(insumo.id, 'mc_tempo', e.target.value)} className={styles.smallInput} />
                                                    </>
                                                )}
                                                {tipoNome === "Preservante" && (
                                                    <input type="text" placeholder="Validade (hs)" value={state?.validade || ''} disabled={!state?.checked} onChange={(e) => handleInsumoSelectionChange(insumo.id, 'validade', e.target.value)} className={styles.smallInput} />
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    {activeInsumoListFiltered.length === 0 && !loadingP2 && (
                                        <p className={styles.loadingOrEmpty} style={{padding: '20px'}}>
                                            {filtroPainel2 ? 'Nenhum insumo encontrado na busca.' : 'Nenhum insumo disponível neste grupo.'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className={styles.buttonContainer}>
                            <button className={`${styles.button} ${styles.buttonClear}`} onClick={handleClearClick} disabled={saving}>Limpar</button>
                            <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleRelacionarClick} disabled={saving || selectedParametros.size === 0}>
                                {saving ? "Salvando..." : "Relacionar"}
                            </button>
                        </div>
                    </div>

                    {/* ====================================================================== */}
                    {/* PAINEL 3: INSUMOS RELACIONADOS (DIREITA-BAIXO) */}
                    {/* ====================================================================== */}
                    <div className={`${styles.panelBox} ${styles.bottomRight}`}>
                        <h3 className={styles.panelTitle}>
                            Insumos Relacionados a: {activeParametro ? activeParametro.nome_parametro : "Nenhum"}
                        </h3>
                        <div className={styles.contentArea}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Insumo</th>
                                        <th>Tipo</th>
                                        <th>Temp.</th>
                                        <th>Tempo</th>
                                        <th>Val.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingP3 ? (
                                        <tr><td colSpan={5} className={styles.loadingOrEmpty}><div className={styles.spinner}></div></td></tr>
                                    ) : relatedInsumos.length > 0 ? (
                                        relatedInsumos.map(item => (
                                            <tr 
                                                key={`${item.relacao_id}-${item.is_preservante}`}
                                                className={selectedRelatedInsumo?.relacao_id === item.relacao_id && selectedRelatedInsumo?.is_preservante === item.is_preservante ? styles.selected : ''}
                                                onClick={() => setSelectedRelatedInsumo(item)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td>{item.descricao}</td>
                                                <td>{item.tipo}</td>
                                                <td>{item.mc_temperatura || '-'}</td>
                                                <td>{item.mc_tempo || '-'}</td>
                                                <td>{item.validade || '-'}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className={styles.loadingOrEmpty}>
                                                {activeParametro ? "Nenhum insumo relacionado." : "Selecione um parâmetro."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Como a API não pagina, `totalPaginas` será 1 e isso ficará oculto */}
                        {totalPaginas > 1 && (
                            <div className={styles.buttonContainer} style={{ justifyContent: 'center' }}>
                                <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setPaginaAtual(p => p - 1)} disabled={paginaAtual <= 1 || loadingP3}>Anterior</button>
                                <span>Página {paginaAtual} de {totalPaginas}</span>
                                <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setPaginaAtual(p => p + 1)} disabled={paginaAtual >= totalPaginas || loadingP3}>Próxima</button>
                            </div>
                        )}

                        {/* Botão Remover */}
                        <div className={styles.buttonContainer}>
                            <button className={`${styles.button} ${styles.buttonDelete}`} onClick={handleRemoverClick} disabled={saving || !selectedRelatedInsumo}>
                                Remover
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GerenciarParametroInsumo;