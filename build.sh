#!/bin/bash
set -e

echo "============================================"
echo "🔨 Transcendence Build Script"
echo "============================================"
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if dependencies are installed
check_dependencies() {
    echo "🔍 Checking dependencies..."

    if [ ! -d "backend/node_modules" ] || [ ! -d "frontend/node_modules" ]; then
        print_warning "Dependencies not found. Running setup..."
        ./setup.sh
    else
        print_success "Dependencies found"
    fi
    echo ""
}

# Clean build directories
clean_build() {
    echo "🧹 Cleaning build directories..."

    if [ -d "frontend/dist" ]; then
        rm -rf frontend/dist
        print_success "Cleaned frontend/dist"
    fi

    if [ -d "backend/dist" ]; then
        rm -rf backend/dist
        print_success "Cleaned backend/dist"
    fi

    echo ""
}

# Build frontend
build_frontend() {
    echo "🎨 Building frontend..."
    cd frontend
    npm run build
    cd ..
    print_success "Frontend build complete"
    echo ""
}

# Build backend
build_backend() {
    echo "⚙️  Building backend..."
    cd backend
    npm run build
    cd ..
    print_success "Backend build complete"
    echo ""
}

# Main build process
main() {
    case "${1:-}" in
        clean)
            echo "Running clean build..."
            echo ""
            check_dependencies
            clean_build
            build_frontend
            build_backend
            ;;
        frontend)
            echo "Building frontend only..."
            echo ""
            build_frontend
            ;;
        backend)
            echo "Building backend only..."
            echo ""
            build_backend
            ;;
        check)
            check_dependencies
            echo "✅ All checks passed"
            exit 0
            ;;
        help|--help|-h)
            echo "Usage: ./build.sh [option]"
            echo ""
            echo "Options:"
            echo "  (no option)  - Build both frontend and backend"
            echo "  clean        - Clean build directories and rebuild"
            echo "  frontend     - Build frontend only"
            echo "  backend      - Build backend only"
            echo "  check        - Check if dependencies are installed"
            echo "  help         - Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Building all..."
            echo ""
            check_dependencies
            build_frontend
            build_backend
            ;;
    esac

    echo "============================================"
    echo "✅ Build Complete!"
    echo "============================================"
    echo ""
    echo "📦 Build output:"
    echo "  - frontend/dist/  (Frontend production files)"
    echo "  - backend/dist/   (Backend compiled files)"
    echo ""
    echo "🚀 To start the application:"
    echo "  npm start"
    echo ""
}

# Run main function
main "$@"
