import { Leaf, TrendingUp, Award, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const monthlyData = [
  { month: "1月", co2: 280, target: 350 },
  { month: "2月", co2: 310, target: 350 },
  { month: "3月", co2: 342, target: 350 },
  { month: "4月", co2: 0, target: 350 },
  { month: "5月", co2: 0, target: 350 },
  { month: "6月", co2: 0, target: 350 },
];

const tenants = [
  { rank: "🥇", name: "田中商事㈱", co2: 45.2, credit: 45.2, efficiency: 28.4 },
  { rank: "🥈", name: "㈱山田物流", co2: 38.7, credit: 38.7, efficiency: 26.1 },
  { rank: "🥉", name: "鈴木工業㈱", co2: 32.1, credit: 32.1, efficiency: 24.2 },
  { rank: "4", name: "佐藤農園", co2: 28.5, credit: 28.5, efficiency: 22.8 },
  { rank: "5", name: "㈱高橋電機", co2: 24.3, credit: 24.3, efficiency: 21.5 },
];

const reports = [
  { period: "2026/03", co2: "342 t", method: "M01直接計測", status: "提出済み", statusColor: "text-emerald-400", statusBg: "bg-emerald-500/15" },
  { period: "2026/02", co2: "310 t", method: "M01直接計測", status: "承認済み", statusColor: "text-emerald-400", statusBg: "bg-emerald-500/15" },
  { period: "2026/01", co2: "280 t", method: "M01直接計測", status: "承認済み", statusColor: "text-emerald-400", statusBg: "bg-emerald-500/15" },
];

export function CarbonPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">カーボンクレジット</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">J-Blue Credit — GX ETS 自動報告</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CarbonCard icon={<Leaf size={20} />} label="今月CO₂削減" value="342 t" trend="↑+8.2%" color="emerald" />
        <CarbonCard icon={<Award size={20} />} label="J-Blue Credit" value="342" sub="クレジット" color="cyan" />
        <CarbonCard icon={<TrendingUp size={20} />} label="推定価値" value="¥1,026,000" sub="@¥3,000/t" color="blue" />
        <CarbonCard icon={<FileText size={20} />} label="GX ETS提出" value="3月分済み" sub="次回: 4/5" color="purple" badge="✅" />
      </div>

      {/* Monthly chart */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
        <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">📊 月別CO₂削減推移 (t)</h4>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <defs>
                <linearGradient id="carbonGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#10B981" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} domain={[0, 400]} />
              <Tooltip
                contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }}
                formatter={(value: number) => value > 0 ? [`${value} t`, "CO₂削減"] : null}
              />
              <ReferenceLine y={350} stroke="#F59E0B" strokeDasharray="8 4" strokeWidth={1.5} label={{ value: "目標: 350t/月", position: "right", fill: "#F59E0B", fontSize: 11 }} />
              <Bar dataKey="co2" fill="url(#carbonGrad)" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tenant ranking */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(203,213,225,0.06)]">
          <h4 className="text-[14px] font-[600] text-[#F8FAFC]">📦 テナント別削減ランキング</h4>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(203,213,225,0.08)]">
              {["Rank", "テナント", "CO₂削減", "Credit", "Efficiency"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tenants.map((t, i) => (
              <tr key={i} className="border-b border-[rgba(203,213,225,0.04)] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[14px]">{t.rank}</td>
                <td className="px-5 py-3 text-[13px] text-[#F8FAFC]">{t.name}</td>
                <td className="px-5 py-3 text-[13px] text-emerald-400 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.co2} t</td>
                <td className="px-5 py-3 text-[13px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.credit}</td>
                <td className="px-5 py-3 text-[13px] text-[#06B6D4] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.efficiency}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* GX ETS Reports */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(203,213,225,0.06)]">
          <h4 className="text-[14px] font-[600] text-[#F8FAFC]">📄 GX ETS 月次レポート</h4>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(203,213,225,0.08)]">
              {["期間", "CO₂削減合計", "Method", "Status", "Action"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.period} className="border-b border-[rgba(203,213,225,0.04)] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[13px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.period}</td>
                <td className="px-5 py-3 text-[13px] text-emerald-400 font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{r.co2}</td>
                <td className="px-5 py-3 text-[12px] text-[#CBD5E1]">{r.method}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${r.statusBg} ${r.statusColor}`}>
                    ✅ {r.status}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button className="rounded-md bg-[#162236] border border-[rgba(203,213,225,0.08)] px-3 py-1 text-[11px] text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CarbonCard({ icon, label, value, sub, trend, color, badge }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; trend?: string; color: string; badge?: string;
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-lg p-2 ${c.bg} ${c.text}`}>{icon}</div>
        <span className="text-[13px] text-[#64748B]">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[20px] font-[700] ${c.text}`} style={{ fontFamily: "'Inter', sans-serif" }}>{value}</span>
        {badge && <span className="text-[12px]">{badge}</span>}
      </div>
      {trend && <span className="text-[12px] text-emerald-400 mt-0.5 block">{trend}</span>}
      {sub && <span className="text-[12px] text-[#94A3B8] mt-0.5 block">{sub}</span>}
    </div>
  );
}
