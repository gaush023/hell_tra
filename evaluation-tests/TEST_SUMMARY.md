# Test Suite Summary

This document provides an overview of all tests in the evaluation suite.

## 📁 Directory Structure

```
evaluation-tests/
├── security/           # Security and authentication tests
│   └── test-security.js
├── api/               # API endpoint tests
│   └── test-api.js
├── game/              # Game functionality tests
│   └── test-game.js
├── integration/       # Full user flow tests
│   └── test-integration.js
├── utils/             # Helper scripts
│   └── check-git-security.sh
├── package.json       # Test dependencies
├── run-all-tests.js  # Master test runner
├── README.md          # Complete documentation
├── QUICK_START.md     # Fast setup guide
└── EVALUATION_CHECKLIST.md  # Manual evaluation form
```

## 🧪 Test Categories

### 1. Security Tests (`security/test-security.js`)

**Purpose:** Verify critical security requirements

**Tests:**
- ✅ HTTPS/TLS Configuration
  - Checks if HTTPS is enabled
  - Verifies TLS encryption
  - Tests HTTP redirect/disable

- ✅ Password Hashing
  - Registers test users
  - Verifies passwords are hashed (bcrypt)
  - Confirms passwords not exposed in responses
  - Tests login with hashed passwords

- ✅ SQL Injection Protection
  - Tests various SQL injection payloads
  - Verifies prepared statements usage
  - Ensures malicious input is rejected

- ✅ XSS Protection
  - Tests XSS payloads in user input
  - Verifies input sanitization
  - Checks stored XSS prevention

- ✅ JWT Token Security
  - Tests token generation
  - Verifies protected endpoints require token
  - Tests invalid token rejection
  - Confirms token validation

- ✅ Environment Variables
  - Checks .env file exists
  - Verifies .env in .gitignore
  - Scans for weak/default secrets
  - Checks for sensitive files

**Critical:** ALL must pass for project to pass evaluation

---

### 2. API Tests (`api/test-api.js`)

**Purpose:** Verify API functionality and validation

**Tests:**
- ✅ User Registration
  - Valid registration
  - Duplicate username rejection
  - Short username rejection
  - Short password rejection
  - Missing field validation

- ✅ User Login
  - Valid login with token
  - Invalid password rejection
  - Non-existent user rejection
  - Missing field validation

- ✅ Protected Endpoints
  - Access with valid token
  - Access without token (should fail)
  - Access with invalid token (should fail)

- ✅ Input Validation
  - Invalid JSON
  - Empty strings
  - Null values
  - Extremely long inputs

- ✅ Error Handling
  - Non-existent endpoints (404)
  - Invalid HTTP methods
  - Missing Content-Type header

**Critical:** Core functionality must work

---

### 3. Game Tests (`game/test-game.js`)

**Purpose:** Verify game functionality

**Tests:**
- ✅ WebSocket Connection
  - Establishes connection with token
  - Receives welcome message
  - Tests message reception

- ✅ Game Creation
  - Creates Pong game via WebSocket
  - Verifies game creation message
  - Tests error handling

- ✅ Player Management
  - Multiple WebSocket connections
  - Player join/leave
  - Player state management

- ✅ Tournament Functionality
  - Creates tournament
  - Adds multiple players
  - Tests bracket generation
  - Verifies tournament progression

- ✅ Game State Updates
  - Receives game state messages
  - Tests player movement
  - Verifies state synchronization

**Important:** Should work but some issues acceptable

---

### 4. Integration Tests (`integration/test-integration.js`)

**Purpose:** Test complete user flows

**Tests:**
- ✅ Full User Journey
  - Register → Login → Profile → Game
  - Complete end-to-end flow
  - Tests all systems together

- ✅ Friend System
  - Creates multiple users
  - Sends friend requests
  - Tests friend acceptance
  - Verifies friend list

- ✅ Match History
  - Retrieves match history
  - Verifies data format
  - Tests pagination

- ✅ Profile Management
  - Updates profile data
  - Verifies persistence
  - Tests profile retrieval

**Important:** Demonstrates features work together

---

## 🔧 Utility Scripts

### `utils/check-git-security.sh`

**Purpose:** Check git repository for security issues

**Checks:**
- .env files in git history
- Credential files in history
- Hardcoded secrets in code
- .gitignore configuration
- Currently tracked sensitive files

**Usage:**
```bash
cd evaluation-tests
./utils/check-git-security.sh
```

---

## 🎯 Running Tests

### Quick Run (All Tests)
```bash
cd evaluation-tests
npm install
npm test
```

### Individual Test Suites
```bash
npm run test:security      # Security tests only
npm run test:api          # API tests only
npm run test:game         # Game tests only
npm run test:integration  # Integration tests only
```

### Master Test Runner
```bash
node run-all-tests.js
```

This runs all suites and generates a comprehensive report.

---

## 📊 Test Results

### Success Criteria

#### Critical (Must Pass)
- **Security Tests:** 100% pass rate required
  - Any failure = project fails evaluation
  - Security is non-negotiable

- **API Tests:** ≥80% pass rate required
  - Core functionality must work
  - Minor issues acceptable

#### Important (Should Pass)
- **Game Tests:** ≥60% pass rate expected
  - Main features should work
  - Some issues acceptable

- **Integration Tests:** ≥60% pass rate expected
  - Overall system should work
  - Edge cases can have issues

### Report Generation

After running all tests, a report is generated:
- File: `test-results.txt`
- Contains: Pass/fail status, checklist, notes section
- Use for: Documentation and grading

---

## 🎓 Evaluation Workflow

1. **Automated Testing** (10 minutes)
   ```bash
   npm test
   ```
   Review results, note any failures

2. **Security Verification** (5 minutes)
   ```bash
   ./utils/check-git-security.sh
   ```
   Ensure no credentials in git

3. **Manual Testing** (20 minutes)
   - Register and login
   - Test SPA navigation
   - Play local game
   - Test tournament
   - Check lag/disconnect handling

4. **Module Verification** (30-45 minutes)
   - Review each claimed module
   - Ask for demonstrations
   - Test functionality
   - Verify understanding

5. **Documentation** (10 minutes)
   - Fill out EVALUATION_CHECKLIST.md
   - Document issues
   - Calculate final score

**Total Time:** ~75-90 minutes

---

## 🚨 Critical Failure Conditions

Stop evaluation and assign grade of **0** if:

### Security Failures
- No HTTPS/TLS
- Passwords not hashed
- Credentials in git repository
- SQL injection possible
- No authentication on protected endpoints

### Functional Failures
- Website doesn't load
- Cannot register users
- Cannot login
- Game crashes on start
- Constant 500 errors

### Academic Integrity
- Plagiarized code
- Purchased solution
- Malicious code
- Cheating detected

---

## 📝 Test Output Format

### Console Output
- 🧪 Test Name (cyan)
- ✅ PASS (green)
- ❌ FAIL (red)
- ⚠️  WARN (yellow)
- ℹ️  INFO (blue)

### Report File
- Plain text format
- Checklist with checkboxes
- Notes section
- Final score calculation

---

## 🔄 Updating Tests

If you need to modify tests:

1. **Security Tests:** Be conservative - security is critical
2. **API Tests:** Adjust for actual endpoints used
3. **Game Tests:** May need WebSocket message format changes
4. **Integration Tests:** Adjust for actual feature set

---

## 📚 Reference Documents

- `README.md` - Complete documentation
- `QUICK_START.md` - Fast setup guide
- `EVALUATION_CHECKLIST.md` - Manual evaluation form
- `subject.pdf` - Official project requirements

---

## 🆘 Troubleshooting

### Tests Won't Connect
```bash
# Verify server is running
curl -k https://localhost:3001/health

# Check docker containers
docker ps

# Restart if needed
docker-compose down && docker-compose up --build
```

### Certificate Errors
- Normal for self-signed certificates
- Click through browser warnings
- Tests use `rejectUnauthorized: false`

### WebSocket Issues
- Check firewall settings
- Verify ports 80, 443, 3001 are open
- Check docker network configuration

---

## ✅ Quality Checklist

Before using these tests:
- [x] All test files are executable
- [x] Dependencies documented in package.json
- [x] Environment variables have examples
- [x] Documentation is complete
- [x] Tests are non-destructive
- [x] Results are clearly formatted
- [x] Critical vs optional tests marked

---

## 📞 Support

If you have issues with the test suite:
1. Check QUICK_START.md
2. Review README.md troubleshooting section
3. Verify project is running correctly
4. Check test configuration (.env)

---

**Remember:** The goal is fair, thorough evaluation that helps students learn.

Tests are tools to help you evaluate - not a replacement for understanding the project.
