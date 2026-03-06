import { useState } from "react";
import { Globe, Users, Key, Shield, Cog } from "lucide-react";

const sections = [
  { id: "general", label: "一般設定", icon: Globe },
  { id: "users", label: "ユーザー管理", icon: Users },
  { id: "api", label: "API管理", icon: Key },
  { id: "security", label: "セキュリティ", icon: Shield },
  { id: "modules", label: "モジュール設定", icon: Cog },
];

const users = [
  { name: "田中太郎", email: "tanaka@example.com", role: "システム管理者", status: "アクティブ" },
  { name: "佐藤花子", email: "sato@example.com", role: "配車担当者", status: "アクティブ" },
  { name: "鈴木一郎", email: "suzuki@example.com", role: "確認担当者", status: "アクティブ" },
  { name: "山田次郎", email: "yamada@example.com", role: "荷主", status: "招待中" },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState("general");

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-[#F8FAFC]">設定</h2>
        <p className="mt-1 text-[13px] text-[#64748B]">システム設定・ユーザー管理・セキュリティ</p>
      </div>

      <div className="flex gap-5">
        {/* Settings nav */}
        <div className="w-[200px] shrink-0 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                activeSection === s.id
                  ? 'bg-[#2563EB]/10 text-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.02]'
              }`}
            >
              <s.icon size={16} />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] p-6">
          {activeSection === "general" && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-[16px] font-[600] text-[#F8FAFC]">一般設定</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[13px] text-[#CBD5E1]">言語</label>
                  <select className="w-full rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.08)] px-3 py-2.5 text-[13px] text-[#F8FAFC] outline-none">
                    <option>日本語</option>
                    <option>English</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] text-[#CBD5E1]">タイムゾーン</label>
                  <select className="w-full rounded-lg bg-[#162236] border border-[rgba(203,213,225,0.08)] px-3 py-2.5 text-[13px] text-[#F8FAFC] outline-none">
                    <option>Asia/Tokyo (JST, UTC+9)</option>
                    <option>UTC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] text-[#CBD5E1]">通知設定</label>
                  <div className="space-y-2">
                    {["マッチング通知", "OCR処理完了", "地震警報", "システムアラート"].map((n) => (
                      <div key={n} className="flex items-center justify-between rounded-lg bg-[#0D1B2E] p-3">
                        <span className="text-[13px] text-[#CBD5E1]">{n}</span>
                        <div className="h-5 w-9 rounded-full bg-[#2563EB] relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-6 py-2.5 text-[13px] transition-colors">
                保存
              </button>
            </div>
          )}

          {activeSection === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-[600] text-[#F8FAFC]">ユーザー管理</h3>
                <button className="rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 text-[13px]">
                  + ユーザー招待
                </button>
              </div>
              <div className="rounded-lg overflow-hidden border border-[rgba(203,213,225,0.06)]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#0D1B2E]">
                      {["名前", "メール", "ロール", "状態"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-[600] uppercase tracking-wider text-[#64748B]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.email} className="border-t border-[rgba(203,213,225,0.04)]">
                        <td className="px-4 py-3 text-[13px] text-[#F8FAFC]">{u.name}</td>
                        <td className="px-4 py-3 text-[13px] text-[#CBD5E1]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[11px] text-blue-400">{u.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${
                            u.status === 'アクティブ' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                          }`}>{u.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSection === "api" && (
            <div className="space-y-4">
              <h3 className="text-[16px] font-[600] text-[#F8FAFC]">API管理</h3>
              <div className="rounded-lg bg-[#0D1B2E] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#CBD5E1]">API Key</span>
                  <span className="text-[12px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>lg_sk_••••••••••••••••</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#CBD5E1]">Rate Limit</span>
                  <span className="text-[12px] text-[#F8FAFC]">10,000 req/min</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#CBD5E1]">Webhook URL</span>
                  <span className="text-[12px] text-[#64748B] font-mono" style={{ fontFamily: "'JetBrains Mono', monospace" }}>https://api.logi-go.jp/webhooks</span>
                </div>
              </div>
            </div>
          )}

          {(activeSection === "security" || activeSection === "modules") && (
            <div className="text-center py-12">
              <p className="text-[#64748B] text-[14px]">{sections.find(s => s.id === activeSection)?.label} — 準備中</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
