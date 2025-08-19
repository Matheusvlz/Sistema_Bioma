import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from "@tauri-apps/api/core";
import CadastrarLabTerceirizado from './CadastrarLabTerceirizado';
import styles from './css/VisualizarLabsTerceirizados.module.css';

// Interface para os dados do Laboratório no frontend
interface Laboratorio {
  ID: number;
  NOME?: string;
  DOCUMENTO?: string;
  TELEFONE?: string;
  EMAIL?: string;
  ATIVO?: number; // Recebemos 0 ou 1 do backend
}

// Interface para a resposta da API do Tauri
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarLabsTerceirizados: React.FC = () => {
  const [laboratorios, setLaboratorios] = useState<Laboratorio[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [labEmEdicao, setLabEmEdicao] = useState<Laboratorio | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  const carregarLaboratorios = useCallback(async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Laboratorio[]> = await invoke('listar_labs_terceirizados');
      if (response.success && response.data) {
        setLaboratorios(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar laboratórios', type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro de comunicação com o backend', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarLaboratorios();
  }, [carregarLaboratorios]);
  
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleEditar = (lab: Laboratorio) => {
    setLabEmEdicao(lab);
    setMostrarFormulario(true);
  };

  const handleRemover = async (lab: Laboratorio) => {
    if (!window.confirm(`Tem certeza que deseja remover o laboratório "${lab.NOME}"?`)) {
      return;
    }
    try {
      const response: ApiResponse<void> = await invoke('deletar_lab_terceirizado', { id: lab.ID });
      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarLaboratorios();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      setMessage({ text: error?.message || 'Erro ao remover laboratório', type: 'error' });
    }
  };

  const handleSalvar = () => {
    setMostrarFormulario(false);
    setLabEmEdicao(null);
    carregarLaboratorios();
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setLabEmEdicao(null);
  };

  const handleNovoCadastro = () => {
    setLabEmEdicao(null);
    setMostrarFormulario(true);
  };

  const laboratoriosFiltrados = laboratorios.filter(lab =>
    lab.NOME?.toLowerCase().includes(filtro.toLowerCase()) ||
    lab.DOCUMENTO?.includes(filtro)
  );

  if (mostrarFormulario) {
    return (
      <CadastrarLabTerceirizado
        labParaEdicao={labEmEdicao || undefined}
        onSalvar={handleSalvar}
        onCancelar={handleCancelar}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Laboratórios Terceirizados</h2>
        <button onClick={handleNovoCadastro} className={styles.buttonPrimary}>
          Novo Laboratório
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className={styles.closeMessage}>×</button>
        </div>
      )}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por nome ou documento..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <div className={styles.loading}><div className={styles.spinner}></div><p>A carregar...</p></div>
      ) : laboratoriosFiltrados.length === 0 ? (
        <div className={styles.empty}>
          <p>{filtro ? 'Nenhum laboratório encontrado.' : 'Nenhum laboratório cadastrado.'}</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {laboratoriosFiltrados.map((lab) => (
                <tr key={lab.ID}>
                  <td><strong>{lab.NOME || 'N/A'}</strong></td>
                  <td>{lab.DOCUMENTO || 'N/A'}</td>
                  <td>{lab.TELEFONE || 'N/A'}</td>
                  <td>{lab.EMAIL || 'N/A'}</td>
                  <td>
                    <span className={`${styles.status} ${lab.ATIVO === 1 ? styles.ativo : styles.inativo}`}>
                      {lab.ATIVO === 1 ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button onClick={() => handleEditar(lab)} className={styles.buttonEdit} title="Editar">✏️</button>
                      <button onClick={() => handleRemover(lab)} className={styles.buttonDelete} title="Remover">🗑️</button>
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

export default VisualizarLabsTerceirizados;
