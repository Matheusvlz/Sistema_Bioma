import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/CadastrarUsuario.module.css';

// Interface sem o campo "empresa"
interface CriarUsuarioPayload {
  nome: string;
  nome_completo: string;
  senha: string;
  privilegio: string;
  cargo: string;
}

export const CadastrarUsuario: React.FC = () => {
  const [formData, setFormData] = useState<CriarUsuarioPayload>({
    nome: '',
    nome_completo: '',
    senha: '',
    privilegio: 'USER',
    cargo: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!formData.nome || !formData.nome_completo || !formData.senha) {
      setMessage({ type: 'error', text: 'Nome de usuário, nome completo e senha são obrigatórios.' });
      setLoading(false);
      return;
    }

    try {
      // Chamada real ao backend Tauri
      const newUser = await invoke('criar_usuario_admin_command', { payload: formData });
      
      // Assumindo que newUser tem a propriedade nome_completo, como definido no backend
      const nomeCriado = (newUser as any)?.nome_completo || formData.nome_completo;

      setMessage({ type: 'success', text: `Usuário "${nomeCriado}" criado com sucesso!` });
      
      // Limpar o formulário após o sucesso
      setFormData({
        nome: '',
        nome_completo: '',
        senha: '',
        privilegio: 'USER',
        cargo: '',
      });
    } catch (error) {
      // Exibe o erro retornado pelo backend Tauri
      setMessage({ type: 'error', text: `Erro ao criar usuário: ${error}` });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    console.log("Operação cancelada");
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Cadastrar Usuário do Sistema</h2>
      </header>
      
      {/* A área de main agora engloba a mensagem e o formulário */}
      <main className={styles.main}>
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className={styles.closeMessage}>×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formContent}> {/* Novo wrapper para os inputs */}
            <div className={styles.formGroup}>
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
              <label className={styles.label} htmlFor="senha">Senha *</label>
              <input
                className={styles.input}
                type="password"
                id="senha"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="cargo">Cargo</label>
              <input
                className={styles.input}
                type="text"
                id="cargo"
                name="cargo"
                value={formData.cargo}
                onChange={handleChange}
                placeholder="Ex: Analista de Laboratório"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
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
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button type="button" className={styles.buttonSecondary} onClick={handleCancel} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className={styles.buttonPrimary} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Usuário'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};