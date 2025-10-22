# 🧠 Create AI Chat Context - Memory Consolidation System

**Automatic memory consolidation for AI conversations across multiple platforms.**

## 🎯 What Is This?

A system that automatically captures AI conversations from multiple platforms (Augment, Claude Desktop, Claude CLI, Warp) and consolidates them into structured memory files for persistent context.

## ✨ Key Features

- **Multi-Platform Support** - Augment, Claude Desktop, Claude CLI, Warp
- **Automatic Capture** - Background watchers monitor for new conversations
- **Smart Consolidation** - Extracts decisions, actions, technical work, and context
- **Dual Format Storage** - AI-optimized (AICF) + Human-readable (Markdown)
- **Git Integration** - Automatic commits for version control
- **Type-Safe** - Pure TypeScript with 100% type coverage

## 🚀 Quick Start

### Installation
```bash
npm install create-ai-chat-context
# or
pnpm add create-ai-chat-context
```

### Initialize
```bash
# Manual mode (for Augment)
npx create-ai-chat-context init --manual

# Automatic mode (for Claude Desktop/CLI)
npx create-ai-chat-context init --automatic
```

### Use It
```bash
# Manual: Process checkpoint
npx create-ai-chat-context checkpoint <file>

# Automatic: Start watcher
npx create-ai-chat-context watch
```

## 📚 Documentation

All documentation is in the `/docs/` folder:

- **[USER-JOURNEY-COMPLETE.md](docs/USER-JOURNEY-COMPLETE.md)** - Complete system overview and user journey
- **[WORKFLOW-STEP-BY-STEP.md](docs/WORKFLOW-STEP-BY-STEP.md)** - Step-by-step workflows for all platforms
- **[DATA-FLOW-EXAMPLES.md](docs/DATA-FLOW-EXAMPLES.md)** - Real examples of data flowing through the system
- **[FINAL-SUMMARY.md](docs/FINAL-SUMMARY.md)** - Quick reference guide
- **[PHASE-2-TYPESCRIPT-COMPLETE.md](docs/PHASE-2-TYPESCRIPT-COMPLETE.md)** - Technical completion summary

## 🏗️ Architecture

```
Input Sources (Augment, Claude, Warp)
         ↓
    Watchers/Triggers
         ↓
    Parser (Extract conversations)
         ↓
    Extractor (Extract decisions, actions, etc.)
         ↓
    Orchestrator (Merge & consolidate)
         ↓
    Writer (Update memory files)
         ↓
    Memory Storage (.aicf/ + .ai/)
         ↓
    Git Commit (Track changes)
         ↓
    AI Assistants & Humans (Use memory)
```

## 💾 Memory Files

### `.aicf/` Directory (AI-Optimized)
Pipe-delimited structured data, optimized for AI parsing:
- `index.aicf` - Project overview & stats
- `conversations.aicf` - Conversation history
- `decisions.aicf` - Key decisions
- `technical-context.aicf` - Architecture & tech stack

### `.ai/` Directory (Human-Readable)
Markdown prose for human readability:
- `project-overview.md` - High-level description
- `conversation-log.md` - Detailed conversation history
- `technical-decisions.md` - Technical decisions
- `next-steps.md` - Planned work & priorities

## 🛠️ Development

### Build
```bash
pnpm build
```

### Test
```bash
pnpm test          # Run all tests
pnpm test src/     # Run specific tests
```

### Lint
```bash
pnpm lint          # Run ESLint
pnpm format        # Format with Prettier
```

## 📊 Project Status

**Phase 2: TypeScript Rewrite - COMPLETE ✅**
- ✅ Pure TypeScript codebase (0 .js files in src/)
- ✅ Build passing (0 TypeScript errors, 0 ESLint errors)
- ✅ 566/587 tests passing
- ✅ Comprehensive documentation

**Next: Phase 3 - Fix Remaining Tests**

## 🎓 Key Concepts

### AICF Format
- **Pipe-delimited** structured data
- **AI-optimized** for fast parsing
- **Compact** representation
- **Efficient** token usage

### Memory Tiers
1. **Immediate** - Current session context
2. **Short-term** - Recent conversations (7 days)
3. **Long-term** - Historical decisions & patterns

### Consolidation Strategy
- **No truncation** - Full conversation history preserved
- **Aggregation** - Summaries at conversation level
- **Deduplication** - Avoid storing same info twice
- **Versioning** - Track changes over time

## 📞 CLI Commands

```bash
# Initialize project
npx create-ai-chat-context init [--manual|--automatic] [--force]

# Process a checkpoint file
npx create-ai-chat-context checkpoint <file>

# Start background watcher
npx create-ai-chat-context watch [--verbose]

# Import Claude exports
npx create-ai-chat-context import-claude <file>
```

## 📖 Learn More

Start with **[USER-JOURNEY-COMPLETE.md](docs/USER-JOURNEY-COMPLETE.md)** for a complete overview of how the system works.

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🙏 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

**Ready to consolidate your AI conversations?** 🚀

Start with: `npx create-ai-chat-context init`

