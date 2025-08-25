import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarTecnica.module.css';

// Interface para os dados da Técnica
interface Tecnica {
  ID: number;
  nome?: string;
}

interface TecnicaPayload {
  id?: number;
  nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarTecnicaProps {
  tecnicaParaEdicao?: Tecnica;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarTecnica: React.FC<CadastrarTecnicaProps> = ({
  tecnicaParaEdicao, onSalvar, onCancelar
}) => {
  const [tecnica, setTecnica] = useState<TecnicaPayload>({ nome: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!tecnicaParaEdicao;

  useEffect(() => {
    if (tecnicaParaEdicao) {
      setTecnica({
        id: tecnicaParaEdicao.ID,
        nome: tecnicaParaEdicao.nome || ''
      });
    }
  }, [tecnicaParaEdicao]);
  
  const handleInputChange = (field: keyof TecnicaPayload, value: string) => {
    setTecnica(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!tecnica.nome.trim()) newErrors.nome = 'Nome é obrigatório';
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
        response = await invoke('editar_tecnica', { tecnicaData: tecnica });
      } else {
        response = await invoke('cadastrar_tecnica', { tecnicaData: { nome: tecnica.nome } });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar técnica', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Técnica' : 'Nova Técnica'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome da Técnica *</label>
          <input type="text" id="nome" value={tecnica.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: Potenciometria" disabled={loading}
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

export default CadastrarTecnica;
