import { useDriverAuth } from "./context/AuthContext";
import TokenExpiredModal from "./components/TokenExpiredModal";
import DriverRoutes from "./routes/DriverRoutes";
import Login from "./pages/Login";

export default function App() {
  const { driver, tokenExpired, logout } = useDriverAuth();

  if (!driver) return <Login />;

  return (
    <>
      <DriverRoutes />
      <TokenExpiredModal open={tokenExpired} onLogin={logout} />
    </>
  );
}
