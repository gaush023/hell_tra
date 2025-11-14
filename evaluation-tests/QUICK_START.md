# Quick Start Guide for Evaluators

This guide helps you quickly set up and run the evaluation tests.

## 🚀 Fast Track (5 minutes)

### 1. Start the Project
```bash
# From project root
docker-compose up --build
```

Wait for services to start (2-3 minutes).

### 2. Install Test Dependencies
```bash
cd evaluation-tests
npm install
```

### 3. Run All Tests
```bash
npm test
```

This will run:
- ✅ Security tests (HTTPS, passwords, SQL injection, XSS)
- ✅ API tests (registration, login, authentication)
- ✅ Game tests (WebSocket, game creation, tournaments)
- ✅ Integration tests (full user flows)

### 4. Review Results

Check the output in your terminal and the generated `test-results.txt` file.

---

## 📋 Manual Testing (20 minutes)

After automated tests pass, perform these manual tests:

### Test 1: User Registration & Login (3 min)
1. Open https://localhost (accept certificate warning)
2. Register: username `evaluator1`, password `Test123!`
3. Logout
4. Login with same credentials
5. ✅ Should work without errors

### Test 2: SPA Navigation (2 min)
1. Click through different pages (Profile, Friends, etc.)
2. Press browser Back button
3. Press browser Forward button
4. ✅ Navigation should work without page reload

### Test 3: Local Game (5 min)
1. Login with two accounts (open two browser windows/profiles)
2. One user creates a Pong game
3. Other user joins
4. Test both players' controls
5. Play until game ends
6. ✅ Game should work with both players

### Test 4: Tournament (5 min)
1. Create a tournament
2. Add 4 players
3. Check bracket generation
4. Play first match
5. ✅ Tournament should progress correctly

### Test 5: Connection Handling (3 min)
1. Start a game
2. Open DevTools → Network tab
3. Set throttle to "Slow 3G"
4. Or close one player's browser
5. ✅ Game should handle gracefully (no crash)

### Test 6: Security Check (2 min)
```bash
cd evaluation-tests
./utils/check-git-security.sh
```
✅ Should show no critical security issues

---

## 🔍 Module Verification (30-45 minutes)

For each module the team claims:

1. **Read PDF**: Understand requirements from subject.pdf
2. **Ask Demo**: "Please demonstrate [module name]"
3. **Ask Questions**:
   - "How did you implement this?"
   - "Why did you choose this approach?"
   - "What challenges did you face?"
4. **Test It**: Actually use the feature
5. **Check Errors**: Open browser console (F12)
6. **Verify Understanding**: Team should explain clearly

Use `EVALUATION_CHECKLIST.md` to document each module.

---

## ⚠️ Critical Failures

Stop evaluation immediately if:

### Security Issues
- ❌ No HTTPS
- ❌ Passwords not hashed
- ❌ Credentials in git repository
- ❌ SQL injection possible
- ❌ No authentication on protected endpoints

### Functionality Issues
- ❌ Website doesn't load
- ❌ Cannot register
- ❌ Cannot login
- ❌ Game crashes immediately
- ❌ 500 errors everywhere

In these cases: **Grade = 0** and provide feedback for fixes.

---

## 📊 Quick Scoring Reference

### Minimum to Pass (≥60)
- ✅ Security: All tests pass
- ✅ Basic: Registration, Login, SPA
- ✅ Game: Can play locally
- ✅ Modules: Minimum 7 minor modules (or equivalent)

### Good Score (70-85)
- All above +
- ✅ Tournament works
- ✅ Clean code
- ✅ No major bugs

### Excellent Score (85-100)
- All above +
- ✅ Advanced modules
- ✅ Extra features
- ✅ Polished UI/UX
- ✅ Excellent error handling

### Bonus Points
- Only if mandatory part is perfect
- Extra modules beyond requirements
- Exceptional implementation

---

## 🐛 Troubleshooting

### Tests Won't Run
```bash
# Check if server is running
curl -k https://localhost:3001/health

# If not, restart:
cd ..
docker-compose down
docker-compose up --build
```

### Certificate Errors
- This is normal for self-signed certificates
- Click "Advanced" → "Proceed to localhost (unsafe)"
- Acceptable for development/evaluation

### Port Conflicts
```bash
# Check what's using ports
lsof -i :80
lsof -i :443
lsof -i :3001

# Stop and restart
docker-compose down
docker-compose up --build
```

### Can't Install Test Dependencies
```bash
# Check Node version (need v16+)
node --version

# Update npm
npm install -g npm@latest

# Try again
cd evaluation-tests
npm install
```

---

## 📞 During Evaluation

### Good Practices
- ✅ Be respectful and constructive
- ✅ Give team time to explain
- ✅ Test features thoroughly
- ✅ Document issues clearly
- ✅ Verify team understands their code

### Bad Practices
- ❌ Don't edit files (except .env for credentials)
- ❌ Don't be aggressive or dismissive
- ❌ Don't rush - take time to understand
- ❌ Don't grade unfairly due to different approaches

### If Stuck
1. Refer to subject PDF
2. Ask team to explain
3. Check with other evaluators if available
4. Be fair - if in doubt, discuss with team

---

## ✅ Final Checklist

Before submitting grade:

- [ ] Ran automated tests
- [ ] Tested basic functionality manually
- [ ] Verified all claimed modules
- [ ] Checked for security issues
- [ ] Documented findings
- [ ] Filled out evaluation form
- [ ] Gave constructive feedback

---

**Good luck with your evaluation! 🎓**

For detailed instructions, see `README.md` and `EVALUATION_CHECKLIST.md`.
