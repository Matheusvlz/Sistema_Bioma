import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, 
  Unlock, 
  Search, 
  Calendar, 
  User, 
  Monitor, 
  Wifi,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  Building,
  Clock,
  History
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import styles from './styles/AmostrasBloqueadas.module.css';
import { WindowManager } from '../../hooks/WindowManager';
// ==================== INTERFACES ====================

interface AmostraBloqueada {
  id: number;
  numero: string | null;
  identificacao: string | null;
  complemento: string | null;
  data_coleta: string | null;
  hora_coleta: string | null;
  data_lab: string | null;
  hora_lab: string | null;
  fantasia: string | null;
  razao: string | null;
  usuario_bloqueio: string | null;
  bloqueio_ip: string | null;
  bloqueio_pc: string | null;
  data_bloqueio: string | null;
}

interface HistoricoBloqueio {
  id: number;
  usuario: string | null;
  ip: string | null;
  computador: string | null;
  data_hora: string | null;
  bloqueado: boolean;
}

interface Usuario {
  success: boolean;
  id: number;
  nome: string;
  privilegio: string;
}

// ==================== COMPONENTE PRINCIPAL ====================

export const AmostrasBloqueadas: React.FC = () => {
  const [amostras, setAmostras] = useState<AmostraBloqueada[]>([]);
  const [amostrasFiltradas, setAmostrasFiltradas] = useState<AmostraBloqueada[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [grupos, setGrupos] = useState<string[]>([]);
  
  // Estados do modal de histórico
  const [modalHistorico, setModalHistorico] = useState(false);
  const [historicoAtual, setHistoricoAtual] = useState<HistoricoBloqueio[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Carregar usuário logado
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const user = await invoke<Usuario>('usuario_logado');
        setUsuario(user);
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      }
    };
    carregarUsuario();
  }, []);

  // Carregar grupos do laboratório (você pode adaptar conforme sua lógica)
  useEffect(() => {
    // Exemplo: carregar grupos do localStorage ou de uma API
    // Por enquanto, vou usar um exemplo fixo
    const gruposExemplo = [
      'Microbiologia',
      'Físico-Química',
      'Química',
      // Adicione seus grupos aqui
    ];
    setGrupos(gruposExemplo);
  }, []);

  // Carregar amostras bloqueadas
  const carregarAmostras = useCallback(async () => {
    if (grupos.length === 0) return;
    
    setLoading(true);
    try {
      const response = await invoke<{
        success: boolean;
        amostras: AmostraBloqueada[];
        total: number;
      }>('listar_amostras_bloqueadas', { grupos });

      if (response.success) {
        setAmostras(response.amostras);
        setAmostrasFiltradas(response.amostras);
      }
    } catch (error) {
      console.error('Erro ao carregar amostras bloqueadas:', error);
      alert('Erro ao carregar amostras bloqueadas');
    } finally {
      setLoading(false);
    }
  }, [grupos]);

  useEffect(() => {
    carregarAmostras();
  }, [carregarAmostras]);

  // Filtro de pesquisa
  useEffect(() => {
    if (!searchTerm.trim()) {
      setAmostrasFiltradas(amostras);
      return;
    }

    const termo = searchTerm.toLowerCase();
    const filtradas = amostras.filter(amostra => 
      amostra.numero?.toLowerCase().includes(termo) ||
      amostra.identificacao?.toLowerCase().includes(termo) ||
      amostra.complemento?.toLowerCase().includes(termo) ||
      amostra.fantasia?.toLowerCase().includes(termo) ||
      amostra.razao?.toLowerCase().includes(termo) ||
      amostra.usuario_bloqueio?.toLowerCase().includes(termo)
    );
    setAmostrasFiltradas(filtradas);
  }, [searchTerm, amostras]);
// Abrir detalhes da amostra
const abrirDetalhesAmostra = async (amostra: AmostraBloqueada) => {
  if (!usuario) {
    alert('Usuário não identificado');
    return;
  }

  try {
    const dadosAmostra = {
      idAnalise: amostra.id,
      idUsuario: usuario.id,
      arrayAmostras: [
        {
          id: amostra.id,
          numero: amostra.numero,
          identificacao: amostra.identificacao,
          fantasia: amostra.fantasia,
          razao: amostra.razao
        }
      ]
    };

    await WindowManager.openAmostrasNaoIniciadas(dadosAmostra);
  } catch (error) {
    console.error('Erro ao abrir detalhes da amostra:', error);
    alert('Erro ao abrir tela de detalhes da amostra');
  }
};
  // Selecionar/Desselecionar amostra
  const toggleSelecao = (id: number) => {
    setSelecionadas(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(id)) {
        novoSet.delete(id);
      } else {
        novoSet.add(id);
      }
      return novoSet;
    });
  };

  // Selecionar todas
  const toggleSelecionarTodas = () => {
    if (selecionadas.size === amostrasFiltradas.length) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(amostrasFiltradas.map(a => a.id)));
    }
  };

  // Desbloquear amostras
  const desbloquearAmostras = async () => {
    if (selecionadas.size === 0) {
      alert('Selecione ao menos uma amostra para desbloquear');
      return;
    }

    if (!usuario) {
      alert('Usuário não identificado');
      return;
    }

    const confirmacao = window.confirm(
      `Deseja desbloquear ${selecionadas.size} amostra(s) selecionada(s)?`
    );

    if (!confirmacao) return;

    setLoading(true);
    try {
      const response = await invoke<{
        success: boolean;
        total_desbloqueadas: number;
        message: string;
      }>('desbloquear_amostras', {
        payload: {
          ids_analise: Array.from(selecionadas),
          id_usuario: usuario.id,
        }
      });

      if (response.success) {
        alert(response.message);
        setSelecionadas(new Set());
        await carregarAmostras();
      } else {
        alert('Erro ao desbloquear amostras');
      }
    } catch (error) {
      console.error('Erro ao desbloquear:', error);
      alert('Erro ao desbloquear amostras');
    } finally {
      setLoading(false);
    }
  };

  // Visualizar histórico
  const visualizarHistorico = async (idAnalise: number) => {
    setLoadingHistorico(true);
    setModalHistorico(true);
    
    try {
      const historico = await invoke<HistoricoBloqueio[]>(
        'buscar_historico_bloqueio',
        { idAnalise }
      );
      setHistoricoAtual(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      alert('Erro ao buscar histórico de bloqueios');
      setHistoricoAtual([]);
    } finally {
      setLoadingHistorico(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <Lock className={styles.headerIcon} size={32} />
            <div>
              <h1 className={styles.title}>Amostras Bloqueadas</h1>
              <p className={styles.subtitle}>
                Gerenciar amostras com restrição de análise
              </p>
            </div>
          </div>
          
          <div className={styles.headerActions}>
            <button
              className={styles.btnRefresh}
              onClick={carregarAmostras}
              disabled={loading}
              title="Atualizar lista"
            >
              <RefreshCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* BARRA DE FERRAMENTAS */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
        
          <input
            type="text"
            placeholder="Pesquisar por número, identificação, cliente ou usuário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button
              className={styles.searchClear}
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <Lock size={16} />
            <span>{amostrasFiltradas.length} bloqueadas</span>
          </div>
          {selecionadas.size > 0 && (
            <div className={styles.statItem} style={{ color: '#3b82f6' }}>
              <CheckCircle2 size={16} />
              <span>{selecionadas.size} selecionadas</span>
            </div>
          )}
        </div>

        {selecionadas.size > 0 && (
          <button
            className={styles.btnDesbloquear}
            onClick={desbloquearAmostras}
            disabled={loading}
          >
            <Unlock size={18} />
            Desbloquear Selecionadas
          </button>
        )}
      </div>

      {/* LISTA DE AMOSTRAS */}
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loading}>
            <RefreshCcw className={styles.loadingIcon} size={48} />
            <p>Carregando amostras bloqueadas...</p>
          </div>
        ) : amostrasFiltradas.length === 0 ? (
          <div className={styles.empty}>
            <CheckCircle2 size={64} className={styles.emptyIcon} />
            <h3>Nenhuma amostra bloqueada</h3>
            <p>Não há amostras bloqueadas no momento</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCheckbox}>
                  <input
                    type="checkbox"
                    checked={selecionadas.size === amostrasFiltradas.length}
                    onChange={toggleSelecionarTodas}
                    className={styles.checkbox}
                  />
                </th>
                <th>Amostra</th>
                <th>Identificação</th>
                <th>Complemento</th>
                <th>Cliente</th>
                <th>Data Coleta</th>
                <th>Entrada Lab</th>
                <th>Bloqueado Por</th>
                <th>Data Bloqueio</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {amostrasFiltradas.map((amostra) => (
                <tr
                  key={amostra.id}
                  className={selecionadas.has(amostra.id) ? styles.rowSelected : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selecionadas.has(amostra.id)}
                      onChange={() => toggleSelecao(amostra.id)}
                      className={styles.checkbox}
                    />
                  </td>
                  <td className={styles.cellNumero}>
  <strong 
    onClick={() => abrirDetalhesAmostra(amostra)}
    className={styles.numeroClicavel}
    title="Clique para ver detalhes da amostra"
  >
    {amostra.numero || 'N/A'}
  </strong>
</td>
                  <td>{amostra.identificacao || '-'}</td>
                  <td>{amostra.complemento || '-'}</td>
                  <td className={styles.cellCliente}>
                    <div className={styles.clienteInfo}>
                      <Building size={14} />
                      <div>
                        <div className={styles.clienteFantasia}>
                          {amostra.fantasia || 'N/A'}
                        </div>
                        <div className={styles.clienteRazao}>
                          {amostra.razao}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.cellData}>
                    <div className={styles.dataHora}>
                      <Calendar size={14} />
                      <span>{amostra.data_coleta || 'N/A'}</span>
                      <Clock size={14} />
                      <span>{amostra.hora_coleta || 'N/A'}</span>
                    </div>
                  </td>
                  <td className={styles.cellData}>
                    <div className={styles.dataHora}>
                      <Calendar size={14} />
                      <span>{amostra.data_lab || 'N/A'}</span>
                      <Clock size={14} />
                      <span>{amostra.hora_lab || 'N/A'}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.bloqueioInfo}>
                      <User size={14} />
                      <span>{amostra.usuario_bloqueio || 'N/A'}</span>
                    </div>
                  </td>
                  <td className={styles.cellData}>
                    {amostra.data_bloqueio || 'N/A'}
                  </td>
                  <td>
                    <button
                      className={styles.btnHistorico}
                      onClick={() => visualizarHistorico(amostra.id)}
                      title="Ver histórico de bloqueios"
                    >
                      <History size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL DE HISTÓRICO */}
      {modalHistorico && (
        <div className={styles.modalOverlay} onClick={() => setModalHistorico(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <History size={24} />
                <h2>Histórico de Bloqueios</h2>
              </div>
              <button
                className={styles.modalClose}
                onClick={() => setModalHistorico(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {loadingHistorico ? (
                <div className={styles.loadingHistorico}>
                  <RefreshCcw className={styles.loadingIcon} size={32} />
                  <p>Carregando histórico...</p>
                </div>
              ) : historicoAtual.length === 0 ? (
                <div className={styles.emptyHistorico}>
                  <AlertTriangle size={48} />
                  <p>Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className={styles.historicoList}>
                  {historicoAtual.map((item) => (
                    <div
                      key={item.id}
                      className={`${styles.historicoItem} ${
                        item.bloqueado ? styles.itemBloqueado : styles.itemDesbloqueado
                      }`}
                    >
                      <div className={styles.historicoIcon}>
                        {item.bloqueado ? (
                          <Lock size={20} />
                        ) : (
                          <Unlock size={20} />
                        )}
                      </div>
                      <div className={styles.historicoDetails}>
                        <div className={styles.historicoAction}>
                          {item.bloqueado ? 'Bloqueada' : 'Desbloqueada'}
                        </div>
                        <div className={styles.historicoMeta}>
                          <User size={12} />
                          <span>{item.usuario || 'N/A'}</span>
                          <Wifi size={12} />
                          <span>{item.ip || 'N/A'}</span>
                          <Monitor size={12} />
                          <span>{item.computador || 'N/A'}</span>
                        </div>
                        <div className={styles.historicoData}>
                          <Clock size={12} />
                          {item.data_hora}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};