import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarCategoria from './CadastrarCategoria';
import styles from './css/VisualizarCategorias.module.css';

// Interface para os dados da Categoria no frontend
interface Categoria {
  ID: number;
  NOME?: string;
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarCategorias: React.FC = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [categoriaEmEdicao, setCategoriaEmEdicao] = useState<Categoria | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Categoria[]> = await invoke('buscar_categorias_cadastro');
      if (response.success && response.data) {
        setCategorias(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar categorias', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
  }, [carregarCategorias]);

  const handleEditar = (categoria: Categoria) => {
    setCategoriaEmEdicao(categoria);
    setMostrarFormulario(true);
  };

  const handleRemover = async (categoria: Categoria) => {
    if (!window.confirm(`Tem certeza que deseja remover a categoria "${categoria.NOME}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('excluir_categoria', { id: categoria.ID });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarCategorias();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover categoria', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setCategoriaEmEdicao(null);
    carregarCategorias();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setCategoriaEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setCategoriaEmEdicao(null);
    setMostrarFormulario(true);
  };

  const categoriasFiltradas = categorias.filter(categoria =>
    categoria.NOME?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarCategoria
        categoriaParaEdicao={categoriaEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Categorias</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Nova Categoria
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome da categoria..."
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
                <th>Nome da Categoria</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categoriasFiltradas.map((categoria) => (
                <tr key={categoria.ID}>
                  <td>{categoria.ID}</td>
                  <td><strong>{categoria.NOME || 'N/A'}</strong></td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(categoria)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(categoria)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarCategorias;
