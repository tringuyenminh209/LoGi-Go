import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ZoomIn, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

interface OcrReviewScreenProps {
  onBack: () => void;
}

const ocrReviewQueue = [
  {
    id: "ocr-001",
    confidence: 0.873,
    source: "FAX",
    senderFax: "06-1234-5678",
    receivedAt: "3月5日 14:23",
    processingTime: 12.3,
    engine: "PaddleOCR + Gemini 3 Pro",
    fields: [
      { key: "shipper_name", label: "荷主名", value: "田中商事㈱", confidence: 0.99, status: "ok" as const },
      { key: "cargo_name", label: "品名", value: "精密機器", confidence: 0.97, status: "ok" as const },
      { key: "weight", label: "重量", value: "3,500 kg", confidence: 0.98, status: "ok" as const },
      { key: "pickup_address", label: "集荷先", value: "大阪市中央区本町3-2-8", confidence: 0.82, status: "warning" as const },
      { key: "delivery_address", label: "配達先", value: "東京都港区芝浦4-16-23", confidence: 0.95, status: "ok" as const },
      { key: "datetime", label: "日時", value: "3月7日 09:00-12:00", confidence: 0.93, status: "ok" as const },
      { key: "phone", label: "電話番号", value: "090-1234-56??", confidence: 0.45, status: "error" as const },
    ],
  },
  {
    id: "ocr-002",
    confidence: 0.945,
    source: "FAX",
    senderFax: "03-9876-5432",
    receivedAt: "3月5日 13:10",
    processingTime: 8.7,
    engine: "PaddleOCR + Gemini 3 Pro",
    fields: [
      { key: "shipper_name", label: "荷主名", value: "山田電機㈱", confidence: 0.99, status: "ok" as const },
      { key: "cargo_name", label: "品名", value: "電子部品", confidence: 0.98, status: "ok" as const },
      { key: "weight", label: "重量", value: "2,100 kg", confidence: 0.97, status: "ok" as const },
      { key: "pickup_address", label: "集荷先", value: "名古屋市中区栄2-17-1", confidence: 0.96, status: "ok" as const },
      { key: "delivery_address", label: "配達先", value: "横浜市中区桜木町1-1", confidence: 0.94, status: "ok" as const },
      { key: "datetime", label: "日時", value: "3月6日 14:00-18:00", confidence: 0.91, status: "ok" as const },
      { key: "phone", label: "電話番号", value: "052-123-4567", confidence: 0.95, status: "ok" as const },
    ],
  },
  {
    id: "ocr-003",
    confidence: 0.781,
    source: "手書きFAX",
    senderFax: "092-456-7890",
    receivedAt: "3月5日 11:45",
    processingTime: 18.5,
    engine: "PaddleOCR + Gemini 3 Pro",
    fields: [
      { key: "shipper_name", label: "荷主名", value: "佐藤テキスタイル㈱", confidence: 0.88, status: "warning" as const },
      { key: "cargo_name", label: "品名", value: "衣料品", confidence: 0.85, status: "warning" as const },
      { key: "weight", label: "重量", value: "1,800 kg", confidence: 0.92, status: "ok" as const },
      { key: "pickup_address", label: "集荷先", value: "福岡市博多区博多駅南5-??-3", confidence: 0.55, status: "error" as const },
      { key: "delivery_address", label: "配達先", value: "広島市中区基町6-78", confidence: 0.79, status: "warning" as const },
      { key: "datetime", label: "日時", value: "3月8日 06:00-12:00", confidence: 0.70, status: "warning" as const },
      { key: "phone", label: "電話番号", value: "092-???-7890", confidence: 0.35, status: "error" as const },
    ],
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  const remaining = ocrReviewQueue.filter((q) => !processedIds.has(q.id));
  const current = remaining[0] || ocrReviewQueue[currentIndex];

  if (!current) {
    return (
      <div className="min-h-screen pb-24 flex flex-col items-center justify-center" style={{ background: "#0A1628" }}>
        <CheckCircle2 size={48} className="text-[#10B981] mb-4" />
        <p className="text-white text-[16px] mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>すべて処理済み</p>
        <p className="text-slate-400 text-[13px] mb-6" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>キューに待ちはありません</p>
        <button onClick={onBack} className="px-6 py-3 rounded-xl text-white text-[14px]" style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
          ホームに戻る
        </button>
      </div>
    );
  }

  const handleApprove = () => {
    setProcessedIds((prev) => new Set([...prev, current.id]));
    setEditingField(null);
    setFieldValues({});
  };

  const handleReject = () => {
    setProcessedIds((prev) => new Set([...prev, current.id]));
    setEditingField(null);
    setFieldValues({});
  };

  const getFieldValue = (field: typeof current.fields[0]) => {
    return fieldValues[`${current.id}-${field.key}`] ?? field.value;
  };

  const statusIcon = (status: string) => {
    if (status === "ok") return <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />;
    if (status === "warning") return <AlertTriangle size={14} className="text-[#F59E0B] shrink-0" />;
    return <XCircle size={14} className="text-[#EF4444] shrink-0" />;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px] flex-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>OCR確認キュー</h1>
        <span className="bg-[#F59E0B] text-white text-[12px] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
          {remaining.length}件待ち
        </span>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Confidence */}
        <ConfidenceBar confidence={current.confidence} />

        {/* Image Viewer (Mock) */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <div className="p-3 border-b border-slate-700/20 flex items-center justify-between">
            <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>原本画像</span>
            <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{current.source} · {current.senderFax}</span>
          </div>
          <div className="h-[180px] flex items-center justify-center relative" style={{ background: "rgba(30, 41, 59, 0.5)" }}>
            {/* Mock fax image representation */}
            <div className="w-[85%] h-[160px] rounded-lg bg-white/5 border border-dashed border-slate-600 p-3 overflow-hidden">
              <div className="space-y-2">
                <div className="h-2 bg-slate-600/30 rounded w-1/3" />
                <div className="h-2 bg-slate-600/30 rounded w-full" />
                <div className="h-2 bg-slate-600/30 rounded w-4/5" />
                <div className="h-2 bg-[#F59E0B]/20 rounded w-3/5 border border-[#F59E0B]/30" />
                <div className="h-2 bg-slate-600/30 rounded w-full" />
                <div className="h-2 bg-slate-600/30 rounded w-2/3" />
                <div className="h-2 bg-[#EF4444]/20 rounded w-2/5 border border-[#EF4444]/30" />
                <div className="h-2 bg-slate-600/30 rounded w-4/5" />
              </div>
            </div>
            <div className="absolute bottom-2 right-3 flex items-center gap-1 text-slate-500 text-[10px]">
              <ZoomIn size={12} />
              <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ピンチしてズーム可能</span>
            </div>
          </div>
        </div>

        {/* OCR Results Table */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <div className="p-3 border-b border-slate-700/20 flex items-center gap-2">
            <FileText size={16} className="text-[#06B6D4]" />
            <span className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>📋 OCR結果</span>
          </div>

          {current.fields.map((field, i) => {
            const isEditing = editingField === `${current.id}-${field.key}`;
            const value = getFieldValue(field);

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
                      onChange={(e) => setFieldValues((prev) => ({ ...prev, [`${current.id}-${field.key}`]: e.target.value }))}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                      className="w-full bg-transparent text-white text-[14px] outline-none border-b-2 border-[#2563EB] pb-1"
                      style={{ fontFamily: field.key === "phone" || field.key === "weight" ? "'Inter', sans-serif" : "'Noto Sans JP', sans-serif" }}
                    />
                  ) : (
                    <div>
                      <span
                        className="text-white text-[14px]"
                        style={{
                          fontFamily: field.key === "phone" || field.key === "weight" ? "'Inter', sans-serif" : "'Noto Sans JP', sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        {value}
                      </span>
                      {field.status !== "ok" && (
                        <button
                          onClick={() => setEditingField(`${current.id}-${field.key}`)}
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

        {/* Engine Info */}
        <div className="flex items-center justify-between text-slate-500 text-[11px] px-1">
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>OCR Engine: {current.engine}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>処理時間: {current.processingTime}秒</span>
        </div>

        {/* Action Buttons */}
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
