import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarTecnica from './CadastrarTecnica';
import styles from './css/VisualizarTecnicas.module.css';

// Interface para os dados da Técnica no frontend
interface Tecnica {
  ID: number;
  nome?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarTecnicas: React.FC = () => {
  const [tecnicas, setTecnicas] = useState<Tecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [tecnicaEmEdicao, setTecnicaEmEdicao] = useState<Tecnica | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarTecnicas = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Tecnica[]> = await invoke('listar_tecnicas');
      if (response.success && response.data) {
        setTecnicas(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar técnicas', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTecnicas();
  }, [carregarTecnicas]);

  const handleEditar = (tecnica: Tecnica) => {
    setTecnicaEmEdicao(tecnica);
    setMostrarFormulario(true);
  };

  const handleRemover = async (tecnica: Tecnica) => {
    if (!window.confirm(`Tem certeza que deseja remover a técnica "${tecnica.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_tecnica', { id: tecnica.ID });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarTecnicas();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover técnica', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setTecnicaEmEdicao(null);
    carregarTecnicas();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setTecnicaEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setTecnicaEmEdicao(null);
    setMostrarFormulario(true);
  };

  const tecnicasFiltradas = tecnicas.filter(tecnica =>
    tecnica.nome?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarTecnica
        tecnicaParaEdicao={tecnicaEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Técnicas</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Técnica
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome da técnica..."
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
                <th>Nome da Técnica</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tecnicasFiltradas.map((tecnica) => (
                <tr key={tecnica.ID}>
                  <td>{tecnica.ID}</td>
                  <td><strong>{tecnica.nome || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(tecnica)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(tecnica)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarTecnicas;
