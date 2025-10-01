# What AI Needs from Conversation Logs

**Purpose:** Guide for what information AI assistants actually need when starting a new chat session.

---

## 🎯 Priority Hierarchy

### 1. ✅ CRITICAL (Always Need)

**Current State:**
- What exists RIGHT NOW in the codebase
- Recent decisions (last 2-4 weeks)
- Active issues/blockers
- What was just completed (last 1-2 chats)

**Why:** AI needs to know the current reality to avoid suggesting already-completed work or outdated approaches.

**Example:**
```markdown
✅ Good: "Chat #12: Fixed duplicate entries in chat-finish (v0.11.1)"
❌ Bad: "Chat #12: Worked on features"
```

### 2. ✅ IMPORTANT (Very Helpful)

**Project Evolution:**
- Major milestones (v0.9.0, v0.10.0, etc.)
- Key architectural decisions and WHY
- Patterns that emerged over time
- Failed approaches (what NOT to do)

**Why:** Understanding the journey helps AI make better suggestions aligned with project direction.

**Example:**
```markdown
✅ Good: "Chat #7: Made chat-finish 100% automatic (removed manual questions - users don't want to answer after 4-hour sessions)"
❌ Bad: "Chat #7: Updated chat-finish"
```

### 3. ⚠️ LESS IMPORTANT (Nice to Have)

**Historical Context:**
- Detailed file changes from 1+ month ago
- Step-by-step debugging from old sessions
- Verbose "what we did" lists

**Why:** Useful for reference but not critical for current work.

**Example:**
```markdown
✅ Good: "Chat #3: Added config system (v0.7.0) - per-project settings in .ai/config.json"
⚠️ Less useful: "Chat #3: Modified 8 files, added config.js, updated cli.js, changed tokens.js..."
```

### 4. ❌ NOT NEEDED (Noise)

**Clutter:**
- Vague entries like "worked on features"
- Duplicate information
- Overly detailed play-by-play
- Obvious information

**Why:** Wastes tokens and makes it harder to find important information.

**Example:**
```markdown
❌ Bad: "Worked on new features, bug fixes, documentation"
❌ Bad: "Modified files: src/chat-finish.js, .ai/conversation-log.md, .ai/known-issues.md..."
```

---

## 📊 Improved Summary Format

### Before (v0.11.0)

```markdown
## 📋 Summary of Earlier Chats

> Chats #1 - #4 (summarized for token efficiency)

**Chat #1 - v0.6.4: Smarter insights + latest AI models:**
- Released v0.6.4 with two major improvements
- Smarter token usage insights in src/stats.js
- Manual model updates over auto-fetch

**Chat #2 - v0.6.5: Bug Fix:**
- Released v0.6.5 - Bug fix for conversation entry counting
- Updated regex from /^## Chat #\d+/gm to /^##.*Chat\s*#?\d+/gim
```

**Issues:**
- Too verbose (3 lines per chat)
- Doesn't prioritize important info
- Mixes "what" with "how"

### After (v0.11.1)

```markdown
## 📋 Summary of Earlier Chats

> Chats #1 - #4 (summarized for token efficiency)
> 💡 **For AI:** Focus on patterns, outcomes, and WHY decisions were made

- **Chat #1** (v0.6.4: Smarter insights + latest AI models): Manual model updates over auto-fetch (AI models update every 3-6 months, not frequently enough to justify added complexity)
- **Chat #2** (v0.6.5: Bug Fix): Changed regex to /^##.*Chat\s*#?\d+/gim to support multiple conversation log formats
- **Chat #3** (v0.7.0: Configuration system): Per-project config in .ai/config.json instead of global config (allows different models for different projects)
- **Chat #4** (v0.9.0: chat-finish command): Automatically update all .ai/ files at end of chat (transforms tool from manual → automatic)
```

**Improvements:**
- ✅ One line per chat (75% token reduction)
- ✅ Prioritizes decisions over "what we did"
- ✅ Includes WHY (rationale in parentheses)
- ✅ Focuses on outcomes, not process

---

## 🧠 Smart Extraction Logic

### Priority Order

1. **Key Decisions** (if present)
   - These are the most important for understanding project direction
   - Example: "Per-project config instead of global config"

2. **Problems Solved** (if no decisions)
   - Shows what issues were resolved
   - Example: "Fixed duplicate entries in chat-finish"

3. **What We Did** (fallback)
   - Use the most specific item (longest = most detailed)
   - Example: "Completely rewrote src/chat-finish.js (274 lines, major refactor)"

### Example Extraction

**Input (Chat #7):**
```markdown
## Chat #7 - v0.10.0: 100% Automatic chat-finish

### What We Did
- Released v0.10.0 - 100% automatic chat-finish with git analysis
- Completely rewrote src/chat-finish.js (274 lines, major refactor)
- Added automatic git diff analysis
- Removed manual questions, made it fully automatic

### Key Decisions
- Make chat-finish 100% automatic instead of interactive
  - Rationale: Users don't want to answer questions after 4-hour sessions
  - Alternative considered: Keep interactive questions (rejected - too manual)
  - Decision: Use git diff analysis to automatically detect what happened
```

**Output (Summary):**
```markdown
- **Chat #7** (v0.10.0: 100% Automatic chat-finish): Make chat-finish 100% automatic instead of interactive (Users don't want to answer questions after 4-hour sessions)
```

**Why this works:**
- ✅ Captures the key decision (automatic vs interactive)
- ✅ Includes the rationale (WHY)
- ✅ One line instead of 10+ lines
- ✅ AI understands the design philosophy

---

## 💡 What AI Actually Reads

When I (AI) start a new chat, here's my reading order:

### 1. First Pass (30 seconds)
- **README.md** - What is this project?
- **architecture.md** - Tech stack, system design
- **next-steps.md** - What's in progress? What's next?

### 2. Second Pass (1-2 minutes)
- **conversation-log.md** - Last 3-5 chats (detailed)
- **technical-decisions.md** - Recent decisions (last month)
- **known-issues.md** - Active problems

### 3. Third Pass (if needed)
- **Summarized chats** - Quick scan for patterns
- **Specific files** - If user mentions something specific

### What I Skip
- ❌ Detailed file change lists from old chats
- ❌ Step-by-step debugging from months ago
- ❌ Vague entries without specific information
- ❌ Duplicate information

---

## 📏 Token Efficiency

### Example Comparison

**Verbose (Old Style):**
```markdown
**Chat #7 - v0.10.0: 100% Automatic chat-finish:**
- Released v0.10.0 - 100% automatic chat-finish with git analysis
- Completely rewrote src/chat-finish.js (274 lines, major refactor)
- Added automatic git diff analysis
- Removed manual questions, made it fully automatic
- Analyzes changed files and generates smart summaries
- Updates all .ai/ files automatically

Files Changed:
- src/chat-finish.js - Complete rewrite (274 lines, +220 insertions, -52 deletions)
- .ai/conversation-log.md - Updated
- .ai/known-issues.md - Updated
- .ai/next-steps.md - Updated
- .ai/technical-decisions.md - Updated
- CHANGELOG.md - Added v0.10.0 entry
- README.md - Updated version
- package.json - Version bump to 0.10.0
```

**Tokens:** ~200 tokens

**Concise (New Style):**
```markdown
- **Chat #7** (v0.10.0: 100% Automatic chat-finish): Make chat-finish 100% automatic instead of interactive (Users don't want to answer questions after 4-hour sessions)
```

**Tokens:** ~35 tokens

**Savings:** 82% reduction! 🎉

---

## 🎯 Recommendations

### For Users

1. **Use `npx aic summary --keep 10`** instead of `archive`
   - Keeps all history visible (just condensed)
   - AI can still see patterns and evolution
   - Massive token savings

2. **Focus on WHY in conversation logs**
   - Not just "what we did" but "why we chose this approach"
   - Include alternatives considered
   - Note what didn't work

3. **Be specific in chat-finish**
   - Good: "Fixed duplicate entries by tracking last processed commit"
   - Bad: "Worked on bug fixes"

### For AI Assistants

1. **Read recent chats in detail** (last 5-10)
2. **Scan summaries for patterns** (older chats)
3. **Focus on decisions and outcomes**, not process
4. **Ask user if something seems outdated**

---

## 🔄 Summary Command Improvements (v0.11.1)

### Changes Made

1. **Smarter extraction logic**
   - Prioritizes: Decisions > Problems > What We Did
   - Chooses most specific information
   - Includes WHY (rationale)

2. **Better formatting**
   - One line per chat (instead of 3-5 lines)
   - Format: `**Chat #X** (Topic): Key point (Rationale)`
   - Easier to scan quickly

3. **AI-focused hint**
   - Added: `> 💡 **For AI:** Focus on patterns, outcomes, and WHY decisions were made`
   - Guides AI to read summaries correctly

### Example Output

```markdown
## 📋 Summary of Earlier Chats

> Chats #1 - #10 (summarized for token efficiency)
> 💡 **For AI:** Focus on patterns, outcomes, and WHY decisions were made

- **Chat #1** (v0.6.4): Manual model updates over auto-fetch (AI models update every 3-6 months)
- **Chat #2** (v0.6.5): Support date-first format in conversation entry counting
- **Chat #3** (v0.7.0): Per-project config in .ai/config.json (different models for different projects)
- **Chat #7** (v0.10.0): Make chat-finish 100% automatic (users don't want to answer questions)
- **Chat #11** (v0.10.2): Deprecate manual log command in favor of automatic chat-finish
```

---

**Last Updated:** 2025-10-01  
**Version:** v0.11.1

