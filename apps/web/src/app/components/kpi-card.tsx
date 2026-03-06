import { useEffect, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion, useInView, useMotionValue, useTransform, animate } from "motion/react";

interface KpiCardProps {
  title: string;
  value: string;
  numericValue: number;
  trend: string;
  trendUp: boolean;
  color: string;
  icon: React.ReactNode;
  sparkData: number[];
  suffix?: string;
}

function AnimatedCounter({ value, suffix, className, style }: { value: number; suffix?: string; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (latest) => {
    if (latest >= 1000) {
      return Math.round(latest).toLocaleString();
    }
    return Math.round(latest).toString();
  });

  useEffect(() => {
    if (isInView) {
      animate(motionVal, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    }
  }, [isInView, value, motionVal]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => {
      if (ref.current) {
        ref.current.textContent = v + (suffix || "");
      }
    });
    return unsub;
  }, [rounded, suffix]);

  return <span ref={ref} className={className} style={style}>0{suffix || ""}</span>;
}

export function KpiCard({ title, numericValue, trend, trendUp, color, icon, sparkData, suffix }: KpiCardProps) {
  const colorMap: Record<string, { bg: string; border: string; text: string; fill: string; stroke: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", fill: "#10B981", stroke: "#10B981" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", fill: "#06B6D4", stroke: "#06B6D4" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-400", fill: "#2563EB", stroke: "#2563EB" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", fill: "#8B5CF6", stroke: "#8B5CF6" },
  };

  const c = colorMap[color] || colorMap.blue;
  const data = sparkData.map((v, i) => ({ v, i }));

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${c.border} ${c.bg} p-5 backdrop-blur-sm transition-all hover:scale-[1.02]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
            className={`rounded-lg p-2 ${c.bg} ${c.text}`}
          >
            {icon}
          </motion.div>
          <span className="text-[13px] text-[#64748B]">{title}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className={`flex items-center gap-1 text-[12px] ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend}
        </motion.div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <AnimatedCounter
          value={numericValue}
          suffix={suffix}
          className={`text-[32px] font-[700] tracking-tight ${c.text}`}
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "right" }}
          className="h-[40px] w-[100px] min-w-[100px]"
        >
          <ResponsiveContainer width={100} height={40}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c.fill} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={c.fill} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={c.stroke} strokeWidth={2} fill={`url(#grad-${color})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}