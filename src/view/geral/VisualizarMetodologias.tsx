import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarMetodologia from './CadastrarMetodologia';
import styles from './css/VisualizarMetodologias.module.css';

// Interface para os dados da Metodologia no frontend
interface Metodologia {
  ID: number;
  NOME?: string;
  ATIVO: boolean; // Recebemos true/false do backend
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarMetodologias: React.FC = () => {
  const [metodologias, setMetodologias] = useState<Metodologia[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [metodologiaEmEdicao, setMetodologiaEmEdicao] = useState<Metodologia | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarMetodologias = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Metodologia[]> = await invoke('listar_metodologias');
      if (response.success && response.data) {
        setMetodologias(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar metodologias', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMetodologias();
  }, [carregarMetodologias]);

  const handleEditar = (metodologia: Metodologia) => {
    setMetodologiaEmEdicao(metodologia);
    setMostrarFormulario(true);
  };

  const handleRemover = async (metodologia: Metodologia) => {
    if (!window.confirm(`Tem certeza que deseja remover a metodologia "${metodologia.NOME}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_metodologia', { id: metodologia.ID });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarMetodologias();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover metodologia', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setMetodologiaEmEdicao(null);
    carregarMetodologias();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setMetodologiaEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setMetodologiaEmEdicao(null);
    setMostrarFormulario(true);
  };

  const metodologiasFiltradas = metodologias.filter(metodologia =>
    metodologia.NOME?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarMetodologia
        metodologiaParaEdicao={metodologiaEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Metodologias</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Metodologia
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome da metodologia..."
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
                <th>ID</th>
                <th>Nome da Metodologia</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {metodologiasFiltradas.map((metodologia) => (
                <tr key={metodologia.ID}>
                  <td>{metodologia.ID}</td>
                  <td><strong>{metodologia.NOME || 'N/A'}</strong></td>
                  <td>
                    <span className={`${styles.status} ${metodologia.ATIVO ? styles.ativo : styles.inativo}`}>
                      {metodologia.ATIVO ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(metodologia)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(metodologia)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarMetodologias;
