import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AxiosInstance, { setTokenExpiredHandler } from "../services/http";

export type Driver = {
  id: number;
  role_id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  warehouse_name?: string | null;
  license_no?: string | null;
  employment_type?: "EMPLOYEE" | "CONTRACTOR";
};

type AuthContextValue = {
  driver: Driver | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(() => {
    try { return JSON.parse(localStorage.getItem("driver_user") || "null") as Driver | null; }
    catch { return null; }
  });

  const logout = useCallback(() => {
    localStorage.removeItem("driver_token");
    localStorage.removeItem("driver_user");
    setDriver(null);
  }, []);

  useEffect(() => {
    setTokenExpiredHandler(logout);
    return () => setTokenExpiredHandler(() => {});
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await AxiosInstance.post("/driver/login", { username, password });
    localStorage.setItem("driver_token", data.token);
    localStorage.setItem("driver_user", JSON.stringify(data.user));
    setDriver(data.user);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ driver, login, logout }), [driver, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDriverAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useDriverAuth must be used within AuthProvider");
  return context;
}
