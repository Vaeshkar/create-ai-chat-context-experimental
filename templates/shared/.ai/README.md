# 📁 .ai/ Folder - Universal AI Context

**This folder contains context and rules for ALL AI assistants (Augment, Claude, Cursor, Warp, Copilot, ChatGPT, etc.)**

---

## 🤖 For AI Assistants

**CRITICAL: Read these files at the START of every session:**

### **1. Rules (MUST READ FIRST)**

- `.ai/rules/always-load-context.md` - How to load context at session start
- `.ai/rules/cleanup-after-completion.md` - Clean up planning docs after tasks complete
- `.ai/rules/protected-ai-files.md` - Never auto-modify files in .ai/ folder

### **2. Project Context**

- `.ai/code-style.md` - Code style reference and guidelines
- `.ai/design-system.md` - Design system reference and UI/UX rules
- `.ai/npm-publishing-checklist.md` - Publishing checklist and release procedures
- `.ai/Testing-philosophy.md` - Testing philosophy and test strategy
- `.augment/project-overview.md` - High-level project description (auto-generated)

### **3. Conversation Memory**

- `.aicf/sessions/` - Recent conversation history (AICF format - AI-optimized)

---

## 👤 For Users

When starting a new session with ANY AI assistant, say:

> **"Read the .ai/ folder first, especially .ai/rules/"**

This ensures the AI assistant:

- ✅ Loads project context
- ✅ Understands code style and architecture
- ✅ Follows project-specific rules
- ✅ Reads recent conversation history

---

## 🔧 Platform-Specific Setup

### **Augment (VSCode Extension)**

- ✅ **Automatic** - Augment auto-loads `.augment/rules/` which points to `.ai/rules/`
- No user action needed

### **Cursor (VSCode Fork)**

Add to `.cursorrules`:

```
# Load AI Rules
Before every task, read all files in .ai/rules/ folder
```

### **Warp (Terminal)**

Add to `warp.md`:

```markdown
# AI Rules

Before responding, always read .ai/rules/ folder
```

### **Claude Desktop/CLI**

At session start, say:

```
Read .ai/rules/ folder first
```

### **Copilot / ChatGPT / Other LLMs**

At session start, say:

```
Read .ai/rules/ folder first
```

---

## 📂 Folder Structure

```
.ai/
├── README.md                      # This file
├── rules/                         # Universal AI rules
│   ├── always-load-context.md     # Context loading instructions
│   ├── cleanup-after-completion.md # Planning doc cleanup rule
│   └── protected-ai-files.md      # File protection rule
├── code-style.md                  # Code guidelines
├── design-system.md               # Design rules
├── npm-publishing-checklist.md    # Release process
└── Testing-philosophy.md          # Testing rules

.augment/
└── project-overview.md            # Architecture overview (auto-generated)
```

---

## 🎯 Why This Folder Exists

**Problem:** AI assistants have no memory between sessions. Every new session starts from scratch.

**Solution:** This folder provides:

1. **Project context** - What this project does, how it's structured
2. **Code standards** - How to write code that fits the project
3. **Rules** - How to behave (load context, clean up, don't auto-modify)
4. **Memory** - Recent conversation history in `.aicf/sessions/`

**Result:** AI assistants can pick up where the last session left off, maintaining continuity across sessions and platforms.

---

## 🚀 Quick Start for AI Assistants

**At the start of EVERY session, execute this checklist:**

- [ ] Read `.ai/rules/always-load-context.md`
- [ ] Read `.ai/rules/cleanup-after-completion.md`
- [ ] Read `.ai/rules/protected-ai-files.md`
- [ ] Read `.augment/project-overview.md`
- [ ] Read `.ai/code-style.md`
- [ ] Read most recent files in `.aicf/sessions/`
- [ ] Confirm you understand the project context

**If you cannot complete this checklist, STOP and ask the user for help.**

---

**This folder is the foundation of continuous AI memory across all platforms!** 🧠
