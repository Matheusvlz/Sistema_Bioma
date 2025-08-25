import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarObservacao.module.css';

// Interface para os dados da Observação
interface Observacao {
  NOME?: string;
}

interface ObservacaoPayload {
  nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarObservacaoProps {
  obsParaEdicao?: Observacao;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarObservacao: React.FC<CadastrarObservacaoProps> = ({
  obsParaEdicao, onSalvar, onCancelar
}) => {
  const [observacao, setObservacao] = useState<ObservacaoPayload>({ nome: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!obsParaEdicao;
  const nomeOriginal = obsParaEdicao?.NOME; // Guardamos o nome original para a edição

  useEffect(() => {
    if (obsParaEdicao) {
      setObservacao({
        nome: obsParaEdicao.NOME || ''
      });
    }
  }, [obsParaEdicao]);
  
  const handleInputChange = (field: keyof ObservacaoPayload, value: string) => {
    setObservacao(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!observacao.nome.trim()) newErrors.nome = 'A descrição da observação é obrigatória';
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
      const payload = { NOME: observacao.nome };

      if (isEdicao && nomeOriginal) {
        response = await invoke('editar_observacao', { nomeOriginal: nomeOriginal, obsData: payload });
      } else {
        response = await invoke('cadastrar_observacao', { obsData: payload });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar observação', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Observação' : 'Nova Observação'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Descrição *</label>
          <textarea id="nome" value={observacao.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.textarea} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Digite o texto da observação..." disabled={loading}
            rows={6}
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

export default CadastrarObservacao;
