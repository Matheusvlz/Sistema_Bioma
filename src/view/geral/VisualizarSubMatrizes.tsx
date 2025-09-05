import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarSubMatriz from './CadastrarSubMatriz';
import styles from './css/VisualizarSubMatrizes.module.css';

// Interfaces para os dados
interface Matriz {
  id: number;
  nome?: string;
}

interface SubMatriz {
  id: number;
  idmatriz: number;
  nome?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarSubMatrizes: React.FC = () => {
  const [matrizes, setMatrizes] = useState<Matriz[]>([]);
  const [matrizSelecionadaId, setMatrizSelecionadaId] = useState<number | null>(null);
  const [subMatrizes, setSubMatrizes] = useState<SubMatriz[]>([]);
  const [loadingMatrizes, setLoadingMatrizes] = useState(true);
  const [loadingSubMatrizes, setLoadingSubMatrizes] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [subMatrizParaEdicao, setSubMatrizParaEdicao] = useState<SubMatriz | null>(null);

  // Carrega a lista de Matrizes para o dropdown
  const carregarMatrizes = useCallback(async () => {
    setLoadingMatrizes(true);
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
      setLoadingMatrizes(false);
    }
  }, []);

  useEffect(() => {
    carregarMatrizes();
  }, [carregarMatrizes]);

  // Carrega as Submatrizes sempre que uma Matriz é selecionada
  const carregarSubMatrizes = useCallback(async (idMatriz: number) => {
    setLoadingSubMatrizes(true);
    setSubMatrizes([]); // Limpa a lista anterior
    try {
      const response: ApiResponse<SubMatriz[]> = await invoke('listar_sub_matrizes', { idmatriz: idMatriz });
      if (response.success && response.data) {
        setSubMatrizes(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar submatrizes', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoadingSubMatrizes(false);
    }
  }, []);

  const handleMatrizChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setMatrizSelecionadaId(id);
    if (id) {
      carregarSubMatrizes(id);
    } else {
      setSubMatrizes([]);
    }
  };

  const handleRemover = async (subMatriz: SubMatriz) => {
    if (!window.confirm(`Tem certeza que deseja remover a submatriz "${subMatriz.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_sub_matriz', { id: subMatriz.id });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        if (matrizSelecionadaId) {
          carregarSubMatrizes(matrizSelecionadaId);
        }
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover submatriz', type: 'error' });
    }
  };
  
  const handleNovoCadastro = () => {
    if (!matrizSelecionadaId) {
        setMessage({ text: 'Por favor, selecione uma matriz primeiro.', type: 'error' });
        return;
    }
    setSubMatrizParaEdicao(null);
    setMostrarFormulario(true);
  };
  
  const handleEditar = (subMatriz: SubMatriz) => {
    setSubMatrizParaEdicao(subMatriz);
    setMostrarFormulario(true);
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setSubMatrizParaEdicao(null);
    if (matrizSelecionadaId) {
        carregarSubMatrizes(matrizSelecionadaId);
    }
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setSubMatrizParaEdicao(null);
  };

  // 👇 CORREÇÃO: O bloco de código foi descomentado.
  if (mostrarFormulario && matrizSelecionadaId) {
    return (
      <CadastrarSubMatriz
        matrizId={matrizSelecionadaId}
        subMatrizParaEdicao={subMatrizParaEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Submatrizes</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary} disabled={!matrizSelecionadaId}>
          Nova Submatriz
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <select onChange={handleMatrizChange} className={styles.selectInput} disabled={loadingMatrizes}>
          <option value="">{loadingMatrizes ? 'A carregar matrizes...' : '-- Selecione uma Matriz --'}</option>
          {matrizes.map(matriz => (
            <option key={matriz.id} value={matriz.id}>{matriz.nome}</option>
          ))}
        </select>
      </div>

      {loadingSubMatrizes ? (
        <div className={styles.loading}><div className={styles.spinner}></div><p>A carregar submatrizes...</p></div>
      ) : matrizSelecionadaId && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome da Submatriz</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {subMatrizes.map((sub) => (
                <tr key={sub.id}>
                  <td>{sub.id}</td>
                  <td><strong>{sub.nome || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(sub)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(sub)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarSubMatrizes;
