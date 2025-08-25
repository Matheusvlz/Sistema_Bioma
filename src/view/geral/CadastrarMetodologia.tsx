import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarMetodologia.module.css';

// Interface para os dados da Metodologia
interface Metodologia {
  ID: number;
  NOME?: string;
  ATIVO: boolean;
}

interface MetodologiaPayload {
  id?: number;
  nome: string;
  ativo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarMetodologiaProps {
  metodologiaParaEdicao?: Metodologia;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarMetodologia: React.FC<CadastrarMetodologiaProps> = ({
  metodologiaParaEdicao, onSalvar, onCancelar
}) => {
  const [metodologia, setMetodologia] = useState<MetodologiaPayload>({ nome: '', ativo: true });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!metodologiaParaEdicao;

  useEffect(() => {
    if (metodologiaParaEdicao) {
      setMetodologia({
        id: metodologiaParaEdicao.ID,
        nome: metodologiaParaEdicao.NOME || '',
        ativo: metodologiaParaEdicao.ATIVO
      });
    }
  }, [metodologiaParaEdicao]);
  
  const handleInputChange = (field: keyof MetodologiaPayload, value: string | boolean) => {
    setMetodologia(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!metodologia.nome.trim()) newErrors.nome = 'Nome é obrigatório';
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
        response = await invoke('editar_metodologia', { metodologiaData: metodologia });
      } else {
        response = await invoke('cadastrar_metodologia', { metodologiaData: { nome: metodologia.nome, ativo: metodologia.ativo } });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar metodologia', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Metodologia' : 'Nova Metodologia'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome da Metodologia *</label>
          <input type="text" id="nome" value={metodologia.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: ABNT NBR ISO/IEC 17025" disabled={loading}
          />
          {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
        </div>

        <div className={styles.formGroup}>
             <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={metodologia.ativo}
                onChange={(e) => handleInputChange('ativo', e.target.checked)} disabled={loading}
              /> Metodologia Ativa
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

export default CadastrarMetodologia;
