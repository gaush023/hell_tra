.PHONY: help up down build rebuild logs clean restart ps shell-frontend shell-backend prune dev prod status

# デフォルトターゲット: ヘルプを表示
help:
	@echo "使用可能なコマンド:"
	@echo ""
	@echo "【基本操作】"
	@echo "  make up              - 全てのコンテナを起動"
	@echo "  make down            - 全てのコンテナを停止"
	@echo "  make build           - イメージをビルド"
	@echo "  make rebuild         - キャッシュなしで再ビルド"
	@echo "  make restart         - 全てのコンテナを再起動"
	@echo "  make ps              - 実行中のコンテナを表示"
	@echo "  make status          - サービスの状態を確認"
	@echo ""
	@echo "【ログ確認】"
	@echo "  make logs            - 全てのログを表示"
	@echo "  make logs-f          - ログをフォロー表示"
	@echo "  make logs-backend    - バックエンドのログを表示"
	@echo "  make logs-frontend   - フロントエンドのログを表示"
	@echo ""
	@echo "【コンテナアクセス】"
	@echo "  make shell-frontend  - フロントエンドコンテナにアクセス"
	@echo "  make shell-backend   - バックエンドコンテナにアクセス"
	@echo ""
	@echo "【テスト】"
	@echo "  make health          - ヘルスチェック"
	@echo ""
	@echo "【クリーンアップ】"
	@echo "  make clean           - コンテナとボリュームを削除"
	@echo "  make clean-all       - イメージも含めて完全削除"
	@echo "  make prune           - 未使用のリソースを削除"

# コンテナを起動
up:
	docker-compose up -d

# コンテナを停止
down:
	docker-compose down

# イメージをビルド
build:
	docker-compose build

# キャッシュなしで再ビルド
rebuild:
	docker-compose build --no-cache

# コンテナを再起動
restart:
	docker-compose restart

# 全てのログを表示
logs:
	docker-compose logs

# ログをフォロー表示
logs-f:
	docker-compose logs -f

# バックエンドのログを表示
logs-backend:
	docker-compose logs -f backend

# フロントエンドのログを表示
logs-frontend:
	docker-compose logs -f frontend

# Prometheusのログを表示
logs-prometheus:
	docker-compose logs -f prometheus

# Grafanaのログを表示
logs-grafana:
	docker-compose logs -f grafana

# 実行中のコンテナを表示
ps:
	docker-compose ps

# サービスの状態を確認
status:
	@echo "=== Docker Compose サービス状態 ==="
	@docker-compose ps
	@echo "\n=== ポート使用状況 ==="
	@docker-compose ps | grep -E "0.0.0.0|Up"

# フロントエンドコンテナにアクセス
shell-frontend:
	docker-compose exec frontend sh

# バックエンドコンテナにアクセス
shell-backend:
	docker-compose exec backend sh

# Prometheusコンテナにアクセス
shell-prometheus:
	docker-compose exec prometheus sh

# Grafanaコンテナにアクセス
shell-grafana:
	docker-compose exec grafana sh

# コンテナとボリュームを削除
clean:
	docker-compose down -v

# 未使用のリソースを削除
prune:
	docker system prune -f

# 開発環境セットアップ
dev:
	docker-compose up --build

# 本番環境起動
prod:
	docker-compose up -d --build

# 特定のサービスのみ起動
up-frontend:
	docker-compose up -d frontend

up-backend:
	docker-compose up -d backend

up-monitoring:
	docker-compose up -d prometheus grafana

# 特定のサービスのみ再起動
restart-frontend:
	docker-compose restart frontend

restart-backend:
	docker-compose restart backend

# イメージを削除して完全にクリーンアップ
clean-all:
	docker-compose down -v --rmi all

# ヘルスチェック
health:
	@echo "=== Frontend (HTTPS) ==="
	@curl -k -s -o /dev/null -w "Status: %{http_code}\n" https://localhost:8443 || echo "Not reachable"
	@echo "\n=== Backend ==="
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3002/health || echo "Not reachable"
	@echo "\n=== Prometheus ==="
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:9090 || echo "Not reachable"
	@echo "\n=== Grafana ==="
	@curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 || echo "Not reachable"

