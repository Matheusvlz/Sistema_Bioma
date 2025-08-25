import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarIdentificacao.module.css';

// Interface para os dados da Identificação
interface Identificacao {
  ID: number;
  id1?: string;
}

interface IdentificacaoPayload {
  id?: number;
  id1: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarIdentificacaoProps {
  identificacaoParaEdicao?: Identificacao;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarIdentificacao: React.FC<CadastrarIdentificacaoProps> = ({
  identificacaoParaEdicao, onSalvar, onCancelar
}) => {
  const [identificacao, setIdentificacao] = useState<IdentificacaoPayload>({ id1: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!identificacaoParaEdicao;

  useEffect(() => {
    if (identificacaoParaEdicao) {
      setIdentificacao({
        id: identificacaoParaEdicao.ID,
        id1: identificacaoParaEdicao.id1 || ''
      });
    }
  }, [identificacaoParaEdicao]);
  
  const handleInputChange = (field: keyof IdentificacaoPayload, value: string) => {
    setIdentificacao(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!identificacao.id1.trim()) newErrors.id1 = 'Descrição é obrigatória';
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
        response = await invoke('editar_identificacao', { identificacaoData: identificacao });
      } else {
        response = await invoke('cadastrar_identificacao', { identificacaoData: { id1: identificacao.id1 } });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar identificação', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Identificação' : 'Nova Identificação'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="id1" className={styles.label}>Descrição (id1) *</label>
          <input type="text" id="id1" value={identificacao.id1 || ''}
            onChange={(e) => handleInputChange('id1', e.target.value)}
            className={`${styles.input} ${errors.id1 ? styles.inputError : ''}`}
            placeholder="Descrição da identificação" disabled={loading}
          />
          {errors.id1 && <span className={styles.errorText}>{errors.id1}</span>}
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

export default CadastrarIdentificacao;
