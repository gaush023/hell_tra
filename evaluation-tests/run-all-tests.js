#!/usr/bin/env node

/**
 * Master Test Runner for Transcendence Evaluation
 * Runs all test suites and generates a comprehensive report
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const testSuites = [
  {
    name: 'Security Tests',
    script: 'security/test-security.js',
    critical: true,
    description: 'HTTPS, password hashing, SQL injection, XSS protection'
  },
  {
    name: 'API Tests',
    script: 'api/test-api.js',
    critical: true,
    description: 'User registration, login, authentication, validation'
  },
  {
    name: 'Game Tests',
    script: 'game/test-game.js',
    critical: false,
    description: 'WebSocket, game creation, tournaments, state updates'
  },
  {
    name: 'Integration Tests',
    script: 'integration/test-integration.js',
    critical: false,
    description: 'Full user flows, friend system, match history'
  }
];

function runTest(testSuite) {
  return new Promise((resolve) => {
    const scriptPath = path.join(__dirname, testSuite.script);

    log(`\n${'='.repeat(70)}`, 'cyan');
    log(`Running: ${testSuite.name}`, 'bright');
    log(`Description: ${testSuite.description}`, 'blue');
    log(`Critical: ${testSuite.critical ? 'YES' : 'NO'}`, testSuite.critical ? 'red' : 'yellow');
    log('='.repeat(70), 'cyan');

    const child = spawn('node', [scriptPath], {
      stdio: 'inherit',
      env: { ...process.env }
    });

    child.on('close', (code) => {
      resolve({
        name: testSuite.name,
        passed: code === 0,
        exitCode: code,
        critical: testSuite.critical
      });
    });

    child.on('error', (error) => {
      log(`\n❌ Error running ${testSuite.name}: ${error.message}`, 'red');
      resolve({
        name: testSuite.name,
        passed: false,
        exitCode: 1,
        error: error.message,
        critical: testSuite.critical
      });
    });
  });
}

function generateReport(results) {
  const timestamp = new Date().toISOString();
  const reportPath = path.join(__dirname, 'test-results.txt');

  let report = `
╔════════════════════════════════════════════════════════════════════════╗
║                   TRANSCENDENCE EVALUATION REPORT                      ║
╚════════════════════════════════════════════════════════════════════════╝

Generated: ${timestamp}
Project: ft_transcendence
Evaluator: [Your Name Here]

═══════════════════════════════════════════════════════════════════════════

TEST RESULTS SUMMARY
═══════════════════════════════════════════════════════════════════════════

`;

  let allPassed = true;
  let criticalFailed = false;

  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const critical = result.critical ? '[CRITICAL]' : '[OPTIONAL]';

    report += `${status} ${critical} ${result.name}\n`;

    if (!result.passed) {
      allPassed = false;
      if (result.critical) {
        criticalFailed = true;
      }
    }

    if (result.error) {
      report += `   Error: ${result.error}\n`;
    }
  });

  report += `
═══════════════════════════════════════════════════════════════════════════

EVALUATION CHECKLIST
═══════════════════════════════════════════════════════════════════════════

SECURITY (CRITICAL - MUST PASS ALL):
${results.find(r => r.name === 'Security Tests')?.passed ? '✅' : '❌'} HTTPS/TLS enabled
${results.find(r => r.name === 'Security Tests')?.passed ? '✅' : '❌'} Password hashing (bcrypt)
${results.find(r => r.name === 'Security Tests')?.passed ? '✅' : '❌'} No credentials in git
${results.find(r => r.name === 'Security Tests')?.passed ? '✅' : '❌'} SQL injection protection
${results.find(r => r.name === 'Security Tests')?.passed ? '✅' : '❌'} XSS protection
${results.find(r => r.name === 'Security Tests')?.passed ? '✅' : '❌'} Server-side validation

BASIC FUNCTIONALITY:
${results.find(r => r.name === 'API Tests')?.passed ? '✅' : '❌'} User registration works
${results.find(r => r.name === 'API Tests')?.passed ? '✅' : '❌'} User login works
${results.find(r => r.name === 'API Tests')?.passed ? '✅' : '❌'} Protected endpoints secured
[ ] SPA navigation (manual test required)
[ ] Browser compatibility (manual test required)

GAME FUNCTIONALITY:
${results.find(r => r.name === 'Game Tests')?.passed ? '✅' : '⚠️ '} WebSocket connection
${results.find(r => r.name === 'Game Tests')?.passed ? '✅' : '⚠️ '} Game creation
${results.find(r => r.name === 'Game Tests')?.passed ? '✅' : '⚠️ '} Tournament support
[ ] Local multiplayer (manual test required)
[ ] Keyboard controls (manual test required)
[ ] Game rules compliance (manual test required)

INTEGRATION:
${results.find(r => r.name === 'Integration Tests')?.passed ? '✅' : '⚠️ '} Full user journey
${results.find(r => r.name === 'Integration Tests')?.passed ? '✅' : '⚠️ '} Friend system
${results.find(r => r.name === 'Integration Tests')?.passed ? '✅' : '⚠️ '} Match history
${results.find(r => r.name === 'Integration Tests')?.passed ? '✅' : '⚠️ '} Profile management

═══════════════════════════════════════════════════════════════════════════

MODULES IMPLEMENTED
═══════════════════════════════════════════════════════════════════════════

Based on the test results and codebase analysis:

Major Modules (2 minor modules each):
- [ ] Module 1: _________________________________
- [ ] Module 2: _________________________________
- [ ] Module 3: _________________________________

Minor Modules:
- [ ] Module 4: _________________________________
- [ ] Module 5: _________________________________
- [ ] Module 6: _________________________________
- [ ] Module 7: _________________________________

BONUS Modules:
- [ ] Extra 1: _________________________________

═══════════════════════════════════════════════════════════════════════════

MANUAL TESTING NOTES
═══════════════════════════════════════════════════════════════════════════

Please perform the following manual tests and document results:

1. SPA Navigation:
   - Use browser Back/Forward buttons
   - Result: _____________________

2. Local Game:
   - Test with 2 players on same keyboard
   - Result: _____________________

3. Tournament:
   - Create tournament with 4+ players
   - Verify matchmaking and bracket
   - Result: _____________________

4. Lag/Disconnect Handling:
   - Simulate network issues
   - Result: _____________________

5. Module Demonstrations:
   - Ask team to demonstrate each module
   - Verify understanding and implementation
   - Results: _____________________

═══════════════════════════════════════════════════════════════════════════

ISSUES FOUND
═══════════════════════════════════════════════════════════════════════════

List any issues, bugs, or concerns:

1. _________________________________________________________________________
2. _________________________________________________________________________
3. _________________________________________________________________________

═══════════════════════════════════════════════════════════════════════════

OVERALL ASSESSMENT
═══════════════════════════════════════════════════════════════════════════

${criticalFailed ? '❌ CRITICAL TESTS FAILED - Security issues must be fixed!' : '✅ All critical tests passed'}

Automated Tests: ${results.filter(r => r.passed).length} / ${results.length} passed
Security Status: ${results.find(r => r.name === 'Security Tests')?.passed ? 'SECURE ✅' : 'INSECURE ❌'}
Basic Functionality: ${results.find(r => r.name === 'API Tests')?.passed ? 'WORKING ✅' : 'ISSUES FOUND ❌'}

Recommended Grade: ___ / 100

Evaluator Signature: _______________________
Date: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════════════════════
`;

  fs.writeFileSync(reportPath, report);

  return { report, reportPath, criticalFailed };
}

async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════════════╗', 'bright');
  log('║     TRANSCENDENCE PROJECT - COMPREHENSIVE EVALUATION SUITE        ║', 'bright');
  log('╚════════════════════════════════════════════════════════════════════╝', 'bright');

  log('\n📋 Running all test suites...', 'cyan');
  log('This may take a few minutes.\n', 'blue');

  const results = [];

  for (const testSuite of testSuites) {
    const result = await runTest(testSuite);
    results.push(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  log('\n\n' + '='.repeat(70), 'cyan');
  log('ALL TESTS COMPLETED', 'bright');
  log('='.repeat(70), 'cyan');

  // Generate report
  const { report, reportPath, criticalFailed } = generateReport(results);

  // Print summary
  log('\n' + report, 'reset');

  log(`\n📄 Full report saved to: ${reportPath}`, 'blue');

  if (criticalFailed) {
    log('\n🚨 CRITICAL FAILURE: Security or basic functionality tests failed!', 'red');
    log('The project cannot pass evaluation until these issues are fixed.\n', 'red');
    process.exit(1);
  } else {
    const allPassed = results.every(r => r.passed);
    if (allPassed) {
      log('\n🎉 Excellent! All automated tests passed!', 'green');
      log('Continue with manual testing and module verification.\n', 'green');
    } else {
      log('\n⚠️  Some optional tests failed or had warnings.', 'yellow');
      log('Review the results and continue with manual testing.\n', 'yellow');
    }
  }
}

// Check if server is running
const https = require('https');
function checkServer() {
  return new Promise((resolve) => {
    const req = https.get('https://localhost:3001/health', {
      rejectUnauthorized: false,
      timeout: 3000
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Main execution
(async () => {
  log('\n🔍 Checking if server is running...', 'cyan');

  const serverRunning = await checkServer();

  if (!serverRunning) {
    log('\n❌ Server is not running or not accessible!', 'red');
    log('Please start the server with: docker-compose up --build', 'yellow');
    log('Then run this test suite again.\n', 'yellow');
    process.exit(1);
  }

  log('✅ Server is running!\n', 'green');

  await runAllTests();
})();
