import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
// ✅ CORREÇÃO DE CAMINHO: Subindo um nível para buscar o CSS em 'geral'
import styles from './styles/VisualizarLegislacaoParametro.module.css'; 
// ✅ CORREÇÃO DE CAMINHO: Subindo um nível para buscar o CSS em 'geral'
import formStyles from './styles/Cadastrar.module.css'; 

// --- Interfaces (Padrão Dossiê V8) ---
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

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

interface InsumoParaRelacionar {
    insumo_id: number;
    tipo_nome: string;
    mc_temperatura?: string;
    mc_tempo?: string;
    validade?: string;
}

interface RelacionarInsumoPayload {
   insumos: InsumoParaRelacionar[];
}

interface InsumoSelectionState {
    checked: boolean;
    mc_temperatura: string;
    mc_tempo: string;
    validade: string;
}

type SelectionMap = Record<number, InsumoSelectionState>; 

interface Props {
    parametroPopId: number;
    nomeParametro: string;
    onSalvar: () => void;
    onCancelar: () => void;
}

const CadastrarParametroInsumo: React.FC<Props> = ({ parametroPopId, nomeParametro, onSalvar, onCancelar }) => {
    
    const [gruposInsumos, setGruposInsumos] = useState<InsumoDisponivelAgrupado[]>([]);
    const [activeTab, setActiveTab] = useState(0); 
    
    const [selection, setSelection] = useState<SelectionMap>({});
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Carrega os insumos disponíveis (Java: 'showInsumo')
    useEffect(() => {
        const carregarInsumos = async () => {
            setLoading(true);
            try {
                // ✅ CORREÇÃO DE SINTAXE: Tipo passado como genérico do invoke
                const res = await invoke<ApiResponse<InsumoDisponivelAgrupado[]>>("listar_insumos_disponiveis_tauri");
                
                if (res.success && res.data) {
                    setGruposInsumos(res.data);
                    
                    const initialState: SelectionMap = {};
                    res.data.forEach(grupo => {
                        grupo.insumos.forEach(insumo => {
                            initialState[insumo.id] = {
                                checked: false,
                                mc_temperatura: '',
                                mc_tempo: '',
                                validade: ''
                            };
                        });
                    });
                    setSelection(initialState);
                    
                    if(res.data.length > 0) setActiveTab(0);
                } else {
                    setError(res.message || "Falha ao carregar insumos disponíveis.");
                }
            } catch (err: any) {
                setError("Erro grave ao carregar insumos: " + err.toString());
            } finally {
                setLoading(false);
            }
        };
        carregarInsumos();
    }, []); // Roda apenas uma vez

    // Handler genérico para atualizar o estado dos inputs
    const handleSelectionChange = (id: number, field: keyof InsumoSelectionState, value: string | boolean) => {
        setSelection(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    // Handler para o botão "Limpar"
    const handleClear = () => {
        const clearedState: SelectionMap = {};
        Object.keys(selection).forEach(key => {
            const numKey = parseInt(key, 10);
            clearedState[numKey] = {
                checked: false,
                mc_temperatura: '',
                mc_tempo: '',
                validade: ''
            };
        });
        setSelection(clearedState);
        setError(null);
    };

    // Handler de Envio (Java: 'brrelacionarActionPerformed')
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const payload: RelacionarInsumoPayload = { insumos: [] };

        // 1. Constrói o payload e valida
        let validationError: string | null = null;
        
        for (const grupo of gruposInsumos) {
            for (const insumo of grupo.insumos) {
                const state = selection[insumo.id];
                if (state.checked) {
                    
                    const tipoNome = grupo.tipo_nome; 

                    // Validação (Java: 'brrelacionarActionPerformed')
                    if (tipoNome === "Meio de cultura") {
                        if (!state.mc_temperatura.trim()) validationError = `Temperatura é obrigatória para ${insumo.nome}.`;
                        if (!state.mc_tempo.trim()) validationError = `Tempo é obrigatório para ${insumo.nome}.`;
                    }
                    if (tipoNome === "Preservante") {
                        if (!state.validade.trim()) validationError = `Validade é obrigatória para ${insumo.nome}.`;
                    }

                    if (validationError) break;

                    payload.insumos.push({
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

        if (payload.insumos.length === 0) {
            setError("Nenhum insumo foi selecionado.");
            setSaving(false);
            return;
        }

        // 2. Envia para a Ponte (Tauri)
        try {
            // ✅ CORREÇÃO DE SINTAXE: Tipo passado como genérico do invoke
            const res = await invoke<ApiResponse<void>>("relacionar_insumos_parametro_tauri", {
                parametroPopId,
                payload
            });

            if (res.success) { // Esta era a linha do erro
                onSalvar(); // Chama o callback de sucesso do pai
            } else {
                setError(res.message || "Falha ao salvar relacionamentos.");
            }
        } catch (err: any) {
            setError("Erro grave ao salvar: " + err.toString());
        } finally {
            setSaving(false);
        }
    };

    // --- Renderização ---

    if (loading) {
        return <div className={formStyles.formContainer}><div className={styles.spinner}></div></div>;
    }

    return (
        <div className={formStyles.formContainer}>
            <form onSubmit={handleSubmit}>
                <h3 className={formStyles.formTitle}>Relacionar Insumos</h3>
                <p className={formStyles.formSubtitle}>Para: {nomeParametro}</p>

                {error && <div className={styles.error}>{error}</div>}

                {/* Abas de Insumos */}
                <div className={formStyles.tabContainer}>
                    <div className={formStyles.tabHeader}>
                        {gruposInsumos.map((grupo, index) => (
                            <button
                                type="button"
                                key={index}
                                className={`${formStyles.tabButton} ${activeTab === index ? formStyles.active : ''}`}
                                onClick={() => setActiveTab(index)}
                            >
                                {grupo.tipo_nome}
                            </button>
                        ))}
                    </div>
                    
                    {/* Conteúdo da Aba Ativa */}
                    <div className={formStyles.tabContent}>
                        {gruposInsumos[activeTab]?.insumos.map(insumo => {
                            const state = selection[insumo.id];
                            const tipoNome = gruposInsumos[activeTab].tipo_nome;
                            
                            return (
                                <div key={insumo.id} className={formStyles.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        id={`insumo-${insumo.id}`}
                                        checked={state.checked}
                                        onChange={(e) => handleSelectionChange(insumo.id, 'checked', e.target.checked)}
                                    />
                                    <label htmlFor={`insumo-${insumo.id}`}>{insumo.nome}</label>
                                    
                                    {tipoNome === "Meio de cultura" && (
                                        <>
                                            <input 
                                                type="text" 
                                                placeholder="Temp. °C"
                                                value={state.mc_temperatura}
                                                disabled={!state.checked}
                                                onChange={(e) => handleSelectionChange(insumo.id, 'mc_temperatura', e.target.value)}
                                                className={formStyles.smallInput}
                                            />
                                            <input 
                                                type="text" 
                                                placeholder="Tempo (hs)"
                                                value={state.mc_tempo}
                                                disabled={!state.checked}
                                                onChange={(e) => handleSelectionChange(insumo.id, 'mc_tempo', e.target.value)}
                                                className={formStyles.smallInput}
                                            />
                                        </>
                                    )}
                                    
                                    {tipoNome === "Preservante" && (
                                        <input 
                                            type="text" 
                                            placeholder="Validade (hs)"
                                            value={state.validade}
                                            disabled={!state.checked}
                                            onChange={(e) => handleSelectionChange(insumo.id, 'validade', e.target.value)}
                                            className={formStyles.smallInput}
                                        />
                                    )}
                                V</div>
                            );
                        })}
                        {gruposInsumos[activeTab]?.insumos.length === 0 && (
                            <p className={formStyles.emptyTab}>Nenhum insumo disponível neste grupo.</p>
                        )}
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className={formStyles.buttonGroup}>
                    <button type="button" className={formStyles.buttonSecondary} onClick={onCancelar} disabled={saving}>
                        Cancelar
                    </button>
                    <button type="button" className={formStyles.buttonClear} onClick={handleClear} disabled={saving}>
                        Limpar Seleção
                    </button>
                    <button type="submit" className={formStyles.buttonPrimary} disabled={saving}>
                        {saving ? "Salvando..." : "Salvar Relacionamentos"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CadastrarParametroInsumo;