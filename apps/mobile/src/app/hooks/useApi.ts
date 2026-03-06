import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8443";

// ── Core fetch with auto-refresh on 401 ─────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  token: string | null,
  refreshToken: () => Promise<boolean>,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    const refreshed = await refreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem("logi-go:token");
      if (newToken) headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? "APIエラー"), { status: res.status });
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── useApi hook ──────────────────────────────────────────────────────────────

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(path: string, deps: unknown[] = []): UseApiResult<T> {
  const { token, refreshToken } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const counter = useRef(0);

  const fetch_ = useCallback(() => {
    const id = ++counter.current;
    setLoading(true);
    setError(null);

    apiFetch<T>(path, token, refreshToken)
      .then((res) => {
        if (id === counter.current) setData(res);
      })
      .catch((e: Error) => {
        if (id === counter.current) setError(e.message);
      })
      .finally(() => {
        if (id === counter.current) setLoading(false);
      });
  }, [path, token, refreshToken, ...deps]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ── Convenience mutation helper ──────────────────────────────────────────────

export function useApiMutation<TBody, TResult = void>() {
  const { token, refreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (path: string, body: TBody, method = "POST"): Promise<TResult> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<TResult>(path, token, refreshToken, {
          method,
          body: JSON.stringify(body),
        });
        return result;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "エラーが発生しました";
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [token, refreshToken]
  );

  return { mutate, loading, error };
}
