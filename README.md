# 🧠 Create AI Chat Context - Memory Consolidation System

**Automatic memory consolidation for AI conversations from Augment (more platforms coming soon).**

## 🔐 Privacy First

**This tool reads your private LLM conversations locally on your machine. It does NOT send data anywhere. It does NOT upload to cloud. It does NOT share with third parties.**

- ✅ All processing happens on your computer
- ✅ You explicitly grant permission for each platform
- ✅ You can revoke access anytime
- ✅ You can delete all data anytime
- ✅ Complete audit trail of all access

**[Read our Privacy Policy →](PRIVACY.md) | [Read our Security Policy →](SECURITY.md)**

## 🎯 What Is This?

A system that automatically captures AI conversations from Augment and consolidates them into structured memory files for persistent context.

## ✨ Key Features

- **Augment Support** - Automatic capture from Augment VSCode extension (other platforms in development)
- **Universal AI Rules** - `.ai/rules/` work across all LLM platforms (Augment, Claude, Cursor, Warp, Copilot, ChatGPT)
- **Automatic Capture** - Background watcher monitors for new conversations
- **Smart Consolidation** - Extracts decisions, actions, technical work, and context
- **AICF Format** - AI-optimized pipe-delimited format powered by [aicf-core v2.1.0](https://www.npmjs.com/package/aicf-core)
- **Proper Escaping** - Handles multi-line content and special characters correctly
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
# Initialize with automatic capture (Augment)
npx aice init --automatic

# Initialize with manual mode (you update memory files manually)
npx aice init --manual
```

### Use It

```bash
# Start automatic watcher (Augment)
npx aice watch

# Watch in daemon mode (background)
npx aice watch --daemon

# Watch in foreground with minimal feedback (default)
npx aice watch --foreground

# Stop the background watcher daemon
npx aice stop

# Check watcher daemon status
npx aice status

# Manage platform permissions
npx aice permissions list
npx aice permissions grant augment
npx aice permissions revoke augment

# Import Claude conversation exports (manual fallback)
npx aice import-claude conversation.json

# Migrate from v2.0.1 to v3.x
npx aice migrate
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

```text
Input Sources (Augment)
         ↓
    Watchers/Triggers
         ↓
    Parser (Extract conversations)
         ↓
    Consolidation Agents (Cache → Sessions → Memory Dropoff)
         ↓
    Writer (Update memory files)
         ↓
    Memory Storage (.aicf/)
         ↓
    Git Commit (Track changes)
         ↓
    AI Assistants & Humans (Use memory)
```

## 💾 Memory Files

### `.aicf/` Directory (AI-Optimized)

Pipe-delimited structured data, optimized for AI parsing using [aicf-core v2.1.0](https://www.npmjs.com/package/aicf-core):

**Format Features:**

- Proper escaping of newlines (`\n` → `\\n`) and pipes (`|` → `\\|`)
- Structured sections: userIntents, aiActions, technicalWork, decisions, flow, workingState
- Single source of truth for AICF format (maintained in aicf-core package)

**Cache Layer:**

- `cache/augment/*.aicf` - Raw conversation chunks from Augment

**Recent Layer:**

- `recent/*.aicf` - Consolidated conversations (last 2 days)

**Session Layer:**

- `sessions/*.aicf` - Daily session files (0-2 days old)
- `medium/*.aicf` - Summarized sessions (2-7 days old)
- `old/*.aicf` - Key points only (7-14 days old)
- `archive/*.aicf` - Single line per conversation (14+ days old)

### `.ai/` Directory (Universal AI Rules)

Markdown rules that work across all LLM platforms:

- `README.md` - Universal AI context instructions
- `rules/always-load-context.md` - Context loading instructions
- `rules/cleanup-after-completion.md` - Cleanup rules
- `rules/protected-ai-files.md` - File protection rules
- `code-style.md` - Code style guidelines
- `design-system.md` - UI/UX design rules & patterns
- `npm-publishing-checklist.md` - Pre-publication validation checklist

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

### Current Version: v3.2.0

- ✅ Pure TypeScript codebase (0 .js files in src/)
- ✅ Build passing (0 TypeScript errors, 0 ESLint errors)
- ✅ 624 tests passing (25 skipped)
- ✅ Universal AI rules (`.ai/rules/`)
- ✅ Full consolidation pipeline (Cache → Sessions → Memory Dropoff)
- ✅ Augment support (automatic capture)

### Platforms In Development

- ❌ **Claude Desktop** - Not possible (conversations stored in cloud, local access blocked by Cloudflare)
- 🚧 **Claude CLI** - Parser implemented, needs watcher integration
- ✅ **Claude Manual Import** - `aice import-claude <file>` works for exported conversations from Claude Web
- 🚧 **Warp** - Planned (SQLite-based storage)
- 🚧 **Copilot** - Planned
- ❌ **ChatGPT Desktop** - Not possible (Keychain encrypted storage + API protection)

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

# Watch in daemon mode (background)
aice watch --daemon

# Stop the background watcher daemon
aice stop

# Check watcher daemon status
aice status

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

## 🎯 Platform Support

### Currently Supported

| Platform    | Status | Flag        | Use Case                 |
| ----------- | ------ | ----------- | ------------------------ |
| **Augment** | ✅     | `--augment` | Augment VSCode extension |

### In Development

| Platform          | Status | Flag           | Use Case                                                   |
| ----------------- | ------ | -------------- | ---------------------------------------------------------- |
| **Claude CLI**    | 🚧     | `--claude-cli` | Claude command-line tool (parser ready, needs integration) |
| **Claude Import** | ✅     | N/A            | Manual import via `aice import-claude` (works now)         |
| **Warp**          | 🚧     | `--warp`       | Warp terminal AI (planned)                                 |
| **Copilot**       | 🚧     | `--copilot`    | GitHub Copilot (planned)                                   |

### Not Possible

| Platform            | Reason                                                            |
| ------------------- | ----------------------------------------------------------------- |
| **Claude Desktop**  | Conversations stored in cloud, local access blocked by Cloudflare |
| **ChatGPT Desktop** | Keychain encrypted storage + API protection                       |

**Default behavior:** Currently only Augment is supported. Other platforms are in active development.

**Example:** Start watching Augment conversations:

```bash
npx aice watch
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
