import { ArrowLeft, MapPin, Clock, Leaf, Weight, Ruler, CircleDollarSign, Timer, CheckCircle2, XCircle, TrendingUp, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { MiniRouteMap } from "./LeafletMap";

interface MatchScreenProps {
  onBack: () => void;
}

const matchRequests = [
  {
    id: "M-9274",
    from: "大阪市中央区",
    to: "東京都港区",
    fromCoord: { lat: 34.6937, lng: 135.5023 },
    toCoord: { lat: 35.6585, lng: 139.7454 },
    cargo: "精密機器",
    weight: "3,500 kg",
    distance: "512 km",
    co2Saving: "12.5 kg",
    reward: "¥85,000",
    pickupDate: "3月7日 09:00-12:00",
    deliveryDate: "3月7日 18:00まで",
    score: 0.92,
    timeLeft: 755,
    scoreBreakdown: {
      distance: { score: 0.85, weight: 0.30, label: "距離効率" },
      load: { score: 0.95, weight: 0.40, label: "積載率" },
      co2: { score: 0.88, weight: 0.20, label: "CO₂削減" },
      driver: { score: 0.72, weight: 0.10, label: "ドライバー適性" },
    },
    loadFactorChange: { before: 69, after: 89 },
    detourDistance: { km: 23, percentage: 4.5 },
    cargoRequirements: [
      { name: "冷蔵", matched: true },
      { name: "大型", matched: true },
      { name: "危険物", matched: false },
    ],
  },
  {
    id: "M-9281",
    from: "名古屋市中区",
    to: "京都市下京区",
    fromCoord: { lat: 35.1815, lng: 136.9066 },
    toCoord: { lat: 34.9958, lng: 135.7592 },
    cargo: "食品（常温）",
    weight: "2,800 kg",
    distance: "138 km",
    co2Saving: "8.2 kg",
    reward: "¥42,000",
    pickupDate: "3月6日 14:00-16:00",
    deliveryDate: "3月6日 20:00まで",
    score: 0.87,
    timeLeft: 432,
    scoreBreakdown: {
      distance: { score: 0.90, weight: 0.30, label: "距離効率" },
      load: { score: 0.88, weight: 0.40, label: "積載率" },
      co2: { score: 0.82, weight: 0.20, label: "CO₂削減" },
      driver: { score: 0.80, weight: 0.10, label: "ドライバー適性" },
    },
    loadFactorChange: { before: 72, after: 85 },
    detourDistance: { km: 12, percentage: 2.1 },
    cargoRequirements: [
      { name: "常温", matched: true },
      { name: "大型", matched: true },
      { name: "危険物", matched: false },
    ],
  },
];

function CountdownTimer({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = seconds / initialSeconds;

  return (
    <div className="flex items-center gap-2">
      <Timer size={16} className={seconds < 120 ? "text-[#EF4444]" : "text-[#F59E0B]"} />
      <span className={`text-[14px] ${seconds < 120 ? "text-[#EF4444]" : "text-[#F59E0B]"}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: seconds < 120 ? "#EF4444" : "#F59E0B", width: `${progress * 100}%` }}
          animate={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 0.9 ? "#10B981" : score >= 0.8 ? "#2563EB" : "#F59E0B";
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>マッチスコア</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-700/50 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color }}>{score.toFixed(2)}</span>
    </div>
  );
}

function ScoreBreakdown({ match }: { match: typeof matchRequests[0] }) {
  const breakdown = Object.values(match.scoreBreakdown);
  const getBarColor = (score: number) =>
    score >= 0.9 ? "#10B981" : score >= 0.7 ? "#06B6D4" : "#F59E0B";

  return (
    <div className="mt-4 rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.6)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>📊 スコア内訳</span>
      </div>

      {/* Score bars */}
      <div className="space-y-2.5 mb-4">
        {breakdown.map((item, i) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] w-24 shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.score * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: getBarColor(item.score) }}
              />
            </div>
            <span className="text-white text-[11px] w-8 text-right" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{item.score.toFixed(2)}</span>
            <span className="text-slate-500 text-[11px] w-8" style={{ fontFamily: "'Inter', sans-serif" }}>×{(item.weight * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>

      {/* Load factor + Detour cards */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
          <div className="text-slate-400 text-[10px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>積載率変化</div>
          <div className="flex items-center gap-1">
            <span className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{match.loadFactorChange.before}%</span>
            <span className="text-slate-500 text-[12px]">→</span>
            <span className="text-[#10B981] text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{match.loadFactorChange.after}%</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            <ArrowUp size={11} className="text-[#10B981]" />
            <span className="text-[#10B981] text-[11px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>+{match.loadFactorChange.after - match.loadFactorChange.before}%</span>
          </div>
        </div>
        <div className="rounded-lg px-3 py-2.5" style={{ background: "rgba(245, 158, 11, 0.1)" }}>
          <div className="text-slate-400 text-[10px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>迂回距離</div>
          <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>+{match.detourDistance.km} km</div>
          <div className="text-[#F59E0B] text-[11px] mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>({match.detourDistance.percentage}%増)</div>
        </div>
      </div>

      {/* Cargo Requirements */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>車両要件:</span>
        {match.cargoRequirements.map((req) => (
          <span
            key={req.name}
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{
              background: req.matched ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: req.matched ? "#10B981" : "#EF4444",
              fontFamily: "'Noto Sans JP', sans-serif",
            }}
          >
            {req.matched ? "✅" : "❌"} {req.name}
          </span>
        ))}
      </div>
    </div>
  );
}

interface DeclinedInfo {
  matchId: string;
  remainingCandidates: number;
}

export function MatchScreen({ onBack }: MatchScreenProps) {
  const [expandedId, setExpandedId] = useState<string>(matchRequests[0].id);
  const [visibleMatches, setVisibleMatches] = useState<string[]>(matchRequests.map((m) => m.id));
  const [declined, setDeclined] = useState<DeclinedInfo | null>(null);

  const handleDecline = (matchId: string) => {
    setVisibleMatches((prev) => prev.filter((id) => id !== matchId));
    setDeclined({ matchId, remainingCandidates: 2 });
    setExpandedId("");
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>新規マッチリクエスト</h1>
        <span className="ml-auto bg-[#EF4444] text-white text-[12px] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
          {visibleMatches.length}件
        </span>
      </div>

      {/* Declined Toast */}
      <AnimatePresence>
        {declined && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-5 mt-4 rounded-xl border border-slate-700/40 p-4"
            style={{ background: "rgba(15, 23, 42, 0.9)" }}
          >
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-white text-[14px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                  マッチ #{declined.matchId} を辞退しました
                </div>
                <p className="text-slate-400 text-[13px] mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  このリクエストは次の候補ドライバーに提案されます。
                </p>
                <div className="text-slate-500 text-[12px] mb-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  残りの候補: {declined.remainingCandidates}名
                </div>
                <button
                  onClick={() => { setDeclined(null); onBack(); }}
                  className="px-4 py-2 rounded-lg text-[13px] text-white"
                  style={{ background: "rgba(37, 99, 235, 0.2)", border: "1px solid rgba(37, 99, 235, 0.3)", fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Cards */}
      <div className="px-5 mt-4 space-y-4">
        <AnimatePresence>
          {matchRequests.filter((m) => visibleMatches.includes(m.id)).map((match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              layout
              className="rounded-2xl border border-slate-700/40 overflow-hidden"
              style={{ background: "rgba(15, 23, 42, 0.9)" }}
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedId(expandedId === match.id ? "" : match.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#2563EB] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>#{match.id}</span>
                  <span className="text-[#10B981] text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                    🆕 新規
                  </span>
                </div>

                {/* Route */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-3 h-3 rounded-full border-2 border-[#2563EB] bg-transparent" />
                    <div className="w-0.5 h-6 bg-slate-600" />
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-[15px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      <MapPin size={13} className="inline text-[#2563EB] mr-1" />{match.from}
                    </div>
                    <div className="text-white text-[15px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      <MapPin size={13} className="inline text-[#EF4444] mr-1" />{match.to}
                    </div>
                  </div>
                </div>

                <ScoreBar score={match.score} />
              </button>

              {/* Expanded Details */}
              {expandedId === match.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-4 pb-4"
                >
                  <div className="border-t border-slate-700/30 pt-4">
                    {/* Route Map */}
                    <div className="mb-4">
                      <MiniRouteMap
                        from={{ ...match.fromCoord, label: match.from }}
                        to={{ ...match.toCoord, label: match.to }}
                        height="140px"
                      />
                    </div>

                    {/* Score Breakdown */}
                    <ScoreBreakdown match={match} />

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
                      <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                        <Package2Icon />
                        <div>
                          <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>品名</div>
                          <div className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{match.cargo}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                        <Weight size={16} className="text-slate-400" />
                        <div>
                          <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>重量</div>
                          <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{match.weight}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                        <Ruler size={16} className="text-slate-400" />
                        <div>
                          <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>距離</div>
                          <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{match.distance}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                        <Leaf size={16} className="text-[#10B981]" />
                        <div>
                          <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>CO₂削減</div>
                          <div className="text-[#10B981] text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{match.co2Saving}</div>
                        </div>
                      </div>
                    </div>

                    {/* Reward */}
                    <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 mb-4">
                      <div className="flex items-center gap-2">
                        <CircleDollarSign size={20} className="text-[#F59E0B]" />
                        <span className="text-slate-300 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>報酬</span>
                      </div>
                      <span className="text-[#F59E0B] text-[20px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{match.reward}</span>
                    </div>

                    {/* Schedule */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#2563EB]" />
                        <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>集荷:</span>
                        <span className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{match.pickupDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-[#EF4444]" />
                        <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>配達:</span>
                        <span className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{match.deliveryDate}</span>
                      </div>
                    </div>

                    {/* Countdown */}
                    <div className="mb-5">
                      <CountdownTimer initialSeconds={match.timeLeft} />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex-1 py-3.5 rounded-xl text-white text-[15px] flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #059669, #10B981)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                        ✅ 承認
                      </button>
                      <button
                        onClick={() => handleDecline(match.id)}
                        className="flex-1 py-3.5 rounded-xl text-slate-300 text-[15px] border border-slate-600 flex items-center justify-center gap-2"
                        style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
                      >
                        ❌ 辞退
                      </button>
                    </div>

                    {/* Cascade hint */}
                    <p className="text-slate-500 text-[11px] text-center mt-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                      辞退すると次の候補ドライバーに提案されます
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visibleMatches.length === 0 && !declined && (
        <div className="text-center py-20">
          <CheckCircle2 size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            新着マッチはありません
          </p>
        </div>
      )}
    </div>
  );
}

function Package2Icon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}
