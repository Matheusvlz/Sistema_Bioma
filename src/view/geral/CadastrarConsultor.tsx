import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core";
import styles from './css/CadastrarConsultor.module.css';
import { formatCnpj, formatCpf, formatPhone, cleanDocument } from '../../utils/formatters';

// Interface para os dados do Consultor no frontend
interface Consultor {
  id?: number;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

interface CadastrarConsultorProps {
  consultorParaEdicao?: Consultor;
  onSalvar: (consultor: Consultor) => void;
  onCancelar: () => void;
}

const CadastrarConsultor: React.FC<CadastrarConsultorProps> = ({
  consultorParaEdicao, onSalvar, onCancelar
}) => {
  const [consultor, setConsultor] = useState<Consultor>({
    nome: '', documento: '', telefone: '', email: '', ativo: true,
  });
  const [tipoDocumento, setTipoDocumento] = useState<'cpf' | 'cnpj'>('cnpj');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEdicao = !!consultorParaEdicao;

  useEffect(() => {
    if (consultorParaEdicao) {
      setConsultor(consultorParaEdicao);
      if (consultorParaEdicao.documento) {
        setTipoDocumento(cleanDocument(consultorParaEdicao.documento).length === 11 ? 'cpf' : 'cnpj');
      }
    }
  }, [consultorParaEdicao]);
  
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  const handleInputChange = (field: keyof Consultor, value: any) => {
    let finalValue = value;
    if (field === 'documento') finalValue = tipoDocumento === 'cpf' ? formatCpf(cleanDocument(value)) : formatCnpj(cleanDocument(value));
    if (field === 'telefone') finalValue = formatPhone(value);
    if (field === 'ativo') finalValue = Boolean(value);
    setConsultor(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validarFormulario = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!consultor.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (consultor.documento) {
      const cleaned = cleanDocument(consultor.documento);
      if (tipoDocumento === 'cpf' && cleaned.length > 0 && cleaned.length !== 11) newErrors.documento = 'CPF deve ter 11 dígitos';
      if (tipoDocumento === 'cnpj' && cleaned.length > 0 && cleaned.length !== 14) newErrors.documento = 'CNPJ deve ter 14 dígitos';
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
      let comando: string;
      let payload: any;

      if (isEdicao) {
        comando = 'editar_consultor';
        // Cria um payload específico para a edição, convertendo 'ativo' para número.
        const payloadParaEdicao = {
          ...consultor,
          ativo: consultor.ativo ? 1 : 0,
        };
        payload = { consultor: payloadParaEdicao }; 
      } else {
        comando = 'cadastrar_consultor';
        // O payload para o cadastro permanece como está, enviando 'ativo' como booleano.
        const payloadParaCadastro = {
          ...consultor,
          ativo: consultor.ativo,
        };
        payload = { consultorData: payloadParaCadastro };
      }

      const response: ApiResponse<Consultor> = await invoke(comando, payload);

      if (response.success && response.data) {
        onSalvar(response.data);
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Um erro desconhecido ocorreu.';
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{isEdicao ? 'Editar Consultor' : 'Cadastrar Consultor'}</h2>
      </div>
      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nome" className={styles.label}>Nome *</label>
          <input type="text" id="nome" value={consultor.nome} onChange={(e) => handleInputChange('nome', e.target.value)} className={`${styles.input} ${errors.nome ? styles.inputError : ''}`} placeholder="Digite o nome completo" disabled={loading}/>
          {errors.nome && <span className={styles.errorText}>{errors.nome}</span>}
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Tipo de Documento</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}><input type="radio" value="cnpj" checked={tipoDocumento === 'cnpj'} onChange={() => setTipoDocumento('cnpj')} disabled={loading} /> CNPJ</label>
            <label className={styles.radioLabel}><input type="radio" value="cpf" checked={tipoDocumento === 'cpf'} onChange={() => setTipoDocumento('cpf')} disabled={loading} /> CPF</label>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="documento" className={styles.label}>{tipoDocumento.toUpperCase()}</label>
          <input type="text" id="documento" value={consultor.documento || ''} onChange={(e) => handleInputChange('documento', e.target.value)} className={`${styles.input} ${errors.documento ? styles.inputError : ''}`} placeholder={`Digite o ${tipoDocumento.toUpperCase()}`} disabled={loading} maxLength={tipoDocumento === 'cpf' ? 14 : 18}/>
          {errors.documento && <span className={styles.errorText}>{errors.documento}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className={styles.formGroup}>
            <label htmlFor="telefone" className={styles.label}>Telefone</label>
            <input type="text" id="telefone" value={consultor.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} className={styles.input} placeholder="(00) 00000-0000" disabled={loading} maxLength={15}/>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>E-mail</label>
            <input type="email" id="email" value={consultor.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} className={styles.input} placeholder="exemplo@email.com" disabled={loading}/>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.radioLabel}>
            <input type="checkbox" checked={consultor.ativo} onChange={(e) => handleInputChange('ativo', e.target.checked)} disabled={loading}/> Consultor Ativo
          </label>
        </div>
        <div className={styles.buttonGroup}>
          <button type="button" onClick={onCancelar} className={styles.buttonSecondary} disabled={loading}>Cancelar</button>
          <button type="submit" className={styles.buttonPrimary} disabled={loading}>{loading ? 'Salvando...' : (isEdicao ? 'Salvar Alterações' : 'Cadastrar')}</button>
        </div>
      </form>
    </div>
  );
};

export default CadastrarConsultor;
