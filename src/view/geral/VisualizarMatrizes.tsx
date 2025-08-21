import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarMatriz from './CadastrarMatriz';
import styles from './css/VisualizarMatrizes.module.css';

// Interface para os dados da Matriz no frontend
interface Matriz {
  id: number;
  nome?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarMatrizes: React.FC = () => {
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [matrizEmEdicao, setMatrizEmEdicao] = useState<Matriz | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarMatrizes = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Matriz[]> = await invoke('listar_matrizes');
      if (response.success && response.data) {
        setMatrizes(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar matrizes', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarMatrizes();
  }, [carregarMatrizes]);

  const handleEditar = (matriz: Matriz) => {
    setMatrizEmEdicao(matriz);
    setMostrarFormulario(true);
  };

  const handleRemover = async (matriz: Matriz) => {
    if (!window.confirm(`Tem certeza que deseja remover a matriz "${matriz.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_matriz', { id: matriz.id });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarMatrizes();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover matriz', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setMatrizEmEdicao(null);
    carregarMatrizes();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setMatrizEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setMatrizEmEdicao(null);
    setMostrarFormulario(true);
  };

  const matrizesFiltradas = matrizes.filter(matriz =>
    matriz.nome?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarMatriz
        matrizParaEdicao={matrizEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Matrizes</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Matriz
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome da matriz..."
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
                <th>Nome da Matriz</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {matrizesFiltradas.map((matriz) => (
                <tr key={matriz.id}>
                  <td>{matriz.id}</td>
                  <td><strong>{matriz.nome || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(matriz)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(matriz)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarMatrizes;
