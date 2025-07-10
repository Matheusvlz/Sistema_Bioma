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
  FaUserCog,
  FaUsers,
  FaBuilding,
  FaHandshake,
  FaWallet
} from 'react-icons/fa';

type Route = 'login' | 'inicio' | 'reports' | 'settings' | 'laboratorio' | 'frota' | 'agenda' | 'qualidade' | 'financeiro' | 'geral' | 'administracao' |
  'cadastrar-clientes' | 'visualizar-cliente' | 'cadastrar-categoria' | 'cadastro-usuario-portal' | 'cadastrar-setor-usuario' | 'cadastrar-consultor' | 'cadastrar-laboratorio-terceirizado' |
  'estrutura-tipo' | 'estrutura-grupo' | 'estrutura-matriz' | 'estrutura-unidade' | 'estrutura-parametro' | 'estrutura-pg-coleta' | 'estrutura-pop' | 'estrutura-tecnica' | 'estrutura-identificacao' | 'estrutura-metodologia' | 'estrutura-legislacao' | 'estrutura-categoria' | 'estrutura-forma-contato' | 'estrutura-observacao' | 'estrutura-submatriz' |
  'rel-parametro-pop' | 'rel-limite-quantificacao' | 'rel-legislacao-parametro' | 'rel-pacote-parametro' | 'rel-tecnica-etapa' |
  'cadastrar-calculo' | 'visualizar-calculo';

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

  const iconComponentsMap: { [key in Route]: React.ElementType } = {
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
    'administracao': FaUserCog,
    'cadastrar-clientes': FaUsers,
    'visualizar-cliente': FaUsers,
    'cadastrar-categoria': FaUsers,
    'cadastro-usuario-portal': FaUsers,
    'cadastrar-setor-usuario': FaUsers,
    'cadastrar-consultor': FaUsers,
    'cadastrar-laboratorio-terceirizado': FaUsers,
    'estrutura-tipo': FaBuilding,
    'estrutura-grupo': FaBuilding,
    'estrutura-matriz': FaBuilding,
    'estrutura-unidade': FaBuilding,
    'estrutura-parametro': FaBuilding,
    'estrutura-pg-coleta': FaBuilding,
    'estrutura-pop': FaBuilding,
    'estrutura-tecnica': FaBuilding,
    'estrutura-identificacao': FaBuilding,
    'estrutura-metodologia': FaBuilding,
    'estrutura-legislacao': FaBuilding,
    'estrutura-categoria': FaBuilding,
    'estrutura-forma-contato': FaBuilding,
    'estrutura-observacao': FaBuilding,
    'estrutura-submatriz': FaBuilding,
    'rel-parametro-pop': FaHandshake,
    'rel-limite-quantificacao': FaHandshake,
    'rel-legislacao-parametro': FaHandshake,
    'rel-pacote-parametro': FaHandshake,
    'rel-tecnica-etapa': FaHandshake,
    'cadastrar-calculo': FaWallet,
    'visualizar-calculo': FaWallet,
  };

  const getRouteIcon = (route: Route): React.ReactNode => {
    const IconComponent = iconComponentsMap[route] || FaHome; // Fallback to FaHome if route not found
    return (
      <span className="icon-container">
        <IconComponent className="icon" />
      </span>
    );
  };

  useEffect(() => {
    const initializeRoute = async () => {
      setIsLoading(true);
      const pathFromHash = window.location.hash.substring(2);
      const isValidHashRoute = (Object.keys(iconComponentsMap) as Route[]).includes(pathFromHash as Route);

      if (isValidHashRoute) {
        setCurrentRoute(pathFromHash as Route);
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
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
      }
    };

    initializeRoute();
  }, []);
  const navigate = (route: Route) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
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

import '../components/css/RouterProvider.css';