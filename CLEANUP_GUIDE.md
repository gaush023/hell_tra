# クリーンアップガイド / Cleanup Guide

`cleanup.sh` スクリプトは開発環境を整理・リセットするための便利なツールです。

## 🧹 基本的な使い方

```bash
./cleanup.sh
```

インタラクティブメニューが表示され、クリーンアップする項目を選択できます。

## 📋 クリーンアップオプション

### [1] Dependencies only (node_modules)
**対象**:
- `backend/node_modules/`
- `frontend/node_modules/`
- `backend/package-lock.json`
- `frontend/package-lock.json`

**用途**: 依存関係の問題を解決したい場合や、ディスク容量を節約したい場合

**安全性**: ✅ 安全（再インストール可能）

**次のステップ**:
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

### [2] Build artifacts (dist, compiled files)
**対象**:
- `frontend/dist/`
- `backend/dist/`
- コンパイル済みJSファイル

**用途**: ビルドエラーを解決したい場合、クリーンビルドを実行したい場合

**安全性**: ✅ 安全（再ビルド可能）

**次のステップ**:
```bash
# フロントエンド
cd frontend && npm run build

# バックエンド（必要に応じて）
cd backend && npm run build
```

---

### [3] Database & user data (⚠️ DESTRUCTIVE)
**対象**:
- `backend/database.db`
- `backend/uploads/avatars/`（default.svg以外）

**用途**:
- テストデータをクリアしたい
- データベーススキーマの変更を適用したい
- ユーザーアカウントをリセットしたい

**安全性**: ⚠️ **注意が必要** - すべてのユーザーデータが削除されます

**確認**: `yes` と入力する必要があります

**データ損失**:
- すべてのユーザーアカウント
- ゲーム履歴
- フレンド関係
- 統計情報
- アップロードされたアバター画像

**次のステップ**: サーバー起動時に自動的に空のデータベースが作成されます

---

### [4] Certificates
**対象**:
- `certs/server.key`
- `certs/server.crt`
- `certs/server.pem`

**用途**:
- 証明書の有効期限が切れた
- 証明書の設定を変更したい
- Firefoxで証明書エラーが発生した

**安全性**: ✅ 安全（再生成可能）

**次のステップ**:
```bash
./setup.sh  # 証明書の再生成を選択
```

---

### [5] Environment files (.env)
**対象**:
- `backend/.env`
- `frontend/.env`

**用途**:
- 環境変数の設定をリセットしたい
- デフォルト設定に戻したい

**安全性**: ✅ 安全（再生成可能）

**注意**: JWT_SECRETなどのシークレットが再生成されるため、既存のトークンは無効になります

**次のステップ**:
```bash
./setup.sh  # 環境ファイルが自動生成されます
```

---

### [6] Everything except .env (⚠️ DESTRUCTIVE)
**対象**: オプション1, 2, 3, 4の全て（.envファイルは除く）

**用途**:
- 環境変数を保持したまま、完全にクリーンアップしたい
- プロジェクトをほぼ初期状態に戻したい

**安全性**: ⚠️ **注意が必要** - データベースとユーザーデータが削除されます

**確認**: `yes` と入力する必要があります

**次のステップ**:
```bash
./setup.sh  # 依存関係と証明書を再セットアップ
```

---

### [7] Complete reset (⚠️ VERY DESTRUCTIVE)
**対象**: すべて（.envファイルも含む）

**用途**:
- プロジェクトを完全に初期状態に戻したい
- すべてを最初からやり直したい

**安全性**: ⚠️⚠️ **非常に危険** - すべてが削除されます

**確認**: `RESET` と入力する必要があります（大文字小文字を区別）

**次のステップ**:
```bash
./setup.sh  # 完全セットアップ
```

---

### [8] Custom selection
**対象**: 個別に選択

**用途**: 特定の項目のみをクリーンアップしたい

**安全性**: ✅ 選択次第

**インタラクティブプロンプト**:
- Clean backend node_modules? (y/N)
- Clean frontend node_modules? (y/N)
- Clean build artifacts? (y/N)
- Clean database? (y/N)
- Clean user uploads? (y/N)
- Clean certificates? (y/N)
- Clean .env files? (y/N)

---

## 🔍 現在の状態確認

スクリプトを実行すると、最初に現在の状態が表示されます:

```
📊 Current Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend:
  node_modules:    ✓ Found (74M)
  database.db:     ✓ Found (4.0K)
  uploads:         ✓ Found (4.0K)

Frontend:
  node_modules:    ✓ Found (116M)
  dist:            ✗ Not found (N/A)

Certificates:
  certs/:          ✓ Found (12K)

Environment files:
  backend/.env:    ✓ Found
  frontend/.env:   ✓ Found
```

## 💡 よくあるユースケース

### ケース1: ディスク容量が足りない
```bash
./cleanup.sh
# → オプション [1] を選択
# node_modulesを削除して約190MBの空き容量を確保
```

### ケース2: npm installで問題が発生
```bash
./cleanup.sh
# → オプション [1] を選択
# その後
cd backend && npm install
cd ../frontend && npm install
```

### ケース3: テストユーザーをすべて削除したい
```bash
./cleanup.sh
# → オプション [3] を選択
# yesと入力して確認
```

### ケース4: プロジェクトを最初から始めたい
```bash
./cleanup.sh
# → オプション [7] を選択
# RESETと入力して確認
./setup.sh  # 再セットアップ
```

### ケース5: 依存関係とデータベースだけクリア
```bash
./cleanup.sh
# → オプション [8] を選択
# node_modules → y
# database → y
# その他 → n
```

## 🔒 安全性について

### 確認プロンプト
破壊的な操作（オプション3, 6, 7）では確認が必要です:
- **オプション3, 6**: `yes` と入力
- **オプション7**: `RESET` と入力（大文字小文字を区別）

### キャンセル
- **オプション0**: いつでもキャンセル可能
- **確認プロンプト**: 間違った入力でキャンセル
- **Ctrl+C**: 任意のタイミングで中断可能

## 📊 クリーンアップ後の情報

スクリプト完了時に以下が表示されます:
1. **クリーンアップされた項目数**
2. **次に実行すべきコマンド**
3. **再セットアップの推奨**

例:
```
✅ Cleanup Complete!
============================================

📊 Summary:
  Items cleaned: 5

💡 Next steps:

  📦 Reinstall dependencies:
     cd backend && npm install
     cd frontend && npm install

  🔒 Regenerate certificates:
     ./setup.sh

  ⚡ Or run complete setup:
     ./setup.sh
```

## 🛡️ バックアップの推奨

重要なデータ（本番環境など）をクリーンアップする前に:

```bash
# データベースのバックアップ
cp backend/database.db backend/database.db.backup

# アップロードファイルのバックアップ
tar -czf uploads-backup.tar.gz backend/uploads/

# 環境ファイルのバックアップ
cp backend/.env backend/.env.backup
cp frontend/.env frontend/.env.backup
```

## 🔄 関連スクリプト

- **setup.sh** - 完全セットアップ
- **verify-cert.sh** - 証明書検証
- **generate-certs.sh** - 証明書生成のみ

## ⚠️ トラブルシューティング

### "Permission denied"エラー
```bash
chmod +x cleanup.sh
./cleanup.sh
```

### ファイルが削除できない
- 実行中のプロセスを確認:
```bash
# バックエンドサーバーを停止
pkill -f "npm run dev"

# または特定のポートを使用しているプロセスを停止
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### "command not found"エラー
```bash
# 現在のディレクトリを確認
pwd
# プロジェクトルートに移動
cd /path/to/hell_tra
./cleanup.sh
```

---

## 📚 参考ドキュメント

- [setup.sh の使い方](./HTTPS_SETUP.md)
- [環境変数の設定](./ENV_SETUP.md)
- [証明書の検証](./verify-cert.sh)

---

**開発を効率的に進めましょう！** 🚀
