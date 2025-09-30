import React, { useState, useMemo, useCallback, memo } from "react";
import { 
  FileSpreadsheet, 
  FileText, 
  MessageSquare, 
  Plus, 
  Eye, 
  FileCheck, 
  BookOpen, 
  Users, 
  Package, 
  DollarSign, 
  Search, 
  Phone, 
  BarChart3, 
  AlertTriangle, 
  Boxes,
  Award,
  Settings,
  TrendingUp,
  Shield,
  Truck,
  X,
  Filter
} from "lucide-react";
import styles from './css/Qualidade.module.css';
import { WindowManager } from '../hooks/WindowManager';
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

export const Qualidade: React.FC = memo(() => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Dados estáticos memoizados para melhor performance
  const menuSections = useMemo(() => [
    {
      id: "planilhas",
      title: "Planilhas Certificadas",
      icon: FileSpreadsheet,
      color: styles["bg-green-500"],
      category: "documentos",
      items: [
        { name: "Criar Planilha", icon: FileText, description: " Criar Planilha Certificada" },
        { name: "Visualizar ou Preencher", icon: Eye, description: "Consultar Dados das Planilhas" }
      ]
    },
    {
      id: "pesquisa",
      title: "Pesquisa de Satisfação",
      icon: MessageSquare,
      color: styles["bg-green-600"],
      category: "pesquisas",
      items: [
        { name: "Cadastrar Pesquisa", icon: Plus, description: "Criar nova pesquisa de satisfação" },
        { name: "Visualizar Pesquisa", icon: Eye, description: "Ver resultados das pesquisas" }
      ]
    },
    {
      id: "copias",
      title: "Cópias Controladas",
      icon: FileCheck,
      color: styles["bg-green-500"],
      category: "documentos",
      items: [
        { name: "Registro", icon: BookOpen, description: "Registrar cópias controladas" },
        { name: "Manifestação", icon: MessageSquare, description: "Gerenciar manifestações" },
        { name: "Visualizar", icon: Eye, description: "Consultar cópias registradas" }
      ]
    },
    {
      id: "acreditacao",
      title: "Acreditação",
      icon: Award,
      color: styles["bg-green-600"],
      category: "certificações",
      items: [
        { name: "Cadastro", icon: Plus, description: "Cadastrar nova acreditação" },
        { name: "Escopo", icon: FileText, description: "Definir escopo de acreditação" }
      ]
    },
    {
      id: "fornecedor",
      title: "Fornecedor",
      icon: Truck,
      color: styles["bg-green-500"],
      category: "fornecedores",
      items: [
        { name: "Cadastrar Fornecedor", icon: Plus, description: "Adicionar novo fornecedor" },
        { name: "Visualizar Fornecedor", icon: Eye, description: "Consultar dados dos fornecedores" },
        { name: "Visualizar Qualificações", icon: Shield, description: "Ver qualificações dos fornecedores" }
      ]
    },
    {
      id: "cabecalho",
      title: "Cabeçalho",
      icon: Settings,
      color: styles["bg-green-600"],
      category: "configurações",
      items: [
        { name: "Cadastro", icon: Plus, description: "Configurar cabeçalhos" },
        { name: "Padrão", icon: FileText, description: "Definir padrões de cabeçalho" }
      ]
    },
    {
      id: "estoque",
      title: "Estoque",
      icon: Package,
      color: styles["bg-green-500"],
      category: "estoque",
      items: [
        { name: "Cadastrar", icon: Plus, description: "Adicionar itens ao estoque" },
        { name: "Gerenciar", icon: Settings, description: "Gerenciar estoque existente" }
      ]
    },
    {
      id: "orcamento",
      title: "Orçamento",
      icon: DollarSign,
      color: styles["bg-green-600"],
      category: "financeiro",
      items: [
        { name: "Criar Orçamento", icon: Plus, description: "Elaborar novo orçamento" },
        { name: "Visualizar", icon: Eye, description: "Consultar orçamentos existentes" }
      ]
    },
    {
      id: "rastreabilidade",
      title: "Rastreabilidade",
      icon: Search,
      color: styles["bg-green-500"],
      category: "controle",
      items: [
        { name: "Rastrear Produtos", icon: Search, description: "Rastrear produtos no sistema" },
        { name: "Histórico", icon: FileText, description: "Consultar histórico de rastreamento" }
      ]
    },
    {
      id: "sac",
      title: "SAC",
      icon: Phone,
      color: styles["bg-green-600"],
      category: "atendimento",
      items: [
        { name: "Fale Conosco", icon: MessageSquare, description: "Canal de comunicação" },
        { name: "Atendimentos", icon: Users, description: "Gerenciar atendimentos" }
      ]
    }
  ], []);

  const cards = useMemo(() => [
    {
      title: "Pesquisas",
      value: "24",
      change: "+12%",
      icon: MessageSquare,
      color: `${styles["bg-green-100"]} ${styles["text-green-800"]}`,
      trend: "positive"
    },
    {
      title: "Manifestações",
      value: "8",
      change: "-3%",
      icon: AlertTriangle,
      color: `${styles["bg-orange-100"]} ${styles["text-orange-800"]}`,
      trend: "negative"
    },
    {
      title: "Qualificações de Fornecedores",
      value: "156",
      change: "+8%",
      icon: Shield,
      color: `${styles["bg-blue-100"]} ${styles["text-blue-800"]}`,
      trend: "positive"
    },
    {
      title: "Estoque Baixo",
      value: "12",
      change: "+2",
      icon: Package,
      color: `${styles["bg-red-100"]} ${styles["text-red-800"]}`,
      trend: "warning"
    },
    {
      title: "Controle de Insumos",
      value: "89%",
      change: "+5%",
      icon: Boxes,
      color: `${styles["bg-green-100"]} ${styles["text-green-800"]}`,
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
      case "Visualizar ou Preencher":
      
        break;

      case "Criar Planilha":
           WindowManager.openCreatePlanilha();
        break;
      
      case "Cadastrar Fornecedor":
        console.log("Ação: Abrir tela de cadastro de fornecedor!");
        WindowManager.openCadastrarFornecedor();
        break;

      case "Cadastrar Pesquisa":
        console.log("Ação: Abrir tela de cadastro de pesquisa!");
        WindowManager.openCadastrarPesquisa();
        break;

      case "Visualizar Pesquisa":
        console.log("Ação: Abrir tela de cadastro de pesquisa!");
        WindowManager.openGerenciarPesquisas();
        break;


      case "Visualizar Pesquisa":
        console.log("Ação: Mostrar resultados das pesquisas de satisfação!");
        // TODO: Adicionar lógica para carregar e exibir os dados da pesquisa.
        break;



      case "Visualizar Fornecedor":
        console.log("Ação: Abrir tela de visualização de fornecedores!");
        WindowManager.openVisualizarFornecedores();
        break;

      case "Visualizar Qualificações":
        console.log("Ação: Abrir tela de visualização de qualificações!");
        WindowManager.openVisualizarQualificacoes();
        break;
      

      // O 'default' é executado se nenhum dos casos acima corresponder.
      default:
        console.log(`Nenhuma ação definida para: ${itemName}`);
        break;
    }
  }, []); // Se usar 'navigate' do react-router-dom, adicione-o ao array de dependências.

  return (
    <div className={styles["qualidade-container"]}>
      {/* Header */}
      <header className={styles["qualidade-header"]}>
        <div className={styles["qualidade-header-content"]}>
          <div className={styles["qualidade-header-flex"]}>
            <div className={styles["qualidade-header-left"]}>
              <div className={styles["qualidade-icon-container"]}>
                <Shield className={styles["qualidade-icon"]} />
              </div>
              <div>
                <h1 className={styles["qualidade-title"]}>Qualidade</h1>
                <p className={styles["qualidade-subtitle"]}>Controle e Gestão da Qualidade</p>
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
            <h3 className={styles["qualidade-status-title"]}>Status Geral do Sistema</h3>
            <div className={styles["qualidade-status-trend"]}>
              <TrendingUp />
              <span className={styles["qualidade-status-trend-text"]}>Tendência Positiva</span>
            </div>
          </div>
          
          <div className={styles["qualidade-status-grid"]}>
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-green-100"]}`}>
                <BarChart3 className={styles["text-green-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Conformidade</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-green-600"]}`}>94%</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-green"]}`} style={{width: '94%'}}></div>
              </div>
            </div>
            
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-blue-100"]}`}>
                <Users className={styles["text-blue-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Satisfação</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-blue-600"]}`}>87%</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-blue"]}`} style={{width: '87%'}}></div>
              </div>
            </div>
            
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-orange-100"]}`}>
                <AlertTriangle className={styles["text-orange-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Pendências</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-orange-600"]}`}>6</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-orange"]}`} style={{width: '20%'}}></div>
              </div>
            </div>
            
            <div className={styles["qualidade-status-item"]}>
              <div className={`${styles["qualidade-status-item-icon"]} ${styles["bg-purple-100"]}`}>
                <Award className={styles["text-purple-600"]} />
              </div>
              <h4 className={styles["qualidade-status-item-title"]}>Certificações</h4>
              <p className={`${styles["qualidade-status-item-value"]} ${styles["text-purple-600"]}`}>12</p>
              <div className={styles["qualidade-status-progress"]}>
                <div className={`${styles["qualidade-status-progress-bar"]} ${styles["progress-purple"]}`} style={{width: '100%'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

Qualidade.displayName = 'Qualidade';
