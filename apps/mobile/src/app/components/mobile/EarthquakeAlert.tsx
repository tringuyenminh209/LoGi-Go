import { AlertTriangle, MapPin, Navigation, CheckCircle2, Loader2, XCircle, Waves } from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

interface EarthquakeAlertProps {
  onDismiss: () => void;
  onNavigateToSafety?: () => void;
}

const intensityConfig: Record<string, { bg: string; textBg: string; borderColor: string }> = {
  "震度4":  { bg: "#F59E0B", textBg: "rgba(245,158,11,0.2)", borderColor: "rgba(245,158,11,0.5)" },
  "震度5弱": { bg: "#F97316", textBg: "rgba(249,115,22,0.2)", borderColor: "rgba(249,115,22,0.5)" },
  "震度5強": { bg: "#EF4444", textBg: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.5)" },
  "震度6弱": { bg: "#DC2626", textBg: "rgba(220,38,38,0.3)", borderColor: "rgba(220,38,38,0.6)" },
  "震度6強": { bg: "#991B1B", textBg: "rgba(153,27,27,0.4)", borderColor: "rgba(153,27,27,0.6)" },
  "震度7":  { bg: "#7F1D1D", textBg: "rgba(127,29,29,0.5)", borderColor: "rgba(127,29,29,0.7)" },
};

// Mock earthquake data
const quakeData = {
  intensity: "震度5強",
  epicenter: "駿河湾",
  depth: "40km",
  magnitude: "M6.2",
  sWaveSeconds: 28,
  tsunami: {
    hasWarning: true,
    level: "津波注意報",
    area: "太平洋沿岸",
    height: "0.5m",
    eta: "15分後",
  },
  autoResponses: [
    { label: "減速指示送信済み", status: "done" as const },
    { label: "ルート再計算中...", status: "loading" as const },
    { label: "IOWN優先チャネル確保済み", status: "done" as const },
  ],
};

function SWaveCountdown({ initialSeconds }: { initialSeconds: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const progress = seconds / initialSeconds;
  const isUrgent = seconds < 10;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-red-200 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>⏱ S波到達まで</span>
        <motion.span
          animate={isUrgent ? { scale: [1, 1.15, 1] } : {}}
          transition={isUrgent ? { duration: 0.5, repeat: Infinity } : {}}
          className="text-white text-[24px]"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}
        >
          {seconds}<span className="text-[14px] text-red-200">秒</span>
        </motion.span>
      </div>
      <div className="w-full h-3 rounded-full bg-black/30 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{
            width: `${progress * 100}%`,
            backgroundColor: isUrgent ? "#EF4444" : "#F59E0B",
          }}
          transition={{ duration: 1, ease: "linear" }}
        />
      </div>
    </div>
  );
}

export function EarthquakeAlert({ onDismiss, onNavigateToSafety }: EarthquakeAlertProps) {
  const config = intensityConfig[quakeData.intensity] || intensityConfig["震度5強"];
  const [responseStatuses, setResponseStatuses] = useState(quakeData.autoResponses.map((r) => r.status));

  // Simulate the loading response completing after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setResponseStatuses((prev) => prev.map((s) => (s === "loading" ? "done" : s)));
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-y-auto"
    >
      {/* Pulsing Red Background */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "linear-gradient(135deg, #7F1D1D 0%, #DC2626 50%, #991B1B 100%)",
            "linear-gradient(135deg, #991B1B 0%, #EF4444 50%, #7F1D1D 100%)",
            "linear-gradient(135deg, #7F1D1D 0%, #DC2626 50%, #991B1B 100%)",
          ],
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-[env(safe-area-inset-top)] py-6 max-w-[430px] mx-auto w-full">
        {/* Alert Icon + Title */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, -3, 3, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="mb-4"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <AlertTriangle size={40} className="text-white" />
          </div>
        </motion.div>

        <motion.h1
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-white text-[26px] mb-4"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}
        >
          ⚠️ 緊急地震速報
        </motion.h1>

        {/* Intensity Badge */}
        <div
          className="px-8 py-3 rounded-xl mb-5"
          style={{ background: config.textBg, border: `2px solid ${config.borderColor}` }}
        >
          <span className="text-white text-[32px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}>
            {quakeData.intensity}
          </span>
        </div>

        {/* S-wave Countdown */}
        <div className="w-full bg-black/30 rounded-2xl p-4 mb-4 backdrop-blur">
          <SWaveCountdown initialSeconds={quakeData.sWaveSeconds} />
        </div>

        {/* Quake Details */}
        <div className="w-full bg-black/30 rounded-2xl p-4 mb-4 backdrop-blur">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-red-200 text-[11px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>📍 震源</div>
              <div className="text-white text-[15px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>{quakeData.epicenter}</div>
            </div>
            <div>
              <div className="text-red-200 text-[11px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>📏 深さ</div>
              <div className="text-white text-[15px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{quakeData.depth}</div>
            </div>
            <div>
              <div className="text-red-200 text-[11px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>M</div>
              <div className="text-white text-[15px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{quakeData.magnitude}</div>
            </div>
          </div>
        </div>

        {/* Tsunami Section */}
        <div className="w-full mb-4">
          {quakeData.tsunami.hasWarning ? (
            <div className="rounded-2xl p-4 backdrop-blur" style={{ background: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Waves size={20} className="text-[#F59E0B]" />
                <span className="text-[#F59E0B] text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}>🌊 津波情報</span>
              </div>
              <div className="text-white text-[15px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                ⚠️ {quakeData.tsunami.level} — {quakeData.tsunami.area}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-red-200 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  予想高さ: <span className="text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{quakeData.tsunami.height}</span>
                </span>
                <span className="text-red-200 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  到達予想: <span className="text-white" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{quakeData.tsunami.eta}</span>
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-4 backdrop-blur flex items-center gap-3" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
              <CheckCircle2 size={20} className="text-[#10B981]" />
              <span className="text-[#10B981] text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                津波の心配はありません
              </span>
            </div>
          )}
        </div>

        {/* Auto-response Status */}
        <div className="w-full bg-black/40 rounded-2xl p-4 mb-5 backdrop-blur">
          <span className="text-red-200 text-[12px] mb-3 block" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>自動対応状況:</span>
          <div className="space-y-2.5">
            {quakeData.autoResponses.map((item, i) => {
              const status = responseStatuses[i];
              return (
                <div key={i} className="flex items-center gap-2.5">
                  {status === "done" && <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />}
                  {status === "loading" && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 size={16} className="text-[#F59E0B] shrink-0" />
                    </motion.div>
                  )}
                  {status === "error" && <XCircle size={16} className="text-[#EF4444] shrink-0" />}
                  <span
                    className="text-[13px]"
                    style={{
                      color: status === "done" ? "#10B981" : status === "loading" ? "#F59E0B" : "#EF4444",
                      fontFamily: "'Noto Sans JP', sans-serif",
                    }}
                  >
                    {status === "done" ? "✅" : status === "loading" ? "⏳" : "❌"} {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Safety Message */}
        <div className="w-full bg-black/30 rounded-2xl p-4 mb-5 backdrop-blur">
          <div className="flex items-center gap-3 mb-2">
            <MapPin size={22} className="text-white" />
            <span className="text-white text-[16px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}>安全な場所に</span>
          </div>
          <p className="text-white text-[20px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}>
            停車してください
          </p>
          <div className="mt-3 text-red-200 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            最寄りの避難場所: <span className="text-white">中央公園（500m先）</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pb-8">
          <button className="w-full py-4 rounded-xl bg-white text-[#991B1B] text-[16px] flex items-center justify-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}>
            <Navigation size={20} />
            ナビゲーション開始
          </button>
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-4 rounded-xl bg-white/20 text-white text-[15px] flex items-center justify-center gap-2 border border-white/30"
              style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}
            >
              <CheckCircle2 size={18} />
              安全を確認
            </button>
            <button
              onClick={() => { onDismiss(); onNavigateToSafety?.(); }}
              className="flex-1 py-4 rounded-xl bg-white/10 text-white text-[15px] flex items-center justify-center gap-2 border border-white/20"
              style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
            >
              安全情報へ
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
