import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/VisualizarPesquisas.module.css';

// --- Tipagens (mantidas no arquivo, conforme sua preferência) ---
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface PesquisaDetalhada {
  id: number;
  descricao: string;
  dataInicial: string;
  dataTermino: string;
  nomeModelo: string;
  finalizada: boolean;
}

interface PaginatedPesquisasResponse {
  items: PesquisaDetalhada[];
  total: number;
  page: number;
  per_page: number;
}

interface PesquisaModeloOption {
  id: number;
  descricao: string;
}

// O ideal é que venha de um arquivo de configuração
const ITENS_POR_PAGINA = 15;

const VisualizarPesquisas: React.FC = () => {
  const [pesquisas, setPesquisas] = useState<PesquisaDetalhada[]>([]);
  const [modelos, setModelos] = useState<PesquisaModeloOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ALTERADO: O estado de 'finalizada' agora usa strings para compatibilidade com o <select>
  const [filtros, setFiltros] = useState({
    modeloId: "0",
    data: '',
    finalizada: "false", // Padrão: "false" (Não finalizadas), "true" (Finalizadas), "all" (Todos)
  });

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [triggerBusca, setTriggerBusca] = useState(0);

  const carregarPesquisas = useCallback(async () => {
    setLoading(true);
    setError(null);

    // ALTERADO: Lógica para montar o payload dos filtros corretamente
    const filtrosPayload = {
      page: paginaAtual,
      perPage: ITENS_POR_PAGINA,
      modeloId: Number(filtros.modeloId) > 0 ? Number(filtros.modeloId) : undefined,
      data: filtros.data || undefined,
      finalizada: filtros.finalizada === 'all' ? undefined : (filtros.finalizada === 'true'),
    };

    try {
      const res: ApiResponse<PaginatedPesquisasResponse> = await invoke("listar_pesquisas_tauri", {
        filtros: filtrosPayload
      });

      if (res.success && res.data) {
        setPesquisas(res.data.items);
        setTotalPaginas(Math.ceil(res.data.total / res.data.per_page) || 1);
      } else {
        setError(res.message || "Erro ao carregar pesquisas.");
        setPesquisas([]);
      }
    } catch (err: any) {
      setError(err.message || "Erro de comunicação.");
    } finally {
      setLoading(false);
    }
  }, [paginaAtual, triggerBusca]); // A busca é disparada pela página ou pelo trigger manual

  useEffect(() => {
    carregarPesquisas();
  }, [carregarPesquisas]);

  useEffect(() => {
    const carregarModelos = async () => {
      const res: ApiResponse<PesquisaModeloOption[]> = await invoke("listar_modelos_pesquisa_tauri");
      if (res.success && res.data) {
        setModelos(res.data);
      }
    };
    carregarModelos();
  }, []);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };
  
  const handleBuscar = () => {
    setPaginaAtual(1); // Sempre volta para a primeira página ao buscar
    setTriggerBusca(c => c + 1);
  };

  const handleLimparFiltros = () => {
    setFiltros({ modeloId: "0", data: '', finalizada: "false" });
    setPaginaAtual(1);
    setTriggerBusca(c => c + 1);
  };

  // CORRIGIDO: Lógica para alternar o status
  const handleAlternarStatus = async (pesquisa: PesquisaDetalhada) => {
    try {
        const payload = { finalizada: !pesquisa.finalizada };
        const res: ApiResponse<PesquisaDetalhada> = await invoke("atualizar_status_pesquisa_tauri", { id: pesquisa.id, payload });
        
        if(res.success && res.data) {
            // Atualiza a lista localmente para um feedback instantâneo
            setPesquisas(prev => prev.map(p => p.id === pesquisa.id ? res.data! : p));
        } else {
            setError(res.message || "Não foi possível alterar o status.");
        }
    } catch (err: any) {
        setError(err.message || "Erro de comunicação ao alterar status.");
    }
  };

  // CORRIGIDO: Chamadas ao WindowManager
  const handleNova = () => WindowManager.openFormularioPesquisa();
  const handleEditar = (id: number) => WindowManager.openFormularioPesquisa(id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Gerenciar Pesquisas de Qualidade</h2>
        <button onClick={handleNova} className={styles.buttonPrimary}>
          + Nova Pesquisa
        </button>
      </div>
      
      <div className={styles.filterBar}>
        <select name="modeloId" value={filtros.modeloId} onChange={handleFiltroChange}>
          <option value="0">Todos os Modelos</option>
          {modelos.map(m => <option key={m.id} value={m.id}>{m.descricao}</option>)}
        </select>
        <input type="date" name="data" value={filtros.data} onChange={handleFiltroChange} />
        {/* ALTERADO: Os valores do select agora correspondem ao novo estado */}
        <select name="finalizada" value={filtros.finalizada} onChange={handleFiltroChange}>
            <option value="all">Status: Todos</option>
            <option value="false">Status: Ativa</option>
            <option value="true">Status: Finalizada</option>
        </select>
        <button onClick={handleBuscar} className={styles.buttonPrimary}>Buscar</button>
        <button onClick={handleLimparFiltros} className={styles.buttonSecondary}>Limpar</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.tableContainer}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrição</th>
              <th>Período</th>
              <th>Modelo</th>
              <th>Status</th>
              <th style={{ width: '120px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className={styles.spinner}></div></td></tr>
            ) : pesquisas.length > 0 ? (
              pesquisas.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.descricao}</td>
                  <td>{`${p.dataInicial} - ${p.dataTermino}`}</td>
                  <td>{p.nomeModelo}</td>
                  <td>
                    <span className={p.finalizada ? styles.statusFinalizada : styles.statusAtiva}>
                      {p.finalizada ? 'Finalizada' : 'Ativa'}
                    </span>
                  </td>
                  <td className={styles.actions}>
                    <button onClick={() => handleEditar(p.id)} disabled={p.finalizada} title={p.finalizada ? "Não é possível editar uma pesquisa finalizada" : "Editar Pesquisa"}>✏️</button>
                    <button title="Visualizar/Enviar Respostas">👁️</button>
                    <button onClick={() => handleAlternarStatus(p)} title={p.finalizada ? "Reativar Pesquisa" : "Finalizar Pesquisa"}>
                      {p.finalizada ? '🟢' : '🔴'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className={styles.noResults}>Nenhuma pesquisa encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <button onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} disabled={paginaAtual <= 1 || loading}>Anterior</button>
        <span>Página {paginaAtual} de {totalPaginas}</span>
        <button onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} disabled={paginaAtual >= totalPaginas || loading}>Próxima</button>
      </div>
    </div>
  );
};

export default VisualizarPesquisas;