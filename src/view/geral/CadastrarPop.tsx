import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarPop.module.css';

// Interfaces para os dados
interface Pop {
  id: number;
  codigo?: string;
  numero?: string;
  revisao?: string;
  tecnica?: string;
  IDTECNICA?: number;
  obs?: string;
  ESTADO: boolean;
  OBJETIVO?: string;
}

interface Tecnica {
    ID: number;
    nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarPopProps {
  popParaEdicao?: Pop;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarPop: React.FC<CadastrarPopProps> = ({
  popParaEdicao, onSalvar, onCancelar
}) => {
  const [pop, setPop] = useState<{
    id: number | undefined;
    codigo: string;
    numero: string;
    revisao: string;
    tecnica: string;
    IDTECNICA: number;
    obs: string;
    ESTADO: boolean;
    OBJETIVO: string;
  }>({
    id: undefined, codigo: '', numero: '', revisao: '', tecnica: '', 
    IDTECNICA: 0, obs: '', ESTADO: true, OBJETIVO: '',
});
  const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
  const [sugestoesTecnica, setSugestoesTecnica] = useState<Tecnica[]>([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!popParaEdicao;
  const sugestoesRef = useRef<HTMLDivElement>(null);

  // Busca a lista de técnicas para o autocompletar
  useEffect(() => {
    const fetchTecnicas = async () => {
      try {
        const response: ApiResponse<Tecnica[]> = await invoke('listar_tecnicas');
        if (response.success && response.data) {
          setTecnicas(response.data);
        }
      } catch (error) {
        console.error("Falha ao buscar técnicas:", error);
      }
    };
    fetchTecnicas();
  }, []);

  useEffect(() => {
    if (popParaEdicao) {
      setPop({
        id: popParaEdicao.id,
        codigo: popParaEdicao.codigo || '',
        numero: popParaEdicao.numero || '',
        revisao: popParaEdicao.revisao || '',
        tecnica: popParaEdicao.tecnica || '',
        IDTECNICA: popParaEdicao.IDTECNICA || 0,
        obs: popParaEdicao.obs || '',
        ESTADO: popParaEdicao.ESTADO,
        OBJETIVO: popParaEdicao.OBJETIVO || '',
      });
    }
  }, [popParaEdicao]);

  // Efeito para fechar a lista de sugestões ao clicar fora
  useEffect(() => {
    const handleClickFora = (event: MouseEvent) => {
      if (sugestoesRef.current && !sugestoesRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => {
      document.removeEventListener("mousedown", handleClickFora);
    };
  }, []);
  
  const handleInputChange = (field: keyof typeof pop, value: any) => {
    setPop(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    if (field === 'tecnica') {
      setMostrarSugestoes(true);
      if (value) {
        const filtered = tecnicas.filter(t => t.nome.toLowerCase().includes(value.toLowerCase()));
        setSugestoesTecnica(filtered);
      } else {
        setSugestoesTecnica(tecnicas);
      }
      const match = tecnicas.find(t => t.nome.toLowerCase() === value.toLowerCase());
      if (!match) {
        setPop(prev => ({ ...prev, IDTECNICA: 0 }));
      }
    }
  };

  const handleSugestaoClick = (tecnica: Tecnica) => {
    setPop(prev => ({ ...prev, tecnica: tecnica.nome, IDTECNICA: tecnica.ID }));
    setMostrarSugestoes(false);
  };

  const handleTecnicaFocus = () => {
    setSugestoesTecnica(tecnicas);
    setMostrarSugestoes(true);
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!pop.codigo.trim()) newErrors.codigo = 'Código é obrigatório';
    if (!pop.numero.trim()) newErrors.numero = 'Número é obrigatório';
    if (!pop.revisao.trim()) newErrors.revisao = 'Revisão é obrigatória';
    if (!pop.tecnica.trim() || pop.IDTECNICA === 0) newErrors.tecnica = 'Técnica é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    setMessage(null);
    
    try {
      let response: ApiResponse<any>;
      const payload = { ...pop };

      if (isEdicao) {
        response = await invoke('editar_pop', { popData: payload });
      } else {
        response = await invoke('cadastrar_pop', { popData: payload });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar POP', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar POP' : 'Novo POP'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="codigo" className={styles.label}>Código *</label>
              <input type="text" id="codigo" value={pop.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value)}
                className={`${styles.input} ${errors.codigo ? styles.inputError : ''}`}
                maxLength={2} disabled={loading}
              />
              {errors.codigo && <span className={styles.errorText}>{errors.codigo}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="numero" className={styles.label}>Número *</label>
              <input type="text" id="numero" value={pop.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                className={`${styles.input} ${errors.numero ? styles.inputError : ''}`}
                maxLength={7} disabled={loading}
              />
              {errors.numero && <span className={styles.errorText}>{errors.numero}</span>}
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="revisao" className={styles.label}>Revisão *</label>
              <input type="text" id="revisao" value={pop.revisao}
                onChange={(e) => handleInputChange('revisao', e.target.value)}
                className={`${styles.input} ${errors.revisao ? styles.inputError : ''}`}
                maxLength={2} disabled={loading}
              />
              {errors.revisao && <span className={styles.errorText}>{errors.revisao}</span>}
            </div>
        </div>

        <div className={styles.formGroup} style={{ position: 'relative' }} ref={sugestoesRef}>
          <label htmlFor="tecnica" className={styles.label}>Técnica *</label>
          <input
            type="text"
            id="tecnica"
            value={pop.tecnica}
            onChange={(e) => handleInputChange('tecnica', e.target.value)}
            onFocus={handleTecnicaFocus}
            className={`${styles.input} ${errors.tecnica ? styles.inputError : ''}`}
            placeholder="Clique ou digite para buscar..."
            disabled={loading}
            autoComplete="off"
          />
          {mostrarSugestoes && sugestoesTecnica.length > 0 && (
            <ul className={styles.sugestoesLista}>
              {sugestoesTecnica.map(t => (
                <li key={t.ID} onClick={() => handleSugestaoClick(t)}>
                  {t.nome}
                </li>
              ))}
            </ul>
          )}
          {errors.tecnica && <span className={styles.errorText}>{errors.tecnica}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="OBJETIVO" className={styles.label}>Objetivo</label>
          <input type="text" id="OBJETIVO" value={pop.OBJETIVO}
            onChange={(e) => handleInputChange('OBJETIVO', e.target.value)}
            className={styles.input} disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="obs" className={styles.label}>Observação</label>
          <textarea id="obs" value={pop.obs}
            onChange={(e) => handleInputChange('obs', e.target.value)}
            className={styles.textarea} rows={3} disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
             <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={pop.ESTADO}
                onChange={(e) => handleInputChange('ESTADO', e.target.checked)} disabled={loading}
              /> POP Ativo
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

export default CadastrarPop;
