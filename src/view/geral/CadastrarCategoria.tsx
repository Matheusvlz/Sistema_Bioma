import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarCategoria.module.css';

// Interface para os dados da Categoria
interface Categoria {
  ID: number;
  NOME?: string;
}

interface CategoriaPayload {
  id?: number;
  NOME: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarCategoriaProps {
  categoriaParaEdicao?: Categoria;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarCategoria: React.FC<CadastrarCategoriaProps> = ({
  categoriaParaEdicao, onSalvar, onCancelar
}) => {
  const [categoria, setCategoria] = useState<CategoriaPayload>({ NOME: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!categoriaParaEdicao;

  useEffect(() => {
    if (categoriaParaEdicao) {
      setCategoria({
        id: categoriaParaEdicao.ID,
        NOME: categoriaParaEdicao.NOME || ''
      });
    }
  }, [categoriaParaEdicao]);
  
  const handleInputChange = (field: keyof CategoriaPayload, value: string) => {
    setCategoria(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!categoria.NOME.trim()) newErrors.NOME = 'Nome é obrigatório';
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
      if (isEdicao) {
        response = await invoke('editar_categoria', { categoriaData: categoria });
      } else {
        response = await invoke('criar_categoria', { categoriaData: { NOME: categoria.NOME } });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar categoria', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Categoria' : 'Nova Categoria'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome da Categoria *</label>
          <input type="text" id="nome" value={categoria.NOME || ''}
            onChange={(e) => handleInputChange('NOME', e.target.value)}
            className={`${styles.input} ${errors.NOME ? styles.inputError : ''}`}
            placeholder="Ex: Categoria de Amostra" disabled={loading}
          />
          {errors.NOME && <span className={styles.errorText}>{errors.NOME}</span>}
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

export default CadastrarCategoria;
