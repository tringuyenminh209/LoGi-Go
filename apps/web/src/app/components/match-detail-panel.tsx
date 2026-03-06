import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import MapGL, { Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

interface MatchData {
  id: string;
  shipper: string;
  origin: string;
  dest: string;
  cargo: string;
  weight: string;
  score: number;
  status: string;
  timeLeft: string;
}

const matchDetails: Record<string, {
  scoreBreakdown: { label: string; score: number; weight: number }[];
  loadChange: { from: number; to: number };
  detourKm: number;
  detourPercent: number;
  driver: { name: string; type: string; rating: number; location: string; emptyRate: number; timeout: string; remaining: string };
  timeline: { time: string; event: string; done: boolean }[];
  originCoord: [number, number];
  destCoord: [number, number];
}> = {
  default: {
    scoreBreakdown: [
      { label: "距離効率", score: 0.92, weight: 30 },
      { label: "積載率", score: 0.98, weight: 40 },
      { label: "CO₂削減", score: 0.95, weight: 20 },
      { label: "ドライバー", score: 0.82, weight: 10 },
    ],
    loadChange: { from: 65, to: 89 },
    detourKm: 18,
    detourPercent: 3.5,
    driver: { name: "佐藤一郎", type: "大型・冷蔵", rating: 4.8, location: "名古屋市", emptyRate: 65, timeout: "12:31", remaining: "8:45" },
    timeline: [
      { time: "14:30", event: "マッチング提案送信", done: true },
      { time: "14:31", event: "FCMプッシュ配信済み", done: true },
      { time: "14:32", event: "ドライバー確認待ち...", done: false },
    ],
    originCoord: [135.502, 34.693],
    destCoord: [139.767, 35.681],
  },
};

export function MatchDetailPanel({ match, onClose }: { match: MatchData | null; onClose: () => void }) {
  const detail = matchDetails.default;

  const routeGeoJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: match ? [{
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: [detail.originCoord, detail.destCoord] },
    }] : [],
  };

  return (
    <AnimatePresence>
      {match && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-[480px] max-w-[90vw] overflow-y-auto bg-[#0D1B2E] border-l border-[rgba(203,213,225,0.08)] shadow-2xl"
          >
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-[14px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
                  <ArrowLeft size={18} /> マッチ詳細
                </button>
                <span className="text-[14px] font-mono text-[#06B6D4]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{match.id}</span>
              </div>

              {/* Shipment info */}
              <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 space-y-1">
                <div className="text-[15px] font-[600] text-[#F8FAFC]">{match.shipper}</div>
                <div className="text-[13px] text-[#94A3B8]">{match.origin} → {match.dest}</div>
                <div className="text-[12px] text-[#64748B]">{match.cargo} · {match.weight}</div>
              </div>

              {/* Overall score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#94A3B8]">マッチスコア</span>
                  <span className="text-[20px] font-[700] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{match.score.toFixed(2)}</span>
                </div>
                <div className="h-2 rounded-full bg-[#0A1628] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${match.score * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]"
                  />
                </div>
              </div>

              {/* Score breakdown */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC] flex items-center gap-2">📊 スコア内訳</h4>
                {detail.scoreBreakdown.map((b) => (
                  <div key={b.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] text-[#94A3B8]">{b.label}</span>
                      <span className="text-[12px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {b.score.toFixed(2)} <span className="text-[#64748B]">×{b.weight}%</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#0A1628] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" style={{ width: `${b.score * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Metrics cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-3 space-y-1">
                  <span className="text-[11px] text-[#64748B]">積載率変化</span>
                  <div className="text-[16px] font-[600] text-[#F8FAFC]">{detail.loadChange.from}% → {detail.loadChange.to}%</div>
                  <span className="text-[11px] text-emerald-400">(+{detail.loadChange.to - detail.loadChange.from}%) ↑</span>
                </div>
                <div className="rounded-lg border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-3 space-y-1">
                  <span className="text-[11px] text-[#64748B]">迂回距離</span>
                  <div className="text-[16px] font-[600] text-[#F8FAFC]">+{detail.detourKm} km</div>
                  <span className="text-[11px] text-amber-400">({detail.detourPercent}%増)</span>
                </div>
              </div>

              {/* Mini route map */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC] flex items-center gap-2">🗺️ ルートマップ</h4>
                <div className="h-[180px] rounded-xl overflow-hidden border border-[rgba(203,213,225,0.08)]">
                  <MapGL
                    initialViewState={{ longitude: 137.5, latitude: 35.2, zoom: 5.5 }}
                    style={{ width: "100%", height: "100%" }}
                    mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
                    attributionControl={false}
                    interactive={false}
                  >
                    <Source id="match-route" type="geojson" data={routeGeoJSON}>
                      <Layer id="match-route-line" type="line" paint={{ "line-color": "#06B6D4", "line-width": 3, "line-dasharray": [4, 3] }} />
                    </Source>
                    <Marker longitude={detail.originCoord[0]} latitude={detail.originCoord[1]} anchor="center">
                      <div className="h-4 w-4 rounded-full bg-[#2563EB] border-2 border-white shadow-lg" />
                    </Marker>
                    <Marker longitude={detail.destCoord[0]} latitude={detail.destCoord[1]} anchor="center">
                      <div className="h-4 w-4 rounded-full bg-[#10B981] border-2 border-white shadow-lg" />
                    </Marker>
                  </MapGL>
                </div>
              </div>

              {/* Driver candidate */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC] flex items-center gap-2">🚛 マッチング候補ドライバー</h4>
                <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-[600] text-[#F8FAFC]">{detail.driver.name}</span>
                    <span className="text-[12px] text-amber-400">評価: {detail.driver.rating}</span>
                  </div>
                  <div className="text-[12px] text-[#94A3B8]">{detail.driver.type}</div>
                  <div className="flex items-center gap-1 text-[12px] text-[#64748B]">
                    <MapPin size={12} /> 現在地: {detail.driver.location} · 空車率: {detail.driver.emptyRate}%
                  </div>
                  <div className="flex items-center gap-1 text-[12px] text-amber-400">
                    <Clock size={12} /> 交渉タイムアウト: {detail.driver.timeout} (残り {detail.driver.remaining})
                  </div>
                </div>
              </div>

              {/* Negotiation timeline */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC] flex items-center gap-2">📜 交渉タイムライン</h4>
                <div className="space-y-0 ml-2">
                  {detail.timeline.map((t, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3">
                      <div className="flex flex-col items-center">
                        <div className={`h-3 w-3 rounded-full shrink-0 ${t.done ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                        {i < detail.timeline.length - 1 && <div className={`w-0.5 flex-1 min-h-[16px] ${t.done ? "bg-emerald-400/30" : "border-l border-dashed border-[#334155]"}`} />}
                      </div>
                      <div className="-mt-0.5">
                        <span className="text-[11px] text-[#64748B] font-mono mr-2" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.time}</span>
                        <span className={`text-[12px] ${t.done ? "text-[#CBD5E1]" : "text-amber-400"}`}>{t.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button className="flex-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white py-2.5 text-[13px] transition-colors">手動承認</button>
                <button className="flex-1 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] text-[#CBD5E1] hover:text-[#F8FAFC] py-2.5 text-[13px] transition-colors">再提案</button>
                <button className="flex-1 rounded-lg bg-[#111D32] border border-red-500/20 text-red-400 hover:bg-red-500/10 py-2.5 text-[13px] transition-colors">キャンセル</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
