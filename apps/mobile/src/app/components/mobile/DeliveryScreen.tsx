import { ArrowLeft, Phone, CheckCircle2, MapPin, Package, Clock, Truck, Navigation, ChevronRight } from "lucide-react";
import { motion } from "motion/react";
import { MiniRouteMap } from "./LeafletMap";

interface DeliveryScreenProps {
  onBack: () => void;
  onShowDetail?: (deliveryId: string) => void;
}

const deliveries = [
  {
    id: "LG-2847",
    from: "大阪市中央区",
    to: "東京都港区",
    fromCoord: { lat: 34.6937, lng: 135.5023 },
    toCoord: { lat: 35.6585, lng: 139.7454 },
    currentPos: { lat: 35.1815, lng: 137.9 },
    cargo: "精密機器",
    weight: "3,500 kg",
    shipper: "田中商事㈱",
    eta: "17:45",
    remaining: "1h 20m",
    distance: "78 km",
    status: "transit",
    step: 2,
  },
  {
    id: "LG-2851",
    from: "名古屋市",
    to: "横浜市",
    fromCoord: { lat: 35.1815, lng: 136.9066 },
    toCoord: { lat: 35.4437, lng: 139.6380 },
    currentPos: null,
    cargo: "電子部品",
    weight: "2,100 kg",
    shipper: "山田電機㈱",
    eta: "19:30",
    remaining: "3h 05m",
    distance: "256 km",
    status: "pickup",
    step: 1,
  },
  {
    id: "LG-2839",
    from: "福岡市博多区",
    to: "広島市中区",
    fromCoord: { lat: 33.5904, lng: 130.4017 },
    toCoord: { lat: 34.3853, lng: 132.4553 },
    currentPos: null,
    cargo: "衣料品",
    weight: "1,800 kg",
    shipper: "佐藤テキスタイル㈱",
    eta: "完了",
    remaining: "-",
    distance: "0 km",
    status: "delivered",
    step: 4,
  },
];

const steps = ["受注", "集荷", "輸送中", "配達", "完了"];

function ProgressStepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                i <= currentStep
                  ? "bg-[#06B6D4] text-white"
                  : "bg-slate-700 text-slate-500"
              }`}
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
            >
              {i < currentStep ? "✓" : i + 1}
            </div>
            <span
              className={`text-[10px] mt-1 ${i <= currentStep ? "text-[#06B6D4]" : "text-slate-600"}`}
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 flex-1 -mt-4 ${i < currentStep ? "bg-[#06B6D4]" : "bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function DeliveryScreen({ onBack, onShowDetail }: DeliveryScreenProps) {
  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>配送一覧</h1>
        <span className="ml-auto text-slate-400 text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>{deliveries.length}件</span>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 px-5 mt-4 mb-4">
        {["すべて", "進行中", "集荷待ち", "完了"].map((tab, i) => (
          <button
            key={tab}
            className={`px-3 py-1.5 rounded-full text-[12px] ${
              i === 0 ? "bg-[#2563EB] text-white" : "bg-slate-800 text-slate-400 border border-slate-700/50"
            }`}
            style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Delivery Cards */}
      <div className="px-5 space-y-4">
        {deliveries.map((delivery, i) => (
          <motion.div
            key={delivery.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="rounded-2xl border border-slate-700/40 overflow-hidden cursor-pointer"
            style={{ background: "rgba(15, 23, 42, 0.9)" }}
            onClick={() => onShowDetail?.(delivery.id)}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{delivery.id}</span>
                <span
                  className="text-[11px] px-2.5 py-0.5 rounded-full"
                  style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 500,
                    background:
                      delivery.status === "transit" ? "rgba(6, 182, 212, 0.15)" :
                      delivery.status === "pickup" ? "rgba(245, 158, 11, 0.15)" :
                      "rgba(16, 185, 129, 0.15)",
                    color:
                      delivery.status === "transit" ? "#06B6D4" :
                      delivery.status === "pickup" ? "#F59E0B" :
                      "#10B981",
                  }}
                >
                  {delivery.status === "transit" ? "輸送中" : delivery.status === "pickup" ? "集荷待ち" : "配達完了"}
                </span>
              </div>

              {/* Stepper */}
              <ProgressStepper currentStep={delivery.step} />

              {/* Route Map Area */}
              {delivery.status === "transit" && (
                <div className="mb-4">
                  <MiniRouteMap
                    from={{ ...delivery.fromCoord, label: delivery.from }}
                    to={{ ...delivery.toCoord, label: delivery.to }}
                    currentPosition={delivery.currentPos}
                    height="120px"
                  />
                </div>
              )}

              {/* Info */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-center">
                  <Clock size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{delivery.eta}</div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>到着予想</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-center">
                  <Navigation size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{delivery.distance}</div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>残り距離</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-center">
                  <Package size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{delivery.weight}</div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>重量</div>
                </div>
              </div>

              {/* Shipper & Actions */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>荷主</div>
                  <div className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.shipper}</div>
                </div>
                <div className="flex items-center gap-2">
                  {delivery.status !== "delivered" && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); }} className="w-11 h-11 rounded-xl border border-slate-600 flex items-center justify-center">
                        <Phone size={18} className="text-[#2563EB]" />
                      </button>
                      {delivery.status === "transit" && (
                        <button onClick={(e) => { e.stopPropagation(); }} className="px-4 h-11 rounded-xl text-white text-[13px] flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #059669, #10B981)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                          <CheckCircle2 size={16} />
                          配達完了
                        </button>
                      )}
                    </>
                  )}
                  <ChevronRight size={18} className="text-slate-500" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}