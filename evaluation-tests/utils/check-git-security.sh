#!/bin/bash

# Check for security issues in git history
# This script helps evaluators verify no credentials are committed

echo "╔════════════════════════════════════════════════════════════╗"
echo "║          GIT SECURITY CHECK FOR EVALUATION                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")/../.." || exit 1

echo "🔍 Checking for sensitive files in git history..."
echo ""

# Check for .env files in git history
echo "1. Checking for .env files..."
if git log --all --full-history --source -- '*.env' '*env*' | grep -q "commit"; then
    echo "   ⚠️  WARNING: .env or env files found in git history!"
    echo "   Files found:"
    git log --all --oneline --name-only --full-history -- '*.env' '*env*' | grep -E '\.env|env' | sort -u
    echo ""
else
    echo "   ✅ No .env files found in git history"
fi

# Check for credential files
echo ""
echo "2. Checking for credential files..."
CREDENTIAL_PATTERNS=("credentials" "secrets" "private.key" "id_rsa" "*.pem")
FOUND_CREDS=false

for pattern in "${CREDENTIAL_PATTERNS[@]}"; do
    if git log --all --full-history --source -- "*${pattern}*" | grep -q "commit"; then
        echo "   ⚠️  WARNING: Files matching '${pattern}' found in history!"
        FOUND_CREDS=true
    fi
done

if [ "$FOUND_CREDS" = false ]; then
    echo "   ✅ No obvious credential files in git history"
fi

# Check for hardcoded secrets in current code
echo ""
echo "3. Checking for hardcoded secrets in current code..."
if grep -r -E "(password|secret|key)\s*=\s*['\"][^'\"]{8,}['\"]" --include="*.ts" --include="*.js" --exclude-dir=node_modules --exclude-dir=dist . 2>/dev/null | grep -v "your-secret-key-CHANGE"; then
    echo "   ⚠️  WARNING: Potential hardcoded secrets found!"
else
    echo "   ✅ No obvious hardcoded secrets found"
fi

# Check .gitignore
echo ""
echo "4. Checking .gitignore..."
if [ -f .gitignore ]; then
    if grep -q "\.env" .gitignore; then
        echo "   ✅ .env is in .gitignore"
    else
        echo "   ❌ FAIL: .env is NOT in .gitignore!"
    fi

    if grep -q "node_modules" .gitignore; then
        echo "   ✅ node_modules is in .gitignore"
    else
        echo "   ⚠️  WARNING: node_modules should be in .gitignore"
    fi
else
    echo "   ❌ FAIL: .gitignore not found!"
fi

# Check for .env in current tree
echo ""
echo "5. Checking current repository..."
if git ls-files | grep -E "\.env$|\.env\."; then
    echo "   ❌ FAIL: .env files are tracked by git!"
else
    echo "   ✅ No .env files tracked by git"
fi

# Summary
echo ""
echo "════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Review the warnings above. Critical issues (❌) must be fixed."
echo "Warnings (⚠️) should be reviewed with the team."
echo ""
echo "For evaluation purposes:"
echo "- .env files should ONLY exist locally (not in git)"
echo "- All secrets should be in .env (not hardcoded)"
echo "- .gitignore should include .env"
echo ""
