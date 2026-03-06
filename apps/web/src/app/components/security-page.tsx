import { Shield, Lock, Key, FileCheck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const svidData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  issued: Math.floor(30 + Math.random() * 40),
}));

const services = [
  { name: "api-gateway", svid: "Valid", mtls: true, lastRotation: "2分前", expires: "23時間後" },
  { name: "match-svc", svid: "Valid", mtls: true, lastRotation: "5分前", expires: "23時間後" },
  { name: "ingest-svc", svid: "Valid", mtls: true, lastRotation: "8分前", expires: "22時間後" },
  { name: "legacy-bridge", svid: "Valid", mtls: true, lastRotation: "12分前", expires: "22時間後" },
  { name: "resilience-svc", svid: "Valid", mtls: true, lastRotation: "3分前", expires: "23時間後" },
  { name: "llm-proxy", svid: "Rotating", mtls: true, lastRotation: "更新中", expires: "1分後" },
];

const vaultSecrets = [
  { path: "db/postgresql", type: "Dynamic", lastRotated: "2時間前", leases: 14 },
  { path: "api/llm-keys", type: "Dynamic", lastRotated: "30分前", leases: 3 },
  { path: "api/hacobell", type: "Static", lastRotated: "7日前", leases: 1 },
  { path: "api/jma", type: "Static", lastRotated: "30日前", leases: 1 },
  { path: "tls/certificates", type: "PKI", lastRotated: "自動", leases: 24 },
];

export function SecurityPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">セキュリティ</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">Zero Trust Architecture — SPIFFE/SPIRE + HashiCorp Vault</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard icon={<Shield size={20} />} label="SPIRE Status" value="稼働中" sub1="SVIDs: 847" sub2="Agents: 12" color="emerald" status />
        <StatusCard icon={<Lock size={20} />} label="mTLS Coverage" value="100%" sub1="全サービス" sub2="" color="blue" />
        <StatusCard icon={<Key size={20} />} label="Vault Status" value="Sealed: No" sub1="Keys: 3/5" sub2="Tokens: 156" color="cyan" />
        <StatusCard icon={<FileCheck size={20} />} label="OPA Policies" value="24 Active" sub1="0 Violations" sub2="Last: 2分前" color="purple" />
      </div>

      {/* SVID chart */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
        <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">🔐 SVID発行状況 (過去24時間)</h4>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={svidData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
              <XAxis dataKey="hour" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} interval={3} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }} />
              <Line type="monotone" dataKey="issued" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service auth table */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(203,213,225,0.06)]">
          <h4 className="text-[14px] font-[600] text-[#F8FAFC]">📋 サービス認証状態</h4>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(203,213,225,0.08)]">
              {["Service", "SVID Status", "mTLS", "Last Rot.", "Expires"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.name} className="border-b border-[rgba(203,213,225,0.04)] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[13px] text-[#06B6D4] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.name}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] ${s.svid === "Valid" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                    {s.svid === "Valid" ? "✅" : "⚠️"} {s.svid}
                  </span>
                </td>
                <td className="px-5 py-3 text-[12px] text-emerald-400">✅ On</td>
                <td className="px-5 py-3 text-[12px] text-[#CBD5E1]">{s.lastRotation}</td>
                <td className="px-5 py-3 text-[12px] text-[#CBD5E1]">{s.expires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vault secrets */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(203,213,225,0.06)]">
          <h4 className="text-[14px] font-[600] text-[#F8FAFC]">🔑 Vault Secrets Status</h4>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(203,213,225,0.08)]">
              {["Secret Path", "Type", "Last Rotated", "Leases Active"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vaultSecrets.map((s) => (
              <tr key={s.path} className="border-b border-[rgba(203,213,225,0.04)] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[13px] text-[#06B6D4] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.path}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] ${
                    s.type === "Dynamic" ? "bg-blue-500/15 text-blue-400" :
                    s.type === "PKI" ? "bg-purple-500/15 text-purple-400" :
                    "bg-[#64748B]/15 text-[#94A3B8]"
                  }`}>{s.type}</span>
                </td>
                <td className="px-5 py-3 text-[12px] text-[#CBD5E1]">{s.lastRotated}</td>
                <td className="px-5 py-3 text-[12px] text-[#F8FAFC] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{s.leases}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, sub1, sub2, color, status }: {
  icon: React.ReactNode; label: string; value: string; sub1: string; sub2: string; color: string; status?: boolean;
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400" },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-lg p-2 ${c.bg} ${c.text}`}>{icon}</div>
        <span className="text-[13px] text-[#64748B]">{label}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        {status && <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />}
        <span className={`text-[18px] font-[700] ${c.text}`}>{value}</span>
      </div>
      <p className="text-[12px] text-[#94A3B8]">{sub1}</p>
      {sub2 && <p className="text-[11px] text-[#64748B]">{sub2}</p>}
    </div>
  );
}
