import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarLegislacaoParametro.module.css';

// --- Interfaces para os dados ---
interface Legislacao { id: number; nome?: string; COMPLEMENTO?: string; }
interface Tipo { nome: string; }
interface Matriz { id: number; nome?: string; }
interface ParametroPopDetalhado { 
    id: number; 
    nome_parametro?: string; 
    grupo?: string;
    pop_codigo?: string;
    pop_numero?: string;
    pop_revisao?: string;
    nome_tecnica?: string;
}
interface Unidade { nome: string; }

interface LegislacaoParametroDetalhadoCompleto {
  id: number;
  legislacao: number;
  tipo?: string;
  matriz?: string;
  parametro_pop: number;
  unidade?: string;
  limite_min?: string;
  limite_simbolo?: string;
  limite_max?: string;
  valor?: number;
  ativo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// --- Props do Componente Principal ---
interface CadastrarLegislacaoParametroProps {
  itemParaEdicao?: LegislacaoParametroDetalhadoCompleto;
  onSalvar: () => void;
  onCancelar: () => void;
}

// --- Componente de Autocomplete Reutilizável ---
const Autocomplete = ({ items, onSelect, displayFn, initialValue, placeholder, error }: any) => {
    const [inputValue, setInputValue] = useState(initialValue || '');
    const [sugestoes, setSugestoes] = useState<any[]>([]);
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(initialValue || '');
    }, [initialValue]);

    useEffect(() => {
        const handleClickFora = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setMostrarSugestoes(false);
            }
        };
        document.addEventListener("mousedown", handleClickFora);
        return () => document.removeEventListener("mousedown", handleClickFora);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (value) {
            setSugestoes(items.filter((item: any) => 
                displayFn(item).toLowerCase().includes(value.toLowerCase())
            ));
        } else {
            setSugestoes(items);
        }
        setMostrarSugestoes(true);
        onSelect(null);
    };

    const handleFocus = () => {
        setSugestoes(items);
        setMostrarSugestoes(true);
    };

    const handleSelect = (item: any) => {
        setInputValue(displayFn(item));
        onSelect(item);
        setMostrarSugestoes(false);
    };

    return (
        <div className={styles.autocompleteWrapper} ref={wrapperRef}>
            <input
                type="text"
                value={inputValue}
                onChange={handleChange}
                onFocus={handleFocus}
                placeholder={placeholder}
                className={`${styles.input} ${error ? styles.inputError : ''}`}
                autoComplete="off"
            />
            {mostrarSugestoes && (
                <ul className={styles.sugestoesLista}>
                    {sugestoes.map((item, index) => (
                        <li key={index} onClick={() => handleSelect(item)}>
                            {displayFn(item)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};


// --- Componente Principal ---
const CadastrarLegislacaoParametro: React.FC<CadastrarLegislacaoParametroProps> = ({
  itemParaEdicao, onSalvar, onCancelar
}) => {
  // Estados para os dados do formulário
  const [legislacaoSelecionada, setLegislacaoSelecionada] = useState<Legislacao | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState('');
  const [matrizSelecionada, setMatrizSelecionada] = useState('');
  const [parametroPopSelecionado, setParametroPopSelecionado] = useState<ParametroPopDetalhado | null>(null);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState('');
  const [limiteMin, setLimiteMin] = useState('');
  const [limiteSimbolo, setLimiteSimbolo] = useState('=');
  const [limiteMax, setLimiteMax] = useState('');
  const [valor, setValor] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Estados para as listas de autocompletar e dropdowns
  const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [parametrosPops, setParametrosPops] = useState<ParametroPopDetalhado[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  
  // Estados para o controlo da UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!itemParaEdicao;

  // Busca os dados para os campos de seleção
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resLegislacoes, resTipos, resMatrizes, resParamPops, resUnidades]: any[] = await Promise.all([
          invoke('listar_legislacoes'),
          invoke('listar_tipos'),
          invoke('listar_matrizes'),
          invoke('listar_parametros_pops'),
          invoke('listar_unidades'),
        ]);
        if (resLegislacoes.success && resLegislacoes.data) setLegislacoes(resLegislacoes.data);
        if (resTipos.success && resTipos.data) setTipos(resTipos.data);
        if (resMatrizes.success && resMatrizes.data) setMatrizes(resMatrizes.data);
        if (resParamPops.success && resParamPops.data) setParametrosPops(resParamPops.data);
        if (resUnidades.success && resUnidades.data) setUnidades(resUnidades.data);
      } catch (error) {
        console.error("Falha ao buscar dados para o formulário:", error);
        setMessage({ text: 'Não foi possível carregar os dados para os campos de seleção.', type: 'error' });
      }
    };
    fetchData();
  }, []);

  // Preenche o formulário se estiver em modo de edição
  useEffect(() => {
    if (itemParaEdicao && legislacoes.length > 0 && parametrosPops.length > 0) {
        setLegislacaoSelecionada(legislacoes.find(l => l.id === itemParaEdicao.legislacao) || null);
        setTipoSelecionado(itemParaEdicao.tipo || '');
        setMatrizSelecionada(itemParaEdicao.matriz || '');
        setParametroPopSelecionado(parametrosPops.find(p => p.id === itemParaEdicao.parametro_pop) || null);
        setUnidadeSelecionada(itemParaEdicao.unidade || '');
        setLimiteMin(itemParaEdicao.limite_min || '');
        setLimiteSimbolo(itemParaEdicao.limite_simbolo || '=');
        setLimiteMax(itemParaEdicao.limite_max || '');
        setValor(String(itemParaEdicao.valor || ''));
        setAtivo(itemParaEdicao.ativo);
    }
  }, [itemParaEdicao, legislacoes, parametrosPops]);
  
  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!legislacaoSelecionada) newErrors.legislacao = 'Legislação é obrigatória';
    if (!parametroPopSelecionado) newErrors.parametroPop = 'Parâmetro x POP é obrigatório';
    if (!unidadeSelecionada) newErrors.unidade = 'Unidade é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    setMessage(null);
    
    const payload = {
        id: itemParaEdicao?.id,
        legislacao: legislacaoSelecionada!.id,
        tipo: tipoSelecionado,
        matriz: matrizSelecionada,
        parametro_pop: parametroPopSelecionado!.id,
        unidade: unidadeSelecionada,
        limite_min: limiteMin || null,
        limite_simbolo: limiteSimbolo || null,
        limite_max: limiteMax || null,
        valor: valor ? Number(valor) : null,
        ativo: ativo,
    };

    try {
      const comando = isEdicao ? 'editar_legislacao_parametro' : 'cadastrar_legislacao_parametro';
      const response: ApiResponse<any> = await invoke(comando, { payload });

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar relacionamento', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Relação Legislação x Parâmetro' : 'Nova Relação Legislação x Parâmetro'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
            <div className={styles.formGroup}>
                <label className={styles.label}>Legislação *</label>
                <Autocomplete 
                    items={legislacoes}
                    onSelect={setLegislacaoSelecionada}
                    displayFn={(item: Legislacao) => `${item.nome} ${item.COMPLEMENTO || ''}`}
                    initialValue={legislacaoSelecionada ? `${legislacaoSelecionada.nome} ${legislacaoSelecionada.COMPLEMENTO || ''}` : ''}
                    placeholder="Selecione uma Legislação"
                    error={errors.legislacao}
                />
                {errors.legislacao && <span className={styles.errorText}>{errors.legislacao}</span>}
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Parâmetro x POP *</label>
                <Autocomplete 
                    items={parametrosPops}
                    onSelect={setParametroPopSelecionado}
                    displayFn={(item: ParametroPopDetalhado) => `${item.nome_parametro} (${item.pop_codigo} ${item.pop_numero})`}
                    initialValue={parametroPopSelecionado ? `${parametroPopSelecionado.nome_parametro} (${parametroPopSelecionado.pop_codigo} ${parametroPopSelecionado.pop_numero})` : ''}
                    placeholder="Selecione um Parâmetro x POP"
                    error={errors.parametroPop}
                />
                {errors.parametroPop && <span className={styles.errorText}>{errors.parametroPop}</span>}
            </div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="tipo" className={styles.label}>Tipo</label>
                <select id="tipo" value={tipoSelecionado} onChange={(e) => setTipoSelecionado(e.target.value)} className={styles.select}>
                    <option value="">Todos</option>
                    {tipos.map(t => <option key={t.nome} value={t.nome}>{t.nome}</option>)}
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="matriz" className={styles.label}>Matriz</label>
                <select id="matriz" value={matrizSelecionada} onChange={(e) => setMatrizSelecionada(e.target.value)} className={styles.select}>
                    <option value="">Todas</option>
                    {matrizes.map(m => <option key={m.id} value={m.nome}>{m.nome}</option>)}
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="unidade" className={styles.label}>Unidade *</label>
                <select id="unidade" value={unidadeSelecionada} onChange={(e) => setUnidadeSelecionada(e.target.value)} className={`${styles.select} ${errors.unidade ? styles.inputError : ''}`}>
                    <option value="">Selecione...</option>
                    {unidades.map(u => <option key={u.nome} value={u.nome}>{u.nome}</option>)}
                </select>
                {errors.unidade && <span className={styles.errorText}>{errors.unidade}</span>}
            </div>
        </div>

        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="limiteMin" className={styles.label}>Limite Mínimo</label>
                <input type="text" id="limiteMin" value={limiteMin} onChange={(e) => setLimiteMin(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="limiteSimbolo" className={styles.label}>Símbolo</label>
                <select id="limiteSimbolo" value={limiteSimbolo} onChange={(e) => setLimiteSimbolo(e.target.value)} className={styles.select}>
                    <option value="=">=</option>
                    <option value="<">&lt;</option>
                    <option value=">">&gt;</option>
                    <option value="<=">&lt;=</option>
                    <option value=">=">&gt;=</option>
                    <option value="até">até</option>
                </select>
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="limiteMax" className={styles.label}>Limite Máximo</label>
                <input type="text" id="limiteMax" value={limiteMax} onChange={(e) => setLimiteMax(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="valor" className={styles.label}>Valor</label>
                <input type="number" step="0.01" id="valor" value={valor} onChange={(e) => setValor(e.target.value)} className={styles.input} />
            </div>
        </div>

        <div className={styles.formGroup}>
             <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)} disabled={loading}
              /> Relacionamento Ativo
            </label>
        </div>
        
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onCancelar} className={styles.buttonSecondary} disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className={styles.buttonPrimary} disabled={loading}>
            {loading ? 'A Salvar...' : (isEdicao ? 'Salvar Alterações' : 'Cadastrar')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarLegislacaoParametro;
