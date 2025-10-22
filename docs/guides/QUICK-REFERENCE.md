# 🚀 Augment Memory Watcher - Quick Reference

**One-page cheat sheet for daily use**

---

## ✅ Status Check

```bash
# Is it running?
launchctl list | grep augment

# Expected output:
# 33955	0	com.augment.memory-watcher
```

---

## 📝 View Logs

```bash
# Watch logs in real-time
tail -f .aicf/.watcher.log

# Check for errors
tail -f .aicf/.watcher.error.log

# View current state
cat .aicf/.watcher-state.json
```

---

## 🛠️ Control Service

```bash
# Stop
launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist

# Start
launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist

# Restart (stop + start)
launchctl unload ~/Library/LaunchAgents/com.augment.memory-watcher.plist && \
launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist
```

---

## 🧪 Manual Test

```bash
# Run once (quick test)
node watch-augment.js --once

# Run with verbose output
node watch-augment.js --once --verbose

# Run continuously (foreground)
node watch-augment.js

# Custom interval (1 minute)
node watch-augment.js --interval=1
```

---

## 📂 Important Files

### Memory Files (Updated Automatically)
```
.aicf/
├── conversations.aicf          # Compressed conversation history
├── technical-context.aicf      # Technical insights
├── design-system.aicf          # Design decisions
└── .watcher-state.json         # Watcher state

.ai/
├── conversation-log.md         # Human-readable log
├── technical-decisions.md      # Decision documentation
├── next-steps.md               # Action items
└── known-issues.md             # Issues and resolutions
```

### System Files
```
.git/hooks/post-commit          # Git hook (runs on commit)
~/Library/LaunchAgents/
  └── com.augment.memory-watcher.plist  # Background service
```

---

## 🔄 How It Works

### Background Watcher
- Checks every **5 minutes**
- Extracts new Augment conversations
- Updates memory files automatically

### Git Hook
- Runs on **every commit**
- Captures latest conversations
- Ensures memory is in sync with code

---

## 🚨 Troubleshooting

### Watcher Not Running
```bash
# Check if loaded
launchctl list | grep augment

# If not found, load it
launchctl load ~/Library/LaunchAgents/com.augment.memory-watcher.plist

# Check logs for errors
tail -20 .aicf/.watcher.error.log
```

### No Conversations Found
```bash
# Verify Augment is installed
ls -la ~/Library/Application\ Support/Code/User/workspaceStorage/*/Augment.vscode-augment/

# Run with verbose to debug
node watch-augment.js --once --verbose
```

### Git Hook Not Running
```bash
# Check if hook exists
ls -la .git/hooks/post-commit

# Make executable
chmod +x .git/hooks/post-commit

# Test manually
.git/hooks/post-commit
```

---

## 💡 Tips

### Daily Use
- **Just use Augment normally** - Everything is automatic
- **Check logs occasionally** - `tail -f .aicf/.watcher.log`
- **Commit regularly** - Git hook captures conversations

### Debugging
- **Verbose mode** - `node watch-augment.js --once --verbose`
- **Check state** - `cat .aicf/.watcher-state.json`
- **View errors** - `tail -f .aicf/.watcher.error.log`

### Performance
- **Low overhead** - < 1% CPU, ~50MB RAM
- **Fast processing** - ~3 seconds per conversation
- **Efficient storage** - 85% token reduction (AICF format)

---

## 📞 Help

### Documentation
- **Full docs:** `WATCHER-README.md`
- **Installation:** `INSTALLATION-SUCCESS.md`
- **Phase 1 summary:** `PHASE-1-COMPLETE.md`

### Common Commands
```bash
# Reinstall (if needed)
bash install-watcher.sh

# Run test suite
bash test-watcher.sh

# View help
node watch-augment.js --help
```

---

## 🎯 What Success Looks Like

### Healthy System
- ✅ Service running (`launchctl list | grep augment`)
- ✅ Logs updating (`.aicf/.watcher.log` has recent entries)
- ✅ No errors (`.aicf/.watcher.error.log` is empty)
- ✅ State updating (`.aicf/.watcher-state.json` has recent timestamp)
- ✅ Memory files growing (`.aicf/conversations.aicf` size increasing)

### Unhealthy System
- ❌ Service not in `launchctl list`
- ❌ Logs not updating
- ❌ Errors in `.aicf/.watcher.error.log`
- ❌ State timestamp old
- ❌ Memory files not changing

---

**Quick Status Check:**
```bash
cd /Users/leeuwen/Programming/create-ai-chat-context-experimental
launchctl list | grep augment && \
tail -3 .aicf/.watcher.log && \
cat .aicf/.watcher-state.json
```

**If everything shows recent activity, you're good! ✅**

