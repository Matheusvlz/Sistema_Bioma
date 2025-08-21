import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarParametro from './CadastrarParametro';
import styles from './css/VisualizarParametros.module.css';

// Interface para os dados do Parâmetro no frontend
interface Parametro {
  id: number;
  nome?: string;
  grupo?: string;
  obs?: string;
  em_campo: boolean; // Recebemos true/false do backend
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarParametros: React.FC = () => {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [parametroEmEdicao, setParametroEmEdicao] = useState<Parametro | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarParametros = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Parametro[]> = await invoke('listar_parametros');
      if (response.success && response.data) {
        setParametros(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar parâmetros', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarParametros();
  }, [carregarParametros]);

  const handleEditar = (parametro: Parametro) => {
    setParametroEmEdicao(parametro);
    setMostrarFormulario(true);
  };

  const handleRemover = async (parametro: Parametro) => {
    if (!window.confirm(`Tem certeza que deseja remover o parâmetro "${parametro.nome}"?`)) {
      return;
    }
        // --- O NOSSO ESPIÃO NO FRONTEND ---
        console.log(`[FRONTEND] A tentar deletar parâmetro com ID: ${parametro.id}`);
        // ------------------------------------
    try {
      const response: ApiResponse<void> = await invoke('deletar_parametro', { id: parametro.id });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarParametros();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover parâmetro', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setParametroEmEdicao(null);
    carregarParametros();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setParametroEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setParametroEmEdicao(null);
    setMostrarFormulario(true);
  };

  const parametrosFiltrados = parametros.filter(parametro =>
    parametro.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    parametro.grupo?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarParametro
        parametroParaEdicao={parametroEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Parâmetros</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo Parâmetro
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome ou grupo..."
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
                <th>Nome do Parâmetro</th>
                <th>Grupo</th>
                <th>Padrão</th>
                <th>Observação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {parametrosFiltrados.map((parametro) => (
                <tr key={parametro.id}>
                  <td><strong>{parametro.nome || 'N/A'}</strong></td>
                  <td>{parametro.grupo || 'N/A'}</td>
                  <td>{parametro.em_campo ? 'Em Campo' : 'Laboratório'}</td>
                  <td className={styles.obsCell}>{parametro.obs || ''}</td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(parametro)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(parametro)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarParametros;
