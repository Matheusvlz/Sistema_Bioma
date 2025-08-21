import React, { useState } from 'react';
import { BrushCleaning } from 'lucide-react';


// Interfaces para tipagem
interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSidebarToggle?: (expanded: boolean) => void;
  // NOVO: Prop para controlar se o item Limpeza deve aparecer
  showLimpeza?: boolean;
}

// Tipo para os dados de cada aba
interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType | React.ReactElement; // Aceita componente ou elemento JSX
}

// Ícones para as abas
// Recomenda-se mover esses ícones para um arquivo separado em projetos maiores.
const CadastroIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10,9 9,9 8,9" />
  </svg>
);

const SetoresIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const TerceirizacaoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// O ícone da biblioteca 'lucide-react' é um componente, então o tratamos como tal.
const LimpezaIcon = () => <BrushCleaning />;

// Componente principal
export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onSidebarToggle, showLimpeza = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // MODIFICADO: Agora filtra as abas baseado na prop showLimpeza
  const allTabs: Tab[] = [
    { id: 'cadastro', label: 'Cadastro', icon: CadastroIcon },
    { id: 'setores', label: 'Setores', icon: SetoresIcon },
    { id: 'terceirizacao', label: 'Terceirização', icon: TerceirizacaoIcon },
    { id: 'limpeza', label: 'Limpeza', icon: LimpezaIcon },
  ];

  // NOVO: Filtra as abas para mostrar ou ocultar "Limpeza"
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'limpeza') {
      return showLimpeza;
    }
    return true;
  });

  // Estilos foram centralizados para melhor organização.
  // Em um projeto real, Tailwind CSS ou Styled Components seriam melhores escolhas.
  const styles = {
    sidebar: {
      position: 'fixed' as const,
      left: 0,
      top: 0,
      height: '100vh',
      width: isExpanded ? '200px' : '60px',
      backgroundColor: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column' as const,
      overflow: 'hidden',
    },
    tabItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '16px',
      cursor: 'pointer',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      borderBottom: '1px solid #f3f4f6',
      position: 'relative' as const,
      minHeight: '60px',
    },
    tabItemActive: {
      backgroundColor: '#16a34a',
      color: 'white',
      borderRight: '3px solid #15803d',
    },
    tabItemInactive: {
      backgroundColor: 'transparent',
      color: '#6b7280',
    },
    tabItemHover: {
      backgroundColor: '#f0fdf4',
      color: '#16a34a',
    },
    iconContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: '28px',
      height: '28px',
      transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    iconContainerHover: {
      transform: 'scale(1.1)',
    },
    labelContainer: {
      marginLeft: '12px',
      fontSize: '14px',
      fontWeight: '500',
      opacity: isExpanded ? 1 : 0,
      transform: isExpanded ? 'translateX(0)' : 'translateX(-10px)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
    },
    tooltip: {
      position: 'absolute' as const,
      left: '70px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      whiteSpace: 'nowrap' as const,
      opacity: 0,
      pointerEvents: 'none' as const,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1001,
    },
    tooltipVisible: {
      opacity: 1,
      transform: 'translateY(-50%) translateX(0)',
    },
    tooltipArrow: {
      position: 'absolute' as const,
      left: '-4px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: 0,
      height: 0,
      borderTop: '4px solid transparent',
      borderBottom: '4px solid transparent',
      borderRight: '4px solid #1f2937',
    },
  };

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  const handleMouseEnter = () => {
    setIsExpanded(true);
    onSidebarToggle?.(true);
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    setHoveredTab(null);
    onSidebarToggle?.(false);
  };

  const handleTabMouseEnter = (tabId: string) => {
    if (!isExpanded) {
      setHoveredTab(tabId);
    }
  };

  const handleTabMouseLeave = () => {
    setHoveredTab(null);
  };

  return (
    <div
      style={styles.sidebar}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isHovered = hoveredTab === tab.id;
        const IconComponent = tab.icon;

        // Combinação de estilos para clareza
        const tabItemStyle = {
          ...styles.tabItem,
          ...(isActive ? styles.tabItemActive : styles.tabItemInactive),
          ...((isHovered && !isActive && !isExpanded) ? styles.tabItemHover : {}),
        };

        const iconContainerStyle = {
          ...styles.iconContainer,
          ...((isHovered && !isExpanded) ? styles.iconContainerHover : {}),
        };

        return (
          <div
            key={tab.id}
            style={tabItemStyle}
            onClick={() => handleTabClick(tab.id)}
            onMouseEnter={() => handleTabMouseEnter(tab.id)}
            onMouseLeave={handleTabMouseLeave}
          >
            <div style={iconContainerStyle}>
              {/* Renderiza o componente do ícone */}
              {typeof IconComponent === 'function' ? <IconComponent /> : IconComponent}
            </div>

            <div style={styles.labelContainer}>
              {tab.label}
            </div>

            {/* Tooltip para quando a sidebar está recolhida */}
            {!isExpanded && isHovered && (
              <div
                style={{
                  ...styles.tooltip,
                  ...styles.tooltipVisible,
                }}
              >
                <div style={styles.tooltipArrow} />
                {tab.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Sidebar;
