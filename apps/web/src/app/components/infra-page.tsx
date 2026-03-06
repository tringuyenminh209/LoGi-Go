import { Server, Cpu, MemoryStick, Clock } from "lucide-react";

const datastores = [
  { name: "PostgreSQL 16", status: "Up", latency: "2.1ms", connections: "42/100", disk: "67%" },
  { name: "Redis 7 Cluster", status: "Up", latency: "0.3ms", connections: "156", disk: "45%" },
  { name: "Firestore", status: "Up", latency: "12ms", connections: "—", disk: "—" },
  { name: "Bigtable", status: "Up", latency: "5ms", connections: "—", disk: "23%" },
];

const meshServices = [
  { from: "api-gateway", to: "match-svc", status: "ok" },
  { from: "api-gateway", to: "ingest-svc", status: "ok" },
  { from: "match-svc", to: "redis", status: "ok" },
  { from: "match-svc", to: "resilience-svc", status: "ok" },
  { from: "resilience-svc", to: "jma-ws", status: "ok" },
  { from: "ingest-svc", to: "postgresql", status: "ok" },
  { from: "resilience-svc", to: "legacy-bridge", status: "ok" },
  { from: "legacy-bridge", to: "llm-proxy", status: "ok" },
  { from: "legacy-bridge", to: "ocr-worker", status: "ok" },
  { from: "llm-proxy", to: "gemini", status: "ok" },
  { from: "ocr-worker", to: "gcs", status: "ok" },
];

const serviceNodes: Record<string, { x: number; y: number; color: string }> = {
  "api-gateway": { x: 80, y: 50, color: "#2563EB" },
  "match-svc": { x: 280, y: 30, color: "#10B981" },
  "ingest-svc": { x: 80, y: 150, color: "#06B6D4" },
  "redis": { x: 480, y: 30, color: "#EF4444" },
  "resilience-svc": { x: 280, y: 110, color: "#F59E0B" },
  "jma-ws": { x: 480, y: 110, color: "#64748B" },
  "legacy-bridge": { x: 280, y: 190, color: "#8B5CF6" },
  "llm-proxy": { x: 480, y: 170, color: "#F59E0B" },
  "gemini": { x: 640, y: 170, color: "#64748B" },
  "ocr-worker": { x: 280, y: 260, color: "#8B5CF6" },
  "gcs": { x: 480, y: 260, color: "#64748B" },
  "postgresql": { x: 80, y: 260, color: "#2563EB" },
};

export function InfraPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">インフラ監視</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">GKE Cluster: tokyo-prod-1 · Region: asia-northeast1</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfraCard icon={<Server size={20} />} label="Pods" value="47/47" sub="Running" color="emerald" badge="✅" />
        <InfraCard icon={<Cpu size={20} />} label="CPU" value="34%" sub="" color="blue" bar={34} />
        <InfraCard icon={<MemoryStick size={20} />} label="Memory" value="62%" sub="" color="cyan" bar={62} />
        <InfraCard icon={<Clock size={20} />} label="Uptime" value="99.97%" sub="30日間" color="purple" />
      </div>

      {/* Datastores */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(203,213,225,0.06)]">
          <h4 className="text-[14px] font-[600] text-[#F8FAFC]">🗄️ データストア</h4>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(203,213,225,0.08)]">
              {["Store", "Status", "Latency", "Conn.", "Disk"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datastores.map((d) => (
              <tr key={d.name} className="border-b border-[rgba(203,213,225,0.04)] hover:bg-white/[0.02]">
                <td className="px-5 py-3 text-[13px] text-[#F8FAFC]">{d.name}</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] bg-emerald-500/15 text-emerald-400">✅ {d.status}</span>
                </td>
                <td className="px-5 py-3 text-[12px] text-[#06B6D4] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.latency}</td>
                <td className="px-5 py-3 text-[12px] text-[#CBD5E1] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{d.connections}</td>
                <td className="px-5 py-3 text-[12px] text-[#CBD5E1]">{d.disk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Service mesh diagram */}
      <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
        <h4 className="text-[14px] font-[600] text-[#F8FAFC] mb-4">📡 サービスメッシュ (Istio)</h4>
        <div className="overflow-x-auto">
          <svg width="720" height="300" viewBox="0 0 720 300" className="min-w-[720px]">
            {/* Connections */}
            {meshServices.map((s, i) => {
              const from = serviceNodes[s.from];
              const to = serviceNodes[s.to];
              if (!from || !to) return null;
              return (
                <line
                  key={i}
                  x1={from.x + 40}
                  y1={from.y + 14}
                  x2={to.x}
                  y2={to.y + 14}
                  stroke="#2563EB"
                  strokeWidth={1.5}
                  strokeOpacity={0.3}
                  strokeDasharray="4 3"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            {/* Arrow marker */}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#2563EB" fillOpacity={0.5} />
              </marker>
            </defs>
            {/* Nodes */}
            {Object.entries(serviceNodes).map(([name, node]) => (
              <g key={name}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={name.length * 9 + 20}
                  height={28}
                  rx={6}
                  fill={`${node.color}15`}
                  stroke={`${node.color}40`}
                  strokeWidth={1}
                />
                <circle cx={node.x + 10} cy={node.y + 14} r={3} fill="#10B981" />
                <text
                  x={node.x + 18}
                  y={node.y + 18}
                  fill="#CBD5E1"
                  fontSize={11}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {name}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

function InfraCard({ icon, label, value, sub, color, bar, badge }: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string; bar?: number; badge?: string;
}) {
  const colors: Record<string, { bg: string; border: string; text: string; fill: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", fill: "#10B981" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", fill: "#2563EB" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", fill: "#06B6D4" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", fill: "#8B5CF6" },
  };
  const c = colors[color];
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`rounded-lg p-2 ${c.bg} ${c.text}`}>{icon}</div>
        <span className="text-[13px] text-[#64748B]">{label}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[20px] font-[700] ${c.text}`}>{value}</span>
        {badge && <span className="text-[12px]">{badge}</span>}
      </div>
      {bar !== undefined && (
        <div className="h-1.5 rounded-full bg-[#0A1628] overflow-hidden mt-2">
          <div className="h-full rounded-full" style={{ width: `${bar}%`, background: c.fill }} />
        </div>
      )}
      {sub && <p className="text-[12px] text-[#94A3B8] mt-1">{sub}</p>}
    </div>
  );
}
