import { RouterProvider, useRouter } from "./routes/Router";
import { authenticatedRoutes } from "./routes/route";
import { Layout } from "./components/Layout";
import Login from "./view/Login";
import "./App.css";

const AppContent = () => {
  const { currentRoute, isAuthenticated } = useRouter();
  
  // Se não estiver autenticado, mostra o Login
  if (!isAuthenticated) {
    return <Login />;
  }
  
  // Se estiver autenticado, mostra o Layout com o conteúdo da rota atual
  // O Layout agora é persistente e só o conteúdo interno muda
  return (
    <Layout>
      {authenticatedRoutes[currentRoute]}
    </Layout>
  );
};

function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;

