#!/bin/bash

# SSL証明書生成スクリプト（開発環境用）
# Generate SSL certificates for development

CERT_DIR="./certs"

# ディレクトリ作成
mkdir -p "$CERT_DIR"

echo "Generating SSL certificates for development..."

# 秘密鍵の生成
openssl genrsa -out "$CERT_DIR/server.key" 2048

# CSR (Certificate Signing Request) の生成
openssl req -new -key "$CERT_DIR/server.key" -out "$CERT_DIR/server.csr" \
  -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Development/CN=localhost"

# 自己署名証明書の生成（有効期限365日）
openssl x509 -req -days 365 -in "$CERT_DIR/server.csr" \
  -signkey "$CERT_DIR/server.key" -out "$CERT_DIR/server.crt" \
  -extfile <(printf "subjectAltName=DNS:localhost,IP:127.0.0.1")

# PEM形式の証明書を作成
cat "$CERT_DIR/server.crt" "$CERT_DIR/server.key" > "$CERT_DIR/server.pem"

echo "✓ SSL certificates generated successfully in $CERT_DIR/"
echo ""
echo "Generated files:"
echo "  - server.key (Private key)"
echo "  - server.crt (Certificate)"
echo "  - server.pem (Combined PEM format)"
echo ""
echo "Note: These are self-signed certificates for development only."
echo "For production, use certificates from a trusted CA."

# 権限設定
chmod 600 "$CERT_DIR/server.key"
chmod 644 "$CERT_DIR/server.crt"
chmod 600 "$CERT_DIR/server.pem"

echo "✓ Permissions set correctly"
