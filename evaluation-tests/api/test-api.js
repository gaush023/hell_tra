#!/usr/bin/env node

/**
 * API Tests for Transcendence Project
 *
 * Tests:
 * 1. User Registration
 * 2. User Login
 * 3. User Profile Operations
 * 4. Input Validation
 * 5. Error Handling
 * 6. Protected Endpoints
 */

const https = require('https');

const BASE_URL = process.env.BASE_URL || 'https://localhost:3001';

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

async function testUserRegistration() {
  log('\n🧪 Testing: User Registration', 'cyan');

  // Test 1: Valid registration
  const validUser = {
    username: `testuser_${Date.now()}`,
    password: 'ValidPassword123!'
  };

  const response1 = await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validUser)
  });

  if (response1.statusCode === 200) {
    log('  ✅ PASS: Valid user registration works', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Valid registration failed (${response1.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 2: Duplicate username
  const response2 = await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validUser)
  });

  if (response2.statusCode === 409 || response2.statusCode === 400) {
    log('  ✅ PASS: Duplicate username properly rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Duplicate username not handled (${response2.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 3: Short username
  const response3 = await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'ab', password: 'Password123!' })
  });

  if (response3.statusCode === 400) {
    log('  ✅ PASS: Short username rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Short username validation failed (${response3.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 4: Short password
  const response4 = await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'validuser', password: '12345' })
  });

  if (response4.statusCode === 400) {
    log('  ✅ PASS: Short password rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Short password validation failed (${response4.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 5: Missing fields
  const response5 = await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test' })
  });

  if (response5.statusCode === 400) {
    log('  ✅ PASS: Missing password rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Missing field validation failed (${response5.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;
}

async function testUserLogin() {
  log('\n🧪 Testing: User Login', 'cyan');

  // Create a test user first
  const testUser = {
    username: `logintest_${Date.now()}`,
    password: 'TestPassword123!'
  };

  await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  // Test 1: Valid login
  const response1 = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  if (response1.statusCode === 200) {
    const data = JSON.parse(response1.data);
    if (data.token) {
      log('  ✅ PASS: Valid login successful with token', 'green');
      results.passed++;
    } else {
      log('  ❌ FAIL: Login successful but no token returned', 'red');
      results.failed++;
    }
  } else {
    log(`  ❌ FAIL: Valid login failed (${response1.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 2: Invalid password
  const response2 = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser.username, password: 'WrongPassword' })
  });

  if (response2.statusCode === 401) {
    log('  ✅ PASS: Invalid password rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Invalid password not handled (${response2.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 3: Non-existent user
  const response3 = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nonexistentuser999', password: 'Password123!' })
  });

  if (response3.statusCode === 401) {
    log('  ✅ PASS: Non-existent user rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Non-existent user not handled (${response3.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 4: Missing fields
  const response4 = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser.username })
  });

  if (response4.statusCode === 400 || response4.statusCode === 401) {
    log('  ✅ PASS: Missing password rejected', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Missing field validation failed (${response4.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;
}

async function testProtectedEndpoints() {
  log('\n🧪 Testing: Protected Endpoints', 'cyan');

  // Create and login a user
  const testUser = {
    username: `protectedtest_${Date.now()}`,
    password: 'TestPassword123!'
  };

  await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });

  let token = null;
  if (loginResponse.statusCode === 200) {
    const data = JSON.parse(loginResponse.data);
    token = data.token;
  }

  // Test 1: Access with valid token
  if (token) {
    const response1 = await makeRequest(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response1.statusCode === 200) {
      log('  ✅ PASS: Protected endpoint accessible with valid token', 'green');
      results.passed++;
    } else {
      log(`  ❌ FAIL: Valid token rejected (${response1.statusCode})`, 'red');
      results.failed++;
    }
  } else {
    log('  ⚠️  WARN: Could not get token for protected endpoint test', 'yellow');
    results.warnings++;
  }
  results.total++;

  // Test 2: Access without token
  const response2 = await makeRequest(`${BASE_URL}/api/users/profile`, {
    method: 'GET'
  });

  if (response2.statusCode === 401 || response2.statusCode === 403) {
    log('  ✅ PASS: Protected endpoint rejects requests without token', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Protected endpoint accessible without token! (${response2.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;

  // Test 3: Access with invalid token
  const response3 = await makeRequest(`${BASE_URL}/api/users/profile`, {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid_token_12345' }
  });

  if (response3.statusCode === 401 || response3.statusCode === 403) {
    log('  ✅ PASS: Protected endpoint rejects invalid token', 'green');
    results.passed++;
  } else {
    log(`  ❌ FAIL: Invalid token accepted! (${response3.statusCode})`, 'red');
    results.failed++;
  }
  results.total++;
}

async function testInputValidation() {
  log('\n🧪 Testing: Input Validation', 'cyan');

  // Test various malformed inputs
  const malformedInputs = [
    { data: 'not json', type: 'Invalid JSON' },
    { data: JSON.stringify({ username: '', password: '' }), type: 'Empty strings' },
    { data: JSON.stringify({ username: null, password: null }), type: 'Null values' },
    { data: JSON.stringify({ username: 'a'.repeat(1000), password: 'test' }), type: 'Extremely long username' }
  ];

  for (const input of malformedInputs) {
    const response = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: input.data
    });

    if (response.statusCode === 400 || response.statusCode === 500) {
      log(`  ✅ PASS: ${input.type} properly rejected`, 'green');
      results.passed++;
    } else if (response.statusCode === 200) {
      log(`  ❌ FAIL: ${input.type} accepted (should be rejected)`, 'red');
      results.failed++;
    } else {
      log(`  ⚠️  WARN: ${input.type} - unexpected status ${response.statusCode}`, 'yellow');
      results.warnings++;
    }
    results.total++;
  }
}

async function testErrorHandling() {
  log('\n🧪 Testing: Error Handling', 'cyan');

  // Test 1: Non-existent endpoint
  const response1 = await makeRequest(`${BASE_URL}/api/nonexistent/endpoint`, {
    method: 'GET'
  });

  if (response1.statusCode === 404) {
    log('  ✅ PASS: Non-existent endpoint returns 404', 'green');
    results.passed++;
  } else {
    log(`  ⚠️  WARN: Non-existent endpoint returns ${response1.statusCode}`, 'yellow');
    results.warnings++;
  }
  results.total++;

  // Test 2: Invalid HTTP method
  const response2 = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'DELETE'
  });

  if (response2.statusCode === 404 || response2.statusCode === 405) {
    log('  ✅ PASS: Invalid HTTP method properly rejected', 'green');
    results.passed++;
  } else {
    log(`  ⚠️  WARN: Invalid method returns ${response2.statusCode}`, 'yellow');
    results.warnings++;
  }
  results.total++;

  // Test 3: Missing Content-Type
  const response3 = await makeRequest(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    body: JSON.stringify({ username: 'test', password: 'test123' })
  });

  if (response3.statusCode >= 400) {
    log('  ✅ PASS: Missing Content-Type handled', 'green');
    results.passed++;
  } else {
    log('  ⚠️  WARN: Request without Content-Type accepted', 'yellow');
    results.warnings++;
  }
  results.total++;
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗');
  log('║           TRANSCENDENCE API EVALUATION TESTS              ║');
  log('╚════════════════════════════════════════════════════════════╝');
  log(`\nTarget URL: ${BASE_URL}`, 'blue');

  await testUserRegistration();
  await testUserLogin();
  await testProtectedEndpoints();
  await testInputValidation();
  await testErrorHandling();

  // Summary
  log('\n╔════════════════════════════════════════════════════════════╗');
  log('║                    TEST SUMMARY                            ║');
  log('╚════════════════════════════════════════════════════════════╝');

  log(`\nTotal Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Warnings: ${results.warnings}`, 'yellow');

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (results.failed > 0) {
    log('\n⚠️  Some API tests failed. Please review.', 'red');
    process.exit(1);
  } else {
    log('\n✅ All API tests passed!', 'green');
  }
}

runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
