import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarIdentificacao from './CadastrarIdentificacao';
import styles from './css/VisualizarIdentificacoes.module.css';

// Interface para os dados da Identificação no frontend
interface Identificacao {
  ID: number;
  id1?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarIdentificacoes: React.FC = () => {
  const [identificacoes, setIdentificacoes] = useState<Identificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [identificacaoEmEdicao, setIdentificacaoEmEdicao] = useState<Identificacao | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarIdentificacoes = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Identificacao[]> = await invoke('listar_identificacoes');
      if (response.success && response.data) {
        setIdentificacoes(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar identificações', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarIdentificacoes();
  }, [carregarIdentificacoes]);

  const handleEditar = (identificacao: Identificacao) => {
    setIdentificacaoEmEdicao(identificacao);
    setMostrarFormulario(true);
  };

  const handleRemover = async (identificacao: Identificacao) => {
    if (!window.confirm(`Tem certeza que deseja remover a identificação "${identificacao.id1}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_identificacao', { id: identificacao.ID });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarIdentificacoes();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover identificação', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setIdentificacaoEmEdicao(null);
    carregarIdentificacoes();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setIdentificacaoEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setIdentificacaoEmEdicao(null);
    setMostrarFormulario(true);
  };

  const identificacoesFiltradas = identificacoes.filter(identificacao =>
    identificacao.id1?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarIdentificacao
        identificacaoParaEdicao={identificacaoEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Identificações</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Identificação
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
                <th>ID</th>
                <th>Descrição (id1)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {identificacoesFiltradas.map((identificacao) => (
                <tr key={identificacao.ID}>
                  <td>{identificacao.ID}</td>
                  <td><strong>{identificacao.id1 || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(identificacao)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(identificacao)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarIdentificacoes;
