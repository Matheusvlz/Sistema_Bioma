import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarLabTerceirizado.module.css';
import { formatCnpj, formatCpf, formatPhone, cleanDocument } from '../../utils/formatters';

// Interface para o estado local do formulário (usa boolean para 'ativo')
interface LaboratorioFormState {
  ID?: number;
  NOME: string;
  DOCUMENTO: string;
  TELEFONE: string;
  EMAIL: string;
  ATIVO: boolean;
}

// Interface para os dados enviados/recebidos do backend (usa number para 'ATIVO')
interface LaboratorioPayload {
  ID?: number;
  NOME?: string;
  DOCUMENTO?: string;
  TELEFONE?: string;
  EMAIL?: string;
  ATIVO?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarLabTerceirizadoProps {
  labParaEdicao?: LaboratorioPayload;
  onSalvar: () => void;
  onCancelar: () => void;
}

const CadastrarLabTerceirizado: React.FC<CadastrarLabTerceirizadoProps> = ({
  labParaEdicao, onSalvar, onCancelar
}) => {
  const [lab, setLab] = useState<LaboratorioFormState>({
    NOME: '', DOCUMENTO: '', TELEFONE: '', EMAIL: '', ATIVO: true,
  });
  const [tipoDocumento, setTipoDocumento] = useState<'cpf' | 'cnpj'>('cnpj');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEdicao = !!labParaEdicao;

  useEffect(() => {
    if (labParaEdicao) {
      setLab({
        ...labParaEdicao,
        NOME: labParaEdicao.NOME || '',
        DOCUMENTO: labParaEdicao.DOCUMENTO || '',
        TELEFONE: labParaEdicao.TELEFONE || '',
        EMAIL: labParaEdicao.EMAIL || '',
        ATIVO: labParaEdicao.ATIVO === 1, // Converte 1/0 para true/false
      });
      if (labParaEdicao.DOCUMENTO) {
        setTipoDocumento(cleanDocument(labParaEdicao.DOCUMENTO).length === 11 ? 'cpf' : 'cnpj');
      }
    }
  }, [labParaEdicao]);
  
  const handleInputChange = (field: keyof LaboratorioFormState, value: any) => {
    let finalValue = value;
    if (field === 'DOCUMENTO') finalValue = tipoDocumento === 'cpf' ? formatCpf(cleanDocument(value)) : formatCnpj(cleanDocument(value));
    if (field === 'TELEFONE') finalValue = formatPhone(value);
    if (field === 'ATIVO') finalValue = Boolean(value);
    
    setLab(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!lab.NOME.trim()) newErrors.NOME = 'Nome é obrigatório';
    // Adicione outras validações se necessário
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    setMessage(null);
    
    const payload: LaboratorioPayload = {
      ...lab,
      ATIVO: lab.ATIVO ? 1 : 0, // Converte true/false para 1/0 antes de enviar
    };
    
    try {
      const comando = isEdicao ? 'editar_lab_terceirizado' : 'cadastrar_lab_terceirizado';
      const response: ApiResponse<any> = await invoke(comando, { labData: payload });

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        setTimeout(onSalvar, 1000); // Dá tempo para o usuário ver a mensagem
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao salvar laboratório', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Laboratório' : 'Novo Laboratório Terceirizado'}</h2>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="NOME" className={styles.label}>Nome *</label>
          <input type="text" id="NOME" value={lab.NOME}
            onChange={(e) => handleInputChange('NOME', e.target.value)}
            className={`${styles.input} ${errors.NOME ? styles.inputError : ''}`}
            placeholder="Nome do Laboratório" disabled={loading}
          />
          {errors.NOME && <span className={styles.errorText}>{errors.NOME}</span>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="DOCUMENTO" className={styles.label}>Documento (CNPJ)</label>
          <input type="text" id="DOCUMENTO" value={lab.DOCUMENTO}
            onChange={(e) => handleInputChange('DOCUMENTO', e.target.value)}
            className={styles.input} placeholder="00.000.000/0000-00" disabled={loading}
            maxLength={18}
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.formGroup}>
            <label htmlFor="TELEFONE" className={styles.label}>Telefone</label>
            <input type="text" id="TELEFONE" value={lab.TELEFONE}
              onChange={(e) => handleInputChange('TELEFONE', e.target.value)}
              className={styles.input} placeholder="(00) 00000-0000" disabled={loading}
              maxLength={15}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="EMAIL" className={styles.label}>E-mail</label>
            <input type="email" id="EMAIL" value={lab.EMAIL}
              onChange={(e) => handleInputChange('EMAIL', e.target.value)}
              className={styles.input} placeholder="contato@laboratorio.com" disabled={loading}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
             <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={lab.ATIVO}
                onChange={(e) => handleInputChange('ATIVO', e.target.checked)} disabled={loading}
              /> Laboratório Ativo
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

export default CadastrarLabTerceirizado;
