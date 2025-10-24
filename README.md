# 🧠 Create AI Chat Context - Memory Consolidation System

**Automatic memory consolidation for AI conversations across multiple platforms.**

## 🔐 Privacy First

**This tool reads your private LLM conversations locally on your machine. It does NOT send data anywhere. It does NOT upload to cloud. It does NOT share with third parties.**

- ✅ All processing happens on your computer
- ✅ You explicitly grant permission for each platform
- ✅ You can revoke access anytime
- ✅ You can delete all data anytime
- ✅ Complete audit trail of all access

**[Read our Privacy Policy →](PRIVACY.md) | [Read our Security Policy →](SECURITY.md)**

## 🎯 What Is This?

A system that automatically captures AI conversations from multiple platforms (Augment, Claude Desktop, Claude CLI, Warp) and consolidates them into structured memory files for persistent context.

## ✨ Key Features

- **Multi-Platform Support** - Augment, Claude Desktop, Claude CLI, Warp, Copilot, ChatGPT
- **Platform Selection** - Choose which LLM platforms to monitor
- **Automatic Capture** - Background watchers monitor for new conversations
- **Smart Consolidation** - Extracts decisions, actions, technical work, and context
- **Dual Format Storage** - AI-optimized (AICF) + Human-readable (Markdown)
- **Git Integration** - Automatic commits for version control
- **Type-Safe** - Pure TypeScript with 100% type coverage

## 🚀 Quick Start

### Installation

```bash
npm install create-ai-chat-context-experimental@latest
# or
pnpm add create-ai-chat-context-experimental@latest
```

### Initialize

```bash
# Manual mode (for Augment)
npx aice init --manual

# Automatic mode (for Claude Desktop/CLI)
npx aice init --automatic
```

### Use It

```bash
# Manual: Process checkpoint
npx aice checkpoint <file>

# Automatic: Start watcher (all enabled platforms)
npx aice watch

# Watch specific platforms
npx aice watch --augment
npx aice watch --augment --warp --claude-desktop

# Watch in daemon mode (background)
npx aice watch --daemon

# Watch in foreground with minimal feedback (default)
npx aice watch --foreground

# View knowledge base statistics
npx aice stats

# Check token usage (top 4 models)
npx aice tokens

# Check token usage (all 16 models)
npx aice tokens --all
```

## 📚 Documentation

### Essential Reading (Start Here)

- **[PRIVACY.md](PRIVACY.md)** - Privacy policy & data handling ⭐ **READ THIS FIRST**
- **[SECURITY.md](SECURITY.md)** - Security architecture & audit logging
- **[CLI-COMMANDS.md](CLI-COMMANDS.md)** - Complete command reference

### Additional Documentation

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
- `work-state.aicf` - Recent sessions & active tasks
- `design-system.aicf` - UI/UX rules & design decisions

### `.ai/` Directory (Human-Readable)

Markdown prose for human readability:

- `project-overview.md` - High-level description
- `conversation-log.md` - Detailed conversation history
- `technical-decisions.md` - Technical decisions
- `next-steps.md` - Planned work & priorities
- `design-system.md` - UI/UX design rules & patterns
- `npm-publishing-checklist.md` - Pre-publication validation checklist
- `known-issues.md` - Current bugs & limitations

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

**For complete command reference, see [CLI-COMMANDS.md](CLI-COMMANDS.md)**

### Quick Reference

```bash
# Initialize project (interactive setup)
aice init

# Automatic mode (reads LLM data automatically)
aice init --automatic

# Manual mode (you ask LLM to update memory files)
aice init --manual

# Watch for new conversations (checks every 5 minutes)
aice watch

# Watch specific platforms
aice watch --augment --claude-desktop

# Manage permissions
aice permissions list
aice permissions revoke <platform>
aice permissions grant <platform>

# Process checkpoint file
aice checkpoint <file>

# Import Claude exports
aice import-claude <file>

# View statistics
aice stats

# Check token usage
aice tokens
```

**[See full CLI documentation →](CLI-COMMANDS.md)**

## 🎯 Platform Selection

Choose which LLM platforms to monitor based on what you use:

| Platform           | Flag               | Use Case                 |
| ------------------ | ------------------ | ------------------------ |
| **Augment**        | `--augment`        | Augment VSCode extension |
| **Warp**           | `--warp`           | Warp terminal AI         |
| **Claude Desktop** | `--claude-desktop` | Claude desktop app       |
| **Claude CLI**     | `--claude-cli`     | Claude command-line tool |
| **Copilot**        | `--copilot`        | GitHub Copilot           |
| **ChatGPT**        | `--chatgpt`        | ChatGPT web interface    |

**Default behavior:** If no flags specified, uses platforms enabled in `.watcher-config.json` (defaults to Augment).

**Example:** If you use Augment and Claude Desktop:

```bash
npx aice watch --augment --claude-desktop
```

## 📖 Learn More

Start with **[USER-JOURNEY-COMPLETE.md](docs/USER-JOURNEY-COMPLETE.md)** for a complete overview of how the system works.

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🙏 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

**Ready to consolidate your AI conversations?** 🚀

Start with: `npx aic init`
