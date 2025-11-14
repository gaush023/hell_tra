# Grafana Dashboard Tester

このツールは、Grafanaダッシュボードをテストするためのメトリクス生成ツールです。

## 前提条件

1. **モニタリングスタックが起動していること**
   ```bash
   docker-compose -f docker-compose.monitoring.yml up -d
   ```

2. **バックエンドが起動していること**
   ```bash
   cd backend
   npm run dev
   ```

## 使用方法

### 基本的な使い方

バックエンドディレクトリから以下のコマンドを実行：

```bash
npm run test:grafana
```

### 環境変数でカスタマイズ

```bash
# テスト時間を120秒に設定
TEST_DURATION=120 npm run test:grafana

# 同時ユーザー数を10人に設定
CONCURRENT_USERS=10 npm run test:grafana

# 複数の環境変数を組み合わせ
TEST_DURATION=180 CONCURRENT_USERS=15 npm run test:grafana
```

### 利用可能な環境変数

| 環境変数 | デフォルト値 | 説明 |
|---------|-------------|------|
| `BACKEND_URL` | `http://localhost:3001` | バックエンドのURL |
| `WS_URL` | `ws://localhost:3001` | WebSocketのURL |
| `TEST_DURATION` | `60` | テスト時間（秒） |
| `CONCURRENT_USERS` | `5` | 同時接続ユーザー数 |

## テストで生成されるメトリクス

このツールは以下のメトリクスを生成します：

### HTTPメトリクス
- **http_requests_total**: HTTPリクエスト総数
- **http_request_duration_seconds**: HTTPリクエストの処理時間

### WebSocketメトリクス
- **ws_active_connections**: アクティブなWebSocket接続数
- **ws_connections_total**: WebSocket接続総数
- **ws_messages_total**: WebSocketメッセージ総数

### ゲームメトリクス
- **pong_games_total**: Pongゲーム開始/終了総数
- **pong_games_active**: アクティブなPongゲーム数
- **tank_games_total**: Tankゲーム開始/終了総数
- **tank_games_active**: アクティブなTankゲーム数

### ユーザーメトリクス
- **online_users_total**: オンラインユーザー数

## テストの流れ

1. 指定された数のWebSocket接続を確立
2. ランダムなHTTPリクエストを継続的に送信（1-3リクエスト/秒）
3. ランダムにゲームセッションを開始/終了
4. 10秒ごとに統計情報を表示
5. 15秒ごとに現在のメトリクスを表示
6. テスト時間経過後に終了

## メトリクスの確認

テスト実行中に以下のURLでメトリクスを確認できます：

### Grafana Dashboard
```
http://localhost:3000/d/transcendence-app/transcendence-application-dashboard
```
- ユーザー名: `admin`
- パスワード: `admin`

### Prometheus
```
http://localhost:9090
```

クエリ例：
- `rate(http_requests_total[1m])` - 1分あたりのHTTPリクエスト率
- `ws_active_connections` - アクティブなWebSocket接続数
- `pong_games_active` - アクティブなPongゲーム数

### Backend Metrics Endpoint
```
http://localhost:3001/metrics
```

## 出力例

```
🚀 Grafana Dashboard Tester 起動
📊 バックエンドURL: http://localhost:3001
⏱️  テスト時間: 60秒
👥 同時ユーザー数: 5

🏁 テスト開始

📡 5人のユーザーのWebSocket接続を作成中...
✅ WebSocket接続 #1 確立
✅ WebSocket接続 #2 確立
✅ WebSocket接続 #3 確立
✅ WebSocket接続 #4 確立
✅ WebSocket接続 #5 確立

💪 負荷生成開始...

📊 テスト統計:
  HTTPリクエスト: 245
  WebSocket接続: 5
  ゲーム開始: 12
  エラー: 0

📈 現在のメトリクス:
  http_requests_total{method="GET",route="/health",status_code="200"} 82
  ws_active_connections 5
  online_users_total 5
  pong_games_active 2
  tank_games_active 1

✅ テスト完了!
```

## トラブルシューティング

### バックエンドに接続できない

```bash
# バックエンドが起動しているか確認
lsof -i :3001

# バックエンドを起動
cd backend
npm run dev
```

### モニタリングスタックに接続できない

```bash
# コンテナが起動しているか確認
docker ps | grep -E "(prometheus|grafana)"

# モニタリングスタックを起動
docker-compose -f docker-compose.monitoring.yml up -d
```

### WebSocketエラーが発生する

WebSocketエンドポイント (`/ws`) がバックエンドで正しく実装されているか確認してください。

## 中断

テスト中に `Ctrl+C` を押すと、安全に中断できます。中断時には統計情報が表示されます。
