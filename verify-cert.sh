#!/bin/bash
set -e

echo "============================================"
echo "🔍 SSL Certificate Verification Tool"
echo "============================================"
echo ""

# Check if certificate exists
if [ ! -f ./backend/certs/server.crt ]; then
  echo "❌ Error: Certificate not found at ./backend/certs/server.crt"
  echo ""
  echo "Please run ./setup.sh to generate certificates first."
  exit 1
fi

echo "📄 Certificate found: ./backend/certs/server.crt"
echo ""

echo "============================================"
echo "🔐 Certificate Details"
echo "============================================"
openssl x509 -in ./backend/certs/server.crt -noout -text | grep -A 2 "Subject:"
echo ""

echo "============================================"
echo "📅 Validity Period"
echo "============================================"
openssl x509 -in ./backend/certs/server.crt -noout -dates
echo ""

echo "============================================"
echo "🔑 Key Algorithm and Size"
echo "============================================"
openssl x509 -in ./backend/certs/server.crt -noout -text | grep "Public Key Algorithm" -A 1
echo ""

echo "============================================"
echo "🔒 Signature Algorithm"
echo "============================================"
openssl x509 -in ./backend/certs/server.crt -noout -text | grep "Signature Algorithm" | head -1
echo ""

echo "============================================"
echo "🦊 Firefox Compatibility Check"
echo "============================================"
echo ""

# Check for SubjectAltName
if openssl x509 -in ./backend/certs/server.crt -noout -text | grep -q "Subject Alternative Name"; then
  echo "✅ SubjectAltName (SAN) is present"
  openssl x509 -in ./backend/certs/server.crt -noout -text | grep -A 1 "Subject Alternative Name"
else
  echo "❌ SubjectAltName (SAN) is MISSING - Firefox will reject this certificate!"
fi
echo ""

# Check for Key Usage
if openssl x509 -in ./backend/certs/server.crt -noout -text | grep -q "Key Usage"; then
  echo "✅ Key Usage extension is present"
  openssl x509 -in ./backend/certs/server.crt -noout -text | grep -A 1 "X509v3 Key Usage"
else
  echo "⚠️  Key Usage extension is missing"
fi
echo ""

# Check for Extended Key Usage
if openssl x509 -in ./backend/certs/server.crt -noout -text | grep -q "Extended Key Usage"; then
  echo "✅ Extended Key Usage is present"
  openssl x509 -in ./backend/certs/server.crt -noout -text | grep -A 1 "X509v3 Extended Key Usage"
else
  echo "⚠️  Extended Key Usage is missing"
fi
echo ""

# Check signature algorithm
if openssl x509 -in ./backend/certs/server.crt -noout -text | grep "Signature Algorithm" | grep -q "sha256"; then
  echo "✅ Using SHA-256 (secure)"
elif openssl x509 -in ./backend/certs/server.crt -noout -text | grep "Signature Algorithm" | grep -q "sha1"; then
  echo "❌ Using SHA-1 (deprecated, Firefox may reject)"
else
  echo "⚠️  Unknown signature algorithm"
fi
echo ""

# Check key size
KEY_SIZE=$(openssl x509 -in ./backend/certs/server.crt -noout -text | grep "Public-Key:" | sed 's/[^0-9]*//g')
if [ "$KEY_SIZE" -ge 2048 ]; then
  echo "✅ Key size: ${KEY_SIZE} bits (sufficient)"
else
  echo "❌ Key size: ${KEY_SIZE} bits (too small, minimum 2048 required)"
fi
echo ""

echo "============================================"
echo "📝 Summary"
echo "============================================"
echo ""

# Count checks
CHECKS_PASSED=0
CHECKS_TOTAL=5

openssl x509 -in ./backend/certs/server.crt -noout -text | grep -q "Subject Alternative Name" && CHECKS_PASSED=$((CHECKS_PASSED + 1))
openssl x509 -in ./backend/certs/server.crt -noout -text | grep -q "Key Usage" && CHECKS_PASSED=$((CHECKS_PASSED + 1))
openssl x509 -in ./backend/certs/server.crt -noout -text | grep -q "Extended Key Usage" && CHECKS_PASSED=$((CHECKS_PASSED + 1))
openssl x509 -in ./backend/certs/server.crt -noout -text | grep "Signature Algorithm" | grep -q "sha256" && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ "$KEY_SIZE" -ge 2048 ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))

echo "Checks passed: ${CHECKS_PASSED}/${CHECKS_TOTAL}"
echo ""

if [ "$CHECKS_PASSED" -eq "$CHECKS_TOTAL" ]; then
  echo "🎉 Certificate meets all Firefox requirements!"
  echo "✅ This certificate should work in Firefox (with manual acceptance)"
elif [ "$CHECKS_PASSED" -ge 3 ]; then
  echo "⚠️  Certificate meets most requirements but may have issues"
  echo "💡 Consider regenerating with ./setup.sh"
else
  echo "❌ Certificate does NOT meet Firefox requirements"
  echo "🔄 Please regenerate certificates with ./setup.sh"
fi
echo ""

echo "============================================"
echo "💡 Recommendations"
echo "============================================"
echo ""
echo "For the best development experience:"
echo "  1. Install mkcert: brew install mkcert (macOS)"
echo "  2. Run: ./setup.sh"
echo "  3. mkcert certificates work without warnings in all browsers"
echo ""
echo "To test the certificate in Firefox:"
echo "  1. Visit https://localhost:3001 in Firefox"
echo "  2. Accept the certificate exception"
echo "  3. Visit https://localhost:5173 and accept again"
echo ""
