#!/bin/bash

#######################################
# Server Status Checker
# Quick check for server connectivity
#######################################

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

BASE_URL="${BASE_URL:-http://localhost:3002}"
FRONTEND_URL="${FRONTEND_URL:-https://localhost:8443}"
WS_URL="${WS_URL:-ws://localhost:3002/ws}"

echo -e "${CYAN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     SERVER CONNECTIVITY CHECK             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  Backend:  $BASE_URL"
echo -e "  Frontend: $FRONTEND_URL"
echo -e "  WebSocket: $WS_URL"

echo -e "\n${BLUE}Checking Backend...${NC}"
if curl -s -f -m 5 "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is accessible${NC}"
    response=$(curl -s "$BASE_URL/health")
    echo -e "${GREEN}   Response: $response${NC}"
else
    echo -e "${RED}❌ Backend is NOT accessible${NC}"
    echo -e "${YELLOW}   Troubleshooting:${NC}"
    echo -e "${YELLOW}   1. Check if Docker containers are running:${NC}"
    echo -e "${YELLOW}      docker-compose ps${NC}"
    echo -e "${YELLOW}   2. Check backend logs:${NC}"
    echo -e "${YELLOW}      docker-compose logs backend${NC}"
    echo -e "${YELLOW}   3. Start the containers:${NC}"
    echo -e "${YELLOW}      docker-compose up -d${NC}"
fi

echo -e "\n${BLUE}Checking Frontend...${NC}"
if curl -s -f -k -m 5 "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is NOT accessible (this may be expected)${NC}"
fi

echo -e "\n${BLUE}Checking Grafana...${NC}"
if curl -s -f -m 5 "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Grafana is accessible at http://localhost:3000${NC}"
    echo -e "${GREEN}   Login: admin / admin${NC}"
else
    echo -e "${YELLOW}⚠️  Grafana is NOT accessible${NC}"
fi

echo -e "\n${BLUE}Checking Prometheus...${NC}"
if curl -s -f -m 5 "http://localhost:9090" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prometheus is accessible at http://localhost:9090${NC}"
else
    echo -e "${YELLOW}⚠️  Prometheus is NOT accessible${NC}"
fi

echo -e "\n${BLUE}Docker Containers:${NC}"
if command -v docker-compose &> /dev/null; then
    cd "$(dirname "$0")/.." 2>/dev/null || true
    docker-compose ps 2>/dev/null || docker compose ps 2>/dev/null || echo "Could not get container status"
else
    echo -e "${YELLOW}docker-compose not found${NC}"
fi

echo -e "\n${BLUE}Network Ports:${NC}"
ss -tlnp 2>/dev/null | grep -E ':(3000|3002|8080|8443|9090)' || echo "Could not check ports (permission denied or ss not available)"

echo ""
