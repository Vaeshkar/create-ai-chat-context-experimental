# Phase 5.5d: Multi-Claude User Guide

**Date:** October 22, 2025  
**Status:** Documentation for Phase 5.5 Multi-Claude Support  
**Audience:** Users of create-ai-chat-context-experimental

---

## 🎯 Overview

This guide explains how to use the multi-Claude support system to automatically capture conversations from all three Claude instances:

1. **Claude Web** (claude.ai/code)
2. **Claude Desktop** (local app)
3. **Claude CLI** (VSCode terminal)

---

## 🚀 Quick Start

### Automatic Capture (Desktop + CLI)

The system automatically captures conversations from:
- ✅ Claude Desktop (local SQLite database)
- ✅ Claude CLI (JSONL session files)

**No setup required!** Just use Claude Desktop and CLI normally.

### Manual Capture (Web)

For Claude Web, use the "Open in CLI" button:

1. Open conversation in Claude Web
2. Click **"Open in CLI"** button
3. Copy the command (includes session ID)
4. Paste in your terminal
5. Conversation is automatically captured

---

## 📋 How It Works

### Three-Tier Architecture

```
Tier 1: Capture
├── Claude Web → "Open in CLI" button → CLI command
├── Claude Desktop → Automatic polling (5s)
└── Claude CLI → Automatic polling (5s)

Tier 2: Parse
├── Web → JSON export format
├── Desktop → SQLite database
└── CLI → JSONL session files

Tier 3: Consolidate
├── Merge all messages
├── Deduplicate by content hash
├── Track source (which Claude instance)
└── Generate unified memory files
```

---

## 🔄 Teleportation Mechanism

### What is Teleportation?

"Teleportation" is Claude's built-in feature to transfer conversations from Web to CLI/Desktop.

### How to Use It

**Step 1: Open Conversation in Claude Web**
```
https://claude.ai/code
```

**Step 2: Find "Open in CLI" Button**
- Located in the conversation header
- Shows a terminal icon

**Step 3: Click the Button**
- Generates command with session ID
- Example: `claude --teleport abc123def456`

**Step 4: Copy and Paste in Terminal**
```bash
claude --teleport abc123def456
```

**Step 5: Conversation Appears in CLI**
- Full conversation history transferred
- All messages preserved
- Ready for continued work

**Step 6: Automatic Capture**
- Watcher detects new session
- Extracts all messages
- Adds to unified memory

---

## 📊 What Gets Captured

### From Claude Web
- ✅ User messages
- ✅ Assistant responses
- ✅ Code blocks
- ✅ Thinking blocks
- ✅ Timestamps
- ✅ Conversation title

### From Claude Desktop
- ✅ Native conversations
- ✅ Teleported conversations
- ✅ Attachments
- ✅ Images
- ✅ File uploads
- ✅ Full metadata

### From Claude CLI
- ✅ Session conversations
- ✅ Teleported conversations
- ✅ Terminal context
- ✅ Git branch info
- ✅ Working directory
- ✅ Token usage

---

## 🔍 Deduplication

### How It Works

When you teleport a conversation from Web → CLI, the system:

1. **Detects Duplicate**
   - Calculates SHA256 hash of message content
   - Compares with existing messages

2. **Keeps Earliest**
   - If same content appears in multiple sources
   - Keeps the one with earliest timestamp
   - Discards duplicates

3. **Tracks Source**
   - Records which Claude instance each message came from
   - Preserves source metadata
   - Shows deduplication statistics

### Example

```
Web: "Hello world" at 10:00:00
Desktop: "Hello world" at 10:00:05 (teleported)
CLI: "Hello world" at 10:00:10 (teleported)

Result:
- Keep Web version (earliest)
- Discard Desktop and CLI versions
- Track that message came from Web
- Show 2 duplicates removed
```

---

## 📁 Memory Files

### Location

```
.aicf/
├── index.aicf              # Project overview
├── work-state.aicf         # Current work state
├── conversations.aicf      # All conversations
├── decisions.aicf          # Key decisions
├── technical-context.aicf  # Architecture
└── design-system.aicf      # UI/UX rules

.ai/
├── project-overview.md     # Human-readable overview
├── conversation-log.md     # Detailed conversation history
├── technical-decisions.md  # Technical decisions
├── next-steps.md          # Planned work
└── known-issues.md        # Current bugs
```

### Format

**AICF Files** (AI-optimized)
- Pipe-delimited structured data
- 5x more efficient than markdown
- Optimized for AI-to-AI communication

**Markdown Files** (Human-readable)
- Detailed prose
- Easy to read and edit
- Full context preservation

---

## 🛠️ CLI Commands

### View Consolidation Stats

```bash
npm run consolidate:stats
```

Shows:
- Total messages captured
- Messages per source
- Deduplication rate
- Conflicts resolved

### View Messages by Source

```bash
npm run consolidate:by-source
```

Shows:
- Messages from Claude Web
- Messages from Claude Desktop
- Messages from Claude CLI

### View Messages by Conversation

```bash
npm run consolidate:by-conversation
```

Shows:
- Grouped by conversation ID
- Message count per conversation
- Source breakdown per conversation

---

## ⚙️ Configuration

### Enable/Disable Sources

Edit `.aicf/config.aicf`:

```
source|enabled|polling_interval
claude-web|true|manual
claude-desktop|true|5000
claude-cli|true|5000
```

### Polling Interval

- **Desktop:** 5 seconds (default)
- **CLI:** 5 seconds (default)
- **Web:** Manual (via "Open in CLI" button)

---

## 🐛 Troubleshooting

### Claude Desktop Not Detected

**Problem:** System can't find Claude Desktop database

**Solution:**
1. Verify Claude Desktop is installed
2. Check path: `~/Library/Application Support/Claude/`
3. Ensure database file exists
4. Check file permissions

### Claude CLI Not Detected

**Problem:** System can't find Claude CLI sessions

**Solution:**
1. Verify Claude CLI is installed
2. Check path: `~/.claude/projects/`
3. Create a session in Claude CLI
4. Wait 5 seconds for watcher to detect

### Duplicates Not Removed

**Problem:** Same message appears multiple times

**Solution:**
1. Check deduplication is enabled
2. Verify content is identical (including whitespace)
3. Check timestamps are correct
4. Run consolidation manually

### Memory Files Not Updating

**Problem:** Changes not reflected in memory files

**Solution:**
1. Check watcher is running
2. Verify checkpoint files are being created
3. Check file permissions in `.aicf/` directory
4. Restart watcher: `npm run watcher:stop && npm run watcher:start`

---

## 📚 Examples

### Example 1: Web → CLI Teleportation

```
1. Open conversation in Claude Web
2. Click "Open in CLI"
3. Copy: claude --teleport abc123
4. Paste in terminal
5. Conversation appears in CLI
6. Watcher detects new session
7. Messages added to unified memory
8. Duplicates automatically removed
```

### Example 2: Multi-Source Workflow

```
Morning:
- Start conversation in Claude Web
- Research and planning

Afternoon:
- Teleport to Claude Desktop
- File operations and local work

Evening:
- Teleport to Claude CLI
- Terminal commands and debugging

Result:
- All messages in unified memory
- Full context preserved
- No duplicates
- Source tracking shows which instance each message came from
```

### Example 3: Checking Consolidation

```bash
# View stats
npm run consolidate:stats

# Output:
Total Messages: 150
Deduplicated: 25 (14.29%)
Source Breakdown:
  - Web: 50
  - Desktop: 60
  - CLI: 40
Conflicts Resolved: 25
```

---

## 🎯 Best Practices

### 1. Use Teleportation for Context Transfer
- When switching Claude instances
- To preserve full conversation history
- To maintain working context

### 2. Let Automatic Capture Work
- Don't manually export conversations
- System automatically detects changes
- Polling happens every 5 seconds

### 3. Check Memory Files Regularly
- Review `.aicf/` files for insights
- Check `.ai/` files for detailed context
- Use for project planning

### 4. Monitor Deduplication
- Check stats to see duplicate rate
- High rate might indicate issues
- Low rate is normal (< 20%)

---

## 📞 Support

### Common Issues

**Q: Why are some messages missing?**
A: Check that all Claude instances are running and watcher is active.

**Q: How often does it check for new messages?**
A: Every 5 seconds for Desktop and CLI. Web requires manual teleportation.

**Q: Can I disable deduplication?**
A: Not recommended, but you can edit config to disable specific sources.

**Q: What if I have sensitive information?**
A: All data is stored locally. No cloud sync unless you enable it.

---

## 🚀 Next Steps

1. **Install and Run**
   - Clone repository
   - Run `npm install`
   - Start watcher: `npm run watcher:start`

2. **Use Claude Normally**
   - Open Claude Web, Desktop, or CLI
   - Have conversations as usual
   - System captures automatically

3. **Check Memory Files**
   - Review `.aicf/` and `.ai/` files
   - See consolidated conversations
   - Use for project context

4. **Optimize Workflow**
   - Use teleportation for context transfer
   - Monitor deduplication stats
   - Adjust polling intervals if needed

---

**Happy consolidating! 🎉**

