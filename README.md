# Diet Log PWA

スマホで素早く記録することを最優先にした、個人用の食事・筋トレ・身体記録PWAです。**記録データはブラウザの IndexedDB にのみ保存**し、バックエンド、ログイン、クラウド同期、解析/広告SDK、外部API通信は使いません。

## いちばん簡単な起動方法（Windows）

1. Node.js 22 LTS をインストール
2. このフォルダの `START_WINDOWS.cmd` をダブルクリック
3. 初回だけ依存パッケージを取得後、Diet Log が起動
4. PCでは `http://localhost:5173`、同じWi-FiのスマホではViteに表示される `Network` URLを開く

通常のコマンドでも起動できます。

```bash
npm install
npm run dev -- --host
```

## 主な機能

- 身体: 1日1件の体重・体脂肪率を記録、過去日編集、削除
- 食事: 食品マスタ、お気に入り、食品複数選択、量調整、1食保存、最近の食事コピー、日次カロリー/PFC集計
- 筋トレ: 種目マスタ、カスタム種目、前回コピー、セットごとの重量/回数/RPE、設定インターバル、実測タイマー、履歴
- グラフ: 体重、体脂肪率、カロリー、PFC、筋トレセット数、ボリューム、種目最大重量の推移
- 期間: 1W / 1M / 3M / ALL / 任意期間
- PWA: ホーム画面追加、静的アセットのキャッシュ、オフライン利用
- 保存耐久性: 対応ブラウザでは Persistent Storage を自動要求し、ストレージ圧迫時の自動削除リスクを下げる

## ローカル専用設計

本番ビルドでは次を実施します。

- `connect-src 'none'` のCSPで fetch/XHR/WebSocket/EventSource/beacon を禁止
- アプリコード側でもネットワークAPIを無効化
- 外部CDN、Webフォント、Analytics、Telemetryなし
- カメラ、位置情報、マイク等の端末権限を要求しない
- `public/_headers` に厳格なセキュリティヘッダーを同梱
- `npm run security:scan` でランタイムソースに外部URL/通信APIが紛れ込んでいないか確認

ネット接続が必要なのは、**初回のアプリ本体ダウンロード、更新確認・更新、開発時のVite通信**です。記録の保存・閲覧は端末内で完結します。

> 注意: バックアップを実装していないため、サイトデータ削除、ブラウザ削除、端末故障・紛失などで記録を失う可能性があります。

詳しい脅威モデルは [SECURITY.md](./SECURITY.md) を参照してください。

## 本番ビルド

```bash
npm run build
npm run preview -- --host
```

本番ビルドではネットワークロックが有効になります。ルーティングはHashRouter、アセットは相対パスなので、GitHub Pagesなどのサブパス配信でも壊れにくい構成です。

## テスト・検証

軽い検証一式:

```bash
npm run verify
```

内容は TypeScript、ESLint、unit test、ランタイム通信スキャン、本番build です。

E2Eを含む完全検証は初回だけChromiumを入れてから実行します。

```bash
npm run setup:e2e
npm run test:e2e
```

Windowsなら `VERIFY_WINDOWS.cmd` のダブルクリックで、依存取得 → build/lint/unit/security → Chromium導入 → モバイルE2E まで一気に実行できます。

E2Eでは以下を確認します。

- 身体記録がリロード後もIndexedDBに残る
- 食事追加と日次合計
- 筋トレセット保存
- 本番で外向き `fetch` が拒否される
- Service Workerキャッシュ後にオフライン再起動できる

## GitHub CI

`.github/workflows/ci.yml` を同梱しています。GitHubにpushすると build/lint/unit/security/E2E が自動実行されます。

## 依存関係

トップレベル依存は完全固定しています。初回 `npm install` 成功時に生成される `package-lock.json` もGitHubへコミットしてください。それ以降はCI/通常セットアップで `npm ci` を使うことで、同一依存関係を再現できます。

## スマホでPWAとしてインストールする場合

同じWi-Fi上の `http://<PCのIP>:5173` はスマホでの画面・操作確認には使えますが、`localhost` 以外のHTTPはSecure Contextではないため、Service Worker/PWAインストールの本番確認には向きません。

GitHubへリポジトリを作成してpushした後は、同梱の **Deploy PWA to GitHub Pages** workflowを手動実行すればHTTPSで配布できます。GitHub Pages側でActionsをPagesのSourceとして有効化してください。GitHub Pagesは `_headers` を反映しないため、ページ内CSP＋ランタイム通信ロックが主な防御になります。より厳格なレスポンスヘッダーまで適用したい場合は `_headers` 対応の静的ホストを使います。
