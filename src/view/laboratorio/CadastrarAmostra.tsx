import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { TestTubeDiagonal, ClipboardPen } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
// Ícones simples usando SVG
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);



// Interface para definir uma amostra
interface Amostra {
  id: number;
  numero: string;
  horaColeta: string;
  identificacao: string;
  temperatura: string;
  complemento: string;
  condicoesAmbientais: string;
  itemOrcamento: string;
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






export const CadastrarAmostra: React.FC = () => {
  const [activeTab, setActiveTab] = useState('cadastro');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedConsultor, setSelectedConsultor] = useState('');
  const [startDate, setStartDate] = useState('');
  const [collectDate, setCollectDate] = useState('');
  const [labEntryDate, setLabEntryDate] = useState('');
  const [collector, setCollector] = useState('Cliente');
  const [collectorName, setCollectorName] = useState('');
  const [samplingProcedure, setSamplingProcedure] = useState('');
  const [category, setCategory] = useState('Padrão');
  const [companion, setCompanion] = useState('');
  const [budget, setBudget] = useState(false);
  const [samplingData, setSamplingData] = useState(false);
  const [qualityControl, setQualityControl] = useState(false);
  const [flow, setFlow] = useState('');
  const [flowUnit, setFlowUnit] = useState('m³/hora');
  const [vazaoClient, setVazaoClient] = useState(false);
  const [solicitante, setSolicitante] = useState('');
  const [emailSolicitante, setEmailSolicitante] = useState('');
  const [methodologies, setMethodologies] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClienteObj, setSelectedClienteObj] = useState<Cliente | null>(null);
  
  // Ref para controlar cliques fora do dropdown
  const searchRef = useRef<HTMLDivElement>(null);


  // Estados para gerenciar múltiplas amostras
  const [amostras, setAmostras] = useState<Amostra[]>([
    {
      id: 1,
      numero: '',
      horaColeta: '',
      identificacao: '',
      temperatura: '',
      complemento: '',
      condicoesAmbientais: '',
      itemOrcamento: ''
    }
  ]);
  const [activeAmostraTab, setActiveAmostraTab] = useState(1);
  
  // Estado para controlar a aba lateral da seção de amostras
  const [activeSampleSidebarTab, setActiveSampleSidebarTab] = useState('dados');

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    },
    mainContent: {
      marginLeft: sidebarExpanded ? '200px' : '60px',
      padding: '24px',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100vh'
    },
    maxWidth: {
      maxWidth: '1400px',
      margin: '0 auto'
    },
    pageTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    tabIndicator: {
      padding: '6px 12px',
      backgroundColor: '#16a34a',
      color: 'white',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500'
    },
    mainCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px',
      marginBottom: '16px'
    },
    sampleContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      padding: '24px'
    },
    // Estilos para as abas das amostras
    sampleTabsContainer: {
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '16px'
    },
    sampleTabsList: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center'
    },
    sampleTab: {
      padding: '8px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      borderRadius: '6px 6px 0 0',
      fontSize: '12px',
      fontWeight: '500',
      color: '#6b7280',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    sampleTabActive: {
      backgroundColor: '#16a34a',
      color: 'white'
    },
    sampleTabInactive: {
      backgroundColor: '#f3f4f6',
      color: '#374151'
    },
    addSampleButton: {
      padding: '6px 12px',
      backgroundColor: '#16a34a',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '11px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      transition: 'background-color 0.2s'
    },
    removeSampleButton: {
      height: '1px',
      backgroundColor: '#dc2626',
      color: 'white',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    // Novos estilos para a aba lateral da seção de amostras
    sampleContentWithSidebar: {
      display: 'flex',
      gap: '0',
      minHeight: '400px'
    },
    sampleSidebar: {
      width: '55px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column' as const,
      borderRadius: '10px'
      
    },
    sampleSidebarTab: {
      padding: '12px 16px',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      textAlign: 'left' as const,
      borderBottom: '1px solid #e5e7eb',
      transition: 'all 0.2s',
        borderRadius: '10px'
    },
    sampleSidebarTabActive: {
      backgroundColor: '#16a34a',
      color: 'white'
    },
    sampleSidebarTabInactive: {
      backgroundColor: 'transparent',
      color: '#374151'
    },
    sampleMainContent: {
      flex: 1,
      padding: '16px',
      backgroundColor: 'white'
    },
    grid12: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '8px',
      marginBottom: '12px'
    },
    col2: { gridColumn: 'span 2' },
    col3: { gridColumn: 'span 3' },
    col4: { gridColumn: 'span 4' },
    col6: { gridColumn: 'span 6' },
    label: {
      display: 'block',
      fontSize: '10px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '2px'
    },
    input: {
      width: '100%',
      padding: '3px 6px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '11px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box' as const
    },
    inputFocus: {
      borderColor: '#16a34a',
      boxShadow: '0 0 0 3px rgba(22, 163, 74, 0.1)'
    },
    select: {
      width: '100%',
      padding: '3px 6px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '11px',
      backgroundColor: 'white',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box' as const
    },
    primaryButton: {
      backgroundColor: '#16a34a',
      color: 'white',
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '10px',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    secondaryButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '4px 8px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '10px',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    iconButton: {
      padding: '4px',
      color: '#16a34a',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    greenIconButton: {
      padding: '4px',
      backgroundColor: '#16a34a',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background-color 0.2s'
    },
    flexRow: {
      display: 'flex',
      gap: '4px',
      alignItems: 'center'
    },
    flexRowJustify: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    checkbox: {
      width: '12px',
      height: '12px',
      accentColor: '#16a34a',
      cursor: 'pointer'
    },
    radio: {
      width: '12px',
      height: '12px',
      accentColor: '#16a34a',
      cursor: 'pointer',
      marginRight: '4px'
    },
    textarea: {
      width: '100%',
      padding: '3px 6px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '11px',
      outline: 'none',
      resize: 'vertical' as const,
      minHeight: '32px',
      fontFamily: 'inherit',
      boxSizing: 'border-box' as const
    },
    sampleCard: {
      backgroundColor: '#f9fafb',
      padding: '8px',
      borderRadius: '8px',
      border: '1px solid #e5e7eb'
    },
    noClientSelected: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginTop: '8px',
      color: '#3b82f6',
      fontSize: '12px'
    },
    obsText: {
      fontSize: '12px',
      color: '#6b7280',
      marginTop: '8px'
    },
    buttonGroup: {
      display: 'flex',
      gap: '4px'
    },
        searchContainer: {
      position: 'relative' as const,
      flex: 1
    },
    searchInputWrapper: {
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center'
    },
    searchInput: {
      width: '100%',
      padding: '3px 6px 3px 24px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '11px',
      outline: 'none',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxSizing: 'border-box' as const
    },
    searchInputIcon: {
      position: 'absolute' as const,
      left: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6b7280',
      pointerEvents: 'none' as const,
      width: '12px',
      height: '12px'
    },
    clearButton: {
      position: 'absolute' as const,
      right: '6px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#6b7280',
      padding: '2px',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    dropdown: {
      position: 'absolute' as const,
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '200px',
      overflowY: 'auto' as const,
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    dropdownItem: {
      padding: '8px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '11px',
      transition: 'background-color 0.2s'
    },
    dropdownItemHover: {
      backgroundColor: '#f9fafb'
    },
    dropdownItemLoading: {
      padding: '8px 12px',
      fontSize: '11px',
      color: '#6b7280',
      textAlign: 'center' as const
    },
    clienteInfo: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '2px'
    },
    clienteName: {
      fontWeight: '500',
      color: '#374151'
    },
    clienteDetails: {
      display: 'flex',
      gap: '8px',
      fontSize: '10px',
      color: '#6b7280'
    },
    documento: {
      color: '#6b7280'
    },
    location: {
      color: '#6b7280'
    }
  };
 

    function handleClienteSelect(cliente: Cliente) {
    setSelectedClienteObj(cliente);
    setSelectedClient(cliente.fantasia || cliente.razao || '');
    setShowDropdown(false);
    setSearchResults([]);
  }
  async function buscarClientesDropdown(query: string): Promise<Cliente[]> {
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
  }
  // Funções para gerenciar amostras
    const handleClientSearchChange = async (value: string) => {
    setSelectedClient(value);
    
    if (value.trim().length >= 2) {
      setIsSearching(true);
      try {
        const results = await buscarClientesDropdown(value);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (error) {
        console.error('Erro na busca:', error);
        setSearchResults([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
      setSelectedClienteObj(null);
    }
  };

  // Função para limpar a busca
  const handleClearSearch = () => {
    setSelectedClient('');
    setSelectedClienteObj(null);
    setSearchResults([]);
    setShowDropdown(false);
  };

  // Função para formatar documento (CPF/CNPJ)
  const formatDocument = (doc: string) => {
    if (!doc) return '';
    const numbers = doc.replace(/\D/g, '');
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (numbers.length === 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return doc;
  };
  const adicionarAmostra = () => {
    const novaAmostra: Amostra = {
      id: Math.max(...amostras.map(a => a.id)) + 1,
      numero: '',
      horaColeta: '',
      identificacao: '',
      temperatura: '',
      complemento: '',
      condicoesAmbientais: '',
      itemOrcamento: ''
    };
    setAmostras([...amostras, novaAmostra]);
    setActiveAmostraTab(novaAmostra.id);
  };

  const removerAmostra = (id: number) => {
    if (amostras.length > 1) {
      const novasAmostras = amostras.filter(a => a.id !== id);
      setAmostras(novasAmostras);
      
      // Se a aba ativa foi removida, selecionar a primeira disponível
      if (activeAmostraTab === id) {
        setActiveAmostraTab(novasAmostras[0].id);
      }
    }
  };

  const atualizarAmostra = (id: number, campo: keyof Amostra, valor: string) => {
    setAmostras(amostras.map(amostra => 
      amostra.id === id ? { ...amostra, [campo]: valor } : amostra
    ));
  };

  const limparAmostra = (id: number) => {
    setAmostras(amostras.map(amostra => 
      amostra.id === id ? {
        ...amostra,
        numero: '',
        horaColeta: '',
        identificacao: '',
        temperatura: '',
        complemento: '',
        condicoesAmbientais: '',
        itemOrcamento: ''
      } : amostra
    ));
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#16a34a';
    e.target.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.1)';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    e.target.style.borderColor = '#d1d5db';
    e.target.style.boxShadow = 'none';
  };

  const handleButtonHover = (e: React.MouseEvent<HTMLButtonElement>, isHover: boolean) => {
    const button = e.target as HTMLButtonElement;
    if (button.style.backgroundColor === 'rgb(22, 163, 74)' || button.style.backgroundColor === '#16a34a') {
      button.style.backgroundColor = isHover ? '#15803d' : '#16a34a';
    } else if (button.style.backgroundColor === 'rgb(220, 38, 38)' || button.style.backgroundColor === '#dc2626') {
      button.style.backgroundColor = isHover ? '#b91c1c' : '#dc2626';
    } else if (button.style.backgroundColor === 'transparent') {
      button.style.backgroundColor = isHover ? '#f0fdf4' : 'transparent';
    }
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const renderCadastroContent = () => (
    <div style={styles.mainCard}>
      {/* Top Section */}
      <div style={styles.grid12}>
        <div style={styles.col2}>
          <label style={styles.label}>Relatório de ensaios</label>
          <select 
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option>1 amostra por relatório</option>
          </select>
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Acreditação</label>
          <select 
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option>CGCRE 2021</option>
          </select>
        </div>
        <div style={styles.col4}></div>
        <div style={{...styles.col4, ...styles.buttonGroup}}>
          <button 
            style={{...styles.primaryButton, flex: 1}}
            onMouseEnter={(e) => handleButtonHover(e, true)}
            onMouseLeave={(e) => handleButtonHover(e, false)}
          >
            Copiar
          </button>
          <button 
            style={{...styles.primaryButton, flex: 1}}
            onMouseEnter={(e) => handleButtonHover(e, true)}
            onMouseLeave={(e) => handleButtonHover(e, false)}
          >
            Coleta
          </button>
          <button 
            style={{...styles.primaryButton, flex: 1}}
            onMouseEnter={(e) => handleButtonHover(e, true)}
            onMouseLeave={(e) => handleButtonHover(e, false)}
          >
            Selecionar parâmetros
          </button>
        </div>
      </div>

      {/* Client Section */}
      <div style={styles.grid12}>
        <div style={styles.col6}>
          <label style={styles.label}>Cliente</label>
          <div style={styles.flexRow}>
                     <div style={styles.searchContainer} ref={searchRef}>
              <div style={styles.searchInputWrapper}>
        
                <input
                  type="text"
                  value={selectedClient}
                  onChange={(e) => handleClientSearchChange(e.target.value)}
                  style={styles.searchInput}
                  placeholder="Digite o nome do cliente"
                  onFocus={(e) => {
                    handleInputFocus(e);
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  onBlur={handleInputBlur}
                />
                {selectedClient && (
                  <button 
                    style={styles.clearButton}
                    onClick={handleClearSearch}
                    title="Limpar busca"
                  >
                    <XIcon />
                  </button>
                )}
              </div>

              {showDropdown && (
                <div style={styles.dropdown}>
                  {isSearching ? (
                    <div style={styles.dropdownItemLoading}>
                      Buscando...
                    </div>
                  ) : (
                    searchResults.map((cliente) => (
                      <div 
                        key={cliente.id} 
                        style={styles.dropdownItem}
                        onClick={() => handleClienteSelect(cliente)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f9fafb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={styles.clienteInfo}>
                          <div style={styles.clienteName}>
                            {cliente.fantasia || cliente.razao || 'Nome não informado'}
                          </div>
                          <div style={styles.clienteDetails}>
                            {cliente.documento && (
                              <span style={styles.documento}>{formatDocument(cliente.documento)}</span>
                            )}
                            {cliente.cidade && cliente.uf && (
                              <span style={styles.location}>{cliente.cidade} / {cliente.uf}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
                       <button 
              style={styles.iconButton}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
              onClick={() => {
                // Função para abrir modal de busca avançada ou similar
                console.log('Busca avançada de clientes');
              }}
            >
              <SearchIcon />
            </button>
          </div>
         {!selectedClienteObj && (
            <div style={styles.noClientSelected}>
              <XIcon />
              <span>Nenhum cliente selecionado</span>
            </div>
          )}
        </div>
        <div style={styles.col3}>
          <label style={styles.label}>Consultor:</label>
          <div style={styles.flexRow}>
            <select
              value={selectedConsultor}
              onChange={(e) => setSelectedConsultor(e.target.value)}
              style={{...styles.select, flex: 1}}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            >
              <option value="">Selecione</option>
            </select>
            <button 
              style={styles.greenIconButton}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              <PlusIcon />
            </button>
            <button 
              style={styles.iconButton}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              <SearchIcon />
            </button>
          </div>
        </div>
        <div style={styles.col3}>
          <label style={styles.label}>Status do consultor:</label>
          <div style={{fontSize: '14px', color: '#6b7280', paddingTop: '8px'}}>-</div>
        </div>
      </div>

      {/* Dates and Collection Info */}
      <div style={styles.grid12}>
        <div style={styles.col2}>
          <label style={styles.label}>Início da amostragem</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Data da coleta</label>
          <input
            type="date"
            value={collectDate}
            onChange={(e) => setCollectDate(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Data de entrada no lab.</label>
          <input
            type="date"
            value={labEntryDate}
            onChange={(e) => setLabEntryDate(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <div style={styles.col3}>
          <label style={styles.label}>Solicitante:</label>
          <input
            type="text"
            value={solicitante}
            onChange={(e) => setSolicitante(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <div style={styles.col3}>
          <label style={styles.label}>E-mail do Solicitante:</label>
          <input
            type="email"
            value={emailSolicitante}
            onChange={(e) => setEmailSolicitante(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
      </div>

      {/* Collection Details */}
      <div style={styles.grid12}>
        <div style={styles.col2}>
          <label style={styles.label}>Coletado por</label>
          <select
            value={collector}
            onChange={(e) => setCollector(e.target.value)}
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option>Cliente</option>
            <option>Laboratório</option>
          </select>
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Procedimento de amostragem</label>
          <select
            value={samplingProcedure}
            onChange={(e) => setSamplingProcedure(e.target.value)}
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">Selecione</option>
          </select>
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Nome do coletor</label>
          <input
            type="text"
            value={collectorName}
            onChange={(e) => setCollectorName(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Categoria</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option>Padrão</option>
          </select>
        </div>
      </div>

      {/* Companion and Budget Section */}
      <div style={styles.grid12}>
        <div style={styles.col2}>
          <label style={styles.label}>Acompanhante</label>
          <input
            type="text"
            value={companion}
            onChange={(e) => setCompanion(e.target.value)}
            style={styles.input}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
        <div style={styles.col2}>
          <label style={styles.label}>Orçamento</label>
          <div style={{display: 'flex', gap: '16px', paddingTop: '8px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="radio"
                name="budget"
                checked={!budget}
                onChange={() => setBudget(false)}
                style={styles.radio}
              />
              Não
            </label>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="radio"
                name="budget"
                checked={budget}
                onChange={() => setBudget(true)}
                style={styles.radio}
              />
              Sim
            </label>
          </div>
        </div>
        <div style={styles.col2}>
          <div style={{paddingTop: '24px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={samplingData}
                onChange={(e) => setSamplingData(e.target.checked)}
                style={{...styles.checkbox, marginRight: '8px'}}
              />
              Dados de amostragem
            </label>
          </div>
        </div>
        <div style={styles.col2}>
          <div style={{paddingTop: '24px'}}>
            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={qualityControl}
                onChange={(e) => setQualityControl(e.target.checked)}
                style={{...styles.checkbox, marginRight: '8px'}}
              />
              Controle de qualidade
            </label>
          </div>
        </div>
        <div style={styles.col4}>
          <div style={{paddingTop: '24px'}}>
            <button 
              style={styles.primaryButton}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              Abrir
            </button>
          </div>
        </div>
      </div>

      {/* Flow Section */}
      <div style={styles.grid12}>
        <div style={styles.col2}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
            <input
              type="checkbox"
              checked={vazaoClient}
              onChange={(e) => setVazaoClient(e.target.checked)}
              style={styles.checkbox}
            />
            <label style={styles.label}>Vazão (cliente)</label>
          </div>
          <div style={styles.flexRow}>
            <input
              type="text"
              value={flow}
              onChange={(e) => setFlow(e.target.value)}
              style={{...styles.input, flex: 1}}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
            <select
              value={flowUnit}
              onChange={(e) => setFlowUnit(e.target.value)}
              style={styles.select}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            >
              <option>m³/hora</option>
              <option>L/min</option>
            </select>
          </div>
        </div>
      </div>

      {/* Methodologies Section */}
      <div style={{marginBottom: '24px'}}>
        <div style={styles.flexRowJustify}>
          <label style={styles.label}>Metodologias</label>
          <div style={styles.buttonGroup}>
            <button 
              style={styles.primaryButton}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              Incluir
            </button>
            <button 
              style={styles.secondaryButton}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              Remover
            </button>
          </div>
        </div>
        <textarea
          value={methodologies}
          onChange={(e) => setMethodologies(e.target.value)}
          style={styles.textarea}
          placeholder="Digite as metodologias..."
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'cadastro':
        return renderCadastroContent();
      case 'setores':
        return (
          <div style={styles.mainCard}>
            <h2>Gestão de Setores</h2>
            <p>Conteúdo da aba Setores será implementado aqui.</p>
          </div>
        );
      case 'terceirizacao':
        return (
          <div style={styles.mainCard}>
            <h2>Terceirização</h2>
            <p>Conteúdo da aba Terceirização será implementado aqui.</p>
          </div>
        );
      default:
        return renderCadastroContent();
    }
  };

  // Função para renderizar o conteúdo da aba "Dados"
  const renderDadosContent = () => {
    const amostraAtiva = amostras.find(a => a.id === activeAmostraTab);
    
    if (!amostraAtiva) return null;

    return (
      <div>
        <div style={{fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '16px'}}>
          Amostra {amostraAtiva.id}
        </div>
        
        <div style={styles.grid12}>
          <div style={styles.col6}>
            <label style={styles.label}>Número</label>
            <input
              type="text"
              value={amostraAtiva.numero}
              onChange={(e) => atualizarAmostra(amostraAtiva.id, 'numero', e.target.value)}
              style={styles.input}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
          <div style={styles.col6}>
            <label style={styles.label}>Hora da coleta</label>
            <div style={styles.flexRow}>
              <input
                type="time"
                value={amostraAtiva.horaColeta}
                onChange={(e) => atualizarAmostra(amostraAtiva.id, 'horaColeta', e.target.value)}
                style={{...styles.input, flex: 1}}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
              <button 
                style={styles.primaryButton}
                onClick={() => limparAmostra(amostraAtiva.id)}
                onMouseEnter={(e) => handleButtonHover(e, true)}
                onMouseLeave={(e) => handleButtonHover(e, false)}
              >
                limpar amostra
              </button>
            </div>
          </div>
        </div>

        <div style={{...styles.grid12, marginTop: '16px'}}>
          <div style={styles.col6}>
            <label style={styles.label}>Identificação</label>
            <select
              value={amostraAtiva.identificacao}
              onChange={(e) => atualizarAmostra(amostraAtiva.id, 'identificacao', e.target.value)}
              style={styles.select}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            >
              <option value="">Selecione</option>
            </select>
          </div>
          <div style={styles.col6}>
            <label style={styles.label}>Temperatura</label>
            <input
              type="text"
              value={amostraAtiva.temperatura}
              onChange={(e) => atualizarAmostra(amostraAtiva.id, 'temperatura', e.target.value)}
              style={styles.input}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </div>

        <div style={{...styles.grid12, marginTop: '16px'}}>
          <div>
            <label style={styles.label}>Complemento</label>
            <textarea
              value={amostraAtiva.complemento}
              onChange={(e) => atualizarAmostra(amostraAtiva.id, 'complemento', e.target.value)}
              style={styles.textarea}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </div>

        <div style={{...styles.grid12, marginTop: '16px'}}>
          <div>
            <label style={styles.label}>Condições ambientais</label>
            <input
              type="text"
              value={amostraAtiva.condicoesAmbientais}
              onChange={(e) => atualizarAmostra(amostraAtiva.id, 'condicoesAmbientais', e.target.value)}
              style={styles.input}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
            />
          </div>
        </div>

        <div style={{marginTop: '16px'}}>
          <label style={styles.label}>Item do orçamento</label>
          <select
            value={amostraAtiva.itemOrcamento}
            onChange={(e) => atualizarAmostra(amostraAtiva.id, 'itemOrcamento', e.target.value)}
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">Selecione</option>
          </select>
        </div>
      </div>
    );
  };

  // Função para renderizar o conteúdo da aba "Parâmetros"
  const renderParametrosContent = () => {
    return (
      <div>
        <div style={{fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '16px'}}>
          Parâmetros da Amostra
        </div>
        
        <div style={{padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center'}}>
          <p style={{color: '#6b7280', margin: 0}}>
            Conteúdo dos parâmetros será implementado aqui.
          </p>
          <p style={{color: '#6b7280', margin: '8px 0 0 0', fontSize: '12px'}}>
            Esta seção pode incluir configurações de análise, métodos de teste, etc.
          </p>
        </div>
      </div>
    );
  };

  const renderSampleSection = () => {
    return (
      <div style={styles.sampleContainer}>
        {/* Abas das Amostras */}
        <div style={styles.sampleTabsContainer}>
          <div style={styles.sampleTabsList}>
            {amostras.map((amostra) => (
              <button
                key={amostra.id}
                style={{
                  ...styles.sampleTab,
                  ...(activeAmostraTab === amostra.id ? styles.sampleTabActive : styles.sampleTabInactive)
                }}
                onClick={() => setActiveAmostraTab(amostra.id)}
                onMouseEnter={(e) => {
                  if (activeAmostraTab !== amostra.id) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#e5e7eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeAmostraTab !== amostra.id) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                  }
                }}
              >
                <span>Amostra {amostra.id}</span>
                {amostras.length > 1 && (
                  <button
                    style={styles.removeSampleButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removerAmostra(amostra.id);
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#b91c1c';
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626';
                    }}
                  >
                    <XIcon />
                  </button>
                )}
              </button>
            ))}
            <button
              style={styles.addSampleButton}
              onClick={adicionarAmostra}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#15803d';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.backgroundColor = '#16a34a';
              }}
            >
              <PlusIcon />
              <span>Adicionar Amostra</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Aba Lateral */}
        <div style={styles.sampleContentWithSidebar}>
          {/* Aba Lateral */}
          <div style={styles.sampleSidebar}>
            <button
              style={{
                ...styles.sampleSidebarTab,
                ...(activeSampleSidebarTab === 'dados' ? styles.sampleSidebarTabActive : styles.sampleSidebarTabInactive)
              }}
              onClick={() => setActiveSampleSidebarTab('dados')}
              onMouseEnter={(e) => {
                if (activeSampleSidebarTab !== 'dados') {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSampleSidebarTab !== 'dados') {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }
              }}
            >
                 <ClipboardPen />
            </button>
            <button
              style={{
                ...styles.sampleSidebarTab,
                ...(activeSampleSidebarTab === 'parametros' ? styles.sampleSidebarTabActive : styles.sampleSidebarTabInactive)
              }}
              onClick={() => setActiveSampleSidebarTab('parametros')}
              onMouseEnter={(e) => {
                if (activeSampleSidebarTab !== 'parametros') {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSampleSidebarTab !== 'parametros') {
                  (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                }
              }}
            >
                <TestTubeDiagonal />
            </button>
          </div>

          {/* Conteúdo Principal */}
          <div style={styles.sampleMainContent}>
            {activeSampleSidebarTab === 'dados' && renderDadosContent()}
            {activeSampleSidebarTab === 'parametros' && renderParametrosContent()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onSidebarToggle={setSidebarExpanded}
      />
      
      <div style={styles.mainContent}>
        <div style={styles.maxWidth}>
          {/* Main Content */}
          {renderContent()}
          
          {/* Sample Section - Agora com sistema de abas laterais */}
          {renderSampleSection()}
        </div>
      </div>
    </div>
  );
};

export default CadastrarAmostra;
