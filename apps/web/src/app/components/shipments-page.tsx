import { useState } from "react";
import { Search, Filter, Download, Calendar, ChevronRight, Printer, Globe, Smartphone } from "lucide-react";
import { ShipmentDetailPanel } from "./shipment-detail-panel";

const shipments = [
  { id: "LG-2847", shipper: "田中商事㈱", route: "大阪市中央区 → 東京都港区", cargo: "精密機器", weight: "3,500 kg", status: "輸送中", source: "FAX", date: "2026-03-05" },
  { id: "LG-2846", shipper: "㈱山田物流", route: "福岡市博多区 → 大阪市北区", cargo: "食品（冷蔵）", weight: "5,200 kg", status: "マッチ中", source: "API", date: "2026-03-05" },
  { id: "LG-2845", shipper: "鈴木工業㈱", route: "名古屋市港区 → 横浜市中区", cargo: "自動車部品", weight: "8,100 kg", status: "配達完了", source: "App", date: "2026-03-04" },
  { id: "LG-2844", shipper: "佐藤農園", route: "札幌市中央区 → 東京都大田区", cargo: "農産物", weight: "2,300 kg", status: "積載", source: "FAX", date: "2026-03-04" },
  { id: "LG-2843", shipper: "㈱高橋電機", route: "広島市南区 → 名古屋市中村区", cargo: "電子部品", weight: "1,800 kg", status: "配達完了", source: "API", date: "2026-03-04" },
  { id: "LG-2842", shipper: "中村建設㈱", route: "仙台市青葉区 → 東京都千代田区", cargo: "建設資材", weight: "9,500 kg", status: "pending", source: "FAX", date: "2026-03-03" },
  { id: "LG-2841", shipper: "㈱伊藤食品", route: "神戸市中央区 → 京都市下京区", cargo: "食品（常温）", weight: "4,200 kg", status: "輸送中", source: "App", date: "2026-03-03" },
  { id: "LG-2840", shipper: "小林薬品㈱", route: "東京都中央区 → 大阪市北区", cargo: "医薬品", weight: "800 kg", status: "配達完了", source: "API", date: "2026-03-03" },
];

const statusStyles: Record<string, string> = {
  "pending": "bg-[#64748B]/15 text-[#64748B]",
  "マッチ中": "bg-amber-500/15 text-amber-400",
  "積載": "bg-blue-500/15 text-blue-400",
  "輸送中": "bg-cyan-500/15 text-cyan-400",
  "配達完了": "bg-emerald-500/15 text-emerald-400",
};

const sourceIcons: Record<string, React.ReactNode> = {
  "FAX": <Printer size={14} className="text-purple-400" />,
  "API": <Globe size={14} className="text-blue-400" />,
  "App": <Smartphone size={14} className="text-cyan-400" />,
};

const steps = ["受注", "マッチ中", "積載", "輸送中", "配達完了"];

export function ShipmentsPage() {
  const [selectedShipment, setSelectedShipment] = useState<string | null>(null);
  const [panelShipment, setPanelShipment] = useState<typeof shipments[0] | null>(null);
  const selected = shipments.find(s => s.id === selectedShipment);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#F8FAFC]">配送管理</h2>
          <p className="mt-1 text-[13px] text-[#64748B]">全配送の一覧管理 — EPCIS 2.0トレーサビリティ対応</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 text-[13px] transition-colors">
          <Download size={16} /> エクスポート
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] px-3 py-2 flex-1 max-w-xs">
          <Search size={16} className="text-[#64748B]" />
          <input className="bg-transparent text-[13px] text-[#F8FAFC] outline-none w-full placeholder:text-[#64748B]" placeholder="配送ID / 荷主を検索..." />
        </div>
        {["ステータス", "日付範囲", "出発地", "到着地", "ソース"].map((f) => (
          <button key={f} className="flex items-center gap-1.5 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] px-3 py-2 text-[12px] text-[#64748B] hover:text-[#F8FAFC] transition-colors">
            {f} <ChevronRight size={12} className="rotate-90" />
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className={`rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(203,213,225,0.08)]">
                {["配送ID", "荷主", "ルート", "品名", "重量", "状態", "ソース", "作成日"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-[rgba(203,213,225,0.04)] cursor-pointer transition-colors ${selectedShipment === s.id ? 'bg-blue-500/5' : 'hover:bg-white/[0.02]'}`}
                  onClick={() => setSelectedShipment(selectedShipment === s.id ? null : s.id)}
                >
                  <td className="px-4 py-3 text-[13px] font-mono text-[#06B6D4]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.id}</td>
                  <td className="px-4 py-3 text-[13px] text-[#F8FAFC]">{s.shipper}</td>
                  <td className="px-4 py-3 text-[13px] text-[#CBD5E1]">{s.route}</td>
                  <td className="px-4 py-3 text-[13px] text-[#CBD5E1]">{s.cargo}</td>
                  <td className="px-4 py-3 text-[13px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.weight}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-[500] ${statusStyles[s.status] || statusStyles.pending}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5">
                      {sourceIcons[s.source]}
                      <span className="text-[12px] text-[#64748B]">{s.source}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[#64748B]">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[340px] shrink-0 rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[15px] font-[600] text-[#F8FAFC]">{selected.id}</h4>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-[500] ${statusStyles[selected.status] || statusStyles.pending}`}>
                {selected.status}
              </span>
            </div>

            {/* Progress stepper */}
            <div className="flex items-center gap-1">
              {steps.map((step, i) => {
                const currentIdx = steps.indexOf(selected.status);
                const isActive = i <= currentIdx;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${isActive ? 'bg-[#2563EB]' : 'bg-[#334155]'}`} />
                    {i < steps.length - 1 && (
                      <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-[#2563EB]' : 'bg-[#334155]'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[9px] text-[#64748B]">
              {steps.map((s) => <span key={s}>{s}</span>)}
            </div>

            <div className="h-px bg-[rgba(203,213,225,0.08)]" />

            <div className="space-y-3">
              {[
                { label: "荷主", value: selected.shipper },
                { label: "ルート", value: selected.route },
                { label: "品名", value: selected.cargo },
                { label: "重量", value: selected.weight },
                { label: "ソース", value: selected.source },
                { label: "作成日", value: selected.date },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between">
                  <span className="text-[12px] text-[#64748B]">{item.label}</span>
                  <span className="text-[12px] text-[#F8FAFC] text-right max-w-[180px]">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-[rgba(203,213,225,0.08)]" />

            {/* Mini route visualization */}
            <div className="rounded-lg bg-[#0A1628] p-4 h-[120px] flex items-center justify-center">
              <div className="flex items-center gap-3 text-[#64748B]">
                <div className="text-center">
                  <div className="h-3 w-3 rounded-full bg-blue-500 mx-auto" />
                  <span className="text-[10px] mt-1 block">出発</span>
                </div>
                <div className="h-px w-16 border-t border-dashed border-[#334155]" />
                <div className="h-4 w-4 rounded-full bg-cyan-500 flex items-center justify-center">
                  <span className="text-[8px]">🚛</span>
                </div>
                <div className="h-px w-16 border-t border-dashed border-[#334155]" />
                <div className="text-center">
                  <div className="h-3 w-3 rounded-full bg-emerald-500 mx-auto" />
                  <span className="text-[10px] mt-1 block">到着</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setPanelShipment(selected)}
              className="w-full rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 text-[13px] transition-colors"
            >
              EPCIS詳細を表示
            </button>
          </div>
        )}
      </div>
      <ShipmentDetailPanel shipment={panelShipment} onClose={() => setPanelShipment(null)} />
    </div>
  );
}