import { ArrowLeft, Truck, AlertTriangle, Package, CheckCircle2, Plus, Thermometer, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useCertifications, type Certification } from "../../hooks/useDomain";

interface CertificationsScreenProps {
  onBack: () => void;
}

function isExpiringSoon(expiry?: string): boolean {
  if (!expiry) return false;
  const expDate = new Date(expiry);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  return expDate <= sixMonths;
}

function getStatusConfig(cert: Certification) {
  if (cert.status === "expired") return { label: "期限切れ", color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)" };
  if (cert.status === "none")    return { label: "未取得",   color: "#64748B", bg: "rgba(100, 116, 139, 0.15)" };
  if (isExpiringSoon(cert.expiry_date)) return { label: "期限切れ間近", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)" };
  return { label: "有効", color: "#10B981", bg: "rgba(16, 185, 129, 0.15)" };
}

function certIcon(name: string) {
  if (name.includes("冷")) return Thermometer;
  if (name.includes("フォーク") || name.includes("危険")) return AlertTriangle;
  if (name.includes("大型") || name.includes("自動車")) return Truck;
  return Package;
}

function formatDate(date?: string) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function CertificationsScreen({ onBack }: CertificationsScreenProps) {
  const { data: certifications, loading, error } = useCertifications();

  const certs = certifications ?? [];
  const activeCerts = certs.filter((c) => c.status === "active");
  const expiringSoon = activeCerts.filter((c) => isExpiringSoon(c.expiry_date));

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

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>読込中...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertTriangle size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>データを読み込めませんでした</p>
          </div>
        ) : (
          <>
            {/* Certifications List */}
            <div className="rounded-xl border border-slate-700/30 overflow-hidden" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
              {certs.map((cert, i) => {
                const statusCfg = getStatusConfig(cert);
                const Icon = certIcon(cert.name);
                const expiryLabel = formatDate(cert.expiry_date);

                return (
                  <motion.div
                    key={cert.id}
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
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full shrink-0" style={{ background: statusCfg.bg, color: statusCfg.color, fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                        {statusCfg.label === "有効" ? "✅" : statusCfg.label === "期限切れ間近" ? "⚠️" : "❌"} {statusCfg.label}
                      </span>
                    </div>

                    {expiryLabel && (
                      <div className="ml-11 text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                        有効期限: <span style={{ fontFamily: "'Inter', sans-serif" }}>{expiryLabel}</span>
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

              {certs.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-2">
                  <CheckCircle2 size={32} className="text-slate-600" />
                  <p className="text-slate-500 text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>資格情報がありません</p>
                </div>
              )}
            </div>

            {/* Expiring Warning */}
            {expiringSoon.length > 0 && (
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
                    ⚠️ {expiringSoon.map((c) => c.name.split("・")[0]).join("、")}の有効期限が6ヶ月以内です
                  </span>
                </div>
              </motion.div>
            )}

            {/* Match Eligibility */}
            {certs.length > 0 && (
              <div className="rounded-xl border border-slate-700/30 p-4" style={{ background: "rgba(15, 23, 42, 0.8)" }}>
                <span className="text-white text-[13px] mb-3 block" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>マッチング対象</span>
                <div className="flex flex-wrap gap-2">
                  {activeCerts.map((cert) => (
                    <span key={cert.id} className="text-[12px] px-3 py-1 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontFamily: "'Noto Sans JP', sans-serif" }}>
                      ✅ {cert.name.split(" ")[0]}
                    </span>
                  ))}
                  {certs.filter((c) => c.status === "expired").map((cert) => (
                    <span key={cert.id} className="text-[12px] px-3 py-1 rounded-full" style={{ background: "rgba(100, 116, 139, 0.15)", color: "#64748B", fontFamily: "'Noto Sans JP', sans-serif" }}>
                      ❌ {cert.name.split(" ")[0]}
                    </span>
                  ))}
                </div>
                <p className="text-slate-500 text-[11px] mt-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  有効な資格に基づき、対応可能な貨物タイプにマッチングされます。
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
