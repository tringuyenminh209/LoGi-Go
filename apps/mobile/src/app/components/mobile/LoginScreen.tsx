import { Truck, Eye, EyeOff, Fingerprint } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }
    setError("");
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      onLogin();
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A1628" }}>
      {/* Top gradient decoration */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(37, 99, 235, 0.2) 0%, rgba(6, 182, 212, 0.08) 40%, transparent 70%)",
        }}
      />

      <div className="flex-1 flex flex-col justify-center px-8 relative z-10">
        {/* Logo & Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <div className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563EB, #06B6D4)" }}>
            <Truck size={40} className="text-white" />
          </div>
          <h1 className="text-white text-[28px] mb-1" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
            Logi-Go
          </h1>
          <p className="text-slate-400 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            ドライバーアプリ
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          {/* Email */}
          <div>
            <label className="text-slate-400 text-[12px] mb-1.5 block" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="driver@logi-go.jp"
              className="w-full px-4 py-3.5 rounded-xl text-white text-[15px] outline-none transition-all focus:ring-2 focus:ring-[#2563EB]/50"
              style={{
                background: "rgba(15, 23, 42, 0.8)",
                border: "1px solid rgba(51, 65, 85, 0.5)",
                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-slate-400 text-[12px] mb-1.5 block" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              パスワード
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 rounded-xl text-white text-[15px] outline-none pr-12 transition-all focus:ring-2 focus:ring-[#2563EB]/50"
                style={{
                  background: "rgba(15, 23, 42, 0.8)",
                  border: "1px solid rgba(51, 65, 85, 0.5)",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#EF4444] text-[13px] text-center"
              style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
            >
              {error}
            </motion.p>
          )}

          {/* Forgot Password */}
          <div className="text-right">
            <button className="text-[#2563EB] text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
              パスワードをお忘れですか？
            </button>
          </div>

          {/* Login Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-4 rounded-xl text-white text-[16px] flex items-center justify-center gap-2 disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #2563EB, #06B6D4)",
              fontFamily: "'Noto Sans JP', sans-serif",
              fontWeight: 600,
            }}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              "ログイン"
            )}
          </motion.button>

          {/* Biometric Login */}
          <button
            onClick={onLogin}
            className="w-full py-3.5 rounded-xl text-slate-300 text-[14px] flex items-center justify-center gap-2 border border-slate-700/50"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            <Fingerprint size={20} className="text-[#06B6D4]" />
            生体認証でログイン
          </button>
        </motion.div>

        {/* Demo hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <p className="text-slate-500 text-[12px] mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
            デモ用：任意の入力でログイン可能
          </p>
          <button
            onClick={() => {
              setEmail("tanaka@logi-go.jp");
              setPassword("demo1234");
            }}
            className="text-[#06B6D4] text-[12px] px-3 py-1 rounded-full border border-[#06B6D4]/30"
            style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            デモ情報を入力
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="pb-8 text-center">
        <p className="text-slate-600 text-[11px]" style={{ fontFamily: "'Inter', sans-serif" }}>
          © 2026 Logi-Go Inc. v2.4.1
        </p>
      </div>
    </div>
  );
}
