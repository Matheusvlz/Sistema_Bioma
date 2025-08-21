import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarGrupo.module.css';

// Interface para os dados do Grupo
interface Grupo {
  nome: string;
  LABORATORIO: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarGrupoProps {
  grupoParaEdicao?: Grupo;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarGrupo: React.FC<CadastrarGrupoProps> = ({
  grupoParaEdicao, onSalvar, onCancelar
}) => {
  const [grupo, setGrupo] = useState<Grupo>({ nome: '', LABORATORIO: 1 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!grupoParaEdicao;
  const nomeOriginal = grupoParaEdicao?.nome; // Guardamos o nome original para a edição

  useEffect(() => {
    if (grupoParaEdicao) {
      setGrupo(grupoParaEdicao);
    }
  }, [grupoParaEdicao]);
  
  const handleInputChange = (field: keyof Grupo, value: string | number) => {
    setGrupo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!grupo.nome.trim()) newErrors.nome = 'Nome é obrigatório';
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
      if (isEdicao && nomeOriginal) {
        response = await invoke('editar_grupo', { nomeOriginal: nomeOriginal, grupoData: grupo });
      } else {
        response = await invoke('cadastrar_grupo', { grupoData: grupo });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar grupo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Grupo' : 'Novo Grupo'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome do Grupo *</label>
          <input type="text" id="nome" value={grupo.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: Físico-Químico" disabled={loading}
          />
          {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="laboratorio" className={styles.label}>Laboratório *</label>
          <select
            id="laboratorio"
            value={grupo.LABORATORIO}
            onChange={(e) => handleInputChange('LABORATORIO', Number(e.target.value))}
            className={styles.input}
            disabled={loading}
          >
            <option value={1}>Físico-Químico</option>
            <option value={2}>Microbiologia</option>
          </select>
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

export default CadastrarGrupo;
