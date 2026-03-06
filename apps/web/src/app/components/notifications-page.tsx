import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Bell, ChevronLeft, ChevronRight, CheckCheck, Trash2, Filter,
  ArrowRight,
} from "lucide-react";
import { useNotifications } from "./notification-context";
import {
  notificationTypeConfig,
  type Notification,
  type NotificationType,
} from "./notification-data";

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const ITEMS_PER_PAGE = 15;

const typeTabs: { key: string; label: string; color?: string }[] = [
  { key: "all", label: "すべて" },
  { key: "disaster", label: "緊急", color: "#EF4444" },
  { key: "ocr", label: "OCR", color: "#F59E0B" },
  { key: "match", label: "マッチ", color: "#10B981" },
  { key: "integration", label: "連携", color: "#2563EB" },
  { key: "security", label: "セキュリティ", color: "#8B5CF6" },
  { key: "system", label: "システム", color: "#64748B" },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, markRead, markAllRead, deleteNotifications } = useNotifications();
  const [filter, setFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let items = notifications;
    if (filter !== "all") {
      items = items.filter((n) => {
        if (filter === "match") return n.type === "match" || n.type === "delivery";
        return n.type === filter;
      });
    }
    if (unreadOnly) {
      items = items.filter((n) => !n.read);
    }
    return items;
  }, [notifications, filter, unreadOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // counts by type
  const typeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of notifications) {
      if (!n.read) {
        const k = n.type === "delivery" ? "match" : n.type;
        map[k] = (map[k] || 0) + 1;
      }
    }
    return map;
  }, [notifications]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((n) => n.id)));
    }
  };

  const handleBulkRead = () => {
    selected.forEach((id) => markRead(id));
    setSelected(new Set());
  };

  const handleBulkDelete = () => {
    deleteNotifications(Array.from(selected));
    setSelected(new Set());
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB]/10">
            <Bell size={20} className="text-[#2563EB]" />
          </div>
          <div>
            <h1 className="text-[22px] text-[#F8FAFC]">通知センター</h1>
            <p className="text-[13px] text-[#64748B]">すべてのシステム通知・アラートの管理</p>
          </div>
        </div>
      </motion.div>

      {/* Filters card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="mt-5 rounded-xl border border-[rgba(203,213,225,0.06)] bg-[#111D32] p-4"
      >
        {/* Type tabs */}
        <div className="flex flex-wrap gap-1.5">
          {typeTabs.map((tab) => {
            const count = tab.key === "all" ? undefined : typeCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => { setFilter(tab.key); setPage(1); }}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors ${
                  filter === tab.key
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03]"
                }`}
              >
                {tab.color && (
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />
                )}
                {tab.label}
                {count != null && count > 0 && (
                  <span className="ml-0.5 rounded-full bg-white/5 px-1.5 py-0.5 text-[10px]">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary filters */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[rgba(203,213,225,0.06)]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={() => { setUnreadOnly(!unreadOnly); setPage(1); }}
              className="h-3.5 w-3.5 rounded border-[rgba(203,213,225,0.2)] bg-[#0A1628] accent-[#2563EB]"
            />
            <span className="text-[12px] text-[#94A3B8]">未読のみ</span>
          </label>

          <div className="ml-auto">
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03] transition-colors"
            >
              <CheckCheck size={14} />
              すべて既読
            </button>
          </div>
        </div>
      </motion.div>

      {/* Notification list */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="mt-4 rounded-xl border border-[rgba(203,213,225,0.06)] bg-[#111D32] overflow-hidden"
      >
        {/* Select-all bar */}
        {paged.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[rgba(203,213,225,0.06)] bg-[#0D1B2E]/50">
            <input
              type="checkbox"
              checked={selected.size === paged.length && paged.length > 0}
              onChange={toggleSelectAll}
              className="h-3.5 w-3.5 rounded border-[rgba(203,213,225,0.2)] bg-[#0A1628] accent-[#2563EB]"
            />
            {selected.size > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-[#94A3B8]">選択した通知: {selected.size}件</span>
                <button
                  onClick={handleBulkRead}
                  className="flex items-center gap-1 rounded-md bg-[#2563EB]/10 px-2.5 py-1 text-[11px] text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors"
                >
                  <CheckCheck size={12} />
                  既読にする
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 rounded-md bg-[#EF4444]/10 px-2.5 py-1 text-[11px] text-[#EF4444] hover:bg-[#EF4444]/20 transition-colors"
                >
                  <Trash2 size={12} />
                  削除
                </button>
              </div>
            ) : (
              <span className="text-[12px] text-[#475569]">
                {filtered.length}件の通知
              </span>
            )}
          </div>
        )}

        {/* Items */}
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Bell size={32} className="text-[#1E293B] mb-3" />
            <p className="text-[13px] text-[#64748B]">通知はありません</p>
          </div>
        ) : (
          paged.map((item, i) => (
            <NotificationRow
              key={item.id}
              item={item}
              index={i}
              isSelected={selected.has(item.id)}
              onToggleSelect={() => toggleSelect(item.id)}
              onClick={() => {
                markRead(item.id);
                if (item.actionPath) navigate(item.actionPath);
              }}
              onAction={() => {
                markRead(item.id);
                if (item.actionPath) navigate(item.actionPath);
              }}
            />
          ))
        )}
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-1.5 mt-4"
        >
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03] disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-8 w-8 rounded-lg text-[12px] transition-colors ${
                p === page
                  ? "bg-[#2563EB]/10 text-[#2563EB]"
                  : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03]"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="flex items-center justify-center h-8 w-8 rounded-lg text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03] disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ── Single notification row ────────────────────────────────── */
function NotificationRow({
  item,
  index,
  isSelected,
  onToggleSelect,
  onClick,
  onAction,
}: {
  item: Notification;
  index: number;
  isSelected: boolean;
  onToggleSelect: () => void;
  onClick: () => void;
  onAction: () => void;
}) {
  const cfg = notificationTypeConfig[item.type as NotificationType];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className={`flex gap-3 px-4 py-3.5 border-b border-[rgba(203,213,225,0.04)] transition-colors hover:bg-white/[0.03] cursor-pointer ${
        !item.read ? "bg-white/[0.015]" : ""
      }`}
      style={{
        borderLeft: !item.read ? `3px solid ${cfg.color}` : "3px solid transparent",
      }}
    >
      {/* Checkbox */}
      <div className="flex items-start pt-1">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 rounded border-[rgba(203,213,225,0.2)] bg-[#0A1628] accent-[#2563EB]"
        />
      </div>

      {/* Icon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full mt-0.5"
        style={{ backgroundColor: hexToRgba(cfg.color, 0.12) }}
        onClick={onClick}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={onClick}>
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[13px] ${!item.read ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>
            {item.title}
          </p>
          {!item.read && (
            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cfg.color }} />
          )}
        </div>
        <p className={`text-[12px] mt-0.5 ${!item.read ? "text-[#94A3B8]" : "text-[#64748B]"}`}>
          {item.body}
        </p>
        {item.details && (
          <p className="text-[12px] text-[#475569] mt-0.5">{item.details}</p>
        )}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[11px] text-[#475569]">{item.time}</span>
          <span className="text-[11px] text-[#475569]">·</span>
          <span className="text-[11px] text-[#475569]">{item.module}</span>
          {item.actionLabel && (
            <button
              onClick={(e) => { e.stopPropagation(); onAction(); }}
              className="ml-auto flex items-center gap-1 text-[12px] text-[#2563EB] hover:underline"
            >
              {item.actionLabel}
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}