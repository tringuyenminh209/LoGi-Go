import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ArrowRight, CheckCheck } from "lucide-react";
import { useNotifications } from "./notification-context";
import { notificationTypeConfig, type NotificationType } from "./notification-data";

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const filterTabs: { key: string; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "disaster", label: "緊急" },
  { key: "ocr", label: "OCR" },
  { key: "match", label: "マッチ" },
  { key: "system", label: "システム" },
];

export function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [btnPos, setBtnPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCount = useRef(unreadCount);

  // badge bounce on change
  const [bounce, setBounce] = useState(false);
  useEffect(() => {
    if (unreadCount !== prevCount.current) {
      setBounce(true);
      prevCount.current = unreadCount;
      const t = setTimeout(() => setBounce(false), 400);
      return () => clearTimeout(t);
    }
  }, [unreadCount]);

  // click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const toggle = useCallback(() => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setBtnPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right - 8 });
    }
    setOpen((v) => !v);
  }, [open]);

  const filtered = filter === "all"
    ? notifications
    : notifications.filter((n) => {
        if (filter === "match") return n.type === "match" || n.type === "delivery";
        if (filter === "system") return n.type === "system" || n.type === "integration" || n.type === "security";
        return n.type === filter;
      });

  const displayItems = filtered.slice(0, 8);

  const handleItemClick = (id: string, path: string) => {
    markRead(id);
    setOpen(false);
    if (path) navigate(path);
  };

  return (
    <>
      {/* Bell button */}
      <button
        ref={btnRef}
        onClick={toggle}
        className="relative rounded-lg p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03] transition-colors"
      >
        <Bell size={18} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: bounce ? [1, 1.25, 1] : 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -right-1 -top-1 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#EF4444] px-1"
            >
              <span className="text-[10px] text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown panel – fixed position to avoid overflow clipping */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="fixed w-[420px] rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#0D1B2E] z-[9999]"
            style={{
              top: btnPos.top,
              right: btnPos.right,
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <span className="text-[15px] text-[#F8FAFC]">通知</span>
              <span className="text-[12px] text-[#64748B]">{unreadCount}件未読</span>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 px-4 pb-3 flex-wrap">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`rounded-full px-3 py-1 text-[12px] transition-colors ${
                    filter === tab.key
                      ? "bg-[#2563EB]/10 text-[#2563EB]"
                      : "text-[#64748B] hover:text-[#F8FAFC]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Items – explicit max-height for scrolling */}
            <div
              className="overflow-y-auto border-t border-[rgba(203,213,225,0.06)]"
              style={{ maxHeight: 360 }}
            >
              {displayItems.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-[13px] text-[#64748B]">
                  通知はありません
                </div>
              ) : (
                displayItems.map((item) => {
                  const cfg = notificationTypeConfig[item.type as NotificationType];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item.id, item.actionPath)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03] ${
                        !item.read ? "bg-[rgba(255,255,255,0.02)]" : ""
                      }`}
                      style={{
                        borderLeft: !item.read ? `2px solid ${cfg.color}` : "2px solid transparent",
                      }}
                    >
                      {/* Icon */}
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ backgroundColor: hexToRgba(cfg.color, 0.12) }}
                      >
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] truncate ${!item.read ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>
                          {item.title}
                        </p>
                        <p className="text-[12px] text-[#64748B] truncate mt-0.5">
                          {item.body}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[11px] text-[#475569]">{item.time}</span>
                          {item.actionLabel && (
                            <span className="text-[12px] text-[#2563EB] hover:underline">
                              {item.actionLabel} →
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Unread dot */}
                      {!item.read && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cfg.color }} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-[rgba(203,213,225,0.06)] px-4 py-3">
              <button
                onClick={() => { markAllRead(); }}
                className="flex items-center gap-1.5 text-[12px] text-[#64748B] hover:text-[#F8FAFC] transition-colors"
              >
                <CheckCheck size={14} />
                すべて既読
              </button>
              <button
                onClick={() => { setOpen(false); navigate("/notifications"); }}
                className="flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline"
              >
                すべての通知を表示
                <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
