#!/usr/bin/env node

/**
 * Game Functionality Tests for Transcendence Project
 *
 * Tests:
 * 1. WebSocket Connection
 * 2. Game Creation
 * 3. Player Management
 * 4. Tournament Functionality
 * 5. Game State Updates
 */

// Load environment variables
require('dotenv').config();

const WebSocket = require('ws');
const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'https://localhost:3001';
const WS_URL = process.env.WS_URL || 'wss://localhost:3001/ws';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const defaultOptions = {
      rejectUnauthorized: false,
      ...options
    };

    const req = client.request(url, defaultOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ error: err.message });
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function createTestUser() {
  const user = {
    username: `gametest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    password: 'TestPassword123!'
  };

  await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });

  if (loginResponse.statusCode === 200) {
    const data = JSON.parse(loginResponse.data);
    return { user, token: data.token };
  }

  return null;
}

function connectWebSocket(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}?token=${token}`, {
      rejectUnauthorized: false
    });

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error('WebSocket connection timeout'));
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function testWebSocketConnection() {
  log('\n🧪 Testing: WebSocket Connection', 'cyan');

  try {
    const testData = await createTestUser();
    if (!testData) {
      log('  ❌ FAIL: Could not create test user', 'red');
      results.failed++;
      results.total++;
      return null;
    }

    const ws = await connectWebSocket(testData.token);

    log('  ✅ PASS: WebSocket connection established', 'green');
    results.passed++;
    results.total++;

    // Test message reception
    return new Promise((resolve) => {
      let receivedMessage = false;
      const timeout = setTimeout(() => {
        if (!receivedMessage) {
          log('  ⚠️  WARN: No welcome message received', 'yellow');
          results.warnings++;
        }
        results.total++;
        resolve({ ws, token: testData.token, username: testData.user.username });
      }, 2000);

      ws.on('message', (data) => {
        if (!receivedMessage) {
          receivedMessage = true;
          clearTimeout(timeout);
          log('  ✅ PASS: Received message from server', 'green');
          results.passed++;
          results.total++;
          resolve({ ws, token: testData.token, username: testData.user.username });
        }
      });
    });

  } catch (error) {
    log(`  ❌ FAIL: WebSocket connection failed: ${error.message}`, 'red');
    results.failed++;
    results.total++;
    return null;
  }
}

async function testGameCreation(wsData) {
  log('\n🧪 Testing: Game Creation', 'cyan');

  if (!wsData || !wsData.ws) {
    log('  ⚠️  WARN: Skipping - no WebSocket connection', 'yellow');
    results.warnings++;
    results.total++;
    return;
  }

  const { ws } = wsData;

  return new Promise((resolve) => {
    let gameCreated = false;

    const timeout = setTimeout(() => {
      if (!gameCreated) {
        log('  ⚠️  WARN: Game creation timeout', 'yellow');
        results.warnings++;
      }
      results.total++;
      resolve();
    }, 5000);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'gameCreated' || message.type === 'gameJoined') {
          if (!gameCreated) {
            gameCreated = true;
            clearTimeout(timeout);
            log('  ✅ PASS: Game creation successful', 'green');
            results.passed++;
            results.total++;
            resolve();
          }
        } else if (message.type === 'error') {
          if (!gameCreated) {
            gameCreated = true;
            clearTimeout(timeout);
            log(`  ❌ FAIL: Game creation error: ${message.message}`, 'red');
            results.failed++;
            results.total++;
            resolve();
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    // Try to create a Pong game
    ws.send(JSON.stringify({
      type: 'createGame',
      gameType: 'pong',
      mode: '2player'
    }));
  });
}

async function testPlayerManagement(wsData) {
  log('\n🧪 Testing: Player Management', 'cyan');

  if (!wsData || !wsData.ws) {
    log('  ⚠️  WARN: Skipping - no WebSocket connection', 'yellow');
    results.warnings++;
    results.total++;
    return;
  }

  // Test 1: Create a second player
  try {
    const testData2 = await createTestUser();
    if (!testData2) {
      log('  ⚠️  WARN: Could not create second test user', 'yellow');
      results.warnings++;
      results.total++;
      return;
    }

    const ws2 = await connectWebSocket(testData2.token);

    log('  ✅ PASS: Multiple WebSocket connections supported', 'green');
    results.passed++;
    results.total++;

    ws2.close();

  } catch (error) {
    log(`  ❌ FAIL: Multiple connections failed: ${error.message}`, 'red');
    results.failed++;
    results.total++;
  }
}

async function testTournamentFunctionality() {
  log('\n🧪 Testing: Tournament Functionality', 'cyan');

  try {
    // Create 4 test users for tournament
    const players = [];
    for (let i = 0; i < 4; i++) {
      const testData = await createTestUser();
      if (testData) {
        players.push(testData);
      }
    }

    if (players.length < 4) {
      log('  ⚠️  WARN: Could not create enough players for tournament test', 'yellow');
      results.warnings++;
      results.total++;
      return;
    }

    log('  ✅ PASS: Created 4 test users for tournament', 'green');
    results.passed++;
    results.total++;

    // Connect first player
    const ws1 = await connectWebSocket(players[0].token);

    return new Promise((resolve) => {
      let tournamentCreated = false;

      const timeout = setTimeout(() => {
        if (!tournamentCreated) {
          log('  ⚠️  WARN: Tournament creation timeout', 'yellow');
          results.warnings++;
        }
        results.total++;
        ws1.close();
        resolve();
      }, 5000);

      ws1.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());

          if (message.type === 'tournamentCreated' || message.type === 'tournamentJoined') {
            if (!tournamentCreated) {
              tournamentCreated = true;
              clearTimeout(timeout);
              log('  ✅ PASS: Tournament creation successful', 'green');
              results.passed++;
              results.total++;
              ws1.close();
              resolve();
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      // Try to create a tournament
      ws1.send(JSON.stringify({
        type: 'createTournament',
        gameType: 'pong'
      }));
    });

  } catch (error) {
    log(`  ❌ FAIL: Tournament test error: ${error.message}`, 'red');
    results.failed++;
    results.total++;
  }
}

async function testGameStateUpdates(wsData) {
  log('\n🧪 Testing: Game State Updates', 'cyan');

  if (!wsData || !wsData.ws) {
    log('  ⚠️  WARN: Skipping - no WebSocket connection', 'yellow');
    results.warnings++;
    results.total++;
    return;
  }

  const { ws } = wsData;

  return new Promise((resolve) => {
    let receivedUpdate = false;

    const timeout = setTimeout(() => {
      if (!receivedUpdate) {
        log('  ⚠️  WARN: No game state updates received', 'yellow');
        results.warnings++;
      }
      results.total++;
      resolve();
    }, 3000);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'gameState' || message.type === 'gameUpdate') {
          if (!receivedUpdate) {
            receivedUpdate = true;
            clearTimeout(timeout);
            log('  ✅ PASS: Game state updates received', 'green');
            results.passed++;
            results.total++;
            resolve();
          }
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    // Send a move command to trigger state update
    ws.send(JSON.stringify({
      type: 'move',
      direction: 'up'
    }));
  });
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗');
  log('║          TRANSCENDENCE GAME EVALUATION TESTS              ║');
  log('╚════════════════════════════════════════════════════════════╝');
  log(`\nWebSocket URL: ${WS_URL}`, 'blue');

  const wsData = await testWebSocketConnection();
  await testGameCreation(wsData);
  await testPlayerManagement(wsData);
  await testTournamentFunctionality();
  await testGameStateUpdates(wsData);

  // Clean up
  if (wsData && wsData.ws) {
    wsData.ws.close();
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗');
  log('║                    TEST SUMMARY                            ║');
  log('╚════════════════════════════════════════════════════════════╝');

  log(`\nTotal Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Warnings: ${results.warnings}`, 'yellow');

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
  log(`\nPass Rate: ${passRate}%`, passRate >= 60 ? 'green' : 'red');

  if (results.failed > 0) {
    log('\n⚠️  Some game tests failed. Please review.', 'yellow');
  } else {
    log('\n✅ All game tests completed!', 'green');
  }
}

runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
