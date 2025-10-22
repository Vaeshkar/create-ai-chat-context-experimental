# 🚀 Complete User Journey: How the System Works

## Overview
This is a **memory consolidation system** that automatically captures AI conversations and consolidates them into structured memory files. It supports multiple AI platforms (Augment, Claude Desktop, Claude CLI, Warp) and uses a hybrid approach: background watchers + git commit hooks.

---

## 📋 Phase 1: Installation & Setup

### Step 1: Install the Package
```bash
npm install create-ai-chat-context
# or
pnpm add create-ai-chat-context
```

### Step 2: Initialize Your Project
```bash
npx create-ai-chat-context init
```

**What happens:**
- Creates `.aicf/` directory (AI Context Format - machine-readable)
- Creates `.ai/` directory (human-readable documentation)
- Creates `.permissions.aicf` file (platform permissions)
- Creates `.watcher-config.json` (watcher settings)
- Updates `.gitignore` to exclude cache files

### Step 3: Choose Your Mode

#### **Manual Mode** (Recommended for Augment)
```bash
npx create-ai-chat-context init --manual
```
- You manually ask your LLM to update memory files
- No background processes
- Full control over when consolidation happens

#### **Automatic Mode** (Recommended for Claude Desktop/CLI)
```bash
npx create-ai-chat-context init --automatic
```
- Background watcher monitors for new conversations
- Automatically processes and consolidates
- Requires platform permissions

---

## 🔄 Phase 2: Conversation Capture

### For Augment Users (Manual Mode)

**Workflow:**
1. Have your conversation with Augment
2. At the end, ask: *"Please update my memory files with this conversation"*
3. Augment generates a checkpoint JSON
4. Run: `npx create-ai-chat-context checkpoint <checkpoint-file>`
5. System consolidates into `.aicf/` and `.ai/` files

**Example:**
```bash
npx create-ai-chat-context checkpoint ~/Downloads/checkpoint-2025-10-22.json
```

### For Claude Desktop/CLI Users (Automatic Mode)

**Workflow:**
1. Have conversations with Claude
2. Watcher automatically detects new conversations
3. Parses Claude's database/JSONL files
4. Consolidates into memory files
5. Commits changes to git (if enabled)

**Start the watcher:**
```bash
npx create-ai-chat-context watch
```

---

## 📁 Phase 3: Memory File Structure

### `.aicf/` Directory (AI-Optimized Format)
Pipe-delimited structured data, optimized for AI parsing:

```
.aicf/
├── index.aicf              # Project overview & quick stats
├── work-state.aicf         # Recent sessions, active tasks
├── conversations.aicf      # Conversation history (pipe-delimited)
├── decisions.aicf          # Key decisions with impact scores
├── technical-context.aicf  # Architecture, patterns, tech stack
└── design-system.aicf      # UI/UX rules and design decisions
```

**Format Example:**
```
conversation_id|timestamp|platform|summary|key_decisions|technical_work
conv-123|2025-10-22T14:00:00Z|augment|Fixed TypeScript errors|3|5
```

### `.ai/` Directory (Human-Readable Format)
Markdown prose for human readability:

```
.ai/
├── project-overview.md     # High-level description
├── conversation-log.md     # Detailed conversation history
├── technical-decisions.md  # Technical decisions
├── next-steps.md          # Planned work and priorities
└── known-issues.md        # Current bugs and limitations
```

---

## 🔍 Phase 4: Data Processing Pipeline

### Step 1: Capture
- **Augment**: Checkpoint JSON from LLM
- **Claude Desktop**: SQLite database (`conversations.db`)
- **Claude CLI**: JSONL export files
- **Warp**: Terminal session logs

### Step 2: Parse
- Extract conversations, messages, metadata
- Normalize timestamps and IDs
- Preserve platform-specific data (thinking blocks, token usage, etc.)

### Step 3: Extract
- **Decisions**: Key decisions made
- **Actions**: Tasks and next steps
- **Technical Work**: Code changes, architecture decisions
- **State**: Current project state
- **Intent**: User's goals and intentions
- **Flow**: Conversation flow and structure

### Step 4: Consolidate
- Merge with existing memory files
- Avoid duplication
- Update statistics and summaries
- Maintain chronological order

### Step 5: Write
- Update `.aicf/` files (AI-optimized)
- Update `.ai/` files (human-readable)
- Commit to git (if enabled)

---

## 🎯 Phase 5: Using the Memory System

### For AI Assistants
1. Read `.aicf/` files first (5x faster parsing)
2. Then read `.ai/` files for detailed context
3. Use memory to understand project state
4. Make informed decisions based on history

### For Humans
1. Read `.ai/` files for project overview
2. Check `.ai/conversation-log.md` for recent work
3. Review `.ai/technical-decisions.md` for architecture
4. Check `.ai/next-steps.md` for planned work

---

## 🔧 Phase 6: CLI Commands

```bash
# Initialize project
npx create-ai-chat-context init [--manual|--automatic] [--force]

# Process a checkpoint file
npx create-ai-chat-context checkpoint <file>

# Start background watcher
npx create-ai-chat-context watch [--verbose]

# Import Claude exports
npx create-ai-chat-context import-claude <file>
```

---

## 📊 Example: Complete Workflow

```bash
# 1. Initialize in manual mode
npx create-ai-chat-context init --manual

# 2. Have conversation with Augment
# (Ask Augment to generate checkpoint at end)

# 3. Process the checkpoint
npx create-ai-chat-context checkpoint ~/Downloads/checkpoint.json

# 4. Review memory files
cat .aicf/index.aicf
cat .ai/conversation-log.md

# 5. Commit to git
git add .aicf/ .ai/
git commit -m "Update memory: Fixed TypeScript errors"
```

---

## 🎓 Key Concepts

### AICF Format
- **Pipe-delimited** structured data
- **AI-optimized** for fast parsing
- **Compact** representation
- **Efficient** token usage

### Memory Tiers
1. **Immediate**: Current session context
2. **Short-term**: Recent conversations (last 7 days)
3. **Long-term**: Historical decisions and patterns

### Consolidation Strategy
- **No truncation**: Full conversation history preserved
- **Aggregation**: Summaries at conversation level
- **Deduplication**: Avoid storing same info twice
- **Versioning**: Track changes over time

---

## ✅ Success Criteria

You've successfully set up the system when:
- ✅ `.aicf/` and `.ai/` directories exist
- ✅ Memory files are being updated
- ✅ Conversations are being captured
- ✅ Git commits include memory updates
- ✅ AI assistants can read and understand memory files

---

## 🚀 Next Steps

1. **Start using the system** with your preferred platform
2. **Review memory files** after each session
3. **Refine extraction rules** based on your needs
4. **Integrate with your workflow** (git hooks, CI/CD, etc.)
5. **Share memory files** with team members

---

## 📞 Support

For issues or questions:
1. Check `.ai/known-issues.md` for common problems
2. Review `.ai/technical-decisions.md` for architecture
3. Check git history for recent changes
4. Run tests: `pnpm test`

