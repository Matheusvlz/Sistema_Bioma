import React, { useState, useMemo, useCallback, memo, useEffect} from "react";
import { 
  FileSpreadsheet, 
  FileText, 
  MessageSquare, 
  Plus, 
  Eye, 
  Users, 
  Package, 
  Search, 
  BarChart3, 
  AlertTriangle, 
  Boxes,
  Settings,
  TrendingUp,
  FlaskConical,
  X,
  Filter,
  TestTube,
  Clipboard,
  Edit,
  FolderOpen,
  CheckCircle,
  Beaker,
  FileBarChart,
  Printer,
  Globe,
  ShoppingCart,
  Database,
  Thermometer,
  Lock,
  Clock,
  Calendar,
  User,
  Building,
  RefreshCcw,
  XCircle

} from "lucide-react";
import { invoke } from '@tauri-apps/api/core';
import styles from './css/Laboratorio.module.css';
import { WindowManager } from '../hooks/WindowManager';
// Interfaces para tipagem
interface ChecagemItem {
  fantasia?: string;
  razao?: string;
  max_numero: number;
  min_numero: number;
}

interface AmostraNaoIniciadaItem {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
}

interface AmostraEmAnaliseItem {
  id: number;
  numero?: string;
  identificacao?: string;
  tempo?: string;
  passou: boolean;
  fantasia?: string;
  razao?: string;
}

interface TemperaturaItem {
  id: number;
  fantasia?: string;
  razao?: string;
  min_numero?: string;
  max_numero?: string;
}

interface AmostraFinalizadaItem {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
}

interface AmostraBloqueadaItem {
  id: number;
  numero?: string;
  identificacao?: string;
  fantasia?: string;
  razao?: string;
  usuario_bloqueio?: string;
}

interface RegistroInsumoItem {
  id: number;
  nome?: string;
  data_registro?: string;
  usuario_registro?: string;
}

interface LaboratorioResponse {
  success: boolean;
  data?: any;
  message?: string;
  tipo: string;
}

// Componente de Card otimizado com memo e click handler
const StatusCard = memo(({ card, onClick }: { card: any, onClick: () => void }) => (
  <div 
    className={`${styles["qualidade-card"]} ${styles[`card-${card.trend}`]} ${styles["clickable-card"]}`}
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <div className={styles["qualidade-card-header"]}>
      <div className={`${styles["qualidade-card-icon"]} ${card.color}`}>
        <card.icon />
      </div>
      <span className={`${styles["qualidade-card-change"]} ${
        card.change.startsWith('+') ? `${styles["bg-green-100"]} ${styles["text-green-800"]}` : 
        card.change.startsWith('-') ? `${styles["bg-red-100"]} ${styles["text-red-800"]}` : 
        `${styles["bg-gray-100"]} ${styles["text-gray-800"]}`
      }`}>
        {card.change}
      </span>
    </div>
    <h3 className={styles["qualidade-card-value"]}>{card.value}</h3>
    <p className={styles["qualidade-card-title"]}>{card.title}</p>
    <div className={styles["qualidade-card-trend"]}>
      <TrendingUp className={styles[`trend-${card.trend}`]} />
    </div>
  </div>
));

// Componente Modal genérico
const Modal = memo(({ isOpen, onClose, title, children }: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles["modal-overlay"]} onClick={onClose}>
      <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
        <div className={styles["modal-header"]}>
          <h2 className={styles["modal-title"]}>{title}</h2>
          <button 
            className={styles["modal-close"]} 
            onClick={onClose}
            aria-label="Fechar modal"
          >
            <X />
          </button>
        </div>
        <div className={styles["modal-body"]}>
          {children}
        </div>
      </div>
    </div>
  );
});

// Componente para lista de itens genérica
const ItemList = memo(({ items, renderItem, emptyMessage }: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  emptyMessage: string;
}) => (
  <div className={styles["item-list"]}>
    {items.length === 0 ? (
      <div className={styles["empty-state"]}>
        <p>{emptyMessage}</p>
      </div>
    ) : (
      items.map((item, index) => renderItem(item, index))
    )}
  </div>
));

// Componente de Item de Seção otimizado
const SectionItem = memo(({ item, onItemClick }: { item: any; onItemClick: (name: string) => void }) => {
  const handleClick = useCallback(() => {
    onItemClick(item.name);
  }, [item.name, onItemClick]);

  return (
    <button
      className={styles["qualidade-section-item"]}
      onClick={handleClick}
      title={item.description}
    >
      <div className={styles["qualidade-section-item-icon"]}>
        <item.icon />
      </div>
      <div className={styles["qualidade-section-item-content"]}>
        <span className={styles["qualidade-section-item-text"]}>
          {item.name}
        </span>
        <span className={styles["qualidade-section-item-description"]}>
          {item.description}
        </span>
      </div>
    </button>
  );
});

// Componente de Seção otimizado
const SectionCard = memo(({ section, searchTerm, onItemClick }: { 
  section: any; 
  searchTerm: string; 
  onItemClick: (name: string) => void;
}) => (
  <div className={`${styles["qualidade-section-card"]} ${searchTerm ? styles["search-highlight"] : ""}`}>
    <div className={`${styles["qualidade-section-header"]} ${section.color}`}>
      <div className={styles["qualidade-section-header-content"]}>
        <div>
          <h3 className={styles["qualidade-section-title"]}>{section.title}</h3>
          <p className={styles["qualidade-section-subtitle"]}>
            {section.items.length} opções disponíveis
          </p>
          <span className={styles["qualidade-section-category"]}>
            {section.category}
          </span>
        </div>
        <section.icon className={styles["qualidade-section-icon"]} />
      </div>
    </div>
    
    <div className={styles["qualidade-section-body"]}>
      <div className={styles["qualidade-section-items"]}>
        {section.items.map((item: any, index: number) => (
          <SectionItem 
            key={`${section.id}-${index}`} 
            item={item} 
            onItemClick={onItemClick}
          />
        ))}
      </div>
    </div>
  </div>
));

export const Laboratorio: React.FC = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Estados para dados
  const [checagemData, setChecagemData] = useState<ChecagemItem[]>([]);
  const [amostrasNaoIniciadas, setAmostrasNaoIniciadas] = useState<AmostraNaoIniciadaItem[]>([]);
  const [amostrasEmAnalise, setAmostrasEmAnalise] = useState<AmostraEmAnaliseItem[]>([]);
  const [temperaturaData, setTemperaturaData] = useState<TemperaturaItem[]>([]);
  const [amostrasFinalizadas, setAmostrasFinalizadas] = useState<AmostraFinalizadaItem[]>([]);
  const [amostrasBloqueadas, setAmostrasBloqueadas] = useState<AmostraBloqueadaItem[]>([]);
  const [registroInsumo, setRegistroInsumo] = useState<RegistroInsumoItem[]>([]);

  // Estados para modais
  const [modalStates, setModalStates] = useState({
    checagem: false,
    naoIniciadas: false,
    emAnalise: false,
    temperatura: false,
    finalizadas: false,
    bloqueadas: false,
    insumos: false
  });

  const [loadingStates, setLoadingStates] = useState({
    checagem: false,
    amostras: false,
    analises: false,
    temperatura: false,
    finalizada: false,
    bloqueadas: false,
    insumo: false
  });

  const setLoading = (key: keyof typeof loadingStates, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  };

  const openModal = (modalName: keyof typeof modalStates) => {
    setModalStates(prev => ({ ...prev, [modalName]: true }));
  };

  const closeModal = (modalName: keyof typeof modalStates) => {
    setModalStates(prev => ({ ...prev, [modalName]: false }));
  };

  // Funções para carregar dados
  const carregarChecagem = async () => {
    setLoading('checagem', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_checagem');
      if (response.success && response.data) {
        setChecagemData(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar checagem:', error);
    } finally {
      setLoading('checagem', false);
    }
  };

  const carregarAmostras = async () => {
    setLoading('amostras', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_nao_iniciada');
      if (response.success && response.data) {
        setAmostrasNaoIniciadas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar amostras não iniciadas:', error);
    } finally {
      setLoading('amostras', false);
    }
  };

  const carregarAnalises = async () => {
    setLoading('analises', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_em_analise');
      if (response.success && response.data) {
        setAmostrasEmAnalise(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setLoading('analises', false);
    }
  };

  const carregarTemperatura = async () => {
    setLoading('temperatura', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_temperatura');
      if (response.success && response.data) {
        setTemperaturaData(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar temperatura:', error);
    } finally {
      setLoading('temperatura', false);
    }
  };

  const carregarFinalizadas = async () => {
    setLoading('finalizada', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_amostras_finalizadas');
      if (response.success && response.data) {
        setAmostrasFinalizadas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar finalizadas:', error);
    } finally {
      setLoading('finalizada', false);
    }
  };

  const carregarBloqueadas = async () => {
    setLoading('bloqueadas', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_amostras_bloqueadas');
      if (response.success && response.data) {
        setAmostrasBloqueadas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar bloqueadas:', error);
    } finally {
      setLoading('bloqueadas', false);
    }
  };

  const carregarRegistroInsumo = async () => {
    setLoading('insumo', true);
    try {
      const response: LaboratorioResponse = await invoke('buscar_registro_insumo');
      if (response.success && response.data) {
        setRegistroInsumo(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar registro insumo:', error);
    } finally {
      setLoading('insumo', false);
    }
  };

  const carregarDados = () => {
    carregarChecagem();
    carregarAmostras();
    carregarAnalises();
    carregarTemperatura();
    carregarFinalizadas();
    carregarBloqueadas();
    carregarRegistroInsumo();
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Dados estáticos memoizados para melhor performance - Nova estrutura do laboratório
  const menuSections = useMemo(() => [
    {
      id: "amostra",
      title: "Amostra",
      icon: TestTube,
      color: styles["bg-blue-500"],
      category: "amostras",
      items: [
        { name: "Planilha", icon: FileSpreadsheet, description: "Gerenciar planilhas de amostras"},
        { name: "Cadastrar", icon: Plus, description: "Cadastrar nova amostra" },
        { name: "Personalizar", icon: Settings, description: "Personalizar configurações de amostra" },
        { name: "Alterar categoria", icon: Edit, description: "Alterar categoria da amostra" },
        { name: "Gerar coleta", icon: FolderOpen, description: "Gerar processo de coleta" },
        { name: "Coleta", icon: Package, description: "Gerenciar coletas" },
        { name: "Checagem", icon: CheckCircle, description: "Checagem de amostras" },
        { name: "Visualizar", icon: Eye, description: "Visualizar amostras cadastradas" }
      ]
    },
    {
      id: "ensaio",
      title: "Ensaio",
      icon: FlaskConical,
      color: styles["bg-green-500"],
      category: "ensaios",
      items: [
        { name: "Parâmetros", icon: Settings, description: "Configurar parâmetros de ensaio" },
        { name: "Amostras", icon: TestTube, description: "Gerenciar amostras para ensaio" },
        { name: "Resultados", icon: BarChart3, description: "Visualizar resultados de ensaios" }
      ]
    },
    {
      id: "relatorio",
      title: "Relatório de ensaios",
      icon: FileBarChart,
      color: styles["bg-purple-500"],
      category: "relatórios",
      items: [
        { name: "Observação de resultado", icon: MessageSquare, description: "Adicionar observações aos resultados" },
        { name: "Observação de resultado em grupo", icon: Users, description: "Observações em grupo de resultados" },
        { name: "Gerar", icon: FileText, description: "Gerar relatório de ensaios" },
        { name: "Imprimir", icon: Printer, description: "Imprimir relatórios" },
        { name: "Enviar para internet", icon: Globe, description: "Enviar relatórios via internet" }
      ]
    },
    {
      id: "insumo",
      title: "Insumo",
      icon: Boxes,
      color: styles["bg-orange-500"],
      category: "insumos",
      items: [
        { name: "Cadastrar matéria-prima", icon: Plus, description: "Cadastrar nova matéria-prima" },
        { name: "Registros matéria-prima", icon: Database, description: "Visualizar registros de matéria-prima" },
        { name: "Cadastrar insumo", icon: ShoppingCart, description: "Cadastrar novo insumo" },
        { name: "Registros insumo", icon: Clipboard, description: "Visualizar registros de insumos" },
        { name: "Meio de cultura", icon: Beaker, description: "Gerenciar meios de cultura" },
        { name: "Reagente para limpeza", icon: Package, description: "Gerenciar reagentes de limpeza" },
        { name: "Parâmetros", icon: Settings, description: "Configurar parâmetros de insumos" }
      ]
    },
    {
      id: "intercorrencias",
      title: "Intercorrências",
      icon: AlertTriangle,
      color: styles["bg-red-500"],
      category: "intercorrências",
      items: [
        { name: "Registrar", icon: Lock, description: "Registrar nova intercorrência" }
      ]
    }
  ], []);

  // Cards atualizados com dados reais
  const cards = useMemo(() => [
    {
      title: "Checagem de amostras",
      value: loadingStates.checagem ? "..." : checagemData.length.toString(),
      change: "0%",
      icon: CheckCircle,
      color: `${styles["bg-blue-100"]} ${styles["text-blue-800"]}`,
      trend: "neutral",
      onClick: () => openModal('checagem')
    },
    {
      title: "Amostras não iniciadas",
      value: loadingStates.amostras ? "..." : amostrasNaoIniciadas.length.toString(),
      change: "+3%",
      icon: TestTube,
      color: `${styles["bg-gray-100"]} ${styles["text-gray-800"]}`,
      trend: "positive",
      onClick: () => openModal('naoIniciadas')
    },
    {
      title: "Amostras em análise",
      value: loadingStates.analises ? "..." : amostrasEmAnalise.length.toString(),
      change: "-5%",
      icon: FlaskConical,
      color: `${styles["bg-yellow-100"]} ${styles["text-yellow-800"]}`,
      trend: "negative",
      onClick: () => openModal('emAnalise')
    },
    {
      title: "Temperatura",
      value: loadingStates.temperatura ? "..." : temperaturaData.length.toString(),
      change: "+1.2%",
      icon: Thermometer,
      color: `${styles["bg-orange-100"]} ${styles["text-orange-800"]}`,
      trend: "positive",
      onClick: () => openModal('temperatura')
    },
    {
      title: "Amostras finalizadas",
      value: loadingStates.finalizada ? "..." : amostrasFinalizadas.length.toString(),
      change: "0%",
      icon: CheckCircle,
      color: `${styles["bg-green-100"]} ${styles["text-green-800"]}`,
      trend: "neutral",
      onClick: () => openModal('finalizadas')
    },
    {
      title: "Amostras bloqueadas",
      value: loadingStates.bloqueadas ? "..." : amostrasBloqueadas.length.toString(),
      change: "+10%",
      icon: Lock,
      color: `${styles["bg-red-100"]} ${styles["text-red-800"]}`,
      trend: "warning",
      onClick: () => openModal('bloqueadas')
    },
    {
      title: "Registro de insumo",
      value: loadingStates.insumo ? "..." : registroInsumo.length.toString(),
      change: "+2.5%",
      icon: Package,
      color: `${styles["bg-purple-100"]} ${styles["text-purple-800"]}`,
      trend: "positive",
      onClick: () => openModal('insumos')
    }
  ], [
    loadingStates,
    checagemData.length,
    amostrasNaoIniciadas.length,
    amostrasEmAnalise.length,
    temperaturaData.length,
    amostrasFinalizadas.length,
    amostrasBloqueadas.length,
    registroInsumo.length
  ]);

  // Filtrar seções baseado no termo de pesquisa - otimizado
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return menuSections;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return menuSections.filter(section => {
      const titleMatch = section.title.toLowerCase().includes(lowerSearchTerm);
      const categoryMatch = section.category.toLowerCase().includes(lowerSearchTerm);
      const itemsMatch = section.items.some(item => 
        item.name.toLowerCase().includes(lowerSearchTerm) ||
        item.description.toLowerCase().includes(lowerSearchTerm)
      );
      
      return titleMatch || categoryMatch || itemsMatch;
    });
  }, [searchTerm, menuSections]);



  // Callbacks otimizados
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setShowSearch(false);
  }, []);

  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev);
    if (showSearch) {
      setSearchTerm("");
    }
  }, [showSearch]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleItemClick = useCallback((itemName: string) => {
    // Usamos um switch para decidir o que fazer com base no nome do item
    switch (itemName) {
      case "Planilha":
       WindowManager.openPlanilha();
        break;

      case "Cadastrar":
        console.log("Ação: Cadastrar nova amostra!");
        WindowManager.openCadastrarAmostra();
        break;
      
      case "Personalizar":
        console.log("Ação: Personalizar configurações!");
        break;

      case "Alterar categoria":
        console.log("Ação: Alterar categoria da amostra!");
        break;

      case "Gerar coleta":
        console.log("Ação: Gerar processo de coleta!");
        break;

      case "Coleta":
        console.log("Ação: Gerenciar coletas!");
        break;

      case "Checagem":
        console.log("Ação: Checagem de amostras!");
        openModal('checagem');
        break;

      case "Visualizar":
        console.log("Ação: Visualizar amostras!");
        break;

      // ... outros cases permanecem iguais
      default:
        console.log(`Nenhuma ação definida para: ${itemName}`);
        break;
    }
  }, []);

  // Render functions para os modais
  const renderChecagemItem = (item: ChecagemItem, index: number) => (
    <div key={index} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <Building className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>{item.fantasia || 'N/A'}</h4>
          <p>{item.razao || 'N/A'}</p>
        </div>
      </div>
      <div className={styles["item-details"]}>
        <span>Min: {item.min_numero}</span>
        <span>Max: {item.max_numero}</span>
      </div>
    </div>
  );

  const renderAmostraNaoIniciadaItem = (item: AmostraNaoIniciadaItem, index: number) => (
    <div key={item.id} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <TestTube className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>#{item.numero || 'N/A'}</h4>
          <p>{item.identificacao || 'Sem identificação'}</p>
        </div>
      </div>
      <div className={styles["item-details"]}>
        <span>{item.fantasia || item.razao || 'N/A'}</span>
      </div>
    </div>
  );

  const renderAmostraEmAnaliseItem = (item: AmostraEmAnaliseItem, index: number) => (
    <div key={item.id} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <FlaskConical className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>#{item.numero || 'N/A'}</h4>
          <p>{item.identificacao || 'Sem identificação'}</p>
        </div>
        {item.passou ? (
          <CheckCircle className={`${styles["status-icon"]} ${styles["status-success"]}`} />
        ) : (
          <XCircle className={`${styles["status-icon"]} ${styles["status-error"]}`} />
        )}
      </div>
      <div className={styles["item-details"]}>
        <span><Clock /> {item.tempo || 'N/A'}</span>
        <span>{item.fantasia || item.razao || 'N/A'}</span>
      </div>
    </div>
  );

  const renderTemperaturaItem = (item: TemperaturaItem, index: number) => (
    <div key={item.id} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <Thermometer className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>{item.fantasia || 'N/A'}</h4>
          <p>{item.razao || 'N/A'}</p>
        </div>
      </div>
      <div className={styles["item-details"]}>
        <span>Min: {item.min_numero || 'N/A'}</span>
        <span>Max: {item.max_numero || 'N/A'}</span>
      </div>
    </div>
  );

  const renderAmostraFinalizadaItem = (item: AmostraFinalizadaItem, index: number) => (
    <div key={item.id} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <CheckCircle className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>#{item.numero || 'N/A'}</h4>
          <p>{item.identificacao || 'Sem identificação'}</p>
        </div>
      </div>
      <div className={styles["item-details"]}>
        <span>{item.fantasia || item.razao || 'N/A'}</span>
      </div>
    </div>
  );

  const renderAmostraBloqueadaItem = (item: AmostraBloqueadaItem, index: number) => (
    <div key={item.id} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <Lock className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>#{item.numero || 'N/A'}</h4>
          <p>{item.identificacao || 'Sem identificação'}</p>
        </div>
      </div>
      <div className={styles["item-details"]}>
        <span>{item.fantasia || item.razao || 'N/A'}</span>
        {item.usuario_bloqueio && (
          <span><User /> {item.usuario_bloqueio}</span>
        )}
      </div>
    </div>
  );

  const renderRegistroInsumoItem = (item: RegistroInsumoItem, index: number) => (
    <div key={item.id} className={styles["item-card"]}>
      <div className={styles["item-header"]}>
        <Package className={styles["item-icon"]} />
        <div className={styles["item-info"]}>
          <h4>{item.nome || 'N/A'}</h4>
          <p>ID: {item.id}</p>
        </div>
      </div>
      <div className={styles["item-details"]}>
        {item.data_registro && (
          <span><Calendar /> {item.data_registro}</span>
        )}
        {item.usuario_registro && (
          <span><User /> {item.usuario_registro}</span>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles["qualidade-container"]}>
      {/* Header */}
      <header className={styles["qualidade-header"]}>
        <div className={styles["qualidade-header-content"]}>
          <div className={styles["qualidade-header-flex"]}>
            <div className={styles["qualidade-header-left"]}>
              <div className={styles["qualidade-icon-container"]}>
                <FlaskConical className={styles["qualidade-icon"]} />
              </div>
              <div>
                <h1 className={styles["qualidade-title"]}>Laboratório</h1>
                <p className={styles["qualidade-subtitle"]}>Sistema de Gestão Laboratorial</p>
              </div>
            </div>
            <div className={styles["qualidade-header-actions"]}>
              <button 
                className={styles["qualidade-search-toggle"]}
                onClick={toggleSearch}
                title="Pesquisar"
                aria-label="Alternar pesquisa"
              >
                <Search />
              </button>
                 <button
            className={styles["reload-button"]}
            onClick={carregarDados}
            title="Recarregar dados"
          >  <RefreshCcw /> </button>
            </div>
            
          </div>
        </div>
      </header>
       
      {/* Barra de Pesquisa */}
      {showSearch && (
        <div className={styles["qualidade-search-bar"]}>
          <div className={styles["qualidade-search-container"]}>
            <div className={styles["qualidade-search-input-wrapper"]}>
              <Search className={styles["qualidade-search-icon"]} />
              <input
                type="text"
                placeholder="Pesquisar por módulos, funcionalidades ou categorias..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles["qualidade-search-input"]}
                autoFocus
                aria-label="Campo de pesquisa"
              />
              {searchTerm && (
                <button 
                  onClick={clearSearch}
                  className={styles["qualidade-search-clear"]}
                  title="Limpar pesquisa"
                  aria-label="Limpar pesquisa"
                >
                  <X />
                </button>
              )}
            </div>
            <div className={styles["qualidade-search-info"]}>
              <Filter className={styles["qualidade-filter-icon"]} />
              <span>
                {filteredSections.length} de {menuSections.length} módulos encontrados
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles["qualidade-main"]}>
        {/* Cards de Resumo */}
        <div className={styles["qualidade-cards-grid"]}>
          {cards.map((card, index) => (
            <StatusCard key={`card-${index}`} card={card} onClick={card.onClick} />
          ))}
        </div>

        {/* Resultado da pesquisa */}
        {searchTerm && (
          <div className={styles["qualidade-search-results"]}>
            <h3 className={styles["qualidade-search-results-title"]}>
              Resultados da pesquisa para "{searchTerm}"
            </h3>
            {filteredSections.length === 0 && (
              <div className={styles["qualidade-no-results"]}>
                <Search className={styles["qualidade-no-results-icon"]} />
                <p>Nenhum módulo encontrado para sua pesquisa.</p>
                <button onClick={clearSearch} className={styles["qualidade-clear-search-btn"]}>
                  Limpar pesquisa
                </button>
              </div>
            )}
          </div>
        )}

        {/* Menu Principal */}
        <div className={styles["qualidade-menu-grid"]}>
          {filteredSections.map((section) => (
            <SectionCard 
              key={section.id} 
              section={section} 
              searchTerm={searchTerm}
              onItemClick={handleItemClick}
            />
          ))}
        </div>

        {/* Gráfico de Status */}
        <div className={styles["qualidade-status"]}>
          <div className={styles["qualidade-status-header"]}>
            <h3 className={styles["qualidade-status-title"]}>Status Geral do Laboratório</h3>
            <div className={styles["qualidade-status-trend"]}>
              <TrendingUp />
              <span className={styles["qualidade-status-trend-text"]}>Operação Normal</span>
            </div>
          </div>
          
          <div className={styles["qualidade-status-grid"]}>
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-green-100"]}`}>
                <BarChart3 className={styles["text-green-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Eficiência</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-green-600"]}`}>92%</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-green"]}`} style={{width: '92%'}}></div>
              </div>
            </div>
            
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-blue-100"]}`}>
                <TestTube className={styles["text-blue-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Amostras Processadas</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-blue-600"]}`}>85%</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-blue"]}`} style={{width: '85%'}}></div>
              </div>
            </div>
            
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-orange-100"]}`}>
                <AlertTriangle className={styles["text-orange-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Alertas Ativos</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-orange-600"]}`}>3</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-orange"]}`} style={{width: '15%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <Modal
        isOpen={modalStates.checagem}
        onClose={() => closeModal('checagem')}
        title="Checagem de Amostras"
      >
        <ItemList
          items={checagemData}
          renderItem={renderChecagemItem}
          emptyMessage="Nenhuma checagem encontrada"
        />
      </Modal>

      <Modal
        isOpen={modalStates.naoIniciadas}
        onClose={() => closeModal('naoIniciadas')}
        title="Amostras Não Iniciadas"
      >
        <ItemList
          items={amostrasNaoIniciadas}
          renderItem={renderAmostraNaoIniciadaItem}
          emptyMessage="Nenhuma amostra não iniciada encontrada"
        />
      </Modal>

      <Modal
        isOpen={modalStates.emAnalise}
        onClose={() => closeModal('emAnalise')}
        title="Amostras em Análise"
      >
        <ItemList
          items={amostrasEmAnalise}
          renderItem={renderAmostraEmAnaliseItem}
          emptyMessage="Nenhuma amostra em análise encontrada"
        />
      </Modal>

      <Modal
        isOpen={modalStates.temperatura}
        onClose={() => closeModal('temperatura')}
        title="Controle de Temperatura"
      >
        <ItemList
          items={temperaturaData}
          renderItem={renderTemperaturaItem}
          emptyMessage="Nenhum registro de temperatura encontrado"
        />
      </Modal>

      <Modal
        isOpen={modalStates.finalizadas}
        onClose={() => closeModal('finalizadas')}
        title="Amostras Finalizadas"
      >
        <ItemList
          items={amostrasFinalizadas}
          renderItem={renderAmostraFinalizadaItem}
          emptyMessage="Nenhuma amostra finalizada encontrada"
        />
      </Modal>

      <Modal
        isOpen={modalStates.bloqueadas}
        onClose={() => closeModal('bloqueadas')}
        title="Amostras Bloqueadas"
      >
        <ItemList
          items={amostrasBloqueadas}
          renderItem={renderAmostraBloqueadaItem}
          emptyMessage="Nenhuma amostra bloqueada encontrada"
        />
      </Modal>

      <Modal
        isOpen={modalStates.insumos}
        onClose={() => closeModal('insumos')}
        title="Registro de Insumos"
      >
        <ItemList
          items={registroInsumo}
          renderItem={renderRegistroInsumoItem}
          emptyMessage="Nenhum registro de insumo encontrado"
        />
      </Modal>
    </div>
  );
});

StatusCard.displayName = 'StatusCard';
SectionItem.displayName = 'SectionItem';
SectionCard.displayName = 'SectionCard';
Modal.displayName = 'Modal';
ItemList.displayName = 'ItemList';
Laboratorio.displayName = 'Laboratorio';