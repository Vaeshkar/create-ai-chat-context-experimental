# AI Knowledge Base - create-ai-chat-context

> **🔒 PROTECTED FILE - Generated on 2025-10-05T17:27:03Z from Augment Data**  
> **DO NOT OVERWRITE - Contains historical context essential for project continuity**

---

## 🎯 Quick Reference (AI: Read This First!)

**Project:** create-ai-chat-context  
**Type:** CLI Tool / NPM Package  
**Language:** Node.js / JavaScript  
**Status:** In Development (v1.0.2 active development)

**What it does (one sentence):**  
A CLI tool that creates and manages AI knowledge bases (.ai/ and .aicf/) for seamless context preservation across chat sessions.

**Current focus:**  
Implementing dual-format strategy (.ai for humans, .aicf for AI optimization) with manual workflow approach after abandoning automated compression.

**Key files to know:**
- `bin/cli.js` - Main CLI entry point with commands
- `src/init.js` - Initialize knowledge base structures  
- `src/migrate.js` - Convert between .ai and .aicf formats
- `.ai/conversation-log.md` - Main conversation history
- `.aicf/` - AI-optimized format directory (88% token reduction)

**Conventions:**
- **Modules:** CommonJS (require/module.exports)
- **File naming:** kebab-case for files, camelCase for functions
- **Variable naming:** camelCase
- **Testing:** Manual testing with real projects

**Workflow:**
- Manual .ai/.aicf file management preferred over automation  
- AI should update knowledge base files at end of sessions
- Verify actual codebase state before trusting documentation
- Always show completed work first in next-steps.md

---

## 📚 Project Evolution Timeline

**Last Updated:** 2025-10-05T17:27:03Z  
**Data Source:** Augment VSCode Extension (workspace: da1900ff993fd0b67bc8687c832c30a6/Augment.vscode-augment)  
**Command History:** 180+ development commands tracked  
**File Access History:** 60+ active files tracked

### Key Development Phases:

1. **v0.9.x-v0.10.x:** Automated chat-finish development
2. **v0.11.x:** AI-optimized formats (YAML, token reduction)
3. **v0.12.x:** AI-native conversation format (AICF) 
4. **v1.0.x:** Simplification and dual-format strategy
5. **Current:** Manual workflow refinement

### User Principles (From Augment Memory):

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

### For AI Assistants:
1. Read this README.md first for project context
2. Check actual files before making recommendations  
3. Update all .ai files at session end
4. Generate .aicf files for token efficiency

### For Developers:
1. Use `npx aic init` to set up knowledge base
2. Use `npx aic migrate` to convert formats
3. Use `npx aic context` to get AI-ready project summary
4. Manual file management preferred over automation

---

**💡 Remember:** This knowledge base preserves project memory across infinite chat sessions. Always maintain continuity by updating files before ending conversations.