import { Bell, Truck, Package, Map, Shield, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";
import { useShipments, useMatchProposals, useNotifications } from "../../hooks/useDomain";

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onShowMatch: () => void;
  onShowNotifications?: () => void;
  onShowSafety?: () => void;
  onShowDeliveryDetail?: (deliveryId: string) => void;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  in_transit:  { label: "輸送中",   color: "#06B6D4" },
  pending:     { label: "集荷待ち", color: "#F59E0B" },
  completed:   { label: "完了",     color: "#10B981" },
  cancelled:   { label: "キャンセル", color: "#EF4444" },
};

export function HomeScreen({ onNavigate, onShowMatch, onShowNotifications, onShowSafety, onShowDeliveryDetail }: HomeScreenProps) {
  const { driver } = useAuth();
  const { data: shipmentsPage, loading: shipmentsLoading } = useShipments();
  const { data: proposals } = useMatchProposals();
  const { data: notificationsPage } = useNotifications();

  const shipments = shipmentsPage?.data ?? [];
  const proposalCount = proposals?.length ?? 0;
  const unreadCount = notificationsPage?.data.filter((n) => !n.read).length ?? 0;

  const firstName = driver?.name?.split("太")[0] ?? "田中";
  const nameInitial = driver?.name?.[0] ?? "田";

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
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#EF4444] rounded-full flex items-center justify-center text-[11px] text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button onClick={() => onNavigate("profile")} className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
            {nameInitial}
          </button>
        </div>
      </div>

      {/* Greeting */}
      <div className="px-5 mt-2">
        <h1 className="text-white text-[22px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>こんにちは、{firstName}さん</h1>
        <p className="text-slate-400 text-[14px] mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          残り運転時間: <span className="text-[#06B6D4]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>4h 30m</span>
        </p>
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
              {proposalCount > 0 ? (
                <span className="bg-[#EF4444] text-white text-[12px] px-2 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{proposalCount}件</span>
              ) : (
                <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>なし</span>
              )}
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
            <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              {shipmentsLoading ? "読込中..." : `${shipments.length}件進行中`}
            </span>
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

        {shipmentsLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-xl p-4 border border-slate-700/30 animate-pulse" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <div className="h-3 bg-slate-700 rounded w-24 mb-3" />
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : shipments.length === 0 ? (
          <div className="text-center py-8">
            <Truck size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>進行中の配送はありません</p>
          </div>
        ) : (
          shipments.slice(0, 3).map((delivery, i) => {
            const s = STATUS_LABEL[delivery.status] ?? { label: delivery.status, color: "#94A3B8" };
            return (
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
                  <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{delivery.id.slice(0, 8)}</span>
                  <span className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500, background: `${s.color}20`, color: s.color }}>
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.pickup.name}</span>
                  <span className="text-slate-500">→</span>
                  <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.dropoff.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    {delivery.cargo_desc} · {delivery.weight_kg.toLocaleString()} kg
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-300 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      {new Date(delivery.estimated_delivery).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}着
                    </span>
                    <ChevronRight size={14} className="text-slate-500" />
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
