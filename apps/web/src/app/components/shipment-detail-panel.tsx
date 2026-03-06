import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, FileText, Download, Eye } from "lucide-react";

interface ShipmentData {
  id: string;
  shipper: string;
  route: string;
  cargo: string;
  weight: string;
  status: string;
  source: string;
  date: string;
}

const epcisEvents = [
  { time: "09:00", type: "TransactionEvent", bizStep: "urn:epcglobal:cbv:bizstep:ordering", epc: "urn:epc:id:gdti:4912345.00001.2847", detail: "Source: hacobell", done: true },
  { time: "09:15", type: "ObjectEvent", bizStep: "urn:epcglobal:cbv:bizstep:loading", epc: "", detail: "ReadPoint: 大阪倉庫 Gate-A\nAction: OBSERVE", done: true },
  { time: "09:30", type: "ObjectEvent", bizStep: "urn:epcglobal:cbv:bizstep:shipping", epc: "", detail: "H3 Cell: 862b10bffffffff\nSpeed: 62 km/h", done: true },
  { time: "17:45", type: "ObjectEvent (予定)", bizStep: "urn:epcglobal:cbv:bizstep:arriving", epc: "", detail: "ReadPoint: ABC物流センター東京", done: false },
];

const documents = [
  { name: "配送指示書 (OCR生成)", action: "表示", icon: Eye },
  { name: "EPCIS JSON-LD エクスポート", action: "ダウンロード", icon: Download },
  { name: "原本FAXイメージ", action: "表示", icon: Eye },
];

const steps = ["受注", "集荷", "輸送中", "配達", "完了"];
const statusMap: Record<string, number> = { "pending": 0, "マッチ中": 0, "積載": 1, "輸送中": 2, "配達完了": 4 };

export function ShipmentDetailPanel({ shipment, onClose }: { shipment: ShipmentData | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {shipment && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ x: 480 }}
            animate={{ x: 0 }}
            exit={{ x: 480 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-[480px] max-w-[90vw] overflow-y-auto bg-[#0D1B2E] border-l border-[rgba(203,213,225,0.08)] shadow-2xl"
          >
            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <button onClick={onClose} className="flex items-center gap-2 text-[14px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
                  <ArrowLeft size={18} /> 配送詳細
                </button>
                <span className="text-[14px] font-mono text-[#06B6D4]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{shipment.id}</span>
              </div>

              {/* Info */}
              <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-[600] text-[#F8FAFC]">{shipment.shipper}</span>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${
                    shipment.status === "輸送中" ? "bg-cyan-500/15 text-cyan-400" :
                    shipment.status === "配達完了" ? "bg-emerald-500/15 text-emerald-400" :
                    "bg-amber-500/15 text-amber-400"
                  }`}>● {shipment.status}</span>
                </div>
                <p className="text-[13px] text-[#94A3B8]">{shipment.route}</p>
                <p className="text-[12px] text-[#64748B]">{shipment.cargo} · {shipment.weight}</p>
                <p className="text-[12px] text-[#64748B]">
                  ソース: {shipment.source === "FAX" ? "📠" : shipment.source === "API" ? "🔗" : "📱"} {shipment.source}
                  {shipment.source === "FAX" && " (OCR信頼度: 99.5%)"}
                </p>
              </div>

              {/* Progress stepper */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC]">📊 配送ステータス</h4>
                <div className="flex items-center gap-1 px-1">
                  {steps.map((step, i) => {
                    const currentIdx = statusMap[shipment.status] ?? 0;
                    const isActive = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`h-3 w-3 rounded-full shrink-0 flex items-center justify-center ${isActive ? "bg-[#2563EB]" : "bg-[#334155]"}`}>
                          {isCurrent && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                        {i < steps.length - 1 && (
                          <div className={`h-0.5 flex-1 ${i < currentIdx ? "bg-[#2563EB]" : "border-t border-dashed border-[#334155]"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[9px] text-[#64748B] px-0.5">
                  {steps.map((s, i) => <span key={i}>{"①②③④⑤"[i]}{s}</span>)}
                </div>
              </div>

              {/* EPCIS Timeline */}
              <div className="space-y-3">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC]">📜 EPCIS イベントログ</h4>
                <div className="ml-1 space-y-0">
                  {epcisEvents.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 pb-4">
                      <div className="flex flex-col items-center pt-0.5">
                        <div className={`h-3 w-3 rounded-full shrink-0 ${e.done ? "bg-emerald-400" : "bg-[#334155] border-2 border-dashed border-[#64748B]"}`} />
                        {i < epcisEvents.length - 1 && (
                          <div className={`w-0.5 flex-1 min-h-[24px] ${e.done ? "bg-emerald-400/30" : "border-l border-dashed border-[#334155]"}`} />
                        )}
                      </div>
                      <div className="flex-1 -mt-0.5 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{e.time}</span>
                          <span className={`text-[12px] font-[600] ${e.done ? "text-[#F8FAFC]" : "text-[#64748B]"}`}>{e.type}</span>
                        </div>
                        <p className="text-[11px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          BizStep: {e.bizStep}
                        </p>
                        {e.epc && (
                          <p className="text-[11px] text-[#64748B] font-mono truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            EPC: {e.epc}
                          </p>
                        )}
                        {e.detail.split("\n").map((line, j) => (
                          <p key={j} className="text-[11px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-2">
                <h4 className="text-[13px] font-[600] text-[#F8FAFC]">📎 関連ドキュメント</h4>
                <div className="space-y-1">
                  {documents.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.06)] p-3 hover:bg-white/[0.02] cursor-pointer transition-colors">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#64748B]" />
                        <span className="text-[12px] text-[#CBD5E1]">{d.name}</span>
                      </div>
                      <button className="flex items-center gap-1 text-[11px] text-[#2563EB] hover:underline">
                        <d.icon size={12} /> {d.action}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
