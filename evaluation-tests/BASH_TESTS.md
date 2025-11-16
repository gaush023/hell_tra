# Bash Test Scripts

バッシュスクリプトでTranscendenceプロジェクトのテストを実行するためのガイド。

## 📋 利用可能なスクリプト

### 1. `run-tests.sh` - 統合テストランナー（メインスクリプト）

すべてのテスト（評価テスト + DevOpsテスト）を実行する対話型メニュースクリプト。

**使い方:**

```bash
# 対話型メニューで実行（推奨）
./run-tests.sh

# すべてのテストを自動実行
./run-tests.sh --all
```

**メニューオプション:**
1. すべてのテストを実行（推奨）
2. 評価テストのみ実行（セキュリティ、API、ゲーム）
3. セキュリティテストのみ
4. APIテストのみ
5. ゲームテストのみ
6. 統合テスト
7. DevOpsテスト（Grafana、負荷テスト）
8. クイックチェック（サーバー接続のみ）
9. 環境変数の設定
0. 終了

---

### 2. `quick-test.sh` - クイックテスト

個別のテストを素早く実行するためのコマンドラインツール。

**使い方:**

```bash
# サーバー接続確認
./quick-test.sh check

# セキュリティテストのみ
./quick-test.sh security

# APIテストのみ
./quick-test.sh api

# ゲームテストのみ
./quick-test.sh game

# すべての評価テスト
./quick-test.sh all

# ヘルプ表示
./quick-test.sh help
```

**カスタムURL指定:**

```bash
# 異なるポートでテスト
BASE_URL=http://localhost:3000 ./quick-test.sh api

# すべての環境変数を指定
BASE_URL=http://localhost:3002 \
WS_URL=ws://localhost:3002/ws \
./quick-test.sh all
```

---

### 3. `test-server.sh` - サーバー状態チェック

すべてのサービスの接続状態を確認する診断ツール。

**使い方:**

```bash
./test-server.sh
```

**チェック項目:**
- バックエンドAPI (`http://localhost:3002`)
- フロントエンド (`https://localhost:8443`)
- Grafana (`http://localhost:3000`)
- Prometheus (`http://localhost:9090`)
- Dockerコンテナの状態
- ネットワークポートの状態

---

## 🔧 環境変数

すべてのスクリプトで使用可能な環境変数:

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `BASE_URL` | `http://localhost:3002` | バックエンドAPI URL |
| `FRONTEND_URL` | `https://localhost:8443` | フロントエンド URL |
| `WS_URL` | `ws://localhost:3002/ws` | WebSocket URL |
| `TEST_TIMEOUT` | `10000` | テストタイムアウト（ミリ秒） |
| `TEST_DURATION` | `60` | DevOpsテストの実行時間（秒） |
| `CONCURRENT_USERS` | `5` | 同時ユーザー数 |
| `RPS` | `10` | リクエスト/秒（負荷テスト） |

**設定方法:**

1. **一時的に設定:**
   ```bash
   BASE_URL=http://localhost:3000 ./quick-test.sh api
   ```

2. **`.env`ファイルで設定:**
   ```bash
   # evaluation-tests/.envファイルを編集
   BASE_URL=http://localhost:3002
   WS_URL=ws://localhost:3002/ws
   ```

3. **対話的に設定:**
   ```bash
   ./run-tests.sh
   # メニューで「9」を選択
   ```

---

## 🚀 クイックスタート

### 1. サーバーの起動

```bash
# プロジェクトルートから
cd /goinfre/sagemura/hell_tra
docker-compose up -d
```

### 2. サーバー状態の確認

```bash
cd evaluation-tests
./test-server.sh
```

### 3. テストの実行

**オプションA: 対話型メニュー（初心者向け）**

```bash
./run-tests.sh
# メニューから選択
```

**オプションB: コマンドライン（上級者向け）**

```bash
# すべてのテストを実行
./run-tests.sh --all

# または個別に
./quick-test.sh check      # サーバー確認
./quick-test.sh security   # セキュリティ
./quick-test.sh api        # API
./quick-test.sh game       # ゲーム
```

---

## 📊 テスト結果の見方

### 成功例:

```
✅ PASS: User registration successful
✅ PASS: Password is not exposed in API response

Pass Rate: 100.00%
🎉 All tests passed!
```

### 失敗例:

```
❌ FAIL: HTTPS connection failed
⚠️  WARN: Could not authenticate for XSS test

Pass Rate: 60.00%
⚠️  CRITICAL SECURITY ISSUES FOUND!
```

---

## 🐛 トラブルシューティング

### サーバーに接続できない

**症状:**
```
❌ Server is not accessible at http://localhost:3002
```

**解決方法:**

1. Dockerコンテナの状態確認:
   ```bash
   docker-compose ps
   ```

2. コンテナの起動:
   ```bash
   docker-compose up -d
   ```

3. ログの確認:
   ```bash
   docker-compose logs backend
   ```

4. ポートの確認:
   ```bash
   ss -tlnp | grep 3002
   ```

---

### ポート番号が違う

**症状:**
```
curl: (7) Failed to connect to localhost port 3001
```

**解決方法:**

1. 実際のポートを確認:
   ```bash
   ./test-server.sh
   ```

2. 環境変数を設定:
   ```bash
   # .envファイルを編集
   echo "BASE_URL=http://localhost:3002" > .env
   ```

   または

   ```bash
   BASE_URL=http://localhost:3002 ./quick-test.sh all
   ```

---

### Node.js依存関係がない

**症状:**
```
❌ Missing dependencies: node npm
```

**解決方法:**

```bash
# Node.jsをインストール
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS:
brew install node

# 確認
node --version
npm --version
```

---

### HTTPSとHTTPの混在

**症状:**
```
Protocol "http:" not supported. Expected "https:"
```

**解決方法:**

`.env`ファイルでプロトコルを統一:

```bash
# すべてHTTPの場合
BASE_URL=http://localhost:3002
WS_URL=ws://localhost:3002/ws

# すべてHTTPSの場合
BASE_URL=https://localhost:3002
WS_URL=wss://localhost:3002/ws
```

---

## 📝 スクリプトの詳細

### `run-tests.sh`の機能

- ✅ 依存関係の自動チェック
- ✅ サーバー接続の確認
- ✅ npm依存関係の自動インストール
- ✅ 評価テスト（セキュリティ、API、ゲーム）
- ✅ DevOpsテスト（Grafana、負荷テスト）
- ✅ 統合テスト
- ✅ 詳細なテスト結果サマリー
- ✅ 対話型メニュー
- ✅ 環境変数の設定UI

### `quick-test.sh`の機能

- ✅ 高速なコマンドライン実行
- ✅ 個別テストの実行
- ✅ サーバー接続確認
- ✅ カスタム環境変数のサポート

### `test-server.sh`の機能

- ✅ すべてのサービスの状態確認
- ✅ Dockerコンテナの確認
- ✅ ネットワークポートの確認
- ✅ 接続問題の診断
- ✅ トラブルシューティングのヒント

---

## 🎯 評価時の推奨フロー

```bash
# 1. サーバーの起動確認
./test-server.sh

# 2. すべてのテストを実行
./run-tests.sh --all

# または対話的に
./run-tests.sh

# 3. 個別テストの再実行（必要に応じて）
./quick-test.sh security
./quick-test.sh api
./quick-test.sh game
```

---

## 📞 サポート

問題が発生した場合:

1. `./test-server.sh`でサーバー状態を確認
2. `docker-compose logs backend`でログを確認
3. `.env`ファイルの設定を確認
4. 必要に応じて`docker-compose restart`

---

**作成日:** 2025-11-16
**バージョン:** 1.0.0
**対応環境:** Linux, macOS, WSL
