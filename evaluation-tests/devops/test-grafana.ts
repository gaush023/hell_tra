#!/usr/bin/env ts-node

/**
 * Grafana Dashboard Tester
 *
 * このスクリプトはGrafanaダッシュボードをテストするために、
 * さまざまなメトリクスを生成します。
 */

import axios from 'axios';
import https from 'https';
import WebSocket from 'ws';

const BACKEND_URL = process.env.BACKEND_URL || 'https://localhost:3002';
const WS_URL = process.env.WS_URL || 'wss://localhost:3002';
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60') * 1000; // デフォルト60秒
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '5');

// HTTPS agent to ignore self-signed certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface TestStats {
  httpRequests: number;
  wsConnections: number;
  gamesStarted: number;
  errors: number;
}

class GrafanaTester {
  private stats: TestStats = {
    httpRequests: 0,
    wsConnections: 0,
    gamesStarted: 0,
    errors: 0,
  };
  private running = true;
  private wsClients: WebSocket[] = [];

  constructor() {
    console.log('🚀 Grafana Dashboard Tester 起動');
    console.log(`📊 バックエンドURL: ${BACKEND_URL}`);
    console.log(`⏱️  テスト時間: ${TEST_DURATION / 1000}秒`);
    console.log(`👥 同時ユーザー数: ${CONCURRENT_USERS}`);
    console.log('');
  }

  /**
   * HTTPリクエストをランダムに送信
   */
  async sendRandomHttpRequest(): Promise<void> {
    const endpoints = [
      { method: 'GET', path: '/' },
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/metrics' },
      { method: 'GET', path: '/api/users' },
      { method: 'GET', path: '/api/games' },
    ];

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    try {
      if (endpoint.method === 'GET') {
        await axios.get(`${BACKEND_URL}${endpoint.path}`, {
          validateStatus: () => true, // すべてのステータスコードを受け入れる
          httpsAgent,
        });
      }
      this.stats.httpRequests++;
    } catch (error) {
      this.stats.errors++;
      // 接続エラーは無視（サーバーが起動していない場合）
    }
  }

  /**
   * WebSocket接続をシミュレート
   */
  async createWebSocketConnection(userId: number): Promise<void> {
    try {
      const ws = new WebSocket(WS_URL, { rejectUnauthorized: false });

      ws.on('open', () => {
        this.stats.wsConnections++;
        console.log(`✅ WebSocket接続 #${userId} 確立`);

        // ランダムにメッセージを送信
        const sendRandomMessage = () => {
          if (ws.readyState === WebSocket.OPEN) {
            const messages = [
              JSON.stringify({ type: 'ping' }),
              JSON.stringify({ type: 'join_game', gameType: 'pong' }),
              JSON.stringify({ type: 'join_game', gameType: 'tank' }),
              JSON.stringify({ type: 'player_move', direction: 'up' }),
              JSON.stringify({ type: 'player_move', direction: 'down' }),
            ];

            const message = messages[Math.floor(Math.random() * messages.length)];
            ws.send(message);
          }
        };

        // 1-3秒ごとにランダムメッセージを送信
        const interval = setInterval(sendRandomMessage, 1000 + Math.random() * 2000);

        ws.on('close', () => {
          clearInterval(interval);
        });
      });

      ws.on('error', (error) => {
        this.stats.errors++;
        console.error(`❌ WebSocket接続エラー #${userId}:`, error.message);
      });

      this.wsClients.push(ws);
    } catch (error) {
      this.stats.errors++;
      console.error('WebSocket接続エラー:', error);
    }
  }

  /**
   * ゲームセッションをシミュレート
   */
  async simulateGameSession(gameType: 'pong' | 'tank'): Promise<void> {
    try {
      // ゲーム開始をシミュレート（実際のエンドポイントがあれば使用）
      await axios.post(`${BACKEND_URL}/api/games/${gameType}/start`, {
        player1: `test-player-${Math.floor(Math.random() * 1000)}`,
        player2: `test-player-${Math.floor(Math.random() * 1000)}`,
      }, {
        validateStatus: () => true,
        httpsAgent,
      });

      this.stats.gamesStarted++;

      // ゲームを5-15秒後に終了
      const gameDuration = 5000 + Math.random() * 10000;
      setTimeout(async () => {
        try {
          await axios.post(`${BACKEND_URL}/api/games/${gameType}/end`, {
            winner: Math.random() > 0.5 ? 'player1' : 'player2',
          }, {
            validateStatus: () => true,
            httpsAgent,
          });
        } catch (error) {
          // エラーは無視
        }
      }, gameDuration);
    } catch (error) {
      // エンドポイントがない場合は無視
    }
  }

  /**
   * メトリクスを確認
   */
  async checkMetrics(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/metrics`, { httpsAgent });
      console.log('\n📈 現在のメトリクス:');

      // メトリクスから重要な情報を抽出
      const metrics = response.data;
      const lines = metrics.split('\n');

      const importantMetrics = [
        'http_requests_total',
        'ws_active_connections',
        'online_users_total',
        'pong_games_active',
        'tank_games_active',
      ];

      importantMetrics.forEach(metricName => {
        const metricLine = lines.find((line: string) =>
          line.startsWith(metricName) && !line.startsWith('#')
        );
        if (metricLine) {
          console.log(`  ${metricLine}`);
        }
      });
    } catch (error) {
      console.error('メトリクス取得エラー:', error);
    }
  }

  /**
   * 継続的な負荷を生成
   */
  async generateLoad(): Promise<void> {
    while (this.running) {
      // HTTPリクエストを送信（1-3リクエスト/秒）
      const httpPromises = [];
      const httpCount = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < httpCount; i++) {
        httpPromises.push(this.sendRandomHttpRequest());
      }

      // ゲームセッションをランダムに開始（10%の確率）
      if (Math.random() < 0.1) {
        const gameType = Math.random() > 0.5 ? 'pong' : 'tank';
        this.simulateGameSession(gameType);
      }

      await Promise.all(httpPromises);

      // 1秒待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * 統計を表示
   */
  displayStats(): void {
    console.log('\n📊 テスト統計:');
    console.log(`  HTTPリクエスト: ${this.stats.httpRequests}`);
    console.log(`  WebSocket接続: ${this.stats.wsConnections}`);
    console.log(`  ゲーム開始: ${this.stats.gamesStarted}`);
    console.log(`  エラー: ${this.stats.errors}`);
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    console.log('\n🧹 クリーンアップ中...');
    this.running = false;

    // WebSocket接続を閉じる
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
  }

  /**
   * テストを実行
   */
  async run(): Promise<void> {
    console.log('🏁 テスト開始\n');

    // WebSocket接続を作成
    console.log(`📡 ${CONCURRENT_USERS}人のユーザーのWebSocket接続を作成中...`);
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      await this.createWebSocketConnection(i + 1);
      await new Promise(resolve => setTimeout(resolve, 200)); // 200ms間隔で接続
    }

    console.log('\n💪 負荷生成開始...\n');

    // 負荷生成を開始
    const loadPromise = this.generateLoad();

    // 10秒ごとに統計を表示
    const statsInterval = setInterval(() => {
      this.displayStats();
    }, 10000);

    // メトリクス確認
    const metricsInterval = setInterval(() => {
      this.checkMetrics();
    }, 15000);

    // テスト時間が経過したら停止
    setTimeout(() => {
      clearInterval(statsInterval);
      clearInterval(metricsInterval);
      this.cleanup();
      this.displayStats();

      console.log('\n✅ テスト完了!');
      console.log('\n📊 Grafanaダッシュボードを確認してください:');
      console.log('   http://localhost:3000/d/transcendence-app/transcendence-application-dashboard');
      console.log('\n📈 Prometheusを確認してください:');
      console.log('   http://localhost:9090');

      process.exit(0);
    }, TEST_DURATION);

    await loadPromise;
  }
}

// メイン実行
const tester = new GrafanaTester();

// SIGINT/SIGTERMハンドラー
process.on('SIGINT', () => {
  console.log('\n\n⚠️  中断されました');
  tester.cleanup();
  tester.displayStats();
  process.exit(0);
});

process.on('SIGTERM', () => {
  tester.cleanup();
  process.exit(0);
});

tester.run().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
