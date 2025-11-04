.PHONY: help setup restart rebuild down up build clean

# デフォルトターゲット（make のみで実行）
.DEFAULT_GOAL := help

# ヘルプメッセージ
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Available targets:"
	@echo "  setup     - 初回セットアップ（データベースディレクトリ作成 + ビルド + 起動）"
	@echo "  restart   - Docker の再起動（down → up）"
	@echo "  rebuild   - 完全リビルド（キャッシュクリア + down → build → up）"
	@echo "  down      - Docker サービスの停止"
	@echo "  up        - Docker サービスの起動"
	@echo "  build     - Docker イメージのビルド"
	@echo "  clean     - 完全クリーンアップ（コンテナ、イメージ、ボリューム削除）"
	@echo "  help      - このヘルプメッセージを表示"
	@echo ""
	@echo "Examples:"
	@echo "  make setup    # 初回セットアップ"
	@echo "  make restart  # サービス再起動"
	@echo "  make rebuild  # キャッシュクリアしてリビルド"

# 初回セットアップ: データベースディレクトリ作成 + Docker ビルド・起動
setup:
	@echo "Setting up the project..."
	mkdir -p backend/data
	docker-compose up --build -d
	@echo "Setup complete! Services are running."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:3001"

# Docker の再起動
restart:
	@echo "Restarting Docker services..."
	docker-compose down
	docker-compose up -d
	@echo "Services restarted."

# Docker の完全リビルド (キャッシュクリア)
rebuild:
	@echo "Rebuilding Docker services (no cache)..."
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "Services rebuilt and started."

# Docker の停止
down:
	@echo "Stopping Docker services..."
	docker-compose down

# Docker の起動
up:
	@echo "Starting Docker services..."
	docker-compose up -d

# Docker のビルド
build:
	@echo "Building Docker services..."
	docker-compose build

# クリーンアップ (コンテナ、イメージ、ボリューム削除)
clean:
	@echo "Cleaning up Docker resources..."
	docker-compose down -v --rmi all
	@echo "Cleanup complete."
