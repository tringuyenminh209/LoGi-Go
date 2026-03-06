import { ArrowLeft, Leaf, TrendingUp, Award, Truck, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCarbonSummary } from "../../hooks/useDomain";

interface CarbonDashboardScreenProps {
  onBack: () => void;
}

export function CarbonDashboardScreen({ onBack }: CarbonDashboardScreenProps) {
  const { data, loading } = useCarbonSummary();

  const co2Saved = data?.co2_saved_kg ?? 0;
  const co2SavedT = (co2Saved / 1000).toFixed(1);
  const totalCredits = ((data?.j_blue_credits ?? 0) + (data?.gx_ets_credits ?? 0)).toFixed(2);
  const creditValueJPY = Math.round(((data?.j_blue_credits ?? 0) + (data?.gx_ets_credits ?? 0)) * 3000);
  const efficiencyScore = data?.efficiency_score ?? 0;
  const trend = data?.trend ?? [];
  const maxKg = trend.length > 0 ? Math.max(...trend.map((d) => d.co2_kg)) : 1;

  const rankPercentile = 12; // Phase 4 — match engine will provide this

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>カーボンクレジット</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>読込中...</span>
        </div>
      ) : (
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

            {/* Ring */}
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1E293B" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="url(#carbonGrad)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - efficiencyScore / 100) }}
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
                  {co2SavedT}
                </motion.span>
                <span className="text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>t CO₂削減</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>J-Blue Credit</div>
                <div className="text-[#06B6D4] text-[18px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{totalCredits}</div>
                <div className="text-slate-500 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>クレジット</div>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div>
                <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>推定価値</div>
                <div className="text-[#F59E0B] text-[18px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>¥{creditValueJPY.toLocaleString()}</div>
                <div className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>¥3,000/credit</div>
              </div>
            </div>
          </motion.div>

          {/* Trend Chart */}
          {trend.length > 0 && (
            <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>📊 週別CO₂削減量</span>
                <div className="flex items-center gap-1 text-[#10B981] text-[12px]">
                  <TrendingUp size={12} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>今月</span>
                </div>
              </div>
              <div className="flex items-end gap-2 h-[130px]">
                {trend.map((d, i) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.co2_kg / maxKg) * 100}px` }}
                      transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                      className="w-full rounded-t-md"
                      style={{ background: "linear-gradient(180deg, #10B981, #06B6D4)" }}
                    />
                    <div className="text-slate-400 text-[10px] mt-2" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{d.co2_kg}</div>
                    <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      {new Date(d.date).getDate()}日
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-slate-500 text-[10px] text-right mt-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>単位: kg</div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "今月の配送数", value: String(data?.deliveries_count ?? 0), unit: "件", color: "#2563EB" },
              { label: "効率スコア", value: String(efficiencyScore), unit: "点", color: "#10B981" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <div className="text-slate-400 text-[11px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{stat.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-white text-[24px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{stat.unit}</span>
                </div>
              </div>
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
              あなたは全ドライバー中 <span className="text-[#10B981]" style={{ fontWeight: 600 }}>上位 {rankPercentile}%</span> です
            </p>
            <div className="relative h-3 rounded-full bg-slate-700/50 overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - rankPercentile}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #2563EB, #10B981)" }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>1位</span>
              <span className="text-[#F59E0B] text-[12px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                上位 {rankPercentile}%
              </span>
              <span className="text-slate-500 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>最下位</span>
            </div>
            <p className="text-slate-500 text-[11px] mt-2 text-center" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              ※ランキングはPhase 4のマッチエンジン完成後に更新されます
            </p>
          </motion.div>

          {/* Trucks powered */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
            <Truck size={20} className="text-[#06B6D4]" />
            <p className="text-slate-300 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              あなたのCO₂削減は杉の木 <span className="text-[#10B981]" style={{ fontWeight: 600 }}>{Math.floor(co2Saved / 14)}本</span> 分に相当します
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
