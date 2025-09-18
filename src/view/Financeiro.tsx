import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  FileText,
  CreditCard,
  Receipt,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  Settings,
  Download,
  Upload,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Building2,
  Package2,
  ShoppingBag,
  FileBarChart,
  Send,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUpDown,
  Activity,
  Target,
  Zap,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import styles from './styles/Financeiro.module.css';

interface TabItem {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

interface StatItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  trend: string;
}

interface QuickAction {
  title: string;
  icon: React.ReactNode;
  color: string;
}

interface TabContent {
  stats: StatItem[];
  quickActions: QuickAction[];
}

// Memoized icon components to prevent re-creation
const MemoizedIcons = {
  FileText: React.memo(() => <FileText className={styles["tab-icon"]} />),
  Plus: React.memo(() => <Plus className={styles["tab-icon"]} />),
  CheckCircle: React.memo(() => <CheckCircle className={styles["tab-icon"]} />),
  Package: React.memo(() => <Package className={styles["tab-icon"]} />),
  CreditCard: React.memo(() => <CreditCard className={styles["tab-icon"]} />),
  Send: React.memo(() => <Send className={styles["tab-icon"]} />),
  Receipt: React.memo(() => <Receipt className={styles["tab-icon"]} />),
  AlertCircle: React.memo(() => <AlertCircle className={styles["tab-icon"]} />),
  Clock: React.memo(() => <Clock className={styles["tab-icon"]} />),
  FileBarChart: React.memo(() => <FileBarChart className={styles["tab-icon"]} />),
  Upload: React.memo(() => <Upload className={styles["tab-icon"]} />),
};

// Static data moved outside component to prevent re-creation
const TAB_ITEMS: TabItem[] = [
  {
    id: 'pedidos-internos',
    title: 'Pedidos Internos',
    count: 67,
    icon: <MemoizedIcons.FileText />,
    color: '#22c55e',
    description: 'Gerencie pedidos internos para cotação'
  },
  {
    id: 'pedidos-cadastrar',
    title: 'Cadastrar Pedidos',
    count: 5,
    icon: <MemoizedIcons.Plus />,
    color: '#3b82f6',
    description: 'Cadastre novos pedidos no sistema'
  },
  {
    id: 'pedidos-aprovar',
    title: 'Aprovar Pedidos',
    count: 0,
    icon: <MemoizedIcons.CheckCircle />,
    color: '#10b981',
    description: 'Aprove pedidos pendentes'
  },
  {
    id: 'recebimento-materiais',
    title: 'Recebimento',
    count: 15,
    icon: <MemoizedIcons.Package />,
    color: '#8b5cf6',
    description: 'Controle recebimento de materiais'
  },
  {
    id: 'contas-pagar',
    title: 'Contas a Pagar',
    count: 517,
    icon: <MemoizedIcons.CreditCard />,
    color: '#f59e0b',
    description: 'Gerencie contas a pagar'
  },
  {
    id: 'gerar-remessa',
    title: 'Remessa Boletos',
    count: 551,
    icon: <MemoizedIcons.Send />,
    color: '#06b6d4',
    description: 'Gere remessas de boletos'
  },
  {
    id: 'faturas-aberto',
    title: 'Faturas Abertas',
    count: 1287,
    icon: <MemoizedIcons.Receipt />,
    color: '#ef4444',
    description: 'Acompanhe faturas em aberto'
  },
  {
    id: 'faturas-nao-enviadas',
    title: 'Faturas Pendentes',
    count: 30,
    icon: <MemoizedIcons.AlertCircle />,
    color: '#f97316',
    description: 'Faturas não enviadas'
  },
  {
    id: 'faturas-vencidas',
    title: 'Faturas Vencidas',
    count: 0,
    icon: <MemoizedIcons.Clock />,
    color: '#dc2626',
    description: 'Faturas com vencimento'
  },
  {
    id: 'faturas-protestadas',
    title: 'Protestadas',
    count: 0,
    icon: <MemoizedIcons.AlertCircle />,
    color: '#991b1b',
    description: 'Faturas protestadas'
  },
  {
    id: 'orcamentos-sac',
    title: 'Orçamentos SAC',
    count: 0,
    icon: <MemoizedIcons.FileBarChart />,
    color: '#7c3aed',
    description: 'Orçamentos do SAC'
  },
  {
    id: 'atualizacoes-orcamentos',
    title: 'Atualizações',
    count: 0,
    icon: <MemoizedIcons.Upload />,
    color: '#059669',
    description: 'Atualizações de orçamentos'
  }
];

// Static content data
const TAB_CONTENT_DATA: Record<string, TabContent> = {
  'pedidos-internos': {
    stats: [
      { value: '67', label: 'Pedidos Pendentes', icon: <FileText />, trend: '+12%' },
      { value: '12', label: 'Urgentes', icon: <Zap />, trend: '+5%' },
      { value: '8', label: 'Em Análise', icon: <Activity />, trend: '-3%' },
      { value: '47', label: 'Aguardando', icon: <Clock />, trend: '+8%' }
    ],
    quickActions: [
      { title: 'Novo Pedido Interno', icon: <Plus />, color: '#22c55e' },
      { title: 'Buscar Pedidos', icon: <Search />, color: '#3b82f6' },
      { title: 'Relatório Geral', icon: <BarChart3 />, color: '#8b5cf6' },
      { title: 'Exportar Dados', icon: <Download />, color: '#f59e0b' }
    ]
  },
  'pedidos-cadastrar': {
    stats: [
      { value: '5', label: 'Para Cadastrar', icon: <Plus />, trend: '+2' },
      { value: '2', label: 'Em Processo', icon: <Activity />, trend: '0%' },
      { value: '3', label: 'Pendentes', icon: <Clock />, trend: '+1' },
      { value: '0', label: 'Rejeitados', icon: <AlertCircle />, trend: '0%' }
    ],
    quickActions: [
      { title: 'Cadastrar Fornecedor', icon: <Building2 />, color: '#22c55e' },
      { title: 'Cadastrar Produto', icon: <Package2 />, color: '#3b82f6' },
      { title: 'Importar Dados', icon: <Upload />, color: '#8b5cf6' },
      { title: 'Validar Cadastros', icon: <CheckCircle />, color: '#10b981' }
    ]
  },
  'contas-pagar': {
    stats: [
      { value: '517', label: 'Total Contas', icon: <CreditCard />, trend: '+23' },
      { value: '89', label: 'Vencendo Hoje', icon: <Calendar />, trend: '+12' },
      { value: '156', label: 'Vencidas', icon: <AlertCircle />, trend: '-8' },
      { value: '272', label: 'Em Dia', icon: <CheckCircle />, trend: '+15' }
    ],
    quickActions: [
      { title: 'Nova Conta', icon: <Plus />, color: '#22c55e' },
      { title: 'Pagar Contas', icon: <CreditCard />, color: '#3b82f6' },
      { title: 'Relatório Vencimentos', icon: <Calendar />, color: '#f59e0b' },
      { title: 'Negociar Fornecedor', icon: <Building2 />, color: '#8b5cf6' }
    ]
  },
  'faturas-aberto': {
    stats: [
      { value: '1287', label: 'Faturas Abertas', icon: <Receipt />, trend: '+45' },
      { value: '234', label: 'Vencendo 7 dias', icon: <Clock />, trend: '+12' },
      { value: '89', label: 'Vencidas', icon: <AlertCircle />, trend: '-5' },
      { value: '964', label: 'Em Dia', icon: <CheckCircle />, trend: '+38' }
    ],
    quickActions: [
      { title: 'Enviar Boletos', icon: <Send />, color: '#22c55e' },
      { title: 'Gerar Relatório', icon: <BarChart3 />, color: '#3b82f6' },
      { title: 'Notificar Clientes', icon: <Bell />, color: '#f59e0b' },
      { title: 'Análise Inadimplência', icon: <TrendingUp />, color: '#ef4444' }
    ]
  },
  'recebimento-materiais': {
    stats: [
      { value: '15', label: 'Materiais Pendentes', icon: <Package />, trend: '+3' },
      { value: '8', label: 'Recebidos Hoje', icon: <CheckCircle />, trend: '+8' },
      { value: '3', label: 'Com Divergência', icon: <AlertCircle />, trend: '-2' },
      { value: '4', label: 'Aguardando', icon: <Clock />, trend: '+1' }
    ],
    quickActions: [
      { title: 'Registrar Recebimento', icon: <Package />, color: '#22c55e' },
      { title: 'Conferir Materiais', icon: <Eye />, color: '#3b82f6' },
      { title: 'Relatório Estoque', icon: <BarChart3 />, color: '#8b5cf6' },
      { title: 'Gerenciar Divergências', icon: <AlertCircle />, color: '#f59e0b' }
    ]
  }
};

const DEFAULT_TAB_CONTENT: TabContent = {
  stats: [
    { value: '0', label: 'Itens', icon: <Package />, trend: '0%' },
    { value: '0', label: 'Pendentes', icon: <Clock />, trend: '0%' },
    { value: '0', label: 'Concluídos', icon: <CheckCircle />, trend: '0%' },
    { value: '0', label: 'Total', icon: <Target />, trend: '0%' }
  ],
  quickActions: [
    { title: 'Ação Principal', icon: <Star />, color: '#22c55e' },
    { title: 'Buscar', icon: <Search />, color: '#3b82f6' },
    { title: 'Relatório', icon: <BarChart3 />, color: '#8b5cf6' },
    { title: 'Configurar', icon: <Settings />, color: '#6b7280' }
  ]
};

// Memoized components
const TabItem = React.memo<{
  tab: TabItem;
  isActive: boolean;
  onClick: (tabId: string) => void;
}>(({ tab, isActive, onClick }) => {
  const handleClick = useCallback(() => {
    onClick(tab.id);
  }, [tab.id, onClick]);

  return (
    <button
      className={`${styles["tab-item"]} ${isActive ? styles.active : ''}`}
      onClick={handleClick}
      style={{ '--tab-color': tab.color } as React.CSSProperties}
    >
      <div className={styles["tab-icon-wrapper"]}>
        {tab.icon}
      </div>
      <div className={styles["tab-content"]}>
        <span className={styles["tab-title"]}>{tab.title}</span>
        <span className={styles["tab-description"]}>{tab.description}</span>
      </div>
      <span className={styles["tab-count"]}>{tab.count}</span>
    </button>
  );
});

const StatsCard = React.memo<{ stat: StatItem; index: number }>(({ stat, index }) => (
  <div key={index} className={styles["stats-card"]}>
    <div className={styles["stats-icon"]}>
      {stat.icon}
    </div>
    <div className={styles["stats-content"]}>
      <div className={styles["stats-value"]}>{stat.value}</div>
      <div className={styles["stats-label"]}>{stat.label}</div>
      <div className={styles["stats-trend"]}>{stat.trend}</div>
    </div>
  </div>
));

const QuickActionCard = React.memo<{ action: QuickAction; index: number }>(({ action, index }) => (
  <button 
    key={index} 
    className={styles["quick-action-card"]}
    style={{ '--action-color': action.color } as React.CSSProperties}
  >
    <div className={styles["quick-action-icon"]}>
      {action.icon}
    </div>
    <span className={styles["quick-action-title"]}>{action.title}</span>
  </button>
));

const FinancialScreensGrid = React.memo(() => (
  <div className={styles["financial-screens-grid"]}>
    {/* Orçamento */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <BarChart3 className={styles["category-icon"]} />
        Orçamento
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <TrendingUp className={styles["screen-icon"]} />
          <span>Análises</span>
        </button>
        <button className={styles["screen-item"]}>
          <Plus className={styles["screen-icon"]} />
          <span>Cadastrar</span>
        </button>
        <button className={styles["screen-item"]}>
          <Settings className={styles["screen-icon"]} />
          <span>Gerenciar</span>
        </button>
      </div>
    </div>

    {/* Produtos */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <ShoppingBag className={styles["category-icon"]} />
        Produtos
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <Plus className={styles["screen-icon"]} />
          <span>Cadastro de produto</span>
        </button>
        <button className={styles["screen-item"]}>
          <FileText className={styles["screen-icon"]} />
          <span>Categoria</span>
        </button>
        <button className={styles["screen-item"]}>
          <Building2 className={styles["screen-icon"]} />
          <span>Fabricante</span>
        </button>
      </div>
    </div>

    {/* Tabela de preços */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <FileBarChart className={styles["category-icon"]} />
        Tabela de preços
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <Users className={styles["screen-icon"]} />
          <span>Grupo</span>
        </button>
        <button className={styles["screen-item"]}>
          <Plus className={styles["screen-icon"]} />
          <span>Cadastrar</span>
        </button>
        <button className={styles["screen-item"]}>
          <Eye className={styles["screen-icon"]} />
          <span>Visualizar</span>
        </button>
      </div>
    </div>

    {/* Pedido de compra */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <ShoppingCart className={styles["category-icon"]} />
        Pedido de compra
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <Plus className={styles["screen-icon"]} />
          <span>Cadastrar pedido interno</span>
        </button>
        <button className={styles["screen-item"]}>
          <Eye className={styles["screen-icon"]} />
          <span>Visualizar pedidos internos</span>
        </button>
        <button className={styles["screen-item"]}>
          <Plus className={styles["screen-icon"]} />
          <span>Cadastrar pedido de compra</span>
        </button>
        <button className={styles["screen-item"]}>
          <Eye className={styles["screen-icon"]} />
          <span>Visualizar pedidos de compra</span>
        </button>
      </div>
    </div>

    {/* Faturamento */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <Receipt className={styles["category-icon"]} />
        Faturamento
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <Search className={styles["screen-icon"]} />
          <span>Buscar</span>
        </button>
        <button className={styles["screen-item"]}>
          <Plus className={styles["screen-icon"]} />
          <span>Cadastrar conta a receber</span>
        </button>
        <button className={styles["screen-item"]}>
          <CreditCard className={styles["screen-icon"]} />
          <span>Cadastrar conta a pagar</span>
        </button>
        <button className={styles["screen-item"]}>
          <Eye className={styles["screen-icon"]} />
          <span>Visualizar</span>
        </button>
        <button className={styles["screen-item"]}>
          <Settings className={styles["screen-icon"]} />
          <span>Gerenciar</span>
        </button>
      </div>
    </div>

    {/* Enviar Boletos / NF's Para o Portal */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <Send className={styles["category-icon"]} />
        Enviar Boletos / NF's Para o Portal
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <Upload className={styles["screen-icon"]} />
          <span>Enviar Automaticamente para o Portal</span>
        </button>
        <button className={styles["screen-item"]}>
          <Receipt className={styles["screen-icon"]} />
          <span>Boletos e/ou Notas (mês atual)</span>
        </button>
        <button className={styles["screen-item"]}>
          <FileText className={styles["screen-icon"]} />
          <span>Boletos e/ou Notas Fiscais</span>
        </button>
      </div>
    </div>

    {/* Boletos / NF's no Portal */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <FileText className={styles["category-icon"]} />
        Boletos / NF's no Portal
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <CheckCircle className={styles["screen-icon"]} />
          <span>Finalizar Boletos</span>
        </button>
        <button className={styles["screen-item"]}>
          <Edit className={styles["screen-icon"]} />
          <span>Editar Boletos e/ou NF's</span>
        </button>
        <button className={styles["screen-item"]}>
          <CreditCard className={styles["screen-icon"]} />
          <span>Editar Boletos Pagos</span>
        </button>
        <button className={styles["screen-item"]}>
          <Bell className={styles["screen-icon"]} />
          <span>Enviar Notificação ao Cliente</span>
        </button>
      </div>
    </div>

    {/* Relatórios */}
    <div className={styles["screen-category"]}>
      <h4 className={styles["category-title"]}>
        <BarChart3 className={styles["category-icon"]} />
        Relatórios
      </h4>
      <div className={styles["screen-items"]}>
        <button className={styles["screen-item"]}>
          <Eye className={styles["screen-icon"]} />
          <span>Visualizar Relatórios</span>
        </button>
      </div>
    </div>
  </div>
));

export const Financeiro: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('pedidos-internos');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    stats: false,
    financialScreens: true,
    quickActions: false
  });
  const tabsRef = useRef<HTMLDivElement>(null);

  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }, []);

  const scrollTabs = useCallback((direction: 'left' | 'right') => {
    if (tabsRef.current) {
      const scrollAmount = 300;
      const currentScroll = tabsRef.current.scrollLeft;
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      tabsRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Memoized computed values
  const currentTab = useMemo(() => 
    TAB_ITEMS.find(tab => tab.id === activeTab), 
    [activeTab]
  );

  const tabContent = useMemo(() => 
    TAB_CONTENT_DATA[activeTab] || DEFAULT_TAB_CONTENT, 
    [activeTab]
  );

  const scrollLeft = useCallback(() => scrollTabs('left'), [scrollTabs]);
  const scrollRight = useCallback(() => scrollTabs('right'), [scrollTabs]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles["header-title"]}>
          <div className={styles["header-icon-wrapper"]}>
            <DollarSign className={styles["header-icon"]} />
          </div>
          <div>
            <h1 className={styles.title}>Sistema Financeiro</h1>
            <p className={styles["header-subtitle"]}>Gestão completa e inteligente</p>
          </div>
        </div>
        <div className={styles["header-actions"]}>
          <button className={styles["header-button-secondary"]}>
            <RefreshCw size={16} />
            Atualizar
          </button>
          <button className={styles["header-button"]}>
            <Plus size={16} />
            Novo Item
          </button>
        </div>
      </div>

      {/* Tabs Container */}
      <div className={styles["tabs-container"]}>
        <div className={styles["tabs-scroll-wrapper"]}>
          <button 
            className={`${styles["scroll-button"]} ${styles["scroll-button-left"]}`}
            onClick={scrollLeft}
          >
            <ChevronLeft className={styles["scroll-button-icon"]} />
          </button>
          
          <div className={styles["tabs-list"]} ref={tabsRef}>
            {TAB_ITEMS.map((tab) => (
              <TabItem
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={handleTabClick}
              />
            ))}
          </div>
          
          <button 
            className={`${styles["scroll-button"]} ${styles["scroll-button-right"]}`}
            onClick={scrollRight}
          >
            <ChevronRight className={styles["scroll-button-icon"]} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles["content-area"]}>
        <div className={styles["tab-content"]}>
          {/* Content Header */}
          <div className={styles["content-header"]}>
            <div className={styles["content-header-info"]}>
              <div className={styles["content-icon-wrapper"]}>
                {currentTab?.icon}
              </div>
              <div>
                <h2 className={styles["content-title"]}>
                  {currentTab?.title || 'Selecione uma opção'}
                </h2>
                <p className={styles["content-subtitle"]}>
                  {currentTab?.description || 'Gerencie e acompanhe suas atividades financeiras'}
                </p>
              </div>
            </div>
            <div className={styles["content-actions"]}>
              <button className={styles["action-button"]}>
                <Filter size={16} />
                Filtrar
              </button>
              <button className={styles["action-button"]}>
                <ArrowUpDown size={16} />
                Ordenar
              </button>
              <button className={styles["action-button-primary"]}>
                <Download size={16} />
                Exportar
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className={styles["collapsible-section"]}>
            <div 
              className={styles["section-header"]} 
              onClick={() => toggleSection('stats')}
            >
              <div className={styles["section-header-content"]}>
                <BarChart3 className={styles["section-header-icon"]} />
                <h3 className={styles["section-header-title"]}>Estatísticas</h3>
                <span className={styles["section-header-count"]}>
                  {tabContent.stats.length} itens
                </span>
              </div>
              <button className={styles["section-toggle-button"]}>
                {expandedSections.stats ? (
                  <ChevronUp className={styles["section-toggle-icon"]} />
                ) : (
                  <ChevronDown className={styles["section-toggle-icon"]} />
                )}
              </button>
            </div>
            
            {expandedSections.stats && (
              <div className={styles["stats-grid"]}>
                {tabContent.stats.map((stat, index) => (
                  <StatsCard key={index} stat={stat} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Financial Screens */}
          <div className={styles["collapsible-section"]}>
            <div 
              className={styles["section-header"]} 
              onClick={() => toggleSection('financialScreens')}
            >
              <div className={styles["section-header-content"]}>
                <Settings className={styles["section-header-icon"]} />
                <h3 className={styles["section-header-title"]}>Telas do Financeiro</h3>
                <span className={styles["section-header-count"]}>
                  10 categorias
                </span>
              </div>
              <button className={styles["section-toggle-button"]}>
                {expandedSections.financialScreens ? (
                  <ChevronUp className={styles["section-toggle-icon"]} />
                ) : (
                  <ChevronDown className={styles["section-toggle-icon"]} />
                )}
              </button>
            </div>
            
            {expandedSections.financialScreens && <FinancialScreensGrid />}
          </div>

          {/* Quick Actions */}
          <div className={styles["collapsible-section"]}>
            <div 
              className={styles["section-header"]} 
              onClick={() => toggleSection('quickActions')}
            >
              <div className={styles["section-header-content"]}>
                <Zap className={styles["section-header-icon"]} />
                <h3 className={styles["section-header-title"]}>Ações Rápidas</h3>
                <span className={styles["section-header-count"]}>
                  {tabContent.quickActions.length} ações
                </span>
              </div>
              <button className={styles["section-toggle-button"]}>
                {expandedSections.quickActions ? (
                  <ChevronUp className={styles["section-toggle-icon"]} />
                ) : (
                  <ChevronDown className={styles["section-toggle-icon"]} />
                )}
              </button>
            </div>
            
            {expandedSections.quickActions && (
              <div className={styles["quick-actions-grid"]}>
                {tabContent.quickActions.map((action, index) => (
                  <QuickActionCard key={index} action={action} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className={styles["main-content"]}>
            <div className={styles["content-placeholder"]}>
              <div className={styles["placeholder-icon"]}>
                {currentTab?.icon}
              </div>
              <h3 className={styles["placeholder-title"]}>
                {currentTab?.title}
              </h3>
              <p className={styles["placeholder-description"]}>
                O conteúdo específico desta seção será carregado aqui. 
                Esta área está preparada para receber os dados e funcionalidades específicas de cada módulo.
              </p>
              <button className={styles["placeholder-button"]}>
                <Eye size={20} />
                Visualizar Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};