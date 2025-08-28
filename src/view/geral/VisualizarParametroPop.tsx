import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarParametroPop from './CadastrarParametroPop';
import styles from './css/VisualizarParametroPop.module.css';

// Interfaces para os dados
interface ParametroPopDetalhado {
  id: number;
  id_parametro: number;
  nome_parametro?: string;
  grupo?: string;
  id_pop: number;
  pop_codigo?: string;
  pop_numero?: string;
  pop_revisao?: string;
  nome_tecnica?: string;
  id_metodologia?: number;
  nome_metodologia?: string;
  tempo?: number;
  quantidade_g?: number;
  quantidade_ml?: number;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarParametroPop: React.FC = () => {
  const [relacionamentos, setRelacionamentos] = useState<ParametroPopDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [itemEmEdicao, setItemEmEdicao] = useState<ParametroPopDetalhado | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<ParametroPopDetalhado[]> = await invoke('listar_parametros_pops');
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

  const handleEditar = (item: ParametroPopDetalhado) => {
    setItemEmEdicao(item);
    setMostrarFormulario(true);
  };

  const handleRemover = async (item: ParametroPopDetalhado) => {
    if (!window.confirm(`Tem certeza que deseja remover o relacionamento "${item.nome_parametro} x ${item.pop_codigo}-${item.pop_numero}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_parametro_pop', { id: item.id });
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
    item.nome_parametro?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.grupo?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.pop_codigo?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.pop_numero?.toLowerCase().includes(filtro.toLowerCase()) ||
    item.nome_tecnica?.toLowerCase().includes(filtro.toLowerCase())
  );

  if (mostrarFormulario) {
    return (
      <CadastrarParametroPop
        itemParaEdicao={itemEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerir Parâmetro x POP</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo Relacionamento
        </button>
      </div>

      {message && <div className={`${styles.message} ${styles[message.type]}`}>{message.text}</div>}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por parâmetro, grupo, pop ou técnica..."
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
                <th>Parâmetro</th>
                <th>Grupo</th>
                <th>POP (Técnica)</th>
                <th>Metodologia</th>
                <th>Tempo (dias)</th>
                {/* 👇 COLUNAS ADICIONADAS */}
                <th>Quant. (g)</th>
                <th>Quant. (mL)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nome_parametro}</strong></td>
                  <td>{item.grupo}</td>
                  <td>{`${item.pop_codigo} ${item.pop_numero}/${item.pop_revisao} (${item.nome_tecnica})`}</td>
                  <td>{item.nome_metodologia || 'N/A'}</td>
                  <td>{item.tempo}</td>
                  {/* 👇 CÉLULAS ADICIONADAS */}
                  <td>{item.quantidade_g}</td>
                  <td>{item.quantidade_ml}</td>
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

export default VisualizarParametroPop;
