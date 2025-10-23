# 🧠 Create AI Chat Context - Memory Consolidation System

**Automatic memory consolidation for AI conversations across multiple platforms.**

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
npm install create-ai-chat-context
# or
pnpm add create-ai-chat-context
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

### Initialize

```bash
# Manual mode (for Augment)
npx aice init --manual

# Automatic mode (for Claude Desktop/CLI)
npx aice init --automatic

# Force overwrite existing setup
npx aice init --automatic --force
```

### Process Conversations

```bash
# Process a checkpoint file
npx aice checkpoint <file>

# Import Claude exports
npx aice import-claude <file>
```

### Watch for New Conversations

```bash
# Watch all enabled platforms (default, checks every 5 minutes)
npx aice watch

# Watch specific platforms
npx aice watch --augment
npx aice watch --warp
npx aice watch --claude-desktop
npx aice watch --claude-cli
npx aice watch --copilot
npx aice watch --chatgpt

# Watch multiple platforms
npx aice watch --augment --warp --claude-desktop

# Custom check interval (in milliseconds)
npx aice watch --interval 60000  # Check every 60 seconds
npx aice watch --interval 300000 # Check every 5 minutes (default)

# Verbose output
npx aice watch --augment --verbose

# Run in background (daemon mode)
npx aice watch --daemon

# Run in foreground with minimal feedback (default)
npx aice watch --foreground
```

### Migrate Existing Projects

```bash
# Upgrade from v2.0.1 to experimental
npx aice migrate
```

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
