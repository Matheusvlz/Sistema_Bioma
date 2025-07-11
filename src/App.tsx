// App.tsx
import { RouterProvider, useRouter } from "./routes/Router";
import { authenticatedRoutes, AuthenticatedRoute } from "./routes/route"; // Import AuthenticatedRoute
import { Layout } from "./components/Layout";
import Login from "./view/Login";
import "./App.css";

const AppContent = () => {
  const { currentRoute, isAuthenticated } = useRouter();

  if (!isAuthenticated) {
    return <Login />;
  }

  const routeConfig = authenticatedRoutes[currentRoute as AuthenticatedRoute]; // Cast currentRoute
  const ComponentToRender = routeConfig ? routeConfig.component : null;
  const shouldRenderLayout = routeConfig ? routeConfig.hasLayout : false;

  if (shouldRenderLayout) {
    return <Layout>{ComponentToRender}</Layout>;
  } else {
    return <>{ComponentToRender}</>; // Render component directly without Layout
  }
};

function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;