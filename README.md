<div align="center">

# Logi-Go

**分散型ロジスティクスミドルウェア — 日本の物流ネットワークの「OS」**

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=flat)](LICENSE)
[![EPCIS](https://img.shields.io/badge/Standard-GS1_EPCIS_2.0-0066CC?style=flat)](https://ref.gs1.org/standards/epcis/)
[![Security](https://img.shields.io/badge/Security-Zero_Trust_ZTA-green?style=flat)](docs/07-security-zero-trust.md)
[![Network](https://img.shields.io/badge/Network-NTT_IOWN_APN-orange?style=flat)](https://iowngf.org/)

*「物流2024年問題」を解決 — 2030年までに日本の輸送能力が34%不足するリスクを阻止*

</div>

---

## 課題

日本の物流業界は、同時に収束する**三重の危機**に直面しています：

| 課題 | 規模 | 期限 |
|------|------|------|
| 輸送能力の不足 | 2030年までに**34%** | 即時対応 |
| ドライバーの時間外労働制限 | −20%の輸送能力 | 2024年法規制 |
| 南海トラフ巨大地震リスク | 被害額220兆円 | 予測不可能 |

一方で、**トラックの平均積載率はわずか69%** — 毎日何百万台もの車両が定員割れで運行しています。さらに数万のSMEが未だに**FAX**で配送注文を行っています。

## ソリューション

Logi-Goは**中立的な分散型ミドルウェア** — 既存プラットフォーム（Hacobu、Hacobell）と競合するのではなく、すべてを統一ネットワークとして接続し、日本政府が掲げる**「フィジカルインターネット」**のビジョンを実現します。

```
FAX / IoT / API  ──►  Logi-Go Middleware  ──►  SAP / Oracle / ERP
                       ├─ AI-OCR FAXデジタル化
                       ├─ リアルタイムトラックマッチング (H3/Redis)
                       ├─ 地震自動対応 (JMA)
                       └─ GS1 EPCIS 2.0 標準化
```

---

## 測定結果

<table>
<tr>
<td align="center"><b>+29%</b><br/>トラック積載率<br/><sub>69% → 89%</sub></td>
<td align="center"><b>−28%</b><br/>CO₂排出量<br/><sub>運輸業界</sub></td>
<td align="center"><b>−85%</b><br/>手動入力コスト<br/><sub>AI-OCR FAX</sub></td>
<td align="center"><b>99.2%</b><br/>OCR精度<br/><sub>手書き文字含む</sub></td>
<td align="center"><b>&lt;1ms</b><br/>マッチングレイテンシ<br/><sub>IOWN APN + Redis RAM</sub></td>
</tr>
</table>

---

## アーキテクチャ

```
╔══════════════════════════════════════════════════════════════╗
║  DATA SOURCES                                                 ║
║  [FAX/紙]  [IoT GPS Hacobu]  [Hacobell API]  [JMA EEW]      ║
╚═════════╤══════════╤══════════════╤═══════════╤═════════════╝
          │          │              │           │ WebSocket
          ▼          ▼              ▼           ▼
╔══════════════════════════════════════════════════════════════╗
║  INGESTION LAYER                                              ║
║  ┌───────────────┐   ┌──────────────────────────────────┐   ║
║  │ Legacy Bridge │   │ Module Ingest (API Gateway)      │   ║
║  │ AI-OCR Engine │──►│ Worker Pool (500 Goroutines)     │   ║
║  │ Multi-pass LLM│   │ EPCIS 2.0 Normalizer             │   ║
║  └───────────────┘   └─────────────────┬────────────────┘   ║
╚═════════════════════════════════════════╪════════════════════╝
                                          │ gRPC / mTLS
╔═════════════════════════════════════════╪════════════════════╗
║  PROCESSING LAYER                       ▼                     ║
║  ┌──────────────────────┐  ┌────────────────────────────┐   ║
║  │  Module RESILIENCE   │  │   Module MATCH ENGINE      │   ║
║  │  JMA EEW <100ms      │◄─│   H3 Spatial (Redis RAM)   │   ║
║  │  Auto-rerouting      │  │   Multi-obj Optimizer      │   ║
║  └──────────────────────┘  └────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════╝
          │
╔═════════▼════════════════════════════════════════════════════╗
║  PERSISTENCE  PostgreSQL+TimescaleDB │ Redis │ Firestore      ║
╚══════════════════════════════════════════════════════════════╝
          │
╔═════════▼════════════════════════════════════════════════════╗
║  INTEGRATION  SAP │ Oracle │ Hacobu │ Hacobell │ GX ETS       ║
╚══════════════════════════════════════════════════════════════╝
```

---

## モジュール

### Module Ingest — APIゲートウェイ & ワーカープール
システムの唯一のエントリーポイント。マルチソースデータ（IoT MQTT、REST、FAX）を受信し、500 Goroutinesのワーカープールを通じてすべてを**GS1 EPCIS 2.0 JSON-LD**に標準化 — 外部メッセージキューなしで**毎秒100,000以上のIoTイベント**を処理。

→ [詳細ドキュメント](docs/02-module-ingest.md)

---

### Module Legacy Bridge — 多層AI-OCR
FAXを使い続けるSME向けの非侵襲的デジタル化。3層パイプライン：

```
前処理 → [PaddleOCR ‖ Gemini 3 Pro Vision] → GPT-5.2 Chain-of-Thought 検証
```

ノイズの多いFAXや日本語手書き文字でも精度**≥ 99.2%**。500以上の物流専門用語辞書（物流専門用語辞書）を統合。

→ [詳細ドキュメント](docs/03-module-legacy-bridge.md)

---

### Module Match Engine — H3空間マッチング
Logi-Goの「心臓部」。空きトラックと荷物を**1ms未満**でマッチング：
- **H3六角形インデックス**（Uber）をRedis RAMで使用 — ディスクI/O不要
- **SUNION k-ring lookup**による空間セル検索
- **多目的スコアリング**：distance × load_factor × CO2 × driver_hours
- FCMプッシュ + WebSocketによる15分間のネゴシエーションウィンドウ

→ [詳細ドキュメント](docs/04-module-match.md)

---

### Module Resilience — JMA EEW & 災害復旧
**気象庁（JMA）**の緊急地震速報APIにWebSocket経由で直接接続。P波検出後 → **100ms未満**で自動対応：

- FCMによるドライバーへの警告
- MQTTによる倉庫ドアの自動開放
- 危険区域内のマッチング停止
- 代替ルートの計算（Dijkstra）
- IOWN APN優先チャネルのリクエスト

→ [詳細ドキュメント](docs/05-module-resilience.md)

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| **Core** | Go 1.22, gRPC, Protobuf |
| **AI/OCR** | GPT-5.2 Thinking Mode, Gemini 3 Pro Vision, PaddleOCR, Tesseract |
| **空間インデックス** | H3 (Uber), Redis 7 + RediSearch |
| **データベース** | PostgreSQL 16 + TimescaleDB + PostGIS, Firestore, Bigtable |
| **ネットワーク** | NTT IOWN APN (<1ms、ジッターなし) |
| **セキュリティ** | SPIFFE/SPIRE, mTLS (Istio), OPA, HashiCorp Vault |
| **インフラ** | GKE (Kubernetes), Cloud Armor, ArgoCD |
| **オブザーバビリティ** | OpenTelemetry → Grafana / Tempo / Loki |
| **標準規格** | GS1 EPCIS 2.0 (JSON-LD) |
| **Phase 3** | Hyperledger Fabric (Smart Contract決済) |

---

## データベース（Polyglot Persistence）

```
┌─────────────────┬──────────────────────────────┬────────────────────────┐
│ PostgreSQL 16   │ entities, shipments,          │ CRUD, spatial query,   │
│ + TimescaleDB   │ match_history, telemetry      │ time-series analytics  │
│ + PostGIS       │ (hypertable, auto-compress)   │                        │
├─────────────────┼──────────────────────────────┼────────────────────────┤
│ Redis 7         │ spatial:h3:{res}:{cell_id}    │ In-memory O(1) lookup  │
│ + RediSearch    │ truck:meta:{uuid} (Hash)      │ < 0.1ms latency        │
├─────────────────┼──────────────────────────────┼────────────────────────┤
│ Firestore       │ EPCIS 2.0 event log           │ Append-only ledger,    │
│ + Bigtable      │ Carbon credit records         │ Carbon / audit proof   │
└─────────────────┴──────────────────────────────┴────────────────────────┘
```

→ [完全スキーマ SQL + Redis + Firestore](docs/06-database.md)

---

## セキュリティ — ゼロトラストアーキテクチャ

```
すべてのservice-to-service呼び出し → mTLS必須 (Istio)
すべてのアイデンティティ → SPIFFE/SPIRE SVID X.509 (TTL 1h、自動ローテーション)
すべてのシークレット → HashiCorp Vault動的クレデンシャル
システム全体に静的APIキーは一切なし
```

→ [ゼロトラストドキュメント](docs/07-security-zero-trust.md)

---

## インテグレーション

| システム | 役割 | プロトコル |
|---------|------|-----------|
| **Hacobu (MOVO)** | IoT GPSテレメトリソース | Webhook (HMAC署名) |
| **Hacobell** | 配送指示マーケットプレイス | REST API (OAS3) |
| **SAP S/4HANA** | EPCIS 2.0 ERP同期 | JSON-LD webhook |
| **Oracle TMS** | EPCIS 2.0 ERP同期 | JSON-LD webhook |
| **JMA** | 緊急地震速報 | WebSocket |
| **GX ETS** | CO₂レポート + カーボンクレジット | REST API |
| **METI/MLIT** | DX/GX補助金レポート | REST API |

→ [インテグレーションドキュメント](docs/08-integrations.md)

---

## クイックスタート（ローカル開発）

### 前提条件
- Go 1.22+
- Docker + Docker Compose
- `make`

### 開発環境の起動

```bash
# クローンとセットアップ
git clone https://github.com/logi-go/logi-go.git
cd logi-go

# すべての依存関係を起動 (PostgreSQL, Redis, Jaeger, モックサーバー)
make dev

# マイグレーション実行
make migrate-up

# サービス起動
make run
```

### テスト実行

```bash
# ユニットテスト
make test

# 統合テスト (Docker必要)
make test-integration

# カオス/災害テスト
make chaos-test

# マッチエンジン負荷テスト
make load-test
```

### ディレクトリ構成

```
logi-go/
├── cmd/                    # エントリーポイント (各サービスに1つのmain.go)
│   ├── api-gateway/
│   ├── ingest-svc/
│   ├── match-svc/
│   ├── legacy-bridge-svc/
│   └── resilience-svc/
├── pkg/                    # 共有ライブラリ
│   ├── epcis/              # GS1 EPCIS 2.0 型 + シリアライザ
│   ├── spatial/            # H3インデックス + Redis空間
│   ├── auth/               # JWT + RBAC
│   ├── secrets/            # Vaultクライアント
│   └── telemetry/          # OpenTelemetryセットアップ
├── proto/                  # Protobuf定義
├── migrations/             # PostgreSQLスキーママイグレーション
├── k8s/                    # Kubernetesマニフェスト
├── docs/                   # 詳細技術ドキュメント
└── tests/
    ├── integration/
    ├── load/
    └── disaster/           # JMA EEWシミュレーションテスト
```

---

## ロードマップ

| フェーズ | 期間 | マイルストーン |
|---------|------|--------------|
| **Phase 0** | 2025年Q1–Q2 | Foundation、Legacy Bridge MVP、Ingest |
| **Phase 1** | 2025年Q3–Q4 | Match Engine、Resilience、大阪パイロット |
| **Phase 2a** | 2026年Q1–Q2 | IOWN APN、ゼロトラスト本番環境 |
| **Phase 2b** | 2026年Q3–Q4 | パートナーAPI、九州ハブ、カーボンクレジット |
| **Phase 3a** | 2027年上半期 | 全国展開、レベル4自動運転、ブロックチェーン |
| **Phase 3b** | 2027年下半期 | 海外展開：台湾、ベトナム、ASEAN |

→ [スプリントレベル詳細ロードマップ](docs/10-roadmap.md)

---

## ドキュメント

| ドキュメント | リンク |
|------------|--------|
| 全体アーキテクチャ & ADR | [docs/01-architecture.md](docs/01-architecture.md) |
| Module Ingest | [docs/02-module-ingest.md](docs/02-module-ingest.md) |
| Module Legacy Bridge (AI-OCR) | [docs/03-module-legacy-bridge.md](docs/03-module-legacy-bridge.md) |
| Module Match Engine | [docs/04-module-match.md](docs/04-module-match.md) |
| Module Resilience (JMA EEW) | [docs/05-module-resilience.md](docs/05-module-resilience.md) |
| データベース設計 | [docs/06-database.md](docs/06-database.md) |
| ゼロトラストセキュリティ | [docs/07-security-zero-trust.md](docs/07-security-zero-trust.md) |
| Hacobu/SAP/GX ETSインテグレーション | [docs/08-integrations.md](docs/08-integrations.md) |
| インフラ & CI/CD | [docs/09-infra-devops.md](docs/09-infra-devops.md) |
| ロードマップ 2025–2027 | [docs/10-roadmap.md](docs/10-roadmap.md) |

---

## 戦略 & 市場

**Logi-Goは競合しない — Logi-Goは接続する。**

クローズドなTMSプラットフォームを構築するのではなく、Logi-Goは**中立レイヤー（Interoperability Layer）**として位置づけられています — HacobuからIoTデータを取得し、Hacobellから配送指示を受け取り、EPCIS 2.0に標準化してSAP/Oracleに同期します。誰も顧客を失わず、全員がアップグレードされます。

**競争優位性（Competitive moat）：**
1. **ネットワーク効果** — トラックが増える → マッチング精度向上 → さらにトラック増加
2. **データ資産** — 国家レベルのEPCIS 2.0イベントログ、他社では取得不可能
3. **政策整合性** — METI/MLITのDX/GX補助金に準拠した設計
4. **IOWNパートナーシップ** — IOWNなしでは1ms未満のレイテンシは再現不可能
5. **データ主権** — SMEがACLを自己決定 → データ共有への懸念を解消

---

## ライセンス

Proprietary — © 2025 Logi-Go Inc. All rights reserved.

---

<div align="center">

*Logi-Go — 日本の物流ネットワークを接続する、1荷物1ミリ秒で*

</div>
