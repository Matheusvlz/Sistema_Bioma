import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './Sidebar';
import { TestTubeDiagonal, ClipboardPen, Plus, Search, X, RefreshCcw, ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { invoke } from "@tauri-apps/api/core";
import { ParametrosSelector } from './ParametrosSelector';
// Ícones simples usando SVG
const PlusIcon = () => <Plus size={14} />;
const SearchIcon = () => <Search size={14} />;
const XIcon = () => <X size={14} />;

// Interface para definir uma amostra
interface Amostra {
  id: number;
  numero: string;
  horaColeta: string;
  identificacao: string;
  temperatura: string;
  complemento: string;
  condicoesAmbientais: string;
  itemOrcamento: number | null;
  // NOVO: Estado de parâmetros específico para cada amostra
  parametrosDisponiveis: Parametro[];
  parametrosSelecionados: Parametro[];
  checkedDisponiveis: number[];
  checkedSelecionados: number[];
}

interface CustomSelectProps<T> {
  options: T[];
  value: string;
  onChange: (value: string, item?: T) => void;
  placeholder?: string;
  displayKey: keyof T;
  valueKey?: keyof T;
  label?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

// Componente CustomSelect reutilizável
function CustomSelect<T extends Record<string, any>>({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  displayKey,
  valueKey,
  label,
  style,
  disabled = false
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrar opções baseado na busca
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(option => 
      String(option[displayKey]).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery, displayKey]);

  // Atualizar o valor de exibição quando o valor selecionado mudar
  useEffect(() => {
    if (value) {
      const selectedOption = options.find(option => 
        String(valueKey ? option[valueKey] : option[displayKey]) === value
      );
      if (selectedOption) {
        setDisplayValue(String(selectedOption[displayKey]));
        setSearchQuery(String(selectedOption[displayKey]));
      }
    } else {
      setDisplayValue('');
      setSearchQuery('');
    }
  }, [value, options, displayKey, valueKey]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // Restaurar o valor de exibição se não houver seleção válida
        if (value) {
          const selectedOption = options.find(option => 
            String(valueKey ? option[valueKey] : option[displayKey]) === value
          );
          if (selectedOption) {
            setSearchQuery(String(selectedOption[displayKey]));
          }
        } else {
          setSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options, displayKey, valueKey]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleOptionSelect = (option: T) => {
    const selectedValue = String(valueKey ? option[valueKey] : option[displayKey]);
    onChange(selectedValue, option);
    setIsOpen(false);
    setSearchQuery(String(option[displayKey]));
    setDisplayValue(String(option[displayKey]));
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const customSelectStyles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'relative',
      width: '100%',
      ...style
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px',
    },
    inputContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    input: {
      width: '100%',
      height: '32px',
      padding: '0 32px 0 8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      outline: 'none',
      backgroundColor: disabled ? '#f9fafb' : 'white',
      cursor: disabled ? 'not-allowed' : 'text',
      transition: 'all 0.2s ease'
    },
    inputFocused: {
      borderColor: '#059669',
      boxShadow: '0 0 0 1px #059669'
    },
    chevron: {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
      pointerEvents: 'none',
      transition: 'transform 0.2s ease'
    },
    chevronOpen: {
      transform: 'translateY(-50%) rotate(180deg)'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    option: {
      padding: '8px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '12px',
      transition: 'background-color 0.2s ease'
    },
    optionHover: {
      backgroundColor: '#f8fafc'
    },
    optionSelected: {
      backgroundColor: '#059669',
      color: 'white'
    },
    noOptions: {
      padding: '8px 12px',
      fontSize: '12px',
      color: '#64748b',
      fontStyle: 'italic'
    }
  };

  return (
    <div ref={containerRef} style={customSelectStyles.container}>
      {label && <label style={customSelectStyles.label}>{label}</label>}
      <div style={customSelectStyles.inputContainer}>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            ...customSelectStyles.input,
            ...(isOpen ? customSelectStyles.inputFocused : {})
          }}
        />
        <ChevronDown 
          size={16} 
          style={{
            ...customSelectStyles.chevron,
            ...(isOpen ? customSelectStyles.chevronOpen : {})
          }}
        />
      </div>
      
      {isOpen && !disabled && (
        <div style={customSelectStyles.dropdown}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const optionValue = String(valueKey ? option[valueKey] : option[displayKey]);
              const isSelected = optionValue === value;
              
              return (
                <div
                  key={index}
                  style={{
                    ...customSelectStyles.option,
                    ...(isSelected ? customSelectStyles.optionSelected : {})
                  }}
                  onClick={() => handleOptionSelect(option)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {String(option[displayKey])}
                </div>
              );
            })
          ) : (
            <div style={customSelectStyles.noOptions}>
              Nenhuma opção encontrada
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export interface ParametroResponse {
  success: boolean;
  data?: Parametro[]; // corresponde ao Option<Vec<Parametro>>
  message?: string;   // corresponde ao Option<String>
}

export interface Parametro {
  id: number;
  nome: string;
  id_parametro: number;
  grupo: string;

  tecnica_nome: string;
  unidade: string;
  parametro_pop: number;
  limite: string;
  certificado_pag?: number; // Option<u32>
  codigo: string;
  numero: string;
  revisao: string;
  objetivo: string;
  idtecnica: number;
  n1: number;
  n2: number;
  n3: number;
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

interface Categoria {
  id: number;
  nome: string;
}

interface Identificacao {
  id: number;
  id1: string;
}

interface ClienteResponse {
  success: boolean;
  data?: Cliente[];
  message?: string;
  total?: number;
}

// Interface ajustada para garantir que o email esteja disponível
interface SolicitanteComEmail {
  id: number;
  nome: string;
  usuario: string;
  cliente_id?: number;
  cliente_nome?: string;
}

interface OrcamentoItem {
  id_item: number;
  descricao: string;
  sequencia: number;
}

interface OrcamentoComItens {
  id: number;
  nome: string;
  ano: number;
  itens: OrcamentoItem[];
}

// Interface atualizada para os dados do cliente
interface DadosClienteResponse {
  orcamentos: OrcamentoComItens[];
  solicitantes: SolicitanteComEmail[];
  setor_portal: Categoria[];
}

export const CadastrarAmostra: React.FC = () => {
  const getCurrentDate = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Função utilitária para obter hora atual no formato HH:MM
const getCurrentTime = (): string => {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
};

  const [activeTab, setActiveTab] = useState('cadastro');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedConsultor, setSelectedConsultor] = useState('');
  const [startDate, setStartDate] = useState(getCurrentDate());
  const [collectDate, setCollectDate] = useState(getCurrentDate());
  const [labEntryDate, setLabEntryDate] = useState(getCurrentDate());
   const [selectedIdentificacao, setSelectedIdentificacao] = useState('');
  const [collector, setCollector] = useState('Cliente');
  const [collectorName, setCollectorName] = useState('');
  const [samplingProcedure, setSamplingProcedure] = useState('');
  const [category, setCategory] = useState('');
  const [companion, setCompanion] = useState('');
  const [budget, setBudget] = useState(false);
  const [samplingData, setSamplingData] = useState(false);
  const [qualityControl, setQualityControl] = useState(false);
  const [flow, setFlow] = useState('');
  const [flowUnit, setFlowUnit] = useState('m³/hora');
  const [vazaoClient, setVazaoClient] = useState(false);
  const [emailSolicitante, setEmailSolicitante] = useState('');
  const [methodologies, setMethodologies] = useState('');
  const [searchResults, setSearchResults] = useState<Cliente[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClienteObj, setSelectedClienteObj] = useState<Cliente | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [acreditacoes, setAcreditacoes] = useState<Categoria[]>([]);
  const [metodologiasList, setMetodologiasList] = useState<Categoria[]>([]);
  const [legislacoes, setLegislacoes] = useState<Categoria[]>([]);
  const [identificacoes, setIdentificacoes] = useState<Identificacao[]>([]);
  const [terceirizados, setTerceirizados] = useState<Categoria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
   const [pgs, setPg] = useState<Categoria[]>([]);
  const [relatorios, setRelatorios] = useState<Categoria[]>([]);
  const [consultores, setConsultores] = useState<Categoria[]>([]);
  const [solicitantes, setSolicitantes] = useState<SolicitanteComEmail[]>([]);
  const [setores, setSetores] = useState<Categoria[]>([]);
  const [orcamentos, setOrcamentos] = useState<OrcamentoComItens[]>([]);
    const [orcamentoItems, setOrcamentoItems] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAcreditacao, setSelectedAcreditacao] = useState('');
  const [selectedLegislacao, setSelectedLegislacao] = useState('');
  const [selectedTerceirizado, setSelectedTerceirizado] = useState('');
  const [selectedOrcamento, setSelectedOrcamento] = useState('');
    const metodologiaRef = useRef<HTMLDivElement>(null);
  // --- NOVO ESTADO PARA O FILTRO DE ANO DO ORÇAMENTO ---
  const [anoFiltro, setAnoFiltro] = useState('');
   const [isOpen, setIsOpen] = useState(false);
  const [solicitanteSearchQuery, setSolicitanteSearchQuery] = useState('');
  const [showSolicitanteDropdown, setShowSolicitanteDropdown] = useState(false);
  const [selectedSolicitanteObj, setSelectedSolicitanteObj] = useState<SolicitanteComEmail | null>(null);
    const [setoresSelecionados, setSetoresSelecionados] = useState<Categoria[]>([]);
  const [amostraTerceirizada, setAmostraTerceirizada] = useState(false);
  const [tipoAnalise, setTipoAnalise] = useState('total');
  const [laboratorio, setLaboratorio] = useState('Biomade Soluções Biotecnológicas');


const [unidadeAmostraValue, setUnidadeAmostraValue] = useState('');
const [formaDeColetaValue, setFormaDeColetaValue] = useState('');
const [unidadeAreaAmostradaValue, setUnidadeAreaAmostradaValue] = useState('');
const [areaAmostradaValue, setAreaAmostradaValue] = useState('');
  // REMOVIDO: Estado global de parâmetros.
  // NOVO: Estado para a lista de parâmetros base, carregada da legislação.
  const [parametrosBase, setParametrosBase] = useState<Parametro[]>([]);

  const searchRef = useRef<HTMLDivElement>(null);
  const solicitanteSearchRef = useRef<HTMLDivElement>(null);
  const [sameTimeForAllSamples, setSameTimeForAllSamples] = useState(false);
  const [showMethodologiesDropdown, setShowMethodologiesDropdown] = useState(false);
  const [selectedMethodologies, setSelectedMethodologies] = useState<Categoria[]>([]);
  const [metodologiaSearchQuery, setMetodologiaSearchQuery] = useState('');
  const [selectedAvailable, setSelectedAvailable] = useState<number[]>([]);
  const [selectedChosen, setSelectedChosen] = useState<number[]>([]);
  const [showSetoresDropdown, setShowSetoresDropdown] = useState(false);
  const [selectedSetores, setSelectedSetores] = useState<Categoria[]>([]);
  const [setorSearchQuery, setSetorSearchQuery] = useState('');
  const setorRef = useRef<HTMLDivElement>(null);
  // Add these to your component's state declarations
  const [startTime, setStartTime] = useState(getCurrentTime());
  const [collectTime, setCollectTime] = useState(getCurrentTime());
  const [labEntryTime, setLabEntryTime] = useState(getCurrentTime());
  
  const [selectedReportType, setSelectedReportType] = useState<number>();
  // Estado das amostras, agora cada uma com seu próprio estado de parâmetros
  const [amostras, setAmostras] = useState<Amostra[]>([
    {
      id: 1,
      numero: '',
       horaColeta: getCurrentTime(),
      identificacao: '',
      temperatura: '',
      complemento: '',
      condicoesAmbientais: '',
      itemOrcamento: null,
      // Estado de parâmetros inicial
      parametrosDisponiveis: [],
      parametrosSelecionados: [],
      checkedDisponiveis: [],
      checkedSelecionados: [],
    }
  ]);


  const [principioAtivo, setPrincipioAtivo] = useState('');
const [produtoAnterior, setProdutoAnterior] = useState('');
const [lote, setLote] = useState('');
const [agenteLimpeza, setAgenteLimpeza] = useState('');
const [dataLimpeza, setDataLimpeza] = useState('');
const [momentoLimpeza, setMomentoLimpeza] = useState('');
const [tempoDecorrido, setTempoDecorrido] = useState('');
const [unidadeTempoDecorrido, setUnidadeTempoDecorrido] = useState('minutos');

// Estados para campos condicionais IN 60
const [protocoloCliente, setProtocoloCliente] = useState('');
const [remessaCliente, setRemessaCliente] = useState('');


  const [ showErrorModal, setShowErrorModal] = useState<boolean>(false);
    const [ showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [activeAmostraTab, setActiveAmostraTab] = useState(1);
  
  const [activeSampleSidebarTab, setActiveSampleSidebarTab] = useState('dados');

    useEffect(() => {
    if (!loading && categorias.length > 0 && !category) {
      setCategory(categorias[0].nome);
    }
  }, [loading, categorias, category]);

  useEffect(() => {
    if (!loading && acreditacoes.length > 0 && !selectedAcreditacao) {
      setSelectedAcreditacao(acreditacoes[0].nome);
    }
  }, [loading, acreditacoes, selectedAcreditacao]);

  useEffect(() => {
    if (!loading && legislacoes.length > 0 && !selectedLegislacao) {
      setSelectedLegislacao(legislacoes[0].nome);
      // Também carrega os parâmetros da primeira legislação
    }
  }, [loading, legislacoes, selectedLegislacao]);

  useEffect(() => {
    if (!loading && terceirizados.length > 0 && !selectedTerceirizado) {
      setSelectedTerceirizado(terceirizados[0].nome);
    }
  }, [loading, terceirizados, selectedTerceirizado]);

  useEffect(() => {
    if (!loading && consultores.length > 0 && !selectedConsultor) {
      setSelectedConsultor(consultores[0].nome);
    }
  }, [loading, consultores, selectedConsultor]);

  useEffect(() => {
    if (!loading && relatorios.length > 0 && selectedReportType === undefined) {
      setSelectedReportType(relatorios[0].id);
    }
  }, [loading, relatorios, selectedReportType]);


  // --- LÓGICA PARA EXTRAIR ANOS ÚNICOS E FILTRAR ORÇAMENTOS ---
  const availableYears = useMemo(() => {
    const years = new Set(orcamentos.map(o => o.ano));
    return Array.from(years).sort((a, b) => b - a); // Ordena do mais recente para o mais antigo
  }, [orcamentos]);

  const filteredOrcamentos = useMemo(() => {
    if (!anoFiltro) {
      return orcamentos;
    }
    return orcamentos.filter(o => o.ano.toString() === anoFiltro);
  }, [orcamentos, anoFiltro]);

  const handleAddMetodologia = (metodologia: Categoria) => {
    setSelectedMethodologies(prev => {
      const isAlreadySelected = prev.some(m => m.id === metodologia.id);
      if (isAlreadySelected) {
        // Remove se já estiver selecionado
        return prev.filter(m => m.id !== metodologia.id);
      } else {
        // Adiciona se não estiver selecionado
        return [...prev, metodologia];
      }
    });
  };

    const handleClearAllMethodologies = () => {
    setSelectedMethodologies([]);
    setMetodologiaSearchQuery('');
  };

  // Filtrar metodologias baseado na busca
  const filteredMethodologies = useMemo(() => {
    return metodologiasList.filter(m => 
      m.nome.toLowerCase().includes(metodologiaSearchQuery.toLowerCase())
    );
  }, [metodologiasList, metodologiaSearchQuery]);


   const handleAvailableClick = (id: number) => {
    setSelectedAvailable(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleChosenClick = (id: number) => {
    setSelectedChosen(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

    const shouldShowLimpeza = useMemo(() => {
    return selectedReportType === 3;
  }, [selectedReportType]);

  const adicionarSetores = () => {
    const setoresParaAdicionar = setores.filter(setor => 
      selectedAvailable.includes(setor.id)
    );
    
    setSetoresSelecionados(prev => [...prev, ...setoresParaAdicionar]);
    setSelectedAvailable([]);
  };

  const removerSetores = () => {
    setSetoresSelecionados(prev => 
      prev.filter(setor => !selectedChosen.includes(setor.id))
    );
    setSelectedChosen([]);
  };

  const setoresNaoSelecionados = setores.filter(setor => 
    !setoresSelecionados.some(sel => sel.id === setor.id)
  );



  const handleRemoveMetodologia = (id: number) => {
    setSelectedMethodologies(prev => prev.filter(m => m.id !== id));
  };

    const handleAddSetor = (setor: Categoria) => {
    setSelectedSetores(prev => {
      const isAlreadySelected = prev.some(s => s.id === setor.id);
      if (isAlreadySelected) {
        // Remove se já estiver selecionado
        return prev.filter(s => s.id !== setor.id);
      } else {
        // Adiciona se não estiver selecionado
        return [...prev, setor];
      }
    });
  };

  const handleClearAllSetores = () => {
    setSelectedSetores([]);
    setSetorSearchQuery('');
  };

  // Filtrar setores baseado na busca
  const filteredSetores = useMemo(() => {
    return setores.filter(s => 
      s.nome.toLowerCase().includes(setorSearchQuery.toLowerCase())
    );
  }, [setores, setorSearchQuery]);

  const handleRemoveSetor = (id: number) => {
    setSelectedSetores(prev => prev.filter(s => s.id !== id));
  };

const styles: { [key: string]: React.CSSProperties } = {
    // --- Estrutura Principal ---
    container: {
      minHeight: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    mainContent: {
      marginLeft: sidebarExpanded ? '200px' : '60px',
      padding: '24px',
      transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      minHeight: '100vh',
      maxHeight: '100vh',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: '#cbd5e1 #f1f5f9'
    },
    maxWidth: { maxWidth: '1400px', margin: '0 auto' },
    pageTitle: {
      fontSize: '22px',
      fontWeight: '600',
      color: '#1e293b',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },

    // --- Cartões e Seções ---
    mainCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      marginBottom: '10px'
    },
    // NOVO: Estilo para o cabeçalho de cada cartão/seção
    cardHeader: {
      padding: '12px 16px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    cardTitle: {
      fontSize: '14px',
      fontWeight: '600',
      color: '#1e293b',
    },
    cardBody: {
      padding: '16px'
    },

    // --- Grids e Layout ---
    grid12: {
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gap: '16px', // MELHORIA: Aumentado o espaçamento para melhor distribuição
      alignItems: 'start'
    },
    col2: { gridColumn: 'span 2' },
    col3: { gridColumn: 'span 3' },
    col4: { gridColumn: 'span 4' },
    col5: { gridColumn: 'span 5' },
    col6: { gridColumn: 'span 6' },
    col7: { gridColumn: 'span 7' },
    col9: { gridColumn: 'span 9' },
    col12: { gridColumn: 'span 12' },

    // --- Controles de Formulário ---
    formField: {
        marginBottom: '12px'
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '4px',
    },
    input: {
      width: '100%',
      height: '32px', // MELHORIA: Altura padronizada
      padding: '0 8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      outline: 'none',
      transition: 'all 0.2s ease',
      boxSizing: 'border-box',
      backgroundColor: '#ffffff'
    },
    // NOVO: Estilo para campos de leitura ou desabilitados
    inputReadOnly: {
        backgroundColor: '#f3f4f6',
        cursor: 'not-allowed'
    },
    select: {
      width: '100%',
      height: '32px', // MELHORIA: Altura padronizada
      padding: '0 8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      backgroundColor: 'white',
      outline: 'none',
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease'
    },
    textarea: {
      width: '100%',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      outline: 'none',
      resize: 'vertical',
      minHeight: '60px',
      fontFamily: 'inherit',
      boxSizing: 'border-box',
      transition: 'all 0.2s ease'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '12px',
        color: '#374151'
    },
    checkbox: {
      width: '14px',
      height: '14px',
      accentColor: '#059669',
      cursor: 'pointer',
      marginRight: '8px'
    },
    radioLabel: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontSize: '12px'
    },
    radio: {
      width: '14px',
      height: '14px',
      accentColor: '#059669',
      cursor: 'pointer',
      marginRight: '4px'
    },

    // --- Botões ---
    buttonGroup: { display: 'flex', gap: '8px' },
    primaryButton: {
      backgroundColor: '#059669',
      color: 'white',
      padding: '0 14px',
      height: '32px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    secondaryButton: {
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '0 14px',
      height: '32px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '12px',
      fontWeight: '500',
      transition: 'all 0.2s ease',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    iconButton: {
      backgroundColor: 'transparent',
      color: '#475569',
      height: '32px',
      width: '32px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease'
    },

    // --- Componentes de Busca (Dropdown) ---
    searchContainer: { position: 'relative', flex: 1 },
    searchInputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    searchInput: {
      width: '100%',
      height: '32px',
      padding: '0 32px 0 32px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      outline: 'none',
      boxSizing: 'border-box',
    },
    searchInputIcon: {
      position: 'absolute',
      left: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#64748b',
    },
    clearButton: {
      position: 'absolute',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#64748b',
      display: 'flex'
    },
    dropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderTop: 'none',
      borderRadius: '0 0 4px 4px',
      maxHeight: '200px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    },
    dropdownItem: {
      padding: '8px 12px',
      cursor: 'pointer',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '12px',
      transition: 'background-color 0.2s ease'
    },
    clienteName: { fontWeight: '500', color: '#374151' },
    clienteDetails: { display: 'flex', gap: '8px', fontSize: '11px', color: '#64748b', marginTop: '2px' },
    
    // --- Seção de Amostras ---
    sampleContainer: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    },
    sampleTabsContainer: {
      borderBottom: '1px solid #e2e8f0',
      padding: '8px 16px'
    },
    sampleTabsList: { display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' },
    sampleTab: {
      padding: '6px 12px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#f8fafc',
      cursor: 'pointer',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      color: '#475569',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
     sampleTabActive: {
    backgroundColor: '#059669',
    color: 'white',
    borderColor: '#059669',
  },
   overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    zIndex: 999
  },
  modal: {
    background: '#fff',
    padding: '20px',
    borderRadius: '10px',
    width: '350px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },

  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '10px'
  },
  btnPrimary: {
    background: '#007bff',
    color: '#fff',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  btnSecondary: {
    background: '#ccc',
    color: '#000',
    padding: '8px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  addSampleButton: {
    backgroundColor: '#f0fdf4', // Verde muito claro
    color: '#166534', // Verde escuro
    border: '2px solid #bbf7d0', // Borda verde suave
    borderRadius: '12px',
    padding: '5px 10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(34, 197, 94, 0.1)',
    outline: 'none',
  },
  

    removeSampleButton: {
      background: 'none',
      border: 'none',
      padding: '0',
      marginLeft: '4px',
      cursor: 'pointer',
      color: 'inherit',
      display: 'flex'
    },
    sampleContentWithSidebar: { display: 'flex', gap: '0', flex: 1, minHeight: 0 },
    sampleSidebar: {
      width: '60px',
      backgroundColor: '#f8fafc',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 4px',
      alignItems: 'center',
      gap: '4px'
    },
    sampleSidebarTab: {
      width: '52px',
      height: '52px',
      border: '1px solid transparent',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      color: '#475569',
      transition: 'all 0.2s ease',
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sampleSidebarTabActive: {
      backgroundColor: '#059669',
      color: 'white',
    },
    sampleMainContent: {
      flex: 1,
      padding: '16px 24px',
      backgroundColor: 'white',
      overflowY: 'auto',
      borderRadius: '0 0 8px 0',
    },

    // --- Estilos específicos para metodologias ---
    metodologiaContainer: {
      position: 'relative',
      marginBottom: '16px'
    },
    metodologiaHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '8px'
    },
    metodologiaDisplayArea: {
      width: '100%',
      minHeight: '80px',
      padding: '8px',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      fontSize: '12px',
      backgroundColor: '#ffffff',
      cursor: 'default',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'flex-start',
      alignContent: 'flex-start'
    },
    metodologiaTag: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: '#059669',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: '500'
    },
    metodologiaTagRemove: {
      background: 'none',
      border: 'none',
      color: 'white',
      cursor: 'pointer',
      padding: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '14px',
      height: '14px',
      borderRadius: '50%',
      transition: 'background-color 0.2s ease'
    },
    metodologiaEmptyState: {
      color: '#9ca3af',
      fontStyle: 'italic',
      fontSize: '12px'
    },
    metodologiaDropdown: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      border: '1px solid #d1d5db',
      borderRadius: '4px',
      maxHeight: '250px',
      overflowY: 'auto',
      zIndex: 1000,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      marginTop: '4px'
    },
    metodologiaSearchInput: {
      width: '100%',
      padding: '8px 12px',
      border: 'none',
      borderBottom: '1px solid #e5e7eb',
      fontSize: '12px',
      outline: 'none'
    },
    metodologiaDropdownItem: {
      padding: '8px 12px',
      cursor: 'pointer',
      fontSize: '12px',
      transition: 'background-color 0.2s ease',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    metodologiaSelectedIndicator: {
      color: '#059669',
      fontWeight: '500'
    },

    // Utilitários
    flexRow: { display: 'flex', gap: '8px', alignItems: 'center' },
    flexRowJustify: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    loadingContainer: { padding: '20px', textAlign: 'center', color: '#64748b' },
    errorContainer: { 
      padding: '20px', 
      textAlign: 'center', 
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '4px',
      margin: '20px 0'
    },
    formGroup: {
      marginBottom: '20px'
    },
 
    checkboxContainer: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '16px'
    },

    radioContainer: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px'
    },
    radioGroup: {
      display: 'flex',
      alignItems: 'center'
    },

    selectContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },

    addButton: {
      backgroundColor: '#28a745',
      color: 'white'
    },
    searchButton: {
      backgroundColor: '#007bff',
      color: 'white'
    },
 
   
    section: {
      flex: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      padding: '16px',
      backgroundColor: '#fafafa'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '12px',
      color: '#333'
    },
    listBox: {
      border: '1px solid #ddd',
      borderRadius: '4px',
      backgroundColor: '#fff',
      minHeight: '200px',
      maxHeight: '300px',
      overflowY: 'auto' as const,
      padding: '8px'
    },
    listItem: {
      padding: '8px 12px',
      cursor: 'pointer',
      borderRadius: '4px',
      margin: '2px 0',
      fontSize: '14px',
      transition: 'background-color 0.2s'
    },
    listItemHover: {
      backgroundColor: '#f0f0f0'
    },
    listItemSelected: {
      backgroundColor: '#e3f2fd'
    },
    buttonContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '10px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 16px'
    },
    button: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      minWidth: '80px',
      transition: 'background-color 0.2s'
    },

    removeButton: {
      backgroundColor: '#dc3545',
      color: 'white'
    },
    buttonDisabled: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    selectedCount: {
      marginTop: '16px',
      padding: '12px',
      backgroundColor: '#e8f5e8',
      border: '1px solid #c3e6c3',
      borderRadius: '4px',
      fontSize: '14px'
    },

    // --- Novos estilos para layout de setores lado a lado ---
    setoresContainer: {
      display: 'flex',
      gap: '16px',
      alignItems: 'stretch',
      minHeight: '350px'
    },
    setoresSection: {
      flex: 1,
      border: '1px solid #e0e0e0',
      borderRadius: '6px',
      padding: '16px',
      backgroundColor: '#fafafa',
      display: 'flex',
      flexDirection: 'column' as const
    },
    setoresBotoesContainer: {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '12px',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0 20px',
      minWidth: '120px'
    }
  };

 
  useEffect(() => {
    const carregarDadosIniciais = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          categoriasData,
          acreditacoesData,
          metodologiasData,
          legislacoesData,
          identificacoesData,
          terceirizadosData,
          pgData,
          consultoresData,
          certificadoData
        ] = await Promise.all([
          invoke('buscar_categoria_amostra'),
          invoke('buscar_acreditacao'),
          invoke('buscar_metodologias'),
          invoke('buscar_legislacao'),
          invoke('buscar_identificacao'),
          invoke('buscar_tercerizado'),
          invoke('buscar_pg'),
          invoke('consultar_consultores'),
          invoke('buscar_certificado')
          
        ]);

        setCategorias(categoriasData as Categoria[]);
        setAcreditacoes(acreditacoesData as Categoria[]);
        setMetodologiasList(metodologiasData as Categoria[]);
        setLegislacoes(legislacoesData as Categoria[]);
        setIdentificacoes(identificacoesData as Identificacao[]);
        setTerceirizados(terceirizadosData as Categoria[]);
        setPg(pgData as Categoria[]);
        setRelatorios(certificadoData as Categoria[]);
        setConsultores(consultoresData as Categoria[]);


      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados do servidor');
      } finally {
        setLoading(false);
      }
    };

    carregarDadosIniciais();
  }, []);


const SuccessModal = () => (
  <div style={styles.overlay}>
    <div style={{ ...styles.modal, alignItems: 'center', textAlign: 'center', gap: '16px' }}>
      <CheckCircle size={48} color="#059669" />
      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Sucesso!</h3>
      <p style={{ margin: '0', fontSize: '14px', color: '#475569' }}>Amostra cadastrada com sucesso.</p>
      <button
        style={{ ...styles.primaryButton, marginTop: '16px' }}
        onClick={() => setShowSuccessModal(false)}
      >
        Fechar
      </button>
    </div>
  </div>
);
const ErrorModal = () => (
  <div style={styles.overlay}>
    <div style={{ ...styles.modal, alignItems: 'center', textAlign: 'center', gap: '16px' }}>
      <XCircle size={48} color="#ef4444" />
      <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Erro!</h3>
      <p style={{ margin: '0', fontSize: '14px', color: '#475569' }}>Ocorreu um erro ao cadastrar a amostra.</p>
      <button
        style={{ ...styles.primaryButton, backgroundColor: '#ef4444', marginTop: '16px' }}
        onClick={() => setShowErrorModal(false)}
      >
        Fechar
      </button>
    </div>
  </div>
);

  const handleClienteSelect = async (cliente: Cliente) => {
    try {
      setSelectedClienteObj(cliente);
      setSelectedClient(cliente.fantasia || cliente.razao || '');
      setShowDropdown(false);
      setSearchResults([]);

      const dadosCliente: DadosClienteResponse = await invoke('buscar_dados_cliente', {
        clienteId: cliente.id,
      });

      setSolicitantes(dadosCliente.solicitantes);
      setOrcamentos(dadosCliente.orcamentos);
      setSetores(dadosCliente.setor_portal);

      // Limpar seleções anteriores
      handleClearSolicitanteSearch();
      setSelectedOrcamento('');
      setAnoFiltro(''); // Limpa o filtro de ano

    } catch (error) {
      console.error('Erro ao buscar dados do cliente:', error);
      setSolicitantes([]);
      setOrcamentos([]);
    }
  };

  const handleSolicitanteSelect = (solicitante: SolicitanteComEmail) => {
    setSelectedSolicitanteObj(solicitante);
    setSolicitanteSearchQuery(solicitante.nome);
    setEmailSolicitante(solicitante.usuario);
    setShowSolicitanteDropdown(false);
  };
  
  const handleClearSolicitanteSearch = () => {
      setSolicitanteSearchQuery('');
      setSelectedSolicitanteObj(null);
      setEmailSolicitante('');
      setShowSolicitanteDropdown(false);
  };

const handleOrcamentoSelect = async (orcamento: OrcamentoComItens) => {
  setSelectedOrcamento(`${orcamento.nome} - ${orcamento.ano}`);
  try {
    const response = await invoke<OrcamentoItem[]>("buscar_orcamentos", {
      orcamentoId: orcamento.id, // Mudança: snake_case → camelCase
    });
  
    setOrcamentoItems(response);
  } catch (error) {
    console.error("Erro ao buscar itens do orçamento:", error);
    setOrcamentoItems([]);
  }
};

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
      if (value.trim().length === 0) {
          handleClearSearch();
      }
    }
  };

  // NOVO: Função refatorada para lidar com a mudança da legislação
  const handleLegislacaoChange = async (value: string, legislacao?: Categoria) => {
    setSelectedLegislacao(value);
    
      if (legislacao) {
      try {
        const response = await invoke<ParametroResponse>("buscar_parametros", {
          legislacaoId: legislacao.id,
        });
        const novosParametros = response.data || [];
        
        setParametrosBase(novosParametros);

        // Atualiza todas as amostras existentes com a nova lista de parâmetros
        setAmostras((prevAmostras) =>
          prevAmostras.map((amostra) => ({
            ...amostra,
            parametrosDisponiveis: novosParametros,
            parametrosSelecionados: [], // Limpa seleções anteriores
            checkedDisponiveis: [],
            checkedSelecionados: [],
          }))
        );
        console.log("Parâmetros atualizados para todas as amostras:", novosParametros);
      } catch (error) {
        console.error("Erro ao buscar parâmetros:", error);
        setParametrosBase([]);
        setAmostras((prevAmostras) =>
          prevAmostras.map((amostra) => ({ ...amostra, parametrosDisponiveis: [], parametrosSelecionados: [] }))
        );
      }
    } else {
      // Se nenhuma legislação for selecionada, limpa os parâmetros de todas as amostras
      setParametrosBase([]);
      setAmostras((prevAmostras) =>
        prevAmostras.map((amostra) => ({
          ...amostra,
          parametrosDisponiveis: [],
          parametrosSelecionados: [],
          checkedDisponiveis: [],
          checkedSelecionados: [],
        }))
      );
    }
  };

    const handleIdentificacaoChange = (value: string, identificacao?: Identificacao) => {
    setSelectedIdentificacao(value);
  };



  const handleClearSearch = () => {
    setSelectedClient('');
    setSelectedClienteObj(null);
    setSearchResults([]);
    setShowDropdown(false);
    setSolicitantes([]);
    setOrcamentos([]);
    handleClearSolicitanteSearch();
    setSelectedOrcamento('');
    setAnoFiltro(''); // Limpa o filtro de ano
  };
  
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
      id: Math.max(0, ...amostras.map(a => a.id)) + 1,
      numero: '',
      horaColeta: '',
      identificacao: '',
      temperatura: '',
      complemento: '',
      condicoesAmbientais: '',
      itemOrcamento: null,
      // Inicializa a nova amostra com a lista de parâmetros base atual
      parametrosDisponiveis: parametrosBase,
      parametrosSelecionados: [],
      checkedDisponiveis: [],
      checkedSelecionados: [],
    };
    setAmostras([...amostras, novaAmostra]);
    setActiveAmostraTab(novaAmostra.id);
  };

  const removerAmostra = (id: number) => {
    if (amostras.length > 1) {
      const novasAmostras = amostras.filter(a => a.id !== id);
      setAmostras(novasAmostras);
      
      if (activeAmostraTab === id) {
        setActiveAmostraTab(novasAmostras[0]?.id || 1);
      }
    }
  };

  // ✅ *** CORRECTION STARTS HERE *** ✅
  const atualizarAmostra = (id: number, campo: keyof Amostra, valor: any) => {
    setAmostras(prevAmostras =>
      prevAmostras.map(amostra => {
        if (amostra.id === id) {
          // Check if 'valor' is a function. If it is, it's a state updater function.
          const novoValor = typeof valor === 'function'
            ? valor(amostra[campo]) // Execute it with the previous state value of the field
            : valor; // Otherwise, use the value directly
          return { ...amostra, [campo]: novoValor };
        }
        return amostra;
      })
    );
  };
  // ✅ *** CORRECTION ENDS HERE *** ✅

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
        itemOrcamento: null
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
    const button = e.currentTarget;
    const bgColor = button.getAttribute('data-bg-color');
    
    if (isHover) {
      if (bgColor === 'primary') {
        button.style.backgroundColor = '#047857';
      } else if (bgColor === 'secondary') {
        button.style.backgroundColor = '#b91c1c';
      }
    } else {
      if (bgColor === 'primary') {
        button.style.backgroundColor = '#059669';
      } else if (bgColor === 'secondary') {
        button.style.backgroundColor = '#dc2626';
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (solicitanteSearchRef.current && !solicitanteSearchRef.current.contains(event.target as Node)) {
        setShowSolicitanteDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSolicitanteSearchChange = (value: string) => {
      setSolicitanteSearchQuery(value);
      setSelectedSolicitanteObj(null);
      setEmailSolicitante('');
      if (value.trim().length > 0) {
          setShowSolicitanteDropdown(true);
      } else {
          setShowSolicitanteDropdown(false);
      }
  };

  const handleAnoFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAnoFiltro(e.target.value);
    setSelectedOrcamento(''); // Reseta a seleção de orçamento ao mudar o filtro
  };

const renderCadastroContent = () => (
    <>
      <div style={styles.mainCard}>
        <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Configurações Gerais</h2>
            <div style={styles.buttonGroup}>
                 <button style={styles.primaryButton}>Copiar</button>
                 <button style={styles.primaryButton}>Coleta</button>
                 <button style={styles.primaryButton}>Selecionar Parâmetros</button>
            </div>
        </div>
        <div style={styles.cardBody}>
            <div style={styles.grid12}>
              <div style={styles.col3}>
            <label style={styles.label}>Relatório de ensaios</label>
                       <select
                style={styles.select}
                value={selectedReportType || ''}
                onChange={(e) => setSelectedReportType(Number(e.target.value))}
            >
                <option value="">Selecione</option>
                {relatorios.map((legislacao) => (
                  
                  <option key={legislacao.id} value={legislacao.id}>
                    {legislacao.nome}
                  </option>
                ))}
            </select>
            {(selectedReportType === 2  || selectedReportType === 5 )&& (
                <div style={{ marginTop: '10px' }}>
                    <label style={styles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={sameTimeForAllSamples}
                            onChange={(e) => setSameTimeForAllSamples(e.target.checked)}
                            style={styles.checkbox}
                        />
                        Mesma hora em todas as amostras
                    </label>
                </div>
            )}
        </div>
                <div style={styles.col3}>
                    <label style={styles.label}>Acreditação</label>
                    <select style={styles.select} value={selectedAcreditacao} onChange={(e) => setSelectedAcreditacao(e.target.value)} disabled={loading}>
                        <option value="">Selecione</option>
                        {acreditacoes.map((ac) => <option key={ac.id} value={ac.nome}>{ac.nome}</option>)}
                    </select>
                </div>
             
                <div style={styles.col3}>
                    <label style={styles.label}>Categoria</label>
                    <select style={styles.select} value={category} onChange={(e) => setCategory(e.target.value)} disabled={loading}>
                        <option value="">Selecione</option>
                        {categorias.map((cat) => <option key={cat.id} value={cat.nome}>{cat.nome}</option>)}
                    </select>
                </div>
            </div>
        </div>
      </div>
      
      {/* NOVO: Seções bem definidas com cabeçalhos */}
      <div style={styles.mainCard}>
        <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Dados do Cliente</h2>
        </div>
        <div style={styles.cardBody}>
            <div style={styles.grid12}>
                 <div style={styles.col6}>
                    <label style={styles.label}>Cliente</label>
                    <div style={styles.flexRow}>
                        <div style={styles.searchContainer} ref={searchRef}>
                            <div style={styles.searchInputWrapper}>
                                <span style={styles.searchInputIcon}><SearchIcon /></span>
                                <input type="text" value={selectedClient} onChange={(e) => handleClientSearchChange(e.target.value)} style={styles.searchInput} placeholder="Digite o nome, CNPJ/CPF ou cidade"/>
                                {selectedClient && (<button style={styles.clearButton} onClick={handleClearSearch}><XIcon /></button>)}
                            </div>
                            {showDropdown && (
                                <div style={styles.dropdown}>
                                {isSearching ? (<div style={styles.dropdownItem}>Buscando...</div>) : (
                                    searchResults.map((cliente) => (
                                    <div key={cliente.id} style={styles.dropdownItem} onClick={() => handleClienteSelect(cliente)} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}>
                                        <div style={styles.clienteName}>{cliente.fantasia || cliente.razao}</div>
                                        <div style={styles.clienteDetails}>
                                            <span>{formatDocument(cliente.documento || '')}</span>
                                            <span>{cliente.cidade} / {cliente.uf}</span>
                                        </div>
                                    </div>
                                    ))
                                )}
                                </div>
                            )}
                        </div>
                        <button style={styles.iconButton}><PlusIcon /></button>
                    </div>
                </div>
                 <div style={styles.col3}>
                    <label style={styles.label}>Consultor</label>
                    <select style={styles.select} value={selectedConsultor} onChange={(e) => setSelectedConsultor(e.target.value)} disabled={loading}>
                        <option value="">Selecione</option>
                        {consultores.map((c) => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                </div>
                 <div style={styles.col3}>
                    <label style={styles.label}>Status do Consultor</label>
                    <div style={{...styles.input, ...styles.inputReadOnly, display: 'flex', alignItems: 'center'}}>-</div>
                </div>
                 <div style={styles.col6}>
                    <label style={styles.label}>Solicitante</label>
                    <div style={styles.searchContainer} ref={solicitanteSearchRef}>
                        <div style={styles.searchInputWrapper}>
                             <span style={styles.searchInputIcon}><SearchIcon /></span>
                             <input type="text" value={solicitanteSearchQuery} onChange={(e) => handleSolicitanteSearchChange(e.target.value)} style={!selectedClienteObj ? {...styles.searchInput, ...styles.inputReadOnly} : styles.searchInput} placeholder={!selectedClienteObj ? "Selecione um cliente primeiro" : "Digite o nome do solicitante"} disabled={!selectedClienteObj}/>
                             {solicitanteSearchQuery && (<button style={styles.clearButton} onClick={handleClearSolicitanteSearch}><XIcon /></button>)}
                        </div>
                        {showSolicitanteDropdown && (
                             <div style={styles.dropdown}>
                                {solicitantes.filter(s => s.nome.toLowerCase().includes(solicitanteSearchQuery.toLowerCase())).map((solicitante) => (
                                    <div key={solicitante.id} style={styles.dropdownItem} onClick={() => handleSolicitanteSelect(solicitante)}>
                                        {solicitante.nome}
                                    </div>
                                ))}
                             </div>
                        )}
                    </div>
                </div>
                 <div style={styles.col6}>
                    <label style={styles.label}>E-mail do Solicitante</label>
                    <input type="email" value={emailSolicitante} onChange={(e) => setEmailSolicitante(e.target.value)} style={selectedSolicitanteObj ? {...styles.input, ...styles.inputReadOnly} : styles.input} readOnly={!!selectedSolicitanteObj} placeholder="O e-mail será preenchido ao selecionar"/>
                </div>
            </div>
        </div>
      </div>
      <div style={styles.mainCard}>
        <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Datas e Detalhes da Coleta</h2>
        </div>
 <div style={styles.cardBody}>
    <div style={styles.grid12}>
        <div style={styles.col2}>
            <label style={styles.label}>Início da Amostragem</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.input} />
            <label style={styles.label}>Hora Amostragem</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.col2}>
            <label style={styles.label}>Data da Coleta</label>
            <input type="date" value={collectDate} onChange={(e) => setCollectDate(e.target.value)} style={styles.input} />
            <label style={styles.label}>Hora da Coleta</label>
            <input type="time" value={collectTime} onChange={(e) => setCollectTime(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.col2}>
            <label style={styles.label}>Entrada no Lab.</label>
            <input type="date" value={labEntryDate} onChange={(e) => setLabEntryDate(e.target.value)} style={styles.input} />
            <label style={styles.label}>Hora Entrada</label>
            <input type="time" value={labEntryTime} onChange={(e) => setLabEntryTime(e.target.value)} style={styles.input} />
        </div>
        <div style={styles.col3}><label style={styles.label}>Coletado por</label><select value={collector} onChange={(e) => setCollector(e.target.value)} style={styles.select}><option>Cliente</option><option>Laboratório</option></select></div>
        <div style={styles.col3}><label style={styles.label}>Nome do Coletor</label><input type="text" value={collectorName} onChange={(e) => setCollectorName(e.target.value)} style={styles.input}/></div>
        <div style={styles.col6}><label style={styles.label}>Procedimento de Amostragem</label><select value={samplingProcedure} onChange={(e) => setSamplingProcedure(e.target.value)} style={styles.select}>       <option value="">Selecione uma Opção</option>  {pgs.map((legislacao) => (
                  
                  <option key={legislacao.id} value={legislacao.id}>
                    {legislacao.nome}
                  </option>
                ))}</select></div>
        <div style={styles.col6}><label style={styles.label}>Acompanhante</label><input type="text" value={companion} onChange={(e) => setCompanion(e.target.value)} style={styles.input}/></div>
    </div>
</div>
      </div>
       <div style={styles.mainCard}>
         <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Orçamento e Dados Adicionais</h2>
        </div>
        <div style={styles.cardBody}>
            <div style={styles.grid12}>
                <div style={styles.col2}>
                    <label style={styles.label}>Orçamento Vinculado?</label>
                    <div style={{...styles.flexRow, height:'32px'}}>
                        <label style={styles.radioLabel}><input type="radio" name="budget" checked={!budget} onChange={() => setBudget(false)} style={styles.radio}/>Não</label>
                        <label style={styles.radioLabel}><input type="radio" name="budget" checked={budget} onChange={() => setBudget(true)} style={styles.radio}/>Sim</label>
                    </div>
                </div>
                <div style={styles.col2}>
                    <label style={styles.label}>Filtrar Ano</label>
                    <select value={anoFiltro} onChange={handleAnoFiltroChange} style={styles.select} disabled={availableYears.length === 0 || !budget}>
                        <option value="">Todos</option>
                        {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
                <div style={styles.col5}>
                    <label style={styles.label}>Selecionar Orçamento</label>
                    <select 
  value={selectedOrcamento} 
  onChange={(e) => {
    const selectedValue = e.target.value;
    
    if (selectedValue) {
      // Encontrar o orçamento completo baseado no valor selecionado
      const orcamentoSelecionado = filteredOrcamentos.find(
        orc => `${orc.nome} - ${orc.ano}` === selectedValue
      );
      
      if (orcamentoSelecionado) {
        handleOrcamentoSelect(orcamentoSelecionado);
      }
    } else {
      // Se valor vazio, apenas limpar a seleção
      setSelectedOrcamento("");
      setOrcamentoItems([]);
    }
  }} 
  style={styles.select} 
  disabled={filteredOrcamentos.length === 0 || !budget}
>
  <option value="">
    {orcamentos.length === 0 ? 'Nenhum orçamento encontrado' : 'Selecione um orçamento'}
  </option>
  {filteredOrcamentos.map((orc) => (
    <option key={orc.id} value={`${orc.nome} - ${orc.ano}`}>
      {orc.nome} - {orc.ano}
    </option>
  ))}
</select>
                </div>
                <div style={{...styles.col3, alignSelf: 'end'}}>
                     <button style={styles.primaryButton}>Abrir Orçamento</button>
                </div>
            </div>
            <div style={{...styles.grid12, marginTop: '16px'}}>
                 <div style={styles.col4}>
                    <div style={styles.flexRow}>
                        <input type="checkbox" id="vazaoCliente" checked={vazaoClient} onChange={(e) => setVazaoClient(e.target.checked)} style={styles.checkbox}/>
                        <label htmlFor="vazaoCliente" style={{...styles.label, marginBottom: 0}}>Informar Vazão (cliente)</label>
                    </div>
                     <div style={{...styles.flexRow, marginTop: '4px'}}>
                        <input type="text" value={flow} onChange={(e) => setFlow(e.target.value)} style={styles.input} disabled={!vazaoClient}/>
                        <select value={flowUnit} onChange={(e) => setFlowUnit(e.target.value)} style={{...styles.select, width: '120px'}} disabled={!vazaoClient}>
                            <option>m³/hora</option><option>L/min</option>
                        </select>
                     </div>
                </div>
                <div style={styles.col4}>
                    <label style={styles.checkboxLabel}>
                        <input type="checkbox" checked={samplingData} onChange={(e) => setSamplingData(e.target.checked)} style={styles.checkbox}/>
                        Incluir dados de amostragem
                    </label>
                </div>
                 <div style={styles.col4}>
                    <label style={styles.checkboxLabel}>
                        <input type="checkbox" checked={qualityControl} onChange={(e) => setQualityControl(e.target.checked)} style={styles.checkbox}/>
                        Controle de qualidade
                    </label>
                </div>
            </div>
        </div>
      </div>

      {/* SEÇÃO DE METODOLOGIAS CORRIGIDA */}
      <div style={styles.mainCard}>
        <div style={styles.cardHeader}>
          <h2 style={styles.cardTitle}>Metodologias e Legislação</h2>
        </div>
        <div style={styles.cardBody}>
          <div style={styles.grid12}>
            {/* Seção de Metodologias - Seleção Múltipla */}
            <div style={styles.col9}>
              <div style={styles.metodologiaContainer} ref={metodologiaRef}>
                <div style={styles.metodologiaHeader}>
                  <label style={styles.label}>Metodologias (Seleção Múltipla)</label>
                  <div style={styles.buttonGroup}>
                    <button
                      style={styles.primaryButton}
                      data-bg-color="primary"
                      onMouseEnter={(e) => handleButtonHover(e, true)}
                      onMouseLeave={(e) => handleButtonHover(e, false)}
                      onClick={() => setShowMethodologiesDropdown(!showMethodologiesDropdown)}
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                    <button
                      style={styles.secondaryButton}
                      data-bg-color="secondary"
                      onMouseEnter={(e) => handleButtonHover(e, true)}
                      onMouseLeave={(e) => handleButtonHover(e, false)}
                      onClick={handleClearAllMethodologies}
                      disabled={selectedMethodologies.length === 0}
                    >
                      Limpar Todas
                    </button>
                  </div>
                </div>

                {/* Área de exibição das metodologias selecionadas */}
                <div style={styles.metodologiaDisplayArea}>
                  {selectedMethodologies.length > 0 ? (
                    selectedMethodologies.map(metodologia => (
                      <span key={metodologia.id} style={styles.metodologiaTag}>
                        {metodologia.nome}
                        <button
                          style={styles.metodologiaTagRemove}
                          onClick={() => handleRemoveMetodologia(metodologia.id)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span style={styles.metodologiaEmptyState}>
                      Nenhuma metodologia selecionada. Clique em "Adicionar" para selecionar metodologias.
                    </span>
                  )}
                </div>

                {/* Dropdown de metodologias */}
                {showMethodologiesDropdown && (
                  <div style={styles.metodologiaDropdown}>
                    <input
                      type="text"
                      placeholder="Buscar metodologia..."
                      style={styles.metodologiaSearchInput}
                      value={metodologiaSearchQuery}
                      onChange={(e) => setMetodologiaSearchQuery(e.target.value)}
                    />
                    <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                      {filteredMethodologies.length > 0 ? (
                        filteredMethodologies.map((metodologia) => {
                          const isSelected = selectedMethodologies.some(sm => sm.id === metodologia.id);
                          return (
                            <div
                              key={metodologia.id}
                              style={{
                                ...styles.metodologiaDropdownItem,
                                backgroundColor: isSelected ? '#f0fdf4' : 'white'
                              }}
                              onClick={() => handleAddMetodologia(metodologia)}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected ? '#dcfce7' : '#f9fafb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = isSelected ? '#f0fdf4' : 'white';
                              }}
                            >
                              <span>{metodologia.nome}</span>
                              {isSelected && (
                                <span style={styles.metodologiaSelectedIndicator}>✓ Selecionado</span>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div style={styles.metodologiaDropdownItem}>
                          Nenhuma metodologia encontrada
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Seção de Legislação - Seleção Única */}
                       <div style={styles.col3}>
                  <div style={styles.formField}>
                    <CustomSelect
                      options={legislacoes}
                      value={selectedLegislacao}
                      onChange={handleLegislacaoChange}
                      displayKey="nome"
                      label="Legislação"
                      placeholder="Selecione uma legislação..."
                    />
                  </div>
                </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'cadastro':
        return renderCadastroContent();
      case 'setores':
        return (
     <div style={styles.cardBody}>
        {/* Container principal com layout flexbox */}
        <div style={styles.setoresContainer}>
          {/* Setores Disponíveis */}
          <div style={styles.setoresSection}>
            <div style={styles.sectionTitle}>Setores Disponíveis</div>
            <div style={styles.listBox}>
              {setoresNaoSelecionados.map(setor => (
                <div
                  key={setor.id}
                  style={{
                    ...styles.listItem,
                    backgroundColor: selectedAvailable.includes(setor.id) 
                      ? '#e3f2fd' 
                      : 'transparent'
                  }}
                  onClick={() => handleAvailableClick(setor.id)}
                  onMouseEnter={(e) => {
                    if (!selectedAvailable.includes(setor.id)) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedAvailable.includes(setor.id)) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {setor.nome}
              </div>
            ))}
          </div>
        </div>

        {/* Botões centralizados */}
        <div style={styles.setoresBotoesContainer}>
          <button
            style={{
              ...styles.button,
              ...styles.addButton,
              ...(selectedAvailable.length === 0 ? styles.buttonDisabled : {})
            }}
            onClick={adicionarSetores}
            disabled={selectedAvailable.length === 0}
          >
            Adicionar
          </button>
          <button
            style={{
              ...styles.button,
              ...styles.removeButton,
              ...(selectedChosen.length === 0 ? styles.buttonDisabled : {})
            }}
            onClick={removerSetores}
            disabled={selectedChosen.length === 0}
          >
            Remover
          </button>
        </div>

        {/* Setores Selecionados */}
        <div style={styles.setoresSection}>
          <div style={styles.sectionTitle}>Setores Selecionados</div>
          <div style={styles.listBox}>
            {setoresSelecionados.map(setor => (
              <div
                key={setor.id}
                style={{
                  ...styles.listItem,
                  backgroundColor: selectedChosen.includes(setor.id) 
                    ? '#e3f2fd' 
                    : 'transparent'
                }}
                onClick={() => handleChosenClick(setor.id)}
                onMouseEnter={(e) => {
                  if (!selectedChosen.includes(setor.id)) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!selectedChosen.includes(setor.id)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {setor.nome}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resumo dos setores selecionados */}
      <div style={styles.selectedCount}>
        <strong>Setores selecionados:</strong> {setoresSelecionados.length} de {setores.length}
        {setoresSelecionados.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {setoresSelecionados.map(setor => setor.nome).join(', ')}
          </div>
        )}
      </div>
    </div>
        );
    case 'terceirizacao':
  return (
    <div style={styles.mainCard}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Terceirização</h2>
      </div>

      {/* Checkbox Amostra terceirizada */}
      <div style={styles.cardBody}>
        <div style={styles.formGroup}>
          <div style={styles.checkboxContainer}>
            <input
              type="checkbox"
              id="amostraTerceirizada"
              checked={amostraTerceirizada}
              onChange={(e) => setAmostraTerceirizada(e.target.checked)}
              style={styles.checkbox}
            />
            <label htmlFor="amostraTerceirizada" style={styles.label}>
              Amostra terceirizada
            </label>
          </div>
        </div>

        {/* Radio buttons Parcial/Total */}
        <div style={styles.formGroup}>
          <div style={styles.radioContainer}>
            <div style={styles.radioGroup}>
              <input
                type="radio"
                id="parcial"
                name="tipoAnalise"
                value="parcial"
                checked={tipoAnalise === 'parcial'}
                onChange={(e) => setTipoAnalise(e.target.value)}
                style={styles.radio}
                disabled={!amostraTerceirizada} // Desativa quando false
              />
              <label htmlFor="parcial" style={styles.radioLabel}>
                Parcial
              </label>
            </div>

            <div style={styles.radioGroup}>
              <input
                type="radio"
                id="total"
                name="tipoAnalise"
                value="total"
                checked={tipoAnalise === 'total'}
                onChange={(e) => setTipoAnalise(e.target.value)}
                style={styles.radio}
                disabled={!amostraTerceirizada} // Desativa quando false
              />
              <label htmlFor="total" style={styles.radioLabel}>
                Total
              </label>
            </div>
          </div>
        </div>

        {/* Laboratório */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Laboratório
          </label>
          <div style={styles.selectContainer}>
            <select
              value={laboratorio}
              onChange={(e) => setLaboratorio(e.target.value)}
              style={styles.select}
              disabled={!amostraTerceirizada} // Desativa quando false
            >
              {terceirizados.map((legislacao) => (
                <option key={legislacao.id} value={legislacao.nome}>
                  {legislacao.nome}
                </option>
              ))}
            </select>

            <button
              style={{ ...styles.iconButton, ...styles.addButton }}
              onClick={() => setIsOpen(true)}
              title="Adicionar laboratório"
              disabled={!amostraTerceirizada} // Desativa quando false
            >
              <Plus size={16} />
            </button>

            <button
              style={{ ...styles.iconButton, ...styles.searchButton }}
              onClick={() => alert('Pesquisar laboratório')}
              title="Pesquisar laboratório"
              disabled={!amostraTerceirizada} // Desativa quando false
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </div>
      </div>

  
    </div>

    
  );
case 'limpeza':
  return (
    <div style={styles.mainCard}>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>Eficácia Limpeza</h2>
      </div>
      <div style={styles.cardBody}>
        <div style={styles.grid12}>
          {/* Princípio ativo - linha completa */}
          <div style={styles.col12}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Princípio ativo</label>
              <input 
                type="text" 
                style={styles.input}
                placeholder="Digite o princípio ativo"
                value={principioAtivo}
                onChange={(e) => setPrincipioAtivo(e.target.value)}
              />
            </div>
          </div>

          {/* Produto anterior - linha completa */}
          <div style={styles.col12}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Produto anterior</label>
              <input 
                type="text" 
                style={styles.input}
                placeholder="Digite o produto anterior"
                value={produtoAnterior}
                onChange={(e) => setProdutoAnterior(e.target.value)}
              />
            </div>
          </div>

          {/* Lote - campo menor */}
          <div style={styles.col4}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Lote</label>
              <input 
                type="text" 
                style={styles.input}
                placeholder="Digite o lote"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
              />
            </div>
          </div>

          {/* Agente de limpeza - linha completa */}
          <div style={styles.col12}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Agente de limpeza</label>
              <input 
                type="text" 
                style={styles.input}
                placeholder="Digite o agente de limpeza"
                value={agenteLimpeza}
                onChange={(e) => setAgenteLimpeza(e.target.value)}
              />
            </div>
          </div>

          {/* Data - campos na mesma linha */}
          <div style={styles.col12}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Data</label>
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <input 
                  type="date" 
                  style={{...styles.input, width: '150px'}}
                  value={dataLimpeza}
                  onChange={(e) => setDataLimpeza(e.target.value)}
                />
                <select 
                  style={{...styles.select, width: '140px'}}
                  value={momentoLimpeza}
                  onChange={(e) => setMomentoLimpeza(e.target.value)}
                >
                  <option value="">Antes da limpeza</option>
                  <option value="depois">Depois da limpeza</option>
                </select>
                <input 
                  type="number" 
                  style={{...styles.input, width: '80px'}}
                  placeholder="0"
                  value={tempoDecorrido}
                  onChange={(e) => setTempoDecorrido(e.target.value)}
                />
                <select 
                  style={{...styles.select, width: '100px'}}
                  value={unidadeTempoDecorrido}
                  onChange={(e) => setUnidadeTempoDecorrido(e.target.value)}
                >
                  <option value="minutos">Minutos</option>
                  <option value="horas">Horas</option>
                  <option value="dias">Dias</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
      default:
        return renderCadastroContent();
    }
  };

const renderDadosContent = () => {
  const amostraAtiva = amostras.find(a => a.id === activeAmostraTab);
  const alfabeto = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  
  if (!amostraAtiva) return null;

  const amostraIndex = amostras.findIndex(a => a.id === activeAmostraTab);
  const labelAmostra = selectedReportType === 6
    ? `Amostra ${alfabeto[amostraIndex] || amostraIndex + 1}` 
    : `Amostra ${amostraIndex + 1}`;

  return (
    <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
      <div style={{fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '16px'}}>
        {labelAmostra}
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
              style={{...styles.secondaryButton, padding: '6px 10px'}}
              data-bg-color="secondary"
              onClick={() => limparAmostra(amostraAtiva.id)}
              onMouseEnter={(e) => handleButtonHover(e, true)}
              onMouseLeave={(e) => handleButtonHover(e, false)}
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <div style={{...styles.grid12, marginTop: '16px'}}>
        <div style={styles.col4}>
          <label style={styles.label}>Identificação</label>
          <select
            value={amostraAtiva.identificacao}
            onChange={(e) => atualizarAmostra(amostraAtiva.id, 'identificacao', e.target.value)}
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
              {identificacoes.map((legislacao) => (
                <option key={legislacao.id} value={legislacao.id}>
                  {legislacao.id1}
                </option>
              ))}
          </select>
        </div>
        <div style={styles.col4}>
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
        <div style={styles.col4}>
          <label style={styles.label}>Complemento</label>
          <textarea
            value={amostraAtiva.complemento}
            onChange={(e) => atualizarAmostra(amostraAtiva.id, 'complemento', e.target.value)}
            style={{...styles.textarea, minHeight: '32px'}}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          />
        </div>
      </div>

      <div style={{...styles.grid12, marginTop: '16px'}}>
        <div style={styles.col6}>
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
        <div style={styles.col6}>
          <label style={styles.label}>Item do orçamento</label>
          <select
              value={amostraAtiva.itemOrcamento !== null ? amostraAtiva.itemOrcamento : ''}
            onChange={(e) => atualizarAmostra(amostraAtiva.id, 'itemOrcamento', Number(e.target.value))}
            style={styles.select}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
          >
            <option value="">Selecione</option>
                {orcamentoItems.map((c) => <option key={c.id_item} value={c.id_item}>{c.descricao}</option>)}
          </select>
        </div>

{selectedReportType === 3 && (
    <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
        <div>
            <label style={styles.label}>Unidade Amostra</label>
            <select value={unidadeAmostraValue} onChange={(e) => setUnidadeAmostraValue(e.target.value)} style={{...styles.select, width: '190px'}}>
                <option value="">Selecione</option>
                <option value="opcao1">Opção 1</option>
                <option value="opcao2">Opção 2</option>
            </select>
        </div>
        <div>
            <label style={styles.label}>Forma de Coleta</label>
            <select value={formaDeColetaValue} onChange={(e) => setFormaDeColetaValue(e.target.value)} style={{...styles.select, width: '190px'}}>
                <option value="">Selecione</option>
                <option value="opcao1">Opção 1</option>
                <option value="opcao2">Opção 2</option>
            </select>
        </div>
        <div>
            <label style={styles.label}>Unidade Área Amostrada</label>
            <select value={unidadeAreaAmostradaValue} onChange={(e) => setUnidadeAreaAmostradaValue(e.target.value)} style={{...styles.select, width: '190px'}}>
                <option value="">Selecione</option>
                <option value="opcao1">Opção 1</option>
                <option value="opcao2">Opção 2</option>
            </select>
        </div>
        <div>
            <label style={styles.label}>Área Amostrada</label>
            <input
                type="text"
                value={areaAmostradaValue}
                onChange={(e) => setAreaAmostradaValue(e.target.value)}
                style={{...styles.input, width: '190px'}}
            />
        </div>
    </div>
)}

{selectedReportType === 4 && (
    <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
        <div>
            <label style={styles.label}>Unidade Amostra</label>
            <select value={unidadeAmostraValue} onChange={(e) => setUnidadeAmostraValue(e.target.value)} style={{...styles.select, width: '190px'}}>
                <option value="">Selecione</option>
                <option value="opcao1">Opção 1</option>
                <option value="opcao2">Opção 2</option>
            </select>
        </div>
        <div>
            <label style={styles.label}>Forma de Coleta</label>
            <select value={formaDeColetaValue} onChange={(e) => setFormaDeColetaValue(e.target.value)} style={{...styles.select, width: '190px'}}>
                <option value="">Selecione</option>
                <option value="opcao1">Opção 1</option>
                <option value="opcao2">Opção 2</option>
            </select>
        </div>
    </div>
)}

{selectedReportType === 7 && (
    <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
         <div>
            <label style={styles.label}>Protocolo do Cliente</label>
            <input
                type="text"
                value={protocoloCliente}
                onChange={(e) => setProtocoloCliente(e.target.value)}
                style={{...styles.input, width: '190px'}}
            />
        </div>
         <div>
            <label style={styles.label}>Remessa do Cliente</label>
            <input
                type="text"
                value={remessaCliente}
                onChange={(e) => setRemessaCliente(e.target.value)}
                style={{...styles.input, width: '190px'}}
            />
        </div>
    </div>
)}

      </div>
    </div>
  );
};
  const renderParametrosContent = () => {
    // Encontra a amostra ativa para passar seu estado de parâmetros ao seletor
    const amostraAtiva = amostras.find((a) => a.id === activeAmostraTab);

    if (!amostraAtiva) {
      return <div>Por favor, selecione uma amostra para configurar os parâmetros.</div>;
    }

    // Função genérica para atualizar qualquer campo da amostra ativa
    const atualizarCampoAmostraAtiva = (campo: keyof Amostra, valor: any) => {
      atualizarAmostra(amostraAtiva.id, campo, valor);
    };

    return (
      <div>
        <ParametrosSelector
          
          parametros={parametrosBase}
          
          // Estado específico da amostra ativa
          disponiveis={amostraAtiva.parametrosDisponiveis}
          selecionados={amostraAtiva.parametrosSelecionados}
          checkedDisponiveis={amostraAtiva.checkedDisponiveis}
          checkedSelecionados={amostraAtiva.checkedSelecionados}
          
          // Funções "setter" que modificam o estado da amostra ativa
          setDisponiveis={(value) => atualizarCampoAmostraAtiva("parametrosDisponiveis", value)}
          setSelecionados={(value) => atualizarCampoAmostraAtiva("parametrosSelecionados", value)}
          setCheckedDisponiveis={(value) => atualizarCampoAmostraAtiva("checkedDisponiveis", value)}
          setCheckedSelecionados={(value) => atualizarCampoAmostraAtiva("checkedSelecionados", value)}
        />
      </div>
    );
  };

const renderSampleSection = () => {
const handleCadastrar = async () => {
  // 1. Validação inicial
  if (!selectedClienteObj) {
    alert("Erro: Nenhum cliente foi selecionado. Por favor, selecione um cliente para continuar.");
    return;
  }

  const legislacaoSelecionada = legislacoes.find(l => l.nome === selectedLegislacao);

  const dadosCadastro = {
    dados_gerais: {
      // Dados do cliente
      cliente_id: selectedClienteObj.id,
      cliente_nome: selectedClienteObj.fantasia || "",
      consultor_id: selectedConsultor ? parseInt(selectedConsultor) : null,
      
      // Datas e horários
      data_inicio: startDate,
      hora_inicio: startTime,
      data_coleta: collectDate,
      hora_coleta: collectTime,
      data_entrada_lab: labEntryDate,
      hora_entrada_lab: labEntryTime,
      
      // Dados da coleta
      coletor: 101,
      nome_coletor: collectorName,
      procedimento_amostragem: samplingProcedure,
      categoria_id: category ? parseInt(category) : null,
      acompanhante: companion,
      
      // Configurações
      orcamento: budget,
      dados_amostragem: samplingData,
      controle_qualidade: qualityControl,
      vazao: flow,
      unidade_vazao: flowUnit,
      vazao_cliente: vazaoClient,
      
      // Contatos
      email_solicitante: emailSolicitante,
      solicitante_id: selectedSolicitanteObj?.id || null,
      
      // Metodologias e configurações técnicas
      metodologias_selecionadas: selectedMethodologies.map(m => m.id),
      acreditacao_id: selectedAcreditacao ? parseInt(selectedAcreditacao) : null,
      legislacao_id: legislacaoSelecionada?.id || null,
      terceirizado_id: null, // Adicione se tiver esse campo
      orcamento_id: selectedOrcamento ? parseInt(selectedOrcamento) : null,
      setores_selecionados: setoresSelecionados.map(s => s.id),
      
      // Configurações específicas
      amostra_terceirizada: amostraTerceirizada,
      tipo_analise: tipoAnalise,
      laboratorio: laboratorio,
      
      // Unidades e forma de coleta
      unidade_amostra: unidadeAmostraValue || "",
      forma_coleta: formaDeColetaValue || "",
      unidade_area_amostrada: unidadeAreaAmostradaValue || "",
      area_amostrada: areaAmostradaValue || "",
      
      // Tipo de relatório
      tipo_relatorio: selectedReportType,
      mesmo_horario_todas_amostras: sameTimeForAllSamples,
      
      // Campos condicionais para eficácia de limpeza
      ...(selectedReportType === 3 && {
        principio_ativo: principioAtivo || null,
        produto_anterior: produtoAnterior || null,
        lote: lote || null,
        agente_limpeza: agenteLimpeza || null,
        data_limpeza: dataLimpeza || null,
        momento_limpeza: momentoLimpeza || null,
        tempo_decorrido: tempoDecorrido || null,
        unidade_tempo_decorrido: unidadeTempoDecorrido || null,
      }),
      
      // Campos condicionais IN 60
      ...(selectedReportType === 7 && {
        protocolo_cliente: protocoloCliente || null,
        remessa_cliente: remessaCliente || null,
      })
    },
    
    // Amostras com todos os campos
    amostras: amostras.map((amostra, index) => {
      const baseAmostra = {
        id: amostra.id, 
        numero: amostra.numero,
        hora_coleta: amostra.horaColeta,
        identificacao: amostra.identificacao,
        temperatura: amostra.temperatura,
        complemento: amostra.complemento,
        condicoes_ambientais: amostra.condicoesAmbientais,
        item_orcamento: amostra.itemOrcamento,
        parametros_selecionados: amostra.parametrosSelecionados || []
      };

      return baseAmostra;
    })
  };

  // Garantir que campos obrigatórios string não sejam undefined/null
  if (!dadosCadastro.dados_gerais.cliente_nome) {
    dadosCadastro.dados_gerais.cliente_nome = "";
  }
  if (!dadosCadastro.dados_gerais.vazao) {
    dadosCadastro.dados_gerais.vazao = "";
  }
  if (!dadosCadastro.dados_gerais.unidade_vazao) {
    dadosCadastro.dados_gerais.unidade_vazao = "";
  }
  if (!dadosCadastro.dados_gerais.tipo_analise) {
    dadosCadastro.dados_gerais.tipo_analise = "";
  }
  if (!dadosCadastro.dados_gerais.laboratorio) {
    dadosCadastro.dados_gerais.laboratorio = "";
  }

  alert(JSON.stringify(dadosCadastro, null, 2));

  try {
    await invoke('cadastrar_amostra_completa', { dadosCadastro: dadosCadastro });
    alert("Amostra cadastrada com sucesso!");
  } catch (error) {
    console.error("Erro ao tentar cadastrar amostra:", error);
    alert(`Ocorreu um erro ao cadastrar: ${error}`);
  }
};

  return (

    <div style={styles.sampleContainer}>
              {showSuccessModal && <SuccessModal />}
        {showErrorModal && <ErrorModal />}
      <div style={styles.sampleTabsContainer}>
        <div style={styles.sampleTabsList}>
          {amostras.map((amostra, index) => (
            <button
              key={amostra.id}
              style={{
                ...styles.sampleTab,
                ...(activeAmostraTab === amostra.id ? styles.sampleTabActive : {})
              }}
              onClick={() => setActiveAmostraTab(amostra.id)}
            >
              <span>Amostra {index + 1}</span>
              {amostras.length > 1 && (
                <button
                  style={styles.removeSampleButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    removerAmostra(amostra.id);
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
            data-bg-color="primary"
          >
            <PlusIcon />
            <span>Adicionar</span>
          </button>
        </div>
      </div>
      <div style={styles.sampleContentWithSidebar}>
        <div style={styles.sampleSidebar}>
          <button
            style={{
              ...styles.sampleSidebarTab,
              ...(activeSampleSidebarTab === 'dados' ? styles.sampleSidebarTabActive : {})
            }}
            onClick={() => setActiveSampleSidebarTab('dados')}
          >
            <ClipboardPen />
          </button>
          <button
            style={{
              ...styles.sampleSidebarTab,
              ...(activeSampleSidebarTab === 'parametros' ? styles.sampleSidebarTabActive : {})
            }}
            onClick={() => setActiveSampleSidebarTab('parametros')}
          >
            <TestTubeDiagonal />
          </button>
        </div>
        <div style={styles.sampleMainContent}>
          {activeSampleSidebarTab === 'dados' && renderDadosContent()}
          {activeSampleSidebarTab === 'parametros' && renderParametrosContent()}
        </div>
      </div>
      
      {/* Row específica para o botão Cadastrar */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '16px',
        borderTop: '1px solid #e5e7eb',
        marginTop: '16px'
      }}>
        <button
          onClick={handleCadastrar}
          style={styles.primaryButton}
        >
          Cadastrar
        </button>
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
        showLimpeza={shouldShowLimpeza}
      />
      
      
      <div style={styles.mainContent}>
        <div style={styles.maxWidth}>
          {error && <div style={styles.errorContainer}>{error}</div>}
        
              <>
                {renderContent()}
                {renderSampleSection()}
              </>
        
        </div>
      </div>
            {isOpen && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={{ marginBottom: '10px' }}>Cadastrar Fornecedor</h2>
            
            <label>Nome</label>
            <input type="text" style={styles.input} />

            <label>CNPJ</label>
            <input type="text" style={styles.input} placeholder="__.___.___/____-__" />

            <label>Telefone</label>
            <input type="text" style={styles.input} placeholder="(  ) ____-____" />

            <label>E-mail</label>
            <input type="email" style={styles.input} />

            <div style={styles.actions}>
              <button style={styles.btnPrimary}>Cadastrar</button>
              <button style={styles.btnSecondary} onClick={() => setIsOpen(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
};

export default CadastrarAmostra;