import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Check, AlertTriangle, Eye } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from "recharts";
import { OcrReviewOverlay } from "./ocr-review-overlay";
import { Toaster } from "sonner";

const faxQueue = [
  { id: "#2847", sender: "㈱田中運送", fax: "06-XXXX-XXXX", time: "2026-03-05 14:25", progress: 80, stage: "Multi-pass OCR", confidence: 97.8, timeLeft: 12 },
  { id: "#2848", sender: "佐藤物流㈱", fax: "03-XXXX-XXXX", time: "2026-03-05 14:28", progress: 45, stage: "初回スキャン", confidence: 0, timeLeft: 25 },
  { id: "#2849", sender: "㈱鈴木商事", fax: "052-XXXX-XXXX", time: "2026-03-05 14:30", progress: 100, stage: "完了", confidence: 99.5, timeLeft: 0 },
  { id: "#2850", sender: "高橋農園", fax: "011-XXXX-XXXX", time: "2026-03-05 14:31", progress: 15, stage: "前処理", confidence: 0, timeLeft: 35 },
  { id: "#2851", sender: "㈱中村建設", fax: "022-XXXX-XXXX", time: "2026-03-05 14:32", progress: 100, stage: "確認待ち", confidence: 87.3, timeLeft: 0 },
  { id: "#2852", sender: "山田電機㈱", fax: "06-XXXX-XXXX", time: "2026-03-05 14:33", progress: 60, stage: "テキスト抽出", confidence: 0, timeLeft: 18 },
];

const reviewFields = [
  { label: "荷主名", value: "田中商事 ㈱", confidence: 99.8, ok: true },
  { label: "電話番号", value: "06-6XXX-XXXX", confidence: 99.5, ok: true },
  { label: "集荷先住所", value: "大阪市中央区本町3-2-8", confidence: 98.2, ok: true },
  { label: "届け先住所", value: "東京都港区芝浦4-12-3", confidence: 87.3, ok: false },
  { label: "品名", value: "精密機器", confidence: 99.1, ok: true },
  { label: "重量", value: "3,500 kg", confidence: 99.9, ok: true },
  { label: "希望日時", value: "3月7日 午前中", confidence: 96.5, ok: true },
];

const confDistribution = [
  { name: "99%+", value: 68, color: "#10B981" },
  { name: "95-99%", value: 22, color: "#06B6D4" },
  { name: "90-95%", value: 7, color: "#F59E0B" },
  { name: "<90%", value: 3, color: "#EF4444" },
];

const accuracyTrend = Array.from({ length: 14 }, (_, i) => ({
  day: `${i + 1}`,
  accuracy: 97.5 + Math.random() * 2.5,
}));

const volumeByHour = Array.from({ length: 12 }, (_, i) => ({
  hour: `${8 + i}:00`,
  count: Math.floor(30 + Math.random() * 60),
}));

export function LegacyBridgePage() {
  const [selectedReview, setSelectedReview] = useState(0);
  const [ocrOverlayOpen, setOcrOverlayOpen] = useState(false);

  return (
    <div className="p-6 space-y-5">
      <Toaster position="top-center" theme="dark" />
      <div>
        <h2 className="text-[#F8FAFC]">レガシーブリッジ</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">AI-OCR — FAXから配送指示を自動生成 (精度 99.2%)</p>
      </div>

      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList className="bg-[#111D32] border border-[rgba(203,213,225,0.08)]">
          <TabsTrigger value="queue" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#64748B]">処理キュー</TabsTrigger>
          <TabsTrigger value="review" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#64748B]">
            確認待ち
            <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">2</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-[#8B5CF6] data-[state=active]:text-white text-[#64748B]">分析</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {faxQueue.map((fax) => (
              <div key={fax.id} className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 space-y-3 hover:border-purple-500/20 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[14px] font-[600] text-[#F8FAFC]">📄 FAX {fax.id}</span>
                    <p className="text-[12px] text-[#64748B] mt-0.5">受信: {fax.time}</p>
                  </div>
                  {fax.confidence > 0 && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-[500] ${
                      fax.confidence >= 95 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {fax.confidence}%
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#CBD5E1]">送信元: {fax.sender}</p>
                <p className="text-[11px] text-[#64748B]">FAX: {fax.fax}</p>

                {/* Thumbnail placeholder */}
                <div className="h-20 rounded-lg bg-[#0A1628] flex items-center justify-center">
                  <span className="text-[24px] opacity-30">📠</span>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#64748B]">{fax.stage}</span>
                    <span className="text-[11px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fax.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#0A1628] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${fax.progress}%`,
                        background: fax.progress === 100 ? '#10B981' : 'linear-gradient(to right, #8B5CF6, #06B6D4)',
                      }}
                    />
                  </div>
                </div>

                {fax.timeLeft > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <span>⏱️ 残り: {fax.timeLeft}秒</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="review">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Left - FAX image */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-[600] text-[#F8FAFC]">FAX #2851 — 原本</h4>
                <div className="flex items-center gap-2">
                  <button className="rounded-md bg-[#162236] px-2 py-1 text-[11px] text-[#64748B] hover:text-[#F8FAFC]">100%</button>
                  <button className="rounded-md bg-[#162236] px-2 py-1 text-[11px] text-[#64748B] hover:text-[#F8FAFC]">+</button>
                  <button className="rounded-md bg-[#162236] px-2 py-1 text-[11px] text-[#64748B] hover:text-[#F8FAFC]">−</button>
                </div>
              </div>
              {/* Mock FAX document */}
              <div className="rounded-lg bg-[#F8FAFC] p-6 min-h-[400px] text-[#0F172A] space-y-3">
                <div className="text-center border-b border-[#CBD5E1] pb-3">
                  <p className="text-[16px] font-[700]">配 送 依 頼 書</p>
                  <p className="text-[11px] text-[#64748B] mt-1">㈱中村建設</p>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">荷主名:</span>
                    <span className="border-b border-[#CBD5E1] flex-1 relative">
                      田中商事 ㈱
                      <div className="absolute inset-0 border-2 border-purple-300/50 rounded" />
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">電話番号:</span>
                    <span className="border-b border-[#CBD5E1] flex-1 relative">
                      06-6XXX-XXXX
                      <div className="absolute inset-0 border-2 border-purple-300/50 rounded" />
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">集荷先:</span>
                    <span className="border-b border-[#CBD5E1] flex-1 relative">
                      大阪市中央区本町3-2-8
                      <div className="absolute inset-0 border-2 border-purple-300/50 rounded" />
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">届け先:</span>
                    <span className="border-b border-[#CBD5E1] flex-1 relative">
                      東京都港区芝浦4-12-3
                      <div className="absolute inset-0 border-2 border-red-400/60 rounded animate-pulse" />
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">品名:</span>
                    <span className="border-b border-[#CBD5E1] flex-1">精密機器</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">重量:</span>
                    <span className="border-b border-[#CBD5E1] flex-1">3,500 kg</span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-[#64748B] w-20 shrink-0">希望日時:</span>
                    <span className="border-b border-[#CBD5E1] flex-1">3月7日 午前中</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Extracted data */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4 space-y-3">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC]">抽出データ</h4>
              <div className="space-y-3">
                {reviewFields.map((f, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg p-3 ${!f.ok ? 'bg-amber-500/5 border border-amber-500/20' : 'bg-[#0D1B2E]'}`}>
                    <div className="flex-1 min-w-0">
                      <label className="text-[11px] text-[#64748B] block mb-1">{f.label}</label>
                      <input
                        className={`w-full bg-transparent text-[13px] outline-none ${!f.ok ? 'text-amber-300 border-b border-amber-500/30' : 'text-[#F8FAFC]'}`}
                        defaultValue={f.value}
                        readOnly={f.ok}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[12px] font-mono ${f.ok ? 'text-emerald-400' : 'text-amber-400'}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {f.confidence}%
                      </span>
                      {f.ok ? <Check size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-amber-400" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-3">
                <button onClick={() => setOcrOverlayOpen(true)} className="flex-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-500 text-white py-2.5 text-[13px] transition-colors">
                  承認して配送作成
                </button>
                <button className="flex-1 rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.08)] text-[#CBD5E1] hover:text-[#F8FAFC] py-2.5 text-[13px] transition-colors">
                  修正して承認
                </button>
                <button className="rounded-lg bg-[#162236] border border-red-500/20 text-red-400 hover:bg-red-500/10 px-4 py-2.5 text-[13px] transition-colors">
                  却下
                </button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Confidence distribution */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">信頼度分布</h4>
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={confDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                      {confDistribution.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                {confDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-[11px] text-[#64748B]">{d.name}: {d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accuracy trend */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">精度推移</h4>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={accuracyTrend}>
                    <defs>
                      <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
                    <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis domain={[96, 100]} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
                    <Area type="monotone" dataKey="accuracy" stroke="#8B5CF6" strokeWidth={2} fill="url(#accGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Volume by hour */}
            <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5 lg:col-span-2">
              <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">時間別処理量</h4>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
                    <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <OcrReviewOverlay open={ocrOverlayOpen} onClose={() => setOcrOverlayOpen(false)} />
    </div>
  );
}