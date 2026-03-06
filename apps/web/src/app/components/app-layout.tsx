import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  LayoutDashboard, Truck, FileText, Map, Package, AlertTriangle,
  BarChart3, Link2, Settings, ChevronLeft, ChevronRight, User, Search,
  Leaf, Shield, Server, LogOut, ChevronDown
} from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { AnimatedOutlet } from "./animated-outlet";
import { useAuth } from "./auth-context";
import { NotificationBell } from "./notification-dropdown";

const navItems = [
  { path: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { path: "/matching", label: "マッチング", icon: Truck },
  { path: "/legacy-bridge", label: "レガシーブリッジ", icon: FileText },
  { path: "/map", label: "リアルタイムマップ", icon: Map },
  { path: "/shipments", label: "配送管理", icon: Package },
  { path: "/disaster", label: "災害対策", icon: AlertTriangle },
  { path: "/analytics", label: "分析", icon: BarChart3 },
  { path: "/carbon", label: "カーボン", icon: Leaf },
  { path: "/integrations", label: "インテグレーション", icon: Link2 },
  { path: "/security", label: "セキュリティ", icon: Shield },
  { path: "/infra", label: "インフラ", icon: Server },
  { path: "/settings", label: "設定", icon: Settings },
];

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const profileRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleProfile = useCallback(() => {
    if (!profileOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
    setProfileOpen((v) => !v);
  }, [profileOpen]);

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A1628]">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-[rgba(203,213,225,0.06)] bg-[#0D1B2E] transition-all duration-200 shrink-0"
        style={{ width: collapsed ? 64 : 240 }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-4 border-b border-[rgba(203,213,225,0.06)]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#06B6D4]">
            <span className="text-[14px] font-[800] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>L</span>
          </div>
          {!collapsed && (
            <div>
              <span className="text-[16px] font-[700] text-[#F8FAFC]" style={{ fontFamily: "'Inter', sans-serif" }}>Logi-Go</span>
              <p className="text-[9px] text-[#64748B] -mt-0.5">物流ミドルウェア</p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all ${
                    isActive
                      ? "bg-[#2563EB]/10 text-[#2563EB]"
                      : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon size={20} className="shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {isActive && !collapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
                  )}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Collapse button */}
        <div className="border-t border-[rgba(203,213,225,0.06)] p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg py-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-white/[0.03] transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-[rgba(203,213,225,0.06)] bg-[#0D1B2E]/50 px-6 backdrop-blur-sm shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-[#111D32] border border-[rgba(203,213,225,0.08)] px-3 py-1.5 w-[280px]">
              <Search size={16} className="text-[#64748B]" />
              <input
                className="bg-transparent text-[13px] text-[#F8FAFC] outline-none w-full placeholder:text-[#64748B]"
                placeholder="検索... (⌘K)"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-emerald-400">LIVE</span>
            </div>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile */}
            <div
              className="relative"
              ref={profileRef}
            >
              <button
                ref={btnRef}
                onClick={toggleProfile}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#8B5CF6]">
                  <User size={14} className="text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-[12px] text-[#F8FAFC] block">{user?.roleLabel ?? "管理者"}</span>
                  <span className="text-[10px] text-[#64748B] block -mt-0.5">{user?.email ?? "admin@logi-go.jp"}</span>
                </div>
                <ChevronDown size={14} className={`text-[#64748B] transition-transform ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div
                  className="fixed w-[220px] rounded-xl border border-[rgba(203,213,225,0.08)] bg-[#111D32] py-1 shadow-2xl z-[9999]"
                  style={{ top: dropdownPos.top, right: dropdownPos.right }}
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-[rgba(203,213,225,0.06)]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#8B5CF6]">
                        <User size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[13px] text-[#F8FAFC]">{user?.roleLabel ?? "管理者"}</p>
                        <p className="text-[11px] text-[#64748B]">{user?.email ?? "admin@logi-go.jp"}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex items-center rounded-full bg-[#2563EB]/10 px-2.5 py-0.5 text-[10px] text-[#2563EB]">
                        {user?.role?.toUpperCase() ?? "ADMIN"}
                      </span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-[#CBD5E1] hover:bg-white/[0.03] transition-colors"
                    >
                      <Settings size={15} className="text-[#64748B]" />
                      アカウント設定
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[rgba(203,213,225,0.06)] py-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-[13px] text-[#EF4444] hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut size={15} />
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <ScrollArea className="flex-1 relative z-0">
          <AnimatedOutlet />
        </ScrollArea>
      </div>
    </div>
  );
}