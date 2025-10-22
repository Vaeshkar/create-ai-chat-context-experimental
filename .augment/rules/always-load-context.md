# 🧠 Automatic Context Loading

**CRITICAL: This rule is automatically included in EVERY user prompt.**

Before responding to ANY user request, you MUST read these files in this exact order:

## 1️⃣ Read AI-Optimized Memory First (.aicf/ folder)

**Priority: CRITICAL - Read these FIRST for fast context loading**

Read in this order:

1. `.aicf/index.aicf` - Project overview, current state, quick stats
2. `.aicf/work-state.aicf` - Recent sessions, current work, active tasks
3. `.aicf/conversations.aicf` - Conversation history (pipe-delimited format)
4. `.aicf/decisions.aicf` - Key decisions with impact scores
5. `.aicf/technical-context.aicf` - Architecture, patterns, tech stack
6. `.aicf/design-system.aicf` - UI/UX rules and design decisions

**Format:** These files use AICF format (AI Context Format by Digital Liquids) - pipe-delimited structured data optimized for AI-to-AI communication.

**Why First:** AICF files are 5x more efficient to parse than markdown (100 tokens vs 500 tokens for same information).

## 2️⃣ Read Human-Readable Documentation (.ai/ folder)

**Priority: HIGH - Read these for detailed context**

Read as needed:

- `.ai/project-overview.md` - High-level project description
- `.ai/conversation-log.md` - Detailed conversation history (human-readable)
- `.ai/technical-decisions.md` - Technical decisions
- `.ai/next-steps.md` - Planned work and priorities
- `.ai/known-issues.md` - Current bugs and limitations

**Format:** Standard markdown prose for human readability.

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

1. 🚨 **MANDATORY:** Update `.aicf/` files with new conversation, decisions, insights
2. 🚨 **MANDATORY:** Update `.ai/conversation-log.md` with detailed session summary
3. 🚨 **MANDATORY:** Update other `.ai/` files if architecture/design/issues changed

---

## 📋 Key Rules

### **Project Context**

- This is the **experimental memory consolidation system** for AI conversations
- Hybrid approach: background watcher (5 min) + git commit hook (immediate)
- Captures conversations from Augment LevelDB and consolidates into memory files
- **Phase 1 (JavaScript):** Complete ✅
- **Phase 2 (TypeScript):** Ready to start 🚀

### **Memory Management**

- `.aicf/` = AI-to-AI communication (fast, structured, pipe-delimited)
- `.ai/` = AI-to-Human communication (detailed, prose, markdown)
- Both systems must be kept in sync at end of every session

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

