# AI Knowledge Base - create-ai-chat-context

> **📦 Version 3.1.2 - TypeScript Rewrite Complete**
> **Last Updated:** 2025-10-24
> **Status:** Production Ready

---

## 🎯 Quick Reference (AI: Read This First!)

**Project:** create-ai-chat-context-experimental
**Type:** CLI Tool / NPM Package
**Language:** TypeScript / Node.js
**Status:** v3.1.2 - Production Ready

**What it does (one sentence):**
A CLI tool that automatically captures AI conversations from 8+ LLM platforms and consolidates them into structured memory files (.ai/ for humans, .aicf/ for AI optimization).

**Current focus:**
Phase 2 complete: Full TypeScript rewrite with multi-platform support, version-aware smart merge, and comprehensive test coverage (567 tests).

**Key files to know:**

- `src/cli.ts` - Main CLI entry point with commands
- `src/commands/InitCommand.ts` - Initialize memory system
- `src/commands/MigrateCommand.ts` - Migrate existing setups
- `src/parsers/` - 8 LLM platform parsers
- `src/extractors/` - Decision/action/state extraction
- `.ai/conversation-log.md` - Main conversation history
- `.aicf/` - AI-optimized format directory

**Conventions:**

- **Language:** TypeScript with strict mode
- **Testing:** 567 tests (core logic + infrastructure)
- **File naming:** PascalCase for classes, camelCase for functions
- **Testing Philosophy:** Test YOUR logic, not stdlib (see Testing-philosophy.md)
- **Code Style:** See code-style.md for detailed standards

**Workflow:**

- Automatic conversation capture from LLM platforms
- Version-aware smart merge (preserves user customizations)
- Dual-format output (.ai for humans, .aicf for AI)
- Always verify actual codebase before recommendations

---

## 📚 Project Evolution Timeline

**Last Updated:** 2025-10-24
**Current Version:** 3.1.2
**Test Coverage:** 567 tests passing (6.8 seconds)

### Key Development Phases

1. **v1.0.x** - Initial JavaScript implementation
2. **v2.0.x** - AICF format introduction
3. **v3.0.x** - Multi-platform support (8 LLM platforms)
4. **v3.1.0** - Version-aware smart merge implementation
5. **v3.1.2** - Testing philosophy documentation + comprehensive audit

### User Principles

- **AI Assistant Functionality:** Auto-update .ai files at chat end without manual input
- **Verification First:** Check actual codebase before giving advice ("verify then please")
- **Manual AICF Approach:** AI writes .aicf files directly, no compression agents
- **Session Management:** Remind to update logs before new chat sessions
- **AI-Optimized Formats:** Prefer binary/compressed over human-readable for AI parsing

---

## 🗃️ File Organization

### .ai/ Directory (Human-Readable)

- `README.md` - This overview file
- `conversation-log.md` - Chronological chat history
- `technical-decisions.md` - Architecture decisions and rationale
- `next-steps.md` - Current priorities and tasks
- `known-issues.md` - Bugs and limitations
- `architecture.md` - System design documentation
- `code-style.md` - Coding standards and patterns
- `design-system.md` - UI/UX patterns and guidelines

### .aicf/ Directory (AI-Optimized)

- `index.aicf` - Fast lookup metadata
- `conversation-memory.aicf` - Compressed conversation history
- `technical-context.aicf` - Compressed technical decisions
- `work-state.aicf` - Current tasks and priorities
- `.meta` - Project metadata and configuration

---

## 📊 Token Efficiency Analysis

**Traditional Markdown:** ~150 tokens per conversation entry
**YAML Format:** ~80 tokens per entry (47% reduction)
**AICF Format:** ~12 tokens per entry (92% reduction)

**Result:** 6x more conversation history fits in context windows with AICF.

---

## 🔄 Workflow Integration

### For AI Assistants

1. Read this README.md first for project context
2. Check actual files before making recommendations
3. Update all .ai files at session end
4. Generate .aicf files for token efficiency

### For Developers

1. Use `npx aic init` to set up knowledge base
2. Use `npx aic migrate` to convert formats
3. Use `npx aic context` to get AI-ready project summary
4. Manual file management preferred over automation

---

**💡 Remember:** This knowledge base preserves project memory across infinite chat sessions. Always maintain continuity by updating files before ending conversations.
