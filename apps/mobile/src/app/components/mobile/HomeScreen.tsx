import { Bell, Truck, Package, Map, Shield, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onShowMatch: () => void;
  onShowNotifications?: () => void;
  onShowSafety?: () => void;
  onShowDeliveryDetail?: (deliveryId: string) => void;
}

export function HomeScreen({ onNavigate, onShowMatch, onShowNotifications, onShowSafety, onShowDeliveryDetail }: HomeScreenProps) {
  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-[env(safe-area-inset-top)] py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
            <Truck size={18} className="text-white" />
          </div>
          <span className="text-white text-[18px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>Logi-Go</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2" onClick={() => onShowNotifications?.()}>
            <Bell size={22} className="text-slate-300" />
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-[11px] text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>3</span>
          </button>
          <button onClick={() => onNavigate("profile")} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
            田
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-5 mt-2">
        <h1 className="text-white text-[22px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>こんにちは、田中さん</h1>
        <p className="text-slate-400 text-[14px] mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>残り運転時間: <span className="text-[#06B6D4]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>4h 30m</span></p>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-5 mt-5 rounded-2xl p-5 border border-slate-700/50"
        style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(6, 182, 212, 0.1))" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[#10B981] text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>現在のステータス</span>
          </div>
          <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>一部積載</span>
        </div>

        {/* Load Progress */}
        <div className="mb-3">
          <div className="flex justify-between items-end mb-2">
            <span className="text-white text-[32px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>72<span className="text-[18px] text-slate-400">%</span></span>
            <span className="text-slate-400 text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>7,200 / 10,000 kg</span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-700/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "72%" }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #2563EB, #06B6D4)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-[13px]">
          <TrendingUp size={14} className="text-[#10B981]" />
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>今日の走行: <span className="text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>234 km</span></span>
        </div>
      </motion.div>

      {/* Quick Actions Grid */}
      <div className="px-5 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            onClick={onShowMatch}
            className="rounded-2xl p-5 border border-slate-700/50 text-left relative overflow-hidden"
            style={{ background: "rgba(37, 99, 235, 0.1)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(37, 99, 235, 0.2)" }}>
              <Package size={24} className="text-[#2563EB]" />
            </div>
            <span className="text-white text-[15px] block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>新着マッチ</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="bg-[#EF4444] text-white text-[12px] px-2 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>2件</span>
            </div>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onClick={() => onNavigate("map")}
            className="rounded-2xl p-5 border border-slate-700/50 text-left"
            style={{ background: "rgba(6, 182, 212, 0.1)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(6, 182, 212, 0.2)" }}>
              <Map size={24} className="text-[#06B6D4]" />
            </div>
            <span className="text-white text-[15px] block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>マップ</span>
            <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>リアルタイム</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            onClick={() => onNavigate("jobs")}
            className="rounded-2xl p-5 border border-slate-700/50 text-left"
            style={{ background: "rgba(16, 185, 129, 0.1)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(16, 185, 129, 0.2)" }}>
              <Truck size={24} className="text-[#10B981]" />
            </div>
            <span className="text-white text-[15px] block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>配送一覧</span>
            <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>3件進行中</span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            onClick={() => onShowSafety?.()}
            className="rounded-2xl p-5 border border-slate-700/50 text-left"
            style={{ background: "rgba(245, 158, 11, 0.1)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(245, 158, 11, 0.2)" }}>
              <Shield size={24} className="text-[#F59E0B]" />
            </div>
            <span className="text-white text-[15px] block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>安全情報</span>
            <span className="text-[#10B981] text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>異常なし</span>
          </motion.button>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-[16px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>進行中の配送</h2>
          <button onClick={() => onNavigate("jobs")} className="text-[#2563EB] text-[13px] flex items-center gap-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            すべて見る <ChevronRight size={14} />
          </button>
        </div>

        {[
          { id: "LG-2847", from: "大阪市中央区", to: "東京都港区", cargo: "精密機器", weight: "3,500 kg", eta: "17:45", status: "輸送中", statusColor: "#06B6D4" },
          { id: "LG-2851", from: "名古屋市", to: "横浜市", cargo: "電子部品", weight: "2,100 kg", eta: "19:30", status: "集荷待ち", statusColor: "#F59E0B" },
        ].map((delivery, i) => (
          <motion.button
            key={delivery.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
            onClick={() => onShowDeliveryDetail?.(delivery.id)}
            className="w-full rounded-xl p-4 border border-slate-700/30 mb-3 text-left"
            style={{ background: "rgba(15, 23, 42, 0.8)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{delivery.id}</span>
              <span className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500, background: `${delivery.statusColor}20`, color: delivery.statusColor }}>
                {delivery.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.from}</span>
              <span className="text-slate-500">→</span>
              <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.to}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.cargo} · {delivery.weight}</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-300 text-[12px]" style={{ fontFamily: "'Inter', sans-serif" }}>ETA {delivery.eta}</span>
                <ChevronRight size={14} className="text-slate-500" />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
