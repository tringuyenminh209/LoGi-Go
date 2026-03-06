import { Truck, Leaf, Zap, FileText } from "lucide-react";
import { KpiCard } from "./kpi-card";
import { ActivityFeed } from "./activity-feed";
import { JapanMapPanel } from "./japan-map-panel";
import { LoadFactorChart, ThroughputChart } from "./dashboard-charts";
import { motion } from "motion/react";

export function DashboardPage() {
  return (
    <div className="space-y-5 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-[#F8FAFC]">ダッシュボード</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">リアルタイムの物流ネットワーク状況</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "積載率", value: "89", numericValue: 89, trend: "+3.2%", trendUp: true, color: "emerald", icon: <Truck size={20} />, sparkData: [72, 75, 78, 80, 82, 85, 89], suffix: "%" },
          { title: "CO₂削減", value: "28", numericValue: 28, trend: "+1.5%", trendUp: true, color: "cyan", icon: <Leaf size={20} />, sparkData: [18, 20, 22, 24, 25, 27, 28], suffix: "%" },
          { title: "マッチング件数", value: "1,247", numericValue: 1247, trend: "+12%", trendUp: true, color: "blue", icon: <Zap size={20} />, sparkData: [980, 1050, 1100, 1150, 1180, 1220, 1247] },
          { title: "OCR処理", value: "523", numericValue: 523, trend: "99.2%", trendUp: true, color: "purple", icon: <FileText size={20} />, sparkData: [410, 430, 460, 480, 500, 510, 523], suffix: "枚" },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Map + Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-5"
      >
        <div className="lg:col-span-3 min-h-[400px]">
          <JapanMapPanel />
        </div>
        <div className="lg:col-span-2 min-h-[400px]">
          <ActivityFeed />
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <LoadFactorChart />
        <ThroughputChart />
      </motion.div>
    </div>
  );
}