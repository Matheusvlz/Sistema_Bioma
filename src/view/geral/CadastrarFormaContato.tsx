import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarFormaContato.module.css';

// Interface para os dados da Forma de Contato
interface FormaContato {
  ID: number;
  NOME?: string;
}

interface FormaContatoPayload {
  id?: number;
  nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarFormaContatoProps {
  formaParaEdicao?: FormaContato;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarFormaContato: React.FC<CadastrarFormaContatoProps> = ({
  formaParaEdicao, onSalvar, onCancelar
}) => {
  const [formaContato, setFormaContato] = useState<FormaContatoPayload>({ nome: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!formaParaEdicao;

  useEffect(() => {
    if (formaParaEdicao) {
      setFormaContato({
        id: formaParaEdicao.ID,
        nome: formaParaEdicao.NOME || ''
      });
    }
  }, [formaParaEdicao]);
  
  const handleInputChange = (field: keyof FormaContatoPayload, value: string) => {
    setFormaContato(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formaContato.nome.trim()) newErrors.nome = 'Descrição é obrigatória';
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
        response = await invoke('editar_forma_contato', { formaData: formaContato });
      } else {
        response = await invoke('cadastrar_forma_contato', { formaData: { nome: formaContato.nome } });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar forma de contato', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Forma de Contato' : 'Nova Forma de Contato'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Descrição *</label>
          <input type="text" id="nome" value={formaContato.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: E-mail" disabled={loading}
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

export default CadastrarFormaContato;
    