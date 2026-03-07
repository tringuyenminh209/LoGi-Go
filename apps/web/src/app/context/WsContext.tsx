import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "../components/auth-context";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL ?? "ws://localhost:8765";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TruckPosition {
  driver_id: string;
  lat: number;
  lng: number;
  speed_kmh: number;
  heading: number;
  updated_at: string;
}

export interface EarthquakePayload {
  magnitude: number;
  epicenter: string;
  depth_km: number;
  intensity: string;
  tsunami: boolean;
  s_wave_seconds: number;
  issued_at: string;
}

interface WsContextValue {
  isConnected: boolean;
  truckPositions: Record<string, TruckPosition>;
  earthquakeAlert: EarthquakePayload | null;
  dismissAlert: () => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const WsContext = createContext<WsContextValue | null>(null);

export function WsProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [truckPositions, setTruckPositions] = useState<Record<string, TruckPosition>>({});
  const [earthquakeAlert, setEarthquakeAlert] = useState<EarthquakePayload | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const unmounted = useRef(false);

  const connect = useCallback(() => {
    if (!token || !isAuthenticated || unmounted.current) return;

    const ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      reconnectDelay.current = 1000;
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;
      if (!unmounted.current) {
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
          connect();
        }, reconnectDelay.current);
      }
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as {
          type: string;
          payload?: unknown;
        };

        switch (msg.type) {
          case "connected": {
            const payload = msg.payload as Record<string, TruckPosition> | undefined;
            if (payload && Object.keys(payload).length > 0) {
              setTruckPositions(payload);
            }
            break;
          }
          case "truck_positions": {
            const positions = msg.payload as Record<string, TruckPosition>;
            setTruckPositions(positions);
            break;
          }
          case "earthquake_alert": {
            const alert = msg.payload as EarthquakePayload;
            setEarthquakeAlert(alert);
            break;
          }
          case "match_proposal": {
            // Match updates can be consumed by polling hooks
            break;
          }
        }
      } catch {
        // ignore malformed messages
      }
    };
  }, [token, isAuthenticated]);

  // Connect when authenticated
  useEffect(() => {
    unmounted.current = false;
    if (isAuthenticated && token) {
      connect();
    }
    return () => {
      unmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [isAuthenticated, token, connect]);

  // Keep-alive ping every 25 seconds
  useEffect(() => {
    if (!isConnected) return;
    const iv = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);
    return () => clearInterval(iv);
  }, [isConnected]);

  const dismissAlert = useCallback(() => setEarthquakeAlert(null), []);

  return (
    <WsContext.Provider value={{ isConnected, truckPositions, earthquakeAlert, dismissAlert }}>
      {children}
    </WsContext.Provider>
  );
}

export function useWs(): WsContextValue {
  const ctx = useContext(WsContext);
  if (!ctx) throw new Error("useWs must be used inside WsProvider");
  return ctx;
}
