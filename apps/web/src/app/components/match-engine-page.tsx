import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, X, Clock, Search, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MatchDetailPanel } from "./match-detail-panel";

const matches = [
  { id: "M-8471", shipper: "田中商事㈱", origin: "大阪市中央区", dest: "東京都港区", cargo: "精密機器", weight: "3,500 kg", score: 0.96, status: "交渉中", timeLeft: "12:35" },
  { id: "M-8472", shipper: "㈱山田物流", origin: "福岡市博多区", dest: "大阪市北区", cargo: "食品（冷蔵）", weight: "5,200 kg", score: 0.93, status: "交渉中", timeLeft: "08:22" },
  { id: "M-8473", shipper: "鈴木工業㈱", origin: "名古屋市港区", dest: "横浜市中区", cargo: "自動車部品", weight: "8,100 kg", score: 0.88, status: "確定", timeLeft: "-" },
  { id: "M-8474", shipper: "佐藤農園", origin: "札幌市中央区", dest: "東京都大田区", cargo: "農産物", weight: "2,300 kg", score: 0.85, status: "確定", timeLeft: "-" },
  { id: "M-8475", shipper: "㈱高橋電機", origin: "広島市南区", dest: "名古屋市中村区", cargo: "電子部品", weight: "1,800 kg", score: 0.78, status: "期限切れ", timeLeft: "-" },
  { id: "M-8476", shipper: "中村建設㈱", origin: "仙台市青葉区", dest: "東京都千代田区", cargo: "建設資材", weight: "9,500 kg", score: 0.91, status: "交渉中", timeLeft: "05:45" },
];

function getScoreColor(score: number) {
  if (score >= 0.95) return "text-emerald-400";
  if (score >= 0.80) return "text-blue-400";
  return "text-amber-400";
}

function getScoreBg(score: number) {
  if (score >= 0.95) return "bg-emerald-400/10";
  if (score >= 0.80) return "bg-blue-400/10";
  return "bg-amber-400/10";
}

function getStatusStyle(status: string) {
  switch (status) {
    case "交渉中": return "bg-amber-500/15 text-amber-400";
    case "確定": return "bg-emerald-500/15 text-emerald-400";
    case "期限切れ": return "bg-red-500/15 text-red-400";
    default: return "bg-[#64748B]/15 text-[#64748B]";
  }
}

export function MatchEnginePage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [detailMatch, setDetailMatch] = useState<typeof matches[0] | null>(null);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">マッチングエンジン</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">荷物とトラックの最適マッチング — レイテンシ &lt;1ms</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-[#111D32] border border-[rgba(203,213,225,0.08)]">
          <TabsTrigger value="active" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-[#64748B]">アクティブ</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-[#64748B]">履歴</TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-[#64748B]">設定</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] px-3 py-2 flex-1 max-w-sm">
              <Search size={16} className="text-[#64748B]" />
              <input className="bg-transparent text-[13px] text-[#F8FAFC] outline-none w-full placeholder:text-[#64748B]" placeholder="検索..." />
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] px-3 py-2 text-[13px] text-[#64748B] hover:text-[#F8FAFC] transition-colors">
              <Filter size={16} />
              フィルター
            </button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(203,213,225,0.08)]">
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">ID</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">荷主</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">出発地</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">到着地</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">荷物</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">重量</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">スコア</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">ステータス</th>
                  <th className="px-4 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]"></th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <React.Fragment key={m.id}>
                    <tr
                      className="border-b border-[rgba(203,213,225,0.04)] hover:bg-white/[0.02] cursor-pointer transition-colors"
                      onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                    >
                      <td className="px-4 py-3 text-[13px] font-mono text-[#06B6D4]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.id}</td>
                      <td className="px-4 py-3 text-[13px] text-[#F8FAFC]">{m.shipper}</td>
                      <td className="px-4 py-3 text-[13px] text-[#CBD5E1]">{m.origin}</td>
                      <td className="px-4 py-3 text-[13px] text-[#CBD5E1]">{m.dest}</td>
                      <td className="px-4 py-3 text-[13px] text-[#CBD5E1]">{m.cargo}</td>
                      <td className="px-4 py-3 text-[13px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{m.weight}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-[600] ${getScoreColor(m.score)} ${getScoreBg(m.score)}`}>
                          {m.score.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-[500] ${getStatusStyle(m.status)}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {expanded === m.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </td>
                    </tr>
                    {expanded === m.id && (
                      <tr key={`${m.id}-detail`}>
                        <td colSpan={9} className="bg-[#0D1B2E] px-6 py-5">
                          <MatchDetail match={m} onOpenPanel={() => setDetailMatch(m)} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-8 text-center">
            <p className="text-[#64748B] text-[14px]">マッチング履歴 — フィルターで期間・荷主・ルートを絞り込み</p>
            <p className="text-[#64748B] text-[12px] mt-2">CSV / PDF エクスポート対応</p>
          </div>
        </TabsContent>

        <TabsContent value="config">
          <AlgorithmConfig />
        </TabsContent>
      </Tabs>
      <MatchDetailPanel match={detailMatch} onClose={() => setDetailMatch(null)} />
    </div>
  );
}

function MatchDetail({ match, onOpenPanel }: { match: typeof matches[0]; onOpenPanel: () => void }) {
  const breakdown = [
    { label: "距離", weight: 30, score: 0.92 },
    { label: "積載率", weight: 40, score: 0.98 },
    { label: "CO₂", weight: 20, score: 0.88 },
    { label: "稼働時間", weight: 10, score: 0.85 },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Score breakdown */}
      <div className="space-y-3">
        <h4 className="text-[13px] font-[600] text-[#F8FAFC]">スコア内訳</h4>
        {breakdown.map((b) => (
          <div key={b.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#CBD5E1]">{b.label} ({b.weight}%)</span>
              <span className="text-[12px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{b.score.toFixed(2)}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#0A1628] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4]" style={{ width: `${b.score * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Top candidates */}
      <div className="space-y-3">
        <h4 className="text-[13px] font-[600] text-[#F8FAFC]">トップ候補</h4>
        {[
          { truck: "XY-1234", driver: "田中太郎", score: 0.96 },
          { truck: "AB-5678", driver: "佐藤花子", score: 0.91 },
          { truck: "CD-9012", driver: "鈴木一郎", score: 0.87 },
        ].map((c, i) => (
          <div key={i} className="flex items-center justify-between rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.06)] p-3">
            <div>
              <span className="text-[12px] font-[600] text-[#F8FAFC]">🚛 {c.truck}</span>
              <p className="text-[11px] text-[#64748B]">{c.driver}</p>
            </div>
            <span className={`text-[13px] font-[600] font-mono ${getScoreColor(c.score)}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{c.score.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h4 className="text-[13px] font-[600] text-[#F8FAFC]">アクション</h4>
        {match.status === "交渉中" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <Clock size={16} className="text-amber-400" />
            <span className="text-[13px] text-amber-400 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>残り {match.timeLeft}</span>
          </div>
        )}
        <button onClick={onOpenPanel} className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 text-[13px] transition-colors">
          詳細パネルを開く
        </button>
        <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white py-2.5 text-[13px] transition-colors">
          <Check size={16} /> 承認
        </button>
        <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#111D32] border border-red-500/20 text-red-400 hover:bg-red-500/10 py-2.5 text-[13px] transition-colors">
          <X size={16} /> 拒否
        </button>
      </div>
    </div>
  );
}

function AlgorithmConfig() {
  const [weights, setWeights] = useState({ distance: 30, load: 40, co2: 20, hours: 10 });
  const [kRing, setKRing] = useState(3);
  const [h3Res, setH3Res] = useState(7);

  return (
    <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-6 space-y-6 max-w-2xl">
      <h4 className="text-[15px] font-[600] text-[#F8FAFC]">アルゴリズム設定</h4>

      {/* Weight sliders */}
      <div className="space-y-4">
        {([
          { key: "distance" as const, label: "距離 (w1)", color: "#2563EB" },
          { key: "load" as const, label: "積載率 (w2)", color: "#10B981" },
          { key: "co2" as const, label: "CO₂ (w3)", color: "#06B6D4" },
          { key: "hours" as const, label: "稼働時間 (w4)", color: "#F59E0B" },
        ]).map((w) => (
          <div key={w.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[13px] text-[#CBD5E1]">{w.label}</label>
              <span className="text-[13px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{weights[w.key]}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights[w.key]}
              onChange={(e) => setWeights({ ...weights, [w.key]: Number(e.target.value) })}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, ${w.color} ${weights[w.key]}%, #162236 ${weights[w.key]}%)` }}
            />
          </div>
        ))}
      </div>

      <div className="h-px bg-[rgba(203,213,225,0.08)]" />

      {/* k-ring */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[13px] text-[#CBD5E1]">k-ring 半径</label>
          <span className="text-[13px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{kRing}</span>
        </div>
        <input
          type="range" min={1} max={5} value={kRing}
          onChange={(e) => setKRing(Number(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ background: `linear-gradient(to right, #8B5CF6 ${(kRing - 1) * 25}%, #162236 ${(kRing - 1) * 25}%)` }}
        />
      </div>

      {/* H3 resolution */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[13px] text-[#CBD5E1]">H3 解像度</label>
          <span className="text-[13px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Res {h3Res} ({h3Res === 7 ? '~5km' : '~1km'})</span>
        </div>
        <div className="flex gap-2">
          {[7, 8].map((r) => (
            <button
              key={r}
              onClick={() => setH3Res(r)}
              className={`rounded-lg px-4 py-2 text-[13px] transition-colors ${h3Res === r ? 'bg-[#2563EB] text-white' : 'bg-[#162236] text-[#64748B] hover:text-[#F8FAFC]'}`}
            >
              Res {r}
            </button>
          ))}
        </div>
      </div>

      <button className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 text-[13px] transition-colors">
        保存して適用
      </button>
    </div>
  );
}