import { useEffect, useRef } from "react";
import L from "leaflet";

// Dark tile layer (CartoDB Dark Matter - free, no API key)
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Fix default marker icon paths for Leaflet in bundler environments
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createTruckIcon(color: string) {
  return L.divIcon({
    className: "custom-truck-icon",
    html: `
      <div style="
        width: 36px; height: 36px;
        background: ${color}25;
        border: 2px solid ${color};
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 0 12px ${color}40;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
          <path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 9H12"/>
          <circle cx="17" cy="18" r="2"/>
          <circle cx="7" cy="18" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function createPointIcon(color: string, label: string) {
  return L.divIcon({
    className: "custom-point-icon",
    html: `
      <div style="
        display: flex; flex-direction: column; align-items: center;
      ">
        <div style="
          width: 14px; height: 14px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 0 8px ${color}80;
        "></div>
        <div style="
          margin-top: 4px;
          padding: 1px 6px;
          background: rgba(10,22,40,0.85);
          border-radius: 4px;
          color: #CBD5E1;
          font-size: 10px;
          font-family: 'Noto Sans JP', sans-serif;
          white-space: nowrap;
        ">${label}</div>
      </div>
    `,
    iconSize: [80, 36],
    iconAnchor: [40, 7],
  });
}

// ==================== Full Map Screen ====================
export interface TruckData {
  id: number;
  plate: string;
  driver: string;
  load: number;
  status: string;
  lat: number;
  lng: number;
}

interface FullMapProps {
  trucks: TruckData[];
  selectedTruckId: number | null;
  onSelectTruck: (id: number | null) => void;
}

const statusColors: Record<string, string> = {
  empty: "#10B981",
  partial: "#F59E0B",
  full: "#EF4444",
};

const statusLabels: Record<string, string> = {
  empty: "空車",
  partial: "一部積載",
  full: "満載",
};

export function FullMap({ trucks, selectedTruckId, onSelectTruck }: FullMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [36.5, 137.5],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(DARK_TILES, { attribution: DARK_ATTRIBUTION }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.attribution({ position: "bottomleft" }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Add truck markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const markers: L.Marker[] = [];

    trucks.forEach((truck) => {
      const color = statusColors[truck.status] || "#64748B";
      const icon = createTruckIcon(color);
      const marker = L.marker([truck.lat, truck.lng], { icon }).addTo(map);

      marker.bindPopup(`
        <div style="
          background: #0F172A;
          color: white;
          padding: 12px;
          border-radius: 12px;
          min-width: 200px;
          font-family: 'Noto Sans JP', sans-serif;
          border: 1px solid #334155;
        ">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 600;">${truck.plate}</span>
            <span style="
              font-size: 10px;
              padding: 2px 8px;
              border-radius: 999px;
              background: ${color}20;
              color: ${color};
            ">${statusLabels[truck.status]}</span>
          </div>
          <div style="color: #94A3B8; font-size: 12px; margin-bottom: 8px;">${truck.driver}（ドライバー）</div>
          <div style="margin-bottom: 4px; font-size: 11px; color: #94A3B8;">積載率</div>
          <div style="
            width: 100%; height: 6px;
            background: #1E293B;
            border-radius: 3px;
            overflow: hidden;
          ">
            <div style="
              width: ${truck.load}%; height: 100%;
              background: ${color};
              border-radius: 3px;
            "></div>
          </div>
          <div style="text-align: right; font-size: 12px; color: white; margin-top: 4px; font-family: Inter, sans-serif; font-weight: 600;">${truck.load}%</div>
        </div>
      `, {
        className: "dark-popup",
        closeButton: true,
      });

      marker.on("click", () => {
        onSelectTruck(truck.id);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [trucks, onSelectTruck]);

  // Fly to selected truck
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedTruckId) return;
    const truck = trucks.find((t) => t.id === selectedTruckId);
    if (truck) {
      map.flyTo([truck.lat, truck.lng], 10, { duration: 0.8 });
    }
  }, [selectedTruckId, trucks]);

  return <div ref={mapRef} className="w-full h-full" />;
}

// ==================== Mini Route Map ====================
interface MiniRouteMapProps {
  from: { lat: number; lng: number; label: string };
  to: { lat: number; lng: number; label: string };
  currentPosition?: { lat: number; lng: number } | null;
  height?: string;
}

export function MiniRouteMap({ from, to, currentPosition, height = "128px" }: MiniRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    });

    L.tileLayer(DARK_TILES, { attribution: DARK_ATTRIBUTION }).addTo(map);

    // Add origin marker
    const fromIcon = createPointIcon("#2563EB", from.label);
    L.marker([from.lat, from.lng], { icon: fromIcon }).addTo(map);

    // Add destination marker
    const toIcon = createPointIcon("#EF4444", to.label);
    L.marker([to.lat, to.lng], { icon: toIcon }).addTo(map);

    // Draw route line
    const routePoints: L.LatLngExpression[] = [[from.lat, from.lng]];
    if (currentPosition) {
      routePoints.push([currentPosition.lat, currentPosition.lng]);
    }
    routePoints.push([to.lat, to.lng]);

    // Traveled path (solid cyan)
    if (currentPosition) {
      L.polyline([[from.lat, from.lng], [currentPosition.lat, currentPosition.lng]], {
        color: "#06B6D4",
        weight: 3,
        opacity: 0.9,
      }).addTo(map);

      // Remaining path (dashed)
      L.polyline([[currentPosition.lat, currentPosition.lng], [to.lat, to.lng]], {
        color: "#64748B",
        weight: 2,
        dashArray: "8, 8",
        opacity: 0.6,
      }).addTo(map);

      // Current position marker
      const truckIcon = createTruckIcon("#06B6D4");
      L.marker([currentPosition.lat, currentPosition.lng], { icon: truckIcon }).addTo(map);
    } else {
      L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
        color: "#2563EB",
        weight: 2,
        dashArray: "8, 8",
        opacity: 0.6,
      }).addTo(map);
    }

    // Fit bounds
    const bounds = L.latLngBounds([[from.lat, from.lng], [to.lat, to.lng]]);
    if (currentPosition) {
      bounds.extend([currentPosition.lat, currentPosition.lng]);
    }
    map.fitBounds(bounds, { padding: [30, 30] });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [from, to, currentPosition]);

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height }}
    />
  );
}
