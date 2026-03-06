import { useState } from "react";
import { useNavigate, Navigate } from "react-router";
import { motion } from "motion/react";
import { Eye, EyeOff, ChevronDown } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useAuth } from "./auth-context";

const roles = [
  { value: "admin", label: "管理者", description: "全機能アクセス" },
  { value: "operator", label: "オペレーター", description: "配車・マッチング操作" },
  { value: "reviewer", label: "確認担当者", description: "OCRレビューのみ" },
  { value: "viewer", label: "閲覧者", description: "読み取り専用" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("admin");
  const [roleOpen, setRoleOpen] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Already logged in → redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setTimeout(() => {
      if (email === "admin@logi-go.jp" && password === "demo1234") {
        const selectedRole = roles.find(r => r.value === role)!;
        login({ email, role, roleLabel: selectedRole.label });
        navigate("/");
      } else {
        setError(true);
        setLoading(false);
        toast.error("メールアドレスまたはパスワードが正しくありません");
      }
    }, 800);
  };

  const fillDemo = () => {
    setEmail("admin@logi-go.jp");
    setPassword("demo1234");
    setRole("admin");
    setError(false);
  };

  const selectedRole = roles.find(r => r.value === role)!;

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#0A1628] overflow-hidden">
      <Toaster position="top-center" theme="dark" />

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-1/2 -left-1/2 h-[200%] w-[200%]"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-[#2563EB] opacity-[0.04] blur-[120px]" />
          <div className="absolute top-1/2 right-1/4 h-[400px] w-[400px] rounded-full bg-[#06B6D4] opacity-[0.03] blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/3 h-[350px] w-[350px] rounded-full bg-[#8B5CF6] opacity-[0.03] blur-[100px]" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div className="rounded-2xl border border-[rgba(203,213,225,0.06)] bg-[#111D32] p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#06B6D4]">
              <span className="text-[18px] font-[800] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>L</span>
            </div>
            <div>
              <span className="text-[20px] font-[700] text-[#F8FAFC]" style={{ fontFamily: "'Inter', sans-serif" }}>Logi-Go</span>
              <p className="text-[11px] text-[#64748B] -mt-0.5">物流ミドルウェア 管理画面</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-[#94A3B8]">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(false); }}
                placeholder="admin@logi-go.jp"
                className={`w-full rounded-lg border bg-[#0A1628] px-4 py-2.5 text-[14px] text-[#F8FAFC] outline-none transition-colors placeholder:text-[#475569] focus:border-[#2563EB] ${
                  error ? "border-[#EF4444]" : "border-[rgba(203,213,225,0.1)]"
                }`}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-[#94A3B8]">パスワード</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border bg-[#0A1628] px-4 py-2.5 pr-10 text-[14px] text-[#F8FAFC] outline-none transition-colors placeholder:text-[#475569] focus:border-[#2563EB] ${
                    error ? "border-[#EF4444]" : "border-[rgba(203,213,225,0.1)]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <label className="text-[13px] text-[#94A3B8]">RBAC Role</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setRoleOpen(!roleOpen)}
                  className="flex w-full items-center justify-between rounded-lg border border-[rgba(203,213,225,0.1)] bg-[#0A1628] px-4 py-2.5 text-left outline-none transition-colors focus:border-[#2563EB]"
                >
                  <div>
                    <span className="text-[14px] text-[#F8FAFC]">{selectedRole.label}</span>
                    <span className="text-[11px] text-[#64748B] ml-2">{selectedRole.description}</span>
                  </div>
                  <ChevronDown size={16} className={`text-[#64748B] transition-transform ${roleOpen ? "rotate-180" : ""}`} />
                </button>
                {roleOpen && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-[rgba(203,213,225,0.1)] bg-[#0D1B2E] py-1 shadow-xl">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => { setRole(r.value); setRoleOpen(false); }}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-white/[0.03] ${
                          role === r.value ? "bg-[#2563EB]/10" : ""
                        }`}
                      >
                        <span className="text-[13px] text-[#F8FAFC]">{r.label}</span>
                        <span className="text-[11px] text-[#64748B]">{r.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember(!remember)}
                className="h-4 w-4 rounded border-[rgba(203,213,225,0.2)] bg-[#0A1628] accent-[#2563EB]"
              />
              <span className="text-[13px] text-[#94A3B8]">ログイン状態を保持する</span>
            </label>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#2563EB] to-[#06B6D4] py-3 text-[14px] font-[600] text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:brightness-110 disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white" />
                  ログイン中...
                </span>
              ) : (
                "ログイン"
              )}
            </button>
          </form>

          {/* SSO */}
          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[rgba(203,213,225,0.08)]" />
              <span className="text-[11px] text-[#64748B]">SSO</span>
              <div className="h-px flex-1 bg-[rgba(203,213,225,0.08)]" />
            </div>
            <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[rgba(203,213,225,0.1)] bg-transparent py-2.5 text-[13px] text-[#CBD5E1] transition-colors hover:bg-white/[0.03]">
              <svg width="16" height="16" viewBox="0 0 21 21" fill="none"><path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0z" fill="#F25022" opacity=".01"/><rect x="1" y="1" width="9" height="9" fill="#F25022"/><rect x="11" y="1" width="9" height="9" fill="#7FBA00"/><rect x="1" y="11" width="9" height="9" fill="#00A4EF"/><rect x="11" y="11" width="9" height="9" fill="#FFB900"/></svg>
              Microsoft でログイン
            </button>
            <button className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-[rgba(203,213,225,0.1)] bg-transparent py-2.5 text-[13px] text-[#CBD5E1] transition-colors hover:bg-white/[0.03]">
              <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google でログイン
            </button>
          </div>

          {/* Demo hint */}
          <div className="mt-5 rounded-lg border border-[rgba(203,213,225,0.06)] bg-[#0A1628] p-3">
            <p className="text-[11px] text-[#64748B]">
              デモ用: <span className="text-[#94A3B8]">admin@logi-go.jp</span> / <span className="text-[#94A3B8]">demo1234</span>
            </p>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-1.5 rounded-md bg-[#2563EB]/10 px-3 py-1 text-[11px] text-[#2563EB] hover:bg-[#2563EB]/20 transition-colors"
            >
              デモ情報を入力
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-[11px] text-[#475569]">
          © 2026 Logi-Go Inc. v2.4.1
        </p>
      </motion.div>
    </div>
  );
}