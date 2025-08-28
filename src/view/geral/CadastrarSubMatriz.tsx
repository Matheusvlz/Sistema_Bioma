import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarSubMatriz.module.css';

// Interfaces para os dados
interface SubMatriz {
  id: number;
  idmatriz: number;
  nome?: string;
}

interface SubMatrizPayload {
  id?: number;
  idmatriz: number;
  nome: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarSubMatrizProps {
  matrizId: number;
  subMatrizParaEdicao?: SubMatriz;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarSubMatriz: React.FC<CadastrarSubMatrizProps> = ({
  matrizId, subMatrizParaEdicao, onSalvar, onCancelar
}) => {
  const [subMatriz, setSubMatriz] = useState<SubMatrizPayload>({ idmatriz: matrizId, nome: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!subMatrizParaEdicao;

  useEffect(() => {
    if (subMatrizParaEdicao) {
      setSubMatriz({
        id: subMatrizParaEdicao.id,
        idmatriz: subMatrizParaEdicao.idmatriz,
        nome: subMatrizParaEdicao.nome || ''
      });
    }
  }, [subMatrizParaEdicao]);
  
  const handleInputChange = (field: keyof SubMatrizPayload, value: string) => {
    setSubMatriz(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validarFormulario = (): boolean => {
    console.log("[DEBUG] A validar formulário...");
    const newErrors: Record<string, string> = {};
    if (!subMatriz.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
        console.log("[DEBUG] Erros de validação encontrados:", newErrors);
        return false;
    }
    console.log("[DEBUG] Validação passou.");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[DEBUG] Botão de submeter clicado. A iniciar handleSubmit.");

    if (!validarFormulario()) return;

    setLoading(true);
    setMessage(null);
    
    try {
      let response: ApiResponse<any>;
      const payload = { ...subMatriz };
      console.log("[DEBUG] Payload a ser enviado:", payload);

      if (isEdicao) {
        console.log("[DEBUG] A chamar 'editar_sub_matriz'");
        response = await invoke('editar_sub_matriz', { subMatrizData: payload });
      } else {
        console.log("[DEBUG] A chamar 'cadastrar_sub_matriz'");
        response = await invoke('cadastrar_sub_matriz', { subMatrizData: payload });
      }

      console.log("[DEBUG] Resposta do backend:", response);

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      console.error("[DEBUG] Erro capturado no handleSubmit:", error);
      setMessage({ text: error?.message || 'Erro ao salvar submatriz', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Submatriz' : 'Nova Submatriz'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome da Submatriz *</label>
          <input type="text" id="nome" value={subMatriz.nome || ''}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            className={`${styles.input} ${errors.nome ? styles.inputError : ''}`}
            placeholder="Ex: Bruta" disabled={loading}
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

export default CadastrarSubMatriz;
