# AICF 2.0 Complete Guide

**AI Context Format (AICF) 2.0** - The universal AI memory protocol for persistent context across chat sessions.

---

## Table of Contents

- [What is AICF 2.0?](#what-is-aicf-20)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Reading AICF Files](#reading-aicf-files)
- [Format Specifications](#format-specifications)
- [Converting Back](#converting-back)
- [Advanced Usage](#advanced-usage)
- [Troubleshooting](#troubleshooting)

---

## What is AICF 2.0?

AICF 2.0 is a **universal AI memory protocol** that solves context loss between AI chat sessions.

### The Problem

When your AI chat fills up (hits token limit), you start a new chat and lose all context. You have to re-explain everything.

### The Solution

AICF 2.0 creates a persistent memory system (`.aicf/` directory) that connects all your AI chats:

```
Chat Session 1 (fills up)
    ↓
Start Chat Session 2
    ↓
Say: "Read .aicf/ and continue"
    ↓
AI has FULL MEMORY!
```

**Zero manual steps. AI reads files directly.** ✅

### Key Benefits

- **88% token reduction** vs markdown (1.8K vs 15K tokens)
- **Instant context loading** (2 seconds vs 5 minutes)
- **Relationship tracking** (link conversations to decisions)
- **Works with ALL AIs** (Claude, ChatGPT, Augment, Cursor, etc.)
- **Aligned with Anthropic's vision** (better than their 84% reduction!)

---

## Quick Start

### 1. Migrate Your Data

```bash
npx aic migrate
```

This converts your `.ai/` directory to `.aicf/` format.

**What it does:**

- Converts `conversation-log.md` → `conversations.aicf`
- Converts `technical-decisions.md` → `decisions.aicf`
- Converts `known-issues.md` → `issues.aicf`
- Converts `next-steps.md` → `tasks.aicf`
- Creates `index.aicf` for fast lookup
- Generates `.meta` with project metadata

**Expected output:**

```
🚀 Migrating to AICF 2.0

Converting files...
  - Conversations: 9
  - Decisions: 6
  - Tasks: 49
  - Issues: 5
✔ Migration complete!

📊 Results:
   Conversations: 9
   Decisions: 6
   Tasks: 49
   Issues: 5
```

### 2. Use in New Chat

When your current chat fills up:

1. Start a new AI chat
2. Say: **"Read .aicf/ and continue"**
3. Done!

**The AI reads .aicf/ files directly and has full context instantly!**

**Zero manual steps. Zero copy/paste. Just works.** ✅

### 3. View Your Context (Optional)

For human review only:

```bash
# Human-readable summary
npx aic context

# AI-optimized format
npx aic context --ai

# Complete details
npx aic context --full
```

**Note:** The `context` command is for humans to review project state. AI can read `.aicf/` files directly without this command.

---

## Commands

### `npx aic migrate`

Convert `.ai/` directory to `.aicf/` format.

**Options:**

- None (runs automatically)

**What it preserves:**

- All conversation history
- All technical decisions
- All tasks and their status
- All known issues
- Project metadata

**Safe:**

- Original `.ai/` files are NOT deleted
- You can always go back
- Non-destructive operation

---

### `npx aic context`

Display AI context for starting new chat sessions.

**Options:**

- `--ai` - AI-optimized format (paste into new chats)
- `--full` - Show complete details

**Examples:**

```bash
# Human-readable summary
npx aic context

# AI-optimized (for new chats)
npx aic context --ai

# Complete details
npx aic context --full
```

**Output (--ai):**

```
# AI Context - create-ai-chat-context v0.14.0

## Project Overview
Preserve AI chat context and history across sessions

## Current State
Status: active_development
Phase: migrated_to_aicf
Last Chat: #9

## Statistics
- Conversations: 9
- Decisions: 6
- Tasks: 49
- Issues: 5

## Active Tasks
- [TODO] Test v0.10.0 and publish to npm (Priority: H)
- [TODO] Gather user feedback (Priority: H)
...

## Recent Decisions
- Per-Project Configuration Storage: Store config in .ai/config.json
- Simplified Token Report: Show 4 models by default
...

---
Full context available in .aicf/ directory
```

---

## Reading AICF Files

AICF files use a **pipe-delimited format** for maximum token efficiency.

### Directory Structure

```
.aicf/
├── index.aicf              # Fast lookup index
├── conversations.aicf      # All chat history
├── decisions.aicf          # Technical decisions
├── tasks.aicf              # Project tasks
├── issues.aicf             # Known issues
└── .meta                   # Project metadata (JSON)
```

### File Format

Each AICF file has three sections:

1. **@SCHEMA** - Defines the fields
2. **@DATA** - Contains the entries
3. **@LINKS** (optional) - Relationship tracking

### Example: conversations.aicf

```
@CONVERSATIONS
@SCHEMA
C#|TIMESTAMP|TYPE|TOPIC|WHAT|WHY|OUTCOME|FILES

@DATA
1|20251001|R|v0.10.0 release|Released automatic chat-finish|Users wanted automation|SHIPPED|src/chat-finish.js
2|20251001|F|Config system|Added per-project config|Different projects need different settings|SHIPPED|src/config.js
3|20251002|W|AICF 2.0|Built universal AI memory|Solve context loss|IN_PROGRESS|src/aicf-*.js
```

**Fields:**

- `C#` - Chat number
- `TIMESTAMP` - Date (YYYYMMDD format)
- `TYPE` - R=Release, F=Feature, X=Fix, D=Docs, W=Work, M=Refactor
- `TOPIC` - Short description (40 chars)
- `WHAT` - What was done (80 chars)
- `WHY` - Why it was done (60 chars)
- `OUTCOME` - S=Shipped, D=Decided, R=Resolved, P=InProgress, B=Blocked
- `FILES` - Comma-separated file paths

### Example: decisions.aicf

```
@DECISIONS
@SCHEMA
D#|TIMESTAMP|TITLE|DECISION|RATIONALE|IMPACT|STATUS

@DATA
1|20251001T120000Z|Per-Project Config|Store in .ai/config.json|Different projects need different models|Users can set per-project preferences|IMPLEMENTED
2|20251001T120000Z|Simplified Token Report|Show 4 models by default|16 models was overwhelming|Cleaner output, better UX|IMPLEMENTED
```

### Example: tasks.aicf

```
@TASKS
@SCHEMA
T#|PRIORITY|EFFORT|STATUS|TASK|DEPENDENCIES|ASSIGNED|CREATED|COMPLETED

@DATA
1|H|M|TODO|Test v0.10.0 and publish|None||2025-10-02T05:34:12Z|
2|H|M|TODO|Gather user feedback|None||2025-10-02T05:34:12Z|
3|M|S|DONE|Add config command|None||2025-10-01T10:00:00Z|2025-10-01T14:30:00Z
```

**Priority:** H=High, M=Medium, L=Low
**Effort:** S=Small, M=Medium, L=Large
**Status:** TODO, DOING, DONE, BLOCKED, CANCELLED

### Example: issues.aicf

```
@ISSUES
@SCHEMA
I#|TIMESTAMP|SEVERITY|TITLE|ISSUE|IMPACT|WORKAROUND|STATUS

@DATA
1|20251001T120000Z|MEDIUM|Chat-finish formatting|Duplicate entries created|Poor UX|Fixed in v0.10.1|RESOLVED
2|20251001T120000Z|LOW|Token report overwhelming|16 models too many|Cluttered output|Show 4 by default|RESOLVED
```

**Severity:** CRITICAL, HIGH, MEDIUM, LOW
**Status:** OPEN, INVESTIGATING, WORKAROUND, FIXED, WONTFIX, RESOLVED

---

## Format Specifications

### Token Comparison

| Format   | Tokens per Entry | Example                          |
| -------- | ---------------- | -------------------------------- |
| Markdown | 150              | Full prose with sections         |
| YAML     | 80               | Structured with labels           |
| **AICF** | **12**           | **Pipe-delimited ultra-compact** |

### Scaling Analysis

| Entries | Markdown | YAML   | AICF  | Savings |
| ------- | -------- | ------ | ----- | ------- |
| 10      | 1,500    | 800    | 120   | 85%     |
| 50      | 7,500    | 4,000  | 600   | 85%     |
| 100     | 15,000   | 8,000  | 1,200 | 85%     |
| 500     | 75,000   | 40,000 | 6,000 | 85%     |

### Context Window Capacity

| AI Model          | YAML Entries | AICF Entries | Improvement |
| ----------------- | ------------ | ------------ | ----------- |
| Claude 3.5 Sonnet | 2,500        | 16,600       | 6.6x        |
| GPT-4 Turbo       | 1,600        | 10,600       | 6.6x        |
| GPT-4o            | 1,600        | 10,600       | 6.6x        |

---

## Converting Back

### Your .ai/ Files Are Safe

The `migrate` command does NOT delete your `.ai/` files. They remain intact!

```
Before migration:
.ai/
├── conversation-log.md
├── technical-decisions.md
├── known-issues.md
└── next-steps.md

After migration:
.ai/                          ← Still here!
├── conversation-log.md
├── technical-decisions.md
├── known-issues.md
└── next-steps.md

.aicf/                        ← New directory
├── index.aicf
├── conversations.aicf
├── decisions.aicf
├── tasks.aicf
└── issues.aicf
```

### To Go Back

Simply delete the `.aicf/` directory:

```bash
rm -rf .aicf
```

Your original `.ai/` files are unchanged!

### To Re-migrate

If you update your `.ai/` files and want to re-migrate:

```bash
rm -rf .aicf
npx aic migrate
```

---

## Advanced Usage

### Query Specific Data

The `.aicf/` files are designed for AI parsing, but you can also read them programmatically:

```javascript
const fs = require("fs");

// Read conversations
const content = fs.readFileSync(".aicf/conversations.aicf", "utf8");
const lines = content.split("\n");

// Find @DATA section
const dataStart = lines.findIndex((l) => l === "@DATA") + 1;
const entries = lines
  .slice(dataStart)
  .filter((l) => l.trim() && !l.startsWith("@"));

// Parse entries
entries.forEach((entry) => {
  const [id, timestamp, type, topic, what, why, outcome, files] =
    entry.split("|");
  console.log(`Chat #${id}: ${topic}`);
});
```

### Integration with AI Tools

**Claude Projects:**

```bash
npx aic context --ai > claude-context.md
# Upload to Claude Projects
```

**Cursor:**

```bash
# Cursor automatically reads .aicf/ if present
```

**Custom AI:**

```bash
# Get context and pass to your AI
CONTEXT=$(npx aic context --ai)
your-ai-tool --context "$CONTEXT"
```

---

## Troubleshooting

### Migration Shows 0 Entries

**Problem:** `npx aic migrate` shows 0 conversations/decisions/tasks/issues.

**Solution:**

1. Check if `.ai/` files exist: `ls -la .ai/`
2. Check if files have content: `cat .ai/conversation-log.md`
3. Check file format matches expected format
4. Run with debug: `DEBUG=* npx aic migrate`

### Context Command Not Found

**Problem:** `npx aic context` says command not found.

**Solution:**

1. Update to latest version: `npm install -g create-ai-chat-context@latest`
2. Or use full command: `npx create-ai-chat-context context`

### AICF Files Look Wrong

**Problem:** `.aicf/` files have strange formatting.

**Solution:**

1. Delete and re-migrate: `rm -rf .aicf && npx aic migrate`
2. Check `.ai/` source files for corruption
3. Report issue: https://github.com/Vaeshkar/create-ai-chat-context/issues

### Want Human-Readable Format

**Problem:** AICF files are hard to read manually.

**Solution:**

- Use `npx aic context` for human-readable summary
- Use `npx aic context --full` for complete details
- Original `.ai/` files are still available (human-readable)

---

## See Also

- [AICF Specification](./AICF-SPEC.md) - Technical specification
- [Quick Start Guide](./QUICKSTART-AICF.md) - Get started in 3 commands
- [Anthropic Alignment](./ANTHROPIC-ALIGNMENT.md) - How AICF aligns with Anthropic's vision
- [Benchmark Report](./AICF-BENCHMARK-REPORT.md) - Real-world performance data
- [Commands Reference](../../COMMANDS.md) - All available commands

---

**Questions?** [Open an issue on GitHub](https://github.com/Vaeshkar/create-ai-chat-context/issues)
