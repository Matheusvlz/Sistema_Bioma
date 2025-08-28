import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarLegislacaoParametro from './CadastrarLegislacaoParametro';
import styles from './css/VisualizarLegislacaoParametro.module.css';

// Interfaces para os dados
interface LegislacaoParametroDetalhado {
  id: number;
  legislacao: number;
  nome_legislacao?: string;
  tipo?: string;
  matriz?: string;
  parametro_pop: number;
  nome_parametro?: string;
  nome_tecnica?: string;
  pop_codigo?: string;
  pop_numero?: string;
  pop_revisao?: string;
  unidade?: string;
  limite_min?: string;
  limite_simbolo?: string;
  limite_max?: string;
  valor?: number;
  ativo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarLegislacaoParametro: React.FC = () => {
  const [relacionamentos, setRelacionamentos] = useState<LegislacaoParametroDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [itemEmEdicao, setItemEmEdicao] = useState<LegislacaoParametroDetalhado | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<LegislacaoParametroDetalhado[]> = await invoke('listar_legislacao_parametro');
      if (response.success && response.data) {
        setRelacionamentos(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar dados', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleEditar = (item: LegislacaoParametroDetalhado) => {
    setItemEmEdicao(item);
    setMostrarFormulario(true);
  };

  const handleRemover = async (item: LegislacaoParametroDetalhado) => {
    if (!window.confirm(`Tem certeza que deseja remover o relacionamento "${item.nome_parametro} x ${item.nome_legislacao}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_legislacao_parametro', { id: item.id });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarDados();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover relacionamento', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setItemEmEdicao(null);
    carregarDados();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setItemEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setItemEmEdicao(null);
    setMostrarFormulario(true);
  };

  const dadosFiltrados = relacionamentos.filter(item =>
    item.nome_legislacao?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.nome_parametro?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.tipo?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.matriz?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarLegislacaoParametro
        itemParaEdicao={itemEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Legislação x Parâmetro</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo Relacionamento
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por legislação, parâmetro, tipo ou matriz..."
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
                <th>Legislação</th>
                <th>Parâmetro</th>
                <th>Tipo</th>
                <th>Matriz</th>
                <th>Limite</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>{item.nome_legislacao}</td>
                  <td><strong>{item.nome_parametro}</strong></td>
                  <td>{item.tipo}</td>
                  <td>{item.matriz}</td>
                  <td>{`${item.limite_min || ''} ${item.limite_simbolo || ''} ${item.limite_max || ''}`}</td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(item)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(item)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarLegislacaoParametro;
