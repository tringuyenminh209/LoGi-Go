import {
  ArrowLeft, Phone, CheckCircle2, MapPin, Package, Clock, Truck,
  Navigation, MessageSquare, Camera, FileText, User, Building2, Weight, Ruler,
  ChevronDown, Pen, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { MiniRouteMap } from "./LeafletMap";

interface DeliveryDetailScreenProps {
  deliveryId: string;
  onBack: () => void;
}

interface TimelineEvent {
  time: string;
  event: string;
  done: boolean;
  epcis?: {
    eventType: string;
    bizStep: string;
    epc?: string;
    source?: string;
    readPoint?: string;
    h3Cell?: string;
    status?: string;
  };
}

const allDeliveries = [
  {
    id: "LG-2847",
    from: "大阪市中央区",
    fromAddress: "大阪府大阪市中央区本町3-2-8 田中倉庫",
    to: "東京都港区",
    toAddress: "東京都港区芝浦4-16-23 ABC物流センター",
    fromCoord: { lat: 34.6937, lng: 135.5023 },
    toCoord: { lat: 35.6585, lng: 139.7454 },
    currentPos: { lat: 35.1815, lng: 137.9 },
    cargo: "精密機器",
    cargoDetail: "産業用ロボット部品（パレット積み）",
    weight: "3,500 kg",
    dimensions: "4.2 × 2.3 × 1.8 m",
    pallets: 6,
    shipper: "田中商事㈱",
    shipperContact: "090-1234-5678",
    receiver: "ABC物流㈱",
    receiverContact: "03-9876-5432",
    eta: "17:45",
    remaining: "1h 20m",
    distance: "78 km",
    totalDistance: "512 km",
    status: "transit",
    step: 2,
    pickupTime: "3月5日 09:15",
    estimatedDelivery: "3月5日 17:45",
    reward: "¥85,000",
    notes: "精密機器のため振動注意。荷台温度管理不要。受取人：山田様（事前連絡必要）",
    timeline: [
      { time: "09:00", event: "受注確認", done: true, epcis: { eventType: "TransactionEvent", bizStep: "ordering", epc: "urn:epc:id:gdti:4912345.00001.2847", source: "hacobell" } },
      { time: "09:15", event: "集荷完了 — 大阪市中央区", done: true, epcis: { eventType: "ObjectEvent", bizStep: "loading", readPoint: "大阪倉庫Gate-A" } },
      { time: "09:30", event: "輸送開始", done: true, epcis: { eventType: "ObjectEvent", bizStep: "transporting", h3Cell: "862b10bffffffff" } },
      { time: "12:45", event: "休憩（名古屋SA）", done: true, epcis: { eventType: "ObjectEvent", bizStep: "storing", readPoint: "名古屋SA-P3" } },
      { time: "13:15", event: "輸送再開", done: true, epcis: { eventType: "ObjectEvent", bizStep: "transporting", h3Cell: "862b12bffffffff" } },
      { time: "17:45", event: "配達予定 — 東京都港区", done: false, epcis: { eventType: "ObjectEvent", bizStep: "arriving", status: "pending" } },
    ] as TimelineEvent[],
  },
  {
    id: "LG-2851",
    from: "名古屋市",
    fromAddress: "愛知県名古屋市中区栄2-17-1 山田電機倉庫",
    to: "横浜市",
    toAddress: "神奈川県横浜市中区桜木町1-1 テック物流センター",
    fromCoord: { lat: 35.1815, lng: 136.9066 },
    toCoord: { lat: 35.4437, lng: 139.6380 },
    currentPos: null,
    cargo: "電子部品",
    cargoDetail: "半導体モジュール（防静電梱包）",
    weight: "2,100 kg",
    dimensions: "3.0 × 2.0 × 1.5 m",
    pallets: 4,
    shipper: "山田電機㈱",
    shipperContact: "052-123-4567",
    receiver: "テックパーツ㈱",
    receiverContact: "045-987-6543",
    eta: "19:30",
    remaining: "3h 05m",
    distance: "256 km",
    totalDistance: "280 km",
    status: "pickup",
    step: 1,
    pickupTime: "3月5日 16:00",
    estimatedDelivery: "3月5日 19:30",
    reward: "¥52,000",
    notes: "静電気注意。アース接続確認後に荷積み。受取人：佐藤様",
    timeline: [
      { time: "15:30", event: "受注確認", done: true, epcis: { eventType: "TransactionEvent", bizStep: "ordering", epc: "urn:epc:id:gdti:4912345.00001.2851", source: "hacobell" } },
      { time: "16:00", event: "集荷予定 — 名古屋市中区", done: false, epcis: { eventType: "ObjectEvent", bizStep: "loading", status: "pending" } },
      { time: "19:30", event: "配達予定 — 横浜市", done: false, epcis: { eventType: "ObjectEvent", bizStep: "arriving", status: "pending" } },
    ] as TimelineEvent[],
  },
  {
    id: "LG-2839",
    from: "福岡市博多区",
    fromAddress: "福岡県福岡市博多区博多駅南5-14-3",
    to: "広島市中区",
    toAddress: "広島県広島市中区基町6-78 広島流通センター",
    fromCoord: { lat: 33.5904, lng: 130.4017 },
    toCoord: { lat: 34.3853, lng: 132.4553 },
    currentPos: null,
    cargo: "衣料品",
    cargoDetail: "アパレル商品（ハンガーラック）",
    weight: "1,800 kg",
    dimensions: "5.0 × 2.4 × 2.2 m",
    pallets: 8,
    shipper: "佐藤テキスタイル㈱",
    shipperContact: "092-456-7890",
    receiver: "中国物産㈱",
    receiverContact: "082-234-5678",
    eta: "完了",
    remaining: "-",
    distance: "0 km",
    totalDistance: "265 km",
    status: "delivered",
    step: 4,
    pickupTime: "3月5日 06:00",
    estimatedDelivery: "3月5日 11:00",
    reward: "¥38,000",
    notes: "湿気注意。シワ防止のためハンガーラック使用。",
    timeline: [
      { time: "05:45", event: "受注確認", done: true, epcis: { eventType: "TransactionEvent", bizStep: "ordering", epc: "urn:epc:id:gdti:4912345.00001.2839", source: "hacobell" } },
      { time: "06:00", event: "集荷完了 — 福岡市博多区", done: true, epcis: { eventType: "ObjectEvent", bizStep: "loading", readPoint: "博多倉庫Gate-B" } },
      { time: "06:15", event: "輸送開始", done: true, epcis: { eventType: "ObjectEvent", bizStep: "transporting", h3Cell: "862a10bffffffff" } },
      { time: "08:30", event: "休憩（壇ノ浦PA）", done: true, epcis: { eventType: "ObjectEvent", bizStep: "storing", readPoint: "壇ノ浦PA-P1" } },
      { time: "09:00", event: "輸送再開", done: true, epcis: { eventType: "ObjectEvent", bizStep: "transporting", h3Cell: "862a22bffffffff" } },
      { time: "10:45", event: "配達完了 — 広島市中区", done: true, epcis: { eventType: "ObjectEvent", bizStep: "receiving", readPoint: "広島流通センターDock-3" } },
    ] as TimelineEvent[],
  },
];

const progressSteps = ["受注", "集荷", "輸送中", "配達", "完了"];

// Signature Canvas Component
function SignaturePad({ onClear }: { onClear?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  };

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const endDraw = () => setIsDrawing(false);

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  useEffect(() => {
    if (onClear) {
      // Expose clear via parent
    }
  }, [onClear]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={350}
        height={150}
        className="w-full rounded-lg border border-slate-600 touch-none"
        style={{ background: "rgba(30, 41, 59, 0.5)", height: "150px" }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <div className="flex gap-2 mt-2">
        <button onClick={clear} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          クリア
        </button>
        <button className="flex-1 py-2 rounded-lg text-white text-[13px]" style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
          確認
        </button>
      </div>
    </div>
  );
}

export function DeliveryDetailScreen({ deliveryId, onBack }: DeliveryDetailScreenProps) {
  const delivery = allDeliveries.find((d) => d.id === deliveryId) || allDeliveries[0];
  const [activeTab, setActiveTab] = useState<"info" | "timeline" | "docs">("info");
  const [showEpcis, setShowEpcis] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<number | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showSignature, setShowSignature] = useState(false);

  const statusColor =
    delivery.status === "transit" ? "#06B6D4" :
    delivery.status === "pickup" ? "#F59E0B" :
    "#10B981";

  const statusLabel =
    delivery.status === "transit" ? "輸送中" :
    delivery.status === "pickup" ? "集荷待ち" :
    "配達完了";

  const handlePhotoAdd = () => {
    // Simulate adding a photo
    const mockPhotos = [
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect fill='%231E293B' width='80' height='80'/%3E%3Ctext x='40' y='44' text-anchor='middle' fill='%2394A3B8' font-size='10'%3E📸 Photo%3C/text%3E%3C/svg%3E",
    ];
    setPhotos((prev) => [...prev, ...mockPhotos]);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>配送詳細</h1>
          <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{delivery.id}</span>
        </div>
        <span className="text-[12px] px-3 py-1 rounded-full" style={{ background: `${statusColor}20`, color: statusColor, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
          {statusLabel}
        </span>
      </div>

      {/* Route Map */}
      <div className="px-5 mt-4">
        <MiniRouteMap
          from={{ ...delivery.fromCoord, label: delivery.from }}
          to={{ ...delivery.toCoord, label: delivery.to }}
          currentPosition={delivery.currentPos}
          height="180px"
        />
      </div>

      {/* Progress Stepper */}
      <div className="px-5 mt-5">
        <div className="flex items-center gap-1">
          {progressSteps.map((step, i) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] ${i <= delivery.step ? "text-white" : "bg-slate-700 text-slate-500"}`}
                  style={{ background: i <= delivery.step ? statusColor : undefined, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
                >
                  {i < delivery.step ? "✓" : i + 1}
                </motion.div>
                <span className={`text-[10px] mt-1`} style={{ color: i <= delivery.step ? statusColor : "#475569", fontFamily: "'Noto Sans JP', sans-serif" }}>
                  {step}
                </span>
              </div>
              {i < progressSteps.length - 1 && (
                <div className={`h-0.5 flex-1 -mt-4`} style={{ background: i < delivery.step ? statusColor : "#334155" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-5 mt-5">
        {[
          { id: "info" as const, label: "詳細情報" },
          { id: "timeline" as const, label: "タイムライン" },
          { id: "docs" as const, label: "書類" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] transition-all ${activeTab === tab.id ? "text-white" : "text-slate-400"}`}
            style={{
              background: activeTab === tab.id ? "rgba(37, 99, 235, 0.2)" : "transparent",
              border: activeTab === tab.id ? "1px solid rgba(37, 99, 235, 0.3)" : "1px solid transparent",
              fontFamily: "'Noto Sans JP', sans-serif",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-5 mt-4">
        <AnimatePresence mode="wait">
          {activeTab === "info" && (
            <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Route Detail */}
              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 rounded-full border-2 border-[#2563EB] bg-transparent" />
                    <div className="w-0.5 h-10 bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  </div>
                  <div className="flex-1">
                    <div className="mb-4">
                      <div className="text-[#2563EB] text-[11px] mb-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>集荷先</div>
                      <div className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.from}</div>
                      <div className="text-slate-400 text-[12px] mt-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.fromAddress}</div>
                    </div>
                    <div>
                      <div className="text-[#EF4444] text-[11px] mb-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>配達先</div>
                      <div className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.to}</div>
                      <div className="text-slate-400 text-[12px] mt-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.toAddress}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-800/50 rounded-lg px-3 py-2.5 text-center">
                    <Navigation size={14} className="text-slate-400 mx-auto mb-1" />
                    <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{delivery.totalDistance}</div>
                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>総距離</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg px-3 py-2.5 text-center">
                    <Clock size={14} className="text-slate-400 mx-auto mb-1" />
                    <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{delivery.eta}</div>
                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ETA</div>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg px-3 py-2.5 text-center">
                    <Ruler size={14} className="text-slate-400 mx-auto mb-1" />
                    <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{delivery.distance}</div>
                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>残り</div>
                  </div>
                </div>
              </div>

              {/* Cargo Info */}
              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <h3 className="text-white text-[14px] mb-3" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                  <Package size={16} className="inline text-[#06B6D4] mr-2" />貨物情報
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>品名</div>
                    <div className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.cargo}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>重量</div>
                    <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{delivery.weight}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>寸法</div>
                    <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{delivery.dimensions}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>パレット</div>
                    <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{delivery.pallets}枚</div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-700/30">
                  <div className="text-slate-400 text-[11px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>詳細</div>
                  <div className="text-slate-300 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.cargoDetail}</div>
                </div>
              </div>

              {/* Contacts */}
              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <h3 className="text-white text-[14px] mb-3" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                  <User size={16} className="inline text-[#2563EB] mr-2" />連絡先
                </h3>
                <div className="flex items-center justify-between py-3 border-b border-slate-700/20">
                  <div>
                    <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>荷主</div>
                    <div className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.shipper}</div>
                    <div className="text-slate-400 text-[12px] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{delivery.shipperContact}</div>
                  </div>
                  <button className="w-10 h-10 rounded-xl border border-slate-600 flex items-center justify-center">
                    <Phone size={16} className="text-[#2563EB]" />
                  </button>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>受取人</div>
                    <div className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.receiver}</div>
                    <div className="text-slate-400 text-[12px] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{delivery.receiverContact}</div>
                  </div>
                  <button className="w-10 h-10 rounded-xl border border-slate-600 flex items-center justify-center">
                    <Phone size={16} className="text-[#10B981]" />
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-[#F59E0B]/20 p-4" style={{ background: "rgba(245, 158, 11, 0.05)" }}>
                <h3 className="text-[#F59E0B] text-[13px] mb-2 flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                  <MessageSquare size={14} />備考・注意事項
                </h3>
                <p className="text-slate-300 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.notes}</p>
              </div>

              {/* Reward */}
              <div className="rounded-xl border border-slate-700/30 p-4 flex items-center justify-between" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <span className="text-slate-300 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>報酬</span>
                <span className="text-[#F59E0B] text-[22px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{delivery.reward}</span>
              </div>
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* EPCIS Toggle */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                  タイムライン {showEpcis ? "(EPCIS)" : ""}
                </span>
                <button
                  onClick={() => setShowEpcis(!showEpcis)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px]"
                  style={{
                    background: showEpcis ? "rgba(37, 99, 235, 0.2)" : "rgba(51, 65, 85, 0.5)",
                    color: showEpcis ? "#2563EB" : "#94A3B8",
                    border: showEpcis ? "1px solid rgba(37, 99, 235, 0.3)" : "1px solid rgba(51, 65, 85, 0.3)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  {showEpcis ? "EPCIS詳細" : "簡易"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <div className="space-y-0">
                  {delivery.timeline.map((item, i) => {
                    const isExpanded = expandedEvent === i;
                    const hasEpcis = item.epcis && showEpcis;

                    return (
                      <div key={i}>
                        <button
                          className="flex gap-3 w-full text-left"
                          onClick={() => showEpcis && setExpandedEvent(isExpanded ? null : i)}
                        >
                          <div className="flex flex-col items-center">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className={`w-3 h-3 rounded-full mt-1 ${item.done ? "" : "border-2 border-slate-600 bg-transparent"}`}
                              style={{ background: item.done ? statusColor : undefined }}
                            />
                            {i < delivery.timeline.length - 1 && (
                              <div className="w-0.5 flex-1 min-h-[32px]" style={{ background: item.done ? `${statusColor}40` : "#334155" }} />
                            )}
                          </div>
                          <div className="pb-5 flex-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[13px] ${item.done ? "text-white" : "text-slate-500"}`} style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: item.done ? 500 : 400 }}>
                                {item.event}
                              </span>
                              {hasEpcis && (
                                <ChevronDown size={12} className={`text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{item.time}</span>

                            {/* EPCIS Details */}
                            <AnimatePresence>
                              {hasEpcis && isExpanded && item.epcis && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-2 rounded-lg p-2.5 space-y-1 overflow-hidden"
                                  style={{ background: "rgba(30, 41, 59, 0.5)" }}
                                >
                                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {item.epcis.eventType} · BizStep: {item.epcis.bizStep}
                                  </div>
                                  {item.epcis.epc && (
                                    <div className="text-slate-500 text-[10px] break-all" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                      EPC: {item.epcis.epc}
                                    </div>
                                  )}
                                  {item.epcis.source && (
                                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                      Source: {item.epcis.source}
                                    </div>
                                  )}
                                  {item.epcis.readPoint && (
                                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                      ReadPoint: {item.epcis.readPoint}
                                    </div>
                                  )}
                                  {item.epcis.h3Cell && (
                                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                      H3 Cell: {item.epcis.h3Cell}
                                    </div>
                                  )}
                                  {item.epcis.status && (
                                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                      Status: {item.epcis.status}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "docs" && (
            <motion.div key="docs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Documents list */}
              <div className="space-y-3">
                {[
                  { icon: FileText, name: "運送状", status: "発行済", color: "#10B981" },
                  { icon: FileText, name: "配車指示書", status: "発行済", color: "#10B981" },
                ].map((doc, i) => (
                  <motion.button
                    key={doc.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full rounded-xl border border-slate-700/30 p-4 flex items-center gap-3 text-left"
                    style={{ background: "rgba(15, 23, 42, 0.8)" }}
                  >
                    <doc.icon size={20} style={{ color: doc.color }} />
                    <div className="flex-1">
                      <div className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{doc.name}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: doc.color, fontFamily: "'Noto Sans JP', sans-serif" }}>{doc.status}</div>
                    </div>
                    <ArrowLeft size={16} className="text-slate-600 rotate-180" />
                  </motion.button>
                ))}
              </div>

              {/* Photo Section */}
              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <h3 className="text-white text-[14px] mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                  <Camera size={16} className="text-[#06B6D4]" />
                  📷 配達証明写真
                </h3>

                {/* Photo Grid */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                  {photos.map((_, i) => (
                    <div key={i} className="w-20 h-20 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
                      <span className="text-[24px]">📸</span>
                    </div>
                  ))}
                  <button
                    onClick={handlePhotoAdd}
                    className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center shrink-0 gap-1"
                  >
                    <Camera size={18} className="text-slate-500" />
                    <span className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>写真追加</span>
                  </button>
                </div>

                {photos.length > 0 && (
                  <div className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {photos.length}枚撮影済み · 3月5日 10:45
                  </div>
                )}
              </div>

              {/* Signature Section */}
              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-[14px] flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                    <Pen size={16} className="text-[#F59E0B]" />
                    ✍️ 受領書サイン
                  </h3>
                  <span className="text-[12px] px-2 py-0.5 rounded-full" style={{
                    background: delivery.step >= 4 ? "rgba(16, 185, 129, 0.15)" : "rgba(100, 116, 139, 0.15)",
                    color: delivery.step >= 4 ? "#10B981" : "#64748B",
                    fontFamily: "'Noto Sans JP', sans-serif",
                  }}>
                    {delivery.step >= 4 ? "署名済" : "未署名"}
                  </span>
                </div>

                {showSignature ? (
                  <div>
                    <SignaturePad />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSignature(true)}
                    className="w-full py-8 rounded-lg border-2 border-dashed border-slate-600 flex flex-col items-center justify-center gap-2"
                  >
                    <Pen size={24} className="text-slate-500" />
                    <span className="text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>タップして署名</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action */}
      {delivery.status !== "delivered" && (
        <div className="px-5 mt-6">
          <div className="flex gap-3">
            <button className="flex-1 py-3.5 rounded-xl border border-slate-600 text-slate-300 text-[14px] flex items-center justify-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
              <Phone size={18} />連絡
            </button>
            {delivery.status === "transit" && (
              <button className="flex-1 py-3.5 rounded-xl text-white text-[14px] flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #059669, #10B981)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                <CheckCircle2 size={18} />配達完了
              </button>
            )}
            {delivery.status === "pickup" && (
              <button className="flex-1 py-3.5 rounded-xl text-white text-[14px] flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                <Truck size={18} />集荷開始
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
