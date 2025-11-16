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

# Ensure HTTPS_ENABLED is set
if ! grep -q "HTTPS_ENABLED=" backend/.env; then
  echo "HTTPS_ENABLED=true" >> backend/.env
  echo "  ✅ Enabled HTTPS in backend/.env"
elif grep -q "HTTPS_ENABLED=false" backend/.env; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^HTTPS_ENABLED=.*|HTTPS_ENABLED=true|" backend/.env
  else
    sed -i "s|^HTTPS_ENABLED=.*|HTTPS_ENABLED=true|" backend/.env
  fi
  echo "  ✅ Enabled HTTPS in backend/.env"
fi

echo ""

# ====================================
# Step 2: Docker .env Setup
# ====================================
echo "🐳 Step 2: Setting up .env.docker for Docker deployment..."

if [ ! -f .env.docker ]; then
  cp .env.docker.example .env.docker
  echo "  ✅ Copied .env.docker.example → .env.docker"
else
  echo "  ℹ️  .env.docker already exists"
fi

# Ensure JWT_SECRET is strong
if ! grep -q "JWT_SECRET=" .env.docker || grep -q "JWT_SECRET=CHANGE-THIS-TO-RANDOM-SECRET" .env.docker; then
  JWT_SECRET=$(openssl rand -base64 32)
  if grep -q "JWT_SECRET=" .env.docker; then
    # Update existing JWT_SECRET
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.docker
    else
      sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env.docker
    fi
  else
    # Add JWT_SECRET
    echo "JWT_SECRET=${JWT_SECRET}" >> .env.docker
  fi
  echo "  ✅ Generated secure JWT_SECRET for Docker"
fi

echo ""

# ====================================
# Step 3: HTTPS Certificate Setup
# ====================================
echo "🔒 Step 3: Generating HTTPS certificates..."

# 証明書生成スクリプトを実行
if [ -f ./generate-certs.sh ]; then
  bash ./generate-certs.sh
else
  echo "  ❌ Error: generate-certs.sh not found"
  exit 1
fi

# ====================================
# Step 4: Environment Selection
# ====================================
echo "🔧 Step 4: Environment Configuration..."
echo ""
echo "Choose your deployment environment:"
echo "  [1] Development mode (npm run dev) - Default ports"
echo "  [2] Docker rootless mode - Ports 8080/8443"
echo "  [3] Docker standard mode - Ports 80/443"
echo ""
read -p "Enter your choice [1-3] (default: 1): " -r ENV_CHOICE
echo ""

# Set default to 1 if empty
ENV_CHOICE=${ENV_CHOICE:-1}

case $ENV_CHOICE in
  1)
    BACKEND_URL="https://localhost:3001"
    FRONTEND_URL="https://localhost:5173"
    FRONTEND_PORT="5173"
    echo "  ✅ Selected: Development mode"
    ;;
  2)
    BACKEND_URL="https://localhost:3001"
    FRONTEND_URL="https://localhost:8443"
    FRONTEND_PORT="8443"
    echo "  ✅ Selected: Docker rootless mode (ports 8080/8443)"
    ;;
  3)
    BACKEND_URL="https://localhost:3001"
    FRONTEND_URL="https://localhost"
    FRONTEND_PORT="443"
    echo "  ✅ Selected: Docker standard mode (ports 80/443)"
    ;;
  *)
    echo "  ⚠️  Invalid choice, using Development mode"
    BACKEND_URL="https://localhost:3001"
    FRONTEND_URL="https://localhost:5173"
    FRONTEND_PORT="5173"
    ;;
esac

echo ""

# ====================================
# Step 5: Backend .env Setup
# ====================================
echo "📋 Step 5: Updating backend/.env with environment-specific configuration..."

# Update FRONTEND_URL in backend/.env
if [[ "$OSTYPE" == "darwin"* ]]; then
  sed -i '' "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_URL}|" backend/.env
else
  sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=${FRONTEND_URL}|" backend/.env
fi

echo "  ✅ Backend FRONTEND_URL set to: ${FRONTEND_URL}"

echo ""

# ====================================
# Step 6: Frontend .env Setup
# ====================================
echo "🌐 Step 6: Setting up frontend/.env..."

# Copy from example if .env doesn't exist
if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "  ✅ Copied frontend/.env.example → frontend/.env"
else
  echo "  ℹ️  frontend/.env already exists"
fi

# Update or add API URL
if grep -q "^VITE_API_BASE_URL=" frontend/.env; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${BACKEND_URL}/api|" frontend/.env
  else
    sed -i "s|^VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${BACKEND_URL}/api|" frontend/.env
  fi
else
  # Uncomment or add the line
  if grep -q "^# VITE_API_BASE_URL=" frontend/.env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^# VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${BACKEND_URL}/api|" frontend/.env
    else
      sed -i "s|^# VITE_API_BASE_URL=.*|VITE_API_BASE_URL=${BACKEND_URL}/api|" frontend/.env
    fi
  else
    echo "VITE_API_BASE_URL=${BACKEND_URL}/api" >> frontend/.env
  fi
fi

# Update or add WebSocket URL
if grep -q "^VITE_WS_URL=" frontend/.env; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^VITE_WS_URL=.*|VITE_WS_URL=wss://localhost:3001/ws|" frontend/.env
  else
    sed -i "s|^VITE_WS_URL=.*|VITE_WS_URL=wss://localhost:3001/ws|" frontend/.env
  fi
else
  # Uncomment or add the line
  if grep -q "^# VITE_WS_URL=" frontend/.env; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^# VITE_WS_URL=.*|VITE_WS_URL=wss://localhost:3001/ws|" frontend/.env
    else
      sed -i "s|^# VITE_WS_URL=.*|VITE_WS_URL=wss://localhost:3001/ws|" frontend/.env
    fi
  else
    echo "VITE_WS_URL=wss://localhost:3001/ws" >> frontend/.env
  fi
fi

echo "  ✅ Updated frontend/.env"
echo "     API URL: ${BACKEND_URL}/api"
echo "     WebSocket URL: wss://localhost:3001/ws"

echo ""

# ====================================
# Step 6.5: Fix Vite Port Configuration
# ====================================
echo "🔧 Step 6.5: Fixing Vite port configuration..."

# Update vite.config.ts to use the correct port
if [ -f frontend/vite.config.ts ]; then
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/port: 3000/port: 5173/' frontend/vite.config.ts
  else
    sed -i 's/port: 3000/port: 5173/' frontend/vite.config.ts
  fi
  echo "  ✅ Updated Vite port to 5173"
else
  echo "  ⚠️  frontend/vite.config.ts not found"
fi

echo ""

# ====================================
# Step 7: Dependencies Installation
# ====================================
echo "📦 Step 7: Installing dependencies..."

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
# Step 8: Docker Setup (Optional)
# ====================================
echo "🐳 Step 8: Docker setup..."

read -p "Do you want to build Docker images? (y/N): " -r REPLY
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
echo "  - backend/certs/*            (Backend SSL certificates)"
echo "  - frontend/certs/*           (Frontend SSL certificates)"
echo "  - backend/.env               (Backend configuration with HTTPS_ENABLED=true)"
echo "  - frontend/.env              (Frontend configuration)"
echo "  - .env.docker                (Docker deployment configuration)"
echo ""
echo "🚀 To start the application:"
echo ""

case $ENV_CHOICE in
  1)
    echo "  Development mode:"
    echo "    Terminal 1: cd backend && npm run dev"
    echo "    Terminal 2: cd frontend && npm run dev"
    echo ""
    echo "  🌐 Access URLs:"
    echo "    Frontend: ${FRONTEND_URL}"
    echo "    Backend:  ${BACKEND_URL}"
    ;;
  2)
    echo "  Docker rootless mode:"
    echo "    docker-compose up"
    echo ""
    echo "  🌐 Access URLs:"
    echo "    Frontend: ${FRONTEND_URL} (HTTP: http://localhost:8080)"
    echo "    Backend:  ${BACKEND_URL}"
    ;;
  3)
    echo "  Docker standard mode (requires sudo):"
    echo "    sudo docker-compose -f docker-compose.standard.yml up"
    echo ""
    echo "  🌐 Access URLs:"
    echo "    Frontend: ${FRONTEND_URL} (HTTP: http://localhost)"
    echo "    Backend:  ${BACKEND_URL}"
    ;;
esac

echo ""
echo "🔒 Certificate Info:"
echo "  ⚠️  Using OpenSSL self-signed certificates"
echo "  📝 Your browser will show a security warning - this is normal"
echo "  💡 You can safely proceed for development"
echo ""
