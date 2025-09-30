# 🚀 New Chat Prompt

## Copy/Paste This When Starting a New Chat:

```
Read .ai-instructions first, then help me continue working on the toy store AI system.
```

---

## Alternative Prompts:

### Short Version:

```
Read .ai-instructions first.
```

### Detailed Version:

```
Read .ai-instructions file and all .ai/ knowledge base files, then help me continue working on the toy store AI system.
```

### With Specific Task:

```
Read .ai-instructions first, then help me [specific task].
```

Examples:

- `Read .ai-instructions first, then help me fix the UnifiedSearchAgent relevance issue.`
- `Read .ai-instructions first, then help me optimize the learning engine.`
- `Read .ai-instructions first, then help me improve the product display UI.`

---

## What This Does:

1. ✅ AI reads `.ai-instructions` (root-level file)
2. ✅ `.ai-instructions` points to `.ai/` knowledge base
3. ✅ `.ai-instructions` points to `claude/ai-instructions/`
4. ✅ AI gets full context immediately
5. ✅ No need to explain architecture, decisions, or history

---

## Test Results:

### Chat #20 (FAILED):

- AI didn't discover knowledge base automatically
- Had to be told twice

### Chat #21 (PARTIAL SUCCESS):

- "index please" → Indexed codebase only
- Test questions → Triggered reading `.ai/` files
- Needed two prompts

### Chat #22 (COMPLETE SUCCESS): ✅

- **Prompt:** "Read .ai-instructions first"
- ✅ AI read ALL files immediately (`.ai/` + `claude/ai-instructions/`)
- ✅ AI confirmed full context
- ✅ AI answered all 7 test questions perfectly
- ✅ Ready to work with ZERO explanation needed
- ✅ Saves 30+ minutes every chat

### Lesson Learned:

**The one-liner works perfectly! Use "Read .ai-instructions first" at the start of every new chat.**

---

## Why This Works:

- **Explicit instruction** - AI knows exactly what to do
- **Single command** - One line, easy to copy/paste
- **Triggers chain** - `.ai-instructions` → `.ai/` → `claude/ai-instructions/`
- **Saves time** - 30+ minutes of explanation avoided

---

## Bookmark This File:

Keep this file open or bookmarked so you can quickly copy the prompt when starting new chats.

---

**Last Updated:** 2025-10-30
**Tested:** Chat #20 (failed), Chat #21 (partial success), Chat #22 (COMPLETE SUCCESS ✅)
**Status:** PROVEN TO WORK - Use "Read .ai-instructions first" every time
