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

# Create certs directory
mkdir -p ./certs

# Check if certificates already exist
if [ -f ./certs/server.key ] && [ -f ./certs/server.crt ]; then
  echo "  ℹ️  Certificates already exist in ./certs/"

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
  if command -v mkcert &> /dev/null; then
    echo "  📜 Using mkcert to generate certificates..."

    # Ensure mkcert CA is installed
    if ! mkcert -CAROOT &> /dev/null; then
      echo "  Installing mkcert CA..."
      mkcert -install
    fi

    # Generate certificates
    cd ./certs
    mkcert localhost 127.0.0.1 ::1
    mv localhost+2.pem server.crt
    mv localhost+2-key.pem server.key
    cd ..

    # Create PEM format
    cat ./certs/server.crt ./certs/server.key > ./certs/server.pem

    echo "  ✅ Certificates generated with mkcert"
  else
    echo "  ℹ️  mkcert not found, using openssl (self-signed certificates)..."

    # Generate with openssl
    openssl genrsa -out ./certs/server.key 2048

    openssl req -new -key ./certs/server.key -out ./certs/server.csr \
      -subj "/C=JP/ST=Tokyo/L=Tokyo/O=Development/CN=localhost"

    openssl x509 -req -days 365 -in ./certs/server.csr \
      -signkey ./certs/server.key -out ./certs/server.crt \
      -extfile <(printf "subjectAltName=DNS:localhost,IP:127.0.0.1")

    # Create PEM format
    cat ./certs/server.crt ./certs/server.key > ./certs/server.pem

    # Clean up CSR
    rm ./certs/server.csr

    echo "  ✅ Self-signed certificates generated with openssl"
    echo "  ⚠️  Note: Browsers will show security warnings for self-signed certificates"
    echo "  💡 Tip: Install mkcert for trusted local certificates (brew install mkcert)"
  fi

  # Set proper permissions
  chmod 600 ./certs/server.key
  chmod 644 ./certs/server.crt
  chmod 600 ./certs/server.pem

  echo "  ✅ Certificate permissions set"
fi

# Update backend/.env to enable HTTPS and set certificate paths
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's|^HTTPS_ENABLED=.*|HTTPS_ENABLED=true|' backend/.env
  sed -i '' 's|^SSL_KEY_PATH=.*|SSL_KEY_PATH=../certs/server.key|' backend/.env
  sed -i '' 's|^SSL_CERT_PATH=.*|SSL_CERT_PATH=../certs/server.crt|' backend/.env
  sed -i '' 's|^FRONTEND_URL=.*|FRONTEND_URL=https://localhost:5173|' backend/.env
else
  sed -i 's|^HTTPS_ENABLED=.*|HTTPS_ENABLED=true|' backend/.env
  sed -i 's|^SSL_KEY_PATH=.*|SSL_KEY_PATH=../certs/server.key|' backend/.env
  sed -i 's|^SSL_CERT_PATH=.*|SSL_CERT_PATH=../certs/server.crt|' backend/.env
  sed -i 's|^FRONTEND_URL=.*|FRONTEND_URL=https://localhost:5173|' backend/.env
fi

echo "  ✅ Updated backend/.env with HTTPS configuration"

echo ""

# ====================================
# Step 3: Frontend .env Setup
# ====================================
echo "🌐 Step 3: Setting up frontend/.env..."

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "  ✅ Copied frontend/.env.example → frontend/.env"
else
  echo "  ℹ️  frontend/.env already exists"
fi

# Update frontend .env to use HTTPS
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' 's|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://localhost:3001|' frontend/.env || echo "VITE_API_BASE_URL=https://localhost:3001" >> frontend/.env
else
  sed -i 's|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://localhost:3001|' frontend/.env || echo "VITE_API_BASE_URL=https://localhost:3001" >> frontend/.env
fi

echo "  ✅ Updated frontend/.env with HTTPS configuration"

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
echo "  - ./certs/server.key         (Private key)"
echo "  - ./certs/server.crt         (Certificate)"
echo "  - ./certs/server.pem         (Combined PEM)"
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
echo "⚠️  Note: If using self-signed certificates, your browser will show"
echo "   a security warning. You can safely proceed for development."
echo ""
