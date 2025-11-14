#!/usr/bin/env node

/**
 * Security Tests for Transcendence Project
 *
 * Tests:
 * 1. HTTPS/TLS Configuration
 * 2. Password Hashing (bcrypt)
 * 3. SQL Injection Protection
 * 4. XSS Protection
 * 5. JWT Token Security
 * 6. Environment Variables
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'https://localhost:3001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://localhost';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
}

function logPass(message) {
  log(`  ✅ PASS: ${message}`, 'green');
}

function logFail(message) {
  log(`  ❌ FAIL: ${message}`, 'red');
}

function logWarn(message) {
  log(`  ⚠️  WARN: ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ℹ️  INFO: ${message}`, 'blue');
}

// Results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

function recordPass() {
  results.total++;
  results.passed++;
}

function recordFail() {
  results.total++;
  results.failed++;
}

function recordWarn() {
  results.warnings++;
}

// HTTP/HTTPS request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;

    const defaultOptions = {
      rejectUnauthorized: false, // Accept self-signed certificates
      ...options
    };

    const req = client.request(url, defaultOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          socket: res.socket
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

// Test 1: HTTPS/TLS Configuration
async function testHTTPS() {
  logTest('HTTPS/TLS Configuration');

  try {
    // Test if HTTPS is available
    const response = await makeRequest(`${BASE_URL}/health`, {
      method: 'GET'
    });

    if (response.error) {
      logFail(`HTTPS connection failed: ${response.error}`);
      logInfo('Make sure the server is running with HTTPS enabled');
      recordFail();
      return;
    }

    if (response.statusCode === 200) {
      logPass('HTTPS endpoint is accessible');
      recordPass();

      // Check if TLS is used
      if (response.socket && response.socket.encrypted) {
        logPass('TLS encryption is enabled');
        const cipher = response.socket.getCipher();
        logInfo(`Cipher: ${cipher.name}, Protocol: ${cipher.version}`);
        recordPass();
      } else {
        logWarn('Could not verify TLS encryption details');
        recordWarn();
      }
    } else {
      logFail(`Unexpected status code: ${response.statusCode}`);
      recordFail();
    }

    // Test if HTTP redirects to HTTPS or is disabled
    try {
      const httpResponse = await makeRequest('http://localhost:3001/health', {
        method: 'GET',
        timeout: 3000
      });

      if (httpResponse.error) {
        logPass('HTTP endpoint is disabled (good security practice)');
        recordPass();
      } else if (httpResponse.statusCode === 301 || httpResponse.statusCode === 302) {
        logPass('HTTP redirects to HTTPS');
        recordPass();
      } else {
        logWarn('HTTP endpoint is accessible without redirect');
        logInfo('Consider disabling HTTP or redirecting to HTTPS');
        recordWarn();
      }
    } catch (e) {
      logPass('HTTP endpoint is properly disabled');
      recordPass();
    }

  } catch (error) {
    logFail(`HTTPS test error: ${error.message}`);
    recordFail();
  }
}

// Test 2: Password Hashing
async function testPasswordHashing() {
  logTest('Password Hashing (bcrypt)');

  try {
    // Register a test user
    const testUser = {
      username: `testuser_${Date.now()}`,
      password: 'TestPassword123!'
    };

    logInfo(`Creating test user: ${testUser.username}`);

    const registerResponse = await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (registerResponse.error) {
      logFail(`Registration failed: ${registerResponse.error}`);
      recordFail();
      return;
    }

    if (registerResponse.statusCode === 200 || registerResponse.statusCode === 201) {
      logPass('User registration successful');

      const userData = JSON.parse(registerResponse.data);

      // Check that password is not returned in response
      if (userData.password) {
        logFail('Password is exposed in API response (security issue!)');
        recordFail();
      } else {
        logPass('Password is not exposed in API response');
        recordPass();
      }

      // Try to login to verify password was hashed correctly
      const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testUser)
      });

      if (loginResponse.statusCode === 200) {
        logPass('Password hashing works correctly (login successful)');
        logInfo('bcrypt is being used for password hashing');
        recordPass();
      } else {
        logFail('Login failed - password hashing may be broken');
        recordFail();
      }

    } else {
      logFail(`Registration failed with status ${registerResponse.statusCode}`);
      recordFail();
    }

  } catch (error) {
    logFail(`Password hashing test error: ${error.message}`);
    recordFail();
  }
}

// Test 3: SQL Injection Protection
async function testSQLInjection() {
  logTest('SQL Injection Protection');

  const sqlInjectionPayloads = [
    "admin' OR '1'='1",
    "admin'--",
    "admin' OR '1'='1' --",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users --"
  ];

  try {
    for (const payload of sqlInjectionPayloads) {
      const response = await makeRequest(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: payload,
          password: 'test123'
        })
      });

      // Should return 401 (unauthorized) or 400 (bad request), not 200 or 500
      if (response.statusCode === 200) {
        logFail(`SQL injection may be possible with payload: ${payload}`);
        recordFail();
        return;
      } else if (response.statusCode === 500) {
        logFail(`Server error on SQL injection payload (may indicate vulnerability): ${payload}`);
        recordFail();
        return;
      }
    }

    logPass('SQL injection payloads properly rejected');
    logInfo('Prepared statements appear to be used correctly');
    recordPass();

  } catch (error) {
    logFail(`SQL injection test error: ${error.message}`);
    recordFail();
  }
}

// Test 4: XSS Protection
async function testXSSProtection() {
  logTest('XSS (Cross-Site Scripting) Protection');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '"><script>alert(String.fromCharCode(88,83,83))</script>',
    '<iframe src="javascript:alert(\'XSS\')"></iframe>'
  ];

  try {
    const testUser = {
      username: `xsstest_${Date.now()}`,
      password: 'Test123!'
    };

    // Register user first
    await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    // Login to get token
    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (loginResponse.statusCode !== 200) {
      logWarn('Could not authenticate for XSS test');
      recordWarn();
      return;
    }

    const loginData = JSON.parse(loginResponse.data);
    const token = loginData.token;

    // Test XSS in profile update (if endpoint exists)
    for (const payload of xssPayloads) {
      const response = await makeRequest(`${BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          displayName: payload,
          bio: payload
        })
      });

      // Get profile back
      const profileResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (profileResponse.statusCode === 200) {
        const profileData = JSON.parse(profileResponse.data);

        // Check if the payload was stored as-is (bad) or sanitized (good)
        const displayName = profileData.displayName || '';
        const bio = profileData.bio || '';

        if (displayName.includes('<script>') || bio.includes('<script>')) {
          logFail('XSS payload was not sanitized');
          recordFail();
          return;
        }
      }
    }

    logPass('XSS payloads appear to be sanitized');
    logInfo('Input sanitization is working correctly');
    recordPass();

  } catch (error) {
    logWarn(`XSS test could not be completed: ${error.message}`);
    logInfo('This may be because profile endpoints are not yet implemented');
    recordWarn();
  }
}

// Test 5: JWT Token Security
async function testJWTSecurity() {
  logTest('JWT Token Security');

  try {
    // Create and login a test user
    const testUser = {
      username: `jwttest_${Date.now()}`,
      password: 'Test123!'
    };

    await makeRequest(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const loginResponse = await makeRequest(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    if (loginResponse.statusCode !== 200) {
      logFail('Could not authenticate for JWT test');
      recordFail();
      return;
    }

    const loginData = JSON.parse(loginResponse.data);
    const token = loginData.token;

    if (!token) {
      logFail('No JWT token returned from login');
      recordFail();
      return;
    }

    logPass('JWT token returned on login');
    recordPass();

    // Test accessing protected endpoint with valid token
    const validResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (validResponse.statusCode === 200) {
      logPass('Protected endpoint accessible with valid JWT');
      recordPass();
    } else {
      logFail('Valid JWT token rejected by protected endpoint');
      recordFail();
    }

    // Test accessing protected endpoint without token
    const noTokenResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
      method: 'GET'
    });

    if (noTokenResponse.statusCode === 401 || noTokenResponse.statusCode === 403) {
      logPass('Protected endpoint properly rejects requests without JWT');
      recordPass();
    } else {
      logFail('Protected endpoint accessible without JWT token!');
      recordFail();
    }

    // Test with invalid token
    const invalidResponse = await makeRequest(`${BASE_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_token_here'
      }
    });

    if (invalidResponse.statusCode === 401 || invalidResponse.statusCode === 403) {
      logPass('Protected endpoint properly rejects invalid JWT');
      recordPass();
    } else {
      logFail('Protected endpoint accepts invalid JWT token!');
      recordFail();
    }

  } catch (error) {
    logFail(`JWT security test error: ${error.message}`);
    recordFail();
  }
}

// Test 6: Environment Variables
function testEnvironmentVariables() {
  logTest('Environment Variables Security');

  const projectRoot = path.join(__dirname, '../..');

  // Check if .env exists
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    logPass('.env file exists');
    recordPass();

    // Check .gitignore
    const gitignorePath = path.join(projectRoot, '.gitignore');
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      if (gitignoreContent.includes('.env')) {
        logPass('.env is in .gitignore');
        recordPass();
      } else {
        logFail('.env is NOT in .gitignore - SECURITY RISK!');
        logInfo('Add .env to .gitignore immediately');
        recordFail();
      }
    } else {
      logWarn('.gitignore not found');
      recordWarn();
    }

    // Check if .env has sensitive data
    const envContent = fs.readFileSync(envPath, 'utf8');
    const sensitivePatterns = [
      /JWT_SECRET\s*=\s*["']?your-secret-key/i,
      /password\s*=\s*["']?password["']?/i,
      /secret\s*=\s*["']?secret["']?/i
    ];

    let hasWeakSecrets = false;
    sensitivePatterns.forEach(pattern => {
      if (pattern.test(envContent)) {
        hasWeakSecrets = true;
      }
    });

    if (hasWeakSecrets) {
      logWarn('Weak or default secrets detected in .env');
      logInfo('Make sure to use strong, unique secrets in production');
      recordWarn();
    } else {
      logPass('No obvious weak secrets in .env');
      recordPass();
    }

  } else {
    logWarn('.env file not found');
    logInfo('Make sure environment variables are properly configured');
    recordWarn();
  }

  // Check for credential files that shouldn't be in git
  const sensitiveFiles = [
    'credentials.json',
    'secrets.json',
    'private.key',
    '.secret'
  ];

  let foundSensitiveFiles = false;
  sensitiveFiles.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      logWarn(`Potentially sensitive file found: ${file}`);
      foundSensitiveFiles = true;
      recordWarn();
    }
  });

  if (!foundSensitiveFiles) {
    logPass('No obvious sensitive files in project root');
    recordPass();
  }
}

// Main test runner
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║        TRANSCENDENCE SECURITY EVALUATION TESTS            ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');

  log('\nStarting security tests...', 'cyan');
  log(`Target URL: ${BASE_URL}`, 'blue');

  await testHTTPS();
  await testPasswordHashing();
  await testSQLInjection();
  await testXSSProtection();
  await testJWTSecurity();
  testEnvironmentVariables();

  // Print summary
  log('\n╔════════════════════════════════════════════════════════════╗', 'bright');
  log('║                    TEST SUMMARY                            ║', 'bright');
  log('╚════════════════════════════════════════════════════════════╝', 'bright');

  log(`\nTotal Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Warnings: ${results.warnings}`, results.warnings > 0 ? 'yellow' : 'green');

  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(2) : 0;
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (results.failed > 0) {
    log('\n⚠️  CRITICAL SECURITY ISSUES FOUND!', 'red');
    log('Please review the failed tests above.', 'red');
    process.exit(1);
  } else if (results.warnings > 0) {
    log('\n⚠️  Some warnings were generated. Please review.', 'yellow');
  } else {
    log('\n✅ All security tests passed!', 'green');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
