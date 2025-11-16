# 🧪 DevOps & Monitoring テストガイド

このガイドでは、Transcendence プロジェクトの DevOps/監視機能の包括的なテストを実行する方法を説明します。

## 📋 テストカテゴリ

### 1. インフラ起動テスト (Docker / Compose)
- ✅ DevOps:01 - docker-compose up -d で全サービスが自動起動するか
- ✅ DevOps:02 - Prometheus が http://localhost:9090 で正常応答するか
- ✅ DevOps:03 - Grafana が http://localhost:3000 で正常応答するか
- ✅ DevOps:04 - Backend / Frontend / Nginx も全て RUNNING か
- 📝 DevOps:05 - 再起動してもデータ（ダッシュボード）が保持されるか

### 2. Prometheus データ収集テスト
- ✅ Metrics:01 - /metrics にアクセスしてメトリクスが出力されるか
- ✅ Metrics:02 - HTTP リクエスト数がカウントされているか
- ✅ Metrics:03 - HTTP エラーがカウントされているか
- ✅ Metrics:04 - レイテンシ（Histogram）が正しく出ているか
- ✅ Metrics:05 - WebSocket 接続数が更新されるか
- ✅ Metrics:06 - ゲーム開始/終了イベントのカウンターが動くか

### 3. PromQL テスト
- ✅ PromQL:01 - `sum(rate(http_requests_total[1m]))` が動作する
- ✅ PromQL:02 - エラー率計算の PromQL が動作する
- ✅ PromQL:03 - レイテンシ計算の histogram_quantile が正しく値を返す
- ✅ PromQL:04 - プレイヤーオンライン数が更新される
- ✅ PromQL:05 - ゲームイベントの PromQL が値を返す

### 4. Grafana ダッシュボード表示テスト
- ✅ Grafana:01 - Prometheus を Data Source として登録済み
- ✅ Grafana:02 - 独自ダッシュボードが作成されている
- 📝 Grafana:03 - HTTP リクエスト数グラフが表示される
- 📝 Grafana:04 - HTTP エラー率が表示される
- 📝 Grafana:05 - レイテンシ（p50, p90, p99）が表示される
- 📝 Grafana:06 - プレイヤーオンライン数がリアルタイムで変化
- 📝 Grafana:07 - Pong/Tank の開始/終了イベントが確認できる
- 📝 Grafana:08 - CPU / メモリのメトリクスが表示される
- 📝 Grafana:09 - 時間フィルタ（Last 15m など）が正しく動作
- 📝 Grafana:10 - エラーが発生してもグラフが壊れない

### 5. セキュリティテスト
- 📝 Security:01 - Grafana のデフォルトパスワード変更済み
- 📝 Security:02 - Grafana への外部アクセスが制限されている
- ✅ Security:03 - HTTPS（TLS）でアクセスできる構成がある
- 📝 Security:04 - Prometheus /-/reload などが外部公開されていない
- 📝 Security:05 - Docker Secrets または .env に API key を隠蔽
- ✅ Security:06 - API key を git に push していない

### 6. メトリクス妥当性テスト
- ✅ Validate:01 - ブラウザで UI を触ると HTTP リクエスト数が増える
- 📝 Validate:02 - WebSocket（接続/切断）でメトリクスが変化する
- 📝 Validate:03 - ゲーム開始/終了でカウンタが増える
- 📝 Validate:04 - Ping API を連打するとレイテンシが動く
- ✅ Validate:05 - 意図的に 404 を起こすとエラー率が増える
- 📝 Validate:06 - CPU を負荷テストしグラフが正しく伸びる

## 🚀 クイックスタート

### 1. サービスを起動

```bash
# すべてのサービスをビルド＆起動
make up

# または
docker-compose up -d
```

### 2. 包括的テストを実行

```bash
# 自動テストを実行
make test

# または直接実行
bash comprehensive-test.sh
```

### 3. 対話的テストを実行

```bash
# 対話的テストランナー
make test-interactive

# または
bash run-tests.sh
```

## 📊 テスト方法

### A. 自動テスト（comprehensive-test.sh）

すべての自動テスト可能な項目をチェックします：

```bash
make test
```

**出力例:**
```
🧪 1. インフラ起動テスト（Docker / Compose）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [DevOps:01] docker-compose up -d で全サービスが自動起動するか ... ✓ PASS
  [DevOps:02] Prometheus が http://localhost:9090 で正常応答するか ... ✓ PASS
  ...

📊 テスト結果サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✓ PASSED: 15
  ✗ FAILED: 0
  📝 TOTAL:  15
```

### B. 手動テスト

#### Grafana ダッシュボードの確認

1. Grafana にアクセス: http://localhost:3000
2. ログイン: `admin` / `admin`
3. ダッシュボード一覧を確認
4. 各グラフが正しく表示されているか確認

#### メトリクスの確認

```bash
# Backend メトリクスを表示
curl -k https://localhost:3002/metrics

# Prometheus でクエリを実行
# http://localhost:9090 にアクセスして以下を試す:
# - sum(rate(http_requests_total[1m]))
# - histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

#### エラー率テストの例

```bash
# 意図的に404エラーを発生させる
for i in {1..10}; do
  curl -k https://localhost:8443/api/nonexistent
done

# メトリクスを確認
curl -k https://localhost:3002/metrics | grep 'status="404"'

# Prometheus でエラー率を計算
# (sum(rate(http_requests_total{status=~"4..|5.."}[1m]))
#  / sum(rate(http_requests_total[1m]))) * 100
```

### C. 負荷テスト

```bash
# 既存の負荷テストを実行
cd backend && npm run test:load

# または対話的テストランナーから選択
bash run-tests.sh
```

## 🔍 トラブルシューティング

### サービスが起動しない

```bash
# ログを確認
make logs

# 特定のサービスのログ
make logs-backend
make logs-frontend
```

### メトリクスが表示されない

```bash
# Prometheusが正しくスクレイピングしているか確認
curl http://localhost:9090/api/v1/targets

# Backend メトリクスエンドポイントを確認
curl -k https://localhost:3002/metrics
```

### Grafana にアクセスできない

```bash
# Grafana コンテナの状態を確認
docker-compose ps grafana

# Grafana のログを確認
docker-compose logs grafana
```

## 📝 テスト結果の保存

テスト結果は自動的にログファイルに保存されます：

```bash
# テスト実行
make test

# ログファイルを確認
ls -la test-results-*.log

# 最新のログを表示
cat test-results-$(ls -t test-results-*.log | head -1)
```

## 🎯 ベストプラクティス

1. **テスト前にサービスを起動**: `make up` を実行してからテストを開始
2. **定期的にテスト実行**: コードを変更したら必ずテストを実行
3. **ログを確認**: テストが失敗した場合はログファイルを確認
4. **手動確認も重要**: 自動テストでカバーできない項目は手動で確認

## 📚 関連コマンド

```bash
# ヘルプを表示
make help

# ヘルスチェック
make health

# サービスの状態確認
make status

# すべてクリーンアップして再起動
make clean && make up
```

## 🔗 参考リンク

- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- Backend Metrics: https://localhost:3002/metrics
- Frontend: https://localhost:8443

---

**Legend:**
- ✅ = 自動テスト可能
- 📝 = 手動確認が必要
