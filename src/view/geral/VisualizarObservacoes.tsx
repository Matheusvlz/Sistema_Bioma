import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarObservacao from './CadastrarObservacao';
import styles from './css/VisualizarObservacoes.module.css';

// Interface para os dados da Observação no frontend
interface Observacao {
  NOME?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarObservacoes: React.FC = () => {
  const [observacoes, setObservacoes] = useState<Observacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [obsEmEdicao, setObsEmEdicao] = useState<Observacao | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarObservacoes = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Observacao[]> = await invoke('listar_observacoes');
      if (response.success && response.data) {
        setObservacoes(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar observações', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarObservacoes();
  }, [carregarObservacoes]);

  const handleEditar = (obs: Observacao) => {
    setObsEmEdicao(obs);
    setMostrarFormulario(true);
  };

  const handleRemover = async (obs: Observacao) => {
    if (!window.confirm(`Tem certeza que deseja remover a observação "${obs.NOME}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_observacao', { nome: obs.NOME });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarObservacoes();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover observação', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setObsEmEdicao(null);
    carregarObservacoes();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setObsEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setObsEmEdicao(null);
    setMostrarFormulario(true);
  };

  const observacoesFiltradas = observacoes.filter(obs =>
    obs.NOME?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarObservacao
        obsParaEdicao={obsEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Observações</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Observação
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por descrição..."
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
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {observacoesFiltradas.map((obs, index) => (
                <tr key={`${obs.NOME}-${index}`}>
                  <td className={styles.obsCell}><strong>{obs.NOME || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(obs)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(obs)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarObservacoes;
