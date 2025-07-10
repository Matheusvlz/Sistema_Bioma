import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { core } from '@tauri-apps/api';
import { 
  FaHome, 
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
import { AuthenticatedRoute } from './route';

interface RouterContextType {
  currentRoute: AuthenticatedRoute;
  navigate: (route: AuthenticatedRoute) => void;
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  getRouteIcon: (route: AuthenticatedRoute) => React.ReactNode;
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
  // Agora o currentRoute só gerencia rotas autenticadas, começando com 'inicio'
  const [currentRoute, setCurrentRoute] = useState<AuthenticatedRoute>('inicio');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mapeamento de ícones para rotas autenticadas
  const getRouteIcon = (route: AuthenticatedRoute): React.ReactNode => {
    const iconComponents = {
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
        // Se autenticado, mantém a rota atual ou vai para 'inicio'
        // Se não autenticado, o App.tsx vai mostrar o Login
        if (isAuth) {
          setCurrentRoute('inicio');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const navigate = (route: AuthenticatedRoute) => {
    setCurrentRoute(route);
  };

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth);
    if (auth) {
      setCurrentRoute('inicio');
    }
    // Se não autenticado, o App.tsx vai lidar com isso
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

