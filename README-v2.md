# AI Chat Context & Memory System v2.0.0

![npm version](https://img.shields.io/npm/v/create-ai-chat-context)

> **🚀 Real-time AI memory system that preserves context across conversations**

Stop re-explaining your project to AI assistants. This intelligent context system **automatically extracts** and preserves your conversation history, technical decisions, and project knowledge in real-time - creating rich, searchable memory that persists between AI sessions.

## 🎆 **NEW in v2.0: Multi-AI Support**

✅ **6 AI Sources Supported** - Warp, Claude, Cursor, Copilot, ChatGPT, Augment  
✅ **Cross-AI extraction** - Automatically finds latest activity from any AI  
✅ **Real user data** - Works with your actual conversations (126 ChatGPT + 3 Claude + 20+ Augment workspaces found)  
✅ **Tested extensively** - 1500+ messages processed from real usage  
✅ **Smart detection** - No need to re-explain projects between different AIs  
✅ **Handles all formats** - From SQLite to encrypted data

---

## 🚨 FOR AI ASSISTANTS: READ THIS FIRST 🚨

**CRITICAL: Before working on this project, read the `.ai/` knowledge base:**

1. **`.ai/conversation-log.md`** - Recent chat history with topic summaries
2. **`.ai/project-overview.md`** - Project context and conventions  
3. **`.ai/technical-decisions.md`** - Key architectural decisions
4. **`.ai/next-steps.md`** - Current priorities and tasks

**Why?** This preserves context across AI sessions so you understand what's been done.

---

## ⚡ Quick Start

```bash
# Initialize AI knowledge base
npx aic init

# Start real-time auto-updates (30 minutes)
npx aic auto-update --start

# Or use quick manual updates
npx aic update --conversation    # Full command
aicupdate                       # Short alias

# View your AI-optimized conversation history
cat .ai/conversation-log.md
```

## 🎯 **The Problem**

Every AI chat loses context. You waste time re-explaining:
- Project architecture and decisions
- What was accomplished in previous sessions
- Technical choices and their rationale
- Current priorities and known issues

## 🛠️ **The Solution**

Our system creates a **live `.ai/` knowledge base** that:

1. **Auto-extracts** conversations from AI terminals (Warp, Cursor, etc.)
2. **Summarizes** them into clean, scannable topics
3. **Updates automatically** every 30 minutes
4. **Preserves context** across all AI sessions

### 📁 Files Created

| File | Purpose |
|------|---------|
| **conversation-log.md** | Auto-updated chat history with topic summaries |
| **technical-decisions.md** | Why you chose X over Y |
| **next-steps.md** | Current priorities and tasks |
| **project-overview.md** | Project context for AI assistants |
| **known-issues.md** | Problems and their solutions |

## 🤖 **Real-Time Auto-Updates**

### Option 1: Automatic (Set & Forget)
```bash
# Start 30-minute auto-updates
npx aic auto-update --start

# Or 15-minute intervals for active development
npx aic auto-update --start --interval 15
```

### Option 2: Manual (When Needed)
```bash
# Quick update
npx aic update --conversation

# Set up shell aliases for super-quick access
source setup-aliases.sh
aicupdate    # Now you can just type this!
```

### What Gets Updated

Your `.ai/conversation-log.md` automatically shows:

```markdown
## Chat 1237cec7 - 2025-10-04 - AI Terminal Session

### Overview
1461-message conversation over 16.4 hours in create-ai-chat-context (major development session)

### What We Accomplished
- **Major work completed:** turbopack deprecation warning, comprehensive fix documentation, 
  platform-specific examples for warp/claude, mode 100644 .aicf.backup/readme.md (6 items)

### Key Decisions  
- **Strategic decisions:** full conversation content preservation, 30-minute auto-updates, 
  topic-based summaries over raw dumps (4 total)

### Problems & Solutions
- **Issues addressed:** text cleaning regex patterns, corrupted data filtering, 
  markdown readability improvements (4 resolved)
```

## 🌍 **Multi-AI Support**

**Real data from your actual AI usage:**
- ✅ **Warp AI** - Full SQLite extraction (1500+ messages tested)
- ✅ **Claude Desktop** - IndexedDB/LevelDB parsing (3 conversations found) 
- ✅ **ChatGPT Desktop** - Encrypted storage metadata (126 conversations detected!)  
- ✅ **Cursor** - Workspace chat extraction (1 workspace + GitHub Copilot data)
- ✅ **GitHub Copilot** - Extension parsing (3 extension files found)
- ✅ **Augment** - Agent edit tracking (20+ workspaces detected)

**Intelligent cross-AI detection:**
```bash
# Automatically finds your most recent AI activity
npx aic update --conversation

# Example output:
# "Available AI sources: warp, augment, claude, cursor, copilot, chatgpt"
# "CLAUDE: Latest 11:35:36 PM"  <- MOST RECENT  
# "CHATGPT: 126 conversations, latest: 12:34:46 AM"
# "Using CLAUDE conversation: claude-session-000189"

# Start 30-min auto-updates across ALL AIs
npx aic auto-update --start
```

## 📊 **Advanced Features**

### Topic Summaries
Instead of raw conversation dumps, get clean summaries:
- **Major work completed:** Key accomplishments with item counts
- **Strategic decisions:** Important choices and their rationale  
- **Issues addressed:** Problems solved with solution types
- **Learning areas:** Key insights and discoveries

### Memory Decay
Older conversations automatically get compressed:
- **FULL** (< 7 days): Complete details
- **SUMMARY** (< 30 days): Key points only
- **BRIEF** (< 90 days): One-line summaries
- **MINIMAL** (> 90 days): Just date and ID

### Smart Content Filtering
Advanced text cleaning removes:
- Raw API responses and structured data
- Corrupted base64 and hex sequences
- Massive file path dumps
- Binary data and control characters

## 🛠️ **All Commands**

### Real-Time Updates
```bash
npx aic auto-update --start           # 30-minute auto-updates
npx aic auto-update --start -i 15     # 15-minute intervals
npx aic update --conversation         # Manual update
```

### Project Setup
```bash
npx aic init                          # Initialize knowledge base
npx aic init --template nextjs        # Use specific template
npx aic migrate                       # Add missing files
```

### Conversation Management
```bash
npx aic extract-list                  # List recent conversations
npx aic extract-conversation <id>     # Extract specific conversation
npx aic checkpoint --file data.json   # Process with AI agents
```

### Analysis & Maintenance
```bash
npx aic stats                         # View knowledge base stats
npx aic search "query"               # Search all files
npx aic validate                      # Check quality
npx aic memory-decay                  # Compress old entries
```

## 🎯 **32 Technology Templates**

Auto-detected or manually selected:

**Web Frontend:** nextjs, react, vue, angular  
**Backend:** node, python, fastapi, django, go, rust, java, spring  
**Mobile:** react-native, flutter, swift, kotlin  
**Specialized:** ai_ml, blockchain, gamedev, devops, terraform  
**And 15+ more...**

## 🔧 **Configuration**

```bash
npx aic config list                   # View all settings
npx aic config set update.interval 30 # Set auto-update interval
npx aic config set sources.primary warp # Set primary AI source
```

## 🚀 **Workflow Integration**

### For Developers
1. Run `npx aic auto-update --start` once per project
2. Let it auto-update every 30 minutes
3. AI assistants read `.ai/conversation-log.md` for context
4. Manual `aicupdate` when you need immediate sync

### For AI Assistants  
1. Always read `.ai/conversation-log.md` first
2. Check `.ai/next-steps.md` for current priorities
3. Reference `.ai/technical-decisions.md` for context
4. Update these files as the conversation progresses

## 📈 **Performance**

- **Processing Speed:** ~100ms per update
- **Memory Usage:** Minimal (SQLite queries only)
- **Storage:** ~1MB per 1000 conversations
- **API Costs:** $0 (runs locally)

## 🐛 **Troubleshooting**

### Auto-updates not working?
```bash
# Check if Warp database is accessible
npx aic extract-list

# Test manual update
npx aic update --conversation

# Check available AI sources
node -e "const {ContextExtractor} = require('./src/context-extractor'); const ext = new ContextExtractor(); console.log('Available:', ext.getAvailableSources());"
```

### Missing conversations?
- Ensure Warp AI is installed and has chat history
- Try different source: `npx aic extract-list --source augment`
- Check permissions for Application Support folder

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Update documentation
5. Submit a pull request

## 📄 **License**

MIT License - see [LICENSE](./LICENSE) file.

---

**🎉 Ready to never re-explain your project again?**

```bash
npx aic init && npx aic auto-update --start
```

Your AI assistants will thank you! 🚀