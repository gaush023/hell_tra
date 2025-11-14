# Transcendence Project Evaluation Checklist

**Evaluator:** _____________________
**Date:** _____________________
**Team Members:** _____________________

## Pre-Evaluation Setup

- [ ] Clone the repository in an empty folder
- [ ] Check git log for malicious aliases: `git log --oneline | head -20`
- [ ] Verify docker-compose.yml is at project root
- [ ] Check for credentials in git: `./evaluation-tests/utils/check-git-security.sh`

## Security (CRITICAL - Must Pass ALL)

### HTTPS/TLS
- [ ] Application accessible via HTTPS (https://localhost)
- [ ] Backend accessible via HTTPS (https://localhost:3001)
- [ ] Certificate warning is acceptable (self-signed)
- [ ] HTTP either disabled or redirects to HTTPS

**Notes:** _____________________

### Password Security
- [ ] Passwords are hashed in database (bcrypt)
- [ ] Passwords NOT returned in API responses
- [ ] Password validation on server-side (min 6 chars)
- [ ] Cannot login with wrong password

**Notes:** _____________________

### Environment Variables
- [ ] `.env` file exists
- [ ] `.env` is in `.gitignore`
- [ ] No credentials in git history
- [ ] No credentials in source code files

**Notes:** _____________________

### Input Security
- [ ] SQL injection attacks blocked
- [ ] XSS payloads sanitized
- [ ] Server-side validation on all forms
- [ ] Protected endpoints require authentication

**Notes:** _____________________

**SECURITY VERDICT:** ✅ PASS / ❌ FAIL (If fail, evaluation must stop - mark as 0)

---

## Basic Functionality

### Website Availability
- [ ] Website loads at https://localhost
- [ ] No 500 errors on page load
- [ ] No console errors (minor warnings OK)
- [ ] CSS/styling loads correctly

**Notes:** _____________________

### User Registration
- [ ] Can access registration form
- [ ] Can create account with valid credentials
- [ ] Duplicate username rejected
- [ ] Short username/password rejected (validation works)
- [ ] Receives appropriate error messages

**Test Account Created:**
- Username: _____________________
- Result: ✅ PASS / ❌ FAIL

### User Login
- [ ] Can login with registered account
- [ ] Invalid credentials rejected
- [ ] Redirected to main page after login
- [ ] User session persists on page refresh

**Test Login:**
- Username: _____________________
- Result: ✅ PASS / ❌ FAIL

### Single Page Application
- [ ] Navigation doesn't reload entire page
- [ ] Browser Back button works correctly
- [ ] Browser Forward button works correctly
- [ ] URL changes reflect current view
- [ ] Can bookmark specific pages

**Test Navigation:**
- Go to Profile → Back button → Forward button
- Result: ✅ PASS / ❌ FAIL

### Browser Compatibility
- [ ] Works in specified browser (Chrome/Firefox/Safari)
- [ ] No major layout issues
- [ ] Interactive elements work

**Browser Tested:** _____________________
**Result:** ✅ PASS / ❌ FAIL

---

## Game Functionality

### Local Game
- [ ] Can start a local 2-player game
- [ ] Player 1 controls work (W/S or Arrow Up/Down)
- [ ] Player 2 controls work (different keys)
- [ ] Ball physics work correctly
- [ ] Score is tracked
- [ ] Game ends properly

**Test Game:**
- Game Type: _____________________
- Both players functional: ✅ YES / ❌ NO
- Result: ✅ PASS / ❌ FAIL

### Gameplay Quality
- [ ] Game follows Pong rules
- [ ] Controls are intuitive or explained
- [ ] Game is playable (not too fast/slow)
- [ ] Win condition works
- [ ] End-game screen or exit works

**Notes:** _____________________

### Tournament
- [ ] Can create a tournament
- [ ] Can add multiple players (minimum 4)
- [ ] Bracket/matchmaking system works
- [ ] Tournament progresses through rounds
- [ ] Winner is determined

**Test Tournament:**
- Players: _____________________
- Bracket works: ✅ YES / ❌ NO
- Result: ✅ PASS / ❌ FAIL

### Connection Handling
- [ ] Tested lag/slow connection
- [ ] Tested disconnect during game
- [ ] Game doesn't crash
- [ ] Appropriate handling (pause, reconnect, or graceful end)

**Test Method:** _____________________
**Result:** ✅ PASS / ❌ FAIL

---

## Modules Verification

For each module, verify:
1. Read the PDF requirements
2. Ask team to demonstrate
3. Test the functionality
4. Ask questions about implementation
5. Verify no major errors

### Module 1: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________
- [ ] Requirement 2: _____________________
- [ ] Requirement 3: _____________________

**Team Explanation:**
_____________________

**Testing Notes:**
_____________________

**Errors Found:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

### Module 2: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________
- [ ] Requirement 2: _____________________
- [ ] Requirement 3: _____________________

**Team Explanation:**
_____________________

**Testing Notes:**
_____________________

**Errors Found:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

### Module 3: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________
- [ ] Requirement 2: _____________________
- [ ] Requirement 3: _____________________

**Team Explanation:**
_____________________

**Testing Notes:**
_____________________

**Errors Found:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

### Module 4: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________
- [ ] Requirement 2: _____________________

**Team Explanation:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

### Module 5: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________
- [ ] Requirement 2: _____________________

**Team Explanation:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

### Module 6: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________

**Team Explanation:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

### Module 7: _____________________

**Type:** Major (2 pts) / Minor (1 pt)

**Requirements from PDF:**
- [ ] Requirement 1: _____________________

**Team Explanation:**
_____________________

**Verdict:** ✅ PASS / ❌ FAIL

---

## Bonus Modules

**Only evaluate if ALL mandatory parts passed!**

### Bonus 1: _____________________

**Points:** _____
**Verdict:** ✅ PASS / ❌ FAIL

---

## Memory Leaks

- [ ] Checked for memory leaks (valgrind/leaks if applicable)
- [ ] No significant memory leaks found

**Method:** _____________________
**Result:** ✅ PASS / ❌ FAIL

---

## Code Quality (Informational)

- [ ] Code is readable and organized
- [ ] Appropriate comments where needed
- [ ] Follows TypeScript/JavaScript best practices
- [ ] No obvious bad practices

**Notes:** _____________________

---

## Issues and Concerns

List any problems found:

1. _____________________
2. _____________________
3. _____________________

---

## Final Scoring

### Mandatory Score Calculation

- **Security (Pass/Fail):** _____
- **Basic Functionality (Pass/Fail):** _____
- **Game Functionality (Pass/Fail):** _____
- **Module 1 (Major = 2, Minor = 1):** _____
- **Module 2:** _____
- **Module 3:** _____
- **Module 4:** _____
- **Module 5:** _____
- **Module 6:** _____
- **Module 7:** _____

**Total Mandatory:** _____ / 100

### Bonus Points
- **Bonus Module 1:** _____
- **Bonus Module 2:** _____

**Total Bonus:** _____ / _____

### Final Grade

**FINAL SCORE:** _____ / 100 (+ _____ bonus)

---

## Recommendation

- [ ] **Outstanding** (90-100): Exceptional work, all features working perfectly
- [ ] **Excellent** (80-89): Very good work, minor issues only
- [ ] **Good** (70-79): Good work, some issues but fundamentally sound
- [ ] **Pass** (60-69): Acceptable work, meets minimum requirements
- [ ] **Fail** (<60): Does not meet minimum requirements
- [ ] **Fail (0)**: Critical security issues or non-functional

---

## Evaluator Comments

**What went well:**
_____________________

**Areas for improvement:**
_____________________

**Additional notes:**
_____________________

---

**Evaluator Signature:** _____________________
**Date:** _____________________
**Time Spent:** _____ minutes
