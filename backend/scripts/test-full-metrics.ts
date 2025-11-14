#!/usr/bin/env ts-node

/**
 * Full Metrics Generator for Grafana
 *
 * WebSocket接続、ユーザー、ゲームなど全てのメトリクスを生成します
 */

import axios from 'axios';
import WebSocket from 'ws';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const WS_URL = process.env.WS_URL || 'ws://localhost:3002';
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60') * 1000;
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '5');

interface TestUser {
  username: string;
  password: string;
  token?: string;
  userId?: string;
  ws?: WebSocket;
}

interface Stats {
  usersCreated: number;
  wsConnections: number;
  httpRequests: number;
  gamesStarted: number;
  errors: number;
}

class FullMetricsGenerator {
  private users: TestUser[] = [];
  private stats: Stats = {
    usersCreated: 0,
    wsConnections: 0,
    httpRequests: 0,
    gamesStarted: 0,
    errors: 0,
  };
  private running = true;

  constructor() {
    console.log('🚀 Full Metrics Generator 起動');
    console.log(`📊 バックエンドURL: ${BACKEND_URL}`);
    console.log(`⏱️  テスト時間: ${TEST_DURATION / 1000}秒`);
    console.log(`👥 同時ユーザー数: ${CONCURRENT_USERS}`);
    console.log('');
  }

  /**
   * テストユーザーを作成
   */
  async createTestUser(index: number): Promise<TestUser | null> {
    const username = `testuser${index}_${Date.now()}`;
    const password = 'Test1234!';

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        username,
        password,
      }, { validateStatus: () => true });

      this.stats.httpRequests++;

      if (response.status === 201 || response.status === 200) {
        console.log(`✅ ユーザー作成: ${username}`);
        this.stats.usersCreated++;
        return { username, password };
      }
    } catch (error: any) {
      this.stats.errors++;
      console.error(`❌ ユーザー作成失敗: ${error.message}`);
    }

    return null;
  }

  /**
   * ユーザーをログイン
   */
  async loginUser(user: TestUser): Promise<boolean> {
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username: user.username,
        password: user.password,
      }, { validateStatus: () => true });

      this.stats.httpRequests++;

      if (response.status === 200 && response.data.token) {
        user.token = response.data.token;
        user.userId = response.data.user?.id;
        console.log(`✅ ログイン成功: ${user.username}`);
        return true;
      }
    } catch (error: any) {
      this.stats.errors++;
      console.error(`❌ ログイン失敗: ${error.message}`);
    }

    return false;
  }

  /**
   * WebSocket接続を確立
   */
  async connectWebSocket(user: TestUser): Promise<boolean> {
    return new Promise((resolve) => {
      if (!user.token) {
        resolve(false);
        return;
      }

      const wsUrl = `${WS_URL}/ws?token=${user.token}`;
      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        ws.close();
        this.stats.errors++;
        console.error(`❌ WebSocket接続タイムアウト: ${user.username}`);
        resolve(false);
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        user.ws = ws;
        this.stats.wsConnections++;
        console.log(`✅ WebSocket接続: ${user.username}`);
        resolve(true);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          if (message.type === 'authenticated') {
            console.log(`🔐 認証完了: ${user.username}`);
          }
        } catch (error) {
          // メッセージパースエラーは無視
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        this.stats.errors++;
        console.error(`❌ WebSocketエラー: ${user.username} - ${error.message}`);
        resolve(false);
      });

      ws.on('close', () => {
        console.log(`🔌 WebSocket切断: ${user.username}`);
      });
    });
  }

  /**
   * キューに参加してゲームをマッチング
   */
  async joinGameQueue(user: TestUser): Promise<void> {
    if (!user.ws || user.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const message = JSON.stringify({
        type: 'joinQueue',
        data: {
          gameType: Math.random() > 0.5 ? 'pong' : 'tank',
        }
      });

      user.ws.send(message);
      console.log(`🎮 キュー参加: ${user.username}`);
    } catch (error: any) {
      this.stats.errors++;
      console.error(`❌ キュー参加失敗: ${error.message}`);
    }
  }

  /**
   * ランダムなHTTPリクエストを送信
   */
  async sendRandomRequest(): Promise<void> {
    const endpoints = [
      '/health',
      '/metrics',
      '/api/users',
      '/api/game/history',
      '/api/game/stats',
    ];

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    try {
      await axios.get(`${BACKEND_URL}${endpoint}`, {
        validateStatus: () => true,
        timeout: 3000,
      });
      this.stats.httpRequests++;
    } catch (error) {
      this.stats.errors++;
    }
  }

  /**
   * 統計を表示
   */
  displayStats(): void {
    console.log('\n📊 テスト統計:');
    console.log('━'.repeat(60));
    console.log(`  ユーザー作成: ${this.stats.usersCreated}`);
    console.log(`  WebSocket接続: ${this.stats.wsConnections}`);
    console.log(`  HTTPリクエスト: ${this.stats.httpRequests}`);
    console.log(`  ゲーム開始: ${this.stats.gamesStarted}`);
    console.log(`  エラー: ${this.stats.errors}`);
    console.log('━'.repeat(60));
  }

  /**
   * メトリクスを表示
   */
  async displayMetrics(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/metrics`);
      const metrics = response.data;
      const lines = metrics.split('\n');

      console.log('\n📈 重要なメトリクス:');
      console.log('━'.repeat(60));

      const importantMetrics = {
        'HTTP Requests': 'http_requests_total',
        'WebSocket Connections': 'ws_active_connections',
        'Online Users': 'online_users_total',
        'Pong Games Active': 'pong_games_active',
        'Tank Games Active': 'tank_games_active',
        'WS Messages': 'ws_messages_total',
      };

      for (const [label, metricName] of Object.entries(importantMetrics)) {
        const metricLines = lines.filter((line: string) =>
          line.startsWith(metricName) && !line.startsWith('#')
        );

        if (metricLines.length > 0) {
          console.log(`\n${label}:`);
          metricLines.slice(0, 2).forEach((line: string) => {
            console.log(`  ${line}`);
          });
          if (metricLines.length > 2) {
            console.log(`  ... (${metricLines.length - 2} more)`);
          }
        }
      }

      console.log('\n' + '━'.repeat(60));
    } catch (error) {
      console.error('メトリクス取得エラー');
    }
  }

  /**
   * 継続的な活動をシミュレート
   */
  async simulateActivity(): Promise<void> {
    while (this.running) {
      // ランダムなHTTPリクエストを送信
      const requestPromises = [];
      for (let i = 0; i < 3; i++) {
        requestPromises.push(this.sendRandomRequest());
      }

      // ランダムにゲームキューに参加
      if (this.users.length > 0 && Math.random() < 0.3) {
        const randomUser = this.users[Math.floor(Math.random() * this.users.length)];
        this.joinGameQueue(randomUser);
      }

      await Promise.all(requestPromises);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * クリーンアップ
   */
  cleanup(): void {
    console.log('\n🧹 クリーンアップ中...');
    this.running = false;

    this.users.forEach(user => {
      if (user.ws && user.ws.readyState === WebSocket.OPEN) {
        user.ws.close();
      }
    });
  }

  /**
   * テストを実行
   */
  async run(): Promise<void> {
    console.log('🏁 テスト開始\n');

    // ユーザーを作成
    console.log(`👤 ${CONCURRENT_USERS}人のテストユーザーを作成中...\n`);
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const user = await this.createTestUser(i + 1);
      if (user) {
        this.users.push(user);
      }
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // ユーザーをログイン
    console.log('\n🔑 ユーザーをログイン中...\n');
    for (const user of this.users) {
      await this.loginUser(user);
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // WebSocket接続を確立
    console.log('\n📡 WebSocket接続を確立中...\n');
    for (const user of this.users) {
      await this.connectWebSocket(user);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // 活動をシミュレート
    console.log('\n💪 ユーザー活動をシミュレート中...\n');
    const activityPromise = this.simulateActivity();

    // 定期的に統計とメトリクスを表示
    const statsInterval = setInterval(() => {
      this.displayStats();
    }, 10000);

    const metricsInterval = setInterval(() => {
      this.displayMetrics();
    }, 15000);

    // 最初のメトリクス表示
    setTimeout(() => this.displayMetrics(), 3000);

    // テスト時間が経過したら停止
    setTimeout(() => {
      clearInterval(statsInterval);
      clearInterval(metricsInterval);
      this.cleanup();
      this.displayStats();
      this.displayMetrics().then(() => {
        console.log('\n✅ テスト完了!');
        console.log('\n📊 Grafanaダッシュボードを確認:');
        console.log('   http://localhost:3000/d/transcendence-app/transcendence-application-dashboard');
        console.log('\n📈 Prometheusを確認:');
        console.log('   http://localhost:9090');
        process.exit(0);
      });
    }, TEST_DURATION);

    await activityPromise;
  }
}

// メイン実行
const generator = new FullMetricsGenerator();

process.on('SIGINT', () => {
  console.log('\n\n⚠️  中断されました');
  generator.cleanup();
  generator.displayStats();
  process.exit(0);
});

process.on('SIGTERM', () => {
  generator.cleanup();
  process.exit(0);
});

generator.run().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
