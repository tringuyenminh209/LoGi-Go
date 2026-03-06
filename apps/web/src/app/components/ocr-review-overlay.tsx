import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Check, AlertTriangle, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";

const reviewItem = {
  id: "FAX #2851",
  confidence: 0.873,
  sender: "㈱中村建設",
  fax: "022-XXXX-XXXX",
  engine: "PaddleOCR + Gemini 3 Pro",
  processingTime: 18.2,
  fields: [
    { label: "荷主名", value: "中村建設㈱", confidence: 0.99, status: "ok" as const },
    { label: "電話番号", value: "022-XXXX-XXXX", confidence: 0.97, status: "ok" as const },
    { label: "品名", value: "建設資材", confidence: 0.96, status: "ok" as const },
    { label: "重量", value: "9,500 kg", confidence: 0.98, status: "ok" as const },
    { label: "集荷先", value: "仙台市青葉区...", confidence: 0.78, status: "warning" as const },
    { label: "配達先", value: "東京都千代田区", confidence: 0.95, status: "ok" as const },
    { label: "希望日時", value: "3月8日 午前", confidence: 0.91, status: "ok" as const },
    { label: "備考", value: "大型車両指定", confidence: 0.82, status: "warning" as const },
  ],
};

export function OcrReviewOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [zoom, setZoom] = useState(100);
  const [fields, setFields] = useState(reviewItem.fields.map(f => ({ ...f, editing: false, editValue: f.value })));

  const updateField = (index: number, value: string) => {
    const next = [...fields];
    next[index] = { ...next[index], editValue: value };
    setFields(next);
  };

  const toggleEdit = (index: number) => {
    const next = [...fields];
    next[index] = { ...next[index], editing: !next[index].editing };
    setFields(next);
  };

  const handleApprove = () => {
    toast.success("OCR結果を承認しました");
    onClose();
  };

  const handleReject = () => {
    toast.error("OCR結果を却下しました");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-[#0A1628]/95 backdrop-blur-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[rgba(203,213,225,0.08)] bg-[#0D1B2E] px-6 py-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-[16px] font-[600] text-[#F8FAFC]">OCR確認</span>
              <span className="text-[14px] font-mono text-[#06B6D4]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{reviewItem.id}</span>
            </div>
            <button onClick={onClose} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/[0.03] transition-colors">
              <X size={18} /> 閉じる
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left — FAX image */}
            <div className="flex-1 flex flex-col border-r border-[rgba(203,213,225,0.08)]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(203,213,225,0.06)] bg-[#0D1B2E]/50">
                <span className="text-[13px] text-[#94A3B8]">原本FAX画像</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="rounded-md bg-[#162236] p-1.5 text-[#64748B] hover:text-[#F8FAFC]"><ZoomOut size={14} /></button>
                  <span className="text-[11px] text-[#64748B] font-mono w-10 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{zoom}%</span>
                  <button onClick={() => setZoom(z => Math.min(200, z + 25))} className="rounded-md bg-[#162236] p-1.5 text-[#64748B] hover:text-[#F8FAFC]"><ZoomIn size={14} /></button>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 flex items-start justify-center" style={{ background: "linear-gradient(180deg, #0D1B2E 0%, #0A1628 100%)" }}>
                <div className="rounded-lg bg-[#F8FAFC] shadow-xl" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}>
                  <div className="p-8 min-w-[400px] space-y-4 text-[#0F172A]">
                    <div className="text-center border-b-2 border-[#0F172A] pb-3">
                      <p className="text-[18px] font-[700]">配 送 依 頼 書</p>
                      <p className="text-[12px] text-[#64748B] mt-1">㈱中村建設</p>
                      <p className="text-[11px] text-[#94A3B8] mt-0.5">TEL: {reviewItem.fax}</p>
                    </div>
                    <table className="w-full text-[13px]">
                      <tbody>
                        {reviewItem.fields.map((f, i) => (
                          <tr key={i} className="border-b border-[#E2E8F0]">
                            <td className="py-2 pr-4 text-[#64748B] align-top w-24">{f.label}:</td>
                            <td className="py-2 relative">
                              <span>{f.value}</span>
                              {f.status === "warning" && (
                                <div className="absolute inset-0 border-2 border-red-400/60 rounded animate-pulse pointer-events-none" />
                              )}
                              {f.status === "ok" && (
                                <div className="absolute inset-0 border-2 border-purple-300/40 rounded pointer-events-none" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-[10px] text-[#94A3B8] text-right pt-2">
                      送信日: 2026年3月5日 14:32
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — OCR results */}
            <div className="w-[480px] max-w-[50vw] flex flex-col overflow-y-auto bg-[#0D1B2E]">
              <div className="p-6 space-y-5">
                {/* Confidence bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#94A3B8]">信頼度</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[16px] font-[600] font-mono text-amber-400" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {(reviewItem.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">⚠️ 要確認</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[#0A1628] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400" style={{ width: `${reviewItem.confidence * 100}%` }} />
                  </div>
                </div>

                {/* OCR result header */}
                <h4 className="text-[14px] font-[600] text-[#F8FAFC]">OCR結果:</h4>

                {/* Fields table */}
                <div className="rounded-xl border border-[rgba(203,213,225,0.08)] overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {fields.map((f, i) => (
                        <tr key={i} className={`border-b border-[rgba(203,213,225,0.06)] ${f.status === "warning" ? "bg-amber-500/5" : ""}`}>
                          <td className="px-4 py-3 text-[12px] text-[#64748B] w-24 align-top">{f.label}</td>
                          <td className="px-4 py-3">
                            {f.editing ? (
                              <input
                                autoFocus
                                value={f.editValue}
                                onChange={(e) => updateField(i, e.target.value)}
                                onBlur={() => toggleEdit(i)}
                                onKeyDown={(e) => e.key === "Enter" && toggleEdit(i)}
                                className="w-full bg-transparent text-[13px] text-[#F8FAFC] outline-none border-b-2 border-[#2563EB] pb-0.5"
                              />
                            ) : (
                              <span className="text-[13px] text-[#F8FAFC]">{f.editValue}</span>
                            )}
                            {f.status === "warning" && !f.editing && (
                              <button onClick={() => toggleEdit(i)} className="block mt-1 text-[10px] text-[#2563EB] hover:underline">
                                クリックして修正
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right shrink-0">
                            {f.status === "ok" ? (
                              <Check size={14} className="text-emerald-400 inline" />
                            ) : (
                              <AlertTriangle size={14} className="text-amber-400 inline" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Engine info */}
                <div className="space-y-1.5 text-[12px] text-[#64748B]">
                  <div className="flex items-center justify-between">
                    <span>Engine</span>
                    <span className="font-mono text-[#94A3B8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{reviewItem.engine}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>処理時間</span>
                    <span className="font-mono text-[#94A3B8]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{reviewItem.processingTime}秒</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button onClick={handleReject} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-transparent text-red-400 hover:bg-red-500/10 py-2.5 text-[13px] transition-colors">
                    ❌ 却下
                  </button>
                  <button onClick={handleApprove} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 text-white py-2.5 text-[13px] shadow-lg shadow-emerald-500/20 transition-all hover:brightness-110">
                    ✅ 承認して送信
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
