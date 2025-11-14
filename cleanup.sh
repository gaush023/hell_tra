#!/bin/bash
set -e

echo "============================================"
echo "🧹 Transcendence Cleanup Tool"
echo "============================================"
echo ""
echo "This script will help you clean up development artifacts."
echo ""

# Function to display size of a directory/file
get_size() {
  if [ -e "$1" ]; then
    du -sh "$1" 2>/dev/null | cut -f1
  else
    echo "N/A"
  fi
}

# Function to check if directory exists and has content
check_exists() {
  if [ -e "$1" ]; then
    echo "✓ Found"
  else
    echo "✗ Not found"
  fi
}

echo "📊 Current Status:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Backend
echo "Backend:"
echo "  node_modules:    $(check_exists backend/node_modules) ($(get_size backend/node_modules))"
echo "  database.db:     $(check_exists backend/database.db) ($(get_size backend/database.db))"
echo "  uploads:         $(check_exists backend/uploads) ($(get_size backend/uploads))"
echo ""

# Frontend
echo "Frontend:"
echo "  node_modules:    $(check_exists frontend/node_modules) ($(get_size frontend/node_modules))"
echo "  dist:            $(check_exists frontend/dist) ($(get_size frontend/dist))"
echo ""

# Certificates
echo "Certificates:"
echo "  certs/:          $(check_exists certs) ($(get_size certs))"
echo ""

# Environment files
echo "Environment files:"
echo "  backend/.env:    $(check_exists backend/.env)"
echo "  frontend/.env:   $(check_exists frontend/.env)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Main menu
echo "What would you like to clean?"
echo ""
echo "  [1] Dependencies only (node_modules)"
echo "  [2] Build artifacts (dist, compiled files)"
echo "  [3] Database & user data (⚠️  DESTRUCTIVE)"
echo "  [4] Certificates"
echo "  [5] Environment files (.env)"
echo "  [6] Everything except .env (⚠️  DESTRUCTIVE)"
echo "  [7] Complete reset (⚠️  VERY DESTRUCTIVE)"
echo "  [8] Custom selection"
echo "  [0] Cancel"
echo ""
read -p "Enter your choice [0-8]: " -n 1 -r choice
echo ""
echo ""

case $choice in
  1)
    echo "🗑️  Cleaning dependencies..."
    ;;
  2)
    echo "🗑️  Cleaning build artifacts..."
    ;;
  3)
    echo "⚠️  WARNING: This will delete all user data!"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
      echo "❌ Cancelled"
      exit 0
    fi
    ;;
  4)
    echo "🗑️  Cleaning certificates..."
    ;;
  5)
    echo "🗑️  Cleaning environment files..."
    ;;
  6)
    echo "⚠️  WARNING: This will delete dependencies, build artifacts, database, and certificates!"
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
      echo "❌ Cancelled"
      exit 0
    fi
    ;;
  7)
    echo "⚠️  WARNING: COMPLETE RESET - This will delete EVERYTHING!"
    echo "This includes: node_modules, database, uploads, certificates, and .env files"
    echo ""
    read -p "Type 'RESET' to confirm complete reset: " confirm
    if [ "$confirm" != "RESET" ]; then
      echo "❌ Cancelled"
      exit 0
    fi
    ;;
  8)
    echo "📋 Custom selection"
    ;;
  0)
    echo "❌ Cancelled"
    exit 0
    ;;
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "============================================"
echo "🗑️  Cleaning Process Started"
echo "============================================"
echo ""

# Track what was cleaned
CLEANED=0

# Function to remove with feedback
remove_item() {
  local item=$1
  local description=$2

  if [ -e "$item" ]; then
    echo "  🗑️  Removing $description..."
    rm -rf "$item"
    echo "  ✅ Removed $item"
    CLEANED=$((CLEANED + 1))
  else
    echo "  ⏭️  Skipping $description (not found)"
  fi
}

# Execute cleanup based on choice
case $choice in
  1)
    # Dependencies only
    echo "📦 Cleaning dependencies..."
    remove_item "backend/node_modules" "backend dependencies"
    remove_item "frontend/node_modules" "frontend dependencies"
    remove_item "backend/package-lock.json" "backend package-lock.json"
    remove_item "frontend/package-lock.json" "frontend package-lock.json"
    ;;

  2)
    # Build artifacts
    echo "🏗️  Cleaning build artifacts..."
    remove_item "frontend/dist" "frontend build output"
    remove_item "backend/dist" "backend build output"
    remove_item "backend/src/**/*.js" "compiled JS files"
    remove_item "backend/src/**/*.js.map" "source maps"
    ;;

  3)
    # Database & user data
    echo "💾 Cleaning database and user data..."
    remove_item "backend/database.db" "database"
    remove_item "backend/uploads/avatars" "user avatars"
    # Recreate avatars directory with default
    mkdir -p backend/uploads/avatars
    if [ -f backend/uploads/avatars/default.svg ]; then
      echo "  ℹ️  Default avatar preserved"
    else
      echo "  ⚠️  Default avatar missing - will be recreated on server start"
    fi
    ;;

  4)
    # Certificates
    echo "🔒 Cleaning certificates..."
    remove_item "certs" "SSL certificates"
    ;;

  5)
    # Environment files
    echo "📝 Cleaning environment files..."
    remove_item "backend/.env" "backend environment file"
    remove_item "frontend/.env" "frontend environment file"
    ;;

  6)
    # Everything except .env
    echo "🗑️  Cleaning everything except .env..."
    remove_item "backend/node_modules" "backend dependencies"
    remove_item "frontend/node_modules" "frontend dependencies"
    remove_item "backend/package-lock.json" "backend package-lock.json"
    remove_item "frontend/package-lock.json" "frontend package-lock.json"
    remove_item "frontend/dist" "frontend build output"
    remove_item "backend/dist" "backend build output"
    remove_item "backend/database.db" "database"
    remove_item "backend/uploads/avatars" "user avatars"
    remove_item "certs" "SSL certificates"
    mkdir -p backend/uploads/avatars
    ;;

  7)
    # Complete reset
    echo "🔥 Complete reset..."
    remove_item "backend/node_modules" "backend dependencies"
    remove_item "frontend/node_modules" "frontend dependencies"
    remove_item "backend/package-lock.json" "backend package-lock.json"
    remove_item "frontend/package-lock.json" "frontend package-lock.json"
    remove_item "frontend/dist" "frontend build output"
    remove_item "backend/dist" "backend build output"
    remove_item "backend/database.db" "database"
    remove_item "backend/uploads" "uploads directory"
    remove_item "certs" "SSL certificates"
    remove_item "backend/.env" "backend environment file"
    remove_item "frontend/.env" "frontend environment file"
    mkdir -p backend/uploads/avatars
    ;;

  8)
    # Custom selection
    echo "📋 Custom cleanup..."
    echo ""

    read -p "Clean backend node_modules? (y/N): " -n 1 -r; echo
    [[ $REPLY =~ ^[Yy]$ ]] && remove_item "backend/node_modules" "backend dependencies"

    read -p "Clean frontend node_modules? (y/N): " -n 1 -r; echo
    [[ $REPLY =~ ^[Yy]$ ]] && remove_item "frontend/node_modules" "frontend dependencies"

    read -p "Clean build artifacts? (y/N): " -n 1 -r; echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      remove_item "frontend/dist" "frontend build output"
      remove_item "backend/dist" "backend build output"
    fi

    read -p "Clean database? (y/N): " -n 1 -r; echo
    [[ $REPLY =~ ^[Yy]$ ]] && remove_item "backend/database.db" "database"

    read -p "Clean user uploads? (y/N): " -n 1 -r; echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      remove_item "backend/uploads/avatars" "user avatars"
      mkdir -p backend/uploads/avatars
    fi

    read -p "Clean certificates? (y/N): " -n 1 -r; echo
    [[ $REPLY =~ ^[Yy]$ ]] && remove_item "certs" "SSL certificates"

    read -p "Clean .env files? (y/N): " -n 1 -r; echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      remove_item "backend/.env" "backend environment file"
      remove_item "frontend/.env" "frontend environment file"
    fi
    ;;
esac

echo ""
echo "============================================"
echo "✅ Cleanup Complete!"
echo "============================================"
echo ""
echo "📊 Summary:"
echo "  Items cleaned: $CLEANED"
echo ""

if [ $CLEANED -gt 0 ]; then
  echo "💡 Next steps:"
  echo ""

  # Check what needs to be reinstalled
  NEEDS_SETUP=false

  if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
    echo "  📦 Reinstall dependencies:"
    [ ! -d "backend/node_modules" ] && echo "     cd backend && npm install"
    [ ! -d "frontend/node_modules" ] && echo "     cd frontend && npm install"
    echo ""
    NEEDS_SETUP=true
  fi

  if [ ! -d "certs" ]; then
    echo "  🔒 Regenerate certificates:"
    echo "     ./setup.sh"
    echo ""
    NEEDS_SETUP=true
  fi

  if [ ! -f "backend/.env" ] || [ ! -f "frontend/.env" ]; then
    echo "  📝 Recreate environment files:"
    echo "     ./setup.sh"
    echo ""
    NEEDS_SETUP=true
  fi

  if [ $NEEDS_SETUP = true ]; then
    echo "  ⚡ Or run complete setup:"
    echo "     ./setup.sh"
    echo ""
  fi
else
  echo "ℹ️  No items were cleaned (nothing found to remove)"
  echo ""
fi

echo "🎉 All done!"
echo ""
