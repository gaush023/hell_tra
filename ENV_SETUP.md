# 環境変数セットアップガイド / Environment Variables Setup Guide

このプロジェクトでは、すべての認証情報、APIキー、設定値を環境変数で管理します。

## 🔐 セキュリティ原則

1. **環境変数ファイル（`.env`）は絶対にGitにコミットしない**
2. **本番環境では強力なシークレットを使用する**
3. **デフォルト値は開発用のみ使用する**

## 📋 開発環境のセットアップ

### 1. バックエンド環境変数の設定

```bash
# バックエンドディレクトリに移動
cd backend

# .env.example をコピーして .env を作成
cp .env.example .env

# .env ファイルを編集（オプション）
# デフォルト値で動作しますが、JWT_SECRETは変更推奨
```

**最小限の設定（推奨）：**

`.env` ファイルを作成して以下を設定：

```bash
# 開発用の強力なシークレット（本番環境では必ず変更）
JWT_SECRET=dev-secret-$(openssl rand -base64 32)
```

### 2. フロントエンド環境変数（オプション）

フロントエンドは自動検出機能があるため、通常は環境変数不要です。

カスタマイズする場合のみ：

```bash
cd frontend
cp .env.example .env
# 必要に応じて VITE_API_BASE_URL と VITE_WS_URL を編集
```

## 🔑 重要な環境変数の説明

### バックエンド

#### 必須（本番環境）

| 変数名 | 説明 | デフォルト値 | 本番環境での設定例 |
|--------|------|-------------|-------------------|
| `JWT_SECRET` | JWT トークン署名用の秘密鍵 | `your-secret-key-CHANGE-THIS-IN-PRODUCTION` | `openssl rand -base64 32` で生成 |
| `FRONTEND_URL` | CORS許可URL | `*` | `https://yourdomain.com` |

#### オプション

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `PORT` | サーバーポート | `3001` |
| `HTTPS_ENABLED` | HTTPS有効化 | `true`（証明書がある場合） |
| `SSL_KEY_PATH` | SSL秘密鍵のパス | `certs/server.key` |
| `SSL_CERT_PATH` | SSL証明書のパス | `certs/server.crt` |
| `DB_PATH` | データベースファイルパス | `database.db` |
| `BCRYPT_SALT_ROUNDS` | bcryptのソルトラウンド数 | `12` |
| `MAX_FILE_SIZE` | 最大ファイルアップロードサイズ | `5242880`（5MB） |

### フロントエンド

| 変数名 | 説明 | デフォルト値（自動検出） |
|--------|------|------------------------|
| `VITE_API_BASE_URL` | APIベースURL | `{protocol}//localhost:3001` |
| `VITE_WS_URL` | WebSocket URL | `{ws/wss}://localhost:3001/ws` |

## 🚀 本番環境のセットアップ

### 1. 強力なJWTシークレットの生成

```bash
openssl rand -base64 32
```

このコマンドで生成された値を `JWT_SECRET` に設定します。

### 2. 本番用 .env ファイルの作成

```bash
cd backend
cp .env.production.example .env
```

### 3. 本番環境設定の編集

`.env` ファイルを編集して以下を設定：

```bash
# 1. 強力なJWTシークレットを設定
JWT_SECRET=<openssl rand -base64 32 の出力結果>

# 2. フロントエンドのURLを設定（* は使わない）
FRONTEND_URL=https://yourdomain.com

# 3. Let's Encrypt証明書のパスを設定
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem

# 4. データベースパスを設定
DB_PATH=/var/lib/transcendence/database.db

# 5. アップロードディレクトリを設定
UPLOAD_DIR=/var/lib/transcendence/uploads/avatars
```

## 🔒 セキュリティチェックリスト

本番環境デプロイ前に以下を確認：

- [ ] `JWT_SECRET` を強力な値に変更した
- [ ] `FRONTEND_URL` を具体的なドメインに設定した（`*` を使っていない）
- [ ] SSL証明書が信頼された認証局（Let's Encrypt等）から取得されている
- [ ] `.env` ファイルが `.gitignore` に含まれている
- [ ] `.env` ファイルの権限が適切に設定されている（`chmod 600 .env`）
- [ ] 本番環境のデータベースファイルがバックアップされている

## 🛠️ トラブルシューティング

### JWT_SECRET が設定されていない

**症状**: トークン生成・検証エラー

**解決方法**:
```bash
echo "JWT_SECRET=$(openssl rand -base64 32)" >> backend/.env
```

### CORS エラー

**症状**: フロントエンドからAPIリクエストが拒否される

**解決方法**:
```bash
# backend/.env
FRONTEND_URL=https://your-frontend-domain.com
```

### 環境変数が読み込まれない

**症状**: 環境変数の変更が反映されない

**解決方法**:
1. サーバーを再起動する
2. `.env` ファイルの場所を確認（`backend/` ディレクトリ直下にあるか）
3. `.env` ファイルの構文エラーをチェック（`=` の前後にスペースを入れない）

## 📚 関連ドキュメント

- [HTTPS_SETUP.md](HTTPS_SETUP.md) - HTTPS設定ガイド
- [.gitignore](.gitignore) - Git除外設定
- [backend/.env.example](backend/.env.example) - 開発環境設定例
- [backend/.env.production.example](backend/.env.production.example) - 本番環境設定例

## 💡 ベストプラクティス

1. **開発環境**: デフォルト値を使用してもOKだが、JWT_SECRETは変更推奨
2. **ステージング環境**: 本番環境と同じ設定を使用
3. **本番環境**: すべての環境変数を明示的に設定
4. **チーム開発**: `.env.example` を更新して新しい環境変数を共有
5. **CI/CD**: 環境変数をシークレット管理システム（GitHub Secrets等）で管理

---

**セキュリティに関する質問や問題があれば、すぐにチームに相談してください！** 🔒
