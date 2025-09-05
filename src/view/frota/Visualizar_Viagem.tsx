import React, { useState, useEffect, useMemo } from 'react';
import styles from './css/visualizar_viagem.module.css';
import { invoke } from "@tauri-apps/api/core";
import { Search, Trash2, Edit3, X, AlertTriangle, Calendar, MapPin, Clock, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, Save } from 'lucide-react';

// Interfaces atualizadas para corresponder ao backend Rust
interface FrotaViagem {
  id: number;
  descricao?: string;
  origem?: string;
  destino?: string;
  data_inicio: string;
  quilometragem_inicial?: number;
  quilometragem_final?: number;
  veiculo: number;
  motorista: number;
  data_termino?: string;
}

// Interface para exibição na tabela (dados processados)
interface ViagemDisplay {
  id: number;
  veiculo: string;
  motorista: string;
  data: string;
  totalHoras: string;
  totalKm: string;
  origem?: string;
  destino?: string;
  periodo?: string;
  descricao?: string;
}

interface Veiculo {
  id: number;
  nome: string;
  marca?: string;
  placa?: string;
  ano?: string;
}

interface Motorista {
  id: number;
  nome: string;
  cnh?: string;
}

// Interface para dados de edição
interface ViagemEditData {
  descricao: string;
  origem: string;
  destino: string;
  data_inicio: string;
  quilometragem_inicial: number;
  quilometragem_final?: number;
  veiculo: number;
  motorista: number;
  data_termino?: string;
}

const periodos = ['Manhã', 'Tarde', 'Noite', 'Integral'];

const Visualizar_Viagem: React.FC = () => {
  const [viagensOriginais, setViagensOriginais] = useState<FrotaViagem[]>([]);
  const [viagensDisplay, setViagensDisplay] = useState<ViagemDisplay[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados dos filtros
  const [filtroVeiculo, setFiltroVeiculo] = useState('');
  const [filtroMotorista, setFiltroMotorista] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('');
  const [filtroDestino, setFiltroDestino] = useState('');
  const [filtrosAtivos, setFiltrosAtivos] = useState(false);

  // Estados da paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Estados dos modais
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [viagemToDelete, setViagemToDelete] = useState<number | null>(null);
  const [viagemToEdit, setViagemToEdit] = useState<FrotaViagem | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [editFormData, setEditFormData] = useState<ViagemEditData>({
    descricao: '',
    origem: '',
    destino: '',
    data_inicio: '',
    quilometragem_inicial: 0,
    quilometragem_final: undefined,
    veiculo: 0,
    motorista: 0,
    data_termino: undefined
  });

  // Função para calcular período baseado na data
  const calcularPeriodo = (dataInicio: string): string => {
    try {
      const data = new Date(dataInicio);
      const hora = data.getHours();
      
      if (hora >= 6 && hora < 12) return 'Manhã';
      if (hora >= 12 && hora < 18) return 'Tarde';
      if (hora >= 18 || hora < 6) return 'Noite';
      return 'Integral';
    } catch {
      return 'Não informado';
    }
  };

  // Função para calcular total de horas
  const calcularTotalHoras = (dataInicio: string, dataTermino?: string): string => {
    try {
      const inicio = new Date(dataInicio);
      const termino = dataTermino ? new Date(dataTermino) : new Date();

      // Valida se as datas são válidas
      if (isNaN(inicio.getTime()) || isNaN(termino.getTime())) {
        return 'Data inválida';
      }

      let diffMs = termino.getTime() - inicio.getTime();

      // Garante que a diferença não seja negativa
      if (diffMs < 0) {
        return '0h 0m';
      }

      // 1. Calcula as horas completas, descartando a fração
      const horas = Math.floor(diffMs / (1000 * 60 * 60));

      // 2. Pega o resto dos milissegundos que não formaram uma hora completa
      const msRestantes = diffMs % (1000 * 60 * 60);

      // 3. Calcula os minutos a partir do resto
      const minutos = Math.floor(msRestantes / (1000 * 60));

      return `${horas}h ${minutos}m`;

    } catch {
      return 'Erro no cálculo';
    }
  };

  // Função para calcular total de KM
  const calcularTotalKm = (kmInicial?: number, kmFinal?: number): string => {
    if (kmInicial && kmFinal && kmFinal > kmInicial) {
      return (kmFinal - kmInicial).toString();
    }
    return '0';
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
  const getNomeVeiculo = (veiculoId: number): string => {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    return veiculo ? `${veiculo.nome} ${veiculo.marca || ''}`.trim() : `Veículo ${veiculoId}`;
  };

  // Função para buscar nome do motorista pelo ID
  const getNomeMotorista = (motoristaId: number): string => {
    const motorista = motoristas.find(m => m.id === motoristaId);
    return motorista ? motorista.nome : `Motorista ${motoristaId}`;
  };

  // Buscar motoristas
  useEffect(() => {
    const buscarMotoristas = async () => {
      try {
        const resultado = await invoke<Motorista[]>('buscar_motoristas');
        setMotoristas(resultado);
      } catch (err) {
        console.error("Erro ao buscar motoristas:", err);
      }
    };

    buscarMotoristas();
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

  // Buscar viagens da API
  useEffect(() => {
    const buscarViagens = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("Iniciando busca de viagens...");
        const resultado = await invoke<FrotaViagem[]>('buscar_viagens');
        console.log("Viagens retornadas:", resultado);
        
        setViagensOriginais(resultado);
      } catch (err) {
        console.error("Erro ao buscar viagens:", err);
        setError(err as string);
        setViagensOriginais([]);
      } finally {
        setLoading(false);
      }
    };

    buscarViagens();
  }, []);

  // Processar dados para exibição quando viagens, veículos ou motoristas mudarem
  useEffect(() => {
    if (viagensOriginais.length > 0 && veiculos.length > 0 && motoristas.length > 0) {
      const viagensProcessadas: ViagemDisplay[] = viagensOriginais.map(viagem => ({
        id: viagem.id,
        veiculo: getNomeVeiculo(viagem.veiculo),
        motorista: getNomeMotorista(viagem.motorista),
        data: formatarData(viagem.data_inicio),
        totalHoras: calcularTotalHoras(viagem.data_inicio, viagem.data_termino),
        totalKm: calcularTotalKm(viagem.quilometragem_inicial, viagem.quilometragem_final),
        origem: viagem.origem || 'Não informada',
        destino: viagem.destino || 'Não informado',
        periodo: calcularPeriodo(viagem.data_inicio),
        descricao: viagem.descricao
      }));
      
      console.log("Viagens processadas:", viagensProcessadas);
      setViagensDisplay(viagensProcessadas);
    }
  }, [viagensOriginais, veiculos, motoristas]);

  // Verificar se há filtros ativos
  useEffect(() => {
    const temFiltros = filtroVeiculo || filtroMotorista || filtroDataInicio || 
                      filtroDataFim || filtroPeriodo || filtroOrigem || filtroDestino;
    setFiltrosAtivos(!!temFiltros);
  }, [filtroVeiculo, filtroMotorista, filtroDataInicio, filtroDataFim, filtroPeriodo, filtroOrigem, filtroDestino]);

  // Reset da página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroVeiculo, filtroMotorista, filtroDataInicio, filtroDataFim, filtroPeriodo, filtroOrigem, filtroDestino]);

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
    setViagemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  // Função para fechar modal de confirmação de exclusão
  const handleCloseDeleteModal = () => {
    setViagemToDelete(null);
    setIsDeleteModalOpen(false);
  };

  // Função para confirmar exclusão
  const handleConfirmDelete = async () => {
    if (!viagemToDelete) return;

    try {
      await invoke('deletar_frota_viagem', { id: viagemToDelete });
      
      // Remove da lista local
      setViagensDisplay(viagensDisplay.filter(viagem => viagem.id !== viagemToDelete));
      setViagensOriginais(viagensOriginais.filter(viagem => viagem.id !== viagemToDelete));
      
      // Mostra modal de sucesso
      setSuccessMessage('Viagem excluída com sucesso!');
      setIsSuccessModalOpen(true);
      
    } catch (error) {
      console.error('Erro ao excluir viagem:', error);
      setError('Erro ao excluir viagem: ' + error);
    } finally {
      handleCloseDeleteModal();
    }
  };

  // Função para abrir modal de edição
  const handleOpenEditModal = (id: number) => {
    const viagem = viagensOriginais.find(v => v.id === id);
    if (viagem) {
      setViagemToEdit(viagem);
      setEditFormData({
        descricao: viagem.descricao || '',
        origem: viagem.origem || '',
        destino: viagem.destino || '',
        data_inicio: formatarDataParaInput(viagem.data_inicio),
        quilometragem_inicial: viagem.quilometragem_inicial || 0,
        quilometragem_final: viagem.quilometragem_final,
        veiculo: viagem.veiculo,
        motorista: viagem.motorista,
        data_termino: viagem.data_termino ? formatarDataParaInput(viagem.data_termino) : undefined
      });
      setIsEditModalOpen(true);
    }
  };

  // Função para fechar modal de edição
  const handleCloseEditModal = () => {
    setViagemToEdit(null);
    setIsEditModalOpen(false);
  };

  // Função para atualizar campo do formulário de edição
  const handleEditFormChange = (field: keyof ViagemEditData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para salvar alterações
  const handleSaveEdit = async () => {
    if (!viagemToEdit) return;

    try {
      const updatePayload = {
        descricao: editFormData.descricao || undefined,
        origem: editFormData.origem || undefined,
        destino: editFormData.destino || undefined,
        data_inicio: editFormData.data_inicio || undefined,
        quilometragem_inicial: editFormData.quilometragem_inicial || undefined,
        quilometragem_final: editFormData.quilometragem_final || undefined,
        veiculo: editFormData.veiculo || undefined,
        motorista: editFormData.motorista || undefined,
        data_termino: editFormData.data_termino || undefined
      };

      await invoke('atualizar_frota_viagem', { 
        id: viagemToEdit.id, 
        payload: updatePayload 
      });
      
      // Atualiza a lista local
      const viagensAtualizadas = viagensOriginais.map(viagem => 
        viagem.id === viagemToEdit.id 
          ? { ...viagem, ...editFormData, data_inicio: editFormData.data_inicio, data_termino: editFormData.data_termino }
          : viagem
      );
      setViagensOriginais(viagensAtualizadas);
      
      // Mostra modal de sucesso
      setSuccessMessage('Viagem atualizada com sucesso!');
      setIsSuccessModalOpen(true);
      
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      setError('Erro ao atualizar viagem: ' + error);
    } finally {
      handleCloseEditModal();
    }
  };

  // Função para atualizar dados
  const handleAtualizarDados = async () => {
    try {
      setLoading(true);
      const resultado = await invoke<FrotaViagem[]>('buscar_viagens');
      setViagensOriginais(resultado);
    } catch (err) {
      console.error("Erro ao atualizar viagens:", err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar viagens baseado nos seletores e campos
  const viagensFiltradas = useMemo(() => {
    return viagensDisplay.filter(viagem => {
      const matchVeiculo = filtroVeiculo ? viagem.veiculo.includes(filtroVeiculo) : true;
      const matchMotorista = filtroMotorista ? viagem.motorista.includes(filtroMotorista) : true;
      const matchPeriodo = filtroPeriodo ? viagem.periodo === filtroPeriodo : true;
      const matchOrigem = filtroOrigem ? viagem.origem?.toLowerCase().includes(filtroOrigem.toLowerCase()) : true;
      const matchDestino = filtroDestino ? viagem.destino?.toLowerCase().includes(filtroDestino.toLowerCase()) : true;
      
      // Filtro de data
      let matchData = true;
      if (filtroDataInicio || filtroDataFim) {
        const viagemDate = parseDate(viagem.data);
        if (viagemDate) {
          if (filtroDataInicio) {
            const dataInicio = parseDate(filtroDataInicio);
            if (dataInicio && viagemDate < dataInicio) {
              matchData = false;
            }
          }
          if (filtroDataFim) {
            const dataFim = parseDate(filtroDataFim);
            if (dataFim && viagemDate > dataFim) {
              matchData = false;
            }
          }
        }
      }
      
      return matchVeiculo && matchMotorista && matchData && matchPeriodo && matchOrigem && matchDestino;
    });
  }, [viagensDisplay, filtroVeiculo, filtroMotorista, filtroDataInicio, filtroDataFim, filtroPeriodo, filtroOrigem, filtroDestino]);

  // Calcular dados da paginação
  const totalItems = viagensFiltradas.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const viagensPaginadas = viagensFiltradas.slice(startIndex, endIndex);

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
    setFiltroMotorista('');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltroPeriodo('');
    setFiltroOrigem('');
    setFiltroDestino('');
  };

  // Mostrar loading
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <Clock size={48} className={styles.loadingIcon} />
          <h3>Carregando viagens...</h3>
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
          <h3>Erro ao carregar viagens</h3>
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
          <MapPin className={styles.titleIcon} />
          Visualizar Viagens
        </h1>
        <div className={styles.headerStats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalItems}</span>
            <span className={styles.statLabel}>Viagens</span>
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
                <label htmlFor="selectMotorista">Motorista</label>
                <div className={styles.selectWrapper}>
                  <select 
                    id="selectMotorista" 
                    className={styles.customSelect}
                    value={filtroMotorista} 
                    onChange={(e) => setFiltroMotorista(e.target.value)}
                  >
                    <option value="">Todos os motoristas</option>
                    {motoristas.map(m => (
                      <option key={m.id} value={m.nome}>{m.nome}</option>
                    ))}
                  </select>
                  <div className={styles.selectArrow}>▼</div>
                </div>
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="selectPeriodo">Período</label>
                <div className={styles.selectWrapper}>
                  <select 
                    id="selectPeriodo" 
                    className={styles.customSelect}
                    value={filtroPeriodo} 
                    onChange={(e) => setFiltroPeriodo(e.target.value)}
                  >
                    <option value="">Todos os períodos</option>
                    {periodos.map(p => (
                      <option key={p} value={p}>{p}</option>
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
            </div>

            {/* Terceira linha de filtros */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label htmlFor="filterOrigem">Origem</label>
                <input 
                  type="text" 
                  id="filterOrigem" 
                  className={styles.textInput}
                  placeholder="Digite a origem..."
                  value={filtroOrigem}
                  onChange={(e) => setFiltroOrigem(e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label htmlFor="filterDestino">Destino</label>
                <input 
                  type="text" 
                  id="filterDestino" 
                  className={styles.textInput}
                  placeholder="Digite o destino..."
                  value={filtroDestino}
                  onChange={(e) => setFiltroDestino(e.target.value)}
                />
              </div>

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
              Mostrando {startIndex + 1} a {Math.min(endIndex, totalItems)} de {totalItems} viagens
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
              <th className={styles.tableHead}>Motorista</th>
              <th className={styles.tableHead}>Data</th>
              <th className={styles.tableHead}>Período</th>
              <th className={styles.tableHead}>Origem</th>
              <th className={styles.tableHead}>Destino</th>
              <th className={styles.tableHead}>Total Horas</th>
              <th className={styles.tableHead}>Total KM</th>
              <th className={styles.tableHead} style={{ textAlign: 'center' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {viagensPaginadas.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.emptyState}>
                  <div className={styles.emptyStateContent}>
                    <AlertTriangle size={48} className={styles.emptyStateIcon} />
                    <h3>Nenhuma viagem encontrada</h3>
                    <p>
                      {viagensDisplay.length === 0 
                        ? 'Não há viagens cadastradas no sistema.' 
                        : 'Tente ajustar os filtros para encontrar as viagens desejadas.'
                      }
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              viagensPaginadas.map((viagem) => (
                <tr key={viagem.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <strong>{viagem.veiculo}</strong>
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      {viagem.motorista}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <Calendar size={16} className={styles.cellIcon} />
                      {viagem.data}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.periodoBadge} ${styles[`periodo${viagem.periodo?.replace('ã', 'a')?.replace('ñ', 'n')}`]}`}>
                      <Clock size={14} />
                      {viagem.periodo}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <MapPin size={16} className={styles.cellIcon} />
                      {viagem.origem}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <MapPin size={16} className={styles.cellIcon} />
                      {viagem.destino}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <Clock size={16} className={styles.cellIcon} />
                      {viagem.totalHoras}
                    </div>
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.cellContent}>
                      <strong>{viagem.totalKm} km</strong>
                    </div>
                  </td>
                  <td className={styles.tableCell} style={{ textAlign: 'center' }}>
                    <div className={styles.actions}>
                      <button 
                        className={styles.editButton} 
                        onClick={() => handleOpenEditModal(viagem.id)}
                        title="Editar viagem"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        className={styles.dangerButton} 
                        onClick={() => handleOpenDeleteModal(viagem.id)}
                        title="Excluir viagem"
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
                Tem certeza de que deseja excluir esta viagem?
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
      {isEditModalOpen && viagemToEdit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent + ' ' + styles.editModalContent}>
            <div className={styles.modalHeader}>
              <div className={styles.modalIcon}>
                <Edit3 size={24} className={styles.editIcon} />
              </div>
              <h3 className={styles.modalTitle}>Editar Viagem</h3>
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
                    <label htmlFor="editDescricao">Descrição</label>
                    <input
                      type="text"
                      id="editDescricao"
                      className={styles.formInput}
                      value={editFormData.descricao}
                      onChange={(e) => handleEditFormChange('descricao', e.target.value)}
                      placeholder="Descrição da viagem"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editVeiculo">Veículo</label>
                    <select
                      id="editVeiculo"
                      className={styles.formSelect}
                      value={editFormData.veiculo}
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
                    <label htmlFor="editMotorista">Motorista</label>
                    <select
                      id="editMotorista"
                      className={styles.formSelect}
                      value={editFormData.motorista}
                      onChange={(e) => handleEditFormChange('motorista', Number(e.target.value))}
                    >
                      <option value={0}>Selecione um motorista</option>
                      {motoristas.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editOrigem">Origem</label>
                    <input
                      type="text"
                      id="editOrigem"
                      className={styles.formInput}
                      value={editFormData.origem}
                      onChange={(e) => handleEditFormChange('origem', e.target.value)}
                      placeholder="Local de origem"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editDestino">Destino</label>
                    <input
                      type="text"
                      id="editDestino"
                      className={styles.formInput}
                      value={editFormData.destino}
                      onChange={(e) => handleEditFormChange('destino', e.target.value)}
                      placeholder="Local de destino"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editDataInicio">Data e Hora de Início</label>
                    <input
                      type="datetime-local"
                      id="editDataInicio"
                      className={styles.formInput}
                      value={editFormData.data_inicio}
                      onChange={(e) => handleEditFormChange('data_inicio', e.target.value)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editDataTermino">Data e Hora de Término</label>
                    <input
                      type="datetime-local"
                      id="editDataTermino"
                      className={styles.formInput}
                      value={editFormData.data_termino || ''}
                      onChange={(e) => handleEditFormChange('data_termino', e.target.value || undefined)}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editKmInicial">Quilometragem Inicial</label>
                    <input
                      type="number"
                      id="editKmInicial"
                      className={styles.formInput}
                      value={editFormData.quilometragem_inicial}
                      onChange={(e) => handleEditFormChange('quilometragem_inicial', Number(e.target.value))}
                      min="0"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="editKmFinal">Quilometragem Final</label>
                    <input
                      type="number"
                      id="editKmFinal"
                      className={styles.formInput}
                      value={editFormData.quilometragem_final || ''}
                      onChange={(e) => handleEditFormChange('quilometragem_final', e.target.value ? Number(e.target.value) : undefined)}
                      min={editFormData.quilometragem_inicial}
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

export default Visualizar_Viagem;