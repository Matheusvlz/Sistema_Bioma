import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarFormaContato from './CadastrarFormaContato';
import styles from './css/VisualizarFormasContato.module.css';

// Interface para os dados da Forma de Contato no frontend
interface FormaContato {
  ID: number;
  NOME?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarFormasContato: React.FC = () => {
  const [formasContato, setFormasContato] = useState<FormaContato[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formaEmEdicao, setFormaEmEdicao] = useState<FormaContato | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarFormasContato = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<FormaContato[]> = await invoke('listar_formas_contato');
      if (response.success && response.data) {
        setFormasContato(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar formas de contato', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarFormasContato();
  }, [carregarFormasContato]);

  const handleEditar = (forma: FormaContato) => {
    setFormaEmEdicao(forma);
    setMostrarFormulario(true);
  };

  const handleRemover = async (forma: FormaContato) => {
    if (!window.confirm(`Tem certeza que deseja remover a forma de contato "${forma.NOME}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_forma_contato', { id: forma.ID });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarFormasContato();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover forma de contato', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setFormaEmEdicao(null);
    carregarFormasContato();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setFormaEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setFormaEmEdicao(null);
    setMostrarFormulario(true);
  };

  const formasFiltradas = formasContato.filter(forma =>
    forma.NOME?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarFormaContato
        formaParaEdicao={formaEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Formas de Contato</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Forma de Contato
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
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {formasFiltradas.map((forma) => (
                <tr key={forma.ID}>
                  <td>{forma.ID}</td>
                  <td><strong>{forma.NOME || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(forma)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(forma)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarFormasContato;
