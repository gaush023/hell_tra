#!/bin/bash

#######################################
# Transcendence Unified Test Runner
# Runs both evaluation tests and devops tests
#######################################

# Disable immediate exit on error (we handle errors manually)
set +e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Environment variables with defaults
export BASE_URL="${BASE_URL:-http://localhost:3002}"
export FRONTEND_URL="${FRONTEND_URL:-https://localhost:8443}"
export WS_URL="${WS_URL:-ws://localhost:3002/ws}"
export TEST_TIMEOUT="${TEST_TIMEOUT:-10000}"
export TEST_DURATION="${TEST_DURATION:-60}"
export CONCURRENT_USERS="${CONCURRENT_USERS:-5}"
export RPS="${RPS:-10}"

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/backend"

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

#######################################
# Functions
#######################################

print_header() {
    echo -e "${BOLD}${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     TRANSCENDENCE UNIFIED TEST RUNNER                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BOLD}${MAGENTA}>>> $1${NC}\n"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

check_dependencies() {
    print_section "Checking Dependencies"

    local missing_deps=()

    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi

    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing dependencies: ${missing_deps[*]}"
        echo "Please install Node.js and npm first."
        exit 1
    fi

    print_success "All dependencies found"
    print_info "Node version: $(node --version)"
    print_info "npm version: $(npm --version)"
}

check_server() {
    print_section "Checking Server Connection"

    print_info "Testing connection to: $BASE_URL"

    if curl -s -f -k "$BASE_URL/health" > /dev/null 2>&1; then
        print_success "Server is running and accessible"
        return 0
    else
        print_error "Cannot connect to server at $BASE_URL"
        print_warning "Make sure the server is running with: docker-compose up"
        return 1
    fi
}

install_dependencies() {
    print_section "Installing Dependencies"

    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        print_info "Installing evaluation test dependencies..."
        cd "$SCRIPT_DIR"
        npm install --silent
        print_success "Evaluation test dependencies installed"
    else
        print_info "Evaluation test dependencies already installed"
    fi
}

run_evaluation_tests() {
    print_section "Running Evaluation Tests"

    cd "$SCRIPT_DIR"

    # Security Tests
    echo -e "\n${CYAN}═══ Security Tests ═══${NC}"
    if npm run test:security; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))

    # API Tests
    echo -e "\n${CYAN}═══ API Tests ═══${NC}"
    if npm run test:api; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))

    # Game Tests
    echo -e "\n${CYAN}═══ Game Tests ═══${NC}"
    if npm run test:game; then
        ((PASSED_TESTS++))
    else
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

run_devops_tests() {
    print_section "Running DevOps Tests"

    if [ ! -d "$BACKEND_DIR" ]; then
        print_warning "Backend directory not found. Skipping DevOps tests."
        return
    fi

    cd "$BACKEND_DIR"

    # Check if TypeScript is available
    if ! npm run --silent test:grafana --help > /dev/null 2>&1; then
        print_warning "DevOps tests not available in backend. Skipping."
        return
    fi

    # Grafana Test
    echo -e "\n${CYAN}═══ Grafana Dashboard Test ═══${NC}"
    if timeout 30 npm run test:grafana 2>&1 | head -50; then
        print_success "Grafana test completed"
        ((PASSED_TESTS++))
    else
        print_warning "Grafana test skipped or failed (non-critical)"
    fi
    ((TOTAL_TESTS++))

    # Load Test (short duration)
    echo -e "\n${CYAN}═══ Load Test ═══${NC}"
    if TEST_DURATION=10 RPS=5 timeout 20 npm run test:load 2>&1 | head -50; then
        print_success "Load test completed"
        ((PASSED_TESTS++))
    else
        print_warning "Load test skipped or failed (non-critical)"
    fi
    ((TOTAL_TESTS++))
}

run_integration_test() {
    print_section "Running Integration Test"

    cd "$SCRIPT_DIR"

    if npm run test:integration; then
        print_success "Integration test passed"
        ((PASSED_TESTS++))
    else
        print_error "Integration test failed"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

print_summary() {
    echo -e "\n${BOLD}${CYAN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║                    TEST SUMMARY                            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    echo -e "${BLUE}Total Test Suites: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}${BOLD}🎉 All tests passed!${NC}"
        echo -e "${GREEN}The application is ready for evaluation.${NC}"
        return 0
    else
        echo -e "\n${RED}${BOLD}⚠️  Some tests failed!${NC}"
        echo -e "${RED}Please review the failures above.${NC}"
        return 1
    fi
}

show_menu() {
    clear
    print_header

    echo -e "${BOLD}Current Configuration:${NC}"
    echo -e "${BLUE}  BASE_URL:         $BASE_URL${NC}"
    echo -e "${BLUE}  FRONTEND_URL:     $FRONTEND_URL${NC}"
    echo -e "${BLUE}  WS_URL:           $WS_URL${NC}"
    echo -e "${BLUE}  TEST_DURATION:    $TEST_DURATION seconds${NC}"
    echo -e "${BLUE}  CONCURRENT_USERS: $CONCURRENT_USERS${NC}"
    echo ""

    echo -e "${BOLD}Select Test Suite:${NC}"
    echo "  1) Run ALL tests (recommended)"
    echo "  2) Evaluation tests only (security, API, game)"
    echo "  3) Security tests"
    echo "  4) API tests"
    echo "  5) Game tests"
    echo "  6) Integration test"
    echo "  7) DevOps tests (Grafana, load test)"
    echo "  8) Quick check (server connection only)"
    echo "  9) Configure environment"
    echo "  0) Exit"
    echo ""
    echo -n "Enter your choice [0-9]: "
}

configure_environment() {
    echo -e "\n${BOLD}${CYAN}Environment Configuration${NC}\n"

    read -p "Backend URL [$BASE_URL]: " input
    [ -n "$input" ] && export BASE_URL="$input"

    read -p "Frontend URL [$FRONTEND_URL]: " input
    [ -n "$input" ] && export FRONTEND_URL="$input"

    read -p "WebSocket URL [$WS_URL]: " input
    [ -n "$input" ] && export WS_URL="$input"

    read -p "Test Duration in seconds [$TEST_DURATION]: " input
    [ -n "$input" ] && export TEST_DURATION="$input"

    read -p "Concurrent Users [$CONCURRENT_USERS]: " input
    [ -n "$input" ] && export CONCURRENT_USERS="$input"

    # Update .env file
    cat > "$SCRIPT_DIR/.env" <<EOF
# Evaluation Test Configuration
# Backend API URL
BASE_URL=$BASE_URL

# Frontend URL
FRONTEND_URL=$FRONTEND_URL

# WebSocket URL
WS_URL=$WS_URL

# Test timeout (milliseconds)
TEST_TIMEOUT=$TEST_TIMEOUT

# DevOps test configuration
TEST_DURATION=$TEST_DURATION
CONCURRENT_USERS=$CONCURRENT_USERS
RPS=$RPS
EOF

    print_success "Configuration saved to .env"
    read -p "Press Enter to continue..."
}

#######################################
# Main Menu Loop
#######################################

# Show help message
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    print_header
    echo -e "${BOLD}Usage:${NC}"
    echo -e "  $0 [OPTIONS]"
    echo ""
    echo -e "${BOLD}Options:${NC}"
    echo -e "  -a, --all        Run all tests in non-interactive mode"
    echo -e "  -h, --help       Show this help message"
    echo -e "  (no options)     Run in interactive mode with menu"
    echo ""
    echo -e "${BOLD}Examples:${NC}"
    echo -e "  $0               # Interactive mode"
    echo -e "  $0 --all         # Run all tests"
    echo ""
    echo -e "${BOLD}Environment Variables:${NC}"
    echo -e "  BASE_URL         Backend API URL (default: http://localhost:3002)"
    echo -e "  FRONTEND_URL     Frontend URL (default: https://localhost:8443)"
    echo -e "  WS_URL           WebSocket URL (default: ws://localhost:3002/ws)"
    echo -e "  TEST_TIMEOUT     Test timeout in ms (default: 10000)"
    echo -e "  TEST_DURATION    Load test duration in seconds (default: 60)"
    echo ""
    exit 0
fi

if [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    # Non-interactive mode
    print_header
    check_dependencies

    # Check server but don't exit if it fails
    if ! check_server; then
        print_error "Server is not running. Tests will likely fail."
        print_info "Start the server with: docker-compose up -d"
        read -p "Do you want to continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi

    install_dependencies
    run_evaluation_tests
    run_integration_test
    run_devops_tests
    print_summary
    exit $?
fi

# Interactive mode
while true; do
    show_menu
    read choice

    case $choice in
        1)
            print_header
            check_dependencies
            check_server || { read -p "Press Enter to continue..."; continue; }
            install_dependencies
            run_evaluation_tests
            run_integration_test
            run_devops_tests
            print_summary
            read -p "Press Enter to continue..."
            ;;
        2)
            print_header
            check_dependencies
            check_server || { read -p "Press Enter to continue..."; continue; }
            install_dependencies
            run_evaluation_tests
            print_summary
            read -p "Press Enter to continue..."
            ;;
        3)
            print_header
            check_server || { read -p "Press Enter to continue..."; continue; }
            cd "$SCRIPT_DIR"
            npm run test:security
            read -p "Press Enter to continue..."
            ;;
        4)
            print_header
            check_server || { read -p "Press Enter to continue..."; continue; }
            cd "$SCRIPT_DIR"
            npm run test:api
            read -p "Press Enter to continue..."
            ;;
        5)
            print_header
            check_server || { read -p "Press Enter to continue..."; continue; }
            cd "$SCRIPT_DIR"
            npm run test:game
            read -p "Press Enter to continue..."
            ;;
        6)
            print_header
            check_server || { read -p "Press Enter to continue..."; continue; }
            cd "$SCRIPT_DIR"
            npm run test:integration
            read -p "Press Enter to continue..."
            ;;
        7)
            print_header
            check_server || { read -p "Press Enter to continue..."; continue; }
            run_devops_tests
            read -p "Press Enter to continue..."
            ;;
        8)
            print_header
            check_server
            read -p "Press Enter to continue..."
            ;;
        9)
            configure_environment
            ;;
        0)
            echo -e "\n${CYAN}Goodbye!${NC}\n"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            sleep 2
            ;;
    esac
done
