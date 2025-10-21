#!/bin/bash

# Thryvin GitHub Push Validation Script
# Run this before pushing to GitHub to ensure clean commits

set -e

echo "╔════════════════════════════════════════════════╗"
echo "║   Thryvin - Pre-Push Validation                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Check for .env files
echo "🔒 Checking for .env files..."
if git ls-files | grep -E '\.env$' | grep -v '\.env\.example$'; then
  echo -e "${RED}❌ ERROR: .env file committed to repository!${NC}"
  echo "   Please remove and add to .gitignore"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No .env files in repository${NC}"
fi
echo ""

# 2. Check for secrets in recent changes
echo "🔍 Scanning for hardcoded secrets..."
if git diff HEAD~1 HEAD 2>/dev/null | grep -iE '(api[_-]?key|secret|password|token).*["\x27]?[a-zA-Z0-9_-]{20,}["\x27]?' > /dev/null; then
  echo -e "${YELLOW}⚠️  WARNING: Possible hardcoded secrets detected${NC}"
  echo "   Review recent changes for sensitive data"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ No obvious secrets found${NC}"
fi
echo ""

# 3. Check React version pinning
echo "📌 Verifying React version..."
if [ -f "apps/native/package.json" ]; then
  REACT_VERSION=$(grep '"react":' apps/native/package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
  if [[ $REACT_VERSION == 19.1.* ]]; then
    echo -e "${GREEN}✅ React pinned to 19.1.x${NC}"
  else
    echo -e "${YELLOW}⚠️  WARNING: React version is $REACT_VERSION (expected 19.1.x)${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⚠️  WARNING: package.json not found${NC}"
fi
echo ""

# 4. Check for stray files
echo "📂 Checking for temporary files..."
TEMP_FILES=$(git ls-files | grep -E '\.(log|tmp|temp|swp|swo|bak)$' || true)
if [ -n "$TEMP_FILES" ]; then
  echo -e "${RED}❌ ERROR: Temporary files found:${NC}"
  echo "$TEMP_FILES"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ No temporary files found${NC}"
fi
echo ""

# 5. Check for absolute paths
echo "🔍 Checking for absolute paths..."
if git diff HEAD~1 HEAD 2>/dev/null | grep -E '(C:\\|/Users/[^/]+/|/home/[^/]+/)' > /dev/null; then
  echo -e "${YELLOW}⚠️  WARNING: Absolute paths detected in recent changes${NC}"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ No absolute paths detected${NC}"
fi
echo ""

# 6. Build check (optional, can be slow)
echo "🔨 Running quick TypeScript check..."
if [ -f "apps/native/package.json" ]; then
  cd apps/native
  if command -v yarn &> /dev/null; then
    echo "   Checking TypeScript..."
    if yarn tsc --noEmit > /dev/null 2>&1; then
      echo -e "${GREEN}✅ TypeScript check passed${NC}"
    else
      echo -e "${YELLOW}⚠️  WARNING: TypeScript errors detected${NC}"
      echo "   Run 'yarn tsc' in apps/native to see details"
      WARNINGS=$((WARNINGS + 1))
    fi
  fi
  cd ../..
else
  echo -e "${YELLOW}⚠️  Skipping TypeScript check${NC}"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════╗"
if [ $ERRORS -eq 0 ]; then
  echo -e "║ ${GREEN}✅ VALIDATION PASSED${NC}                           ║"
  echo "╠════════════════════════════════════════════════╣"
  echo -e "║  Errors: ${GREEN}$ERRORS${NC}    Warnings: ${YELLOW}$WARNINGS${NC}                      ║"
  echo "╚════════════════════════════════════════════════╝"
  echo ""
  echo -e "${GREEN}🎉 Your code is ready to be pushed to GitHub!${NC}"
  exit 0
else
  echo -e "║ ${RED}❌ VALIDATION FAILED${NC}                           ║"
  echo "╠════════════════════════════════════════════════╣"
  echo -e "║  Errors: ${RED}$ERRORS${NC}    Warnings: ${YELLOW}$WARNINGS${NC}                      ║"
  echo "╚════════════════════════════════════════════════╝"
  echo ""
  echo -e "${RED}⚠️  Please fix the errors above before pushing${NC}"
  exit 1
fi
