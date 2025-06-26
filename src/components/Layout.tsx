import React from 'react';
import { useRouter } from '../routes/Router';
import './css/Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { navigate, currentRoute, setAuthenticated, getRouteIcon } = useRouter();

  const handleLogout = () => {
    setAuthenticated(false);
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="layout-header">
        <div className="header-content">
          <div className="logo-small">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" fill="#22c55e"/>
              <path d="M12 20l6 6 10-12" stroke="#ffffff" strokeWidth="3"/>
            </svg>
            <span>Bioma Ambiental</span>
          </div>
          <div className="header-actions">
            <button className="user-menu" onClick={handleLogout}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className="layout-sidebar">
          <nav className="sidebar-nav">
            <button 
              className={`nav-item ${currentRoute === 'inicio' ? 'active' : ''}`}
              onClick={() => navigate('inicio')}
            >
              {getRouteIcon('inicio')}
              <span>Início</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'reports' ? 'active' : ''}`}
              onClick={() => navigate('reports')}
            >
              {getRouteIcon('reports')}
              <span>Relatórios</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('settings')}
            >
              {getRouteIcon('settings')}
              <span>Configurações</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'geral' ? 'active' : ''}`}
              onClick={() => navigate('geral')}
            >
              {getRouteIcon('geral')}
              <span>Geral</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'laboratorio' ? 'active' : ''}`}
              onClick={() => navigate('laboratorio')}
            >
              {getRouteIcon('laboratorio')}
              <span>Laboratório</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'financeiro' ? 'active' : ''}`}
              onClick={() => navigate('financeiro')}
            >
              {getRouteIcon('financeiro')}
              <span>Financeiro</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'administracao' ? 'active' : ''}`}
              onClick={() => navigate('administracao')}
            >
              {getRouteIcon('administracao')}
              <span>Administração</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'agenda' ? 'active' : ''}`}
              onClick={() => navigate('agenda')}
            >
              {getRouteIcon('agenda')}
              <span>Agenda</span>
            </button>
            
            <button 
              className={`nav-item ${currentRoute === 'frota' ? 'active' : ''}`}
              onClick={() => navigate('frota')}
            >
              {getRouteIcon('frota')}
              <span>Frota</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="layout-main">
          {children}
        </main>
      </div>
    </div>
  );
};