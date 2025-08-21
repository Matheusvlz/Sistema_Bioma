import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarTipo from './CadastrarTipo';
import styles from './css/VisualizarTipos.module.css';

// Interface para os dados do Tipo no frontend
interface Tipo {
  nome: string;
  codigo: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarTipos: React.FC = () => {
  const [tipos, setTipos] = useState<Tipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [tipoEmEdicao, setTipoEmEdicao] = useState<Tipo | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarTipos = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Tipo[]> = await invoke('listar_tipos');
      if (response.success && response.data) {
        setTipos(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar tipos', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTipos();
  }, [carregarTipos]);

  const handleEditar = (tipo: Tipo) => {
    setTipoEmEdicao(tipo);
    setMostrarFormulario(true);
  };

  const handleRemover = async (tipo: Tipo) => {
    if (!window.confirm(`Tem certeza que deseja remover o tipo "${tipo.nome}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_tipo', { codigo: tipo.codigo });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarTipos();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover tipo', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setTipoEmEdicao(null);
    carregarTipos();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setTipoEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setTipoEmEdicao(null);
    setMostrarFormulario(true);
  };

  const tiposFiltrados = tipos.filter(tipo =>
    tipo.nome?.toLowerCase().includes(filtro.toLowerCase()) ||
    tipo.codigo?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarTipo
        tipoParaEdicao={tipoEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Tipos</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo Tipo
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome ou sigla..."
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
                <th>Nome</th>
                <th>Sigla</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tiposFiltrados.map((tipo) => (
                <tr key={tipo.codigo}>
                  <td><strong>{tipo.nome || 'N/A'}</strong></td>
                  <td><span className={styles.codeCell}>{tipo.codigo || 'N/A'}</span></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(tipo)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(tipo)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarTipos;
