import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8443";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Driver {
  id: string;
  name: string;
  email?: string;
  vehicle_type: string;
  vehicle_plate: string;
  status: "available" | "on_delivery" | "offline";
  rating: number;
  total_deliveries: number;
  co2_saved_kg: number;
}

interface AuthState {
  token: string | null;
  driver: Driver | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

// ── Storage keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "logi-go:token";
const REFRESH_KEY = "logi-go:refresh";
const DRIVER_KEY = "logi-go:driver";

// ── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [driver, setDriver] = useState<Driver | null>(() => {
    const raw = localStorage.getItem(DRIVER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const saveSession = (accessToken: string, refreshTok: string, driverData: Driver) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshTok);
    localStorage.setItem(DRIVER_KEY, JSON.stringify(driverData));
    setToken(accessToken);
    setDriver(driverData);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(DRIVER_KEY);
    setToken(null);
    setDriver(null);
  };

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? "ログインに失敗しました");
    }

    const data = await res.json();
    // api-gateway returns driver in profile or as top-level field
    const driverData: Driver = data.driver ?? {
      id: "driver-001",
      name: "田中太郎",
      vehicle_type: "4tトラック",
      vehicle_plate: "品川 300 あ 1234",
      status: "on_delivery",
      rating: 4.9,
      total_deliveries: 1247,
      co2_saved_kg: 2800.5,
    };

    saveSession(data.access_token, data.refresh_token, driverData);
  };

  const logout = useCallback(() => {
    const tok = localStorage.getItem(TOKEN_KEY);
    if (tok) {
      fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tok}` },
      }).catch(() => {});
    }
    clearSession();
  }, []);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    const refreshTok = localStorage.getItem(REFRESH_KEY);
    if (!refreshTok) return false;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshTok }),
      });

      if (!res.ok) {
        clearSession();
        return false;
      }

      const data = await res.json();
      localStorage.setItem(TOKEN_KEY, data.access_token);
      if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
      setToken(data.access_token);
      return true;
    } catch {
      clearSession();
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        driver,
        isAuthenticated: !!token,
        login,
        logout,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
