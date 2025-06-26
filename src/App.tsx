import { RouterProvider, useRouter } from "../src-tauri/src/routes/Router";
import { routes } from "../src-tauri/src/routes/route";
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