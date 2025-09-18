import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './css/ListarUsuarios.module.css';
import { CadastrarUsuario } from './CadastrarUsuarios';

// --- Interfaces para Tipagem Forte ---

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface UsuarioAdmin {
  id: number;
  nome_completo: string | null;
  nome: string | null;
  privilegio: string | null;
  cargo: string | null;
  ativo: boolean | null;
  empresa: number | null;
}

export const ListarUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filtro, setFiltro] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<UsuarioAdmin | null>(null);

  const carregarUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await invoke<ApiResponse<UsuarioAdmin[]>>('listar_usuarios_admin_command');
      
      if (response.success && Array.isArray(response.data)) {
        setUsuarios(response.data);
      } else {
        setError(response.message || "Falha ao carregar a lista de usuários.");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro grave ao se comunicar com o backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const handleToggleStatus = async (usuario: UsuarioAdmin) => {
    if (usuario.id === undefined || usuario.ativo === null) return;

    const novoStatus = !usuario.ativo;
    const acao = novoStatus ? "ativar" : "desativar";
    
    if (!window.confirm(`Tem certeza que deseja ${acao} o usuário "${usuario.nome_completo}"?`)) {
      return;
    }

    try {
      const response = await invoke<ApiResponse<null>>('atualizar_status_usuario_admin_command', {
        id: usuario.id,
        ativo: novoStatus,
      });

      setSuccessMessage(response.message || `Usuário ${acao} com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      carregarUsuarios();
    } catch (err: any) {
      setError(err.message || `Falha ao ${acao} o usuário.`);
    }
  };

  const handleAbrirFormulario = (usuario: UsuarioAdmin | null) => {
      setUsuarioEmEdicao(usuario);
      setMostrarFormulario(true);
  };
  
  const handleFecharFormulario = () => {
      setUsuarioEmEdicao(null);
      setMostrarFormulario(false);
  };
  
  const handleSalvoComSucesso = () => {
      handleFecharFormulario();
      carregarUsuarios();
      setSuccessMessage("Operação realizada com sucesso!");
      setTimeout(() => setSuccessMessage(null), 3000);
  };

  const usuariosFiltrados = usuarios.filter(user => {
    const termoBusca = filtro.toLowerCase();
    return (
      user.nome_completo?.toLowerCase().includes(termoBusca) ||
      user.nome?.toLowerCase().includes(termoBusca) ||
      user.cargo?.toLowerCase().includes(termoBusca) ||
      user.privilegio?.toLowerCase().includes(termoBusca)
    );
  });
  
  if (mostrarFormulario) {
    return (
      <CadastrarUsuario
        itemParaEdicao={usuarioEmEdicao}
        onSalvar={handleSalvoComSucesso}
        onCancelar={handleFecharFormulario}
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h2>Gerenciar Usuários do Sistema</h2>
        <button 
          onClick={() => handleAbrirFormulario(null)}
          className={styles.buttonPrimary}
        >
          Novo Usuário
        </button>
      </header>

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}
        {successMessage && <div className={styles.success}>{successMessage}</div>}

        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Buscar por nome, login, cargo ou privilégio..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome Completo</th>
                <th>Login</th>
                <th>Cargo</th>
                <th>Privilégio</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className={styles.loadingCell}><div className={styles.spinner}></div></td></tr>
              ) : usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nome_completo || '-'}</td>
                    <td>{user.nome || '-'}</td>
                    <td>{user.cargo || '-'}</td>
                    <td>{user.privilegio || '-'}</td>
                    <td>
                      <span className={`${styles.status} ${user.ativo ? styles.statusAtivo : styles.statusInativo}`}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button onClick={() => handleAbrirFormulario(user)} className={styles.buttonEdit} title="Editar">✏️</button>
                        <button onClick={() => handleToggleStatus(user)} className={user.ativo ? styles.buttonDelete : styles.buttonActivate} title={user.ativo ? "Desativar" : "Ativar"}>
                          {user.ativo ? '🗑️' : '⚡'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className={styles.empty}>Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};