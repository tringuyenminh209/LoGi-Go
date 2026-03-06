import { ScrollArea } from "./ui/scroll-area";

const activities = [
  { time: "14:32:05", color: "bg-emerald-400", icon: "🟢", text: "マッチ成功: 大阪→東京 (トラック XY-1234)", type: "success" },
  { time: "14:31:48", color: "bg-purple-400", icon: "🟣", text: "OCR完了: FAX #2847 → 配送指示作成 (信頼度 99.5%)", type: "ocr" },
  { time: "14:31:22", color: "bg-blue-400", icon: "🔵", text: "新規配送依頼: 福岡→大阪 (3.5t、冷蔵)", type: "new" },
  { time: "14:30:55", color: "bg-amber-400", icon: "🟡", text: "ネゴシエーション中: マッチ #8472 (残り 12:35)", type: "pending" },
  { time: "14:30:01", color: "bg-red-400", icon: "🔴", text: "⚠️ JMA: 震度3 千葉県沖 (影響なし)", type: "alert" },
  { time: "14:29:45", color: "bg-emerald-400", icon: "🟢", text: "配達完了: #LG-2831 名古屋→横浜", type: "success" },
  { time: "14:29:12", color: "bg-blue-400", icon: "🔵", text: "ドライバー登録: 佐藤一郎 (関東エリア)", type: "new" },
  { time: "14:28:33", color: "bg-purple-400", icon: "🟣", text: "OCR処理中: FAX #2848 (Stage 2 - Multi-pass)", type: "ocr" },
  { time: "14:27:55", color: "bg-emerald-400", icon: "🟢", text: "マッチ成功: 横浜→仙台 (トラック AB-5678)", type: "success" },
  { time: "14:27:10", color: "bg-amber-400", icon: "🟡", text: "積載率更新: 関西エリア 91.2% (+2.1%)", type: "pending" },
  { time: "14:26:45", color: "bg-cyan-400", icon: "🔵", text: "GPS更新: 348台のトラック位置更新", type: "new" },
  { time: "14:25:30", color: "bg-emerald-400", icon: "🟢", text: "配達完了: #LG-2829 東京→大阪", type: "success" },
];

export function ActivityFeed() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[15px] font-[600] text-[#F8FAFC]">アクティビティ</h3>
        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[11px] text-blue-400">LIVE</span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 pr-3">
          {activities.map((a, i) => (
            <div key={i} className="group flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5">
              <div className="flex flex-col items-center">
                <div className={`mt-1.5 h-2 w-2 rounded-full ${a.color}`} />
                {i < activities.length - 1 && <div className="mt-1 h-full w-px bg-[rgba(203,213,225,0.08)]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#CBD5E1] truncate">{a.text}</p>
                <span className="text-[11px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{a.time}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
