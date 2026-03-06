import { useState } from "react";
import { AlertTriangle, Radio, Shield, MapPin, X, Layers } from "lucide-react";
import MapGL, { Marker, Source, Layer, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

const regions = [
  { name: "関東", trucks: 234, inTransit: 89, warehouses: 12, risk: "低", riskColor: "text-emerald-400", riskBg: "bg-emerald-500/15" },
  { name: "関西", trucks: 187, inTransit: 64, warehouses: 8, risk: "低", riskColor: "text-emerald-400", riskBg: "bg-emerald-500/15" },
  { name: "東海", trucks: 156, inTransit: 54, warehouses: 6, risk: "注意", riskColor: "text-amber-400", riskBg: "bg-amber-500/15" },
  { name: "九州", trucks: 98, inTransit: 31, warehouses: 5, risk: "低", riskColor: "text-emerald-400", riskBg: "bg-emerald-500/15" },
  { name: "東北", trucks: 76, inTransit: 22, warehouses: 4, risk: "低", riskColor: "text-emerald-400", riskBg: "bg-emerald-500/15" },
  { name: "北海道", trucks: 54, inTransit: 18, warehouses: 3, risk: "低", riskColor: "text-emerald-400", riskBg: "bg-emerald-500/15" },
];

const recentQuakes = [
  { time: "14:30", location: "千葉県沖", magnitude: 3.2, intensity: "震度3", impact: "影響なし", lng: 140.3, lat: 35.3 },
  { time: "11:15", location: "茨城県南部", magnitude: 2.8, intensity: "震度2", impact: "影響なし", lng: 140.1, lat: 36.1 },
  { time: "08:45", location: "宮城県沖", magnitude: 4.1, intensity: "震度3", impact: "影響なし", lng: 142.0, lat: 38.3 },
];

const warehouses = [
  { id: "WH-01", name: "東京倉庫", lng: 139.767, lat: 35.681, status: "正常" },
  { id: "WH-02", name: "大阪倉庫", lng: 135.502, lat: 34.693, status: "正常" },
  { id: "WH-03", name: "名古屋倉庫", lng: 136.906, lat: 35.181, status: "正常" },
  { id: "WH-04", name: "仙台倉庫", lng: 140.872, lat: 38.268, status: "正常" },
  { id: "WH-05", name: "福岡倉庫", lng: 130.402, lat: 33.590, status: "正常" },
];

const affectedTrucks = [
  { id: "XY-1234", lng: 139.9, lat: 35.4, status: "safe" },
  { id: "AB-5678", lng: 140.5, lat: 35.8, status: "warning" },
  { id: "CD-9012", lng: 140.0, lat: 36.0, status: "safe" },
  { id: "EF-3456", lng: 141.5, lat: 38.5, status: "warning" },
  { id: "GH-7890", lng: 139.5, lat: 35.2, status: "safe" },
];

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

// Seismic impact zone GeoJSON (circles around epicenters)
const seismicZonesGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: recentQuakes.map((q) => ({
    type: "Feature" as const,
    properties: { magnitude: q.magnitude, location: q.location },
    geometry: {
      type: "Point" as const,
      coordinates: [q.lng, q.lat],
    },
  })),
};

// Tectonic plate boundary lines (simplified Japan trench)
const tectonicLinesGeoJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "日本海溝" },
      geometry: {
        type: "LineString",
        coordinates: [
          [143.5, 40.5],
          [142.8, 39.0],
          [142.2, 37.5],
          [141.8, 36.0],
          [141.5, 34.5],
          [141.0, 33.0],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "相模トラフ" },
      geometry: {
        type: "LineString",
        coordinates: [
          [141.0, 33.0],
          [140.0, 33.5],
          [139.0, 34.0],
          [138.0, 34.2],
        ],
      },
    },
    {
      type: "Feature",
      properties: { name: "南海トラフ" },
      geometry: {
        type: "LineString",
        coordinates: [
          [138.0, 34.2],
          [136.5, 33.5],
          [135.0, 33.0],
          [133.5, 32.5],
          [132.0, 32.3],
        ],
      },
    },
  ],
};

export function DisasterPage() {
  const [showAlert, setShowAlert] = useState(false);
  const [selectedQuake, setSelectedQuake] = useState<typeof recentQuakes[0] | null>(null);
  const [showLayers, setShowLayers] = useState(false);
  const [layerFlags, setLayerFlags] = useState({
    quakes: true,
    zones: true,
    tectonic: true,
    warehouses: true,
    trucks: true,
  });

  const toggleLayer = (key: keyof typeof layerFlags) =>
    setLayerFlags((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#F8FAFC]">災害対策</h2>
          <p className="mt-1 text-[13px] text-[#64748B]">JMA EEW連携 — 自動ルート変更 &lt;100ms</p>
        </div>
        <button
          onClick={() => setShowAlert(true)}
          className="flex items-center gap-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 px-4 py-2 text-[13px] transition-colors"
        >
          <AlertTriangle size={16} /> アラートシミュレーション
        </button>
      </div>

      {/* JMA Status */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-emerald-400" />
          <span className="text-[14px] font-[600] text-emerald-400">JMA EEW WebSocket: 接続中</span>
        </div>
        <div className="h-4 w-px bg-[rgba(203,213,225,0.12)]" />
        <span className="text-[12px] text-[#64748B]">最終受信: 2秒前</span>
        <span className="text-[12px] text-[#64748B]">Latency: 12ms</span>
        <span className="text-[12px] text-[#64748B]">Uptime: 99.99%</span>
      </div>

      {/* Full-width Seismic Map */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(203,213,225,0.06)]">
          <h4 className="text-[15px] font-[600] text-[#F8FAFC]">地震活動マップ</h4>
          <div className="flex items-center gap-4">
            {/* Legend inline */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-[11px] text-[#64748B]">M4.0+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-[11px] text-[#64748B]">M3.0–3.9</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-[#64748B]">M2.0–2.9</span>
              </div>
              <div className="h-3 w-px bg-[rgba(203,213,225,0.12)]" />
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded border border-cyan-400/60 bg-cyan-400/20" />
                <span className="text-[11px] text-[#64748B]">倉庫</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                <span className="text-[11px] text-[#64748B]">トラック</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative" style={{ height: 420 }}>
          <MapGL
            initialViewState={{ longitude: 139.0, latitude: 36.5, zoom: 5.2 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle={MAP_STYLE}
            attributionControl={false}
            interactive={true}
          >
            <NavigationControl position="bottom-right" showCompass />

            {/* Tectonic plate boundaries */}
            {layerFlags.tectonic && (
              <Source id="tectonic-lines" type="geojson" data={tectonicLinesGeoJSON}>
                <Layer
                  id="tectonic-line-layer"
                  type="line"
                  paint={{
                    "line-color": "#EF4444",
                    "line-width": 1.5,
                    "line-opacity": 0.3,
                    "line-dasharray": [6, 4],
                  }}
                />
              </Source>
            )}

            {/* Seismic impact zones (circle radius based on magnitude) */}
            {layerFlags.zones && (
              <Source id="seismic-zones" type="geojson" data={seismicZonesGeoJSON}>
                <Layer
                  id="seismic-zone-fill"
                  type="circle"
                  paint={{
                    "circle-radius": ["*", ["get", "magnitude"], 12],
                    "circle-color": [
                      "case",
                      [">=", ["get", "magnitude"], 4], "#EF4444",
                      [">=", ["get", "magnitude"], 3], "#F59E0B",
                      "#10B981",
                    ],
                    "circle-opacity": 0.12,
                    "circle-stroke-width": 1,
                    "circle-stroke-color": [
                      "case",
                      [">=", ["get", "magnitude"], 4], "#EF4444",
                      [">=", ["get", "magnitude"], 3], "#F59E0B",
                      "#10B981",
                    ],
                    "circle-stroke-opacity": 0.3,
                  }}
                />
              </Source>
            )}

            {/* Earthquake epicenter markers */}
            {layerFlags.quakes && recentQuakes.map((q, i) => {
              const color = q.magnitude >= 4 ? "#EF4444" : q.magnitude >= 3 ? "#F59E0B" : "#10B981";
              return (
                <Marker key={`quake-${i}`} longitude={q.lng} latitude={q.lat} anchor="center">
                  <div
                    className="cursor-pointer relative"
                    onClick={() => setSelectedQuake(selectedQuake?.location === q.location ? null : q)}
                  >
                    {/* Pulse ring */}
                    <div
                      className="absolute rounded-full animate-ping"
                      style={{
                        width: q.magnitude * 8,
                        height: q.magnitude * 8,
                        top: `calc(50% - ${q.magnitude * 4}px)`,
                        left: `calc(50% - ${q.magnitude * 4}px)`,
                        background: color,
                        opacity: 0.25,
                      }}
                    />
                    {/* Core dot */}
                    <div
                      className="relative z-10 rounded-full border-2"
                      style={{
                        width: 14,
                        height: 14,
                        background: color,
                        borderColor: `${color}80`,
                        boxShadow: `0 0 16px ${color}60`,
                      }}
                    />
                  </div>
                </Marker>
              );
            })}

            {/* Warehouse markers */}
            {layerFlags.warehouses && warehouses.map((wh) => (
              <Marker key={wh.id} longitude={wh.lng} latitude={wh.lat} anchor="center">
                <div className="flex h-6 w-6 items-center justify-center rounded bg-cyan-500/20 border border-cyan-400/40">
                  <span className="text-[9px]">🏭</span>
                </div>
              </Marker>
            ))}

            {/* Affected truck markers */}
            {layerFlags.trucks && affectedTrucks.map((t) => (
              <Marker key={t.id} longitude={t.lng} latitude={t.lat} anchor="center">
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    background: t.status === "warning" ? "#F59E0B" : "#3B82F6",
                    boxShadow: `0 0 10px ${t.status === "warning" ? "#F59E0B" : "#3B82F6"}40`,
                  }}
                >
                  <span className="text-[8px]">🚛</span>
                </div>
              </Marker>
            ))}
          </MapGL>

          {/* Layer toggle overlay */}
          <div className="absolute right-3 top-3 z-10">
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="flex items-center gap-1.5 rounded-lg bg-[#111D32]/90 border border-[rgba(203,213,225,0.12)] px-2.5 py-1.5 text-[11px] text-[#F8FAFC] hover:bg-[#162236] transition-colors backdrop-blur-sm"
            >
              <Layers size={14} /> レイヤー
            </button>
            {showLayers && (
              <div className="mt-1.5 rounded-lg bg-[#111D32]/95 border border-[rgba(203,213,225,0.12)] p-2.5 space-y-1 w-[170px] backdrop-blur-sm">
                {([
                  ["quakes", "震源マーカー"],
                  ["zones", "影響範囲"],
                  ["tectonic", "プレート境界"],
                  ["warehouses", "倉庫"],
                  ["trucks", "トラック"],
                ] as [keyof typeof layerFlags, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 rounded px-2 py-1 cursor-pointer hover:bg-white/[0.03]">
                    <input
                      type="checkbox"
                      checked={layerFlags[key]}
                      onChange={() => toggleLayer(key)}
                      className="h-3 w-3 rounded accent-[#2563EB]"
                    />
                    <span className="text-[11px] text-[#CBD5E1]">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Selected quake info card */}
          {selectedQuake && (
            <div className="absolute left-3 bottom-3 z-10 w-[220px] rounded-xl bg-[#111D32]/95 border border-[rgba(203,213,225,0.12)] p-3.5 backdrop-blur-sm">
              <button
                onClick={() => setSelectedQuake(null)}
                className="absolute right-2 top-2 text-[#64748B] hover:text-[#F8FAFC]"
              >
                <X size={14} />
              </button>
              <div className="text-[13px] font-[600] text-[#F8FAFC]">{selectedQuake.location}</div>
              <div className="mt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#64748B]">時刻</span>
                  <span className="text-[11px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedQuake.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#64748B]">M</span>
                  <span className="text-[11px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedQuake.magnitude}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#64748B]">震度</span>
                  <span className={`text-[11px] ${selectedQuake.magnitude >= 4 ? 'text-amber-400' : 'text-emerald-400'}`}>{selectedQuake.intensity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-[#64748B]">影響</span>
                  <span className="text-[11px] text-[#CBD5E1]">{selectedQuake.impact}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent seismic activity list */}
        <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5 space-y-4">
          <h4 className="text-[15px] font-[600] text-[#F8FAFC]">最近の地震活動</h4>
          <div className="space-y-2">
            {recentQuakes.map((q, i) => (
              <div
                key={i}
                className={`flex items-center justify-between rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedQuake?.location === q.location
                    ? "bg-[#162236] border border-[rgba(37,99,235,0.3)]"
                    : "bg-[#0D1B2E] hover:bg-[#0D1B2E]/80 border border-transparent"
                }`}
                onClick={() => setSelectedQuake(selectedQuake?.location === q.location ? null : q)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{q.time}</span>
                  <span className="text-[13px] text-[#F8FAFC]">{q.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[#CBD5E1]">M{q.magnitude}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${q.magnitude >= 4 ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                    {q.intensity}
                  </span>
                  <span className="text-[11px] text-[#64748B]">{q.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Affected assets */}
        <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5 space-y-4">
          <h4 className="text-[15px] font-[600] text-[#F8FAFC]">影響資産</h4>
          <div className="rounded-lg overflow-hidden border border-[rgba(203,213,225,0.06)]">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0D1B2E]">
                  {["地域", "トラック数", "配送中", "倉庫", "リスク"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regions.map((r) => (
                  <tr key={r.name} className="border-t border-[rgba(203,213,225,0.04)]">
                    <td className="px-4 py-2.5 text-[13px] text-[#F8FAFC]">{r.name}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.trucks}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.inTransit}</td>
                    <td className="px-4 py-2.5 text-[13px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.warehouses}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-[500] ${r.riskBg} ${r.riskColor}`}>
                        {r.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Playbook */}
          <div className="rounded-lg bg-[#0D1B2E] p-4 space-y-3">
            <h4 className="text-[13px] font-[600] text-[#F8FAFC] flex items-center gap-2">
              <Shield size={16} className="text-blue-400" /> 災害対応プレイブック
            </h4>
            {[
              { step: "1", text: "JMA EEW受信 → 自動アラート配信", status: "auto" },
              { step: "2", text: "影響範囲トラック特定 (H3 geo-fence)", status: "auto" },
              { step: "3", text: "ドライバー安全確認送信", status: "auto" },
              { step: "4", text: "ルート再計算 (被災エリア回避)", status: "auto" },
              { step: "5", text: "IOWN優先チャネル要求", status: "manual" },
              { step: "6", text: "パートナー連携・情報共有", status: "manual" },
            ].map((p) => (
              <div key={p.step} className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-[600] ${p.status === 'auto' ? 'bg-blue-500/20 text-blue-400' : 'bg-[#334155] text-[#64748B]'}`}>
                  {p.step}
                </div>
                <span className="text-[12px] text-[#CBD5E1] flex-1">{p.text}</span>
                <span className={`text-[10px] rounded-full px-2 py-0.5 ${p.status === 'auto' ? 'bg-blue-500/15 text-blue-400' : 'bg-[#334155]/50 text-[#64748B]'}`}>
                  {p.status === 'auto' ? '自動' : '手動'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full screen alert overlay */}
      {showAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ animation: 'pulse-bg 1s infinite' }}>
          <style>{`
            @keyframes pulse-bg { 
              0%, 100% { background-color: rgba(0,0,0,0.8); }
              50% { background-color: rgba(127,29,29,0.6); }
            }
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              75% { transform: translateX(4px); }
            }
          `}</style>
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-red-500 bg-gradient-to-b from-[#7F1D1D] to-[#450A0A] p-8 shadow-2xl" style={{ animation: 'shake 0.5s infinite' }}>
            <button onClick={() => setShowAlert(false)} className="absolute right-4 top-4 text-white/60 hover:text-white">
              <X size={20} />
            </button>
            
            <div className="text-center space-y-4">
              <div className="text-[48px]">⚠️</div>
              <h2 className="text-[28px] font-[700] text-white">緊急地震速報</h2>
              
              <div className="h-px bg-red-400/30" />
              
              <div className="space-y-2 text-left">
                <div className="flex justify-between"><span className="text-red-200/60">震源:</span><span className="text-white font-[600]">駿河湾 (Suruga Bay)</span></div>
                <div className="flex justify-between"><span className="text-red-200/60">マグニチュード:</span><span className="text-white font-[600]">6.2</span></div>
                <div className="flex justify-between"><span className="text-red-200/60">最大震度:</span><span className="text-white font-[600]">5強</span></div>
              </div>
              
              <div className="h-px bg-red-400/30" />
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-red-900/50 p-3">
                  <div className="text-[20px] font-[700] text-white">43</div>
                  <div className="text-[11px] text-red-200/60">影響トラック</div>
                </div>
                <div className="rounded-lg bg-red-900/50 p-3">
                  <div className="text-[20px] font-[700] text-white">28</div>
                  <div className="text-[11px] text-red-200/60">影響配送</div>
                </div>
                <div className="rounded-lg bg-red-900/50 p-3">
                  <div className="text-[20px] font-[700] text-white">3</div>
                  <div className="text-[11px] text-red-200/60">影響倉庫</div>
                </div>
              </div>

              <div className="h-px bg-red-400/30" />

              <div className="space-y-2 text-left">
                <p className="text-[12px] text-red-200/60 font-[600]">自動対応:</p>
                <div className="flex items-center gap-2 text-[13px] text-white"><span className="text-emerald-400">✅</span> ドライバー警告送信 (43/43)</div>
                <div className="flex items-center gap-2 text-[13px] text-white"><span className="text-emerald-400">✅</span> 倉庫ゲート開放指示 (3/3)</div>
                <div className="flex items-center gap-2 text-[13px] text-amber-300"><span>⏳</span> ルート再計算中... (18/28)</div>
                <div className="flex items-center gap-2 text-[13px] text-amber-300"><span>⏳</span> IOWN優先チャネル要求中...</div>
              </div>

              <div className="flex gap-3 pt-2">
                <button className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 text-white py-2.5 text-[13px] transition-colors">
                  <MapPin size={14} className="inline mr-1" /> 詳細マップ
                </button>
                <button className="flex-1 rounded-lg bg-white/10 hover:bg-white/20 text-white py-2.5 text-[13px] transition-colors">
                  手動対応
                </button>
                <button onClick={() => setShowAlert(false)} className="flex-1 rounded-lg bg-red-600 hover:bg-red-500 text-white py-2.5 text-[13px] transition-colors">
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}