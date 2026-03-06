import { ArrowLeft, Truck, Layers, Wifi, WifiOff } from "lucide-react";
import { motion } from "motion/react";
import { useState, useCallback, useMemo } from "react";
import { FullMap, type TruckData } from "./LeafletMap";
import { useWs } from "../../context/WsContext";
import { useAuth } from "../../context/AuthContext";

interface MapScreenProps {
  onBack: () => void;
}

// Demo trucks shown when no live WS data is available
const DEMO_TRUCKS: TruckData[] = [
  { id: 2, plate: "東京 33 か 5678", driver: "佐藤花子", load: 100, status: "full", lat: 35.6762, lng: 139.6503 },
  { id: 3, plate: "名古屋 22 う 9012", driver: "鈴木一郎", load: 0, status: "empty", lat: 35.1815, lng: 136.9066 },
  { id: 4, plate: "福岡 44 え 3456", driver: "高橋誠", load: 45, status: "partial", lat: 33.5904, lng: 130.4017 },
  { id: 5, plate: "札幌 55 お 7890", driver: "渡辺健", load: 88, status: "full", lat: 43.0618, lng: 141.3545 },
  { id: 6, plate: "広島 66 き 2345", driver: "伊藤美咲", load: 30, status: "partial", lat: 34.3853, lng: 132.4553 },
  { id: 7, plate: "仙台 77 さ 6789", driver: "山本健太", load: 0, status: "empty", lat: 38.2682, lng: 140.8694 },
];

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

export function MapScreen({ onBack }: MapScreenProps) {
  const { truckPositions: liveTrucks, isConnected } = useWs();
  const { driver } = useAuth();
  const [selectedTruck, setSelectedTruck] = useState<number | null>(null);
  const [showLayers, setShowLayers] = useState(false);

  // Merge live WS positions with demo trucks; live data takes priority
  const truckPositions: TruckData[] = useMemo(() => {
    const liveTruckData: TruckData[] = Object.values(liveTrucks).map((pos, i) => ({
      id: 1000 + i,
      plate: pos.driver_id === driver?.id ? (driver.vehicle_plate ?? "自車") : `ドライバー ${pos.driver_id.slice(0, 4)}`,
      driver: pos.driver_id === driver?.id ? (driver.name ?? "あなた") : "ドライバー",
      load: 72,
      status: "partial" as const,
      lat: pos.lat,
      lng: pos.lng,
    }));

    // Show demo trucks when no live data, otherwise merge
    return liveTruckData.length > 0 ? [...liveTruckData, ...DEMO_TRUCKS] : DEMO_TRUCKS;
  }, [liveTrucks, driver]);

  const selected = truckPositions.find((t) => t.id === selectedTruck);

  const handleSelectTruck = useCallback((id: number | null) => {
    setSelectedTruck(id);
  }, []);

  return (
    <div className="min-h-screen pb-24 relative" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4">
        <button onClick={onBack} className="p-2 rounded-xl backdrop-blur-xl" style={{ background: "rgba(10, 22, 40, 0.8)" }}>
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1" />
        {/* Live/offline badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-xl" style={{ background: "rgba(10, 22, 40, 0.8)" }}>
          {isConnected
            ? <><Wifi size={14} className="text-[#10B981]" /><span className="text-[#10B981] text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>LIVE</span></>
            : <><WifiOff size={14} className="text-slate-500" /><span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>DEMO</span></>
          }
        </div>
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="p-2 rounded-xl backdrop-blur-xl"
          style={{ background: "rgba(10, 22, 40, 0.8)" }}
        >
          <Layers size={20} className="text-white" />
        </button>
      </div>

      {/* Layer Panel */}
      {showLayers && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 right-5 z-[1001] rounded-xl border border-slate-700/50 p-4 w-56 backdrop-blur-xl"
          style={{ background: "rgba(10, 22, 40, 0.95)" }}
        >
          <span className="text-white text-[13px] mb-3 block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>レイヤー</span>
          {[
            { label: "トラック位置", checked: true },
            { label: "配送ルート", checked: true },
            { label: "集荷ポイント", checked: true },
            { label: "ヒートマップ", checked: false },
            { label: "地震警報ゾーン", checked: false },
          ].map((layer) => (
            <label key={layer.label} className="flex items-center gap-2 py-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked={layer.checked} className="accent-[#06B6D4] w-4 h-4" />
              <span className="text-slate-300 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{layer.label}</span>
            </label>
          ))}
        </motion.div>
      )}

      {/* Real Map */}
      <div className="relative w-full" style={{ height: "calc(100vh - 80px)" }}>
        <FullMap
          trucks={truckPositions}
          selectedTruckId={selectedTruck}
          onSelectTruck={handleSelectTruck}
        />
      </div>

      {/* Selected Truck Detail */}
      {selected && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-20 left-4 right-4 z-[1000] rounded-2xl border border-slate-700/50 p-4 backdrop-blur-xl"
          style={{ background: "rgba(10, 22, 40, 0.95)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck size={18} style={{ color: statusColors[selected.status] }} />
              <span className="text-white text-[15px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>{selected.plate}</span>
            </div>
            <button onClick={() => setSelectedTruck(null)} className="text-slate-400 text-[12px]">✕</button>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-slate-300 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {selected.driver}（ドライバー）
            </div>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: `${statusColors[selected.status]}20`,
                color: statusColors[selected.status],
                fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: 500,
              }}
            >
              {statusLabels[selected.status]}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>積載率</span>
                <span className="text-white text-[12px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{selected.load}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${selected.load}%`, background: statusColors[selected.status] }} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl text-white text-[13px]" style={{ background: "#2563EB", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
              マッチ候補を探す
            </button>
            <button className="flex-1 py-2.5 rounded-xl text-slate-300 text-[13px] border border-slate-600" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
              詳細を見る
            </button>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <div className="absolute bottom-24 left-4 z-[999] flex gap-3 bg-slate-900/80 backdrop-blur px-3 py-2 rounded-lg">
        {Object.entries(statusLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors[key] }} />
            <span className="text-slate-400 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
