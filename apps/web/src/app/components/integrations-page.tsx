import { Settings, FileText, PlayCircle, ExternalLink } from "lucide-react";

const integrations = [
  { name: "Hacobu (MOVO)", desc: "IoT GPSテレメトリ", status: "接続中", protocol: "Webhook (HMAC)", lastSync: "5秒前", events: "45,230", color: "#2563EB" },
  { name: "Hacobell", desc: "トラック予約プラットフォーム", status: "接続中", protocol: "REST API v2", lastSync: "12秒前", events: "8,420", color: "#06B6D4" },
  { name: "SAP S/4HANA", desc: "ERP連携 (受注・在庫)", status: "接続中", protocol: "OData v4", lastSync: "1分前", events: "3,150", color: "#10B981" },
  { name: "Oracle TMS", desc: "輸送管理システム", status: "接続中", protocol: "REST API", lastSync: "30秒前", events: "12,800", color: "#F59E0B" },
  { name: "JMA EEW", desc: "緊急地震速報WebSocket", status: "接続中", protocol: "WebSocket", lastSync: "2秒前", events: "156", color: "#EF4444" },
  { name: "GX ETS", desc: "カーボンクレジット取引", status: "接続中", protocol: "gRPC", lastSync: "5分前", events: "892", color: "#10B981" },
  { name: "METI / MLIT", desc: "政府報告API", status: "メンテナンス", protocol: "SOAP/XML", lastSync: "2時間前", events: "48", color: "#64748B" },
];

export function IntegrationsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">インテグレーション</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">外部システム連携 — 7つのパートナー接続</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {integrations.map((integ) => (
          <div key={integ.name} className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5 space-y-4 hover:border-[rgba(203,213,225,0.16)] transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-[18px]" style={{ background: `${integ.color}15` }}>
                  <ExternalLink size={20} style={{ color: integ.color }} />
                </div>
                <div>
                  <h4 className="text-[14px] font-[600] text-[#F8FAFC]">{integ.name}</h4>
                  <p className="text-[12px] text-[#64748B]">{integ.desc}</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-[rgba(203,213,225,0.06)]" />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">Status</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-[500] ${
                  integ.status === '接続中' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${integ.status === '接続中' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  {integ.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">Protocol</span>
                <span className="text-[11px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{integ.protocol}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">Last sync</span>
                <span className="text-[11px] text-[#CBD5E1]">{integ.lastSync}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#64748B]">Events today</span>
                <span className="text-[11px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{integ.events}</span>
              </div>
            </div>

            <div className="h-px bg-[rgba(203,213,225,0.06)]" />

            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.06)] py-2 text-[11px] text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                <Settings size={12} /> 設定
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.06)] py-2 text-[11px] text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                <FileText size={12} /> ログ
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.06)] py-2 text-[11px] text-[#64748B] hover:text-[#F8FAFC] transition-colors">
                <PlayCircle size={12} /> テスト
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
