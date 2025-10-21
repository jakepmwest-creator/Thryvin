# Thryvin GitHub Workflow Guide

This document explains the automated validation workflow for pushing to GitHub.

## 🎯 Overview

The GitHub workflow ensures:
- ✅ No sensitive `.env` files are committed
- ✅ No hardcoded API keys or secrets
- ✅ React version stays pinned to 19.1.x
- ✅ No absolute paths or localhost URLs
- ✅ No temporary/log files
- ✅ TypeScript builds successfully
- ✅ Clean, professional commits

## 🚀 How to Use

### Option 1: Manual Validation (Recommended)

Before pushing to GitHub, run the validation script:

```bash
./scripts/validate-before-push.sh
```

This will check everything and give you a clear ✅ or ❌ status.

### Option 2: Automatic Pre-Commit Hook

The pre-commit hook will run automatically when you commit:

```bash
git add .
git commit -m "Your commit message"
# Hook runs automatically ✅
```

If validation fails, your commit will be blocked until you fix the issues.

### Option 3: GitHub Actions (Automatic)

When you push to GitHub, GitHub Actions will automatically run validation:

1. Push your code: `git push origin main`
2. GitHub Actions runs validation
3. You'll see ✅ or ❌ in the GitHub UI

## 📋 What Gets Checked

### 1. **Environment Files**
- ❌ Blocks: `.env` files (except `.env.example`)
- ✅ Allows: `.env.example`, `.env.sample`

### 2. **Secrets Detection**
- Scans for: API keys, tokens, passwords
- Pattern: `api_key="sk-xxxxx..."` or `SECRET_TOKEN=abc123...`

### 3. **Version Pinning**
- Verifies: React stays at `19.1.x`
- Location: `apps/native/package.json`

### 4. **Path Validation**
- ❌ Blocks: `C:\Users\...`, `/home/user/...`, `localhost:3000`
- ✅ Use: Environment variables, relative paths

### 5. **Temporary Files**
- ❌ Blocks: `.log`, `.tmp`, `.swp`, `.bak`
- Clean before committing

### 6. **Build Check**
- Runs: `yarn tsc --noEmit`
- Ensures: TypeScript compiles without errors

## 🛠️ Fixing Common Issues

### Issue: ".env file detected"
```bash
# Remove from git
git rm --cached .env

# Add to .gitignore (already done)
echo ".env" >> .gitignore

# Commit the change
git commit -m "Remove .env file"
```

### Issue: "Hardcoded secret detected"
```bash
# Replace with environment variable
# ❌ Bad: const API_KEY = "sk-1234567890abcdef"
# ✅ Good: const API_KEY = process.env.EXPO_PUBLIC_API_KEY
```

### Issue: "React version mismatch"
```bash
cd apps/native
yarn add react@19.1.0 react-dom@19.1.0 --exact
```

### Issue: "Absolute path detected"
```bash
# ❌ Bad: /Users/jake/Thryvin/apps/native
# ✅ Good: ./apps/native or use process.env.EXPO_PUBLIC_API_URL
```

## 📝 Commit Message Guidelines

Good commit messages:
- ✅ `feat: Add AI workout generation`
- ✅ `fix: Resolve workouts store import issue`
- ✅ `design: Update home screen with gradient accents`
- ✅ `refactor: Improve authentication flow`

## 🎉 Success Confirmation

When validation passes, you'll see:

```
╔════════════════════════════════════════════════╗
║ ✅ VALIDATION PASSED                           ║
╠════════════════════════════════════════════════╣
║  Errors: 0    Warnings: 0                      ║
╚════════════════════════════════════════════════╝

🎉 Your code is ready to be pushed to GitHub!
```

## 🔧 Setup (First Time Only)

The workflow is already configured, but if you need to set it up:

```bash
# Install husky (pre-commit hooks)
cd /app
yarn add -D husky

# Enable Git hooks
npx husky install

# Make scripts executable
chmod +x .husky/pre-commit
chmod +x scripts/validate-before-push.sh
```

## 📞 Support

If validation fails and you can't resolve it:
1. Read the error message carefully
2. Check this guide for solutions
3. Run `./scripts/validate-before-push.sh` for detailed output
4. Review the specific files mentioned in the error

---

**Remember**: These checks keep your repository clean, secure, and professional! 🚀
