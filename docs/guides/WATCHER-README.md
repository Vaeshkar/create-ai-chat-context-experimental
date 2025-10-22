# Augment Memory Watcher

**Automatic AI memory consolidation system for Augment VSCode extension.**

---

## 🎯 What It Does

Automatically captures your Augment AI conversations and consolidates them into persistent memory files (`.aicf/` and `.ai/`) using a hybrid approach:

1. **Background Watcher** - Checks every 5 minutes for new conversations
2. **Git Commit Hook** - Runs automatically on every commit

**Result:** Your AI always has access to previous conversations, decisions, and context.

---

## 🚀 Quick Start

### Installation

```bash
cd /Users/leeuwen/Programming/create-ai-chat-context-experimental

# Run the installer
bash install-watcher.sh
```

That's it! The system is now running automatically.

---

## 📋 How It Works

### Background Watcher (Every 5 Minutes)

```
05:00 → Check Augment LevelDB files
     → No new conversations
     
05:05 → Check Augment LevelDB files
     → Found 1 new conversation
     → Extract messages
     → Process through checkpoint orchestrator
     → 6 logic agents analyze conversation
     → Update .aicf/ files (85% compressed)
     → Update .ai/ files (human-readable)
     
05:10 → Check Augment LevelDB files
     → No new conversations
```

### Git Commit Hook (Immediate)

```bash
git add .
git commit -m "feat: build hero section"

# Hook runs automatically:
🧠 Updating AI memory from recent conversations...
📝 Found 1 new conversation
✅ Processed through orchestrator
📝 Memory files updated
```

---

## 🛠️ Management Commands

### View Logs
```bash
# Real-time log watching
tail -f .aicf/.watcher.log

# View errors
tail -f .aicf/.watcher.error.log

# View state
cat .aicf/.watcher-state.json
```

### Control Watcher
```bash
# Stop watcher
launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist

# Start watcher
launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist

# Check status
launchctl list | grep augment

# Restart watcher
launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist
launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist
```

### Manual Run
```bash
# Run once (for testing)
node watch-augment.js --once

# Run with verbose logging
node watch-augment.js --once --verbose

# Run continuously (foreground)
node watch-augment.js

# Custom interval (check every 1 minute)
node watch-augment.js --interval=1
```

---

## 📊 What Gets Captured

### From Augment Conversations:
- ✅ User messages
- ✅ AI responses
- ✅ Timestamps
- ✅ Conversation IDs
- ✅ Message order

### Processed Into:

**`.aicf/` files (AI-optimized, 85% token reduction):**
- `conversations.aicf` - Compressed conversation history
- `decisions.aicf` - Technical decisions made
- `work-state.aicf` - Current project state
- `figma-learned-patterns.aicf` - Learned patterns (if applicable)

**`.ai/` files (Human-readable):**
- `conversation-log.md` - Detailed conversation history
- `technical-decisions.md` - Decision documentation
- `known-issues.md` - Issues discovered and resolved
- `next-steps.md` - Action items

---

## 🔧 Configuration

### Change Check Interval

Edit the launch agent plist:
```bash
nano ~/Library/LaunchAgents/com.augment.memory-watcher.plist
```

Or run with custom interval:
```bash
node watch-augment.js --interval=1  # Check every 1 minute
node watch-augment.js --interval=10 # Check every 10 minutes
```

### Disable Git Hook

```bash
# Temporarily disable
chmod -x .git/hooks/post-commit

# Re-enable
chmod +x .git/hooks/post-commit

# Remove completely
rm .git/hooks/post-commit
```

---

## 🧪 Testing

### Test the Watcher
```bash
# Run once with verbose output
node watch-augment.js --once --verbose
```

### Test the Git Hook
```bash
# Make an empty commit
git commit --allow-empty -m "test: memory watcher"

# Check if memory files were updated
git status .aicf/
```

### Verify Augment Detection
```bash
# Check if Augment workspaces are found
node -e "const p = require('./src/session-parsers/augment-parser'); const parser = new p(); console.log(parser.getStatus());"
```

---

## 📁 File Locations

### Augment Storage (Read-Only)
```
~/Library/Application Support/Code/User/workspaceStorage/
  └── [workspace-id]/
      └── Augment.vscode-augment/
          └── augment-kv-store/  ← LevelDB files
```

### Watcher Files (Your Project)
```
your-project/
├── .aicf/
│   ├── .watcher.log           ← Output log
│   ├── .watcher.error.log     ← Error log
│   ├── .watcher-state.json    ← Watcher state
│   ├── conversations.aicf     ← Compressed conversations
│   └── ...                    ← Other memory files
├── .ai/
│   ├── conversation-log.md    ← Human-readable log
│   └── ...                    ← Other docs
└── .git/hooks/
    └── post-commit            ← Git hook
```

### System Service
```
~/Library/LaunchAgents/
  └── com.augment.memory-watcher.plist  ← macOS launch agent
```

---

## 🐛 Troubleshooting

### Watcher Not Running
```bash
# Check if loaded
launchctl list | grep augment

# Check logs for errors
tail -f .aicf/.watcher.error.log

# Restart
launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist
launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist
```

### No Conversations Found
```bash
# Verify Augment is installed and has conversations
ls -la ~/Library/Application\ Support/Code/User/workspaceStorage/*/Augment.vscode-augment/

# Run with verbose to see what's happening
node watch-augment.js --once --verbose
```

### Git Hook Not Running
```bash
# Check if hook exists and is executable
ls -la .git/hooks/post-commit

# Make executable
chmod +x .git/hooks/post-commit

# Test manually
.git/hooks/post-commit
```

---

## 🔄 Uninstall

```bash
# Stop and remove watcher service
launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist
rm ~/Library/LaunchAgents/com.augment.memory-watcher.plist

# Remove git hook
rm .git/hooks/post-commit

# Remove watcher files (optional)
rm watch-augment.js
rm install-watcher.sh

# Keep memory files (.aicf/ and .ai/) - they're valuable!
```

---

## 📝 Notes

### Legacy JavaScript
This is a **proof-of-concept** implementation in legacy JavaScript. It works, but will be rewritten in modern TypeScript following Q4 2025 code standards (see `.ai/code-style.md` in aip-workspace).

### Privacy
- All processing happens **locally**
- No data sent to external services
- Augment conversations stay on your machine
- Memory files are in your project directory

### Performance
- Minimal CPU usage (checks every 5 minutes)
- Low memory footprint (~50MB)
- No impact on Augment performance
- Processes conversations in background

---

## 🎯 Next Steps

After proving this works:
1. ✅ Test with real Augment conversations
2. ✅ Validate memory consolidation works
3. ✅ Verify AI can read and use the memory
4. 🎯 Rewrite in TypeScript with modern patterns
5. 🎯 Move to `aip-workspace` as clean implementation
6. 🎯 Add to stable `create-ai-chat-context` package

---

**Questions? Issues? Check the logs first: `tail -f .aicf/.watcher.log`**

