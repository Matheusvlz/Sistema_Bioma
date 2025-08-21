import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarUnidade from './CadastrarUnidade';
import styles from './css/VisualizarUnidades.module.css';

// Interface para os dados da Unidade no frontend
interface Unidade {
  nome: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarUnidades: React.FC = () => {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [unidadeEmEdicao, setUnidadeEmEdicao] = useState<Unidade | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarUnidades = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Unidade[]> = await invoke('listar_unidades');
      if (response.success && response.data) {
        setUnidades(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar unidades', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUnidades();
  }, [carregarUnidades]);

  const handleEditar = (unidade: Unidade) => {
    setUnidadeEmEdicao(unidade);
    setMostrarFormulario(true);
  };

  const handleRemover = async (unidade: Unidade) => {
    if (!window.confirm(`Tem certeza que deseja remover a unidade "${unidade.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_unidade', { nome: unidade.nome });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarUnidades();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover unidade', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setUnidadeEmEdicao(null);
    carregarUnidades();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setUnidadeEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setUnidadeEmEdicao(null);
    setMostrarFormulario(true);
  };

  const unidadesFiltradas = unidades.filter(unidade =>
    unidade.nome?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarUnidade
        unidadeParaEdicao={unidadeEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Unidades</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Unidade
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome da unidade..."
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
                <th>Nome da Unidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {unidadesFiltradas.map((unidade) => (
                <tr key={unidade.nome}>
                  <td><strong>{unidade.nome || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(unidade)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(unidade)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarUnidades;
