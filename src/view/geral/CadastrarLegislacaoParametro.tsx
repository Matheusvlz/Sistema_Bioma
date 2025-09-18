// src/view/geral/CadastrarLegislacaoParametro.tsx

import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarLegislacaoParametro.module.css';
import { formatNumber } from '../../utils/formatters';

// --- Interfaces para os Dados ---
interface DropdownOption {
    // ✅ ALTERAÇÃO: Permitimos que o ID seja número ou texto, para se adaptar à sua API.
    id: number | string;
    nome: string;
}

// ✅ Interface específica para os dados que vêm da API de Tipos
interface TipoFromApi {
    nome: string;
    codigo: string;
}

// ✅ Interface específica para os dados que vêm da API de Unidades
interface UnidadeFromApi {
    nome: string;
}


interface ParametroOption {
    id: number;
    nome: string;
    grupo: string;
}

interface ParametroPopOption {
    id: number;
    id_parametro: number;
    pop_codigo?: string;
    pop_numero?: string;
    pop_revisao?: string;
    nome_tecnica?: string;
    objetivo?: string;
    lqi?: string;
    lqs?: string;
    incerteza?: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

interface Props {
    itemParaEdicao?: any;
    legislacaoIdSelecionada: number;
    onSalvar: () => void;
    onCancelar: () => void;
}


// --- COMPONENTE REUTILIZÁVEL DE AUTOCOMPLETE (A versão estável que já tínhamos) ---
const AutocompleteSelect: React.FC<{
    options: (DropdownOption | ParametroOption)[];
    selectedValue: string;
    onSelect: (value: string, name?: string) => void;
    placeholder: string;
    disabled?: boolean;
}> = ({ options, selectedValue, onSelect, placeholder, disabled = false }) => {
    
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const propsRef = useRef({ options, selectedValue, onSelect });
    useEffect(() => {
        propsRef.current = { options, selectedValue, onSelect };
    });

    useEffect(() => {
        const selectedOption = options.find(opt => String(opt.id) === selectedValue);
        setInputValue(selectedOption ? selectedOption.nome : '');
    }, [selectedValue, options]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setShowSuggestions(true);
    };

    const handleSelect = (option: DropdownOption | ParametroOption) => {
        const { onSelect } = propsRef.current;
        onSelect(String(option.id), 'parametroId' in option ? option.nome : undefined);
        setInputValue(option.nome);
        setShowSuggestions(false);
    };
    
    const handleBlur = () => {
        setTimeout(() => {
             setShowSuggestions(false);
             const { options, selectedValue } = propsRef.current;
             const selectedOption = options.find(opt => String(opt.id) === selectedValue);
             setInputValue(selectedOption ? selectedOption.nome : '');
        }, 150);
    };

    const filteredSuggestions = inputValue
        ? options.filter(opt => opt.nome.toLowerCase().includes(inputValue.toLowerCase()))
        : options;

    return (
        <div className={styles.autocompleteWrapper}>
            <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleBlur}
                placeholder={placeholder}
                className={styles.input}
                disabled={disabled}
                required
            />
            {showSuggestions && (
                <ul className={styles.sugestoesLista}>
                    {filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map(opt => (
                            <li 
                                key={opt.id} 
                                onMouseDown={() => {
                                    handleSelect(opt);
                                }}
                            >
                                {opt.nome} {'grupo' in opt && `(${opt.grupo})`}
                            </li>
                        ))
                    ) : (
                        <li>Nenhuma opção encontrada.</li>
                    )}
                </ul>
            )}
        </div>
    );
};


const CadastrarLegislacaoParametro: React.FC<Props> = ({ itemParaEdicao, legislacaoIdSelecionada, onSalvar, onCancelar }) => {
    const [tipos, setTipos] = useState<DropdownOption[]>([]);
    const [matrizes, setMatrizes] = useState<DropdownOption[]>([]);
    const [unidades, setUnidades] = useState<DropdownOption[]>([]);
    const [parametros, setParametros] = useState<ParametroOption[]>([]);
    const [allParametroPops, setAllParametroPops] = useState<ParametroPopOption[]>([]);
    const [popsFiltrados, setPopsFiltrados] = useState<ParametroPopOption[]>([]);
    
    const [formData, setFormData] = useState({
        tipo: '',
        matriz: '',
        parametroId: '',
        parametroPopId: '',
        unidade: '',
        limiteMin: '',
        limiteSimbolo: '=',
        limiteMax: '',
        valor: '0.00',
    });
    
    const [grupoDisplay, setGrupoDisplay] = useState('');
    const [objetivoDisplay, setObjetivoDisplay] = useState('');
    const [lqDisplay, setLqDisplay] = useState({ lqi: '-', lqs: '-' });
    const [incertezaDisplay, setIncertezaDisplay] = useState('-');
    
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{ visible: boolean, message: string, success: boolean }>({ visible: false, message: '', success: false });

    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true);
            try {
                const [tiposRes, matrizesRes, unidadesRes, parametrosRes, parametroPopsRes] = await Promise.all([
                    // Usamos as novas interfaces para garantir que o TypeScript entenda os dados da API
                    invoke<ApiResponse<TipoFromApi[]>>("listar_tipos"),
                    invoke<ApiResponse<DropdownOption[]>>("listar_matrizes"), // Matrizes parece estar correto, mantemos
                    invoke<ApiResponse<UnidadeFromApi[]>>("listar_unidades"),
                    invoke<ApiResponse<ParametroOption[]>>("listar_parametros"),
                    invoke<ApiResponse<ParametroPopOption[]>>("listar_parametros_pops")
                ]);
                
                // ✅ SOLUÇÃO: Adaptamos os dados aqui!
                if (tiposRes.success && Array.isArray(tiposRes.data)) {
                    // Para cada item da lista de tipos, criamos um novo objeto com 'id' e 'nome'
                    const tiposAdaptados = tiposRes.data.map((tipo): DropdownOption => ({
                        id: tipo.codigo, // Usamos o campo 'codigo' como se fosse o 'id'
                        nome: tipo.nome
                    }));
                    setTipos(tiposAdaptados);
                }

                if (matrizesRes.success && Array.isArray(matrizesRes.data)) {
                    setMatrizes(matrizesRes.data);
                }

                if (unidadesRes.success && Array.isArray(unidadesRes.data)) {
                     // Para cada item da lista de unidades, criamos um novo objeto com 'id' e 'nome'
                    const unidadesAdaptadas = unidadesRes.data.map((unidade): DropdownOption => ({
                        id: unidade.nome, // Como não há outro campo, usamos o próprio 'nome' como id único
                        nome: unidade.nome
                    }));
                    setUnidades(unidadesAdaptadas);
                }

                if (parametrosRes.success && Array.isArray(parametrosRes.data)) setParametros(parametrosRes.data);
                if (parametroPopsRes.success && Array.isArray(parametroPopsRes.data)) setAllParametroPops(parametroPopsRes.data);

            } catch (err: any) {
                setModalState({ visible: true, message: "Erro fatal ao carregar dados. Verifique a conexão e os comandos no backend.", success: false });
            } finally {
                setLoading(false);
            }
        };
        carregarDadosIniciais();
    }, []);
    
    useEffect(() => {
        const parametroAtual = parametros.find(p => p.id === Number(formData.parametroId));
        setGrupoDisplay(parametroAtual?.grupo || '');
        if (formData.parametroId) {
            const popsDoParametro = allParametroPops.filter(p => p.id_parametro === Number(formData.parametroId));
            setPopsFiltrados(popsDoParametro);
        } else {
            setPopsFiltrados([]);
        }
        if (parametroAtual) {
            setFormData(prev => ({ ...prev, parametroPopId: '' }));
        }
    }, [formData.parametroId, allParametroPops, parametros]);

    useEffect(() => {
        if (!formData.parametroPopId) {
            setObjetivoDisplay('');
            setLqDisplay({ lqi: '-', lqs: '-' });
            setIncertezaDisplay('-');
            return;
        }
        const popAtual = allParametroPops.find(p => p.id === Number(formData.parametroPopId));
        setObjetivoDisplay(popAtual?.objetivo || '-');
        setLqDisplay({ lqi: formatNumber(popAtual?.lqi), lqs: formatNumber(popAtual?.lqs) });
        setIncertezaDisplay(formatNumber(popAtual?.incerteza));
    }, [formData.parametroPopId, allParametroPops]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleParametroChange = (id: string) => {
        setFormData(prev => ({ ...prev, parametroId: id }));
    };

    const handleTipoChange = (value: string) => {
        setFormData(prev => ({ ...prev, tipo: value }));
    };
    const handleMatrizChange = (value: string) => {
        setFormData(prev => ({ ...prev, matriz: value }));
    };
    const handleUnidadeChange = (value: string) => {
        setFormData(prev => ({ ...prev, unidade: value }));
    };
    const handleParametroPopIdChange = (value: string) => {
        setFormData(prev => ({...prev, parametroPopId: value}));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payloadParaBackend = {
                tipo: formData.tipo,
                matriz: formData.matriz,
                parametroId: formData.parametroId,
                parametroPopId: formData.parametroPopId,
                unidade: formData.unidade,
                valor: formData.valor,
                limite_min: formData.limiteMin,
                limite_max: formData.limiteMax,
                limite_simbolo: formData.limiteSimbolo,
                legislacao: legislacaoIdSelecionada,
                parametro_pop: Number(formData.parametroPopId),
                ativo: true,
            };

            const res: ApiResponse<any> = await invoke("cadastrar_legislacao_parametro_tauri", { 
                payload: payloadParaBackend
            });

            if(res.success) {
                setModalState({ visible: true, message: res.message || 'Operação realizada com sucesso!', success: true });
            } else {
                setModalState({ visible: true, message: res.message || 'Ocorreu um erro.', success: false });
            }
        } catch (err: any) {
            setModalState({ visible: true, message: err.toString(), success: false });
        }
    };
    
    const closeModal = () => {
        if (modalState.success) {
            onSalvar();
        }
        setModalState({ visible: false, message: '', success: false });
    };

    return (
        <div className={styles.container}>
            {modalState.visible && (
                <div className={styles.modalBackdrop}>
                    <div className={`${styles.modalContent} ${modalState.success ? styles.successModal : styles.errorModal}`}>
                        <h3>{modalState.success ? 'Sucesso!' : 'Erro!'}</h3>
                        <p>{modalState.message}</p>
                        <button onClick={closeModal} className={styles.modalButton}>Fechar</button>
                    </div>
                </div>
            )}
            
            <div className={styles.header}>
                <h2>{itemParaEdicao ? 'Editar' : 'Novo'} Relacionamento</h2>
            </div>
            
            {loading ? <p>A carregar formulário...</p> : (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo</label>
                            <AutocompleteSelect options={tipos} selectedValue={formData.tipo} onSelect={handleTipoChange} placeholder="Selecione o Tipo" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Matriz</label>
                            <AutocompleteSelect options={matrizes} selectedValue={formData.matriz} onSelect={handleMatrizChange} placeholder="Selecione a Matriz" />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Parâmetro</label>
                            <AutocompleteSelect options={parametros} selectedValue={formData.parametroId} onSelect={handleParametroChange} placeholder="Busque o Parâmetro" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Grupo</label>
                            <input type="text" value={grupoDisplay} className={styles.input} readOnly disabled />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>POP / Técnica</label>
                            <AutocompleteSelect 
                                options={popsFiltrados.map(p => ({
                                    id: p.id, 
                                    nome: `${p.pop_codigo || ''} ${p.pop_numero || ''} R${p.pop_revisao || ''} - ${p.nome_tecnica || ''}`
                                }))} 
                                selectedValue={formData.parametroPopId} 
                                onSelect={handleParametroPopIdChange} 
                                placeholder="Selecione o POP"
                                disabled={!formData.parametroId}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Objetivo</label>
                            <input type="text" value={objetivoDisplay} className={styles.input} readOnly disabled />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>LQ (Inferior / Superior)</label>
                            <input type="text" value={`Inf: ${lqDisplay.lqi} | Sup: ${lqDisplay.lqs}`} className={styles.input} readOnly disabled />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Incerteza ±</label>
                            <input type="text" value={incertezaDisplay} className={styles.input} readOnly disabled />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Unidade</label>
                            <AutocompleteSelect options={unidades} selectedValue={formData.unidade} onSelect={handleUnidadeChange} placeholder="Selecione a Unidade" />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Valor</label>
                            <input type="number" name="valor" value={formData.valor} onChange={(e) => handleChange('valor', e.target.value)} className={styles.input} step="0.01" required />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Limite da Legislação</label>
                        <div className={styles.limiteRow}>
                            <input type="text" name="limiteMin" value={formData.limiteMin} onChange={(e) => handleChange('limiteMin', e.target.value)} placeholder="Mínimo" className={styles.input}/>
                            <select name="limiteSimbolo" value={formData.limiteSimbolo} onChange={(e) => handleChange('limiteSimbolo', e.target.value)} className={styles.select}>
                                <option value="=">=</option><option value="<">&lt;</option><option value=">">&gt;</option>
                                <option value="<=">&lt;=</option><option value=">=">&gt;=</option><option value="até">até</option>
                            </select>
                            <input type="text" name="limiteMax" value={formData.limiteMax} onChange={(e) => handleChange('limiteMax', e.target.value)} placeholder="Máximo" className={styles.input}/>
                        </div>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button type="button" onClick={onCancelar} className={styles.buttonSecondary}>Voltar</button>
                        <button type="submit" className={styles.buttonPrimary}>Salvar Relacionamento</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CadastrarLegislacaoParametro;