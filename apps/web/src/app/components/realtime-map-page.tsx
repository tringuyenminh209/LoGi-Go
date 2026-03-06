import { useState, useCallback } from "react";
import { Layers, Filter, ChevronDown } from "lucide-react";
import MapGL, { Marker, Popup, NavigationControl, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const trucks = [
  { id: "XY-1234", driver: "田中太郎", lng: 135.502, lat: 34.693, status: "空車", load: 72, speed: 62, heading: 45, route: "大阪→東京", eta: "17:45", destLng: 139.767, destLat: 35.681, drivingTime: 4.5 },
  { id: "AB-5678", driver: "佐藤花子", lng: 139.767, lat: 35.681, status: "積載中", load: 95, speed: 45, heading: 180, route: "東京→大阪", eta: "20:30", destLng: 135.502, destLat: 34.693, drivingTime: 3.2 },
  { id: "CD-9012", driver: "鈴木一郎", lng: 130.402, lat: 33.590, status: "輸送中", load: 88, speed: 80, heading: 78, route: "福岡→大阪", eta: "18:15", destLng: 135.502, destLat: 34.693, drivingTime: 6.1 },
  { id: "EF-3456", driver: "山田次郎", lng: 135.768, lat: 35.011, status: "輸送中", load: 30, speed: 55, heading: 220, route: "京都→広島", eta: "19:00", destLng: 132.459, destLat: 34.397, drivingTime: 7.5 },
  { id: "GH-7890", driver: "高橋美咲", lng: 141.354, lat: 43.063, status: "空車", load: 0, speed: 0, heading: 135, route: "—", eta: "—", destLng: 141.354, destLat: 43.063, drivingTime: 0 },
  { id: "IJ-2345", driver: "渡辺健太", lng: 132.459, lat: 34.397, status: "積載中", load: 82, speed: 72, heading: 90, route: "広島→名古屋", eta: "16:50", destLng: 136.906, destLat: 35.181, drivingTime: 5.0 },
  { id: "KL-6789", driver: "伊藤真紀", lng: 140.872, lat: 38.268, status: "輸送中", load: 65, speed: 58, heading: 310, route: "仙台→新潟", eta: "15:30", destLng: 139.024, destLat: 37.902, drivingTime: 4.8 },
  { id: "MN-0123", driver: "中村大輔", lng: 136.906, lat: 35.181, status: "空車", load: 0, speed: 0, heading: 0, route: "—", eta: "—", destLng: 136.906, destLat: 35.181, drivingTime: 0 },
  { id: "OP-4567", driver: "小林恵子", lng: 131.47, lat: 34.05, status: "積載中", load: 91, speed: 40, heading: 160, route: "山口→福岡", eta: "14:45", destLng: 130.402, destLat: 33.590, drivingTime: 1.5 },
  { id: "QR-8901", driver: "加藤健", lng: 136.222, lat: 36.065, status: "輸送中", load: 70, speed: 65, heading: 70, route: "金沢→東京", eta: "19:20", destLng: 139.767, destLat: 35.681, drivingTime: 6.8 },
  { id: "ST-2345", driver: "吉田明", lng: 136.722, lat: 35.390, status: "輸送中", load: 78, speed: 48, heading: 115, route: "岐阜→浜松", eta: "16:00", destLng: 137.726, destLat: 34.711, drivingTime: 3.5 },
  { id: "UV-6789", driver: "松本誠", lng: 135.167, lat: 34.228, status: "空車", load: 0, speed: 0, heading: 200, route: "—", eta: "—", destLng: 135.167, destLat: 34.228, drivingTime: 0 },
];

const statusColors: Record<string, string> = {
  "空車": "#10B981",
  "積載中": "#F59E0B",
  "輸送中": "#EF4444",
};

const statusKeys = Object.keys(statusColors);

const layersConfig = [
  { key: "trucks", label: "トラック位置", checked: true },
  { key: "routes", label: "配送ルート", checked: true },
  { key: "points", label: "集荷・配達ポイント", checked: true },
  { key: "heatmap", label: "ヒートマップ", checked: false },
  { key: "earthquake", label: "地震警報ゾーン", checked: false },
  { key: "warehouse", label: "倉庫", checked: false },
];

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export function RealtimeMapPage() {
  const [selectedTruck, setSelectedTruck] = useState<typeof trucks[0] | null>(null);
  const [showLayers, setShowLayers] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [layerState, setLayerState] = useState(layersConfig);
  const [statusFilter, setStatusFilter] = useState<string[]>([...statusKeys]);

  const filteredTrucks = trucks.filter(t => statusFilter.includes(t.status));
  const showTrucks = layerState.find(l => l.key === "trucks")?.checked ?? true;
  const showRoutes = layerState.find(l => l.key === "routes")?.checked ?? true;

  const onPopupClose = useCallback(() => setSelectedTruck(null), []);

  // Route lines GeoJSON
  const routeGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: filteredTrucks
      .filter(t => t.speed > 0 && t.route !== "—")
      .map(t => ({
        type: "Feature" as const,
        properties: { id: t.id },
        geometry: {
          type: "LineString" as const,
          coordinates: [[t.lng, t.lat], [t.destLng, t.destLat]],
        },
      })),
  };

  // Destination points GeoJSON
  const destGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: filteredTrucks
      .filter(t => t.speed > 0 && t.route !== "—")
      .map(t => ({
        type: "Feature" as const,
        properties: { id: t.id },
        geometry: {
          type: "Point" as const,
          coordinates: [t.destLng, t.destLat],
        },
      })),
  };

  return (
    <div className="relative overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      <MapGL
        initialViewState={{ longitude: 136.9, latitude: 35.2, zoom: 5.5 }}
        style={{ width: "100%", height: "100%" }}
        mapStyle={MAP_STYLE}
        attributionControl={false}
        interactive={true}
      >
        <NavigationControl position="bottom-right" showCompass={true} />

        {/* Route lines */}
        {showRoutes && (
          <Source id="routes" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-lines"
              type="line"
              paint={{
                "line-color": "#06B6D4",
                "line-width": 2,
                "line-opacity": 0.5,
                "line-dasharray": [4, 4],
              }}
            />
          </Source>
        )}

        {/* Destination points */}
        {showRoutes && (
          <Source id="destinations" type="geojson" data={destGeoJSON}>
            <Layer
              id="dest-points"
              type="circle"
              paint={{
                "circle-radius": 5,
                "circle-color": "#06B6D4",
                "circle-opacity": 0.7,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#06B6D4",
                "circle-stroke-opacity": 0.3,
              }}
            />
          </Source>
        )}

        {/* Truck markers */}
        {showTrucks && filteredTrucks.map((truck) => (
          <Marker key={truck.id} longitude={truck.lng} latitude={truck.lat} anchor="center">
            <div
              className="cursor-pointer transition-transform hover:scale-125"
              onClick={() => setSelectedTruck(selectedTruck?.id === truck.id ? null : truck)}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: statusColors[truck.status], boxShadow: `0 0 18px ${statusColors[truck.status]}50` }}
              >
                <span className="text-[9px]">🚛</span>
              </div>
            </div>
          </Marker>
        ))}

        {/* Truck popup */}
        {selectedTruck && (
          <Popup
            longitude={selectedTruck.lng}
            latitude={selectedTruck.lat}
            anchor="bottom"
            onClose={onPopupClose}
            closeButton={false}
            closeOnClick={false}
            offset={20}
          >
            <div className="w-[230px] rounded-xl bg-[#111D32] border border-[rgba(203,213,225,0.12)] p-4 shadow-2xl">
              <div className="text-[14px] font-[600] text-[#F8FAFC]">🚛 {selectedTruck.id}</div>
              <div className="text-[12px] text-[#CBD5E1]">{selectedTruck.driver} (ドライバー)</div>
              <div className="mt-3 h-px bg-[rgba(203,213,225,0.08)]" />
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">速度</span>
                  <span className="text-[11px] text-[#F8FAFC]">{selectedTruck.speed} km/h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">積載率</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-[#0A1628] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedTruck.load}%`, background: statusColors[selectedTruck.status] }} />
                    </div>
                    <span className="text-[11px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedTruck.load}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">ルート</span>
                  <span className="text-[11px] text-[#F8FAFC]">{selectedTruck.route}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">ETA</span>
                  <span className="text-[11px] text-[#06B6D4] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedTruck.eta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#64748B]">状態</span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px]" style={{ background: `${statusColors[selectedTruck.status]}15`, color: statusColors[selectedTruck.status] }}>
                    {selectedTruck.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="flex-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-1.5 text-[11px] transition-colors">マッチ候補を探す</button>
                <button className="flex-1 rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.08)] text-[#CBD5E1] py-1.5 text-[11px] hover:text-[#F8FAFC] transition-colors">詳細を見る</button>
              </div>
            </div>
          </Popup>
        )}
      </MapGL>

      {/* Layer controls */}
      <div className="absolute right-4 top-4 z-20">
        <button onClick={() => setShowLayers(!showLayers)} className="flex items-center gap-2 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.12)] px-3 py-2 text-[12px] text-[#F8FAFC] hover:bg-[#162236] transition-colors">
          <Layers size={16} /> レイヤー <ChevronDown size={14} className={`transition-transform ${showLayers ? 'rotate-180' : ''}`} />
        </button>
        {showLayers && (
          <div className="mt-2 rounded-xl bg-[#111D32] border border-[rgba(203,213,225,0.12)] p-3 space-y-1 w-[220px]">
            {layerState.map((l, i) => (
              <label key={l.key} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-white/[0.03]">
                <input type="checkbox" checked={l.checked} onChange={() => { const next = [...layerState]; next[i] = { ...next[i], checked: !next[i].checked }; setLayerState(next); }} className="h-3.5 w-3.5 rounded accent-[#2563EB]" />
                <span className="text-[12px] text-[#CBD5E1]">{l.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="absolute left-4 top-4 z-20">
        <button onClick={() => setShowFilter(!showFilter)} className="flex items-center gap-2 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.12)] px-3 py-2 text-[12px] text-[#F8FAFC] hover:bg-[#162236] transition-colors">
          <Filter size={16} /> フィルター
        </button>
        {showFilter && (
          <div className="mt-2 rounded-xl bg-[#111D32] border border-[rgba(203,213,225,0.12)] p-4 w-[200px] space-y-3">
            <h4 className="text-[12px] font-[600] text-[#F8FAFC]">トラック状態</h4>
            {statusKeys.map((key) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={statusFilter.includes(key)} onChange={() => setStatusFilter(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key])} className="h-3.5 w-3.5 rounded accent-[#2563EB]" />
                <div className="h-2 w-2 rounded-full" style={{ background: statusColors[key] }} />
                <span className="text-[12px] text-[#CBD5E1]">{key}</span>
              </label>
            ))}
            <div className="h-px bg-[rgba(203,213,225,0.08)]" />
            <h4 className="text-[12px] font-[600] text-[#F8FAFC]">地域</h4>
            {["関東", "関西", "九州", "東海", "東北", "北海道"].map((r) => (
              <label key={r} className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded accent-[#2563EB]" />
                <span className="text-[12px] text-[#CBD5E1]">{r}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-5 rounded-xl bg-[#111D32]/90 border border-[rgba(203,213,225,0.12)] px-5 py-2.5 backdrop-blur-sm">
        {statusKeys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ background: statusColors[key] }} />
            <span className="text-[12px] text-[#CBD5E1]">{key}</span>
            <span className="text-[11px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              ({filteredTrucks.filter(t => t.status === key).length})
            </span>
          </div>
        ))}
        <div className="h-4 w-px bg-[rgba(203,213,225,0.12)]" />
        <span className="text-[12px] text-[#F8FAFC]">合計: <span className="font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{filteredTrucks.length}</span> 台</span>
      </div>
    </div>
  );
}