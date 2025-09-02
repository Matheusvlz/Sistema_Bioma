import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarLegislacaoParametro.module.css';

// --- Interfaces para os Dados ---
interface DropdownOption {
    id: number;
    nome: string;
}

interface ParametroOption {
    id: number;
    nome: string;
    grupo: string;
}

// ✅ CORREÇÃO: A interface agora corresponde ao que o comando `listar_parametros_pops` retorna
interface ParametroPopOption {
    id: number; // ID do PARAMETRO_POP
    id_parametro: number;
    pop_codigo?: string;
    pop_numero?: string;
    pop_revisao?: string;
    nome_tecnica?: string;
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

const CadastrarLegislacaoParametro: React.FC<Props> = ({ itemParaEdicao, legislacaoIdSelecionada, onSalvar, onCancelar }) => {
    // --- Estados para os Dropdowns ---
    const [tipos, setTipos] = useState<DropdownOption[]>([]);
    const [matrizes, setMatrizes] = useState<DropdownOption[]>([]);
    const [unidades, setUnidades] = useState<DropdownOption[]>([]);
    const [parametros, setParametros] = useState<ParametroOption[]>([]);
    const [allParametroPops, setAllParametroPops] = useState<ParametroPopOption[]>([]); // Armazena todos os pops
    const [popsFiltrados, setPopsFiltrados] = useState<ParametroPopOption[]>([]); // Apenas os pops para o parâmetro selecionado
    
    // --- Estados do Formulário ---
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
    
    // --- Estados de Controle (Autocomplete) ---
    const [filtroParametro, setFiltroParametro] = useState('');
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Carregamento de Dados Iniciais ---
    useEffect(() => {
        const carregarDadosIniciais = async () => {
            setLoading(true);
            try {
                const [tiposRes, matrizesRes, unidadesRes, parametrosRes, parametroPopsRes] = await Promise.all([
                    invoke<ApiResponse<DropdownOption[]>>("listar_tipos"),
                    invoke<ApiResponse<DropdownOption[]>>("listar_matrizes"),
                    invoke<ApiResponse<DropdownOption[]>>("listar_unidades"),
                    invoke<ApiResponse<ParametroOption[]>>("listar_parametros"),
                    // ✅ CORREÇÃO: Chamando a rota CORRETA e já existente
                    invoke<ApiResponse<ParametroPopOption[]>>("listar_parametros_pops")
                ]);
                
                if (tiposRes.success && Array.isArray(tiposRes.data)) setTipos(tiposRes.data);
                if (matrizesRes.success && Array.isArray(matrizesRes.data)) setMatrizes(matrizesRes.data);
                if (unidadesRes.success && Array.isArray(unidadesRes.data)) setUnidades(unidadesRes.data);
                if (parametrosRes.success && Array.isArray(parametrosRes.data)) setParametros(parametrosRes.data);
                if (parametroPopsRes.success && Array.isArray(parametroPopsRes.data)) setAllParametroPops(parametroPopsRes.data);

            } catch (err: any) {
                setError("Erro fatal ao carregar dados. Verifique a conexão e os comandos no backend.");
            } finally {
                setLoading(false);
            }
        };
        carregarDadosIniciais();
    }, []);

    // --- Filtrar POPs quando um Parâmetro é selecionado ---
    useEffect(() => {
        if (!formData.parametroId) {
            setPopsFiltrados([]);
            setFormData(prev => ({ ...prev, parametroPopId: '' }));
            return;
        }
        // ✅ CORREÇÃO: Filtramos a lista completa de POPs no frontend
        const popsDoParametro = allParametroPops.filter(p => p.id_parametro === Number(formData.parametroId));
        setPopsFiltrados(popsDoParametro);
        
    }, [formData.parametroId, allParametroPops]);

    // --- Lógica do Formulário ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            await invoke("cadastrar_legislacao_parametro_tauri", { 
                payload: {
                    ...formData,
                    legislacao: legislacaoIdSelecionada,
                    parametro_pop: Number(formData.parametroPopId),
                    ativo: true,
                }
            });
            onSalvar();
        } catch (err: any) {
            setError(err.toString());
        }
    };
    
    const parametrosFiltrados = filtroParametro
        ? parametros.filter(p => p.nome.toLowerCase().includes(filtroParametro.toLowerCase()))
        : parametros;

    const handleSelecionarParametro = (param: ParametroOption) => {
        setFiltroParametro(param.nome);
        setFormData(prev => ({ ...prev, parametroId: param.id.toString() }));
        setMostrarSugestoes(false);
    };

    useEffect(() => {
        const handleClickFora = (event: MouseEvent) => {
            if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
                setMostrarSugestoes(false);
            }
        };
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>{itemParaEdicao ? 'Editar' : 'Novo'} Relacionamento</h2>
            </div>

            {error && <p className={styles.error}>{error}</p>}
            
            {loading ? <p>A carregar formulário...</p> : (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Tipo</label>
                            <select name="tipo" value={formData.tipo} onChange={handleChange} className={styles.select} required>
                                <option value="">Selecione...</option>
                                {tipos.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Matriz</label>
                            <select name="matriz" value={formData.matriz} onChange={handleChange} className={styles.select} required>
                                <option value="">Selecione...</option>
                                {matrizes.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                            </select>
                        </div>

                        <div className={`${styles.formGroup} ${styles.autocompleteWrapper}`} ref={autocompleteRef}>
                            <label className={styles.label}>Parâmetro</label>
                            <input 
                                type="text" 
                                value={filtroParametro} 
                                onChange={(e) => { setFiltroParametro(e.target.value); setMostrarSugestoes(true); }} 
                                onFocus={() => setMostrarSugestoes(true)}
                                placeholder="Digite para buscar..." 
                                className={styles.input}
                                required 
                            />
                            {mostrarSugestoes && (
                                <ul className={styles.sugestoesLista}>
                                    {parametrosFiltrados.length > 0 
                                        ? parametrosFiltrados.map(p => (
                                            <li key={p.id} onClick={() => handleSelecionarParametro(p)}>{p.nome} ({p.grupo})</li>
                                        ))
                                        : <li>Nenhum parâmetro encontrado.</li>
                                    }
                                </ul>
                            )}
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>POP / Técnica</label>
                            <select name="parametroPopId" value={formData.parametroPopId} onChange={handleChange} className={styles.select} required disabled={!formData.parametroId}>
                                <option value="">Selecione...</option>
                                {popsFiltrados.map(p => <option key={p.id} value={p.id}>{`${p.pop_codigo || ''} ${p.pop_numero || ''} R${p.pop_revisao || ''} - ${p.nome_tecnica || ''}`}</option>)}
                            </select>
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Unidade</label>
                            <select name="unidade" value={formData.unidade} onChange={handleChange} className={styles.select} required>
                                <option value="">Selecione...</option>
                                {unidades.map(u => <option key={u.id} value={u.nome}>{u.nome}</option>)}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Valor</label>
                            <input type="number" name="valor" value={formData.valor} onChange={handleChange} className={styles.input} step="0.01" required />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Limite da Legislação</label>
                        <div className={styles.formRow}>
                            <input type="text" name="limiteMin" value={formData.limiteMin} onChange={handleChange} placeholder="Mínimo" className={styles.input}/>
                            <select name="limiteSimbolo" value={formData.limiteSimbolo} onChange={handleChange} className={styles.select}>
                                <option value="=">=</option><option value="<">&lt;</option><option value=">">&gt;</option>
                                <option value="<=">&lt;=</option><option value=">=">&gt;=</option><option value="até">até</option>
                            </select>
                            <input type="text" name="limiteMax" value={formData.limiteMax} onChange={handleChange} placeholder="Máximo" className={styles.input}/>
                        </div>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button type="button" onClick={onCancelar} className={styles.buttonSecondary}>Cancelar</button>
                        <button type="submit" className={styles.buttonPrimary}>Salvar Relacionamento</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CadastrarLegislacaoParametro;

