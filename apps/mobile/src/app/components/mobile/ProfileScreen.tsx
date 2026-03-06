import { ArrowLeft, Truck, Clock, Leaf, Award, ChevronRight, Moon, Bell, Globe, Shield, LogOut, TrendingUp, FileText, GraduationCap } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../../context/AuthContext";

interface ProfileScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onNavigate?: (screen: string) => void;
}

const menuSections = [
  {
    title: "設定",
    items: [
      { icon: Bell, label: "通知設定", value: "オン", screen: null },
      { icon: Moon, label: "ダークモード", value: "オン", screen: null },
      { icon: Globe, label: "言語", value: "日本語", screen: null },
      { icon: GraduationCap, label: "資格・免許管理", value: null, screen: "certifications" },
    ],
  },
  {
    title: "アカウント",
    items: [
      { icon: Shield, label: "セキュリティ", value: "", screen: null },
      { icon: Truck, label: "車両情報", value: null, screen: null },
      { icon: FileText, label: "OCR確認キュー", value: "3件待ち", screen: "ocr-review" },
    ],
  },
];

export function ProfileScreen({ onBack, onLogout, onNavigate }: ProfileScreenProps) {
  const { driver } = useAuth();

  const name = driver?.name ?? "田中太郎";
  const nameInitials = name.slice(0, 2);
  const totalDeliveries = driver?.total_deliveries?.toLocaleString() ?? "—";
  const co2Saved = driver?.co2_saved_kg ? (driver.co2_saved_kg / 1000).toFixed(1) : "—";
  const rating = driver?.rating?.toFixed(1) ?? "—";
  const vehiclePlate = driver?.vehicle_plate ?? "—";
  const vehicleType = driver?.vehicle_type ?? "—";

  const stats = [
    { icon: Truck, label: "総配送", value: totalDeliveries, unit: "件", color: "#2563EB", screen: null },
    { icon: Clock, label: "走行時間", value: "3,420", unit: "h", color: "#06B6D4", screen: null },
    { icon: Leaf, label: "CO₂削減", value: co2Saved, unit: "t", color: "#10B981", screen: "carbon" },
    { icon: Award, label: "評価", value: rating, unit: "/5", color: "#F59E0B", screen: null },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>プロフィール</h1>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-5 rounded-2xl p-5 border border-slate-700/40"
        style={{ background: "linear-gradient(135deg, rgba(37, 99, 235, 0.15), rgba(6, 182, 212, 0.1))" }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4] flex items-center justify-center text-white text-[24px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 700 }}>
            {nameInitials}
          </div>
          <div>
            <h2 className="text-white text-[20px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>{name}</h2>
            <p className="text-slate-400 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>ドライバー · {vehicleType}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 rounded-full bg-[#10B981]" />
              <span className="text-[#10B981] text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>稼働中</span>
            </div>
          </div>
        </div>
        <div className="text-slate-400 text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {vehiclePlate}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {stats.map((stat, i) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => stat.screen && onNavigate?.(stat.screen)}
            className="rounded-xl p-4 border border-slate-700/30 text-left"
            style={{ background: "rgba(15, 23, 42, 0.8)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon size={20} style={{ color: stat.color }} />
              {stat.screen && <ChevronRight size={14} className="text-slate-600" />}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white text-[22px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>{stat.value}</span>
              <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{stat.unit}</span>
            </div>
            <div className="text-slate-400 text-[12px] mt-0.5" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{stat.label}</div>
          </motion.button>
        ))}
      </div>

      {/* Monthly Summary */}
      <div className="mx-5 mt-5 rounded-xl p-4 border border-slate-700/30" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>今月の実績</span>
          <div className="flex items-center gap-1 text-[#10B981] text-[12px]">
            <TrendingUp size={12} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>+12%</span>
          </div>
        </div>
        <div className="flex gap-1">
          {[65, 78, 82, 70, 90, 85, 72, 88, 95, 80, 76, 92, 68, 85, 79, 93, 87, 74, 91, 83, 77, 89, 94, 80, 86, 73, 88, 92, 84, 78].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col-reverse">
              <div className="w-full rounded-sm min-h-[2px]" style={{ height: `${v * 0.4}px`, background: v > 85 ? "#10B981" : v > 70 ? "#06B6D4" : "#2563EB", opacity: 0.7 }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-slate-500 text-[10px]" style={{ fontFamily: "'Inter', sans-serif" }}>3月1日</span>
          <span className="text-slate-500 text-[10px]" style={{ fontFamily: "'Inter', sans-serif" }}>3月30日</span>
        </div>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="px-5 mt-5">
          <span className="text-slate-400 text-[12px] mb-2 block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>{section.title}</span>
          <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
            {section.items.map((item, i) => (
              <button
                key={item.label}
                onClick={() => item.screen && onNavigate?.(item.screen)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? "border-t border-slate-700/20" : ""}`}
              >
                <item.icon size={18} className="text-slate-400" />
                <span className="flex-1 text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>{item.label}</span>
                {item.value && (
                  <span className="text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", color: item.screen === "ocr-review" ? "#F59E0B" : "#94A3B8" }}>
                    {item.value}
                  </span>
                )}
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="px-5 mt-6">
        <button onClick={() => onLogout?.()} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#EF4444]/30 text-[#EF4444] text-[14px]" style={{ background: "rgba(239, 68, 68, 0.05)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
          <LogOut size={18} />
          ログアウト
        </button>
      </div>
    </div>
  );
}
