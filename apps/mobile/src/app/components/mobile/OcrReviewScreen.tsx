import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ZoomIn, FileText } from "lucide-react";
import { motion } from "motion/react";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useOcrReviewQueue, useOcrActions, type OcrJob } from "../../hooks/useDomain";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../hooks/useApi";

interface OcrReviewScreenProps {
  onBack: () => void;
}

// Map raw API data fields to display fields with confidence thresholds
function buildDisplayFields(job: OcrJob) {
  const d = job.data;
  const fields: { key: string; label: string; value: string; confidence: number; status: "ok" | "warning" | "error" }[] = [];

  const push = (key: string, label: string, value: string | number | null | undefined, confOffset = 0) => {
    const val = value != null ? String(value) : "";
    if (!val) return;
    // Use job overall confidence per-field, adjusted slightly per field
    const c = Math.min(1, Math.max(0, job.confidence + confOffset));
    const status: "ok" | "warning" | "error" = c >= 0.90 ? "ok" : c >= 0.75 ? "warning" : "error";
    fields.push({ key, label, value: val, confidence: Math.round(c * 100) / 100, status });
  };

  push("shipper_name",      "荷主名",   d.shipper_name,      0.02);
  push("cargo_description", "品名",     d.cargo_description, 0.01);
  push("weight_kg",         "重量",     d.weight_kg != null ? `${d.weight_kg} kg` : null, 0);
  push("shipper_address",   "集荷先",   d.shipper_address,   -0.05);
  push("consignee_address", "配達先",   d.consignee_address, 0.01);
  push("pickup_datetime",   "集荷日時", d.pickup_datetime,   0.02);
  push("phone",             "電話番号", d.phone,             -0.15);

  return fields;
}

// Static demo queue used when API returns empty (no DB yet)
const DEMO_QUEUE: OcrJob[] = [
  {
    job_id: "demo-001",
    status: "completed",
    confidence: 0.873,
    needs_review: true,
    queued_at: new Date(Date.now() - 30 * 60000).toISOString(),
    data: {
      shipper_name: "田中商事㈱",
      shipper_address: "大阪市中央区本町3-2-8",
      consignee_address: "東京都港区芝浦4-16-23",
      cargo_description: "精密機器",
      weight_kg: 3500,
      pickup_datetime: "3月7日 09:00-12:00",
      phone: "090-1234-56??",
    },
  },
  {
    job_id: "demo-002",
    status: "completed",
    confidence: 0.945,
    needs_review: true,
    queued_at: new Date(Date.now() - 60 * 60000).toISOString(),
    data: {
      shipper_name: "山田電機㈱",
      shipper_address: "名古屋市中区栄2-17-1",
      consignee_address: "横浜市中区桜木町1-1",
      cargo_description: "電子部品",
      weight_kg: 2100,
      pickup_datetime: "3月6日 14:00-18:00",
      phone: "052-123-4567",
    },
  },
];

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color = confidence >= 0.95 ? "#10B981" : confidence >= 0.8 ? "#F59E0B" : "#EF4444";
  const label = confidence >= 0.95 ? "高信頼" : confidence >= 0.8 ? "⚠️ 要確認" : "❌ 低信頼";
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
          信頼度: <span style={{ color, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{(confidence * 100).toFixed(1)}%</span>
        </span>
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${confidence * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export function OcrReviewScreen({ onBack }: OcrReviewScreenProps) {
  const { token, refreshToken } = useAuth();
  const { data: apiQueue, loading, refetch } = useOcrReviewQueue();
  const { mutate } = useOcrActions();

  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Use API data when available, fall back to demo
  const rawQueue: OcrJob[] = (apiQueue && apiQueue.length > 0) ? apiQueue : DEMO_QUEUE;
  const queue = rawQueue.filter((q) => !processedIds.has(q.job_id));
  const current = queue[0];

  const getFieldValue = (jobId: string, field: ReturnType<typeof buildDisplayFields>[0]) =>
    fieldValues[`${jobId}-${field.key}`] ?? field.value;

  const handleApprove = useCallback(async () => {
    if (!current) return;
    // Collect any manually corrected fields
    const corrected: Record<string, string> = {};
    for (const [k, v] of Object.entries(fieldValues)) {
      if (k.startsWith(`${current.job_id}-`)) {
        corrected[k.replace(`${current.job_id}-`, "")] = v;
      }
    }
    try {
      await apiFetch(
        `/api/v1/ocr/jobs/${current.job_id}/confirm`,
        token,
        refreshToken,
        { method: "POST", body: JSON.stringify({ fields: corrected }) },
      );
      toast.success("承認して配送依頼を作成しました");
    } catch {
      toast.error("送信に失敗しました（デモ承認）");
    }
    setProcessedIds((prev) => new Set([...prev, current.job_id]));
    setEditingField(null);
    setFieldValues({});
  }, [current, fieldValues, token, refreshToken]);

  const handleReject = useCallback(async () => {
    if (!current) return;
    try {
      await apiFetch(
        `/api/v1/ocr/jobs/${current.job_id}/reject`,
        token,
        refreshToken,
        { method: "POST" },
      );
      toast.info("却下しました");
    } catch {
      // silent — still remove from queue
    }
    setProcessedIds((prev) => new Set([...prev, current.job_id]));
    setEditingField(null);
    setFieldValues({});
  }, [current, token, refreshToken]);

  const statusIcon = (status: string) => {
    if (status === "ok") return <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />;
    if (status === "warning") return <AlertTriangle size={14} className="text-[#F59E0B] shrink-0" />;
    return <XCircle size={14} className="text-[#EF4444] shrink-0" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A1628" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[#06B6D4] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen pb-24 flex flex-col items-center justify-center" style={{ background: "#0A1628" }}>
        <CheckCircle2 size={48} className="text-[#10B981] mb-4" />
        <p className="text-white text-[16px] mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>すべて処理済み</p>
        <p className="text-slate-400 text-[13px] mb-6" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>キューに待ちはありません</p>
        <button
          onClick={() => { setProcessedIds(new Set()); refetch(); }}
          className="px-6 py-3 rounded-xl text-white text-[14px]"
          style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
        >
          更新する
        </button>
      </div>
    );
  }

  const displayFields = buildDisplayFields(current);

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px] flex-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>OCR確認キュー</h1>
        <span className="bg-[#F59E0B] text-white text-[12px] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
          {queue.length}件待ち
        </span>
      </div>

      <div className="px-5 mt-4 space-y-4">
        <ConfidenceBar confidence={current.confidence} />

        {/* Image viewer (mock frame) */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <div className="p-3 border-b border-slate-700/20 flex items-center justify-between">
            <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>原本画像</span>
            <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>{current.job_id.slice(0, 12)}</span>
          </div>
          <div className="h-[180px] flex items-center justify-center relative" style={{ background: "rgba(30, 41, 59, 0.5)" }}>
            <div className="w-[85%] h-[160px] rounded-lg bg-white/5 border border-dashed border-slate-600 p-3 overflow-hidden">
              <div className="space-y-2">
                {[1/3, 1, 4/5, 3/5, 1, 2/3, 2/5, 4/5].map((w, i) => (
                  <div
                    key={i}
                    className="h-2 rounded"
                    style={{
                      width: `${w * 100}%`,
                      background: i === 3 ? "rgba(245,158,11,0.25)" : i === 6 ? "rgba(239,68,68,0.2)" : "rgba(100,116,139,0.3)",
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-slate-500 text-[10px]">
              <ZoomIn size={12} />
              <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ピンチしてズーム可能</span>
            </div>
          </div>
        </div>

        {/* OCR result fields */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <div className="p-3 border-b border-slate-700/20 flex items-center gap-2">
            <FileText size={16} className="text-[#06B6D4]" />
            <span className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>📋 OCR結果</span>
          </div>

          {displayFields.map((field, i) => {
            const isEditing = editingField === `${current.job_id}-${field.key}`;
            const value = getFieldValue(current.job_id, field);

            return (
              <motion.div
                key={field.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 px-4 py-3 ${i > 0 ? "border-t border-slate-700/20" : ""}`}
              >
                <div className="w-16 shrink-0">
                  <span className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{field.label}</span>
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [`${current.job_id}-${field.key}`]: e.target.value }))}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="w-full bg-transparent text-white text-[14px] outline-none border-b-2 border-[#2563EB] pb-1"
                      style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                    />
                  ) : (
                    <div>
                      <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                        {value}
                      </span>
                      {field.status !== "ok" && (
                        <button
                          onClick={() => setEditingField(`${current.job_id}-${field.key}`)}
                          className="text-[#2563EB] text-[11px] block mt-0.5"
                          style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
                        >
                          [タップして修正]
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {statusIcon(field.status)}
              </motion.div>
            );
          })}
        </div>

        {/* Engine info */}
        <div className="flex items-center justify-between text-slate-500 text-[11px] px-1">
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Engine: PaddleOCR + Gemini 1.5 Pro</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {current.queued_at ? new Date(current.queued_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "—"}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-2">
          <button
            onClick={handleReject}
            className="flex-1 py-3.5 rounded-xl text-[#EF4444] text-[14px] border border-[#EF4444]/30 flex items-center justify-center gap-2"
            style={{ background: "rgba(239, 68, 68, 0.05)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
          >
            ❌ 却下
          </button>
          <button
            onClick={handleApprove}
            className="flex-1 py-3.5 rounded-xl text-white text-[14px] flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #059669, #10B981)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
          >
            ✅ 承認して送信
          </button>
        </div>
      </div>
    </div>
  );
}
