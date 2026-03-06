import { useApi, useApiMutation } from "./useApi";

// ── Shipments ─────────────────────────────────────────────────────────────────

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

export function useShipments() {
  return useApi<ShipmentsPage>("/api/v1/shipments");
}

// ── Match proposals ───────────────────────────────────────────────────────────

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

export function useMatchProposals() {
  return useApi<MatchProposal[]>("/api/v1/match/proposals");
}

export function useMatchActions() {
  return useApiMutation<Record<string, never>, Shipment>();
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data?: Record<string, string>;
}

export interface NotificationsPage {
  data: ApiNotification[];
  total: number;
}

export function useNotifications() {
  return useApi<NotificationsPage>("/api/v1/notifications");
}

export function useNotificationActions() {
  return useApiMutation<Record<string, never>, void>();
}

// ── Carbon summary ────────────────────────────────────────────────────────────

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

export function useCarbonSummary() {
  return useApi<CarbonSummary>("/api/v1/carbon/summary");
}

// ── Certifications ────────────────────────────────────────────────────────────

export interface Certification {
  id: string;
  name: string;
  status: "active" | "expired" | "none";
  expiry_date?: string;
  issued_date?: string;
}

export function useCertifications() {
  return useApi<Certification[]>("/api/v1/certifications");
}

// ── OCR ───────────────────────────────────────────────────────────────────────

export interface OcrField {
  key: string;
  label: string;
  value: string;
  confidence: number;
  status: "ok" | "warning" | "error";
}

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

export function useOcrActions() {
  return useApiMutation<Record<string, unknown>, { job_id: string; status: string; shipment_id?: string }>();
}
