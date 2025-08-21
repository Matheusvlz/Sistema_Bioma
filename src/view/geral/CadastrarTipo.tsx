import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarTipo.module.css';

// Interface para os dados do Tipo
interface Tipo {
  nome: string;
  codigo: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarTipoProps {
  tipoParaEdicao?: Tipo;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarTipo: React.FC<CadastrarTipoProps> = ({
  tipoParaEdicao, onSalvar, onCancelar
}) => {
  const [tipo, setTipo] = useState<Tipo>({ nome: '', codigo: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!tipoParaEdicao;
  const codigoOriginal = tipoParaEdicao?.codigo; // Guardamos o código original para a edição

  useEffect(() => {
    if (tipoParaEdicao) {
      setTipo(tipoParaEdicao);
    }
  }, [tipoParaEdicao]);
  
  const handleInputChange = (field: keyof Tipo, value: string) => {
    let finalValue = value;
    if (field === 'codigo') {
      // Força a sigla a ter no máximo 2 caracteres e ser maiúscula
      finalValue = value.toUpperCase().slice(0, 2);
    }
    setTipo(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!tipo.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!tipo.codigo.trim()) {
      newErrors.codigo = 'Sigla é obrigatória';
    } else if (tipo.codigo.trim().length !== 2) {
      newErrors.codigo = 'Sigla deve ter 2 caracteres';
    }
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
      if (isEdicao && codigoOriginal) {
        response = await invoke('editar_tipo', { codigo: codigoOriginal, tipoData: tipo });
      } else {
        response = await invoke('cadastrar_tipo', { tipoData: tipo });
      }

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar tipo', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Tipo' : 'Novo Tipo'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome do Tipo *</label>
          <input type="text" id="nome" value={tipo.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: Água Potável" disabled={loading}
          />
          {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="codigo" className={styles.label}>Sigla (2 Letras) *</label>
          <input type="text" id="codigo" value={tipo.codigo}
            onChange={(e) => handleInputChange('codigo', e.target.value)}
            className={`${styles.input} ${errors.codigo ? styles.inputError : ''}`}
            placeholder="Ex: AP" disabled={loading || isEdicao}
            maxLength={2}
          />
          {errors.codigo && <span className={styles.errorText}>{errors.codigo}</span>}
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

export default CadastrarTipo;
