// Router.tsx
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
import { authenticatedRoutes, AuthenticatedRoute } from './route'; // Import authenticatedRoutes and AuthenticatedRoute

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
  const [currentRoute, setCurrentRoute] = useState<AuthenticatedRoute>('inicio');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // You can keep a separate map for icons or extract it from authenticatedRoutes if icons were part of it.
  // For now, let's keep it as is, assuming your icon mapping doesn't change.
  const iconComponentsMap: { [key in AuthenticatedRoute]: React.ElementType } = {
    'login': FaSignInAlt, // Assuming 'login' is still conceptually a route for icon purposes
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
    'gerenciar-categoria': FaUsers,
    'cadastro-usuario-portal': FaUsers,
    'gerenciar-setor': FaUsers,
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

  const getRouteIcon = (route: AuthenticatedRoute): React.ReactNode => {
    const IconComponent = iconComponentsMap[route] || FaHome;
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
      // Check if the route exists in authenticatedRoutes and has a component
      const isValidHashRoute = authenticatedRoutes.hasOwnProperty(pathFromHash);

      if (isValidHashRoute) {
        setCurrentRoute(pathFromHash as AuthenticatedRoute);
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        try {
          const isAuth = await core.invoke<boolean>('verificar_autenticacao');
          setIsAuthenticated(isAuth);
          // If not authenticated, always go to 'login'.
          // If authenticated but hash is invalid, default to 'inicio'.
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

  const navigate = (route: AuthenticatedRoute) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
  };

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth);
    if (auth) {
      setCurrentRoute('inicio');
    }
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