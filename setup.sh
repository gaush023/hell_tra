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
# Step 2: HTTPS Certificate Setup (No sudo, no mkcert)
# ====================================
echo "🔒 Step 2: Generating HTTPS certificates (sudo-free)..."

# Create cert directories
mkdir -p ./backend/certs
mkdir -p ./frontend/certs

echo "  📜 Generating self-signed certificate with OpenSSL..."

# Create OpenSSL config
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

# Generate private key
openssl genrsa -out ./backend/certs/server.key 2048

# Generate certificate
openssl req -new -x509 -sha256 -days 365 \
  -key ./backend/certs/server.key \
  -out ./backend/certs/server.crt \
  -config ./backend/certs/openssl.cnf \
  -extensions v3_req

# Combine PEM
cat ./backend/certs/server.crt ./backend/certs/server.key > ./backend/certs/server.pem

# Copy to frontend
cp ./backend/certs/server.crt ./frontend/certs/server.crt
cp ./backend/certs/server.key ./frontend/certs/server.key
cp ./backend/certs/server.pem ./frontend/certs/server.pem

# Cleanup
rm ./backend/certs/openssl.cnf

echo "  ✅ Self-signed certificates generated (no sudo required)"
echo "  ⚠️ Browsers will warn about security — this is normal for self-signed certificates."

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
