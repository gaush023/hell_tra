# Transcendence Project - Evaluation Test Suite

This test suite is designed to help evaluators thoroughly test the Transcendence project according to the official evaluation criteria.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Test Categories](#test-categories)
- [Running Tests](#running-tests)
- [Evaluation Checklist](#evaluation-checklist)
- [Manual Testing Guide](#manual-testing-guide)

## Prerequisites

Before running the tests, ensure:

1. The project is running with `docker-compose up --build`
2. The application is accessible at `https://localhost`
3. The backend API is accessible at `https://localhost:3001`
4. You have Node.js installed (v16 or higher)

## Installation

```bash
cd evaluation-tests
npm install
```

## Test Categories

### 1. Security Tests (`security/`)
- ✅ HTTPS/TLS verification
- ✅ Password hashing in database
- ✅ SQL injection protection
- ✅ XSS (Cross-Site Scripting) protection
- ✅ JWT token validation
- ✅ Environment variables security

### 2. API Tests (`api/`)
- ✅ User registration
- ✅ User login/authentication
- ✅ Protected endpoints
- ✅ Input validation
- ✅ Error handling

### 3. Game Tests (`game/`)
- ✅ Game creation
- ✅ WebSocket connectivity
- ✅ Player management
- ✅ Tournament functionality
- ✅ Game state synchronization

### 4. Integration Tests (`integration/`)
- ✅ Full user flow (register → login → play)
- ✅ SPA navigation
- ✅ Real-time features

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Individual Test Suites
```bash
# Security tests only
npm run test:security

# API tests only
npm run test:api

# Game tests only
npm run test:game

# Integration tests
npm run test:integration
```

### Generate Report
```bash
npm run report
```

## Evaluation Checklist

### 🔒 Security (CRITICAL - Must Pass)

- [ ] **HTTPS/TLS Enabled**: Application accessible via HTTPS
- [ ] **No Credentials in Git**: Check `.env` is in `.gitignore`
- [ ] **Password Hashing**: Passwords are hashed with bcrypt
- [ ] **SQL Injection Protection**: Prepared statements used
- [ ] **XSS Protection**: User input is sanitized
- [ ] **Server-side Validation**: Forms validated on backend

### 🌐 Basic Functionality

- [ ] **Website Available**: Loads without errors
- [ ] **User Registration**: Can create new account
- [ ] **User Login**: Can authenticate
- [ ] **SPA Navigation**: Back/Forward buttons work
- [ ] **Browser Compatible**: Works in latest browser

### 🎮 Game Functionality

- [ ] **Local Game**: Can play on same keyboard
- [ ] **Multiple Players**: Supports keyboard sections
- [ ] **Tournament**: Can create and join tournaments
- [ ] **Matchmaking**: Tournament pairing works
- [ ] **Game Rules**: Follows Pong mechanics
- [ ] **Game End**: Proper end-game handling

### 🔌 Connection Handling

- [ ] **Lag Handling**: Game doesn't crash on lag
- [ ] **Disconnect Handling**: Graceful disconnect handling
- [ ] **Reconnection**: Can reconnect after disconnect

### 📦 Modules

Verify each implemented module:
- [ ] Module 1: _____________________
- [ ] Module 2: _____________________
- [ ] Module 3: _____________________
- [ ] Module 4: _____________________
- [ ] Module 5: _____________________
- [ ] Module 6: _____________________
- [ ] Module 7: _____________________

## Manual Testing Guide

### 1. Preliminary Checks

```bash
# Check for credentials in git
cd ..
git log --all --full-history --source -- '*env*' | head -20

# Check .gitignore
cat .gitignore | grep -E '\.env|credentials|secrets|keys'

# Verify docker-compose at root
ls -la docker-compose.yml
```

### 2. Start Application

```bash
# From project root
docker-compose up --build

# Wait for services to start, then verify:
# - Frontend: https://localhost
# - Backend: https://localhost:3001/health
```

### 3. Test Security

#### HTTPS Verification
1. Open browser to `https://localhost`
2. Check for 🔒 icon in address bar
3. View certificate details

#### Password Hashing
Run automated test:
```bash
cd evaluation-tests
npm run test:security
```

Or check manually:
```bash
# Access database container
docker exec -it <backend-container> sh
# Check password hash format (should be bcrypt)
```

### 4. Test Basic Functionality

#### User Registration
1. Open `https://localhost`
2. Click Register/Sign Up
3. Enter username (min 3 chars) and password (min 6 chars)
4. Verify successful registration

#### User Login
1. Enter credentials from registration
2. Verify successful login
3. Check JWT token in localStorage

#### SPA Navigation
1. Navigate through different pages
2. Use browser Back button - should work
3. Use browser Forward button - should work
4. Check URL changes in address bar

### 5. Test Game Functionality

#### Local 2-Player Game
1. Login with first user
2. Create or join a Pong game
3. Test keyboard controls:
   - Player 1: W/S or Arrow Up/Down
   - Player 2: Arrow keys or other section
4. Play until game ends
5. Verify score tracking

#### Tournament
1. Create a tournament
2. Add multiple players (minimum 4)
3. Verify bracket generation
4. Play tournament matches
5. Verify winner advancement

### 6. Test Connection Handling

#### Lag Simulation
1. Start a game
2. Open browser DevTools → Network tab
3. Throttle network to "Slow 3G"
4. Verify game continues or handles lag gracefully

#### Disconnect Test
1. Start a game with 2 players (2 browsers)
2. Close one browser tab
3. Verify other player sees disconnect
4. Verify game doesn't crash

### 7. Module Verification

For each module claimed by the team:

1. **Read the PDF**: Understand module requirements
2. **Ask for Demo**: Have team demonstrate the feature
3. **Ask Questions**: Ensure team understands implementation
4. **Verify No Errors**: Check browser console for errors
5. **Check Completeness**: Ensure all module requirements met

## Test Results Documentation

Create a file `test-results.txt` to document your findings:

```
=== TRANSCENDENCE EVALUATION ===
Date: YYYY-MM-DD
Evaluator: [Your Name]
Team: [Team Names]

SECURITY TESTS:
✅ HTTPS/TLS: PASS
✅ Password Hashing: PASS - bcrypt with 12 rounds
✅ No Credentials in Git: PASS
✅ SQL Injection: PASS - Prepared statements used
✅ XSS Protection: PASS - Input sanitized

BASIC FUNCTIONALITY:
✅ Website Available: PASS
✅ User Registration: PASS
✅ User Login: PASS
✅ SPA Navigation: PASS
✅ Browser Compatibility: PASS

GAME FUNCTIONALITY:
✅ Local Game: PASS
✅ Tournament: PASS
[... continue for all sections ...]

MODULES:
✅ Module 1 - [Name]: PASS - [Brief description]
[... continue for all modules ...]

BONUS:
[If applicable]

ISSUES FOUND:
[List any issues]

FINAL GRADE: [Score] / 100
```

## Common Issues and Solutions

### Certificate Errors
If you see SSL certificate warnings:
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost"
- This is acceptable for development

### Port Already in Use
```bash
# Stop existing containers
docker-compose down

# Check for processes using ports 80, 443, 3001
lsof -i :80
lsof -i :443
lsof -i :3001
```

### Database Not Initialized
```bash
# Rebuild containers
docker-compose down -v
docker-compose up --build
```

## Automated Test Scripts

The automated tests will check:
- Security configurations
- API endpoints
- Database security
- WebSocket connections
- Input validation
- Error handling

Run them with:
```bash
npm test
```

## Contact

For issues with the test suite itself, please contact the evaluator or check the project documentation.

---

**Remember**: The goal is to evaluate fairly and constructively. Help the team understand any issues and verify their learning.
