import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8443";

// ── Storage keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "logi-go-web:token";
const REFRESH_KEY = "logi-go-web:refresh";
const USER_KEY = "logi-go-auth"; // sessionStorage — kept for backward compat

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  email: string;
  role: string;
  roleLabel: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: string, roleLabel: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
  refreshToken: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));

  const saveSession = (accessToken: string, refreshTok: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshTok);
    sessionStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(accessToken);
    setUser(u);
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const login = async (email: string, password: string, role: string, roleLabel: string) => {
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
    const u: AuthUser = { email, role, roleLabel };
    saveSession(data.access_token, data.refresh_token ?? "", u);
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

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
