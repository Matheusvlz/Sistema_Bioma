import React, { useState, useMemo, useCallback, memo } from "react";
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

} from "lucide-react";
import styles from './css/Laboratorio.module.css';

// Componente de Card otimizado com memo
const StatusCard = memo(({ card }: { card: any }) => (
  <div className={`${styles["qualidade-card"]} ${styles[`card-${card.trend}`]}`}>
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

  // Dados estáticos memoizados para melhor performance - Nova estrutura do laboratório
  const menuSections = useMemo(() => [
    {
      id: "amostra",
      title: "Amostra",
      icon: TestTube,
      color: styles["bg-blue-500"],
      category: "amostras",
      items: [
        { name: "Planilha", icon: FileSpreadsheet, description: "Gerenciar planilhas de amostras" },
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



 const cards = useMemo(() => [
  {
    title: "Checagem de amostras",
    value: "N/A",
    change: "0%",
    icon: CheckCircle,
    color: `${styles["bg-blue-100"]} ${styles["text-blue-800"]}`,
    trend: "neutral"
  },
  {
    title: "Amostras não iniciadas",
    value: "102",
    change: "+3%",
    icon: TestTube,
    color: `${styles["bg-gray-100"]} ${styles["text-gray-800"]}`,
    trend: "positive"
  },
  {
    title: "Amostras em análise",
    value: "173",
    change: "-5%",
    icon: FlaskConical,
    color: `${styles["bg-yellow-100"]} ${styles["text-yellow-800"]}`,
    trend: "negative"
  },
  {
    title: "Temperatura",
    value: "215",
    change: "+1.2%",
    icon: Thermometer,
    color: `${styles["bg-orange-100"]} ${styles["text-orange-800"]}`,
    trend: "positive"
  },
  {
    title: "Amostras finalizadas",
    value: "1",
    change: "0%",
    icon: CheckCircle,
    color: `${styles["bg-green-100"]} ${styles["text-green-800"]}`,
    trend: "neutral"
  },
  {
    title: "Amostras bloqueadas",
    value: "126",
    change: "+10%",
    icon: Lock,
    color: `${styles["bg-red-100"]} ${styles["text-red-800"]}`,
    trend: "warning"
  },
  {
    title: "Registro de insumo",
    value: "50",
    change: "+2.5%",
    icon: Package,
    color: `${styles["bg-purple-100"]} ${styles["text-purple-800"]}`,
    trend: "positive"
  }
], []);


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
        console.log("Ação: Abrir planilhas de amostras!");
        break;

      case "Cadastrar":
        console.log("Ação: Cadastrar nova amostra!");
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
        break;

      case "Visualizar":
        console.log("Ação: Visualizar amostras!");
        break;

      case "Parâmetros":
        console.log("Ação: Configurar parâmetros!");
        break;

      case "Amostras":
        console.log("Ação: Gerenciar amostras para ensaio!");
        break;

      case "Resultados":
        console.log("Ação: Visualizar resultados!");
        break;

      case "Observação de resultado":
        console.log("Ação: Adicionar observações!");
        break;

      case "Observação de resultado em grupo":
        console.log("Ação: Observações em grupo!");
        break;

      case "Gerar":
        console.log("Ação: Gerar relatório!");
        break;

      case "Imprimir":
        console.log("Ação: Imprimir relatórios!");
        break;

      case "Enviar para internet":
        console.log("Ação: Enviar relatórios!");
        break;

      case "Cadastrar matéria-prima":
        console.log("Ação: Cadastrar matéria-prima!");
        break;

      case "Registros matéria-prima":
        console.log("Ação: Ver registros de matéria-prima!");
        break;

      case "Cadastrar insumo":
        console.log("Ação: Cadastrar insumo!");
        break;

      case "Registros insumo":
        console.log("Ação: Ver registros de insumos!");
        break;

      case "Meio de cultura":
        console.log("Ação: Gerenciar meios de cultura!");
        break;

      case "Reagente para limpeza":
        console.log("Ação: Gerenciar reagentes!");
        break;

      case "Registrar":
        console.log("Ação: Registrar intercorrência!");
        break;

      default:
        console.log(`Nenhuma ação definida para: ${itemName}`);
        break;
    }
  }, []);

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
        {/* Headers das seções */}
     

        {/* Cards de Resumo */}
        <div className={styles["qualidade-cards-grid"]}>
          {cards.map((card, index) => (
            <StatusCard key={`card-${index}`} card={card} />
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
    </div>
  );
});

StatusCard.displayName = 'StatusCard';
SectionItem.displayName = 'SectionItem';
SectionCard.displayName = 'SectionCard';
Laboratorio.displayName = 'Laboratorio';