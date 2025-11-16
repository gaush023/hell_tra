#!/bin/bash
set -e

# ============================================
# SSL証明書生成スクリプト（開発環境用）
# Generate SSL certificates for development
# ============================================

echo "🔒 Generating SSL certificates for development..."
echo ""

# ====================================
# ディレクトリ作成
# ====================================
echo "📁 Creating certificate directories..."
mkdir -p ./backend/certs
mkdir -p ./frontend/certs

echo "  ✅ Created: ./backend/certs"
echo "  ✅ Created: ./frontend/certs"
echo ""

# ====================================
# OpenSSL設定ファイル作成
# ====================================
echo "⚙️  Creating OpenSSL configuration..."
OPENSSL_CNF=$(mktemp)
cat > "$OPENSSL_CNF" << 'EOF'
[req]
default_bits = 2048
prompt = no
default_md = sha256
x509_extensions = v3_req
distinguished_name = dn

[dn]
C = JP
ST = Tokyo
L = Tokyo
O = Development
CN = localhost

[v3_req]
subjectAltName = @alt_names
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

echo "  ✅ OpenSSL configuration created"
echo ""

# ====================================
# 秘密鍵の生成
# ====================================
echo "🔑 Generating private key..."
openssl genrsa -out ./backend/certs/server.key 2048
echo "  ✅ Private key generated"
echo ""

# ====================================
# 証明書の生成
# ====================================
echo "📜 Generating SSL certificate..."
openssl req -new -x509 -sha256 -days 365 \
  -key ./backend/certs/server.key \
  -out ./backend/certs/server.crt \
  -config "$OPENSSL_CNF" \
  -extensions v3_req

echo "  ✅ Certificate generated (valid for 365 days)"
echo ""

# ====================================
# PEM形式の証明書を作成
# ====================================
echo "📦 Creating PEM format certificate..."
cat ./backend/certs/server.crt ./backend/certs/server.key > ./backend/certs/server.pem
echo "  ✅ PEM certificate created"
echo ""

# ====================================
# 証明書をfrontendにコピー
# ====================================
echo "📋 Copying certificates to frontend/certs/..."
cp ./backend/certs/server.key ./frontend/certs/server.key
cp ./backend/certs/server.crt ./frontend/certs/server.crt
cp ./backend/certs/server.pem ./frontend/certs/server.pem
echo "  ✅ Copied to frontend/certs/"
echo ""

# ====================================
# 権限設定
# ====================================
echo "🔐 Setting file permissions..."
# Backend certs directory
chmod 600 ./backend/certs/server.key
chmod 644 ./backend/certs/server.crt
chmod 600 ./backend/certs/server.pem

# Frontend certs directory
chmod 600 ./frontend/certs/server.key
chmod 644 ./frontend/certs/server.crt
chmod 600 ./frontend/certs/server.pem

echo "  ✅ Permissions set correctly"
echo ""

# ====================================
# クリーンアップ
# ====================================
echo "🧹 Cleaning up temporary files..."
rm -f "$OPENSSL_CNF"
echo "  ✅ Cleanup complete"
echo ""

# ====================================
# 完了メッセージ
# ====================================
echo "============================================"
echo "✅ SSL Certificates Generated Successfully!"
echo "============================================"
echo ""
echo "📁 Generated files in ./backend/certs/:"
echo "  - server.key (Private key)"
echo "  - server.crt (Certificate)"
echo "  - server.pem (Combined PEM format)"
echo ""
echo "📁 Copied to ./frontend/certs/"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "    Your browser will show a security warning - this is normal."
echo ""
echo "💡 For production, use certificates from a trusted CA."
echo ""
