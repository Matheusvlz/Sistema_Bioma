import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarGrupo from './CadastrarGrupo';
import styles from './css/VisualizarGrupos.module.css';

// Interface para os dados do Grupo no frontend
interface Grupo {
  nome: string;
  LABORATORIO: number;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarGrupos: React.FC = () => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [grupoEmEdicao, setGrupoEmEdicao] = useState<Grupo | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarGrupos = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Grupo[]> = await invoke('listar_grupos');
      if (response.success && response.data) {
        setGrupos(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar grupos', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarGrupos();
  }, [carregarGrupos]);

  const handleEditar = (grupo: Grupo) => {
    setGrupoEmEdicao(grupo);
    setMostrarFormulario(true);
  };

  const handleRemover = async (grupo: Grupo) => {
    if (!window.confirm(`Tem certeza que deseja remover o grupo "${grupo.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_grupo', { nome: grupo.nome });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarGrupos();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover grupo', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setGrupoEmEdicao(null);
    carregarGrupos();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setGrupoEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setGrupoEmEdicao(null);
    setMostrarFormulario(true);
  };

  const gruposFiltrados = grupos.filter(grupo =>
    grupo.nome?.toLowerCase().includes(filtro.toLowerCase())
  );

  // Mapeamento simples para os nomes dos laboratórios
  const getNomeLaboratorio = (id: number) => {
    switch (id) {
      case 1: return 'Físico-Químico';
      case 2: return 'Microbiologia';
      default: return 'Desconhecido';
    }
  };

  if (mostrarFormulario) {
    return (
      <CadastrarGrupo
        grupoParaEdicao={grupoEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Grupos</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo Grupo
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome do grupo..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner}></div><p>A carregar...</p></div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome do Grupo</th>
                <th>Laboratório</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {gruposFiltrados.map((grupo) => (
                <tr key={grupo.nome}>
                  <td><strong>{grupo.nome || 'N/A'}</strong></td>
                  <td>{getNomeLaboratorio(grupo.LABORATORIO)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(grupo)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(grupo)} className={styles.buttonDelete} title="Remover">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VisualizarGrupos;
