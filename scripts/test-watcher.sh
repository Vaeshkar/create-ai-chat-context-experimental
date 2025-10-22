#!/bin/bash

# Test script for Augment Memory Watcher
# Runs a series of tests to verify the system works

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         Augment Memory Watcher - Test Suite                   ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(pwd)"
PASS=0
FAIL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test helper functions
test_pass() {
  echo -e "${GREEN}✓${NC} $1"
  PASS=$((PASS + 1))
}

test_fail() {
  echo -e "${RED}✗${NC} $1"
  FAIL=$((FAIL + 1))
}

test_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# ============================================================================
# Test 1: Check if Node.js is available
# ============================================================================

echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  test_pass "Node.js found: $NODE_VERSION"
else
  test_fail "Node.js not found"
  echo "   Please install Node.js: https://nodejs.org/"
  exit 1
fi
echo ""

# ============================================================================
# Test 2: Check if required files exist
# ============================================================================

echo "2️⃣  Checking required files..."

if [ -f "watch-augment.js" ]; then
  test_pass "watch-augment.js exists"
else
  test_fail "watch-augment.js not found"
fi

if [ -f "install-watcher.sh" ]; then
  test_pass "install-watcher.sh exists"
else
  test_fail "install-watcher.sh not found"
fi

if [ -f "src/session-parsers/augment-parser.js" ]; then
  test_pass "augment-parser.js exists"
else
  test_fail "augment-parser.js not found"
fi

if [ -f "src/checkpoint-orchestrator.js" ]; then
  test_pass "checkpoint-orchestrator.js exists"
else
  test_fail "checkpoint-orchestrator.js not found"
fi

echo ""

# ============================================================================
# Test 3: Check if Augment workspaces are found
# ============================================================================

echo "3️⃣  Checking Augment detection..."

AUGMENT_CHECK=$(node -e "
const AugmentParser = require('./src/session-parsers/augment-parser');
const parser = new AugmentParser();
const status = parser.getStatus();
console.log(JSON.stringify(status));
" 2>&1)

if echo "$AUGMENT_CHECK" | grep -q '"available":true'; then
  WORKSPACE_COUNT=$(echo "$AUGMENT_CHECK" | grep -o '"totalWorkspaces":[0-9]*' | grep -o '[0-9]*')
  test_pass "Augment workspaces found: $WORKSPACE_COUNT"
else
  test_warn "No Augment workspaces found"
  echo "   This is OK if you haven't used Augment yet"
fi

echo ""

# ============================================================================
# Test 4: Test watcher script syntax
# ============================================================================

echo "4️⃣  Testing watcher script..."

if node watch-augment.js --help &> /dev/null; then
  test_pass "Watcher script runs without errors"
else
  test_fail "Watcher script has errors"
fi

echo ""

# ============================================================================
# Test 5: Test manual run (--once)
# ============================================================================

echo "5️⃣  Testing manual run..."

MANUAL_RUN=$(node watch-augment.js --once 2>&1)

if echo "$MANUAL_RUN" | grep -q "Checking for new conversations"; then
  test_pass "Manual run executes"
else
  test_fail "Manual run failed"
  echo "$MANUAL_RUN"
fi

if echo "$MANUAL_RUN" | grep -q "Error"; then
  test_warn "Errors detected in manual run"
  echo "$MANUAL_RUN" | grep "Error"
fi

echo ""

# ============================================================================
# Test 6: Check if .aicf directory exists
# ============================================================================

echo "6️⃣  Checking .aicf directory..."

if [ -d ".aicf" ]; then
  test_pass ".aicf directory exists"
  
  # Check for state file
  if [ -f ".aicf/.watcher-state.json" ]; then
    test_pass "Watcher state file exists"
    STATE_CONTENT=$(cat .aicf/.watcher-state.json)
    echo "   State: $STATE_CONTENT"
  else
    test_warn "Watcher state file not created yet"
  fi
else
  test_warn ".aicf directory not found"
  echo "   Will be created on first run"
fi

echo ""

# ============================================================================
# Test 7: Check if git hook is installed
# ============================================================================

echo "7️⃣  Checking git hook..."

if [ -f ".git/hooks/post-commit" ]; then
  test_pass "Git post-commit hook exists"
  
  if [ -x ".git/hooks/post-commit" ]; then
    test_pass "Git hook is executable"
  else
    test_fail "Git hook is not executable"
    echo "   Run: chmod +x .git/hooks/post-commit"
  fi
else
  test_warn "Git hook not installed"
  echo "   Run: bash install-watcher.sh"
fi

echo ""

# ============================================================================
# Test 8: Check if watcher service is running
# ============================================================================

echo "8️⃣  Checking background service..."

if launchctl list | grep -q "augment.memory-watcher"; then
  test_pass "Background watcher service is running"
else
  test_warn "Background watcher service not running"
  echo "   Run: bash install-watcher.sh"
fi

echo ""

# ============================================================================
# Test 9: Check log files
# ============================================================================

echo "9️⃣  Checking log files..."

if [ -f ".aicf/.watcher.log" ]; then
  test_pass "Watcher log file exists"
  LOG_SIZE=$(wc -l < .aicf/.watcher.log)
  echo "   Log lines: $LOG_SIZE"
  
  if [ -s ".aicf/.watcher.log" ]; then
    echo "   Last 3 lines:"
    tail -3 .aicf/.watcher.log | sed 's/^/   /'
  fi
else
  test_warn "Watcher log file not created yet"
fi

if [ -f ".aicf/.watcher.error.log" ]; then
  if [ -s ".aicf/.watcher.error.log" ]; then
    test_warn "Error log has content"
    echo "   Last error:"
    tail -1 .aicf/.watcher.error.log | sed 's/^/   /'
  else
    test_pass "Error log is empty (good!)"
  fi
fi

echo ""

# ============================================================================
# Summary
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Test Summary                              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✓ All critical tests passed!${NC}"
  echo ""
  echo "🎉 The watcher system is ready to use!"
  echo ""
  echo "Next steps:"
  echo "  1. If not installed: bash install-watcher.sh"
  echo "  2. Have a conversation with Augment"
  echo "  3. Wait 5 minutes or commit code"
  echo "  4. Check: tail -f .aicf/.watcher.log"
  echo ""
else
  echo -e "${RED}✗ Some tests failed${NC}"
  echo ""
  echo "Please fix the issues above before proceeding."
  echo ""
fi

