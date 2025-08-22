import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Calendar, MapPin, FileText, User, Hash, Beaker, RotateCcw, Printer, Download, Eye, Loader, AlertCircle, Edit, ExternalLink, ChevronLeft, ChevronRight, Mail, MoreHorizontal, X, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import './styles/VisualizarStyle.css';

// Estrutura do resultado da amostra, baseada no backend Rust
interface AmostraResult {
  analise?: number;
  idgrupo?: number;
  cliente_cod?: number;
  numero_amostras?: string;
  relatorio?: string;
  cert: string;
  cert_versao?: number;
  sigla: string;
  numero: string;
  fantasia: string;
  identificacao?: string;
  complemento?: string;
  datalab?: string;
  horalab?: string;
  versao?: string;
  numero_versao?: number;
  status: string;
  protocolo_cliente?: string;
  ano: string;
  mes: string;
  terceirizada_emitido?: boolean;
}

interface Cliente {
  id: number;
  fantasia?: string;
  razao?: string;
  documento?: string;
  cidade?: string;
  uf?: string;
  categoria?: string;
  consultor?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

interface ClienteResponse {
  success: boolean;
  data?: Cliente[];
  message?: string;
  total?: number;
}

interface DadosClienteResponse {
  solicitantes: any[];
  orcamentos: any[];
  setor_portal: any[];
}

// Interface dos filtros do frontend
interface Filters {
  cliente: string;
  amostra: string;
  amostraInicio: string;
  amostraFim: string;
  entrada: string;
  entradaFim: string;
  coletadoPor: string;
  protocoloCliente: boolean;
  protocolo: string;
  consultor: string;
  cidade: string;
  identificacao: string;
  relatorio: string;
  primeiraVersao: boolean;
  legislacao: string;
  pop: string;
  parametro: string;
  terceirizacao: string;
  laboratorio: string;
}

// Estrutura do payload para o backend Rust
interface FiltrosAmostraPayload {
  cliente: string | null;
  numero_amostra_ini: string | null;
  numero_amostra_fin: string | null;
  protocolo: string | null;
  primeira_versao: boolean | null;
  sigla: string | null;
  data_pesq1: string | null;
  data_pesq2: string | null;
  consultor_id: number | null;
  legislacao_id: number | null;
  cidade: string | null;
  pop_codigo: string | null;
  parametro_id: number | null;
  identificacao: string | null;
  terceirizacao: number | null;
  laboratorio_terceirizado_id: number | null;
  coletado_por: string | null;
}

// Tipos para ordenação
type SortColumn = 'amostra' | 'cliente' | 'status' | 'datalab' | 'identificacao';
type SortDirection = 'asc' | 'desc';

export const VisualizarAmostra = () => {
  const [searchMode, setSearchMode] = useState<'simples' | 'avancado'>('simples');
  const [filters, setFilters] = useState<Filters>({
    cliente: '',
    amostra: '',
    amostraInicio: '',
    amostraFim: '',
    entrada: '',
    entradaFim: '',
    coletadoPor: '',
    protocoloCliente: false,
    protocolo: '',
    consultor: '',
    cidade: '',
    identificacao: '',
    relatorio: '',
    primeiraVersao: false,
    legislacao: '',
    pop: '',
    parametro: '',
    terceirizacao: '',
    laboratorio: ''
  });

  // Estados para ordenação
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedClienteObj, setSelectedClienteObj] = useState<Cliente | null>(null);
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [solicitantes, setSolicitantes] = useState<any[]>([]);
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [anoFiltro, setAnoFiltro] = useState<string>('');

  // Refs para controle do dropdown
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Estados para gerenciar o resultado da busca
  const [results, setResults] = useState<AmostraResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para paginação progressiva
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [visibleTabsStart, setVisibleTabsStart] = useState<number>(0);
  const itemsPerPage = 50;
  const maxVisibleTabs = 10;

  const handleInputChange = (field: keyof Filters, value: string | boolean): void => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para lidar com ordenação
  const handleSort = (column: SortColumn): void => {
    if (sortColumn === column) {
      // Se já está ordenando por esta coluna, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se é uma nova coluna, define como ascendente
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Função para ordenar os resultados
  const sortResults = (data: AmostraResult[]): AmostraResult[] => {
    if (!sortColumn) return data;

    return [...data].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortColumn) {
        case 'amostra':
          valueA = `${a.sigla}${a.numero}`;
          valueB = `${b.sigla}${b.numero}`;
          break;
        case 'cliente':
          valueA = a.fantasia || '';
          valueB = b.fantasia || '';
          break;
        case 'status':
          valueA = a.numero_amostras != null ? 'Emitido' : '';
          valueB = b.numero_amostras != null ? 'Emitido' : '';
          break;
        case 'datalab':
          // Para datas, convertemos para timestamp para comparação numérica
          valueA = a.datalab ? new Date(a.datalab).getTime() : 0;
          valueB = b.datalab ? new Date(b.datalab).getTime() : 0;
          break;
        case 'identificacao':
          valueA = a.identificacao || '';
          valueB = b.identificacao || '';
          break;
        default:
          return 0;
      }

      // Comparação
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        const comparison = valueA.localeCompare(valueB);
        return sortDirection === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (valueA as number) - (valueB as number);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
    });
  };

  const handleSearch = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    setResults([]);

    // Mapeamentos de exemplo (substituir pelos IDs reais do banco de dados)
    const consultorMap: { [key: string]: number } = { 'consultor1': 1, 'consultor2': 2 };
    const legislacaoMap: { [key: string]: number } = { 'conama': 1, 'cetesb': 2, 'portaria': 3 };
    const parametroMap: { [key: string]: number } = { 'ph': 101, 'turbidez': 102, 'coliformes': 103 };
    const laboratorioMap: { [key: string]: number } = { 'lab1': 1, 'lab2': 2, 'lab3': 3 };
    const terceirizacaoMap: { [key: string]: number } = { 'nao': 1, 'sim': 2 }; // Conforme struct: 1=não, 2=sim

    // Transforma o estado dos filtros do frontend para o payload esperado pelo backend
    const payload: FiltrosAmostraPayload = {
      cliente: filters.cliente || null,
      sigla: filters.amostra || null,
      numero_amostra_ini: filters.amostraInicio || null,
      numero_amostra_fin: filters.amostraFim || null,
      data_pesq1: filters.entrada || null,
      data_pesq2: filters.entradaFim || null,
      coletado_por: filters.coletadoPor || null,
      protocolo: filters.protocolo || null,
      consultor_id: consultorMap[filters.consultor] || null,
      cidade: filters.cidade || null,
      identificacao: filters.identificacao || null,
      primeira_versao: filters.primeiraVersao,
      legislacao_id: legislacaoMap[filters.legislacao] || null,
      pop_codigo: filters.pop.startsWith('POP-') ? filters.pop : null, // Exemplo simples de parsing
      parametro_id: parametroMap[filters.parametro] || null,
      terceirizacao: terceirizacaoMap[filters.terceirizacao] || null,
      laboratorio_terceirizado_id: laboratorioMap[filters.laboratorio] || null,
    };

    try {
      // Invoca o comando 'buscar_amostras' do backend Rust
      const response = await invoke<{ success: boolean; data?: AmostraResult[]; message?: string }>(
        'buscar_amostras',
        { dataType: payload } // O objeto é encapsulado conforme a assinatura da função Rust
      );

      if (response.success && response.data) {
        setResults(response.data);
        // Reset pagination when new results arrive
        setCurrentPage(0);
        setVisibleTabsStart(0);
      } else {
        setError(response.message || 'Ocorreu um erro desconhecido na busca.');
      }
    } catch (err) {
      console.error('Erro ao invocar o backend:', err);
      setError(typeof err === 'string' ? err : 'Falha na comunicação com o backend.');
    } finally {
      setLoading(false);
    }
  };

  const formatDocument = (doc: string): string => {
    if (!doc) return '';
    const cleanDoc = doc.replace(/\D/g, '');
    
    if (cleanDoc.length === 11) {
      // CPF
      return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (cleanDoc.length === 14) {
      // CNPJ
      return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    return doc;
  };

  // Função para buscar clientes no dropdown
  const buscarClientesDropdown = async (query: string): Promise<Cliente[]> => {
    try {
      const response: ClienteResponse = await invoke('buscar_clientes_dropdown', {
        query: query.trim()
      });

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Erro na busca dropdown:', error);
      return [];
    }
  };

  // Handler para mudanças na busca de cliente
  const handleClientSearchChange = async (value: string) => {
    setSelectedClient(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const clientes = await buscarClientesDropdown(value);
          setSearchResults(clientes);
        } catch (error) {
          console.error('Erro na busca de clientes:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setShowDropdown(false);
      setSearchResults([]);
    }
  };

  // Handler para seleção de cliente
  const handleClienteSelect = async (cliente: Cliente) => {
    try {
      setSelectedClienteObj(cliente);
      setSelectedClient(cliente.fantasia || cliente.razao || '');
      setShowDropdown(false);
      setSearchResults([]);

      // Atualiza o filtro de cliente
      setFilters(prev => ({
        ...prev,
        cliente: cliente.fantasia || cliente.razao || ''
      }));

      const dadosCliente: DadosClienteResponse = await invoke('buscar_dados_cliente', {
        clienteId: cliente.id,
      });

      setSolicitantes(dadosCliente.solicitantes);
      setOrcamentos(dadosCliente.orcamentos);
      setSetores(dadosCliente.setor_portal);

      // Limpar seleções anteriores
      handleClearSolicitanteSearch();
      setAnoFiltro('');

    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
      setSolicitantes([]);
      setOrcamentos([]);
      setSetores([]);
    }
  };

  // Handler para limpar busca de cliente
  const handleClearSearch = () => {
    setSelectedClient('');
    setSelectedClienteObj(null);
    setShowDropdown(false);
    setSearchResults([]);
    setFilters(prev => ({
      ...prev,
      cliente: ''
    }));
  };

  // Handler para limpar busca de solicitante (placeholder)
  const handleClearSolicitanteSearch = () => {
    // Implementar limpeza de solicitante se necessário
  };

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleClear = (): void => {
    setFilters({
      cliente: '',
      amostra: '',
      amostraInicio: '',
      amostraFim: '',
      entrada: '',
      entradaFim: '',
      coletadoPor: '',
      protocoloCliente: false,
      protocolo: '',
      consultor: '',
      cidade: '',
      identificacao: '',
      relatorio: '',
      primeiraVersao: false,
      legislacao: '',
      pop: '',
      parametro: '',
      terceirizacao: '',
      laboratorio: ''
    });
    setResults([]);
    handleClearSearch();
    setError(null);
    setCurrentPage(0);
    setVisibleTabsStart(0);
    // Limpar ordenação
    setSortColumn(null);
    setSortDirection('asc');
  };

  // Funções auxiliares para paginação
  const getTotalPages = (): number => {
    return Math.ceil(results.length / itemsPerPage);
  };

  const getCurrentPageItems = (): AmostraResult[] => {
    const sortedResults = sortResults(results);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedResults.slice(startIndex, endIndex);
  };

  // Função para navegar para uma página específica
  const handlePageChange = (pageIndex: number): void => {
    setCurrentPage(pageIndex);
    
    // Ajustar as abas visíveis se necessário
    const totalPages = getTotalPages();
    if (totalPages > maxVisibleTabs) {
      // Se a página selecionada está fora do range visível, ajustar
      if (pageIndex < visibleTabsStart) {
        setVisibleTabsStart(Math.max(0, pageIndex - Math.floor(maxVisibleTabs / 2)));
      } else if (pageIndex >= visibleTabsStart + maxVisibleTabs) {
        setVisibleTabsStart(Math.min(totalPages - maxVisibleTabs, pageIndex - Math.floor(maxVisibleTabs / 2)));
      }
    }
  };

  // Função para navegar as abas visíveis para a esquerda
  const handleTabsNavigateLeft = (): void => {
    setVisibleTabsStart(Math.max(0, visibleTabsStart - maxVisibleTabs));
  };

  // Função para navegar as abas visíveis para a direita
  const handleTabsNavigateRight = (): void => {
    const totalPages = getTotalPages();
    setVisibleTabsStart(Math.min(totalPages - maxVisibleTabs, visibleTabsStart + maxVisibleTabs));
  };

  // Função para obter as abas visíveis
  const getVisibleTabs = (): number[] => {
    const totalPages = getTotalPages();
    if (totalPages <= maxVisibleTabs) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    
    const endIndex = Math.min(visibleTabsStart + maxVisibleTabs, totalPages);
    return Array.from({ length: endIndex - visibleTabsStart }, (_, i) => visibleTabsStart + i);
  };

  // Funções para ações das amostras
  const handleViewSample = (amostra: AmostraResult): void => {
    console.log('Visualizar amostra:', amostra);
    // Implementar lógica de visualização
  };

  const handleEditSample = (amostra: AmostraResult): void => {
    console.log('Editar amostra:', amostra);
    // Implementar lógica de edição
  };

  const handleOpenPDF = (amostra: AmostraResult): void => {
    console.log('Abrir PDF da amostra:', amostra);
    // Implementar lógica para abrir PDF
  };

  const handleEmailSample = (amostra: AmostraResult): void => {
    console.log('Enviar e-mail da amostra:', amostra);
    // Implementar lógica para enviar e-mail
  };

  // Função para renderizar ícone de ordenação
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return null;
    }
    return sortDirection === 'asc' ? 
      <ChevronUp className="sortIcon" /> : 
      <ChevronDown className="sortIcon" />;
  };

  const dropdownStyles = {
    flexRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      width: '100%'
    },
    searchContainer: {
      position: 'relative' as const,
      flex: 1
    },
    searchInputWrapper: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      width: '100%'
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px 8px 36px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      backgroundColor: 'white'
    },
    searchInputIcon: {
      position: 'absolute' as const,
      left: '12px',
      zIndex: 1,
      color: '#6b7280',
      width: '16px',
      height: '16px'
    },
    clearButton: {
      position: 'absolute' as const,
      right: '8px',
      padding: '4px',
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      transition: 'color 0.2s'
    },
    iconButton: {
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      background: 'white',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s'
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      maxHeight: '300px',
      overflowY: 'auto' as const,
      zIndex: 1000,
      marginTop: '2px'
    },
    dropdownItem: {
      padding: '12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f4f6',
      transition: 'background-color 0.2s'
    },
    clienteName: {
      fontWeight: '500',
      color: '#111827',
      marginBottom: '4px'
    },
    clienteDetails: {
      fontSize: '12px',
      color: '#6b7280',
      display: 'flex',
      gap: '12px'
    }
  };

  const renderResults = () => {
    if (loading) {
      return (
        <div className="noResultsContainer">
          <Loader className="noResultsIcon animate-spin-custom" />
          <p className="noResultsTitle">Buscando...</p>
          <p className="noResultsSubtitle">Aguarde enquanto processamos sua solicitação.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="noResultsContainer">
          <AlertCircle className="noResultsIcon text-red-500" />
          <p className="noResultsTitle">Erro na Busca</p>
          <p className="noResultsSubtitle">{error}</p>
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="noResultsContainer">
          <Eye className="noResultsIcon" />
          <p className="noResultsTitle">Nenhuma amostra encontrada</p>
          <p className="noResultsSubtitle">Utilize os filtros acima para pesquisar amostras.</p>
        </div>
      );
    }

    const totalPages = getTotalPages();
    const currentItems = getCurrentPageItems();
    const visibleTabs = getVisibleTabs();

    return (
      <div className="resultsContainer">
        {/* Sistema de Abas Progressivo */}
        {totalPages > 1 && (
          <div className="paginationTabs">
            <div className="progressiveTabsContainer">
              {/* Botão para navegar abas para a esquerda */}
              {visibleTabsStart > 0 && (
                <button
                  onClick={handleTabsNavigateLeft}
                  className="tabNavigationButton tabNavigationLeft"
                  title="Páginas anteriores"
                >
                  <ChevronLeft className="tabNavigationIcon" />
                  <MoreHorizontal className="tabNavigationIcon" />
                </button>
              )}

              {/* Abas visíveis */}
              <div className="tabsContainer">
                {visibleTabs.map((pageIndex) => (
                  <button
                    key={pageIndex}
                    onClick={() => handlePageChange(pageIndex)}
                    className={`paginationTab ${currentPage === pageIndex ? 'paginationTabActive' : 'paginationTabInactive'}`}
                  >
                    {pageIndex + 1}
                  </button>
                ))}
              </div>

              {/* Botão para navegar abas para a direita */}
              {visibleTabsStart + maxVisibleTabs < totalPages && (
                <button
                  onClick={handleTabsNavigateRight}
                  className="tabNavigationButton tabNavigationRight"
                  title="Próximas páginas"
                >
                  <MoreHorizontal className="tabNavigationIcon" />
                  <ChevronRight className="tabNavigationIcon" />
                </button>
              )}
            </div>

            <div className="paginationInfo">
              Página {currentPage + 1} de {totalPages} ({results.length} amostras)
            </div>
          </div>
        )}

        {/* Tabela de Resultados com Barra de Rolagem */}
        <div className="resultsTableContainer">
          <div className="resultsTable">
            <div className="tableHeader">
              <div 
                className="tableHeaderCell sortableHeader" 
                onClick={() => handleSort('amostra')}
                title="Clique para ordenar por amostra"
              >
                Amostra
                {renderSortIcon('amostra')}
              </div>
              <div 
                className="tableHeaderCell sortableHeader" 
                onClick={() => handleSort('cliente')}
                title="Clique para ordenar por cliente"
              >
                Cliente
                {renderSortIcon('cliente')}
              </div>
              <div 
                className="tableHeaderCell sortableHeader" 
                onClick={() => handleSort('status')}
                title="Clique para ordenar por status"
              >
                Status
                {renderSortIcon('status')}
              </div>
              <div 
                className="tableHeaderCell sortableHeader" 
                onClick={() => handleSort('datalab')}
                title="Clique para ordenar por data (mais recente primeiro)"
              >
                Data Lab
                {renderSortIcon('datalab')}
              </div>
              <div 
                className="tableHeaderCell sortableHeader" 
                onClick={() => handleSort('identificacao')}
                title="Clique para ordenar por identificação"
              >
                Identificação
                {renderSortIcon('identificacao')}
              </div>
              <div className="tableHeaderCell">Ações</div>
            </div>
            
            <div className="tableBody">
              {currentItems.map((amostra, index) => (
                <div key={index} className="tableRow">
                  <div className="tableCell">
                    <span className="sampleNumber">{amostra.sigla}{amostra.numero}</span>
                    {amostra.cert_versao && (
                      <span className="sampleVersion">v{amostra.cert_versao}</span>
                    )}
                  </div>
                  <div className="tableCell">
                    <span className="clientName">{amostra.fantasia}</span>
                  </div>
                  <div className="tableCell">
                   <span className={`statusBadge status${amostra.numero_amostras}`}>
  {amostra.numero_amostras != null ? 'Emitido' : ''}
</span>
                  </div>
                  <div className="tableCell">
                    <span className="dateText">{amostra.datalab}</span>
                    {amostra.horalab && (
                      <span className="timeText">{amostra.horalab}</span>
                    )}
                  </div>
                  <div className="tableCell">
                    <span className="identificationText">{amostra.identificacao || '-'}</span>
                  </div>
                  <div className="tableCell">
                    <div className="actionButtons">
                      <button
                        onClick={() => handleViewSample(amostra)}
                        className="actionButton actionButtonView"
                        title="Visualizar amostra"
                      >
                        <Eye className="actionIcon" />
                      </button>
                      <button
                        onClick={() => handleEditSample(amostra)}
                        className="actionButton actionButtonEdit"
                        title="Editar amostra"
                      >
                        <Edit className="actionIcon" />
                      </button>
                      <button
                        onClick={() => handleOpenPDF(amostra)}
                        className="actionButton actionButtonPdf"
                        title="Abrir PDF"
                      >
                        <FileText className="actionIcon" />
                      </button>
                      <button
                        onClick={() => handleEmailSample(amostra)}
                        className="actionButton actionButtonEmail"
                        title="Enviar por e-mail"
                      >
                        <Mail className="actionIcon" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navegação de Páginas (Setas) - Mantida para navegação rápida */}
        {totalPages > 1 && (
          <div className="paginationNavigation">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="paginationButton paginationButtonPrev"
            >
              <ChevronLeft className="paginationIcon" />
              Anterior
            </button>
            <span className="paginationCurrent">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="paginationButton paginationButtonNext"
            >
              Próxima
              <ChevronRight className="paginationIcon" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container">
      <div className="scrollableContainer">
        <div className="maxWidth">

          {/* Search Mode Toggle */}
          <div className="searchModeToggle">
            <div className="toggleContainer">
              <button
                onClick={() => setSearchMode('simples')}
                className={`toggleButton ${
                  searchMode === 'simples' ? 'toggleButtonActive' : 'toggleButtonInactive'
                }`}
              >
                <Search className="toggleIcon" />
                Pesquisa Simples
              </button>
              <button
                onClick={() => setSearchMode('avancado')}
                className={`toggleButton ${
                  searchMode === 'avancado' ? 'toggleButtonActive' : 'toggleButtonInactive'
                }`}
              >
                <Filter className="toggleIcon" />
                Pesquisa Avançada
              </button>
            </div>
          </div>

        {/* Search Form */}
        <div className="formCard">
          {searchMode === 'simples' ? (
            /* Pesquisa Simples */
            <div className="spacingY4">
              <div className="gridSimples">
               <div className="fieldGroup">
                    <label className="fieldLabel">
                      <User className="fieldIcon" />
                      Cliente
                    </label>
                    <div style={dropdownStyles.flexRow}>
                      <div style={dropdownStyles.searchContainer} ref={searchRef}>
                        <div style={dropdownStyles.searchInputWrapper}>
                        
                          <input 
                            type="text" 
                            value={selectedClient} 
                            onChange={(e) => handleClientSearchChange(e.target.value)} 
                            className="fieldInput"
                            placeholder="Digite o nome, CNPJ/CPF ou cidade"
                          />
                          {selectedClient && (
                            <button 
                              style={dropdownStyles.clearButton} 
                              onClick={handleClearSearch}
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        {showDropdown && (
                          <div style={dropdownStyles.dropdown}>
                            {isSearching ? (
                              <div style={dropdownStyles.dropdownItem}>Buscando...</div>
                            ) : (
                              searchResults.map((cliente) => (
                                <div 
                                  key={cliente.id} 
                                  style={dropdownStyles.dropdownItem} 
                                  onClick={() => handleClienteSelect(cliente)}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')} 
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                                >
                                  <div style={dropdownStyles.clienteName}>
                                    {cliente.fantasia || cliente.razao}
                                  </div>
                                  <div style={dropdownStyles.clienteDetails}>
                                    <span>{formatDocument(cliente.documento || '')}</span>
                                    <span>{cliente.cidade} / {cliente.uf}</span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                      
                    </div>
                  </div>
                
                <div className="fieldGroup">
                  <label className="fieldLabel">
                    <Hash className="fieldIcon" />
                    Número da Amostra
                  </label>
                  <input
                    type="text"
                    value={filters.amostra}
                    onChange={(e) => handleInputChange('amostra', e.target.value)}
                    className="fieldInput"
                    placeholder="Ex: A123456"
                  />
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">
                    Período de Amostras
                  </label>
                  <div className="rangeContainer">
                    <input
                      type="text"
                      value={filters.amostraInicio}
                      onChange={(e) => handleInputChange('amostraInicio', e.target.value)}
                      className="rangeInput"
                      placeholder="Início"
                    />
                    <input
                      type="text"
                      value={filters.amostraFim}
                      onChange={(e) => handleInputChange('amostraFim', e.target.value)}
                      className="rangeInput"
                      placeholder="Fim"
                    />
                  </div>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">
                    <Calendar className="fieldIcon" />
                    Período de Entrada
                  </label>
                  <div className="rangeContainer">
                    <input
                      type="date"
                      value={filters.entrada}
                      onChange={(e) => handleInputChange('entrada', e.target.value)}
                      className="rangeInput"
                    />
                    <input
                      type="date"
                      value={filters.entradaFim}
                      onChange={(e) => handleInputChange('entradaFim', e.target.value)}
                      className="rangeInput"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Pesquisa Avançada */
            <div className="spacingY4">
              {/* Linha 1 */}
              <div className="gridAvancado1">
                <div className="fieldGroup">
                  <label className="fieldLabel">
                    <User className="fieldIcon" />
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={filters.cliente}
                    onChange={(e) => handleInputChange('cliente', e.target.value)}
                    className="fieldInput"
                    placeholder="Nome do cliente"
                  />
                </div>
                
                <div className="fieldGroup">
                  <label className="fieldLabel">
                    <Hash className="fieldIcon" />
                    Amostra
                  </label>
                  <div className="sampleContainer">
                    <input
                      type="text"
                      value={filters.amostra}
                      onChange={(e) => handleInputChange('amostra', e.target.value)}
                      className="samplePrefix"
                      placeholder="de"
                    />
                    <input
                      type="text"
                      value={filters.amostraInicio}
                      onChange={(e) => handleInputChange('amostraInicio', e.target.value)}
                      className="sampleInput"
                      placeholder="1"
                    />
                    <span className="rangeSeparator">até</span>
                    <input
                      type="text"
                      value={filters.amostraFim}
                      onChange={(e) => handleInputChange('amostraFim', e.target.value)}
                      className="sampleInput"
                      placeholder="999999"
                    />
                  </div>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">Coletado por</label>
                  <input
                    type="text"
                    value={filters.coletadoPor}
                    onChange={(e) => handleInputChange('coletadoPor', e.target.value)}
                    className="fieldInput"
                    placeholder="Nome do coletor"
                  />
                </div>

                <div className="complexFieldGroup">
                  <label className="fieldLabel">Protocolo</label>
                  <div className="protocolContainer">
                    <div className="checkboxContainer">
                      <input
                        type="checkbox"
                        checked={filters.protocoloCliente}
                        onChange={(e) => handleInputChange('protocoloCliente', e.target.checked)}
                        className="checkbox"
                        id="protocoloCliente"
                      />
                      <label htmlFor="protocoloCliente" className="checkboxLabel">
                        Cliente
                      </label>
                    </div>
                    <input
                      type="text"
                      value={filters.protocolo}
                      onChange={(e) => handleInputChange('protocolo', e.target.value)}
                      className="protocolInput"
                      placeholder="Número do protocolo"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 2 */}
              <div className="gridAvancado1">
                <div className="fieldGroup">
                  <label className="fieldLabel">Consultor</label>
                  <select
                    value={filters.consultor}
                    onChange={(e) => handleInputChange('consultor', e.target.value)}
                    className="fieldSelect"
                  >
                    <option value="">Selecionar consultor...</option>
                    <option value="consultor1">João Silva</option>
                    <option value="consultor2">Maria Santos</option>
                  </select>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">
                    <MapPin className="fieldIcon" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={filters.cidade}
                    onChange={(e) => handleInputChange('cidade', e.target.value)}
                    className="fieldInput"
                    placeholder="Nome da cidade"
                  />
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">Entrada</label>
                  <div className="rangeContainer">
                    <input
                      type="date"
                      value={filters.entrada}
                      onChange={(e) => handleInputChange('entrada', e.target.value)}
                      className="rangeInput"
                    />
                    <input
                      type="date"
                      value={filters.entradaFim}
                      onChange={(e) => handleInputChange('entradaFim', e.target.value)}
                      className="rangeInput"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 3 */}
              <div className="gridAvancado1">
                <div className="fieldGroup">
                  <label className="fieldLabel">Identificação</label>
                  <input
                    type="text"
                    value={filters.identificacao}
                    onChange={(e) => handleInputChange('identificacao', e.target.value)}
                    className="fieldInput"
                    placeholder="ID da amostra"
                  />
                </div>

                <div className="complexFieldGroup">
                  <label className="fieldLabel">
                    <FileText className="fieldIcon" />
                    Relatório
                  </label>
                  <select
                    value={filters.relatorio}
                    onChange={(e) => handleInputChange('relatorio', e.target.value)}
                    className="fieldSelect"
                  >
                    <option value="">Selecionar...</option>
                    <option value="completo">Relatório Completo</option>
                    <option value="resumido">Relatório Resumido</option>
                  </select>
                  <div className="checkboxContainer">
                    <input
                      type="checkbox"
                      checked={filters.primeiraVersao}
                      onChange={(e) => handleInputChange('primeiraVersao', e.target.checked)}
                      className="checkbox"
                      id="primeiraVersao"
                    />
                    <label htmlFor="primeiraVersao" className="checkboxLabel">
                      Primeira versão
                    </label>
                  </div>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">Legislação</label>
                  <select
                    value={filters.legislacao}
                    onChange={(e) => handleInputChange('legislacao', e.target.value)}
                    className="fieldSelect"
                  >
                    <option value="">Selecionar...</option>
                    <option value="conama">CONAMA</option>
                    <option value="cetesb">CETESB</option>
                    <option value="portaria">Portaria MS</option>
                  </select>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">POP</label>
                  <div className="dualSelectContainer">
                    <select
                      value={filters.pop}
                      onChange={(e) => handleInputChange('pop', e.target.value)}
                      className="dualSelect"
                    >
                      <option value="">Selecionar...</option>
                      <option value="pop1">POP-001</option>
                      <option value="pop2">POP-002</option>
                    </select>
                    <select className="dualSelect">
                      <option value="">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Linha 4 */}
              <div className="gridAvancado2">
                <div className="fieldGroup">
                  <label className="fieldLabel">
                    <Beaker className="fieldIcon" />
                    Parâmetro
                  </label>
                  <select
                    value={filters.parametro}
                    onChange={(e) => handleInputChange('parametro', e.target.value)}
                    className="fieldSelect"
                  >
                    <option value="">Selecionar parâmetro...</option>
                    <option value="ph">pH</option>
                    <option value="turbidez">Turbidez</option>
                    <option value="coliformes">Coliformes</option>
                  </select>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">Terceirização</label>
                  <select
                    value={filters.terceirizacao}
                    onChange={(e) => handleInputChange('terceirizacao', e.target.value)}
                    className="fieldSelect"
                  >
                    <option value="">Selecionar...</option>
                    <option value="sim">Sim</option>
                    <option value="nao">Não</option>
                  </select>
                </div>

                <div className="fieldGroup">
                  <label className="fieldLabel">Laboratório</label>
                  <select
                    value={filters.laboratorio}
                    onChange={(e) => handleInputChange('laboratorio', e.target.value)}
                    className="fieldSelect"
                  >
                    <option value="">Selecionar laboratório...</option>
                    <option value="lab1">Laboratório Central</option>
                    <option value="lab2">Laboratório Norte</option>
                    <option value="lab3">Laboratório Sul</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="actionButtonsContainer">
            <div className="actionButtonsLeft">
              <button onClick={handleClear} className="buttonSecondary">
                <RotateCcw className="buttonIcon" />
                Limpar
              </button>
              
              <button onClick={handleSearch} className="buttonPrimary" disabled={loading}>
                {loading ? <Loader className="buttonIcon animate-spin" /> : <Search className="buttonIcon" />}
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>

            <div className="actionButtonsRight">
              <button className="buttonGreen">
                <FileText className="buttonIcon" />
                Gerar controle de qualidade
              </button>
              
              <button className="buttonGreen">
                <Printer className="buttonIcon" />
                Imprimir
              </button>
              
              <button className="buttonGreen">
                <Download className="buttonIcon" />
                Gerar dados de amostragem
              </button>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="resultsCard">
          <div className="resultsHeader">
            <h2 className="resultsTitle">Resultados da Pesquisa</h2>
            <p className="resultsSubtitle">{results.length} amostras encontradas</p>
          </div>
          
          <div className="resultsContent">
            {renderResults()}
          </div>
        </div>
      </div>
        </div>
    </div>
  );
};

export default VisualizarAmostra;
