import { ArrowLeft, Package, AlertTriangle, Truck, Bell, Clock, Shield, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useNotifications, useNotificationActions, type ApiNotification } from "../../hooks/useDomain";
import { apiFetch } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";

interface NotificationListScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: unknown) => void;
}

type NotifType = "match" | "delivery" | "earthquake" | "system" | "safety" | "carbon";

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  match:     { icon: Package,       color: "#2563EB", bg: "rgba(37, 99, 235, 0.15)" },
  delivery:  { icon: Truck,         color: "#06B6D4", bg: "rgba(6, 182, 212, 0.15)" },
  earthquake:{ icon: AlertTriangle, color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" },
  system:    { icon: Bell,          color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
  safety:    { icon: Shield,        color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
  carbon:    { icon: Package,       color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
};
const DEFAULT_CONFIG = { icon: Bell, color: "#94A3B8", bg: "rgba(148, 163, 184, 0.15)" };

const filterTabs: { label: string; type: NotifType | "all" }[] = [
  { label: "すべて", type: "all" },
  { label: "マッチ", type: "match" },
  { label: "配送", type: "delivery" },
  { label: "警報", type: "earthquake" },
  { label: "その他", type: "system" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return "たった今";
  if (m < 60)  return `${m}分前`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}時間前`;
  return `${Math.floor(h / 24)}日前`;
}

export function NotificationListScreen({ onBack, onNavigate }: NotificationListScreenProps) {
  const { token, refreshToken } = useAuth();
  const { data: page, loading, refetch } = useNotifications();
  const { mutate } = useNotificationActions();

  const [activeFilter, setActiveFilter] = useState<NotifType | "all">("all");
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const notifications: ApiNotification[] = page?.data ?? [];

  const isRead = (n: ApiNotification) => n.read || localRead.has(n.id);
  const filtered = notifications.filter((n) => activeFilter === "all" || n.type === activeFilter);
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  const handleNotifClick = async (n: ApiNotification) => {
    if (!isRead(n)) {
      setLocalRead((prev) => new Set([...prev, n.id]));
      await apiFetch(`/api/v1/notifications/${n.id}/read`, token, refreshToken, { method: "PUT" }).catch(() => {});
    }
    const matchId = n.data?.match_id;
    if (n.type === "match" && matchId) {
      onNavigate("match");
    } else if (n.type === "carbon") {
      onNavigate("carbon");
    } else if (n.type === "safety" || n.type === "earthquake") {
      onNavigate("safety");
    }
  };

  const markAllRead = async () => {
    setLocalRead(new Set(notifications.map((n) => n.id)));
    await mutate("/api/v1/notifications/read-all", {}, "PUT").catch(() => {});
    refetch();
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px] flex-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>通知</h1>
        {unreadCount > 0 && (
          <span className="bg-[#EF4444] text-white text-[12px] px-2.5 py-0.5 rounded-full mr-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            {unreadCount}
          </span>
        )}
        <button onClick={markAllRead} className="text-[#2563EB] text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          すべて既読
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-5 mt-4 mb-4 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.type}
            onClick={() => setActiveFilter(tab.type)}
            className={`px-3 py-1.5 rounded-full text-[12px] whitespace-nowrap ${
              activeFilter === tab.type ? "bg-[#2563EB] text-white" : "bg-slate-800 text-slate-400 border border-slate-700/50"
            }`}
            style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>読込中...</span>
        </div>
      ) : (
        <div className="px-5 space-y-2">
          {filtered.map((notif, i) => {
            const config = typeConfig[notif.type] ?? DEFAULT_CONFIG;
            const Icon = config.icon;
            const read = isRead(notif);

            return (
              <motion.button
                key={notif.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                onClick={() => handleNotifClick(notif)}
                className="w-full rounded-xl p-4 text-left relative overflow-hidden transition-colors"
                style={{
                  background: read ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.9)",
                  border: read ? "1px solid rgba(51, 65, 85, 0.2)" : "1px solid rgba(51, 65, 85, 0.5)",
                }}
              >
                {!read && <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#2563EB]" />}
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{ background: config.bg }}>
                    <Icon size={20} style={{ color: config.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[14px] ${read ? "text-slate-300" : "text-white"}`} style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: read ? 400 : 600 }}>
                      {notif.title}
                    </span>
                    <p className="text-slate-400 text-[13px] mt-0.5 mb-2 line-clamp-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      {notif.body}
                    </p>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} />
                      <span className="text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{timeAgo(notif.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Bell size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>通知はありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
