#!/bin/bash

# Augment Memory Watcher - Installation Script
# Sets up hybrid automatic memory consolidation system:
# 1. Background watcher (checks every 5 minutes)
# 2. Git post-commit hook (runs on every commit)

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      Augment Memory Watcher - Installation Script             ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

PROJECT_ROOT="$(pwd)"
HOOK_FILE=".git/hooks/post-commit"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/com.augment.memory-watcher.plist"

# Check if we're in a git repo
if [ ! -d ".git" ]; then
  echo "❌ Error: Not a git repository"
  echo "   Please run this script from the root of your project"
  exit 1
fi

# Check if .aicf directory exists
if [ ! -d ".aicf" ]; then
  echo "⚠️  Warning: .aicf directory not found"
  echo "   Creating .aicf directory..."
  mkdir -p .aicf
fi

echo "📂 Project: $PROJECT_ROOT"
echo ""

# ============================================================================
# 1. Install Git Post-Commit Hook
# ============================================================================

echo "1️⃣  Installing git post-commit hook..."
echo ""

if [ -f "$HOOK_FILE" ]; then
  echo "   ⚠️  post-commit hook already exists"
  echo "   📝 Backing up to post-commit.backup"
  cp "$HOOK_FILE" "$HOOK_FILE.backup"
fi

cat > "$HOOK_FILE" << 'HOOK_EOF'
#!/bin/bash

# Post-commit hook: Extract Augment conversations and update memory
# This runs automatically after every git commit

echo ""
echo "🧠 Updating AI memory from recent conversations..."

# Change to project root
cd "$(git rev-parse --show-toplevel)"

# Run augment checkpoint extraction
if command -v node &> /dev/null; then
  node watch-augment.js --once 2>&1 | grep -E "Found|Processed|Error" || echo "✓ No new conversations"
else
  echo "⚠️  Node.js not found, skipping memory update"
fi

echo ""
HOOK_EOF

chmod +x "$HOOK_FILE"
echo "   ✅ Git hook installed at $HOOK_FILE"
echo ""

# ============================================================================
# 2. Create Background Watcher Service (macOS launchd)
# ============================================================================

echo "2️⃣  Setting up background watcher service..."
echo ""

# Detect node path
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  echo "   ⚠️  Node.js not found in PATH"
  echo "   Please install Node.js or add it to your PATH"
  exit 1
fi

echo "   📍 Node.js: $NODE_PATH"

# Create launch agent directory if it doesn't exist
mkdir -p "$PLIST_DIR"

# Create launch agent plist
cat > "$PLIST_FILE" << PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.augment.memory-watcher</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_PATH</string>
        <string>$PROJECT_ROOT/watch-augment.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$PROJECT_ROOT</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>$PROJECT_ROOT/.aicf/.watcher.log</string>
    
    <key>StandardErrorPath</key>
    <string>$PROJECT_ROOT/.aicf/.watcher.error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
PLIST_EOF

echo "   ✅ Launch agent created at $PLIST_FILE"
echo ""

# ============================================================================
# 3. Start the Watcher
# ============================================================================

echo "3️⃣  Starting background watcher..."
echo ""

# Unload if already loaded (in case of reinstall)
launchctl unload "$PLIST_FILE" 2>/dev/null || true

# Load the launch agent
if launchctl load "$PLIST_FILE"; then
  echo "   ✅ Background watcher started"
else
  echo "   ⚠️  Failed to start watcher"
  echo "   Try manually: launchctl load $PLIST_FILE"
fi

echo ""

# ============================================================================
# 4. Create .gitignore entries
# ============================================================================

echo "4️⃣  Updating .gitignore..."
echo ""

GITIGNORE_FILE=".gitignore"

# Add watcher logs to .gitignore if not already there
if [ -f "$GITIGNORE_FILE" ]; then
  if ! grep -q ".aicf/.watcher" "$GITIGNORE_FILE"; then
    echo "" >> "$GITIGNORE_FILE"
    echo "# Augment Memory Watcher logs" >> "$GITIGNORE_FILE"
    echo ".aicf/.watcher.log" >> "$GITIGNORE_FILE"
    echo ".aicf/.watcher.error.log" >> "$GITIGNORE_FILE"
    echo ".aicf/.watcher-state.json" >> "$GITIGNORE_FILE"
    echo "   ✅ Added watcher logs to .gitignore"
  else
    echo "   ✓ .gitignore already configured"
  fi
else
  echo "   ⚠️  No .gitignore found, skipping"
fi

echo ""

# ============================================================================
# Installation Complete
# ============================================================================

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ✨ Installation Complete! ✨                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 What's running:"
echo "   • Git hook: Runs automatically on every commit"
echo "   • Background watcher: Checks every 5 minutes"
echo ""
echo "📝 Log files:"
echo "   • Output: .aicf/.watcher.log"
echo "   • Errors: .aicf/.watcher.error.log"
echo "   • State:  .aicf/.watcher-state.json"
echo ""
echo "🛠️  Management commands:"
echo "   • View logs:     tail -f .aicf/.watcher.log"
echo "   • Stop watcher:  launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist"
echo "   • Start watcher: launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist"
echo "   • Check status:  launchctl list | grep augment"
echo ""
echo "🧪 Test it:"
echo "   • Manual run:    node watch-augment.js --verbose"
echo "   • Test commit:   git commit --allow-empty -m 'test: memory watcher'"
echo ""
echo "💡 The watcher will now run automatically in the background!"
echo "   It will check for new Augment conversations every 5 minutes."
echo ""

