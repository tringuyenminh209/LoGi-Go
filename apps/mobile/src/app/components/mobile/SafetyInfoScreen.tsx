import {
  ArrowLeft, Shield, AlertTriangle, CloudRain, Wind, Thermometer,
  Eye, CheckCircle2, TrendingUp, MapPin, Clock, ChevronRight, Activity
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface SafetyInfoScreenProps {
  onBack: () => void;
}

const safetyScore = {
  current: 95,
  previous: 91,
  trend: "+4",
  breakdown: [
    { label: "急ブレーキ", score: 98, color: "#10B981" },
    { label: "速度超過", score: 96, color: "#10B981" },
    { label: "急発進", score: 94, color: "#10B981" },
    { label: "急ハンドル", score: 92, color: "#06B6D4" },
    { label: "連続運転", score: 88, color: "#F59E0B" },
  ],
};

const weatherAlerts = [
  {
    id: 1,
    type: "rain",
    icon: CloudRain,
    title: "大雨注意報",
    area: "東名高速 富士IC〜御殿場IC",
    severity: "warning",
    message: "16:00〜22:00 にかけて強い雨の予報。視界悪化に注意。",
    color: "#2563EB",
  },
  {
    id: 2,
    type: "wind",
    icon: Wind,
    title: "強風注意報",
    area: "中央道 八王子JCT〜大月IC",
    severity: "caution",
    message: "横風が強く、空荷車両は特に注意してください。",
    color: "#F59E0B",
  },
];

const earthquakeHistory = [
  {
    time: "14:23",
    date: "3月5日",
    magnitude: "M4.2",
    location: "愛知県東部",
    intensity: "震度4",
    impact: "通行規制なし",
    color: "#F59E0B",
  },
  {
    time: "03:15",
    date: "3月4日",
    magnitude: "M2.8",
    location: "静岡県西部",
    intensity: "震度2",
    impact: "影響なし",
    color: "#10B981",
  },
  {
    time: "21:40",
    date: "3月2日",
    magnitude: "M5.1",
    location: "千葉県北西部",
    intensity: "震度4",
    impact: "首都高一部通行止め（解除済）",
    color: "#EF4444",
  },
];

const drivingTips = [
  { title: "休憩のタイミング", desc: "2時間ごとに15分の休憩を推奨。疲労は判断力を低下させます。" },
  { title: "悪天候時の運転", desc: "速度を20%落とし、車間距離を通常の2倍に。霧の場合はフォグランプを使用。" },
  { title: "積載物の確認", desc: "出発前に荷物の固定状態を確認。急ブレーキ時の荷崩れを防止。" },
  { title: "地震発生時", desc: "ハザードを点灯し、安全な場所に停車。ラジオで最新情報を確認。" },
];

const routeRestrictions = [
  { route: "東名高速 大井松田IC付近", restriction: "工事規制（〜3月10日）", status: "active", color: "#EF4444" },
  { route: "中央道 談合坂SA付近", restriction: "車線規制（夜間のみ）", status: "active", color: "#F59E0B" },
  { route: "首都高 C1外回り", restriction: "通行止め解除済", status: "resolved", color: "#10B981" },
];

export function SafetyInfoScreen({ onBack }: SafetyInfoScreenProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "weather" | "quake" | "tips">("overview");

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>安全情報</h1>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[#10B981] text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>異常なし</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-5 mt-4 overflow-x-auto no-scrollbar">
        {[
          { id: "overview" as const, label: "概要" },
          { id: "weather" as const, label: "気象" },
          { id: "quake" as const, label: "地震" },
          { id: "tips" as const, label: "ガイド" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-[13px] whitespace-nowrap ${
              activeTab === tab.id ? "text-white" : "text-slate-400"
            }`}
            style={{
              background: activeTab === tab.id ? "rgba(37, 99, 235, 0.2)" : "transparent",
              border: activeTab === tab.id ? "1px solid rgba(37, 99, 235, 0.3)" : "1px solid transparent",
              fontFamily: "'Noto Sans JP', sans-serif",
              fontWeight: activeTab === tab.id ? 600 : 400,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Safety Score */}
            <div className="rounded-2xl border border-slate-700/40 p-5" style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.05))" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={20} className="text-[#10B981]" />
                  <span className="text-white text-[16px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>安全運転スコア</span>
                </div>
                <div className="flex items-center gap-1 text-[#10B981]">
                  <TrendingUp size={14} />
                  <span className="text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{safetyScore.trend}</span>
                </div>
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-center mb-5">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#1E293B" strokeWidth="8" />
                    <motion.circle
                      cx="60" cy="60" r="52" fill="none"
                      stroke="url(#scoreGradient)" strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - safetyScore.current / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#06B6D4" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-white text-[36px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                      {safetyScore.current}
                    </span>
                    <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>/ 100</span>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5">
                {safetyScore.breakdown.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-slate-400 text-[12px] w-20 shrink-0" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.score}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ background: item.color }}
                      />
                    </div>
                    <span className="text-[12px] w-8 text-right" style={{ color: item.color, fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>{item.score}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Restrictions */}
            <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
              <h3 className="text-white text-[14px] mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                <AlertTriangle size={16} className="text-[#F59E0B]" />
                道路規制情報
              </h3>
              <div className="space-y-3">
                {routeRestrictions.map((r, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-700/20 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: r.color }} />
                    <div className="flex-1">
                      <div className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{r.route}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: r.color, fontFamily: "'Noto Sans JP', sans-serif" }}>{r.restriction}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Weather Summary */}
            {weatherAlerts.length > 0 && (
              <button
                onClick={() => setActiveTab("weather")}
                className="w-full rounded-xl border border-[#2563EB]/30 p-4 text-left flex items-center gap-3"
                style={{ background: "rgba(37, 99, 235, 0.08)" }}
              >
                <CloudRain size={24} className="text-[#2563EB]" />
                <div className="flex-1">
                  <div className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>気象警報 {weatherAlerts.length}件</div>
                  <div className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ルート上の注意情報があります</div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            )}
          </motion.div>
        )}

        {/* Weather Tab */}
        {activeTab === "weather" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Current Weather */}
            <div className="rounded-2xl border border-slate-700/40 p-5 text-center" style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(6, 182, 212, 0.05))" }}>
              <Thermometer size={24} className="text-[#06B6D4] mx-auto mb-2" />
              <div className="text-white text-[32px] mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>18°C</div>
              <div className="text-slate-400 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>現在地: 静岡県付近 · 曇り時々雨</div>
              <div className="flex justify-center gap-6 mt-4">
                <div>
                  <Eye size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>8 km</div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>視界</div>
                </div>
                <div>
                  <Wind size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>12 m/s</div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>風速</div>
                </div>
                <div>
                  <CloudRain size={14} className="text-slate-400 mx-auto mb-1" />
                  <div className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>70%</div>
                  <div className="text-slate-500 text-[10px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>降水確率</div>
                </div>
              </div>
            </div>

            {/* Weather Alerts */}
            <h3 className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>注意報・警報</h3>
            {weatherAlerts.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border p-4"
                  style={{
                    background: `${alert.color}08`,
                    borderColor: `${alert.color}30`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${alert.color}15` }}>
                      <Icon size={20} style={{ color: alert.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-white text-[14px] mb-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>{alert.title}</div>
                      <div className="text-slate-400 text-[12px] mb-2 flex items-center gap-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        <MapPin size={11} />
                        {alert.area}
                      </div>
                      <div className="text-slate-300 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{alert.message}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Earthquake Tab */}
        {activeTab === "quake" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Current Status */}
            <div className="rounded-2xl border border-[#10B981]/20 p-5 text-center" style={{ background: "rgba(16, 185, 129, 0.05)" }}>
              <Activity size={28} className="text-[#10B981] mx-auto mb-2" />
              <div className="text-[#10B981] text-[16px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>現在の地震活動: 通常レベル</div>
              <div className="text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ルート上に地震の影響はありません</div>
            </div>

            {/* History */}
            <h3 className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>最近の地震履歴</h3>
            {earthquakeHistory.map((eq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-slate-700/30 p-4"
                style={{ background: "rgba(15, 23, 42, 0.8)" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: eq.color }} />
                    <span className="text-white text-[15px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>{eq.location}</span>
                  </div>
                  <span className="text-[13px] px-2 py-0.5 rounded-full" style={{ background: `${eq.color}20`, color: eq.color, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                    {eq.intensity}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={12} />
                    <span className="text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{eq.date} {eq.time}</span>
                  </div>
                  <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>{eq.magnitude}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} style={{ color: eq.color }} />
                  <span className="text-[12px]" style={{ color: eq.color, fontFamily: "'Noto Sans JP', sans-serif" }}>{eq.impact}</span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Tips Tab */}
        {activeTab === "tips" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h3 className="text-white text-[14px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>安全運転ガイドライン</h3>
            {drivingTips.map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-slate-700/30 p-4"
                style={{ background: "rgba(15, 23, 42, 0.8)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(6, 182, 212, 0.15)" }}>
                    <span className="text-[#06B6D4] text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{i + 1}</span>
                  </div>
                  <div>
                    <div className="text-white text-[14px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>{tip.title}</div>
                    <div className="text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{tip.desc}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Emergency Contacts */}
            <div className="rounded-xl border border-[#EF4444]/20 p-4 mt-4" style={{ background: "rgba(239, 68, 68, 0.05)" }}>
              <h3 className="text-[#EF4444] text-[14px] mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                <AlertTriangle size={16} />
                緊急連絡先
              </h3>
              {[
                { name: "Logi-Go 緊急ダイヤル", number: "0120-000-XXX" },
                { name: "JAFロードサービス", number: "#8139" },
                { name: "警察", number: "110" },
                { name: "消防・救急", number: "119" },
              ].map((contact) => (
                <div key={contact.name} className="flex items-center justify-between py-2 border-b border-slate-700/15 last:border-0">
                  <span className="text-slate-300 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{contact.name}</span>
                  <span className="text-white text-[14px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{contact.number}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
