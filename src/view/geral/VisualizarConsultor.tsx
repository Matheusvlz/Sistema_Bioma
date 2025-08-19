import React, { useState, useEffect } from 'react';
import { invoke } from "@tauri-apps/api/core"; 
import CadastrarConsultor from './CadastrarConsultor';
import styles from './css/VisualizarConsultor.module.css';

interface Consultor {
  id?: string;
  nome: string;
  documento?: string;
  telefone?: string;
  email?: string;
  ativo: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

const VisualizarConsultor: React.FC = () => {
  const [consultores, setConsultores] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [consultorEdicao, setConsultorEdicao] = useState<Consultor | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [filtro, setFiltro] = useState('');

  useEffect(() => {
    carregarConsultores();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const carregarConsultores = async () => {
    setLoading(true);
    try {
      const response: ApiResponse<Consultor[]> = await invoke('show_cadastrados');
      
      if (response.success && response.data) {
        setConsultores(response.data);
      } else {
        setMessage({ text: response.message || 'Erro ao carregar consultores', type: 'error' });
        setConsultores([]);
      }
    } catch (error) {
      setMessage({ text: `Erro ao carregar consultores: ${error}`, type: 'error' });
      setConsultores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (consultor: Consultor) => {
    setConsultorEdicao(consultor);
    setMostrarFormulario(true);
  };

  const handleRemover = async (consultor: Consultor) => {
    if (!consultor.id) return;

    const confirmacao = window.confirm(
      `Tem certeza que deseja remover o consultor "${consultor.nome}"?`
    );

    if (!confirmacao) return;

    try {
      const idParaEnviar = Number(consultor.id);
      const response: ApiResponse<void> = await invoke('deletar_consultor', { 
        id: idParaEnviar
      });

      if (response.success) {
        setMessage({ text: response.message, type: 'success' });
        carregarConsultores();
      } else {
        setMessage({ text: response.message, type: 'error' });
      }
    } catch (error: any) {
      const errorMessage = error?.message || `Erro desconhecido ao remover consultor.`;
      setMessage({ text: errorMessage, type: 'error' });
    }
  };

  const handleSalvarEdicao = (consultor: Consultor) => {
    setMessage({ text: 'Consultor editado com sucesso!', type: 'success' });
    setConsultorEdicao(null);
    setMostrarFormulario(false);
    carregarConsultores();
  };

  const handleCancelarEdicao = () => {
    setConsultorEdicao(null);
    setMostrarFormulario(false);
  };

  const handleNovoCadastro = () => {
    setConsultorEdicao(null);
    setMostrarFormulario(true);
  };

  const handleSalvarNovo = () => {
    setMessage({ text: 'Consultor cadastrado com sucesso!', type: 'success' });
    setMostrarFormulario(false);
    carregarConsultores();
  };

  const consultoresFiltrados = consultores.filter(consultor =>
    consultor.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    (consultor.documento && consultor.documento.includes(filtro)) ||
    (consultor.email && consultor.email.toLowerCase().includes(filtro.toLowerCase()))
  );

  const formatarDocumento = (documento?: string) => {
    if (!documento) return 'Não informado';
    
    const docLimpo = documento.replace(/\D/g, '');
    if (docLimpo.length === 11) {
      return documento; // CPF já formatado
    } else if (docLimpo.length === 14) {
      return documento; // CNPJ já formatado
    }
    return documento;
  };

  if (mostrarFormulario) {
    return (
      <CadastrarConsultor
        consultorParaEdicao={consultorEdicao || undefined}
        onSalvar={consultorEdicao ? handleSalvarEdicao : handleSalvarNovo}
        onCancelar={handleCancelarEdicao}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Consultores Cadastrados</h2>
        <button 
          onClick={handleNovoCadastro}
          className={styles.buttonPrimary}
          disabled={loading}
        >
          Novo Consultor
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className={styles.closeMessage}
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="🔍 Buscar por nome, documento ou e-mail..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className={styles.searchInput}
          disabled={loading}
        />
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Carregando consultores...</p>
        </div>
      ) : consultoresFiltrados.length === 0 ? (
        <div className={styles.empty}>
          <p>
            {filtro 
              ? 'Nenhum consultor encontrado com os critérios de busca.' 
              : 'Nenhum consultor cadastrado.'
            }
          </p>
          {!filtro && (
            <button 
              onClick={handleNovoCadastro}
              className={styles.buttonPrimary}
            >
              Cadastrar Primeiro Consultor
            </button>
          )}
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
              {consultoresFiltrados.map((consultor) => (
                <tr key={consultor.id || consultor.nome}>
                  <td className={styles.nameCell}>
                    <strong>{consultor.nome}</strong>
                  </td>
                  <td>
                    <span className={styles.documentCell}>
                      {formatarDocumento(consultor.documento)}
                    </span>
                  </td>
                  <td>{consultor.telefone || 'Não informado'}</td>
                  <td>{consultor.email || 'Não informado'}</td>
                  <td>
                    <span className={`${styles.status} ${consultor.ativo ? styles.ativo : styles.inativo}`}>
                      {consultor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        onClick={() => handleEditar(consultor)}
                        className={styles.buttonEdit}
                        title="Editar consultor"
                        disabled={loading}
                        aria-label={`Editar ${consultor.nome}`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleRemover(consultor)}
                        className={styles.buttonDelete}
                        title="Remover consultor"
                        disabled={loading}
                        aria-label={`Remover ${consultor.nome}`}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.footer}>
        <p>
          {consultoresFiltrados.length === consultores.length 
            ? `Total: ${consultoresFiltrados.length} consultor${consultoresFiltrados.length !== 1 ? 'es' : ''}`
            : `Exibindo: ${consultoresFiltrados.length} de ${consultores.length} consultores`
          }
        </p>
        <button 
          onClick={carregarConsultores}
          className={styles.buttonSecondary}
          disabled={loading}
        >
          {loading ? 'Carregando...' : '🔄 Atualizar Lista'}
        </button>
      </div>
    </div>
  );
};

export default VisualizarConsultor;