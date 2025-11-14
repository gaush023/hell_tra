# HTTPS セットアップガイド

このプロジェクトはHTTPS接続に対応しています。以下の手順に従ってセットアップしてください。

## 🔐 機能

- ✅ バックエンド（Fastify）でHTTPS対応
- ✅ フロントエンド（Vite開発サーバー）でHTTPS対応
- ✅ WebSocket Secure (WSS) 対応
- ✅ Docker環境でHTTPS対応
- ✅ **`.env`ファイル不要** - 証明書の有無を自動検出
- ✅ HTTP/HTTPS自動切り替え
- ✅ プロトコル自動検出（フロントエンド）

## 📋 前提条件

- Node.js 18以上
- OpenSSL（証明書生成用）
- Docker & Docker Compose（本番環境用）

## 🔄 動作モード

このプロジェクトは証明書と環境変数の有無によって自動的に動作モードを切り替えます：

| 証明書 | HTTPS_ENABLED | 動作モード |
|--------|---------------|-----------|
| ✅ あり | `true` または未設定 | **HTTPSモード** 🔒 |
| ❌ なし | 任意 | **HTTPモード** |
| ✅ あり | `false` | **HTTPモード** |

### 自動検出機能

- **バックエンド**: 証明書ファイルの存在を自動検出してHTTPS/HTTPを切り替え
- **フロントエンド**: 証明書の有無でViteサーバーがHTTPS/HTTPを自動選択
- **API/WebSocket**: ブラウザのプロトコル（`window.location.protocol`）から自動判定

**つまり**: `.env`ファイルを作成せず、証明書を生成するだけでHTTPSが有効になります！

## ⚡ クイックスタート（最短手順）

HTTPSを有効にする最短の手順：

```bash
# 1. 証明書生成
./generate-certs.sh

# 2. 依存関係インストール
cd backend && npm install
cd ../frontend && npm install

# 3. 起動
cd backend && npm run dev    # ターミナル1
cd frontend && npm run dev   # ターミナル2
```

これだけで `https://localhost:3000` と `https://localhost:3001` が使えます！

## 🚀 開発環境のセットアップ（詳細）

### 1. SSL証明書の生成

プロジェクトルートで以下のコマンドを実行します：

```bash
./generate-certs.sh
```

これにより `certs/` ディレクトリに以下のファイルが生成されます：
- `server.key` - 秘密鍵
- `server.crt` - 証明書
- `server.pem` - PEM形式の証明書

### 2. 依存関係のインストール

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

### 3. サーバーの起動

**証明書が存在する場合**: 自動的にHTTPSで起動します
**証明書がない場合**: HTTPで起動します

#### バックエンド
```bash
cd backend
npm run dev
```

起動メッセージで以下のように表示されます：
- HTTPS有効: `🚀 Server is running on https://localhost:3001`
- HTTP: `🚀 Server is running on http://localhost:3001`

#### フロントエンド
```bash
cd frontend
npm run dev
```

起動メッセージで `https://localhost:3000` または `http://localhost:3000` が表示されます。

## 🐳 Docker環境での実行

Docker Composeを使用してHTTPS対応の本番環境を起動できます。

### 1. 証明書の生成（未実施の場合）

```bash
./generate-certs.sh
```

### 2. Dockerコンテナのビルドと起動

```bash
docker-compose up --build
```

アクセス先：
- フロントエンド: `https://localhost`（HTTPS、ポート443）
- バックエンド: `https://localhost:3001`（HTTPS、ポート3001）

### 3. コンテナの停止

```bash
docker-compose down
```

## 🔧 設定の詳細

### バックエンド設定

[backend/src/index.ts](backend/src/index.ts) でHTTPS設定を行っています：

- 証明書ファイル（`certs/server.key`, `certs/server.crt`）の存在を自動検出
- 証明書があり、環境変数 `HTTPS_ENABLED=true` の場合にHTTPSサーバーを起動
- 環境変数がない場合はデフォルト設定で動作
- CORS設定は環境変数 `FRONTEND_URL` またはワイルドカード

### フロントエンド設定

[frontend/vite.config.ts](frontend/vite.config.ts) でVite開発サーバーのHTTPS設定を行っています：

- 証明書ファイルの存在を自動検出
- 証明書があれば自動的にHTTPS開発サーバーを起動
- 証明書がなければHTTPで起動

### API/WebSocket設定

- **APIサービス**: `window.location.protocol` から自動判定（HTTPS/HTTP）
- **WebSocket**: `window.location.protocol` から自動判定（wss/ws）
- 環境変数でオーバーライド可能（`VITE_API_BASE_URL`, `VITE_WS_URL`）

### 環境変数（オプション）

以下の環境変数でカスタマイズ可能です（すべてオプション）：

**バックエンド**:
- `HTTPS_ENABLED` - HTTPSを有効化（デフォルト: false）
- `SSL_KEY_PATH` - 秘密鍵のパス（デフォルト: `./certs/server.key`）
- `SSL_CERT_PATH` - 証明書のパス（デフォルト: `./certs/server.crt`）
- `PORT` - ポート番号（デフォルト: 3001）
- `FRONTEND_URL` - CORS許可URL（デフォルト: `*`）

**フロントエンド**:
- `VITE_API_BASE_URL` - APIベースURL（デフォルト: 自動判定）
- `VITE_WS_URL` - WebSocket URL（デフォルト: 自動判定）

## ⚠️ 自己署名証明書に関する注意

開発環境で生成した証明書は**自己署名証明書**です。ブラウザで初回アクセス時に警告が表示されます。

### 🦊 Firefox での注意事項（重要）

**Firefoxは自己署名証明書に対して特に厳格です。**

#### Firefox で正しく動作させるために必要な証明書要件:
1. ✅ **SubjectAltName (SAN) の設定** - CN だけでは不十分
2. ✅ **適切な keyUsage 拡張** - `digitalSignature`, `keyEncipherment`
3. ✅ **extendedKeyUsage** - `serverAuth` の指定
4. ✅ **SHA-256 ハッシュアルゴリズム** - SHA-1 は非推奨
5. ✅ **2048ビット以上のRSA鍵**

#### setup.sh で生成される証明書の特徴:

**mkcert使用時（推奨）**:
- ✅ システムの信頼ストアに自動追加
- ✅ Firefoxでも警告なしで動作
- ✅ インストール: `brew install mkcert` (macOS) / `apt install mkcert` (Linux)

**OpenSSL使用時**:
- ✅ Firefox要件を満たす適切な拡張が設定済み
- ⚠️ 手動での証明書承認が必要

#### Firefoxで証明書を承認する手順:
1. `https://localhost:3001` にアクセス
2. 「警告: 潜在的なセキュリティリスクあり」と表示される
3. 「詳細情報」→「例外を追加」をクリック
4. 「セキュリティ例外を承認」をクリック
5. フロントエンド (`https://localhost:5173`) でも同じ手順を繰り返す

**注意**: 両方のポート (3001と5173) で個別に承認が必要です。

### Chrome/Edgeの場合
1. 警告画面で「詳細設定」をクリック
2. 「localhost にアクセスする（安全ではありません）」をクリック

### Safariの場合
1. 「詳細を表示」をクリック
2. 「このWebサイトを表示」をクリック

### 💡 開発体験を改善するには

**mkcert の使用を強く推奨します:**

```bash
# macOS
brew install mkcert
mkcert -install

# Linux (Debian/Ubuntu)
sudo apt install libnss3-tools
sudo apt install mkcert
mkcert -install

# Linux (Fedora/CentOS)
sudo yum install nss-tools
sudo yum install mkcert
mkcert -install

# その後、setup.shを再実行
./setup.sh
```

mkcertを使用すると:
- ✅ すべてのブラウザで警告が出ない
- ✅ Firefox での手動承認が不要
- ✅ システム全体で信頼される証明書
- ✅ 開発者体験が大幅に向上

## 🌐 本番環境での証明書

**本番環境では、信頼された認証局（CA）から発行された証明書を使用してください。**

推奨サービス：
- [Let's Encrypt](https://letsencrypt.org/)（無料）
- [Certbot](https://certbot.eff.org/)（Let's Encrypt自動化ツール）
- [Cloudflare](https://www.cloudflare.com/)（CDN+SSL）

### Let's Encryptの使用例

```bash
# Certbotのインストール
sudo apt-get install certbot

# 証明書の取得
sudo certbot certonly --standalone -d yourdomain.com

# 証明書のパスを環境変数に設定
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## 🔍 トラブルシューティング

### 証明書エラー

```bash
Error: ENOENT: no such file or directory, open './certs/server.key'
```

**解決方法**: `./generate-certs.sh` を実行して証明書を生成してください。

### ポート使用中エラー

```bash
Error: listen EADDRINUSE: address already in use :::3001
```

**解決方法**:
```bash
# ポートを使用しているプロセスを確認
lsof -i :3001

# プロセスを終了
kill -9 <PID>
```

### CORS エラー

```
Access to fetch at 'https://localhost:3001' from origin 'https://localhost:3000' has been blocked by CORS policy
```

**解決方法**: バックエンドの `.env` ファイルで `FRONTEND_URL` が正しく設定されているか確認してください。

### WebSocket接続エラー

```
WebSocket connection to 'wss://localhost:3001/ws' failed
```

**解決方法**:
1. バックエンドがHTTPSモードで起動しているか確認
2. フロントエンドの `.env` で `VITE_WS_URL` が `wss://` で始まっているか確認

## 📚 参考資料

- [Fastify HTTPS Documentation](https://www.fastify.io/docs/latest/Reference/Server/#https)
- [Vite HTTPS Configuration](https://vitejs.dev/config/server-options.html#server-https)
- [WebSocket Secure (WSS)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

## 🔒 セキュリティのベストプラクティス

1. **証明書を Git にコミットしない** - `.gitignore` で `certs/` を除外済み
2. **環境変数を Git にコミットしない** - `.gitignore` で `.env` を除外済み
3. **本番環境では強力な JWT_SECRET を使用する**
4. **CORS を適切に設定する** - ワイルドカード `*` は使用しない
5. **本番環境では信頼された CA の証明書を使用する**
6. **定期的に証明書を更新する**（Let's Encrypt は90日間有効）

## ✅ 動作確認

すべてが正しく設定されている場合：

1. ✅ ブラウザのアドレスバーに🔒マークが表示される
2. ✅ `https://localhost:3001/health` で `{"status":"OK","timestamp":"..."}` が返る
3. ✅ フロントエンドから API 呼び出しが成功する
4. ✅ WebSocket 接続が `wss://` で確立される
5. ✅ コンソールに CORS エラーが表示されない

---

**開発を楽しんでください！** 🚀
