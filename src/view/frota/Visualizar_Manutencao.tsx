import React, { useState, useEffect, useMemo } from 'react';
import styles from './css/visualizar_viagem.module.css';
import { invoke } from "@tauri-apps/api/core";
import { Search, Trash2, Edit3, X, AlertTriangle, Calendar, Settings, Clock, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, Save, Wrench } from 'lucide-react';

// Interfaces baseadas no backend Rust
interface FrotaManutencao {
  id: number;
  tipo?: number;
  veiculo?: number;
  data: string;
  data_manutencao?: string;
  observacao?: string;
  data_realizada?: string;
  km?: number;
  proxima?: string;
}

// Interface para exibição na tabela (dados processados)
interface ManutencaoDisplay {
  id: number;
  veiculo: string;
  tipoManutencao: string;
  data: string;
  dataManutencao?: string;
  dataRealizada?: string;
  proximaManutencao?: string;
  observacao?: string;
  km?: string;
  status: string;
}

interface Veiculo {
  id: number;
  nome: string;
  marca?: string;
  placa?: string;
  ano?: string;
}

interface TipoManutencao {
  id?: number;
  nome: string;
}

// Interface para dados de edição
interface ManutencaoEditData {
  tipo?: number;
  veiculo?: number;
  data: string;
  data_manutencao?: string;
  observacao?: string;
  data_realizada?: string;
  km?: number;
  proxima?: string;
}

const statusOptions = ['Agendada', 'Em andamento', 'Concluída', 'Atrasada'];

const Visualizar_Manutencao: React.FC = () => {
  const [manutencoesOriginais, setManutencoesOriginais] = useState<FrotaManutencao[]>([]);
  const [manutencoesDisplay, setManutencoesDisplay] = useState<ManutencaoDisplay[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [tiposManutencao, setTiposManutencao] = useState<TipoManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados dos filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroObservacao, setFiltroObservacao] = useState('');
  const [filtrosAtivos, setFiltrosAtivos] = useState(false);

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados dos modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [manutencaoToDelete, setManutencaoToDelete] = useState<number | null>(null);
  const [manutencaoToEdit, setManutencaoToEdit] = useState<FrotaManutencao | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editFormData, setEditFormData] = useState<ManutencaoEditData>({
    tipo: undefined,
    veiculo: undefined,
    data: '',
    data_manutencao: undefined,
    observacao: undefined,
    data_realizada: undefined,
    km: undefined,
    proxima: undefined
  });

  // Função para calcular status baseado nas datas
  const calcularStatus = (dataAgendada: string, dataRealizada?: string, _proximaManutencao?: string): string => {
    try {
      const hoje = new Date();
      const agendada = new Date(dataAgendada);
      
      if (dataRealizada) {
        return 'Concluída';
      }
      
      if (agendada < hoje) {
        return 'Atrasada';
      }
      
      // Se a data agendada é hoje ou próxima
      const diffDays = Math.ceil((agendada.getTime() - hoje.getTime()) / (1000 * 3600 * 24));
      if (diffDays <= 7) {
        return 'Em andamento';
      }
      
      return 'Agendada';
    } catch {
      return 'Status indefinido';
    }
  };

  // Função para formatar data para exibição
  const formatarData = (dataISO: string): string => {
    try {
      const data = new Date(dataISO);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  };

  // Função para formatar data para input datetime-local
  const formatarDataParaInput = (dataISO: string): string => {
    try {
      const data = new Date(dataISO);
      return data.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  // Função para buscar nome do veículo pelo ID
  const getNomeVeiculo = (veiculoId?: number): string => {
    if (!veiculoId) return 'Veículo não informado';
    const veiculo = veiculos.find(v => v.id === veiculoId);
    return veiculo ? `${veiculo.nome} ${veiculo.marca || ''}`.trim() : `Veículo ${veiculoId}`;
  };

  // Função para buscar nome do tipo de manutenção pelo ID
  const getNomeTipoManutencao = (tipoId?: number): string => {
    if (!tipoId) return 'Tipo não informado';
    const tipo = tiposManutencao.find(t => t.id === tipoId);
    return tipo ? tipo.nome : `Tipo ${tipoId}`;
  };

  // Buscar tipos de manutenção
  useEffect(() => {
    const buscarTiposManutencao = async () => {
      try {
        const resultado = await invoke<TipoManutencao[]>('buscar_tipos_manutencao');
        setTiposManutencao(resultado);
      } catch (err) {
        console.error("Erro ao buscar tipos de manutenção:", err);
      }
    };

    buscarTiposManutencao();
  }, []);

  // Buscar veículos
  useEffect(() => {
    const buscarVeiculos = async () => {
      try {
        const resultado = await invoke<Veiculo[]>('buscar_veiculos_e_marcas');
        setVeiculos(resultado);
      } catch (err) {
        console.error("Erro ao buscar veículos:", err);
      }
    };

    buscarVeiculos();
  }, []);

  // Buscar manutenções da API
  useEffect(() => {
    const buscarManutencoes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Iniciando busca de manutenções...");
        const resultado = await invoke<FrotaManutencao[]>('buscar_manutencoes');
        console.log("Manutenções retornadas:", resultado);
        
        setManutencoesOriginais(resultado);
      } catch (err) {
        console.error("Erro ao buscar manutenções:", err);
        setError(err as string);
        setManutencoesOriginais([]);
      } finally {
        setLoading(false);
      }
    };

    buscarManutencoes();
  }, []);

  // Processar dados para exibição quando manutenções, veículos ou tipos mudarem
  useEffect(() => {
    if (manutencoesOriginais.length > 0 && veiculos.length > 0 && tiposManutencao.length > 0) {
      const manutencoesProcessadas: ManutencaoDisplay[] = manutencoesOriginais.map(manutencao => ({
        id: manutencao.id,
        veiculo: getNomeVeiculo(manutencao.veiculo),
        tipoManutencao: getNomeTipoManutencao(manutencao.tipo),
        data: formatarData(manutencao.data),
        dataManutencao: manutencao.data_manutencao ? formatarData(manutencao.data_manutencao) : undefined,
        dataRealizada: manutencao.data_realizada ? formatarData(manutencao.data_realizada) : undefined,
        proximaManutencao: manutencao.proxima ? formatarData(manutencao.proxima) : undefined,
        observacao: manutencao.observacao || 'Nenhuma observação',
        km: manutencao.km ? `${manutencao.km.toLocaleString()} km` : 'Não informado',
        status: calcularStatus(manutencao.data, manutencao.data_realizada, manutencao.proxima)
      }));
      
      console.log("Manutenções processadas:", manutencoesProcessadas);
      setManutencoesDisplay(manutencoesProcessadas);
    }
  }, [manutencoesOriginais, veiculos, tiposManutencao]);

  // Verificar se há filtros ativos
  useEffect(() => {
    const temFiltros = filtroVeiculo || filtroTipo || filtroDataInicio || 
                      filtroDataFim || filtroStatus || filtroObservacao;
    setFiltrosAtivos(!!temFiltros);
  }, [filtroVeiculo, filtroTipo, filtroDataInicio, filtroDataFim, filtroStatus, filtroObservacao]);

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroVeiculo, filtroTipo, filtroDataInicio, filtroDataFim, filtroStatus, filtroObservacao]);

  // Função para converter data dd/mm/aaaa para Date
  const parseDate = (dateString: string): Date | null => {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // Mês é 0-indexado
      const year = parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return null;
  };

  // Função para abrir modal de confirmação de exclusão
  const handleOpenDeleteModal = (id: number) => {
    setManutencaoToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Função para fechar modal de confirmação de exclusão
  const handleCloseDeleteModal = () => {
    setManutencaoToDelete(null);
    setIsDeleteModalOpen(false);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!manutencaoToDelete) return;

    try {
      await invoke('deletar_frota_manutencao', { id: manutencaoToDelete });
      
      // Remove da lista local
      setManutencoesDisplay(manutencoesDisplay.filter(manutencao => manutencao.id !== manutencaoToDelete));
      setManutencoesOriginais(manutencoesOriginais.filter(manutencao => manutencao.id !== manutencaoToDelete));
      
      // Mostra modal de sucesso
      setSuccessMessage('Manutenção excluída com sucesso!');
      setIsSuccessModalOpen(true);
      
    } catch (error) {
      console.error('Erro ao excluir manutenção:', error);
      setError('Erro ao excluir manutenção: ' + error);
    } finally {
      handleCloseDeleteModal();
    }
  };

  // Função para abrir modal de edição
  const handleOpenEditModal = (id: number) => {
    const manutencao = manutencoesOriginais.find(m => m.id === id);
    if (manutencao) {
      setManutencaoToEdit(manutencao);
      setEditFormData({
        tipo: manutencao.tipo,
        veiculo: manutencao.veiculo,
        data: formatarDataParaInput(manutencao.data),
        data_manutencao: manutencao.data_manutencao ? formatarDataParaInput(manutencao.data_manutencao) : undefined,
        observacao: manutencao.observacao || '',
        data_realizada: manutencao.data_realizada ? formatarDataParaInput(manutencao.data_realizada) : undefined,
        km: manutencao.km,
        proxima: manutencao.proxima ? formatarDataParaInput(manutencao.proxima) : undefined
      });
      setIsEditModalOpen(true);
    }
  };

  // Função para fechar modal de edição
  const handleCloseEditModal = () => {
    setManutencaoToEdit(null);
    setIsEditModalOpen(false);
  };

  // Função para atualizar campo do formulário de edição
  const handleEditFormChange = (field: keyof ManutencaoEditData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar alterações
  const handleSaveEdit = async () => {
    if (!manutencaoToEdit) return;

    try {
      const updatePayload = {
        veiculo_id: editFormData.veiculo,
        data_servico: editFormData.data,
        descricao_servico: editFormData.observacao,
        km: editFormData.km,
        tipo_manutencao_id: editFormData.tipo
      };

      await invoke('atualizar_frota_manutencao', { 
        id: manutencaoToEdit.id, 
        payload: updatePayload 
      });
      
      // Atualiza a lista local
      const manutencoesAtualizadas = manutencoesOriginais.map(manutencao => 
        manutencao.id === manutencaoToEdit.id 
          ? { ...manutencao, ...editFormData }
          : manutencao
      );
      setManutencoesOriginais(manutencoesAtualizadas);
      
      // Mostra modal de sucesso
      setSuccessMessage('Manutenção atualizada com sucesso!');
      setIsSuccessModalOpen(true);
      
    } catch (error) {
      console.error('Erro ao atualizar manutenção:', error);
      setError('Erro ao atualizar manutenção: ' + error);
    } finally {
      handleCloseEditModal();
    }
  };

  // Função para atualizar dados
  const handleAtualizarDados = async () => {
    try {
      setLoading(true);
      const resultado = await invoke<FrotaManutencao[]>('buscar_manutencoes');
      setManutencoesOriginais(resultado);
    } catch (err) {
      console.error("Erro ao atualizar manutenções:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar manutenções baseado nos seletores e campos
  const manutencoesFiltradas = useMemo(() => {
    return manutencoesDisplay.filter(manutencao => {
      const matchVeiculo = filtroVeiculo ? manutencao.veiculo.includes(filtroVeiculo) : true;
      const matchTipo = filtroTipo ? manutencao.tipoManutencao.includes(filtroTipo) : true;
      const matchStatus = filtroStatus ? manutencao.status === filtroStatus : true;
      const matchObservacao = filtroObservacao ? manutencao.observacao?.toLowerCase().includes(filtroObservacao.toLowerCase()) : true;
      
      // Filtro de data
      let matchData = true;
      if (filtroDataInicio || filtroDataFim) {
        const manutencaoDate = parseDate(manutencao.data);
        if (manutencaoDate) {
          if (filtroDataInicio) {
            const dataInicio = parseDate(filtroDataInicio);
            if (dataInicio && manutencaoDate < dataInicio) {
              matchData = false;
            }
          }
          if (filtroDataFim) {
            const dataFim = parseDate(filtroDataFim);
            if (dataFim && manutencaoDate > dataFim) {
              matchData = false;
            }
          }
        }
      }
      
      return matchVeiculo && matchTipo && matchData && matchStatus && matchObservacao;
    });
  }, [manutencoesDisplay, filtroVeiculo, filtroTipo, filtroDataInicio, filtroDataFim, filtroStatus, filtroObservacao]);

  // Calcular dados da paginação
  const totalItems = manutencoesFiltradas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const manutencoesPaginadas = manutencoesFiltradas.slice(startIndex, endIndex);

  // Funções de navegação da paginação
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPage = (page: number) => setCurrentPage(page);

  // Gerar números de páginas para exibição
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const handleLimparFiltros = () => {
    setFiltroVeiculo('');
    setFiltroTipo('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroStatus('');
    setFiltroObservacao('');
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Clock size={48} className={styles.loadingIcon} />
          <h3>Carregando manutenções...</h3>
          <p>Aguarde enquanto buscamos os dados.</p>
        </div>
      </div>
    );
  }

  // Mostrar erro
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <AlertTriangle size={48} className={styles.errorIcon} />
          <h3>Erro ao carregar manutenções</h3>
          <p>{error}</p>
          <button className={styles.primaryButton} onClick={handleAtualizarDados}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header com título */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Wrench className={styles.titleIcon} />
          Visualizar Manutenções
        </h1>
        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalItems}</span>
            <span className={styles.statLabel}>Manutenções</span>
          </div>
          {filtrosAtivos && (
            <div className={styles.filterIndicator}>
              <Filter size={16} />
              Filtros ativos
            </div>
          )}
        </div>
      </div>

      {/* Container dos Filtros */}
      <div className={styles.filterBar}>
        <div className={styles.filterSection}>
          <h3 className={styles.filterSectionTitle}>
            <Search size={18} />
            Filtros de Busca
          </h3>
          
          <div className={styles.filterGrid}>
            {/* Primeira linha de filtros */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="selectVeiculo">Veículo</label>
                <div className={styles.selectWrapper}>
                  <select 
                    id="selectVeiculo" 
                    className={styles.customSelect}
                    value={filtroVeiculo} 
                    onChange={(e) => setFiltroVeiculo(e.target.value)}
                  >
                    <option value="">Todos os veículos</option>
                    {veiculos.map(v => (
                      <option key={v.id} value={`${v.nome} ${v.marca || ''}`.trim()}>
                        {v.nome} {v.marca && `- ${v.marca}`}
                      </option>
                    ))}
                  </select>
                  <div className={styles.selectArrow}>▼</div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="selectTipo">Tipo de Manutenção</label>
                <div className={styles.selectWrapper}>
                  <select 
                    id="selectTipo" 
                    className={styles.customSelect}
                    value={filtroTipo} 
                    onChange={(e) => setFiltroTipo(e.target.value)}
                  >
                    <option value="">Todos os tipos</option>
                    {tiposManutencao.map(t => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                  <div className={styles.selectArrow}>▼</div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="selectStatus">Status</label>
                <div className={styles.selectWrapper}>
                  <select 
                    id="selectStatus" 
                    className={styles.customSelect}
                    value={filtroStatus} 
                    onChange={(e) => setFiltroStatus(e.target.value)}
                  >
                    <option value="">Todos os status</option>
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className={styles.selectArrow}>▼</div>
                </div>
              </div>
            </div>

            {/* Segunda linha de filtros */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="filterDataInicio">Data Início</label>
                <div className={styles.dateInputContainer}>
                  <Calendar className={styles.dateIcon} size={18} />
                  <input 
                    type="date" 
                    id="filterDataInicio" 
                    className={styles.dateInput}
                    value={filtroDataInicio ? filtroDataInicio.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-');
                        setFiltroDataInicio(`${day}/${month}/${year}`);
                      } else {
                        setFiltroDataInicio('');
                      }
                    }}
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="filterDataFim">Data Fim</label>
                <div className={styles.dateInputContainer}>
                  <Calendar className={styles.dateIcon} size={18} />
                  <input 
                    type="date" 
                    id="filterDataFim" 
                    className={styles.dateInput}
                    value={filtroDataFim ? filtroDataFim.split('/').reverse().join('-') : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const [year, month, day] = e.target.value.split('-');
                        setFiltroDataFim(`${day}/${month}/${year}`);
                      } else {
                        setFiltroDataFim('');
                      }
                    }}
                  />
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="filterObservacao">Observação</label>
                <input 
                  type="text" 
                  id="filterObservacao" 
                  className={styles.textInput}
                  placeholder="Digite a observação..."
                  value={filtroObservacao}
                  onChange={(e) => setFiltroObservacao(e.target.value)}
                />
              </div>
            </div>

            {/* Terceira linha de filtros */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>&nbsp;</label>
                <button 
                  className={styles.clearButton} 
                  onClick={handleLimparFiltros}
                  disabled={!filtrosAtivos}
                >
                  <X size={18} />
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Paginação Superior */}
      {totalItems > 0 && (
        <div className={styles.paginationControls}>
          <div className={styles.paginationInfo}>
            <span>
              Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} manutenções
            </span>
          </div>
          
          <div className={styles.itemsPerPageControl}>
            <label htmlFor="itemsPerPage">Itens por página:</label>
            <select 
              id="itemsPerPage"
              className={styles.itemsPerPageSelect}
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

      {/* Tabela de Resultados */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHead}>Veículo</th>
              <th className={styles.tableHead}>Tipo</th>
              <th className={styles.tableHead}>Data</th>
              <th className={styles.tableHead}>Status</th>
              <th className={styles.tableHead}>KM</th>
              <th className={styles.tableHead}>Data Realizada</th>
              <th className={styles.tableHead}>Próxima</th>
              <th className={styles.tableHead}>Observação</th>
              <th className={styles.tableHead} style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {manutencoesPaginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  <div className={styles.emptyStateContent}>
                    <AlertTriangle size={48} className={styles.emptyStateIcon} />
                    <h3>Nenhuma manutenção encontrada</h3>
                    <p>
                      {manutencoesDisplay.length === 0 
                        ? 'Não há manutenções cadastradas no sistema.' 
                        : 'Tente ajustar os filtros para encontrar as manutenções desejadas.'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              manutencoesPaginadas.map((manutencao) => (
                <tr key={manutencao.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <strong>{manutencao.veiculo}</strong>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <Settings size={16} className={styles.cellIcon} />
                      {manutencao.tipoManutencao}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <Calendar size={16} className={styles.cellIcon} />
                      {manutencao.data}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${styles[`status${manutencao.status.replace(/\s+/g, '')}`]}`}>
                      <Clock size={14} />
                      {manutencao.status}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <strong>{manutencao.km}</strong>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <Calendar size={16} className={styles.cellIcon} />
                      {manutencao.dataRealizada || 'Não realizada'}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <Calendar size={16} className={styles.cellIcon} />
                      {manutencao.proximaManutencao || 'Não agendada'}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      {manutencao.observacao}
                    </div>
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                    <div className={styles.actions}>
                      <button 
                        className={styles.editButton} 
                        onClick={() => handleOpenEditModal(manutencao.id)}
                        title="Editar manutenção"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        className={styles.dangerButton} 
                        onClick={() => handleOpenDeleteModal(manutencao.id)}
                        title="Excluir manutenção"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação Inferior */}
      {totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <div className={styles.paginationNavigation}>
            <button 
              className={styles.paginationButton}
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              title="Primeira página"
            >
              <ChevronsLeft size={18} />
            </button>
            
            <button 
              className={styles.paginationButton}
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Página anterior"
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.pageNumbers}>
              {getPageNumbers().map(pageNum => (
                <button
                  key={pageNum}
                  className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePageNumber : ''}`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            <button 
              className={styles.paginationButton}
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              title="Próxima página"
            >
              <ChevronRight size={18} />
            </button>
            
            <button 
              className={styles.paginationButton}
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              title="Última página"
            >
              <ChevronsRight size={18} />
            </button>
          </div>
          
          <div className={styles.paginationSummary}>
            Página {currentPage} de {totalPages}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <AlertTriangle size={24} className={styles.warningIcon} />
              </div>
              <h3 className={styles.modalTitle}>Confirmar Exclusão</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={handleCloseDeleteModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                Tem certeza de que deseja excluir esta manutenção?
              </p>
              <p className={styles.modalSubMessage}>
                Esta ação não pode ser desfeita.
              </p>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseDeleteModal}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmDeleteButton}
                onClick={handleConfirmDelete}
              >
                <Trash2 size={18} />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Sucesso */}
      {isSuccessModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <CheckCircle size={24} className={styles.successIcon} />
              </div>
              <h3 className={styles.modalTitle}>Sucesso!</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setIsSuccessModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p className={styles.modalMessage}>
                {successMessage}
              </p>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.primaryButton}
                onClick={() => setIsSuccessModalOpen(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {isEditModalOpen && manutencaoToEdit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + ' ' + styles.editModalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <Edit3 size={24} className={styles.editIcon} />
              </div>
              <h3 className={styles.modalTitle}>Editar Manutenção</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={handleCloseEditModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <form className={styles.editForm}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label htmlFor="editVeiculo">Veículo</label>
                    <select
                      id="editVeiculo"
                      className={styles.formSelect}
                      value={editFormData.veiculo || 0}
                      onChange={(e) => handleEditFormChange('veiculo', Number(e.target.value))}
                    >
                      <option value={0}>Selecione um veículo</option>
                      {veiculos.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.nome} {v.marca && `- ${v.marca}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editTipo">Tipo de Manutenção</label>
                    <select
                      id="editTipo"
                      className={styles.formSelect}
                      value={editFormData.tipo || 0}
                      onChange={(e) => handleEditFormChange('tipo', Number(e.target.value))}
                    >
                      <option value={0}>Selecione um tipo</option>
                      {tiposManutencao.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editData">Data</label>
                    <input
                      type="datetime-local"
                      id="editData"
                      className={styles.formInput}
                      value={editFormData.data}
                      onChange={(e) => handleEditFormChange('data', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editDataManutencao">Data de Manutenção</label>
                    <input
                      type="datetime-local"
                      id="editDataManutencao"
                      className={styles.formInput}
                      value={editFormData.data_manutencao || ''}
                      onChange={(e) => handleEditFormChange('data_manutencao', e.target.value || undefined)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editDataRealizada">Data Realizada</label>
                    <input
                      type="datetime-local"
                      id="editDataRealizada"
                      className={styles.formInput}
                      value={editFormData.data_realizada || ''}
                      onChange={(e) => handleEditFormChange('data_realizada', e.target.value || undefined)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editProxima">Próxima Manutenção</label>
                    <input
                      type="datetime-local"
                      id="editProxima"
                      className={styles.formInput}
                      value={editFormData.proxima || ''}
                      onChange={(e) => handleEditFormChange('proxima', e.target.value || undefined)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editKm">Quilometragem</label>
                    <input
                      type="number"
                      id="editKm"
                      className={styles.formInput}
                      value={editFormData.km || ''}
                      onChange={(e) => handleEditFormChange('km', e.target.value ? Number(e.target.value) : undefined)}
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup + ' ' + styles.fullWidth}>
                    <label htmlFor="editObservacao">Observação</label>
                    <textarea
                      id="editObservacao"
                      className={styles.formTextarea}
                      value={editFormData.observacao || ''}
                      onChange={(e) => handleEditFormChange('observacao', e.target.value)}
                      placeholder="Observações sobre a manutenção"
                      rows={3}
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={handleCloseEditModal}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveEdit}
              >
                <Save size={18} />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizar_Manutencao;