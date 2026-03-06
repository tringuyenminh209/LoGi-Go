import {
  createContext, useContext, useState, useCallback, useEffect,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { AlertTriangle, FileText, Truck, Link2 } from "lucide-react";
import type { Notification } from "./notification-data";
import { mockNotifications } from "./notification-data";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteNotifications: (ids: string[]) => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markRead: () => {},
  markAllRead: () => {},
  deleteNotifications: () => {},
});

/* ── Custom toast component ────────────────────────────────── */
function ToastContent({
  title,
  body,
  borderColor,
  actionLabel,
  actionPath,
  onAction,
}: {
  title: string;
  body: string;
  borderColor: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: (path: string) => void;
}) {
  return (
    <div
      className="flex flex-col gap-1 py-1"
      style={{ borderLeft: `4px solid ${borderColor}`, paddingLeft: 12 }}
    >
      <span className="text-[13px] text-[#F8FAFC]">{title}</span>
      <span className="text-[12px] text-[#94A3B8]">{body}</span>
      {actionLabel && actionPath && onAction && (
        <button
          onClick={() => onAction(actionPath)}
          className="mt-1 self-start text-[12px] text-[#2563EB] hover:underline"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

/* ── Demo toast triggers ───────────────────────────────────── */
const demoToasts = [
  {
    delay: 15000,
    notification: {
      id: "toast-1",
      type: "match" as const,
      priority: "info" as const,
      read: false,
      title: "マッチ成功 — M-8476",
      body: "㈱鈴木商事 · 東京→名古屋 · スコア: 0.91",
      details: "ドライバー: 高橋一郎 · 積載率: 58%→84%",
      time: "たった今",
      module: "マッチングエンジン",
      actionLabel: "詳細へ",
      actionPath: "/matching",
    },
    color: "#10B981",
    duration: 5000,
  },
  {
    delay: 30000,
    notification: {
      id: "toast-2",
      type: "ocr" as const,
      priority: "warning" as const,
      read: false,
      title: "OCR確認待ち — FAX #2852",
      body: "㈱佐藤工業 · 信頼度: 81.2%",
      details: "要確認フィールド: 住所 (65%), 品名 (74%)",
      time: "たった今",
      module: "レガシーブリッジ",
      actionLabel: "確認する",
      actionPath: "/legacy-bridge",
    },
    color: "#F59E0B",
    duration: 10000,
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteNotifications = useCallback((ids: string[]) => {
    setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
  }, []);

  /* fire demo toasts once after mount */
  const [firedToasts, setFiredToasts] = useState(false);
  useEffect(() => {
    if (firedToasts) return;
    setFiredToasts(true);

    const timers = demoToasts.map((dt) =>
      setTimeout(() => {
        // add to list
        setNotifications((prev) => [dt.notification, ...prev]);

        // show toast
        toast.custom(
          (t) => (
            <div
              className="w-[356px] rounded-lg border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-3 shadow-xl cursor-pointer"
              onClick={() => toast.dismiss(t)}
            >
              <ToastContent
                title={dt.notification.title}
                body={dt.notification.body}
                borderColor={dt.color}
                actionLabel={dt.notification.actionLabel}
                actionPath={dt.notification.actionPath}
              />
            </div>
          ),
          { duration: dt.duration }
        );
      }, dt.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [firedToasts]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markRead, markAllRead, deleteNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
