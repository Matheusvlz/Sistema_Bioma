import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarParametroPop.module.css';

// --- Interfaces para os dados ---
interface Parametro { id: number; nome?: string; grupo?: string; }
interface Pop { id: number; codigo?: string; numero?: string; revisao?: string; tecnica?: string; }
interface Metodologia { ID: number; NOME?: string; }
interface ParametroPopDetalhado { 
    id: number;
    id_parametro: number;
    id_pop: number;
    id_metodologia?: number;
    tempo?: number;
    quantidade_g?: number;
    quantidade_ml?: number;
}
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

// --- Props do Componente Principal ---
interface CadastrarParametroPopProps {
  itemParaEdicao?: ParametroPopDetalhado;
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
            {mostrarSugestoes && sugestoes.length > 0 && (
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
const CadastrarParametroPop: React.FC<CadastrarParametroPopProps> = ({
  itemParaEdicao, onSalvar, onCancelar
}) => {
  // Estados para os dados do formulário
  const [parametroSelecionado, setParametroSelecionado] = useState<Parametro | null>(null);
  const [popSelecionado, setPopSelecionado] = useState<Pop | null>(null);
  const [metodologiaSelecionada, setMetodologiaSelecionada] = useState<Metodologia | null>(null);
  const [tempoAnalise, setTempoAnalise] = useState('');
  const [quantidadeG, setQuantidadeG] = useState('');
  const [quantidadeMl, setQuantidadeMl] = useState('');

  // Estados para as listas de autocompletar
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const [metodologias, setMetodologias] = useState<Metodologia[]>([]);
  
  // Estados para o controlo da UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!itemParaEdicao;

  // Busca os dados para os autocompletes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resParametros, resPops, resMetodologias] = await Promise.all([
        invoke<ApiResponse<Parametro[]>>('listar_parametros'),
        invoke<ApiResponse<Pop[]>>('listar_pops'),
        invoke<ApiResponse<Metodologia[]>>('listar_metodologias')
]);
        if (resParametros.success && resParametros.data) setParametros(resParametros.data);
        if (resPops.success && resPops.data) setPops(resPops.data);
        if (resMetodologias.success && resMetodologias.data) setMetodologias(resMetodologias.data);
      } catch (error) {
        console.error("Falha ao buscar dados para o formulário:", error);
        setMessage({ text: 'Não foi possível carregar os dados para os campos de seleção.', type: 'error' });
      }
    };
    fetchData();
  }, []);

  // Preenche o formulário se estiver em modo de edição
  useEffect(() => {
    if (itemParaEdicao && parametros.length > 0 && pops.length > 0 && metodologias.length > 0) {
        setParametroSelecionado(parametros.find(p => p.id === itemParaEdicao.id_parametro) || null);
        setPopSelecionado(pops.find(p => p.id === itemParaEdicao.id_pop) || null);
        setMetodologiaSelecionada(metodologias.find(m => m.ID === itemParaEdicao.id_metodologia) || null);
        setTempoAnalise(String(itemParaEdicao.tempo || ''));
        setQuantidadeG(String(itemParaEdicao.quantidade_g || ''));
        setQuantidadeMl(String(itemParaEdicao.quantidade_ml || ''));
    }
  }, [itemParaEdicao, parametros, pops, metodologias]);
  
  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!parametroSelecionado) newErrors.parametro = 'Parâmetro é obrigatório';
    if (!popSelecionado) newErrors.pop = 'POP é obrigatório';
    if (!metodologiaSelecionada) newErrors.metodologia = 'Metodologia é obrigatória';
    if (!tempoAnalise.trim()) newErrors.tempo = 'Tempo de análise é obrigatório';
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
        parametro: parametroSelecionado!.id,
        pop: popSelecionado!.id,
        metodologia: metodologiaSelecionada!.ID,
        tempo: Number(tempoAnalise),
        quantidade_g: Number(quantidadeG) || 0,
        quantidade_ml: Number(quantidadeMl) || 0,
    };

    try {
      const comando = isEdicao ? 'editar_parametro_pop' : 'cadastrar_parametro_pop';
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
        <h2>{isEdicao ? 'Editar Relacionamento' : 'Novo Relacionamento Parâmetro x POP'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
            <div className={styles.formGroup}>
                <label className={styles.label}>Parâmetro *</label>
                <Autocomplete 
                    items={parametros}
                    onSelect={setParametroSelecionado}
                    displayFn={(item: Parametro) => `${item.nome} (${item.grupo})`}
                    initialValue={parametroSelecionado ? `${parametroSelecionado.nome} (${parametroSelecionado.grupo})` : ''}
                    placeholder="Selecione um Parâmetro"
                    error={errors.parametro}
                />
                {errors.parametro && <span className={styles.errorText}>{errors.parametro}</span>}
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>POP *</label>
                <Autocomplete 
                    items={pops}
                    onSelect={setPopSelecionado}
                    displayFn={(item: Pop) => `${item.codigo} ${item.numero}/${item.revisao} (${item.tecnica})`}
                    initialValue={popSelecionado ? `${popSelecionado.codigo} ${popSelecionado.numero}/${popSelecionado.revisao} (${popSelecionado.tecnica})` : ''}
                    placeholder="Selecione um POP"
                    error={errors.pop}
                />
                {errors.pop && <span className={styles.errorText}>{errors.pop}</span>}
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label}>Metodologia *</label>
                <Autocomplete 
                    items={metodologias}
                    onSelect={setMetodologiaSelecionada}
                    displayFn={(item: Metodologia) => item.NOME}
                    initialValue={metodologiaSelecionada ? metodologiaSelecionada.NOME : ''}
                    placeholder="Selecione uma Metodologia"
                    error={errors.metodologia}
                />
                {errors.metodologia && <span className={styles.errorText}>{errors.metodologia}</span>}
            </div>
        </div>
        
        <div className={styles.formRow}>
            <div className={styles.formGroup}>
                <label htmlFor="tempoAnalise" className={styles.label}>Tempo de Análise (dias) *</label>
                <input type="number" id="tempoAnalise" value={tempoAnalise}
                    onChange={(e) => setTempoAnalise(e.target.value)}
                    className={`${styles.input} ${errors.tempo ? styles.inputError : ''}`}
                    disabled={loading}
                />
                {errors.tempo && <span className={styles.errorText}>{errors.tempo}</span>}
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="quantidadeG" className={styles.label}>Quantidade (g)</label>
                <input type="number" id="quantidadeG" value={quantidadeG}
                    onChange={(e) => setQuantidadeG(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                />
            </div>
            <div className={styles.formGroup}>
                <label htmlFor="quantidadeMl" className={styles.label}>Quantidade (mL)</label>
                <input type="number" id="quantidadeMl" value={quantidadeMl}
                    onChange={(e) => setQuantidadeMl(e.target.value)}
                    className={styles.input}
                    disabled={loading}
                />
            </div>
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

export default CadastrarParametroPop;
