import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";

const loadFactorData = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  value: Math.round((72 + Math.random() * 20) * 10) / 10,
  _key: `lf-${i}`,
}));

const throughputData = [
  { day: "月", Ingest: 420, OCR: 380, Match: 350, EPCIS: 310, _key: "tp-0" },
  { day: "火", Ingest: 460, OCR: 410, Match: 390, EPCIS: 340, _key: "tp-1" },
  { day: "水", Ingest: 480, OCR: 430, Match: 410, EPCIS: 360, _key: "tp-2" },
  { day: "木", Ingest: 510, OCR: 450, Match: 430, EPCIS: 380, _key: "tp-3" },
  { day: "金", Ingest: 490, OCR: 440, Match: 420, EPCIS: 370, _key: "tp-4" },
  { day: "土", Ingest: 320, OCR: 280, Match: 260, EPCIS: 230, _key: "tp-5" },
  { day: "日", Ingest: 280, OCR: 250, Match: 230, EPCIS: 200, _key: "tp-6" },
];

export function LoadFactorChart() {
  return (
    <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-[600] text-[#F8FAFC]">積載率推移</h3>
        <span className="text-[12px] text-[#64748B]">過去30日</span>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={loadFactorData}>
            <defs>
              <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
            <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis domain={[60, 100]} stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }}
              formatter={(v: number) => [`${v.toFixed(1)}%`, '積載率']}
            />
            <ReferenceLine y={89} stroke="#10B981" strokeDasharray="5 5" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fill="url(#loadGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ThroughputChart() {
  return (
    <div className="rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-[600] text-[#F8FAFC]">モジュール別処理量</h3>
        <span className="text-[12px] text-[#64748B]">今週</span>
      </div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={throughputData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(203,213,225,0.06)" />
            <XAxis dataKey="day" stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748B" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1E3A5F', border: 'none', borderRadius: 8, fontSize: 12, color: '#F8FAFC' }}
            />
            <Bar dataKey="Ingest" fill="#2563EB" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar dataKey="OCR" fill="#8B5CF6" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar dataKey="Match" fill="#06B6D4" radius={[2, 2, 0, 0]} barSize={12} />
            <Bar dataKey="EPCIS" fill="#10B981" radius={[2, 2, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center justify-center gap-5">
        {[
          { label: "Ingest", color: "#2563EB" },
          { label: "OCR", color: "#8B5CF6" },
          { label: "Match", color: "#06B6D4" },
          { label: "EPCIS", color: "#10B981" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: l.color }} />
            <span className="text-[11px] text-[#64748B]">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}