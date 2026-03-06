import { ArrowLeft, Truck, AlertTriangle, Package, CheckCircle2, Plus, Thermometer } from "lucide-react";
import { motion } from "motion/react";

interface CertificationsScreenProps {
  onBack: () => void;
}

const certifications = [
  { name: "大型自動車免許", status: "active" as const, expires: "2028-03-15", expiresLabel: "2028年3月15日", icon: Truck },
  { name: "冷蔵・冷凍車資格", status: "active" as const, expires: "2027-08-20", expiresLabel: "2027年8月20日", icon: Thermometer },
  { name: "危険物取扱者 乙種4類", status: "none" as const, expires: null, expiresLabel: null, icon: AlertTriangle },
  { name: "フォークリフト運転技能", status: "active" as const, expires: "2029-01-10", expiresLabel: "2029年1月10日", icon: Package },
];

// Check if expiring within 6 months
function isExpiringSoon(expires: string | null): boolean {
  if (!expires) return false;
  const expDate = new Date(expires);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return expDate <= sixMonths;
}

function getStatusConfig(status: string, expires: string | null) {
  if (status === "none") return { label: "未取得", color: "#64748B", bg: "rgba(100, 116, 139, 0.15)" };
  if (isExpiringSoon(expires)) return { label: "期限切れ間近", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
  return { label: "有効", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" };
}

const expiringCerts = certifications.filter(
  (c) => c.status === "active" && isExpiringSoon(c.expires)
);

export function CertificationsScreen({ onBack }: CertificationsScreenProps) {
  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>資格・免許</h1>
      </div>

      <div className="px-5 mt-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>🎓 資格・免許管理</span>
        </div>

        {/* Certifications List */}
        <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          {certifications.map((cert, i) => {
            const statusCfg = getStatusConfig(cert.status, cert.expires);
            const Icon = cert.icon;

            return (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`px-4 py-4 ${i > 0 ? "border-t border-slate-700/20" : ""}`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${statusCfg.color}15` }}>
                      <Icon size={18} style={{ color: statusCfg.color }} />
                    </div>
                    <span className="text-white text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>{cert.name}</span>
                  </div>
                  <span
                    className="text-[11px] px-2.5 py-0.5 rounded-full shrink-0"
                    style={{
                      background: statusCfg.bg,
                      color: statusCfg.color,
                      fontFamily: "'Noto Sans JP', sans-serif",
                      fontWeight: 500,
                    }}
                  >
                    {statusCfg.label === "有効" ? "✅" : statusCfg.label === "期限切れ間近" ? "⚠️" : "❌"} {statusCfg.label}
                  </span>
                </div>

                {cert.expiresLabel && (
                  <div className="ml-11 text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    有効期限: <span style={{ fontFamily: "'Inter', sans-serif" }}>{cert.expiresLabel}</span>
                  </div>
                )}

                {cert.status === "none" && (
                  <button className="ml-11 mt-2 text-[#2563EB] text-[12px] flex items-center gap-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                    <Plus size={12} />
                    資格を追加
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Expiring Warning */}
        {expiringCerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl border p-4"
            style={{ background: "rgba(245, 158, 11, 0.05)", borderColor: "rgba(245, 158, 11, 0.3)" }}
          >
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <AlertTriangle size={16} />
              <span className="text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>
                ⚠️ {expiringCerts.map((c) => c.name.split("・")[0]).join("、")}の有効期限が6ヶ月以内です
              </span>
            </div>
          </motion.div>
        )}

        {/* Match Eligibility */}
        <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
          <span className="text-white text-[13px] mb-3 block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>マッチング対象</span>
          <div className="flex flex-wrap gap-2">
            {certifications.filter((c) => c.status === "active").map((cert) => (
              <span key={cert.name} className="text-[12px] px-3 py-1 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontFamily: "'Noto Sans JP', sans-serif" }}>
                ✅ {cert.name.split(" ")[0]}
              </span>
            ))}
            {certifications.filter((c) => c.status === "none").map((cert) => (
              <span key={cert.name} className="text-[12px] px-3 py-1 rounded-full" style={{ background: "rgba(100, 116, 139, 0.15)", color: "#64748B", fontFamily: "'Noto Sans JP', sans-serif" }}>
                ❌ {cert.name.split(" ")[0]}
              </span>
            ))}
          </div>
          <p className="text-slate-500 text-[11px] mt-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            有効な資格に基づき、対応可能な貨物タイプにマッチングされます。
          </p>
        </div>
      </div>
    </div>
  );
}
