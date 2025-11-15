#!/bin/bash
set -e

echo "============================================"
echo "🧹 Transcendence Cleanup"
echo "============================================"
echo ""
echo "⚠️  This script will remove files created by setup.sh:"
echo "  - backend/.env"
echo "  - frontend/.env"
echo "  - .env.docker"
echo "  - certs/ directory"
echo "  - backend/certs/ directory"
echo ""

read -p "Do you want to continue? (y/N): " -r REPLY
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Cleanup cancelled"
  exit 0
fi

echo "🧹 Starting cleanup..."
echo ""

# ====================================
# Step 1: Remove .env files
# ====================================
echo "📋 Step 1: Removing environment files..."

if [ -f backend/.env ]; then
  rm backend/.env
  echo "  ✅ Removed backend/.env"
else
  echo "  ℹ️  backend/.env not found"
fi

if [ -f frontend/.env ]; then
  rm frontend/.env
  echo "  ✅ Removed frontend/.env"
else
  echo "  ℹ️  frontend/.env not found"
fi

if [ -f .env.docker ]; then
  rm .env.docker
  echo "  ✅ Removed .env.docker"
else
  echo "  ℹ️  .env.docker not found"
fi

echo ""

# ====================================
# Step 2: Remove certificates
# ====================================
echo "🔒 Step 2: Removing certificates..."

if [ -d certs ]; then
  rm -rf certs
  echo "  ✅ Removed certs/ directory"
else
  echo "  ℹ️  certs/ directory not found"
fi

if [ -d backend/certs ]; then
  rm -rf backend/certs
  echo "  ✅ Removed backend/certs/ directory"
else
  echo "  ℹ️  backend/certs/ directory not found"
fi

echo ""

# ====================================
# Step 3: Optional - Remove node_modules
# ====================================
echo "📦 Step 3: Node modules cleanup (optional)..."
echo ""
read -p "Do you want to remove node_modules? (y/N): " -r REMOVE_DEPS
echo

if [[ $REMOVE_DEPS =~ ^[Yy]$ ]]; then
  if [ -d backend/node_modules ]; then
    rm -rf backend/node_modules
    echo "  ✅ Removed backend/node_modules"
  else
    echo "  ℹ️  backend/node_modules not found"
  fi

  if [ -d frontend/node_modules ]; then
    rm -rf frontend/node_modules
    echo "  ✅ Removed frontend/node_modules"
  else
    echo "  ℹ️  frontend/node_modules not found"
  fi
else
  echo "  ⏭️  Skipping node_modules removal"
fi

echo ""

# ====================================
# Step 4: Optional - Docker cleanup
# ====================================
echo "🐳 Step 4: Docker cleanup (optional)..."
echo ""
read -p "Do you want to stop and remove Docker containers and volumes? (y/N): " -r REMOVE_DOCKER
echo

if [[ $REMOVE_DOCKER =~ ^[Yy]$ ]]; then
  if command -v docker-compose &> /dev/null; then
    if [ -f docker-compose.yml ]; then
      echo "  Stopping and removing containers, networks, and volumes..."
      docker-compose down -v
      echo "  ✅ Docker containers and volumes removed"

      read -p "Do you want to remove Docker images? (y/N): " -r REMOVE_IMAGES
      echo
      if [[ $REMOVE_IMAGES =~ ^[Yy]$ ]]; then
        docker-compose down --rmi all -v
        echo "  ✅ Docker images removed"
      fi
    else
      echo "  ℹ️  docker-compose.yml not found"
    fi
  else
    echo "  ℹ️  docker-compose not found"
  fi
else
  echo "  ⏭️  Skipping Docker cleanup"
fi

echo ""

# ====================================
# Step 5: Optional - Database cleanup
# ====================================
echo "🗄️  Step 5: Database cleanup (optional)..."
echo ""
read -p "Do you want to remove database files? (y/N): " -r REMOVE_DB
echo

if [[ $REMOVE_DB =~ ^[Yy]$ ]]; then
  if [ -f backend/database.db ]; then
    rm backend/database.db
    echo "  ✅ Removed backend/database.db"
  else
    echo "  ℹ️  backend/database.db not found"
  fi

  if [ -f database.db ]; then
    rm database.db
    echo "  ✅ Removed database.db"
  else
    echo "  ℹ️  database.db not found"
  fi
else
  echo "  ⏭️  Skipping database removal"
fi

echo ""

# ====================================
# Step 6: Optional - Uploads cleanup
# ====================================
echo "📁 Step 6: Uploads cleanup (optional)..."
echo ""
read -p "Do you want to remove uploaded files? (y/N): " -r REMOVE_UPLOADS
echo

if [[ $REMOVE_UPLOADS =~ ^[Yy]$ ]]; then
  if [ -d backend/uploads ]; then
    rm -rf backend/uploads
    echo "  ✅ Removed backend/uploads/ directory"
  else
    echo "  ℹ️  backend/uploads/ directory not found"
  fi

  if [ -d uploads ]; then
    rm -rf uploads
    echo "  ✅ Removed uploads/ directory"
  else
    echo "  ℹ️  uploads/ directory not found"
  fi
else
  echo "  ⏭️  Skipping uploads removal"
fi

echo ""
echo "============================================"
echo "✅ Cleanup Complete!"
echo "============================================"
echo ""
echo "📝 To restore the environment, run:"
echo "  ./setup.sh"
echo ""
