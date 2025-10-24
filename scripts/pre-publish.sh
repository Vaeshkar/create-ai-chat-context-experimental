#!/bin/bash

# Pre-publish checks for create-ai-chat-context-experimental
# Run this before every npm publish to ensure package integrity
# Usage: bash scripts/pre-publish.sh

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║           🔍 PRE-PUBLISH VERIFICATION CHECKS                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for checks
CHECKS_PASSED=0
CHECKS_FAILED=0

# Helper function to check file existence
check_file() {
  local file=$1
  local description=$2

  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $description"
    ((CHECKS_PASSED++))
  else
    echo -e "${RED}❌${NC} $description - File not found: $file"
    ((CHECKS_FAILED++))
  fi
}

# Helper function to run command
run_check() {
  local description=$1
  local command=$2

  echo -n "⏳ $description... "
  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
    ((CHECKS_PASSED++))
    return 0
  else
    echo -e "${RED}❌${NC}"
    ((CHECKS_FAILED++))
    return 1
  fi
}

# ============================================================================
# 1. CRITICAL FILES
# ============================================================================
echo "📋 Checking critical files..."
check_file "src/index.ts" "Main entry point exists"
check_file "package.json" "Package configuration exists"
check_file "README.md" "README documentation exists"
check_file "LICENSE" "License file exists"
echo ""

# ============================================================================
# 2. BUILD & QUALITY
# ============================================================================
echo "🏗️  Building and testing..."

run_check "Clean build" "pnpm run clean && pnpm run build"
run_check "All tests passing" "pnpm test"
run_check "No TypeScript errors" "pnpm run typecheck"
run_check "No linting errors" "pnpm run lint"
echo ""

# ============================================================================
# 3. BUILD ARTIFACTS
# ============================================================================
echo "📦 Verifying build artifacts..."
check_file "dist/esm/index.js" "ESM entry point generated"
check_file "dist/esm/index.d.ts" "TypeScript definitions generated"
check_file "dist/cjs/index.cjs" "CommonJS entry point generated"
echo ""

# ============================================================================
# 4. PACKAGE METADATA
# ============================================================================
echo "📝 Checking package metadata..."

# Extract version from package.json
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/')
echo "   Version: $VERSION"

# Check if version is valid semver (including pre-release versions like alpha, beta, rc)
if [[ $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
  echo -e "${GREEN}✅${NC} Version format is valid"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}❌${NC} Invalid version format: $VERSION"
  ((CHECKS_FAILED++))
fi

# Check package.json exports
if grep -q '"main": "./dist/cjs/index.cjs"' package.json && \
   grep -q '"module": "./dist/esm/index.js"' package.json && \
   grep -q '"types": "./dist/esm/index.d.ts"' package.json; then
  echo -e "${GREEN}✅${NC} Package exports are correctly configured"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}❌${NC} Package exports are not correctly configured"
  ((CHECKS_FAILED++))
fi

echo ""

# ============================================================================
# 5. GIT STATUS
# ============================================================================
echo "🔗 Checking git status..."

if [ -z "$(git status --porcelain)" ]; then
  echo -e "${GREEN}✅${NC} Working directory is clean"
  ((CHECKS_PASSED++))
else
  echo -e "${YELLOW}⚠️ ${NC} Uncommitted changes detected:"
  git status --short | sed 's/^/   /'
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""

# ============================================================================
# 6. BUNDLE SIZE CHECK
# ============================================================================
echo "📊 Checking bundle size..."
DIST_SIZE=$(du -sh dist/ | cut -f1)
echo "   dist/ size: $DIST_SIZE"

if [ -d "dist" ]; then
  echo -e "${GREEN}✅${NC} Build artifacts exist"
  ((CHECKS_PASSED++))
else
  echo -e "${RED}❌${NC} dist/ directory not found"
  ((CHECKS_FAILED++))
fi

echo ""

# ============================================================================
# 7. PACK TEST
# ============================================================================
echo "📦 Testing package creation..."

# Check if pnpm pack would work by using --json flag
if run_check "Package can be packed" "pnpm pack --json > /dev/null 2>&1"; then
  echo "   ✓ Package structure is valid"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    📊 SUMMARY                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Checks passed:  ${GREEN}$CHECKS_PASSED${NC}"
echo -e "Checks failed:  ${RED}$CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED - READY TO PUBLISH!${NC}"
  echo ""
  echo "Next steps:"
  echo "  1. Review changes: git log --oneline -5"
  echo "  2. Create git tag: git tag v$VERSION"
  echo "  3. Push to remote: git push origin main && git push origin v$VERSION"
  echo "  4. Publish to npm: pnpm publish"
  echo ""
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED - FIX ISSUES BEFORE PUBLISHING${NC}"
  echo ""
  exit 1
fi
