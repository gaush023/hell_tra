# DevOps Tests

このディレクトリには、アプリケーションのDevOps関連のテストファイルが含まれています。

## 📁 テストファイル

### 1. test-grafana.ts
**Grafanaダッシュボードテスト**
- WebSocket接続とHTTPリクエストでメトリクスを生成
- Grafanaダッシュボードの動作確認用

### 2. simple-load-test.ts
**シンプル負荷テスト**
- 指定したRPS（リクエスト/秒）でHTTPリクエストを送信
- パフォーマンステスト用

### 3. test-full-metrics.ts
**完全メトリクス生成**
- ユーザー作成、ログイン、WebSocket接続
- HTTPリクエストなど、すべてのメトリクスを生成

### 4. test-with-games.ts
**ゲーム込みメトリクス生成**
- ゲームマッチングを含む完全なメトリクス生成
- ゲーム機能のテスト用

### 5. complete-test.ts
**完全統合テスト**
- すべてのコンポーネントの統合テスト
- 総合的な動作確認用

## 🚀 使い方

### メニュー選択式で実行（推奨）

プロジェクトルートから:
```bash
./run-tests.sh
```

対話的にテストを選択でき、環境変数の設定も簡単に変更できます。

### npm スクリプトで直接実行

```bash
cd backend

# Grafanaダッシュボードテスト
npm run test:grafana

# シンプル負荷テスト
npm run test:load

# 完全メトリクス生成
npm run test:metrics

# ゲーム込みメトリクス生成
npm run test:games

# 完全統合テスト
npm run test:complete
```

## ⚙️ 環境変数

以下の環境変数でテストをカスタマイズできます:

| 変数 | デフォルト | 説明 |
|------|-----------|------|
| `BACKEND_URL` | `https://localhost:3002` | バックエンドURL |
| `WS_URL` | `wss://localhost:3002` | WebSocket URL |
| `TEST_DURATION` | `60` | テスト時間（秒） |
| `CONCURRENT_USERS` | `5` | 同時ユーザー数 |
| `RPS` | `10` | リクエスト/秒（負荷テストのみ） |

### 例:

```bash
# カスタム設定で実行（backendディレクトリから）
cd backend
BACKEND_URL=https://localhost:3002 \
WS_URL=wss://localhost:3002 \
TEST_DURATION=120 \
CONCURRENT_USERS=10 \
npm run test:metrics
```

または、メニュー選択式スクリプトで環境変数を変更:
```bash
./run-tests.sh
# メニューで「6」を選択して環境変数を変更
```

## 📊 監視ツール

テスト実行中、以下のツールで結果を確認できます:

- **Grafanaダッシュボード**: http://localhost:3000
  - デフォルトログイン: `admin` / `admin`
- **Prometheus**: http://localhost:9090
- **Backend Metrics**: http://localhost:3002/metrics

## 💡 ヒント

- テストを実行する前に、Docker環境が起動していることを確認してください
  ```bash
  docker-compose up -d
  ```

- 複数のテストを連続実行する場合は、間隔を空けてください
  ```bash
  cd backend
  npm run test:load && sleep 10 && npm run test:metrics
  ```

- Ctrl+C で実行中のテストを中断できます

## 🔧 トラブルシューティング

### バックエンドに接続できない
- Dockerコンテナが起動しているか確認: `docker-compose ps`
- ポートが正しいか確認: `BACKEND_URL` と `WS_URL`

### WebSocket接続エラー
- バックエンドのログを確認: `docker-compose logs backend`
- ファイアウォール設定を確認

### メトリクスが表示されない
- Prometheus が起動しているか確認
- Grafana でデータソースが正しく設定されているか確認
