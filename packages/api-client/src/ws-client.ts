// ─────────────────────────────────────────────
// WebSocket client — real-time channels
// Channels: match_proposals, earthquake_alerts
// ─────────────────────────────────────────────

import type { MatchProposal, EarthquakeAlert, LocationUpdate } from "./types.js";

const WS_BASE = import.meta.env?.VITE_WS_BASE_URL ?? "ws://localhost:8765";

export type WsMessage =
  | { type: "match_proposal"; payload: MatchProposal }
  | { type: "match_expired"; payload: { match_id: string } }
  | { type: "earthquake_alert"; payload: EarthquakeAlert }
  | { type: "location_ack"; payload: { received_at: string } }
  | { type: "pong" };

export class LogiGoWsClient {
  private ws: WebSocket | null = null;
  private token: string;
  private reconnectDelay = 1000;
  private maxDelay = 30000;
  private handlers = new Map<string, Set<(payload: unknown) => void>>();
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  constructor(token: string) {
    this.token = token;
  }

  connect(): void {
    const url = `${WS_BASE}/ws?token=${encodeURIComponent(this.token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectDelay = 1000;
      this.pingInterval = setInterval(() => this.send({ type: "ping" }), 25000);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        this.dispatch(msg.type, "payload" in msg ? msg.payload : undefined);
      } catch {
        // ignore parse errors
      }
    };

    this.ws.onclose = () => {
      this.clearPing();
      setTimeout(() => {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
        this.connect();
      }, this.reconnectDelay);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  disconnect(): void {
    this.clearPing();
    this.ws?.close();
    this.ws = null;
  }

  on<T>(type: string, handler: (payload: T) => void): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    const set = this.handlers.get(type)!;
    set.add(handler as (payload: unknown) => void);
    return () => set.delete(handler as (payload: unknown) => void);
  }

  sendLocation(location: LocationUpdate): void {
    this.send({ type: "location_update", payload: location });
  }

  private send(msg: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private dispatch(type: string, payload: unknown): void {
    this.handlers.get(type)?.forEach((h) => h(payload));
  }

  private clearPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
