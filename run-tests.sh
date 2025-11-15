#!/bin/bash

# DevOps Tests Runner
# 対話的にテストを選択して実行できます

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# デフォルト環境変数
export BACKEND_URL=${BACKEND_URL:-https://localhost:3002}
export WS_URL=${WS_URL:-wss://localhost:3002}
export TEST_DURATION=${TEST_DURATION:-60}
export CONCURRENT_USERS=${CONCURRENT_USERS:-5}
export RPS=${RPS:-10}

# バナー表示
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║            🚀 DevOps Tests Runner 🚀                      ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 現在の設定を表示
echo -e "${BLUE}📊 現在の設定:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  ${YELLOW}BACKEND_URL:${NC}       $BACKEND_URL"
echo -e "  ${YELLOW}WS_URL:${NC}            $WS_URL"
echo -e "  ${YELLOW}TEST_DURATION:${NC}     ${TEST_DURATION}秒"
echo -e "  ${YELLOW}CONCURRENT_USERS:${NC}  $CONCURRENT_USERS"
echo -e "  ${YELLOW}RPS:${NC}               $RPS (負荷テストのみ)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# メニュー表示
echo -e "${PURPLE}📋 利用可能なテスト:${NC}"
echo ""
echo "  1) 🎨 Grafanaダッシュボードテスト"
echo "     └─ WebSocket接続とHTTPリクエストでメトリクスを生成"
echo ""
echo "  2) ⚡ シンプル負荷テスト"
echo "     └─ 指定RPSでHTTPリクエストを送信"
echo ""
echo "  3) 📊 完全メトリクス生成"
echo "     └─ ユーザー、WebSocket、HTTPの全メトリクス"
echo ""
echo "  4) 🎮 ゲーム込みメトリクス生成"
echo "     └─ ゲームマッチングを含む完全なテスト"
echo ""
echo "  5) ✅ 完全統合テスト"
echo "     └─ すべてのコンポーネントの統合テスト"
echo ""
echo "  6) ⚙️  環境変数を変更"
echo ""
echo "  0) 🚪 終了"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ユーザー入力を受け取る
read -p "実行するテストを選択してください [0-6]: " choice

case $choice in
  1)
    echo -e "${GREEN}🎨 Grafanaダッシュボードテストを実行...${NC}"
    cd backend && npm run test:grafana
    ;;
  2)
    echo -e "${GREEN}⚡ シンプル負荷テストを実行...${NC}"
    echo -e "${YELLOW}ℹ️  環境変数 RPS で秒あたりのリクエスト数を変更できます${NC}"
    cd backend && npm run test:load
    ;;
  3)
    echo -e "${GREEN}📊 完全メトリクス生成を実行...${NC}"
    cd backend && npm run test:metrics
    ;;
  4)
    echo -e "${GREEN}🎮 ゲーム込みメトリクス生成を実行...${NC}"
    cd backend && npm run test:games
    ;;
  5)
    echo -e "${GREEN}✅ 完全統合テストを実行...${NC}"
    cd backend && npm run test:complete
    ;;
  6)
    echo ""
    echo -e "${CYAN}⚙️  環境変数の変更${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    read -p "BACKEND_URL [$BACKEND_URL]: " new_backend_url
    read -p "WS_URL [$WS_URL]: " new_ws_url
    read -p "TEST_DURATION (秒) [$TEST_DURATION]: " new_duration
    read -p "CONCURRENT_USERS [$CONCURRENT_USERS]: " new_users
    read -p "RPS (負荷テストのみ) [$RPS]: " new_rps

    export BACKEND_URL=${new_backend_url:-$BACKEND_URL}
    export WS_URL=${new_ws_url:-$WS_URL}
    export TEST_DURATION=${new_duration:-$TEST_DURATION}
    export CONCURRENT_USERS=${new_users:-$CONCURRENT_USERS}
    export RPS=${new_rps:-$RPS}

    echo ""
    echo -e "${GREEN}✅ 環境変数を更新しました${NC}"
    echo ""

    # スクリプトを再実行
    exec "$0"
    ;;
  0)
    echo -e "${YELLOW}👋 終了します${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}❌ 無効な選択肢です${NC}"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}✅ テスト完了!${NC}"
echo ""
echo -e "${BLUE}💡 ヒント:${NC}"
echo "  • Grafanaダッシュボード: http://localhost:3000"
echo "  • Prometheus: http://localhost:9090"
echo "  • Backend Metrics: $BACKEND_URL/metrics"
echo ""
