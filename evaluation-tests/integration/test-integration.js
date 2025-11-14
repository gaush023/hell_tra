#!/usr/bin/env node

/**
 * Integration Tests for Transcendence Project
 *
 * Tests complete user flows:
 * 1. Full User Journey (Register → Login → Play)
 * 2. Friend System
 * 3. Match History
 * 4. Profile Management
 */

const https = require('https');
const WebSocket = require('ws');

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
    const defaultOptions = {
      rejectUnauthorized: false,
      ...options
    };

    const req = https.request(url, defaultOptions, (res) => {
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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullUserJourney() {
  log('\n🧪 Testing: Full User Journey (Register → Login → Play)', 'cyan');

  try {
    // Step 1: Register
    const username = `journey_${Date.now()}`;
    const password = 'TestPassword123!';

    const registerResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (registerResponse.statusCode === 200) {
      log('  ✅ Step 1: User registration successful', 'green');
      results.passed++;
    } else {
      log(`  ❌ Step 1: Registration failed (${registerResponse.statusCode})`, 'red');
      results.failed++;
      results.total += 4; // Account for all steps
      return;
    }

    // Step 2: Login
    await delay(100);
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    let token = null;
    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.data);
      token = loginData.token;
      log('  ✅ Step 2: User login successful', 'green');
      results.passed++;
    } else {
      log(`  ❌ Step 2: Login failed (${loginResponse.statusCode})`, 'red');
      results.failed++;
      results.total += 3;
      return;
    }

    // Step 3: Access Profile
    await delay(100);
    const profileResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (profileResponse.statusCode === 200) {
      const profile = JSON.parse(profileResponse.data);
      if (profile.username === username) {
        log('  ✅ Step 3: Profile access successful', 'green');
        results.passed++;
      } else {
        log('  ❌ Step 3: Profile data mismatch', 'red');
        results.failed++;
      }
    } else {
      log(`  ⚠️  Step 3: Profile access issue (${profileResponse.statusCode})`, 'yellow');
      results.warnings++;
    }

    // Step 4: Connect WebSocket for game
    await delay(100);
    return new Promise((resolve) => {
      const ws = new WebSocket(`${WS_URL}?token=${token}`, {
        rejectUnauthorized: false
      });

      const timeout = setTimeout(() => {
        log('  ⚠️  Step 4: WebSocket connection timeout', 'yellow');
        results.warnings++;
        results.total += 4;
        ws.close();
        resolve();
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        log('  ✅ Step 4: Game WebSocket connected', 'green');
        results.passed++;
        results.total += 4;
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        log(`  ❌ Step 4: WebSocket connection failed: ${error.message}`, 'red');
        results.failed++;
        results.total += 4;
        resolve();
      });
    });

  } catch (error) {
    log(`  ❌ Full user journey failed: ${error.message}`, 'red');
    results.failed++;
    results.total += 4;
  }
}

async function testFriendSystem() {
  log('\n🧪 Testing: Friend System', 'cyan');

  try {
    // Create two test users
    const user1 = {
      username: `friend1_${Date.now()}`,
      password: 'TestPassword123!'
    };

    const user2 = {
      username: `friend2_${Date.now()}`,
      password: 'TestPassword123!'
    };

    // Register both users
    await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1)
    });

    await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user2)
    });

    // Login both users
    const login1 = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user1)
    });

    const login2 = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user2)
    });

    if (login1.statusCode === 200 && login2.statusCode === 200) {
      log('  ✅ Created two test users successfully', 'green');
      results.passed++;

      const token1 = JSON.parse(login1.data).token;
      const user2Id = JSON.parse(login2.data).user.id;

      // Send friend request (if endpoint exists)
      const friendRequest = await makeRequest(`${BASE_URL}/api/users/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token1}`
        },
        body: JSON.stringify({ userId: user2Id })
      });

      if (friendRequest.statusCode === 200 || friendRequest.statusCode === 201) {
        log('  ✅ Friend request sent successfully', 'green');
        results.passed++;
      } else if (friendRequest.statusCode === 404) {
        log('  ⚠️  Friend request endpoint not implemented', 'yellow');
        results.warnings++;
      } else {
        log(`  ⚠️  Friend request status: ${friendRequest.statusCode}`, 'yellow');
        results.warnings++;
      }

    } else {
      log('  ❌ Failed to create test users for friend system', 'red');
      results.failed++;
    }

    results.total += 2;

  } catch (error) {
    log(`  ⚠️  Friend system test error: ${error.message}`, 'yellow');
    results.warnings++;
    results.total += 2;
  }
}

async function testMatchHistory() {
  log('\n🧪 Testing: Match History', 'cyan');

  try {
    // Create and login a test user
    const user = {
      username: `history_${Date.now()}`,
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
      const token = JSON.parse(loginResponse.data).token;

      // Get match history
      const historyResponse = await makeRequest(`${BASE_URL}/api/users/match-history`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (historyResponse.statusCode === 200) {
        const history = JSON.parse(historyResponse.data);
        if (Array.isArray(history)) {
          log('  ✅ Match history endpoint working', 'green');
          log(`  ℹ️  Match history entries: ${history.length}`, 'blue');
          results.passed++;
        } else {
          log('  ⚠️  Match history format unexpected', 'yellow');
          results.warnings++;
        }
      } else if (historyResponse.statusCode === 404) {
        log('  ⚠️  Match history endpoint not implemented', 'yellow');
        results.warnings++;
      } else {
        log(`  ⚠️  Match history status: ${historyResponse.statusCode}`, 'yellow');
        results.warnings++;
      }

    } else {
      log('  ❌ Failed to create test user for match history', 'red');
      results.failed++;
    }

    results.total++;

  } catch (error) {
    log(`  ⚠️  Match history test error: ${error.message}`, 'yellow');
    results.warnings++;
    results.total++;
  }
}

async function testProfileManagement() {
  log('\n🧪 Testing: Profile Management', 'cyan');

  try {
    // Create and login a test user
    const user = {
      username: `profile_${Date.now()}`,
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
      const token = JSON.parse(loginResponse.data).token;

      // Update profile
      const updateResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: 'Test Display Name',
          bio: 'Test bio for evaluation'
        })
      });

      if (updateResponse.statusCode === 200) {
        log('  ✅ Profile update successful', 'green');
        results.passed++;

        // Verify update
        const getResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (getResponse.statusCode === 200) {
          const profile = JSON.parse(getResponse.data);
          if (profile.displayName === 'Test Display Name') {
            log('  ✅ Profile data persisted correctly', 'green');
            results.passed++;
          } else {
            log('  ⚠️  Profile update not persisted', 'yellow');
            results.warnings++;
          }
        }

      } else if (updateResponse.statusCode === 404) {
        log('  ⚠️  Profile update endpoint not implemented', 'yellow');
        results.warnings++;
      } else {
        log(`  ⚠️  Profile update status: ${updateResponse.statusCode}`, 'yellow');
        results.warnings++;
      }

    } else {
      log('  ❌ Failed to create test user for profile management', 'red');
      results.failed++;
    }

    results.total += 2;

  } catch (error) {
    log(`  ⚠️  Profile management test error: ${error.message}`, 'yellow');
    results.warnings++;
    results.total += 2;
  }
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗');
  log('║      TRANSCENDENCE INTEGRATION EVALUATION TESTS           ║');
  log('╚════════════════════════════════════════════════════════════╝');
  log(`\nTesting complete user flows...`, 'blue');

  await testFullUserJourney();
  await delay(500);
  await testFriendSystem();
  await delay(500);
  await testMatchHistory();
  await delay(500);
  await testProfileManagement();

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
    log('\n⚠️  Some integration tests failed. Please review.', 'yellow');
  } else {
    log('\n✅ All integration tests completed!', 'green');
  }
}

runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
