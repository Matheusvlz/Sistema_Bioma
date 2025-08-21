import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarUnidade.module.css';

// Interface para os dados da Unidade
interface Unidade {
  nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarUnidadeProps {
  unidadeParaEdicao?: Unidade;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarUnidade: React.FC<CadastrarUnidadeProps> = ({
  unidadeParaEdicao, onSalvar, onCancelar
}) => {
  const [unidade, setUnidade] = useState<Unidade>({ nome: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!unidadeParaEdicao;
  const nomeOriginal = unidadeParaEdicao?.nome; // Guardamos o nome original para a edição

  useEffect(() => {
    if (unidadeParaEdicao) {
      setUnidade(unidadeParaEdicao);
    }
  }, [unidadeParaEdicao]);
  
  const handleInputChange = (field: keyof Unidade, value: string) => {
    setUnidade(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!unidade.nome.trim()) newErrors.nome = 'Nome é obrigatório';
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
        response = await invoke('editar_unidade', { nomeOriginal: nomeOriginal, unidadeData: unidade });
      } else {
        response = await invoke('cadastrar_unidade', { unidadeData: unidade });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar unidade', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Unidade' : 'Nova Unidade'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome da Unidade *</label>
          <input type="text" id="nome" value={unidade.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: mg/L" disabled={loading}
          />
          {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
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

export default CadastrarUnidade;
