import type {
  AuthTokens,
  DriverProfile,
  Shipment,
  MatchProposal,
  Notification,
  LocationUpdate,
  DeliveryEvent,
  OcrJob,
  ExtractedWaybill,
  CarbonSummary,
  Certification,
  SafetyInfo,
  PaginatedResponse,
} from "./types.js";

const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8443";

// ─────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message ?? "API error"), { status: res.status, body: err });
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────

export const auth = {
  login: (phone: string, password: string) =>
    request<AuthTokens>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),

  refresh: (refresh_token: string) =>
    request<AuthTokens>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token }),
    }),

  logout: (token: string) =>
    request<void>("/api/v1/auth/logout", { method: "POST" }, token),
};

// ─────────────────────────────────────────────
// Driver Profile
// ─────────────────────────────────────────────

export const profile = {
  get: (token: string) =>
    request<DriverProfile>("/api/v1/driver/profile", {}, token),

  update: (token: string, data: Partial<DriverProfile>) =>
    request<DriverProfile>("/api/v1/driver/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }, token),

  updateLocation: (token: string, location: LocationUpdate) =>
    request<void>("/api/v1/driver/location", {
      method: "POST",
      body: JSON.stringify(location),
    }, token),
};

// ─────────────────────────────────────────────
// Shipments / Deliveries
// ─────────────────────────────────────────────

export const shipments = {
  list: (token: string, params?: { status?: string; page?: number; per_page?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<Shipment>>(`/api/v1/shipments${q ? `?${q}` : ""}`, {}, token);
  },

  get: (token: string, id: string) =>
    request<Shipment>(`/api/v1/shipments/${id}`, {}, token),

  postEvent: (token: string, event: DeliveryEvent) =>
    request<void>("/api/v1/deliveries/events", {
      method: "POST",
      body: JSON.stringify(event),
    }, token),
};

// ─────────────────────────────────────────────
// Match Engine
// ─────────────────────────────────────────────

export const matching = {
  getProposals: (token: string) =>
    request<MatchProposal[]>("/api/v1/match/proposals", {}, token),

  accept: (token: string, match_id: string) =>
    request<Shipment>(`/api/v1/match/${match_id}/accept`, { method: "POST" }, token),

  decline: (token: string, match_id: string, reason?: string) =>
    request<void>(`/api/v1/match/${match_id}/decline`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }, token),
};

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────

export const notifications = {
  list: (token: string, params?: { unread_only?: boolean; page?: number }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return request<PaginatedResponse<Notification>>(`/api/v1/notifications${q ? `?${q}` : ""}`, {}, token);
  },

  markRead: (token: string, id: string) =>
    request<void>(`/api/v1/notifications/${id}/read`, { method: "PUT" }, token),

  markAllRead: (token: string) =>
    request<void>("/api/v1/notifications/read-all", { method: "PUT" }, token),

  registerFcm: (token: string, fcm_token: string, platform: "ios" | "android") =>
    request<void>("/api/v1/notifications/fcm-token", {
      method: "POST",
      body: JSON.stringify({ fcm_token, platform }),
    }, token),
};

// ─────────────────────────────────────────────
// Safety / Resilience
// ─────────────────────────────────────────────

export const safety = {
  getInfo: (token: string) =>
    request<SafetyInfo>("/api/v1/safety/current", {}, token),

  acknowledge: (token: string, alert_id: string) =>
    request<void>(`/api/v1/safety/alerts/${alert_id}/ack`, { method: "POST" }, token),
};

// ─────────────────────────────────────────────
// OCR / Legacy Bridge
// ─────────────────────────────────────────────

export const ocr = {
  upload: (token: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return request<OcrJob>("/api/v1/ocr/upload", {
      method: "POST",
      body: form,
      headers: {},
    }, token);
  },

  getJob: (token: string, job_id: string) =>
    request<OcrJob>(`/api/v1/ocr/jobs/${job_id}`, {}, token),

  confirm: (token: string, job_id: string, data: Partial<ExtractedWaybill>) =>
    request<Shipment>(`/api/v1/ocr/jobs/${job_id}/confirm`, {
      method: "POST",
      body: JSON.stringify(data),
    }, token),
};

// ─────────────────────────────────────────────
// Carbon / Certifications
// ─────────────────────────────────────────────

export const carbon = {
  getSummary: (token: string, period: "day" | "week" | "month" | "year" = "month") =>
    request<CarbonSummary>(`/api/v1/carbon/summary?period=${period}`, {}, token),
};

export const certifications = {
  list: (token: string) =>
    request<Certification[]>("/api/v1/certifications", {}, token),
};
