import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/CadastrarUsuario.module.css';
import { UsuarioAdmin } from './ListarUsuarios';

interface CadastrarUsuarioProps {
  itemParaEdicao: UsuarioAdmin | null;
  onSalvar: () => void;
  onCancelar: () => void;
}

interface CriarUsuarioPayload {
  nome: string;
  nome_completo: string;
  senha?: string; // Senha opcional para o payload de criação
  privilegio: string;
  cargo: string | null;
  empresa: number | null;
}

interface AtualizarUsuarioPayload {
  nome: string;
  nome_completo: string;
  privilegio: string;
  cargo: string | null;
  empresa: number | null;
  ativo: boolean;
}

export const CadastrarUsuario: React.FC<CadastrarUsuarioProps> = ({ itemParaEdicao, onSalvar, onCancelar }) => {
  const [formData, setFormData] = useState({
    nome: '',
    nome_completo: '',
    senha: '',
    privilegio: 'USER',
    cargo: '',
    empresa: null as number | null,
    ativo: true,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const isEditing = itemParaEdicao !== null;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        nome: itemParaEdicao.nome || '',
        nome_completo: itemParaEdicao.nome_completo || '',
        senha: '',
        privilegio: itemParaEdicao.privilegio || 'USER',
        cargo: itemParaEdicao.cargo || '',
        empresa: itemParaEdicao.empresa || null,
        ativo: itemParaEdicao.ativo ?? true,
      });
    }
  }, [itemParaEdicao, isEditing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'empresa') {
      const numValue = value === '' ? null : Number(value);
      setFormData(prevState => ({ ...prevState, [name]: numValue }));
    } else {
      setFormData(prevState => ({ ...prevState, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isEditing && itemParaEdicao) {
        const payload: AtualizarUsuarioPayload = {
            nome: formData.nome,
            nome_completo: formData.nome_completo,
            privilegio: formData.privilegio,
            cargo: formData.cargo || null,
            empresa: formData.empresa,
            ativo: formData.ativo,
        };
        // Lógica futura para alterar senha, se necessário
        // if (formData.senha) {
        //   await invoke('alterar_senha_usuario_command', { id: itemParaEdicao.id, novaSenha: formData.senha });
        // }
        await invoke('atualizar_usuario_admin_command', { id: itemParaEdicao.id, payload });
      } else {
        const payload: CriarUsuarioPayload = { ...formData };
        if (!payload.senha) {
            setMessage({ type: 'error', text: 'Senha é obrigatória para novos usuários.' });
            setLoading(false);
            return;
        }
        await invoke('criar_usuario_admin_command', { payload });
      }
      
      onSalvar();

    } catch (error: any) {
      const errorMessage = error?.message || 'Ocorreu um erro desconhecido.';
      setMessage({ type: 'error', text: `Erro: ${errorMessage}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>{isEditing ? `Editando Usuário: ${itemParaEdicao?.nome_completo}` : 'Cadastrar Usuário do Sistema'}</h2>
      </header>
      
      <main className={styles.main}>
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className={styles.closeMessage}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}>
            
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="nome_completo">Nome Completo *</label>
              <input
                className={styles.input}
                type="text"
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                placeholder="Ex: João da Silva"
                disabled={loading}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="nome">Nome de Usuário (Login) *</label>
              <input
                className={styles.input}
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: joao.silva"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="senha">Senha</label>
              <input
                className={styles.input}
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder={isEditing ? "Deixe em branco para não alterar" : "••••••••"}
                disabled={loading}
                required={!isEditing}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="cargo">Cargo</label>
              <input
                className={styles.input}
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo || ''}
                onChange={handleChange}
                placeholder="Ex: Analista de Laboratório"
                disabled={loading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="empresa">Empresa (ID, Opcional)</label>
              <input
                className={styles.input}
                type="number"
                id="empresa"
                name="empresa"
                value={formData.empresa || ''}
                onChange={handleChange}
                placeholder="Deixe em branco se for interno"
                disabled={loading}
              />
            </div>
            
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label} htmlFor="privilegio">Privilégio *</label>
              <select
                className={styles.input}
                id="privilegio"
                name="privilegio"
                value={formData.privilegio}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="USER">Usuário</option>
                <option value="COLETOR">Coletor</option>
                <option value="ADM">Administrador</option>
              </select>
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.buttonSecondary} onClick={onCancelar} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Salvar Usuário')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};