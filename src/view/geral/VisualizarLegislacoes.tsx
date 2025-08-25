import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarLegislacao from './CadastrarLegislacao';
import styles from './css/VisualizarLegislacoes.module.css';

// Interface para os dados da Legislação no frontend
interface Legislacao {
  id: number;
  nome?: string;
  COMPLEMENTO?: string;
  ATIVO: boolean; // Recebemos true/false do backend
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarLegislacoes: React.FC = () => {
  const [legislacoes, setLegislacoes] = useState<Legislacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [legislacaoEmEdicao, setLegislacaoEmEdicao] = useState<Legislacao | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarLegislacoes = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Legislacao[]> = await invoke('listar_legislacoes');
      if (response.success && response.data) {
        setLegislacoes(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar legislações', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarLegislacoes();
  }, [carregarLegislacoes]);

  const handleEditar = (legislacao: Legislacao) => {
    setLegislacaoEmEdicao(legislacao);
    setMostrarFormulario(true);
  };

  const handleRemover = async (legislacao: Legislacao) => {
    if (!window.confirm(`Tem certeza que deseja remover a legislação "${legislacao.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_legislacao', { id: legislacao.id });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarLegislacoes();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover legislação', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setLegislacaoEmEdicao(null);
    carregarLegislacoes();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setLegislacaoEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setLegislacaoEmEdicao(null);
    setMostrarFormulario(true);
  };

  const legislacoesFiltradas = legislacoes.filter(leg =>
    leg.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    leg.COMPLEMENTO?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarLegislacao
        legislacaoParaEdicao={legislacaoEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Legislações</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Legislação
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome ou complemento..."
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
                <th>Nome</th>
                <th>Complemento</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {legislacoesFiltradas.map((leg) => (
                <tr key={leg.id}>
                  <td>{leg.id}</td>
                  <td><strong>{leg.nome || 'N/A'}</strong></td>
                  <td className={styles.obsCell}>{leg.COMPLEMENTO || ''}</td>
                  <td>
                    <span className={`${styles.status} ${leg.ATIVO ? styles.ativo : styles.inativo}`}>
                      {leg.ATIVO ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(leg)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(leg)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarLegislacoes;
