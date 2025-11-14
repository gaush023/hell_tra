#!/usr/bin/env ts-node

/**
 * Complete Metrics Generator with Game Matching
 *
 * ゲームマッチングを含む完全なメトリクス生成ツール
 */

import axios from 'axios';
import WebSocket from 'ws';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3002';
const WS_URL = process.env.WS_URL || 'ws://localhost:3002';
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '120') * 1000;
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS || '6');

interface TestUser {
  username: string;
  password: string;
  token?: string;
  userId?: string;
  ws?: WebSocket;
  isInQueue?: boolean;
  currentGameId?: string;
}

interface Stats {
  usersCreated: number;
  wsConnections: number;
  httpRequests: number;
  gamesCreated: number;
  gamesStarted: number;
  errors: number;
}

class CompleteMetricsGenerator {
  private users: TestUser[] = [];
  private stats: Stats = {
    usersCreated: 0,
    wsConnections: 0,
    httpRequests: 0,
    gamesCreated: 0,
    gamesStarted: 0,
    errors: 0,
  };
  private running = true;

  constructor() {
    console.log('🚀 Complete Metrics Generator with Games 起動');
    console.log(`📊 バックエンドURL: ${BACKEND_URL}`);
    console.log(`⏱️  テスト時間: ${TEST_DURATION / 1000}秒`);
    console.log(`👥 同時ユーザー数: ${CONCURRENT_USERS}`);
    console.log('');
  }

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
    }

    return false;
  }

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
        resolve(false);
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        user.ws = ws;
        this.stats.wsConnections++;
        console.log(`✅ WebSocket接続: ${user.username}`);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'authenticated') {
            console.log(`🔐 認証完了: ${user.username}`);
            resolve(true);
          } else if (message.type === 'gameCreated') {
            console.log(`🎮 ゲーム作成通知: ${user.username}`);
            this.stats.gamesCreated++;
          } else if (message.type === 'gameStart') {
            console.log(`🎯 ゲーム開始: ${user.username} - Game ID: ${message.data?.gameId}`);
            user.currentGameId = message.data?.gameId;
            this.stats.gamesStarted++;
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
        user.isInQueue = false;
        user.currentGameId = undefined;
      });
    });
  }

  /**
   * 2人のプレイヤーでゲーム招待を送信
   */
  async createGameByInvitation(user1: TestUser, user2: TestUser): Promise<void> {
    if (!user1.ws || user1.ws.readyState !== WebSocket.OPEN) return;
    if (!user2.userId) return;

    try {
      const message = JSON.stringify({
        type: 'gameInvite',
        data: {
          toUserId: user2.userId,
        }
      });

      user1.ws.send(message);
      console.log(`📨 ゲーム招待送信: ${user1.username} → ${user2.username}`);

      // 招待を自動的に受け入れる
      setTimeout(() => {
        if (user2.ws && user2.ws.readyState === WebSocket.OPEN) {
          // 実際の招待IDは取得できないので、別の方法でゲームを開始
          console.log(`💡 代わりにキューマッチングを使用`);
        }
      }, 500);
    } catch (error: any) {
      this.stats.errors++;
    }
  }

  /**
   * ペアでキューに参加してゲームをマッチング
   */
  async matchGamePair(user1: TestUser, user2: TestUser, gameType: 'pong' | 'tank'): Promise<void> {
    if (!user1.ws || user1.ws.readyState !== WebSocket.OPEN) return;
    if (!user2.ws || user2.ws.readyState !== WebSocket.OPEN) return;

    try {
      // 両方のユーザーを同じゲームタイプのキューに参加
      const message = JSON.stringify({
        type: 'createGame',
        data: {
          gameType: gameType,
          mode: 'matchmaking',
          maxPlayers: 2,
        }
      });

      user1.ws.send(message);
      user1.isInQueue = true;
      console.log(`🎮 キュー参加: ${user1.username} (${gameType})`);

      // 少し待ってから2人目を参加させる
      setTimeout(() => {
        if (user2.ws && user2.ws.readyState === WebSocket.OPEN) {
          user2.ws.send(message);
          user2.isInQueue = true;
          console.log(`🎮 キュー参加: ${user2.username} (${gameType})`);
        }
      }, 200);
    } catch (error: any) {
      this.stats.errors++;
    }
  }

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

  displayStats(): void {
    console.log('\n📊 テスト統計:');
    console.log('━'.repeat(60));
    console.log(`  ユーザー作成: ${this.stats.usersCreated}`);
    console.log(`  WebSocket接続: ${this.stats.wsConnections}`);
    console.log(`  HTTPリクエスト: ${this.stats.httpRequests}`);
    console.log(`  ゲーム作成: ${this.stats.gamesCreated}`);
    console.log(`  ゲーム開始: ${this.stats.gamesStarted}`);
    console.log(`  エラー: ${this.stats.errors}`);
    console.log('━'.repeat(60));
  }

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
        'Pong Games Total': 'pong_games_total',
        'Tank Games Active': 'tank_games_active',
        'Tank Games Total': 'tank_games_total',
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

  async simulateActivity(): Promise<void> {
    let gameCreationCounter = 0;

    while (this.running) {
      // HTTPリクエストを送信
      const requestPromises = [];
      for (let i = 0; i < 3; i++) {
        requestPromises.push(this.sendRandomRequest());
      }
      await Promise.all(requestPromises);

      // 10秒ごとにゲームペアをマッチング
      gameCreationCounter++;
      if (gameCreationCounter % 10 === 0 && this.users.length >= 2) {
        // ランダムに2人を選んでゲームを作成
        const availableUsers = this.users.filter(u =>
          u.ws && u.ws.readyState === WebSocket.OPEN && !u.isInQueue && !u.currentGameId
        );

        if (availableUsers.length >= 2) {
          const user1 = availableUsers[0];
          const user2 = availableUsers[1];
          const gameType = Math.random() > 0.5 ? 'pong' : 'tank';

          console.log(`\n🎲 ゲームマッチング開始: ${user1.username} vs ${user2.username} (${gameType})`);
          await this.matchGamePair(user1, user2, gameType);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  cleanup(): void {
    console.log('\n🧹 クリーンアップ中...');
    this.running = false;

    this.users.forEach(user => {
      if (user.ws && user.ws.readyState === WebSocket.OPEN) {
        user.ws.close();
      }
    });
  }

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
    console.log('\n💪 ユーザー活動 & ゲームマッチングをシミュレート中...\n');
    const activityPromise = this.simulateActivity();

    // 定期的に統計とメトリクスを表示
    const statsInterval = setInterval(() => {
      this.displayStats();
    }, 15000);

    const metricsInterval = setInterval(() => {
      this.displayMetrics();
    }, 20000);

    // 最初のメトリクス表示
    setTimeout(() => this.displayMetrics(), 5000);

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
        process.exit(0);
      });
    }, TEST_DURATION);

    await activityPromise;
  }
}

// メイン実行
const generator = new CompleteMetricsGenerator();

process.on('SIGINT', () => {
  console.log('\n\n⚠️  中断されました');
  generator.cleanup();
  generator.displayStats();
  process.exit(0);
});

generator.run().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
