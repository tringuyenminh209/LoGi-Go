// ─────────────────────────────────────────────
// Core domain types — Logi-Go API v1
// Source: docs/report/mobile_backend_api_report.md
// ─────────────────────────────────────────────

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer";
}

export interface DriverProfile {
  id: string;
  name: string;
  license_number: string;
  license_expiry: string;
  vehicle_type: string;
  vehicle_plate: string;
  current_location: GeoPoint;
  status: "available" | "on_delivery" | "offline";
  rating: number;
  total_deliveries: number;
  co2_saved_kg: number;
  tenant_id: string;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Shipment {
  id: string;
  status: "pending" | "matched" | "in_transit" | "delivered" | "cancelled";
  pickup: Address;
  dropoff: Address;
  cargo_type: string;
  weight_kg: number;
  volume_m3: number;
  scheduled_pickup: string;
  estimated_delivery: string;
  distance_km: number;
  fee_jpy: number;
  shipper_name: string;
  special_instructions?: string;
  epcis_event_id?: string;
  co2_saved_kg?: number;
}

export interface Address {
  name: string;
  address: string;
  lat: number;
  lng: number;
  contact?: string;
}

export interface MatchProposal {
  match_id: string;
  shipment: Shipment;
  score: number;
  distance_to_pickup_km: number;
  estimated_earnings_jpy: number;
  co2_reduction_kg: number;
  expires_at: string;
}

export interface Notification {
  id: string;
  type: "match_proposal" | "delivery_update" | "earthquake_alert" | "system" | "payment";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface LocationUpdate {
  lat: number;
  lng: number;
  accuracy_m?: number;
  speed_kmh?: number;
  heading_deg?: number;
  timestamp: string;
}

export interface DeliveryEvent {
  shipment_id: string;
  event_type: "pickup_arrived" | "pickup_completed" | "dropoff_arrived" | "dropoff_completed" | "issue_reported";
  location: GeoPoint;
  timestamp: string;
  notes?: string;
  signature_url?: string;
  photos?: string[];
}

export interface OcrJob {
  job_id: string;
  status: "queued" | "processing" | "review_needed" | "completed" | "failed";
  source_url: string;
  extracted_data?: ExtractedWaybill;
  confidence: number;
  created_at: string;
}

export interface ExtractedWaybill {
  shipper_name?: string;
  shipper_address?: string;
  consignee_name?: string;
  consignee_address?: string;
  cargo_description?: string;
  weight_kg?: number;
  dimensions?: string;
  special_instructions?: string;
  reference_number?: string;
}

export interface CarbonSummary {
  driver_id: string;
  period: "day" | "week" | "month" | "year";
  co2_saved_kg: number;
  deliveries_count: number;
  efficiency_score: number;
  j_blue_credits: number;
  gx_ets_credits: number;
  trend: Array<{ date: string; co2_kg: number }>;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issued_date: string;
  expiry_date?: string;
  status: "active" | "expired" | "pending";
  badge_url?: string;
}

export interface SafetyInfo {
  earthquake?: EarthquakeAlert;
  active_warnings: string[];
  road_closures: RoadClosure[];
  recommended_actions: string[];
}

export interface EarthquakeAlert {
  magnitude: number;
  epicenter: string;
  depth_km: number;
  intensity: string;
  tsunami: boolean;
  issued_at: string;
  p_wave_arrival_sec?: number;
}

export interface RoadClosure {
  road_name: string;
  section: string;
  reason: string;
  started_at: string;
  estimated_reopen?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
}
