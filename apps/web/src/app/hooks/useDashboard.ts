import { useApi } from "./useApi";

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_shipments: number;
  active_shipments: number;
  total_drivers: number;
  active_drivers: number;
  match_rate: number;
  avg_response_time_sec: number;
  co2_saved_kg: number;
  revenue_jpy: number;
  ocr_pending_count: number;
  alerts_count: number;
}

export function useDashboardStats() {
  return useApi<DashboardStats>("/api/v1/admin/dashboard/stats");
}

// ── Shipments List ───────────────────────────────────────────────────────────

export interface Shipment {
  id: string;
  status: string;
  pickup: { name: string; address: string };
  dropoff: { name: string; address: string };
  cargo_type: string;
  cargo_desc: string;
  weight_kg: number;
  volume_m3?: number;
  scheduled_pickup: string;
  estimated_delivery: string;
  fee_jpy?: number;
  co2_saved_kg?: number;
  shipper_name: string;
}

export interface ShipmentsPage {
  data: Shipment[];
  total: number;
  has_more: boolean;
}

export function useShipmentsList() {
  return useApi<ShipmentsPage>("/api/v1/shipments");
}

// ── Match History ────────────────────────────────────────────────────────────

export interface MatchProposal {
  match_id: string;
  shipment: {
    id: string;
    status: string;
    pickup: { name: string; address: string };
    dropoff: { name: string; address: string };
    cargo_type: string;
    cargo_desc?: string;
    weight_kg: number;
    volume_m3?: number;
    notes?: string;
    fee_jpy?: number;
  };
  score: number;
  distance_to_pickup_km: number;
  estimated_earnings_jpy?: number;
  co2_reduction_kg?: number;
  expires_at: string;
}

export function useMatchHistory() {
  return useApi<MatchProposal[]>("/api/v1/match/proposals");
}

// ── OCR Review Queue ─────────────────────────────────────────────────────────

export interface OcrJob {
  job_id: string;
  status: string;
  confidence: number;
  needs_review: boolean;
  queued_at?: string;
  data: {
    shipper_name?: string;
    shipper_address?: string;
    consignee_name?: string;
    consignee_address?: string;
    cargo_description?: string;
    weight_kg?: number;
    dimensions?: string;
    reference_number?: string;
    pickup_datetime?: string;
    delivery_datetime?: string;
    phone?: string;
  };
}

export function useOcrReviewQueue() {
  return useApi<OcrJob[]>("/api/v1/ocr/review-queue");
}

// ── Carbon Stats ─────────────────────────────────────────────────────────────

export interface CarbonSummary {
  driver_id: string;
  period: string;
  co2_saved_kg: number;
  deliveries_count: number;
  efficiency_score: number;
  j_blue_credits: number;
  gx_ets_credits: number;
  trend: { date: string; co2_kg: number }[];
}

export function useCarbonStats() {
  return useApi<CarbonSummary>("/api/v1/carbon/summary");
}

// ── Drivers List (mock endpoint for now) ─────────────────────────────────────

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

export function useDriversList() {
  return useApi<Driver[]>("/api/v1/admin/drivers");
}
