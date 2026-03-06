import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line
} from "recharts";

const bigNumbers = [
  { label: "総配送数", value: "12,847", unit: "件", color: "text-[#F8FAFC]" },
  { label: "マッチ成功率", value: "94.2", unit: "%", color: "text-emerald-400" },
  { label: "平均積載率", value: "89.1", unit: "%", color: "text-cyan-400" },
  { label: "CO₂削減合計", value: "342", unit: "t", color: "text-emerald-400" },
  { label: "OCR処理枚数", value: "5,230", unit: "枚", color: "text-purple-400" },
  { label: "平均レスポンス", value: "0.8", unit: "ms", color: "text-blue-400" },
];

const shipmentVolume = Array.from({ length: 14 }, (_, i) => ({
  day: `3/${i + 1}`,
  volume: Math.floor(800 + Math.random() * 400),
  avg: Math.floor(900 + Math.random() * 100),
}));

const loadDist = [
  { range: "0-20%", count: 12 },
  { range: "20-40%", count: 34 },
  { range: "40-60%", count: 78 },
  { range: "60-80%", count: 156 },
  { range: "80-100%", count: 245 },
];

const co2Trend = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  reduction: 8 + Math.random() * 16,
}));

export function AnalyticsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">分析</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">物流ネットワーク全体のパフォーマンス分析</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#111D32] border border-[rgba(203,213,225,0.08)]">
          {["全体", "マッチング", "OCR", "CO₂", "災害"].map((t, i) => (
            <TabsTrigger
              key={t}
              value={["overview", "matching", "ocr", "co2", "disaster"][i]}
              className="data-[state=active]:bg-[#2563EB] data-[state=active]:text-white text-[#64748B]"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          {/* Period selector */}
          <div className="flex items-center gap-3">
            {["今日", "今週", "今月", "カスタム"].map((p, i) => (
              <button
                key={p}
                className={`rounded-lg px-3 py-1.5 text-[12px] transition-colors ${i === 2 ? 'bg-[#2563EB] text-white' : 'bg-[#111D32] border border-[rgba(203,213,225,0.08)] text-[#64748B] hover:text-[#F8FAFC]'}`}
              >
                {p}
              </button>
            ))}
            <div className="h-4 w-px bg-[rgba(203,213,225,0.12)]" />
            <span className="text-[12px] text-[#64748B]">比較:</span>
            <button className="rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] px-3 py-1.5 text-[12px] text-[#64748B] hover:text-[#F8FAFC]">
              vs 先月
            </button>
          </div>

          {/* Big number cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {bigNumbers.map((n) => (
              <div key={n.label} className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 text-center">
                <span className="text-[11px] text-[#64748B] block mb-1">{n.label}</span>
                <span className={`text-[24px] font-[700] ${n.color}`} style={{ fontFamily: "'Inter', sans-serif" }}>
                  {n.value}
                </span>
                <span className="text-[12px] text-[#64748B] ml-0.5">{n.unit}</span>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Shipment volume */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">配送量推移</h4>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={shipmentVolume}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
                    <Bar dataKey="volume" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={18} />
                    <Line type="monotone" dataKey="avg" stroke="#F59E0B" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Load factor distribution */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">積載率分布</h4>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={loadDist}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
                    <XAxis dataKey="range" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
                    <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CO2 reduction */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5 lg:col-span-2">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">CO₂削減推移</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={co2Trend}>
                    <defs>
                      <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}t`} />
                    <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
                    <Area type="monotone" dataKey="reduction" stroke="#10B981" strokeWidth={2} fill="url(#co2Grad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>

        {["matching", "ocr", "co2", "disaster"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-8 text-center">
              <p className="text-[#64748B] text-[14px]">詳細分析ページ — 準備中</p>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
