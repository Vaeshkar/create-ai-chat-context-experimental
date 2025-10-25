# 🔒 Protected AI Files - Off-Limits for Automatic Systems

**CRITICAL: THE ENTIRE `.ai/` FOLDER IS OFF-LIMITS FOR AUTOMATIC SYSTEMS.**

**ALL FILES IN `.ai/` SHOULD NEVER be auto-generated, overwritten, or modified by:**

- MemoryFileWriter
- CacheConsolidationAgent
- MemoryDropoffAgent
- WatcherCommand
- BackgroundService
- Any automatic consolidation system
- Any automatic migration system
- Any automatic watcher or polling service

---

## 🚫 RULE: NO AUTOMATIC WRITES TO `.ai/` FOLDER

**The `.ai/` folder is for MANUAL updates ONLY:**

1. ✅ **Manual updates by USER**
2. ✅ **Manual updates by AI ASSISTANT** (at end of session, when user explicitly asks)
3. ❌ **NEVER by automatic systems**

---

## Protected Files

### ALL FILES IN `.ai/` ARE PROTECTED

Including but not limited to:

### 1. `.ai/code-style.md`

**Purpose:** Code style reference and guidelines
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

### 2. `.ai/design-system.md`

**Purpose:** Design system reference and UI/UX rules
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

### 3. `.ai/npm-publishing-checklist.md`

**Purpose:** Publishing checklist and release procedures
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

### 4. `.ai/project-overview.md`

**Purpose:** High-level project description and architecture overview
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

### 5. `.ai/Testing-philosophy.md`

**Purpose:** Testing philosophy and test strategy
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

### 6. `.ai/conversation-log.md`

**Purpose:** Session history and key decisions
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

### 7. `.ai/next-steps.md`

**Purpose:** Roadmap and priorities
**Owner:** Manual (AI or User)
**Auto-write:** ❌ FORBIDDEN

---

## What These Files Are For

These files are **AI thinking space**:

- ✅ Reference material for understanding project context
- ✅ Guidelines for making decisions
- ✅ Rules for code, design, and testing
- ✅ Checklists for processes
- ✅ Architecture documentation

They are **NOT**:

- ❌ Conversation logs
- ❌ Session summaries
- ❌ Auto-generated documentation
- ❌ Automatic memory files

---

## Automatic System Rules

### MemoryFileWriter

- ✅ Write to `.aicf/recent/` (AICF format only)
- ✅ Write to `.aicf/medium/`, `.aicf/old/`, `.aicf/archive/` (via MemoryDropoffAgent)
- ❌ NEVER write to `.ai/` protected files
- ❌ NEVER write markdown to `.ai/`

### CacheConsolidationAgent

- ✅ Process chunks from cache
- ✅ Write AICF files to `.aicf/recent/`
- ❌ NEVER modify `.ai/` protected files
- ❌ NEVER generate markdown

### MemoryDropoffAgent (future)

- ✅ Move AICF files by age (recent → medium → old → archive)
- ✅ Compress old conversations
- ❌ NEVER touch `.ai/` protected files

### Any Migration/Init System

- ✅ Use protected files as reference
- ✅ Read from protected files
- ❌ NEVER overwrite protected files
- ❌ NEVER auto-generate protected files

---

## Enforcement

If any automatic system tries to write to these files:

1. ❌ BLOCK the write
2. 🚨 LOG a warning
3. 📝 Document the violation
4. 🔧 Fix the code to prevent it

---

## Summary

**These 5 files are AI's thinking space. Hands off, automatic systems!**

- `.ai/code-style.md` - Code thinking
- `.ai/design-system.md` - Design thinking
- `.ai/npm-publishing-checklist.md` - Release thinking
- `.ai/project-overview.md` - Architecture thinking
- `.ai/Testing-philosophy.md` - Testing thinking

All conversation data goes to `.aicf/` in AICF format only.
