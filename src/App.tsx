import { useDriverAuth } from "./context/AuthContext";
import DriverRoutes from "./routes/DriverRoutes";
import Login from "./pages/Login";

export default function App() {
  const { driver } = useDriverAuth();
  return driver ? <DriverRoutes /> : <Login />;
}
