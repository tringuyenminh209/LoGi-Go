import {
  AlertTriangle, FileText, Truck, Package, Link2, Shield, Settings,
  type LucideIcon,
} from "lucide-react";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: "critical" | "warning" | "info";
  read: boolean;
  title: string;
  body: string;
  details: string;
  time: string;
  module: string;
  actionLabel: string;
  actionPath: string;
}

export type NotificationType =
  | "disaster"
  | "ocr"
  | "match"
  | "delivery"
  | "integration"
  | "security"
  | "system";

export interface TypeConfig {
  icon: LucideIcon;
  color: string;
  label: string;
}

export const notificationTypeConfig: Record<NotificationType, TypeConfig> = {
  disaster:    { icon: AlertTriangle, color: "#EF4444", label: "緊急" },
  ocr:         { icon: FileText,      color: "#F59E0B", label: "OCR" },
  match:       { icon: Truck,         color: "#10B981", label: "マッチ" },
  delivery:    { icon: Package,       color: "#10B981", label: "配送" },
  integration: { icon: Link2,         color: "#2563EB", label: "連携" },
  security:    { icon: Shield,        color: "#8B5CF6", label: "セキュリティ" },
  system:      { icon: Settings,      color: "#64748B", label: "システム" },
};

export const mockNotifications: Notification[] = [
  {
    id: "n-001", type: "disaster", priority: "critical", read: false,
    title: "緊急地震速報 — 千葉県沖 M3.2",
    body: "震度3 · 影響範囲: 関東南部 · 影響トラック: 12台",
    details: "自動対応: ✅ EEWアラート配信 ✅ 影響車両特定 ⏳ ルート再計算中 (4台)",
    time: "2分前", module: "災害対策モジュール",
    actionLabel: "対策画面へ", actionPath: "/disaster",
  },
  {
    id: "n-002", type: "ocr", priority: "warning", read: false,
    title: "OCR確認待ち — FAX #2851",
    body: "㈱中村建設 · 信頼度: 87.3% · PaddleOCR + Gemini 3 Pro",
    details: "要確認フィールド: 集荷先 (78%), 備考 (82%)",
    time: "5分前", module: "レガシーブリッジ",
    actionLabel: "確認画面へ", actionPath: "/legacy-bridge",
  },
  {
    id: "n-003", type: "match", priority: "info", read: false,
    title: "マッチ成功 — M-8471",
    body: "田中商事㈱ · 大阪→東京 · スコア: 0.96",
    details: "ドライバー: 佐藤一郎 · 積載率: 65%→89%",
    time: "8分前", module: "マッチングエンジン",
    actionLabel: "詳細へ", actionPath: "/matching",
  },
  {
    id: "n-004", type: "integration", priority: "warning", read: false,
    title: "Hacobell API 接続エラー",
    body: "Status: 503 Service Unavailable",
    details: "自動リトライ: 3/5回完了 · 次回リトライ: 30秒後",
    time: "12分前", module: "インテグレーション",
    actionLabel: "ログへ", actionPath: "/integrations",
  },
  {
    id: "n-005", type: "match", priority: "info", read: false,
    title: "マッチ期限切れ — M-8475",
    body: "㈱高橋電機 · 広島→名古屋",
    details: "次候補ドライバーに自動エスカレーション済み",
    time: "15分前", module: "マッチングエンジン",
    actionLabel: "詳細へ", actionPath: "/matching",
  },
  {
    id: "n-006", type: "security", priority: "info", read: true,
    title: "SPIRE SVID ローテーション完了",
    body: "サービス: llm-proxy · 新しいSVID有効期限: 24時間",
    details: "",
    time: "22分前", module: "セキュリティ",
    actionLabel: "", actionPath: "/security",
  },
  {
    id: "n-007", type: "delivery", priority: "info", read: true,
    title: "配達完了 — LG-2831",
    body: "名古屋→横浜 · 3,200 kg · ドライバー: 田中太郎",
    details: "CO₂削減: 18.3 kg (-22.1%)",
    time: "25分前", module: "配送管理",
    actionLabel: "配送詳細へ", actionPath: "/shipments",
  },
  {
    id: "n-008", type: "ocr", priority: "info", read: true,
    title: "OCR処理完了 — FAX #2847",
    body: "㈱田中運送 · 信頼度: 97.8% · 自動承認済み",
    details: "",
    time: "28分前", module: "レガシーブリッジ",
    actionLabel: "", actionPath: "/legacy-bridge",
  },
  {
    id: "n-009", type: "ocr", priority: "warning", read: false,
    title: "OCR確認待ち — FAX #2848",
    body: "佐藤物流㈱ · 信頼度: 72.1%",
    details: "要確認フィールド: 電話番号 (45%), 重量 (68%), 日時 (71%)",
    time: "18分前", module: "レガシーブリッジ",
    actionLabel: "確認画面へ", actionPath: "/legacy-bridge",
  },
  {
    id: "n-010", type: "match", priority: "info", read: true,
    title: "マッチ提案送信 — M-8473",
    body: "鈴木工業㈱ · 名古屋→横浜 · スコア: 0.88",
    details: "ドライバー: 山本花子 · 交渉中 (残り 25:00)",
    time: "35分前", module: "マッチングエンジン",
    actionLabel: "詳細へ", actionPath: "/matching",
  },
  {
    id: "n-011", type: "system", priority: "info", read: true,
    title: "システムアップデート v2.4.2",
    body: "新機能: カーボンクレジットレポート機能を追加",
    details: "変更: マッチングスコア表示の改善",
    time: "1時間前", module: "システム",
    actionLabel: "", actionPath: "",
  },
  {
    id: "n-012", type: "match", priority: "info", read: true,
    title: "マッチ成功 — M-8470",
    body: "㈱山田物流 · 福岡→大阪 · スコア: 0.93",
    details: "ドライバー: 木村次郎 · 積載率: 72%→91%",
    time: "1時間前", module: "マッチングエンジン",
    actionLabel: "詳細へ", actionPath: "/matching",
  },
  {
    id: "n-013", type: "delivery", priority: "info", read: true,
    title: "GX ETS月次レポート自動生成完了",
    body: "2026年2月分 · CO₂削減: 310t · J-Blue: 310 Credit",
    details: "",
    time: "2時間前", module: "カーボン",
    actionLabel: "レポートへ", actionPath: "/carbon",
  },
];
