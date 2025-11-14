# mkcert トラブルシューティングガイド

## ❌ エラー: "permission denied"

```
ERROR: failed to save CA key:
open /home/sagemura/.local/share/mkcert/rootCA-key.pem: permission denied
```

このエラーは、mkcertがCA証明書を保存するディレクトリに書き込み権限がない場合に発生します。

---

## 🔧 解決方法

### 方法1: ディレクトリの権限を修正（推奨）

```bash
# mkcertのCA保存場所を確認
CAROOT=$(mkcert -CAROOT)
echo $CAROOT

# ディレクトリの所有権を自分のユーザーに変更
sudo chown -R $USER:$USER $CAROOT

# ディレクトリが存在しない場合は作成
mkdir -p $CAROOT

# setup.shを再実行
./setup.sh
```

---

### 方法2: カスタムCA保存場所を使用

```bash
# ホームディレクトリにCA保存場所を設定
export CAROOT=$HOME/.mkcert

# ディレクトリを作成
mkdir -p $CAROOT

# mkcert CAをインストール
mkcert -install

# setup.shを再実行
./setup.sh
```

**永続的に設定する場合:**

```bash
# .bashrc または .zshrc に追加
echo 'export CAROOT=$HOME/.mkcert' >> ~/.bashrc
source ~/.bashrc

# または .zshrc の場合
echo 'export CAROOT=$HOME/.mkcert' >> ~/.zshrc
source ~/.zshrc
```

---

### 方法3: OpenSSLを使用（自動フォールバック）

**setup.shは自動的にOpenSSLにフォールバックします！**

mkcertが失敗した場合、スクリプトは自動的にOpenSSLを使用して証明書を生成します。

```bash
# setup.shを実行するだけでOK
./setup.sh

# 出力例:
# ⚠️  Failed to install mkcert CA (permission denied)
# 💡 Try running: sudo chown -R user:user /path/to/caroot
# ℹ️  Falling back to OpenSSL...
# ✅ Self-signed certificates generated with openssl
```

**OpenSSLで生成された証明書は:**
- ✅ Firefox要件を満たす
- ✅ すべてのブラウザで動作（手動承認が必要）
- ✅ 開発環境では問題なく使用可能

---

## 🔍 診断コマンド

### mkcertの状態を確認

```bash
# mkcertがインストールされているか確認
which mkcert

# バージョン確認
mkcert -version

# CA保存場所を確認
mkcert -CAROOT

# CA保存場所のディレクトリ情報
ls -la $(mkcert -CAROOT)

# CA保存場所の権限確認
stat $(mkcert -CAROOT)
```

### 権限の問題を確認

```bash
# ディレクトリの所有者を確認
ls -ld $(mkcert -CAROOT)

# 現在のユーザーを確認
whoami

# ディレクトリに書き込めるか確認
touch $(mkcert -CAROOT)/test.txt
rm $(mkcert -CAROOT)/test.txt
```

---

## 💡 各方法の比較

| 方法 | メリット | デメリット |
|-----|---------|----------|
| **方法1: 権限修正** | ✅ mkcertの完全な機能<br>✅ ブラウザで警告なし<br>✅ システム全体で信頼される | ⚠️ sudoが必要<br>⚠️ システム設定を変更 |
| **方法2: カスタムCA** | ✅ sudoが不要<br>✅ ユーザーディレクトリのみ<br>✅ mkcertの完全な機能 | ⚠️ 環境変数の設定が必要<br>⚠️ 再インストールが必要 |
| **方法3: OpenSSL** | ✅ 自動的に動作<br>✅ 追加設定不要<br>✅ Firefox互換性あり | ⚠️ ブラウザで手動承認が必要<br>⚠️ 開発体験が劣る |

---

## 🚀 推奨フロー

### 初めてのユーザー

```bash
# 1. 権限を確認
ls -la $(mkcert -CAROOT)

# 2. 権限がない場合は修正
sudo chown -R $USER:$USER $(mkcert -CAROOT)

# 3. setup.shを実行
./setup.sh
```

### sudoを使いたくない場合

```bash
# 1. カスタムCARootを設定
export CAROOT=$HOME/.mkcert
mkdir -p $CAROOT

# 2. mkcertを再インストール
mkcert -install

# 3. .bashrc/.zshrcに追加（永続化）
echo 'export CAROOT=$HOME/.mkcert' >> ~/.bashrc

# 4. setup.shを実行
./setup.sh
```

### すぐに動かしたい場合

```bash
# setup.shが自動的にOpenSSLにフォールバック
./setup.sh

# 証明書は生成される
# ブラウザで手動承認が必要だが、すぐに開発開始可能
```

---

## 🐧 Linux固有の問題

### Ubuntu/Debian

```bash
# libnss3-toolsが必要
sudo apt install libnss3-tools

# mkcertをインストール
sudo apt install mkcert

# または最新版を手動インストール
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
chmod +x mkcert-v*-linux-amd64
sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert

# CA保存場所を設定
export CAROOT=$HOME/.mkcert
mkcert -install
```

### Fedora/CentOS/RHEL

```bash
# nss-toolsが必要
sudo yum install nss-tools

# mkcertをインストール
sudo yum install mkcert

# CA保存場所を設定
export CAROOT=$HOME/.mkcert
mkcert -install
```

---

## 🍎 macOS固有の問題

### Homebrewでインストール

```bash
# mkcertをインストール
brew install mkcert

# NSS（Firefoxサポート用）
brew install nss

# CAをインストール
mkcert -install

# 権限問題が発生する場合
sudo security authorizationdb write com.apple.trust-settings.admin allow
mkcert -install
```

---

## 🔒 セキュリティに関する注意

### CA証明書の重要性

- `rootCA-key.pem` は**非常に重要**なファイルです
- このファイルがあれば、任意のドメインの証明書を発行できます
- **絶対にGitにコミットしないでください**
- **他人と共有しないでください**

### 推奨設定

```bash
# CA保存場所の権限を厳しく設定
chmod 700 $(mkcert -CAROOT)
chmod 600 $(mkcert -CAROOT)/rootCA-key.pem
```

---

## 📚 参考リンク

- [mkcert公式GitHub](https://github.com/FiloSottile/mkcert)
- [mkcertインストールガイド](https://github.com/FiloSottile/mkcert#installation)
- [Firefox証明書要件](https://wiki.mozilla.org/Security/Server_Side_TLS)

---

## ✅ 動作確認

証明書が正しく生成されたか確認:

```bash
# 証明書検証スクリプトを実行
./verify-cert.sh

# backend証明書を確認
ls -la backend/certs/

# frontend証明書を確認
ls -la frontend/certs/

# サーバーを起動してテスト
cd backend && npm run dev
```

ブラウザで https://localhost:3001/health にアクセスして確認。

---

**問題が解決しない場合は、OpenSSLフォールバックを使用してください。開発には十分機能します！** 🎉
