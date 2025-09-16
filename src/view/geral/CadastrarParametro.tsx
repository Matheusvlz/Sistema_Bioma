import React, { useState, useEffect, useRef } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarParametro.module.css';

// Interfaces para os dados
interface Parametro {
  id: number;
  nome?: string;
  grupo?: string;
  obs?: string;
  em_campo: boolean;
}

interface Grupo {
  nome: string;
  LABORATORIO: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarParametroProps {
  parametroParaEdicao?: Parametro;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarParametro: React.FC<CadastrarParametroProps> = ({
  parametroParaEdicao, onSalvar, onCancelar
}) => {
 const [parametro, setParametro] = useState<{
    id: number | undefined;
    nome: string;
    grupo: string;
    obs: string;
    em_campo: boolean;
  }>({
  id: undefined, nome: '', grupo: '', obs: '', em_campo: false,
});
  const [grupos, setGrupos] = useState<string[]>([]);
  const [sugestoesGrupo, setSugestoesGrupo] = useState<string[]>([]);
  // NOVO ESTADO: Controla se a lista de sugestões está visível
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!parametroParaEdicao;
  const sugestoesRef = useRef<HTMLDivElement>(null); // Ref para o container de sugestões

  // Busca a lista de grupos para o autocompletar
  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const response: ApiResponse<Grupo[]> = await invoke('listar_grupos');
        if (response.success && response.data) {
          setGrupos(response.data.map(g => g.nome).filter(Boolean) as string[]);
        }
      } catch (error) {
        console.error("Falha ao buscar grupos:", error);
      }
    };
    fetchGrupos();
  }, []);

  useEffect(() => {
    if (parametroParaEdicao) {
      setParametro({
        id: parametroParaEdicao.id,
        nome: parametroParaEdicao.nome || '',
        grupo: parametroParaEdicao.grupo || '',
        obs: parametroParaEdicao.obs || '',
        em_campo: parametroParaEdicao.em_campo,
      });
    }
  }, [parametroParaEdicao]);

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
  
  const handleInputChange = (field: keyof typeof parametro, value: any) => {
    setParametro(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Lógica do autocompletar para o campo 'grupo'
    if (field === 'grupo') {
      setMostrarSugestoes(true); // Mantém a lista visível ao digitar
      if (value) {
        const filtered = grupos.filter(g => g.toLowerCase().includes(value.toLowerCase()));
        setSugestoesGrupo(filtered);
      } else {
        // Se o campo estiver vazio, mostra todos os grupos
        setSugestoesGrupo(grupos);
      }
    }
  };

  const handleSugestaoClick = (sugestao: string) => {
    setParametro(prev => ({ ...prev, grupo: sugestao }));
    setMostrarSugestoes(false); // Esconde a lista após a seleção
  };

  // NOVA FUNÇÃO: Mostra todos os grupos quando o input é focado
  const handleGrupoFocus = () => {
    setSugestoesGrupo(grupos);
    setMostrarSugestoes(true);
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!parametro.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!parametro.grupo.trim()) newErrors.grupo = 'Grupo é obrigatório';
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
      const payload = {
        id: parametro.id,
        nome: parametro.nome,
        grupo: parametro.grupo,
        obs: parametro.obs,
        em_campo: parametro.em_campo,
      };

      if (isEdicao) {
        response = await invoke('editar_parametro', { parametroData: payload });
      } else {
        response = await invoke('cadastrar_parametro', { parametroData: payload });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar parâmetro', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Parâmetro' : 'Novo Parâmetro'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup} style={{ flex: 2 }}>
            <label htmlFor="nome" className={styles.label}>Nome do Parâmetro *</label>
            <input type="text" id="nome" value={parametro.nome}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
              placeholder="Ex: pH" disabled={loading}
            />
            {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
          </div>
          
          <div className={styles.formGroup} style={{ position: 'relative' }} ref={sugestoesRef}>
            <label htmlFor="grupo" className={styles.label}>Grupo *</label>
            <input type="text" id="grupo" value={parametro.grupo}
              onChange={(e) => handleInputChange('grupo', e.target.value)}
              onFocus={handleGrupoFocus} // Adicionado o evento onFocus
              className={`${styles.input} ${errors.grupo ? styles.inputError : ''}`}
              placeholder="Clique ou digite para buscar..." disabled={loading}
              autoComplete="off"
            />
            {mostrarSugestoes && sugestoesGrupo.length > 0 && (
              <ul className={styles.sugestoesLista}>
                {sugestoesGrupo.map(sugestao => (
                  <li key={sugestao} onClick={() => handleSugestaoClick(sugestao)}>
                    {sugestao}
                  </li>
                ))}
              </ul>
            )}
            {errors.grupo && <span className={styles.errorText}>{errors.grupo}</span>}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="obs" className={styles.label}>Observação</label>
          <textarea id="obs" value={parametro.obs}
            onChange={(e) => handleInputChange('obs', e.target.value)}
            className={styles.textarea}
            rows={4}
            placeholder="Informações adicionais sobre o parâmetro" disabled={loading}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Padrão</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" name="em_campo" checked={!parametro.em_campo}
                     onChange={() => handleInputChange('em_campo', false)} disabled={loading} /> Laboratório
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" name="em_campo" checked={parametro.em_campo}
                     onChange={() => handleInputChange('em_campo', true)} disabled={loading} /> Em Campo
            </label>
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

export default CadastrarParametro;
