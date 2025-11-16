#!/bin/bash

#######################################
# Quick Test Script
# Fast test execution for common scenarios
#######################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Environment
export BASE_URL="${BASE_URL:-http://localhost:3002}"
export WS_URL="${WS_URL:-ws://localhost:3002/ws}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

print_header() {
    echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║     TRANSCENDENCE QUICK TEST              ║${NC}"
    echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════╝${NC}"
}

check_server() {
    echo -e "\n${BLUE}Checking server...${NC}"

    if curl -s -f "$BASE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is running${NC}"
        curl -s "$BASE_URL/health" | head -5
        return 0
    else
        echo -e "${RED}❌ Server is not accessible at $BASE_URL${NC}"
        echo -e "${YELLOW}Make sure to start the server:${NC}"
        echo -e "${YELLOW}  cd .. && docker-compose up${NC}"
        return 1
    fi
}

test_security() {
    echo -e "\n${CYAN}Running Security Tests...${NC}"
    cd "$SCRIPT_DIR"
    npm run test:security
}

test_api() {
    echo -e "\n${CYAN}Running API Tests...${NC}"
    cd "$SCRIPT_DIR"
    npm run test:api
}

test_game() {
    echo -e "\n${CYAN}Running Game Tests...${NC}"
    cd "$SCRIPT_DIR"
    npm run test:game
}

test_all() {
    echo -e "\n${CYAN}Running All Evaluation Tests...${NC}"
    cd "$SCRIPT_DIR"
    npm test
}

show_usage() {
    print_header
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check       - Check if server is running"
    echo "  security    - Run security tests only"
    echo "  api         - Run API tests only"
    echo "  game        - Run game tests only"
    echo "  all         - Run all evaluation tests"
    echo "  help        - Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL    - Backend URL (default: http://localhost:3002)"
    echo "  WS_URL      - WebSocket URL (default: ws://localhost:3002/ws)"
    echo ""
    echo "Examples:"
    echo "  $0 check"
    echo "  $0 security"
    echo "  $0 all"
    echo "  BASE_URL=http://localhost:3000 $0 api"
    echo ""
}

#######################################
# Main
#######################################

case "${1:-help}" in
    check)
        print_header
        check_server
        ;;
    security)
        print_header
        check_server || exit 1
        test_security
        ;;
    api)
        print_header
        check_server || exit 1
        test_api
        ;;
    game)
        print_header
        check_server || exit 1
        test_game
        ;;
    all)
        print_header
        check_server || exit 1
        test_all
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo ""
        show_usage
        exit 1
        ;;
esac
