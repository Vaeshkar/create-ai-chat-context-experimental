# 🧠 Augment: Automatic Context Loading

**CRITICAL: This rule is automatically included in EVERY user prompt by Augment.**

---

## 📍 Universal Rules Location

**All AI rules are now in `.ai/rules/` folder (universal for all LLMs).**

Before responding to ANY user request, you MUST:

1. ✅ **Read `.ai/README.md`** - Universal AI context instructions
2. ✅ **Read `.ai/rules/always-load-context.md`** - Context loading instructions
3. ✅ **Read `.ai/rules/cleanup-after-completion.md`** - Cleanup rules
4. ✅ **Read `.ai/rules/protected-ai-files.md`** - File protection rules

---

## 🧹 Cleanup After Task Completion

**CRITICAL: After completing ANY task that creates documentation files (.md), you MUST:**

1. ✅ **Ask user:** "Should I move this documentation to docs/ folder?"
2. ✅ **If yes:** Move the file to appropriate docs/ subfolder
3. ✅ **If no:** Leave it in root (user will organize later)

**Files that should be moved:**

- `*-COMPLETE.md` → `docs/phases/`
- `*-ARCHITECTURE*.md` → `docs/architecture/`
- `*-GUIDE.md` → `docs/guides/`
- `*-ANALYSIS.md` → `docs/analysis/`
- `PHASE-*.md` → `docs/phases/`
- `CHECKPOINT-*.md` → `docs/`
- `*-ISSUE.md` → `docs/`
- `*-RESPONSE*.md` → `docs/`

**Files that should stay in root:**

- `README.md`
- `CHANGELOG.md`
- `LICENSE`
- `CONTRIBUTING.md`

**Why this matters:** Root folder clutter makes it hard to find important files and understand project structure.

---

## 🎯 Why This File Exists

This file is **Augment-specific** and tells Augment to load the **universal rules** from `.ai/rules/`.

Other LLMs (Claude, Cursor, Warp, etc.) will read `.ai/rules/` directly.

---

**For full context loading instructions, see `.ai/rules/always-load-context.md`**
