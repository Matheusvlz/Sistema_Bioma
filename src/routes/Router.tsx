import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { core } from '@tauri-apps/api';
import { 
  FaHome, 
  FaSignInAlt, 
  FaChartBar, 
  FaCog, 
  FaFlask, 
  FaTruck, 
  FaCalendarAlt,
  FaClipboardCheck,
  FaMoneyBillWave,
  FaGlobeAmericas,
  FaUserCog
} from 'react-icons/fa';

type Route = 'login' | 'inicio' | 'reports' | 'settings' | 'laboratorio' | 'frota' | 'agenda' | 'qualidade' | 'financeiro' | 'geral' | 'administracao';

interface RouterContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  getRouteIcon: (route: Route) => React.ReactNode;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within RouterProvider');
  }
  return context;
};

interface RouterProviderProps {
  children: ReactNode;
}

export const RouterProvider: React.FC<RouterProviderProps> = ({ children }) => {
  const [currentRoute, setCurrentRoute] = useState<Route>('login');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mapeamento de ícones para rotas com verificação
  const getRouteIcon = (route: Route): React.ReactNode => {
    const iconComponents = {
      'login': FaSignInAlt,
      'inicio': FaHome,
      'reports': FaChartBar,
      'settings': FaCog,
      'laboratorio': FaFlask,
      'frota': FaTruck,
      'agenda': FaCalendarAlt,
      'qualidade': FaClipboardCheck,
      'financeiro': FaMoneyBillWave,
      'geral': FaGlobeAmericas,
      'administracao': FaUserCog
    };
    
    const IconComponent = iconComponents[route] || FaHome;
    
    return (
      <span className="icon-container">
        <IconComponent className="icon" />
      </span>
    );
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await core.invoke<boolean>('verificar_autenticacao');
        setIsAuthenticated(isAuth);
        setCurrentRoute(isAuth ? 'inicio' : 'login');
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setCurrentRoute('login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const navigate = (route: Route) => {
    setCurrentRoute(route);
  };

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth);
    navigate(auth ? 'inicio' : 'login');
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner">
          <FaCog className="spinning-icon" />
        </div>
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  return (
    <RouterContext.Provider value={{ 
      currentRoute, 
      navigate, 
      isAuthenticated, 
      setAuthenticated,
      getRouteIcon
    }}>
      {children}
    </RouterContext.Provider>
  );
};

// Importe o CSS DEPOIS do componente para evitar conflitos
import '../components/css/RouterProvider.css';