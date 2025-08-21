import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarPop from './CadastrarPop';
import styles from './css/VisualizarPops.module.css';

// Interface para os dados do POP no frontend
interface Pop {
  id: number;
  codigo?: string;
  numero?: string;
  revisao?: string;
  tecnica?: string;
  IDTECNICA?: number;
  obs?: string;
  ESTADO: boolean; // Recebemos true/false do backend
  OBJETIVO?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarPops: React.FC = () => {
  const [pops, setPops] = useState<Pop[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [popEmEdicao, setPopEmEdicao] = useState<Pop | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarPops = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Pop[]> = await invoke('listar_pops');
      if (response.success && response.data) {
        setPops(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar POPs', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarPops();
  }, [carregarPops]);

  const handleEditar = (pop: Pop) => {
    setPopEmEdicao(pop);
    setMostrarFormulario(true);
  };

  const handleRemover = async (pop: Pop) => {
    if (!window.confirm(`Tem certeza que deseja remover o POP "${pop.codigo}-${pop.numero}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_pop', { id: pop.id });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarPops();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover POP', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setPopEmEdicao(null);
    carregarPops();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setPopEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setPopEmEdicao(null);
    setMostrarFormulario(true);
  };

  const popsFiltrados = pops.filter(pop =>
    pop.codigo?.toLowerCase().includes(filtro.toLowerCase()) ||
    pop.numero?.toLowerCase().includes(filtro.toLowerCase()) ||
    pop.tecnica?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarPop
        popParaEdicao={popEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir POPs</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo POP
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por código, número ou técnica..."
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
                <th>Código</th>
                <th>Número</th>
                <th>Revisão</th>
                <th>Técnica</th>
                <th>Objetivo</th>
                <th>Estado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {popsFiltrados.map((pop) => (
                <tr key={pop.id}>
                  <td>{pop.codigo}</td>
                  <td>{pop.numero}</td>
                  <td>{pop.revisao}</td>
                  <td>{pop.tecnica}</td>
                  <td className={styles.obsCell}>{pop.OBJETIVO}</td>
                  <td>
                    <span className={`${styles.status} ${pop.ESTADO ? styles.ativo : styles.inativo}`}>
                      {pop.ESTADO ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(pop)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(pop)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarPops;
