# 🧠 Universal Context Loading Rule

**CRITICAL: Read this at the START of EVERY session (all LLMs).**

Before responding to ANY user request, you MUST read these files in this exact order:

## 1️⃣ Read AI-Optimized Memory First (.aicf/ folder)

**Priority: CRITICAL - Read these FIRST for fast context loading**

**NEW ARCHITECTURE (Phase 6 - Cache-First):**

All conversations are stored in individual files in `.aicf/recent/`:

- `.aicf/recent/{date}_{conversationId}.aicf` - Individual conversation files

Read the most recent files to understand current context.

**Format:** These files use AICF format (AI Context Format) - pipe-delimited structured data optimized for AI-to-AI communication.

**Why First:** AICF files are 5x more efficient to parse than markdown (100 tokens vs 500 tokens for same information).

**Note:** Old unified files (`.aicf/conversations.aicf`, `.aicf/technical-context.aicf`, etc.) have been moved to `legacy_aicf/` and are no longer used.

## 2️⃣ Read Protected AI Documentation (.ai/ folder)

**Priority: HIGH - Read these for thinking and decision-making**

**CRITICAL:** These 5 files are OFF-LIMITS for automatic systems. They are AI thinking space only.

Read as needed:

- `.ai/project-overview.md` - High-level project description and architecture
- `.ai/code-style.md` - Code style reference and guidelines
- `.ai/design-system.md` - Design system reference and UI/UX rules
- `.ai/npm-publishing-checklist.md` - Publishing checklist and release procedures
- `.ai/Testing-philosophy.md` - Testing philosophy and test strategy

**Format:** Standard markdown prose for AI thinking and reference.

**Important:** These files are for YOUR thinking, working, and decision-making. Automatic systems (MemoryFileWriter, CacheConsolidationAgent, etc.) must NEVER modify these files. See `.ai/rules/protected-ai-files.md` for enforcement rules.

## 3️⃣ Read Phase Documentation

**Priority: HIGH - Understand project phases**

- `PHASE-1-COMPLETE.md` - Phase 1 summary (JavaScript implementation)
- `PHASE-2-ARCHITECTURE.md` - Phase 2 blueprint (TypeScript rewrite)
- `BETTER-FIX-COMPLETE.md` - Data pipeline fix summary
- `SESSION-SUMMARY.md` - Latest session summary
- `HOW-MEMORY-WORKS.md` - Memory system explanation

## 4️⃣ Session Workflow

### **At START of session:**

1. ✅ Read `.aicf/` files (AI-optimized memory)
2. ✅ Read `.ai/` files (human-readable docs)
3. ✅ Read phase documentation
4. ✅ Understand current project state
5. ✅ Ready to help user

### **At END of session:**

1. ✅ **AUTOMATIC:** Cache-First Architecture automatically captures conversations to `.aicf/recent/`
2. ❌ **NEVER:** Modify the 5 protected `.ai/` files (code-style, design-system, npm-publishing-checklist, project-overview, Testing-philosophy)
3. ❌ **NEVER:** Manually write to `.aicf/` files - all writes are automatic via CacheConsolidationAgent

---

## 📋 Key Rules

### **Project Context**

- This is the **experimental memory consolidation system** for AI conversations
- Hybrid approach: background watcher (5 min) + git commit hook (immediate)
- Captures conversations from Augment LevelDB and consolidates into memory files
- **Phase 1 (JavaScript):** Complete ✅
- **Phase 2 (TypeScript):** Ready to start 🚀

### **Memory Management**

- `.aicf/` = 100% conversation memory (fast, structured, pipe-delimited AICF format)
- `.ai/` = Static documentation only (5 protected files for AI thinking space)
- `.aicf/recent/` = New conversations (0-7 days)
- `.aicf/medium/` = Medium conversations (7-30 days) - managed by MemoryDropoffAgent
- `.aicf/old/` = Old conversations (30-90 days) - managed by MemoryDropoffAgent
- `.aicf/archive/` = Ancient conversations (90+ days) - managed by MemoryDropoffAgent

### **User Context**

- User is Dennis van Leeuwen (26-year advertising veteran, WBS Coding School student, ADHD/dyslexic/Asperger's)
- Dennis prefers architecture-first development, systems thinking, big-picture strategy
- Dennis prioritizes quality over speed: "Better to do it right first time"

---

## 🎯 Success Criteria

You have successfully loaded context when you can answer:

- ✅ What is this project about? (Memory consolidation system)
- ✅ What was the last conversation about? (Check conversation-log.md)
- ✅ What phase are we in? (Phase 1 complete, Phase 2 ready)
- ✅ What was the "Better Fix"? (Conversation summary aggregation, no truncation)
- ✅ What's next? (Phase 2 TypeScript rewrite)

If you cannot answer these questions, **STOP and read the files above.**

---

**This rule ensures continuous memory across all AI sessions in this experimental project!** 🚀
