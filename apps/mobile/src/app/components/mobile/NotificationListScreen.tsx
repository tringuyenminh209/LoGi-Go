import { ArrowLeft, Package, AlertTriangle, CheckCircle2, Truck, Bell, MapPin, Clock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface NotificationListScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

type NotifType = "match" | "delivery" | "earthquake" | "system" | "safety";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  action?: string;
  actionScreen?: string;
}

const notifications: Notification[] = [
  {
    id: "n1",
    type: "match",
    title: "新規マッチリクエスト",
    message: "大阪市中央区 → 東京都港区（精密機器 3,500kg）マッチスコア: 0.92",
    time: "2分前",
    read: false,
    action: "詳細を見る",
    actionScreen: "match",
  },
  {
    id: "n2",
    type: "earthquake",
    title: "⚠️ 地震速報",
    message: "愛知県東部で震度4の地震が発生しました。安全を確認してください。",
    time: "15分前",
    read: false,
    action: "安全情報",
    actionScreen: "safety",
  },
  {
    id: "n3",
    type: "match",
    title: "新規マッチリクエスト",
    message: "名古屋市中区 → 京都市下京区（食品 2,800kg）マッチスコア: 0.87",
    time: "28分前",
    read: false,
    action: "詳細を見る",
    actionScreen: "match",
  },
  {
    id: "n4",
    type: "delivery",
    title: "配達ステータス更新",
    message: "#LG-2847 輸送中 — ETA 17:45 残り78km",
    time: "1時間前",
    read: true,
    action: "配送詳細",
    actionScreen: "delivery-detail:LG-2847",
  },
  {
    id: "n5",
    type: "system",
    title: "運転時間リマインダー",
    message: "連続運転時間が3時間を超えました。休憩を取ってください。",
    time: "1時間前",
    read: true,
  },
  {
    id: "n6",
    type: "delivery",
    title: "配達完了",
    message: "#LG-2839 福岡市博多区 → 広島市中区 の配達が完了しました。",
    time: "3時間前",
    read: true,
    action: "配送詳細",
    actionScreen: "delivery-detail:LG-2839",
  },
  {
    id: "n7",
    type: "safety",
    title: "安全運転スコア更新",
    message: "今週の安全運転スコアが95点に更新されました。素晴らしい！",
    time: "5時間前",
    read: true,
    action: "安全情報",
    actionScreen: "safety",
  },
  {
    id: "n8",
    type: "system",
    title: "アプリ更新のお知らせ",
    message: "Logi-Go v2.4.1 がリリースされました。新機能: リアルタイム地図改善。",
    time: "昨日",
    read: true,
  },
  {
    id: "n9",
    type: "match",
    title: "マッチ承認済み",
    message: "#M-9251 横浜市 → 千葉市（電子部品）が承認されました。",
    time: "昨日",
    read: true,
  },
  {
    id: "n10",
    type: "earthquake",
    title: "地震速報（解除）",
    message: "先ほどの地震による津波の心配はありません。通常運行を再開してください。",
    time: "昨日",
    read: true,
  },
];

const typeConfig: Record<NotifType, { icon: any; color: string; bg: string }> = {
  match: { icon: Package, color: "#2563EB", bg: "rgba(37, 99, 235, 0.15)" },
  delivery: { icon: Truck, color: "#06B6D4", bg: "rgba(6, 182, 212, 0.15)" },
  earthquake: { icon: AlertTriangle, color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" },
  system: { icon: Bell, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" },
  safety: { icon: Shield, color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" },
};

const filterTabs: { label: string; type: NotifType | "all" }[] = [
  { label: "すべて", type: "all" },
  { label: "マッチ", type: "match" },
  { label: "配送", type: "delivery" },
  { label: "警報", type: "earthquake" },
  { label: "その他", type: "system" },
];

export function NotificationListScreen({ onBack, onNavigate }: NotificationListScreenProps) {
  const [activeFilter, setActiveFilter] = useState<NotifType | "all">("all");
  const [readNotifs, setReadNotifs] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.read).map((n) => n.id))
  );

  const filteredNotifs = notifications.filter(
    (n) => activeFilter === "all" || n.type === activeFilter
  );

  const unreadCount = notifications.filter((n) => !readNotifs.has(n.id)).length;

  const markAllRead = () => {
    setReadNotifs(new Set(notifications.map((n) => n.id)));
  };

  const handleNotifClick = (notif: Notification) => {
    setReadNotifs((prev) => new Set([...prev, notif.id]));
    if (notif.actionScreen) {
      onNavigate(notif.actionScreen);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px] flex-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
          通知
        </h1>
        {unreadCount > 0 && (
          <span className="bg-[#EF4444] text-white text-[12px] px-2.5 py-0.5 rounded-full mr-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
            {unreadCount}
          </span>
        )}
        <button
          onClick={markAllRead}
          className="text-[#2563EB] text-[13px]"
          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
        >
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
              activeFilter === tab.type
                ? "bg-[#2563EB] text-white"
                : "bg-slate-800 text-slate-400 border border-slate-700/50"
            }`}
            style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="px-5 space-y-2">
        {filteredNotifs.map((notif, i) => {
          const config = typeConfig[notif.type];
          const Icon = config.icon;
          const isRead = readNotifs.has(notif.id);

          return (
            <motion.button
              key={notif.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() => handleNotifClick(notif)}
              className="w-full rounded-xl p-4 text-left relative overflow-hidden transition-colors"
              style={{
                background: isRead ? "rgba(15, 23, 42, 0.6)" : "rgba(15, 23, 42, 0.9)",
                border: isRead ? "1px solid rgba(51, 65, 85, 0.2)" : "1px solid rgba(51, 65, 85, 0.5)",
              }}
            >
              {/* Unread indicator */}
              {!isRead && (
                <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              )}

              <div className="flex gap-3">
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: config.bg }}
                >
                  <Icon size={20} style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[14px] ${isRead ? "text-slate-300" : "text-white"}`}
                      style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: isRead ? 400 : 600 }}
                    >
                      {notif.title}
                    </span>
                  </div>
                  <p
                    className="text-slate-400 text-[13px] mb-2 line-clamp-2"
                    style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                  >
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={12} />
                      <span className="text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        {notif.time}
                      </span>
                    </div>
                    {notif.action && (
                      <span
                        className="text-[12px]"
                        style={{ color: config.color, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
                      >
                        {notif.action} →
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {filteredNotifs.length === 0 && (
        <div className="text-center py-16">
          <Bell size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            通知はありません
          </p>
        </div>
      )}
    </div>
  );
}
