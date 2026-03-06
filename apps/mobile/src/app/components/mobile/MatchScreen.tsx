import { ArrowLeft, MapPin, Clock, Leaf, Weight, CircleDollarSign, Timer, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { MiniRouteMap } from "./LeafletMap";
import { useMatchProposals, type MatchProposal } from "../../hooks/useDomain";
import { apiFetch } from "../../hooks/useApi";
import { useAuth } from "../../context/AuthContext";

interface MatchScreenProps {
  onBack: () => void;
}

// Approximate coordinates for Japanese cities used in mock data
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "大阪": { lat: 34.6937, lng: 135.5023 },
  "東京": { lat: 35.6585, lng: 139.7454 },
  "神戸": { lat: 34.6901, lng: 135.1956 },
  "名古屋": { lat: 35.1815, lng: 136.9066 },
  "京都": { lat: 35.0116, lng: 135.7681 },
  "横浜": { lat: 35.4437, lng: 139.6380 },
  "福岡": { lat: 33.5904, lng: 130.4017 },
  "広島": { lat: 34.3963, lng: 132.4596 },
  "仙台": { lat: 38.2682, lng: 140.8694 },
  "札幌": { lat: 43.0618, lng: 141.3545 },
};

function coordsForAddress(address: string): { lat: number; lng: number } {
  for (const [city, coord] of Object.entries(CITY_COORDS)) {
    if (address.includes(city)) return coord;
  }
  return { lat: 35.6585, lng: 139.7454 }; // Tokyo default
}

function secondsUntil(iso: string): number {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [seconds, setSeconds] = useState(() => secondsUntil(expiresAt));

  // Tick every second
  useState(() => {
    const iv = setInterval(() => setSeconds(secondsUntil(expiresAt)), 1000);
    return () => clearInterval(iv);
  });

  const total = Math.max(1, Math.floor((new Date(expiresAt).getTime() - Date.now() + seconds * 1000) / 1000 + seconds));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const progress = total > 0 ? seconds / total : 0;

  return (
    <div className="flex items-center gap-2">
      <Timer size={16} className={seconds < 120 ? "text-[#EF4444]" : "text-[#F59E0B]"} />
      <span className={`text-[14px] ${seconds < 120 ? "text-[#EF4444]" : "text-[#F59E0B]"}`} style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: seconds < 120 ? "#EF4444" : "#F59E0B", width: `${progress * 100}%` }} animate={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 0.9 ? "#10B981" : score >= 0.8 ? "#2563EB" : "#F59E0B";
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>マッチスコア</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-700/50 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-white text-[14px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, color }}>{score.toFixed(2)}</span>
    </div>
  );
}

interface DeclinedInfo { matchId: string }

export function MatchScreen({ onBack }: MatchScreenProps) {
  const { token, refreshToken } = useAuth();
  const { data: proposals, loading, refetch } = useMatchProposals();
  const [expandedId, setExpandedId] = useState<string>("");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [declined, setDeclined] = useState<DeclinedInfo | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const visible = (proposals ?? []).filter((p) => !hiddenIds.has(p.match_id));

  // Auto-expand first card when proposals load
  if (visible.length > 0 && !expandedId) {
    setExpandedId(visible[0].match_id);
  }

  const handleAccept = async (proposal: MatchProposal) => {
    setActionLoading(proposal.match_id);
    try {
      await apiFetch(`/api/v1/match/${proposal.match_id}/accept`, token, refreshToken, { method: "POST" });
      setHiddenIds((prev) => new Set([...prev, proposal.match_id]));
      setExpandedId("");
      refetch();
      onBack();
    } catch {
      // stay on screen, let user try again
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (proposal: MatchProposal) => {
    setActionLoading(proposal.match_id);
    try {
      await apiFetch(`/api/v1/match/${proposal.match_id}/decline`, token, refreshToken, { method: "POST" });
    } catch { /* ignore */ }
    setHiddenIds((prev) => new Set([...prev, proposal.match_id]));
    setDeclined({ matchId: proposal.match_id });
    setExpandedId("");
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4 border-b border-slate-700/30">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-white" />
        </button>
        <h1 className="text-white text-[18px]" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}>新規マッチリクエスト</h1>
        <span className="ml-auto bg-[#EF4444] text-white text-[12px] px-2.5 py-0.5 rounded-full" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
          {visible.length}件
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>読込中...</span>
        </div>
      )}

      {/* Declined Toast */}
      <AnimatePresence>
        {declined && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="mx-5 mt-4 rounded-xl border border-slate-700/40 p-4"
            style={{ background: "rgba(15, 23, 42, 0.9)" }}
          >
            <div className="flex items-start gap-3">
              <XCircle size={20} className="text-slate-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="text-white text-[14px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                  マッチを辞退しました
                </div>
                <p className="text-slate-400 text-[13px] mb-2" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                  このリクエストは次の候補ドライバーに提案されます。
                </p>
                <button
                  onClick={() => { setDeclined(null); onBack(); }}
                  className="px-4 py-2 rounded-lg text-[13px] text-white"
                  style={{ background: "rgba(37, 99, 235, 0.2)", border: "1px solid rgba(37, 99, 235, 0.3)", fontFamily: "'Noto Sans JP', sans-serif" }}
                >
                  ホームに戻る
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match Cards */}
      {!loading && (
        <div className="px-5 mt-4 space-y-4">
          <AnimatePresence>
            {visible.map((proposal, i) => {
              const fromCoord = coordsForAddress(proposal.shipment.pickup.name);
              const toCoord = coordsForAddress(proposal.shipment.dropoff.name);
              const isExpanded = expandedId === proposal.match_id;
              const isBusy = actionLoading === proposal.match_id;

              return (
                <motion.div
                  key={proposal.match_id}
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  layout
                  className="rounded-2xl border border-slate-700/40 overflow-hidden"
                  style={{ background: "rgba(15, 23, 42, 0.9)" }}
                >
                  {/* Card Header */}
                  <button onClick={() => setExpandedId(isExpanded ? "" : proposal.match_id)} className="w-full p-4 text-left">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#2563EB] text-[12px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
                        #{proposal.match_id.slice(0, 8)}
                      </span>
                      <span className="text-[#10B981] text-[11px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16, 185, 129, 0.15)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}>
                        🆕 新規
                      </span>
                    </div>

                    {/* Route */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex flex-col items-center mt-1">
                        <div className="w-3 h-3 rounded-full border-2 border-[#2563EB] bg-transparent" />
                        <div className="w-0.5 h-6 bg-slate-600" />
                        <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                      </div>
                      <div className="flex-1">
                        <div className="text-white text-[15px] mb-1" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          <MapPin size={13} className="inline text-[#2563EB] mr-1" />{proposal.shipment.pickup.name}
                        </div>
                        <div className="text-white text-[15px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          <MapPin size={13} className="inline text-[#EF4444] mr-1" />{proposal.shipment.dropoff.name}
                        </div>
                      </div>
                    </div>

                    <ScoreBar score={proposal.score} />
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} transition={{ duration: 0.3 }}
                      className="px-4 pb-4"
                    >
                      <div className="border-t border-slate-700/30 pt-4">
                        {/* Route Map */}
                        <div className="mb-4">
                          <MiniRouteMap
                            from={{ ...fromCoord, label: proposal.shipment.pickup.name }}
                            to={{ ...toCoord, label: proposal.shipment.dropoff.name }}
                            height="140px"
                          />
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                            <Weight size={16} className="text-slate-400" />
                            <div>
                              <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>品名</div>
                              <div className="text-white text-[13px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                                {proposal.shipment.cargo_desc ?? proposal.shipment.cargo_type}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                            <Weight size={16} className="text-slate-400" />
                            <div>
                              <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>重量</div>
                              <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                                {proposal.shipment.weight_kg.toLocaleString()} kg
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                            <Clock size={16} className="text-slate-400" />
                            <div>
                              <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>集荷期限</div>
                              <div className="text-white text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                                {new Date(proposal.expires_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                              </div>
                            </div>
                          </div>
                          {proposal.co2_reduction_kg != null && (
                            <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2.5">
                              <Leaf size={16} className="text-[#10B981]" />
                              <div>
                                <div className="text-slate-400 text-[11px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>CO₂削減</div>
                                <div className="text-[#10B981] text-[13px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
                                  {proposal.co2_reduction_kg.toFixed(1)} kg
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {proposal.shipment.notes && (
                          <div className="mb-4 rounded-lg px-3 py-2.5 border border-slate-700/30" style={{ background: "rgba(245, 158, 11, 0.05)" }}>
                            <p className="text-slate-400 text-[12px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                              ⚠️ {proposal.shipment.notes}
                            </p>
                          </div>
                        )}

                        {/* Reward */}
                        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 mb-4">
                          <div className="flex items-center gap-2">
                            <CircleDollarSign size={20} className="text-[#F59E0B]" />
                            <span className="text-slate-300 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>報酬</span>
                          </div>
                          <span className="text-[#F59E0B] text-[20px]" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700 }}>
                            ¥{(proposal.estimated_earnings_jpy ?? proposal.shipment.fee_jpy ?? 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Countdown */}
                        <div className="mb-5">
                          <CountdownTimer expiresAt={proposal.expires_at} />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAccept(proposal)}
                            disabled={isBusy}
                            className="flex-1 py-3.5 rounded-xl text-white text-[15px] flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ background: "linear-gradient(135deg, #059669, #10B981)", fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
                          >
                            {isBusy ? <Loader2 size={16} className="animate-spin" /> : "✅"} 承認
                          </button>
                          <button
                            onClick={() => handleDecline(proposal)}
                            disabled={isBusy}
                            className="flex-1 py-3.5 rounded-xl text-slate-300 text-[15px] border border-slate-600 flex items-center justify-center gap-2 disabled:opacity-60"
                            style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
                          >
                            ❌ 辞退
                          </button>
                        </div>

                        <p className="text-slate-500 text-[11px] text-center mt-3" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>
                          辞退すると次の候補ドライバーに提案されます
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visible.length === 0 && !loading && !declined && (
            <div className="text-center py-20">
              <CheckCircle2 size={40} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-[14px]" style={{ fontFamily: "'Noto Sans JP', sans-serif" }}>新着マッチはありません</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
