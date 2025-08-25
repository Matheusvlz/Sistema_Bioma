import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarLegislacao.module.css';

// Interface para os dados da Legislação
interface Legislacao {
  id: number;
  nome?: string;
  COMPLEMENTO?: string;
  ATIVO: boolean;
}

interface LegislacaoPayload {
  id?: number;
  nome: string;
  complemento: string;
  ativo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarLegislacaoProps {
  legislacaoParaEdicao?: Legislacao;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarLegislacao: React.FC<CadastrarLegislacaoProps> = ({
  legislacaoParaEdicao, onSalvar, onCancelar
}) => {
  const [legislacao, setLegislacao] = useState<LegislacaoPayload>({ nome: '', complemento: '', ativo: true });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!legislacaoParaEdicao;

  useEffect(() => {
    if (legislacaoParaEdicao) {
      setLegislacao({
        id: legislacaoParaEdicao.id,
        nome: legislacaoParaEdicao.nome || '',
        complemento: legislacaoParaEdicao.COMPLEMENTO || '',
        ativo: legislacaoParaEdicao.ATIVO
      });
    }
  }, [legislacaoParaEdicao]);
  
  const handleInputChange = (field: keyof LegislacaoPayload, value: string | boolean) => {
    setLegislacao(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!legislacao.nome.trim()) newErrors.nome = 'Nome é obrigatório';
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
        response = await invoke('editar_legislacao', { legislacaoData: legislacao });
      } else {
        response = await invoke('cadastrar_legislacao', { legislacaoData: { nome: legislacao.nome, complemento: legislacao.complemento, ativo: legislacao.ativo } });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar legislação', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Legislação' : 'Nova Legislação'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formRow}>
          {/* 👇 CORREÇÃO: Usamos classes CSS em vez de estilos em linha */}
          <div className={`${styles.formGroup} ${styles.formGroupNome}`}>
            <label htmlFor="nome" className={styles.label}>Nome da Legislação *</label>
            <input type="text" id="nome" value={legislacao.nome || ''}
              onChange={(e) => handleInputChange('nome', e.target.value)}
              className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
              placeholder="Ex: Portaria GM/MS Nº 888" disabled={loading}
            />
            {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
          </div>

          <div className={`${styles.formGroup} ${styles.formGroupComplemento}`}>
            <label htmlFor="complemento" className={styles.label}>Complemento</label>
            <input type="text" id="complemento" value={legislacao.complemento || ''}
              onChange={(e) => handleInputChange('complemento', e.target.value)}
              className={styles.input}
              placeholder="Ex: de 29 de Maio de 2021" disabled={loading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
             <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={legislacao.ativo}
                onChange={(e) => handleInputChange('ativo', e.target.checked)} disabled={loading}
              /> Legislação Ativa
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

export default CadastrarLegislacao;
