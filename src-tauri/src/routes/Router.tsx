import React, { createContext, useContext, useState, ReactNode } from 'react';

type Route = 'login' | 'inicio' | 'reports' | 'settings';

interface RouterContextType {
  currentRoute: Route;
  navigate: (route: Route) => void;
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
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

  const navigate = (route: Route) => {
    setCurrentRoute(route);
  };

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth);
    if (auth) {
      navigate('inicio');
    } else {
      navigate('login');
    }
  };

  return (
    <RouterContext.Provider value={{ 
      currentRoute, 
      navigate, 
      isAuthenticated, 
      setAuthenticated 
    }}>
      {children}
    </RouterContext.Provider>
  );
};