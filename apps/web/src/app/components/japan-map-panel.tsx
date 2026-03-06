import { useState, useCallback } from "react";
import MapGL, { Marker, Popup, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const trucks = [
  { id: 1, name: "XY-1234", driver: "田中太郎", lng: 135.5, lat: 34.7, status: "available", load: 72, speed: 45 },
  { id: 2, name: "AB-5678", driver: "佐藤花子", lng: 139.7, lat: 35.7, status: "loaded", load: 95, speed: 60 },
  { id: 3, name: "CD-9012", driver: "鈴木一郎", lng: 130.4, lat: 33.6, status: "in-transit", load: 88, speed: 55 },
  { id: 4, name: "EF-3456", driver: "山田次郎", lng: 136.9, lat: 35.2, status: "available", load: 30, speed: 0 },
  { id: 5, name: "GH-7890", driver: "高橋美咲", lng: 139.6, lat: 35.4, status: "loaded", load: 100, speed: 72 },
  { id: 6, name: "IJ-2345", driver: "渡辺健太", lng: 140.9, lat: 38.3, status: "in-transit", load: 65, speed: 48 },
  { id: 7, name: "KL-6789", driver: "伊藤真紀", lng: 141.3, lat: 43.1, status: "available", load: 0, speed: 0 },
  { id: 8, name: "MN-0123", driver: "中村大輔", lng: 132.5, lat: 34.4, status: "loaded", load: 82, speed: 50 },
  { id: 9, name: "OP-4567", driver: "小林恵子", lng: 135.2, lat: 34.7, status: "in-transit", load: 91, speed: 65 },
  { id: 10, name: "QR-8901", driver: "加藤健", lng: 137.7, lat: 34.9, status: "available", load: 45, speed: 0 },
];

const statusColors: Record<string, string> = {
  "available": "#10B981",
  "loaded": "#F59E0B",
  "in-transit": "#EF4444",
};

const statusLabels: Record<string, string> = {
  "available": "空車",
  "loaded": "積載中",
  "in-transit": "輸送中",
};

// Dark style using free CartoDB dark_matter tiles
const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function JapanMapPanel() {
  const [hoveredTruck, setHoveredTruck] = useState<typeof trucks[0] | null>(null);

  const onClose = useCallback(() => setHoveredTruck(null), []);

  return (
    <div className="relative flex h-full flex-col rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-2">
        <h3 className="text-[15px] font-[600] text-[#F8FAFC]">リアルタイムマップ</h3>
        <div className="flex items-center gap-3">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: statusColors[key] }} />
              <span className="text-[11px] text-[#64748B]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-h-[300px]">
        <MapGL
          initialViewState={{
            longitude: 137.0,
            latitude: 37.0,
            zoom: 4.5,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={MAP_STYLE}
          attributionControl={false}
          interactive={true}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          {trucks.map((truck) => (
            <Marker
              key={truck.id}
              longitude={truck.lng}
              latitude={truck.lat}
              anchor="center"
            >
              <div
                className="cursor-pointer"
                onMouseEnter={() => setHoveredTruck(truck)}
                onMouseLeave={() => setHoveredTruck(null)}
              >
                <div
                  className="relative flex h-5 w-5 items-center justify-center rounded-full transition-transform hover:scale-125"
                  style={{
                    background: statusColors[truck.status],
                    boxShadow: `0 0 14px ${statusColors[truck.status]}60`,
                  }}
                >
                  <div
                    className="absolute h-8 w-8 rounded-full animate-ping opacity-20"
                    style={{ background: statusColors[truck.status] }}
                  />
                  <span className="text-[8px]">🚛</span>
                </div>
              </div>
            </Marker>
          ))}

          {hoveredTruck && (
            <Popup
              longitude={hoveredTruck.lng}
              latitude={hoveredTruck.lat}
              anchor="bottom"
              onClose={onClose}
              closeButton={false}
              closeOnClick={false}
              className="map-popup-dark"
              offset={16}
            >
              <div className="rounded-lg bg-[#1E3A5F] p-3 min-w-[180px]">
                <div className="text-[13px] font-[600] text-[#F8FAFC]">🚛 {hoveredTruck.name}</div>
                <div className="text-[12px] text-[#CBD5E1]">{hoveredTruck.driver}</div>
                <div className="mt-2 h-px bg-[rgba(203,213,225,0.12)]" />
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">積載率</span>
                    <span className="text-[11px] text-[#F8FAFC]">{hoveredTruck.load}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#0A1628] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${hoveredTruck.load}%`, background: statusColors[hoveredTruck.status] }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">速度</span>
                    <span className="text-[11px] text-[#F8FAFC]">{hoveredTruck.speed} km/h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">状態</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${statusColors[hoveredTruck.status]}20`, color: statusColors[hoveredTruck.status] }}>
                      {statusLabels[hoveredTruck.status]}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          )}
        </MapGL>
      </div>
    </div>
  );
}