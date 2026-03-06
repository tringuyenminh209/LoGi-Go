import { ArrowLeft, Leaf, TrendingUp, Award, Truck } from "lucide-react";
import { motion } from "motion/react";

interface CarbonDashboardScreenProps {
  onBack: () => void;
}

const carbonData = {
  totalSavedKg: 2800,
  credits: 2.8,
  creditValueJPY: 8400,
  monthlyData: [
    { month: "1月", kg: 320 },
    { month: "2月", kg: 410 },
    { month: "3月", kg: 520 },
    { month: "4月", kg: 380 },
    { month: "5月", kg: 610 },
    { month: "6月", kg: 440 },
  ],
  recentDeliveries: [
    {
      id: "LG-2847", route: "大阪→東京",
      baselineKg: 107.5, actualKg: 82.3, savedKg: 25.2, savingPercent: 23.4,
    },
    {
      id: "LG-2839", route: "福岡→広島",
      baselineKg: 55.7, actualKg: 41.2, savedKg: 14.5, savingPercent: 26.0,
    },
  ],
  ranking: { position: 88, total: 720, percentile: 12 },
};

const maxMonthly = Math.max(...carbonData.monthlyData.map((d) => d.kg));

export function CarbonDashboardScreen({ onBack }: CarbonDashboardScreenProps) {
  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>カーボンクレジット</h1>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 border border-slate-700/40 text-center"
          style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))" }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Leaf size={20} className="text-[#10B981]" />
            <span className="text-[#10B981] text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>🌱 環境貢献スコア</span>
          </div>

          {/* Animated Counter */}
          <div className="relative w-36 h-36 mx-auto mb-4">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#1E293B" strokeWidth="8" />
              <motion.circle
                cx="60" cy="60" r="52" fill="none"
                stroke="url(#carbonGrad)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 52}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 52 * 0.2 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="carbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white text-[36px]"
                style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
              >
                2.8
              </motion.span>
              <span className="text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>t CO₂削減</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div>
              <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>J-Blue Credit</div>
              <div className="text-[#06B6D4] text-[18px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{carbonData.credits}</div>
              <div className="text-slate-500 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>クレジット</div>
            </div>
            <div className="w-px h-10 bg-slate-700" />
            <div>
              <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>推定価値</div>
              <div className="text-[#F59E0B] text-[18px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>¥{carbonData.creditValueJPY.toLocaleString()}</div>
              <div className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>¥3,000/credit</div>
            </div>
          </div>
        </motion.div>

        {/* Monthly Chart */}
        <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>📊 月別CO₂削減量</span>
            <div className="flex items-center gap-1 text-[#10B981] text-[12px]">
              <TrendingUp size={12} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>+18%</span>
            </div>
          </div>

          <div className="flex items-end gap-2 h-[130px]">
            {carbonData.monthlyData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.kg / maxMonthly) * 100}px` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                  className="w-full rounded-t-md"
                  style={{ background: "linear-gradient(180deg, #10B981, #06B6D4)" }}
                />
                <div className="text-slate-400 text-[10px] mt-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{d.kg}</div>
                <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{d.month}</div>
              </div>
            ))}
          </div>
          <div className="text-slate-500 text-[10px] text-right mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>単位: kg</div>
        </div>

        {/* Recent Deliveries CO2 */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <div className="p-4 border-b border-slate-700/20">
            <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>📦 直近の配送別CO₂削減</span>
          </div>

          {carbonData.recentDeliveries.map((delivery, i) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-4 ${i > 0 ? "border-t border-slate-700/20" : ""}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-[#06B6D4]" />
                  <span className="text-[#2563EB] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>#{delivery.id}</span>
                  <span className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{delivery.route}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ベースライン</div>
                  <div className="text-slate-400 text-[13px]" style={{ fontFamily: "'Inter', sans-serif" }}>{delivery.baselineKg} kg</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>実際排出</div>
                  <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{delivery.actualKg} kg</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>削減量</div>
                  <div className="text-[#10B981] text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>-{delivery.savedKg} kg</div>
                </div>
              </div>

              {/* Comparison bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(delivery.actualKg / delivery.baselineKg) * 100}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #10B981, #06B6D4)" }}
                  />
                </div>
                <span className="text-[#10B981] text-[12px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                  -{delivery.savingPercent}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ranking */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-slate-700/30 p-4"
          style={{ background: "rgba(15, 23, 42, 0.8)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Award size={18} className="text-[#F59E0B]" />
            <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>🏆 ランキング</span>
          </div>
          <p className="text-slate-300 text-[13px] mb-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            あなたは全ドライバー中 <span className="text-[#10B981]" style={{ fontWeight: 600 }}>上位 {carbonData.ranking.percentile}%</span> です
          </p>
          <div className="relative h-3 rounded-full bg-slate-700/50 overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - carbonData.ranking.percentile}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #2563EB, #10B981)" }}
            />
            {/* Position marker */}
            <motion.div
              initial={{ left: 0 }}
              animate={{ left: `${100 - carbonData.ranking.percentile}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#10B981]"
            />
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>1位</span>
            <span className="text-[#F59E0B] text-[12px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
              {carbonData.ranking.position}位 / {carbonData.ranking.total}人
            </span>
            <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>{carbonData.ranking.total}位</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
