#!/usr/bin/env ts-node

/**
 * Simple Load Tester for Grafana Metrics
 *
 * 実際に存在するエンドポイントのみを使用してメトリクスを生成します
 */

import axios from 'axios';
import https from 'https';

const BACKEND_URL = process.env.BACKEND_URL || 'https://localhost:3002';
const TEST_DURATION = parseInt(process.env.TEST_DURATION || '60') * 1000;
const REQUESTS_PER_SECOND = parseInt(process.env.RPS || '10');

// HTTPS agent to ignore self-signed certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

interface Stats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  startTime: number;
}

class SimpleLoadTester {
  private stats: Stats = {
    totalRequests: 0,
    successRequests: 0,
    errorRequests: 0,
    startTime: Date.now(),
  };
  private running = true;

  constructor() {
    console.log('🚀 Simple Load Tester 起動');
    console.log(`📊 バックエンドURL: ${BACKEND_URL}`);
    console.log(`⏱️  テスト時間: ${TEST_DURATION / 1000}秒`);
    console.log(`📈 リクエスト/秒: ${REQUESTS_PER_SECOND}`);
    console.log('');
  }

  /**
   * ランダムなHTTPリクエストを送信
   */
  async sendRequest(): Promise<void> {
    // 実際に存在するエンドポイント
    const endpoints = [
      { method: 'GET', path: '/health' },
      { method: 'GET', path: '/metrics' },
      { method: 'GET', path: '/api/users' },
      { method: 'GET', path: '/api/game/history' },
      { method: 'GET', path: '/api/game/stats' },
    ];

    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];

    this.stats.totalRequests++;

    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint.path}`, {
        validateStatus: () => true, // すべてのステータスコードを受け入れる
        timeout: 5000,
        httpsAgent,
      });

      if (response.status < 400) {
        this.stats.successRequests++;
      } else {
        this.stats.errorRequests++;
      }
    } catch (error) {
      this.stats.errorRequests++;
    }
  }

  /**
   * メトリクスを表示
   */
  async displayMetrics(): Promise<void> {
    try {
      const response = await axios.get(`${BACKEND_URL}/metrics`, { httpsAgent });
      const metrics = response.data;
      const lines = metrics.split('\n');

      console.log('\n📈 現在のPrometheusメトリクス:');
      console.log('━'.repeat(60));

      // 重要なメトリクスのみ抽出して表示
      const importantMetrics = [
        'http_requests_total',
        'http_request_duration_seconds',
        'ws_active_connections',
        'online_users_total',
        'pong_games_active',
        'tank_games_active',
        'process_cpu_seconds_total',
        'process_resident_memory_bytes',
      ];

      for (const metricName of importantMetrics) {
        const metricLines = lines.filter((line: string) =>
          line.startsWith(metricName) && !line.startsWith('#')
        );

        if (metricLines.length > 0) {
          console.log(`\n${metricName}:`);
          metricLines.slice(0, 3).forEach((line: string) => {
            console.log(`  ${line}`);
          });
          if (metricLines.length > 3) {
            console.log(`  ... (${metricLines.length - 3} more)`);
          }
        }
      }

      console.log('\n' + '━'.repeat(60));
    } catch (error) {
      console.error('メトリクス取得エラー');
    }
  }

  /**
   * 統計を表示
   */
  displayStats(): void {
    const elapsedSeconds = (Date.now() - this.stats.startTime) / 1000;
    const rps = (this.stats.totalRequests / elapsedSeconds).toFixed(2);

    console.log('\n📊 テスト統計:');
    console.log('━'.repeat(60));
    console.log(`  経過時間: ${elapsedSeconds.toFixed(1)}秒`);
    console.log(`  総リクエスト数: ${this.stats.totalRequests}`);
    console.log(`  成功: ${this.stats.successRequests} (${((this.stats.successRequests / this.stats.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`  エラー: ${this.stats.errorRequests} (${((this.stats.errorRequests / this.stats.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`  実際のRPS: ${rps}`);
    console.log('━'.repeat(60));
  }

  /**
   * 負荷を生成
   */
  async generateLoad(): Promise<void> {
    const intervalMs = 1000 / REQUESTS_PER_SECOND;

    while (this.running) {
      const requestPromises = [];

      // 1秒あたりの目標リクエスト数を送信
      for (let i = 0; i < REQUESTS_PER_SECOND; i++) {
        requestPromises.push(this.sendRequest());
      }

      await Promise.all(requestPromises);

      // 次のバッチまで待機
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * テストを実行
   */
  async run(): Promise<void> {
    console.log('🏁 負荷テスト開始\n');

    // 負荷生成を開始
    const loadPromise = this.generateLoad();

    // 10秒ごとに統計を表示
    const statsInterval = setInterval(() => {
      this.displayStats();
    }, 10000);

    // 15秒ごとにメトリクスを表示
    const metricsInterval = setInterval(() => {
      this.displayMetrics();
    }, 15000);

    // 最初のメトリクス表示
    setTimeout(() => this.displayMetrics(), 3000);

    // テスト時間が経過したら停止
    setTimeout(() => {
      clearInterval(statsInterval);
      clearInterval(metricsInterval);
      this.running = false;

      this.displayStats();
      this.displayMetrics().then(() => {
        console.log('\n✅ テスト完了!');
        console.log('\n📊 Grafanaダッシュボードを確認:');
        console.log('   http://localhost:3000/d/transcendence-app/transcendence-application-dashboard');
        console.log('\n📈 Prometheusを確認:');
        console.log('   http://localhost:9090');
        console.log('\n💡 ヒント: Grafanaでは以下のクエリを試してください:');
        console.log('   - rate(http_requests_total[1m])');
        console.log('   - histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[1m]))');
        console.log('   - process_resident_memory_bytes');

        process.exit(0);
      });
    }, TEST_DURATION);

    await loadPromise;
  }
}

// メイン実行
const tester = new SimpleLoadTester();

// SIGINT/SIGTERMハンドラー
process.on('SIGINT', () => {
  console.log('\n\n⚠️  中断されました');
  tester.displayStats();
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.exit(0);
});

tester.run().catch(error => {
  console.error('テスト実行エラー:', error);
  process.exit(1);
});
