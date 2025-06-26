import { RouterProvider, useRouter } from "./routes/Router";
import { routes } from "./routes/route";
import "./App.css";

const AppContent = () => {
  const { currentRoute } = useRouter();
  return routes[currentRoute];
};

function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;