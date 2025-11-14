# Docker セットアップガイド

## 🐳 Docker Compose での実行

### 🔑 Dockerモードの選択

このプロジェクトは2つのDockerモードをサポートしています:

| モード | ポート | コマンド | 推奨 |
|-------|-------|---------|------|
| **標準Docker** | 80/443 | `sudo docker-compose -f docker-compose.standard.yml up` | 本番環境 |
| **Rootless Docker** | 8080/8443 | `docker-compose up` | 開発環境 |

### ⚠️ あなたの環境について

エラーメッセージから判断すると、あなたは**rootless Dockerモード**を使用しています。

```
error while calling RootlessKit PortManager.AddPort():
cannot expose privileged port 443
```

**2つの選択肢**:
1. **そのまま使う** - 非特権ポート（8080/8443）で動作（現在の設定）
2. **標準Dockerに切り替える** - ポート80/443を使用（下記参照）

---

## 🚀 クイックスタート

### 1. 証明書の生成

```bash
# setup.shで証明書を生成
./setup.sh
```

証明書は以下に生成されます:
- `backend/certs/` - バックエンド用
- `frontend/certs/` - フロントエンド用（Nginx用）

### 2. Dockerモードを選択

#### オプションA: Rootless Docker（現在の環境）

```bash
# そのまま実行（sudo不要）
docker-compose up --build

# アクセス
# Frontend: https://localhost:8443
# Backend:  https://localhost:3001
```

#### オプションB: 標準Docker（ポート80/443）

```bash
# 標準Dockerに切り替え（sudoが必要）
sudo docker-compose -f docker-compose.standard.yml up --build

# アクセス
# Frontend: https://localhost （標準ポート）
# Backend:  https://localhost:3001
```

#### オプションC: Rootlessでポート80/443を使用

```bash
# システム設定を変更
sudo sysctl net.ipv4.ip_unprivileged_port_start=80
echo 'net.ipv4.ip_unprivileged_port_start=80' | sudo tee -a /etc/sysctl.conf

# 標準ポート用の設定ファイルを使用
docker-compose -f docker-compose.standard.yml up --build

# アクセス
# Frontend: https://localhost （標準ポート）
```

---

## 📋 ポート設定

### デフォルトポート（rootless対応）

| サービス | ホストポート | コンテナポート | 説明 |
|---------|------------|--------------|------|
| Frontend HTTP | 8080 | 80 | HTTPアクセス（HTTPSへリダイレ��ト） |
| Frontend HTTPS | 8443 | 443 | メインのHTTPSアクセス |
| Backend API | 3001 | 3001 | バックエンドAPI（HTTPS） |

### 💡 ポート番号について

**rootless Dockerモード**では1024未満のポート（特権ポート）にバインドできません。

- ❌ **使用不可**: ポート80, 443
- ✅ **使用可**: ポート8080, 8443, 3001

### カスタムポートの設定

ポートを変更したい場合は`docker-compose.yml`を編集:

```yaml
services:
  frontend:
    ports:
      - "8080:80"      # 左側（ホストポート）を変更可能
      - "8443:443"     # 右側（コンテナポート）は変更しない
```

---

## 🔧 環境変数

### JWT_SECRETの設定

**重要**: 本番環境では必ずJWT_SECRETを設定してください。

#### 方法1: 環境変数で指定

```bash
# 一時的に設定
JWT_SECRET=$(openssl rand -base64 32) docker-compose up

# または.envファイルを作成
echo "JWT_SECRET=$(openssl rand -base64 32)" > .env
docker-compose up
```

#### 方法2: docker-compose.ymlに直接記載（非推奨）

```yaml
environment:
  - JWT_SECRET=your-secure-secret-here
```

**注意**: Gitにコミットしないでください！

---

## 📁 永続化されるデータ

### ボリュームマウント

```yaml
volumes:
  - ./backend/certs:/app/certs:ro           # 証明書（読み取り専用）
  - ./backend/database.db:/app/database.db  # データベース
  - ./backend/uploads:/app/uploads          # ユーザーアップロード
```

### データの保持

以下のデータはホストマシンに保存され、コンテナ再作成後も保持されます:

- ✅ ユーザーアカウント（database.db）
- ✅ ゲーム履歴（database.db）
- ✅ アップロードされたアバター（uploads/）
- ✅ 証明書（certs/）

---

## 🛠️ 開発ワークフロー

### コンテナの起動

```bash
# フォアグラウンドで起動（ログを表示）
docker-compose up

# バックグラウンドで起動
docker-compose up -d

# 特定のサービスのみ起動
docker-compose up backend
docker-compose up frontend
```

### ログの確認

```bash
# すべてのログ
docker-compose logs

# リアルタイムでログを追跡
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs backend
docker-compose logs frontend
```

### コンテナの停止

```bash
# 停止
docker-compose stop

# 停止して削除
docker-compose down

# ボリュームも含めて削除（データ削除注意！）
docker-compose down -v
```

### 再ビルド

```bash
# コードを変更した後、再ビルド
docker-compose up --build

# キャッシュを使わずに完全再ビルド
docker-compose build --no-cache
docker-compose up
```

---

## 🐛 トラブルシューティング

### エラー: "cannot expose privileged port"

```
error while calling RootlessKit PortManager.AddPort():
cannot expose privileged port 443
```

**原因**: rootlessモードで特権ポート（< 1024）を使用しようとしています。

**解決方法**:

#### オプション1: 非特権ポートを使用（推奨）

`docker-compose.yml`で既に設定済み:
```yaml
ports:
  - "8080:80"
  - "8443:443"
```

#### オプション2: システム設定を変更（非推奨）

```bash
# Linuxの場合
sudo sysctl net.ipv4.ip_unprivileged_port_start=443
echo 'net.ipv4.ip_unprivileged_port_start=443' | sudo tee -a /etc/sysctl.conf
```

---

### エラー: "failed to set up container networking"

```bash
# 既存のコンテナをすべて削除
docker-compose down

# ネットワークをクリーンアップ
docker network prune

# 再起動
docker-compose up
```

---

### エラー: 証明書が見つからない

```
Error: ENOENT: no such file or directory, open '/app/certs/server.key'
```

**解決方法**:

```bash
# 証明書を生成
./setup.sh

# 証明書の存在確認
ls -la backend/certs/
ls -la frontend/certs/

# Dockerコンテナを再起動
docker-compose up --build
```

---

### ブラウザの証明書警告

**症状**: ブラウザが「この接続ではプライバシーが保護されません」と表示

**原因**: 自己署名証明書を使用しているため

**解決方法**:

1. **開発環境の場合**: 「詳細設定」→「localhost にアクセスする」で続行
2. **本番環境の場合**: Let's Encryptなどの信頼された証明書を使用

```bash
# Let's Encryptで証明書を取得（本番環境）
sudo certbot certonly --standalone -d yourdomain.com
```

---

### データベースがロックされる

```
Error: SQLITE_BUSY: database is locked
```

**原因**: 複数のプロセスが同時にデータベースにアクセス

**解決方法**:

```bash
# コンテナを停止
docker-compose down

# データベースファイルのロックを解除
rm -f backend/database.db-shm backend/database.db-wal

# 再起動
docker-compose up
```

---

## 🔒 セキュリティ

### 本番環境チェックリスト

- [ ] JWT_SECRETを強力な値に変更
- [ ] 信頼された認証局の証明書を使用
- [ ] FRONTEND_URLを具体的なドメインに設定
- [ ] docker-compose.ymlから機密情報を削除
- [ ] .envファイルを.gitignoreに追加
- [ ] データベースファイルのバックアップ設定
- [ ] ファイアウォールルールの設定
- [ ] 定期的なセキュリティアップデート

### 環境変数の管理

**開発環境**:
```bash
# .envファイルを作成
cat > .env << EOF
JWT_SECRET=$(openssl rand -base64 32)
NODE_ENV=development
EOF
```

**本番環境**:
- Docker Secretsを使用
- 環境変数管理サービス（AWS Secrets Manager, HashiCorp Vault等）
- GitにはコミットしないKubernetesのSecrets

---

## 📊 パフォーマンス最適化

### マルチステージビルドの利用

Dockerfileは既にマルチステージビルドを使用:

```dockerfile
# ビルドステージ
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# 実行ステージ
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
```

**メリット**:
- ✅ イメージサイズの削減
- ✅ ビルドツールを含まない
- ✅ セキュリティの向上

### キャッシュの活用

```bash
# 依存関係が変わらない場合はキャッシュを使用
docker-compose build

# 完全再ビルド（遅い）
docker-compose build --no-cache
```

---

## 🌐 本番デプロイ

### リバースプロキシの使用

本番環境ではNginxやTraefikをリバースプロキシとして使用:

```nginx
# /etc/nginx/sites-available/transcendence
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass https://localhost:8443;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass https://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass https://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 📚 関連ドキュメント

- [HTTPS_SETUP.md](HTTPS_SETUP.md) - HTTPS設定ガイド
- [ENV_SETUP.md](ENV_SETUP.md) - 環境変数ガイド
- [README.md](README.md) - プロジェクト概要

---

**Docker環境での開発を楽しんでください！** 🐳
