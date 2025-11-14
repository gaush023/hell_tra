#!/bin/bash
set -e

echo "============================================"
echo "🚀 Transcendence Complete Setup"
echo "============================================"
echo ""

# ====================================
# Step 1: Backend .env Setup
# ====================================
echo "📋 Step 1: Setting up backend/.env..."

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "  ✅ Copied backend/.env.example → backend/.env"
else
  echo "  ℹ️  backend/.env already exists"
fi

# Ensure JWT_SECRET is strong
if ! grep -q "JWT_SECRET=" backend/.env || grep -q "JWT_SECRET=your-secret-key" backend/.env; then
  JWT_SECRET=$(openssl rand -base64 32)
  if grep -q "JWT_SECRET=" backend/.env; then
    # Update existing JWT_SECRET
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" backend/.env
    else
      sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" backend/.env
    fi
  else
    # Add JWT_SECRET
    echo "JWT_SECRET=${JWT_SECRET}" >> backend/.env
  fi
  echo "  ✅ Generated secure JWT_SECRET"
fi

echo ""

# ====================================
# Step 2: HTTPS Certificate Setup
# ====================================
echo "🔒 Step 2: Setting up HTTPS certificates..."

# Create certs directories for backend and frontend
mkdir -p ./backend/certs
mkdir -p ./frontend/certs

# Check if certificates already exist (check backend location)
if [ -f ./backend/certs/server.key ] && [ -f ./backend/certs/server.crt ]; then
  echo "  ℹ️  Certificates already exist in ./backend/certs/ and ./frontend/certs/"

  # Ask if user wants to regenerate
  read -p "  Do you want to regenerate certificates? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "  ⏭️  Skipping certificate generation"
    SKIP_CERT=true
  fi
fi

if [ -z "$SKIP_CERT" ]; then
  # Try mkcert first (recommended for development)
  MKCERT_SUCCESS=false
  if command -v mkcert &> /dev/null; then
    echo "  📜 Using mkcert to generate certificates..."

    # Use custom CAROOT to avoid permission issues (no sudo required)
    export CAROOT="$HOME/.mkcert-local"
    mkdir -p "$CAROOT"

    echo "  ℹ️  Using custom CAROOT: $CAROOT (no sudo required)"

    # Install local CA (no sudo required)
    if mkcert -install 2>/dev/null; then
      echo "  ✅ mkcert CA installed successfully"

      # Generate certificates directly into backend/certs
      cd ./backend/certs
      if mkcert localhost 127.0.0.1 ::1 2>/dev/null; then
        # Find generated certificate files (filenames vary)
        CERT_NAME=$(ls localhost*.pem 2>/dev/null | grep -v 'key' | head -n 1)
        KEY_NAME=$(ls localhost*-key.pem 2>/dev/null | head -n 1)

        if [ -n "$CERT_NAME" ] && [ -n "$KEY_NAME" ]; then
          mv "$CERT_NAME" server.crt
          mv "$KEY_NAME" server.key
          cd ../..

          # Create PEM format for backend
          cat ./backend/certs/server.crt ./backend/certs/server.key > ./backend/certs/server.pem

          # Copy certificates to frontend
          cp ./backend/certs/server.crt ./frontend/certs/server.crt
          cp ./backend/certs/server.key ./frontend/certs/server.key
          cp ./backend/certs/server.pem ./frontend/certs/server.pem

          echo "  ✅ Certificates generated with mkcert (no sudo required)"
          MKCERT_SUCCESS=true
        else
          cd ../.. 2>/dev/null || true
          echo "  ⚠️  Could not find generated certificate files"
          echo "  ℹ️  Falling back to OpenSSL..."
        fi
      else
        cd ../.. 2>/dev/null || true
        echo "  ⚠️  mkcert certificate generation failed"
        echo "  ℹ️  Falling back to OpenSSL..."
      fi
    else
      echo "  ⚠️  Failed to install mkcert CA"
      echo "  💡 Tip: mkcert is using CAROOT=$CAROOT"
      echo "  ℹ️  Falling back to OpenSSL..."
    fi
  fi

  # Fallback to OpenSSL if mkcert failed or is not available
  if [ "$MKCERT_SUCCESS" = false ]; then
    echo "  ℹ️  Using openssl to generate self-signed certificates..."

    # Create OpenSSL config for Firefox compatibility
    cat > ./backend/certs/openssl.cnf << 'EOF'
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

    # Generate private key for backend
    openssl genrsa -out ./backend/certs/server.key 2048

    # Generate self-signed certificate with proper extensions for Firefox
    openssl req -new -x509 -sha256 -days 365 \
      -key ./backend/certs/server.key \
      -out ./backend/certs/server.crt \
      -config ./backend/certs/openssl.cnf \
      -extensions v3_req

    # Create PEM format for backend
    cat ./backend/certs/server.crt ./backend/certs/server.key > ./backend/certs/server.pem

    # Copy certificates to frontend
    cp ./backend/certs/server.crt ./frontend/certs/server.crt
    cp ./backend/certs/server.key ./frontend/certs/server.key
    cp ./backend/certs/server.pem ./frontend/certs/server.pem

    # Clean up config file
    rm ./backend/certs/openssl.cnf

    echo "  ✅ Self-signed certificates generated with openssl"
    echo ""
    echo "  ⚠️  Firefox Security Warning:"
    echo "  Browsers will show security warnings for self-signed certificates."
    echo ""
    echo "  🦊 For Firefox, you need to manually accept the certificate:"
    echo "    1. Visit https://localhost:3001 in Firefox"
    echo "    2. Click 'Advanced' → 'Accept the Risk and Continue'"
    echo "    3. Visit https://localhost:5173 and repeat"
    echo ""
    echo "  💡 Recommended: Install mkcert for trusted local certificates"
    echo "    macOS:   brew install mkcert"
    echo "    Linux:   apt install mkcert / yum install mkcert"
    echo "    Windows: choco install mkcert"
  fi  # End of MKCERT_SUCCESS check

  # Set proper permissions for backend certificates
  chmod 600 ./backend/certs/server.key 2>/dev/null || true
  chmod 644 ./backend/certs/server.crt 2>/dev/null || true
  chmod 600 ./backend/certs/server.pem 2>/dev/null || true

  # Set proper permissions for frontend certificates
  chmod 600 ./frontend/certs/server.key 2>/dev/null || true
  chmod 644 ./frontend/certs/server.crt 2>/dev/null || true
  chmod 600 ./frontend/certs/server.pem 2>/dev/null || true

  echo "  ✅ Certificate permissions set"
fi  # End of SKIP_CERT check

# Update backend/.env to enable HTTPS and set certificate paths
# Note: Paths are relative to backend directory, so we use certs/ (in the same directory)
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's|^HTTPS_ENABLED=.*|HTTPS_ENABLED=true|' backend/.env
  sed -i '' 's|^SSL_KEY_PATH=.*|SSL_KEY_PATH=certs/server.key|' backend/.env
  sed -i '' 's|^SSL_CERT_PATH=.*|SSL_CERT_PATH=certs/server.crt|' backend/.env
  sed -i '' 's|^FRONTEND_URL=.*|FRONTEND_URL=https://localhost:5173|' backend/.env
else
  sed -i 's|^HTTPS_ENABLED=.*|HTTPS_ENABLED=true|' backend/.env
  sed -i 's|^SSL_KEY_PATH=.*|SSL_KEY_PATH=certs/server.key|' backend/.env
  sed -i 's|^SSL_CERT_PATH=.*|SSL_CERT_PATH=certs/server.crt|' backend/.env
  sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=https://localhost:5173|' backend/.env
fi

echo "  ✅ Updated backend/.env with HTTPS configuration"

echo ""

# ====================================
# Step 3: Frontend .env Setup
# ====================================
echo "🌐 Step 3: Setting up frontend/.env..."

# Create frontend/.env with proper HTTPS URLs
cat > frontend/.env << 'EOF'
# ================================
# API Configuration
# ================================

# Backend API Base URL
VITE_API_BASE_URL=https://localhost:3001/api

# WebSocket URL
VITE_WS_URL=wss://localhost:3001/ws
EOF

echo "  ✅ Created frontend/.env with HTTPS configuration"

echo ""

# ====================================
# Step 4: Dependencies Installation
# ====================================
echo "📦 Step 4: Installing dependencies..."

if [ -d backend/node_modules ]; then
  echo "  ℹ️  Backend dependencies already installed"
else
  echo "  Installing backend dependencies..."
  (cd backend && npm install)
  echo "  ✅ Backend dependencies installed"
fi

if [ -d frontend/node_modules ]; then
  echo "  ℹ️  Frontend dependencies already installed"
else
  echo "  Installing frontend dependencies..."
  (cd frontend && npm install)
  echo "  ✅ Frontend dependencies installed"
fi

echo ""

# ====================================
# Step 5: Docker Setup (Optional)
# ====================================
echo "🐳 Step 5: Docker setup..."

read -p "Do you want to build Docker images? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "  Building Docker images..."
    docker-compose build
    echo "  ✅ Docker images built"
  else
    echo "  ⚠️  Docker or docker-compose not found. Skipping."
  fi
else
  echo "  ⏭️  Skipping Docker build"
fi

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "📁 Generated files:"
echo "  - backend/certs/server.key   (Backend private key)"
echo "  - backend/certs/server.crt   (Backend certificate)"
echo "  - backend/certs/server.pem   (Backend combined PEM)"
echo "  - frontend/certs/server.key  (Frontend private key)"
echo "  - frontend/certs/server.crt  (Frontend certificate)"
echo "  - frontend/certs/server.pem  (Frontend combined PEM)"
echo "  - backend/.env               (Backend configuration)"
echo "  - frontend/.env              (Frontend configuration)"
echo ""
echo "🚀 To start the application:"
echo ""
echo "  Option 1: Development mode (recommended)"
echo "    Terminal 1: cd backend && npm run dev"
echo "    Terminal 2: cd frontend && npm run dev"
echo ""
echo "  Option 2: Docker"
echo "    docker-compose up"
echo ""
echo "🌐 Access URLs:"
echo "  Frontend: https://localhost:5173"
echo "  Backend:  https://localhost:3001"
echo ""
echo "🔒 Certificate Info:"
if [ "$MKCERT_SUCCESS" = true ]; then
  echo "  ✅ Using mkcert certificates (trusted, no browser warnings)"
  echo "  📁 CA Root: $HOME/.mkcert-local"
else
  echo "  ⚠️  Using OpenSSL self-signed certificates"
  echo "  📝 Your browser will show a security warning"
  echo "  💡 You can safely proceed for development"
  echo "  💡 Or install mkcert for trusted certificates:"
  echo "     macOS:   brew install mkcert"
  echo "     Linux:   apt install mkcert"
fi
echo ""
