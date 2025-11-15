#!/usr/bin/env ts-node

/**
 * Complete Grafana Metrics Test
 *
 * すべてのメトリクス（HTTP、WebSocket、ユーザー、ゲーム）を生成
 */

import axios from 'axios';
import WebSocket from 'ws';
import https from 'https';

const BACKEND_URL = process.env.BACKEND_URL || 'https://localhost:3002';
const WS_URL = process.env.WS_URL || 'wss://localhost:3002';
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '120') * 1000;
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '5');

// HTTPS agent to ignore self-signed certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface TestUser {
  username: string;
  password: string;
  token?: string;
  ws?: WebSocket;
}

class CompleteGrafanaTest {
  private users: TestUser[] = [];
  private running = true;
  private httpRequests = 0;
  private gamesSimulated = 0;

  constructor() {
    console.log('🚀 Complete Grafana Metrics Test 起動');
    console.log(`📊 バックエンドURL: ${BACKEND_URL}`);
    console.log(`⏱️  テスト時間: ${TEST_DURATION / 1000}秒`);
    console.log(`👥 ユーザー数: ${CONCURRENT_USERS}`);
    console.log('');
  }

  async createAndLoginUser(index: number): Promise<TestUser | null> {
    const username = `testuser${index}_${Date.now()}`;
    const password = 'Test1234!';

    try {
      // Register
      await axios.post(`${BACKEND_URL}/api/auth/register`, {
        username,
        password,
      }, { validateStatus: () => true, httpsAgent });

      // Login
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username,
        password,
      }, { validateStatus: () => true, httpsAgent });

      if (response.status === 200 && response.data.token) {
        console.log(`✅ ユーザー作成&ログイン: ${username}`);
        return {
          username,
          password,
          token: response.data.token,
        };
      }
    } catch (error) {
      // エラーは無視
    }

    return null;
  }

  async connectWebSocket(user: TestUser): Promise<boolean> {
    return new Promise((resolve) => {
      if (!user.token) {
        resolve(false);
        return;
      }

      const ws = new WebSocket(`${WS_URL}/ws?token=${user.token}`, {
        rejectUnauthorized: false
      });

      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        user.ws = ws;
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
          // 無視
        }
      });

      ws.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  async sendRandomHttpRequests(): Promise<void> {
    const endpoints = [
      '/health',
      '/metrics',
      '/api/users',
      '/api/game/history',
      '/api/game/stats',
    ];

    const promises = [];
    for (let i = 0; i < 5; i++) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      promises.push(
        axios.get(`${BACKEND_URL}${endpoint}`, {
          validateStatus: () => true,
          timeout: 3000,
          httpsAgent
        }).then(() => {
          this.httpRequests++;
        }).catch(() => {})
      );
    }

    await Promise.all(promises);
  }

  async simulateGames(): Promise<void> {
    try {
      const pongGames = Math.floor(Math.random() * 3) + 1;
      const tankGames = Math.floor(Math.random() * 3) + 1;

      await axios.post(
        `${BACKEND_URL}/api/test/simulate-games`,
        { pongGames, tankGames },
        { headers: { 'Content-Type': 'application/json' }, httpsAgent }
      );

      this.gamesSimulated += pongGames + tankGames;
      console.log(`🎮 ゲームシミュレーション: Pong=${pongGames}, Tank=${tankGames}`);
    } catch (error) {
      // エラーは無視
    }
  }

  async showMetrics(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/metrics`, { httpsAgent });
      const metrics = response.data;
      const lines = metrics.split('\n');

      console.log('\n📈 現在のメトリクス:');
      console.log('━'.repeat(70));

      const extract = (name: string) => {
        const line = lines.find((l: string) =>
          l.startsWith(name) && !l.startsWith('#')
        );
        return line || `${name} (not found)`;
      };

      console.log('  ' + extract('ws_active_connections'));
      console.log('  ' + extract('online_users_total'));
      console.log('  ' + extract('pong_games_active'));
      console.log('  ' + extract('tank_games_active'));
      console.log(`  http_requests_total: ${this.httpRequests}+ (multiple routes)`);
      console.log('━'.repeat(70));
    } catch (error) {
      console.error('  メトリクス取得エラー');
    }
  }

  async run(): Promise<void> {
    console.log('🏁 テスト開始\n');

    // Step 1: ユーザー作成とWebSocket接続
    console.log(`👤 ${CONCURRENT_USERS}人のユーザーを作成中...\n`);
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const user = await this.createAndLoginUser(i + 1);
      if (user) {
        this.users.push(user);
        await this.connectWebSocket(user);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n💪 継続的な活動を開始...\n');

    // Step 2: 定期的な活動
    let counter = 0;
    const activityInterval = setInterval(async () => {
      if (!this.running) {
        clearInterval(activityInterval);
        return;
      }

      // HTTPリクエストを送信
      await this.sendRandomHttpRequests();

      // 15秒ごとにゲームをシミュレート
      counter++;
      if (counter % 3 === 0) {
        await this.simulateGames();
      }
    }, 5000);

    // Step 3: 定期的なメトリクス表示
    const metricsInterval = setInterval(() => {
      if (!this.running) {
        clearInterval(metricsInterval);
        return;
      }
      this.showMetrics();
    }, 20000);

    // 最初のメトリクス表示
    setTimeout(() => this.showMetrics(), 5000);

    // Step 4: テスト終了
    setTimeout(async () => {
      this.running = false;
      clearInterval(activityInterval);
      clearInterval(metricsInterval);

      // クリーンアップ
      this.users.forEach(user => {
        if (user.ws && user.ws.readyState === WebSocket.OPEN) {
          user.ws.close();
        }
      });

      await this.showMetrics();

      console.log('\n✅ テスト完了!');
      console.log('\n📊 Grafanaダッシュボードを確認:');
      console.log('   http://localhost:3000/d/transcendence-app/transcendence-application-dashboard');
      console.log('\n📈 Prometheusを確認:');
      console.log('   http://localhost:9090');
      console.log('\n💡 ヒント: ダッシュボードで以下を確認できます:');
      console.log('   - HTTPリクエスト率');
      console.log('   - WebSocket接続数');
      console.log('   - オンラインユーザー数');
      console.log('   - アクティブなゲーム数');
      console.log('   - リクエストレイテンシ');
      console.log('   - CPU/メモリ使用率');

      process.exit(0);
    }, TEST_DURATION);
  }
}

// メイン実行
const test = new CompleteGrafanaTest();

process.on('SIGINT', () => {
  console.log('\n\n⚠️  中断されました');
  process.exit(0);
});

test.run().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
