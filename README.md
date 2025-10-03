# create-ai-chat-context

![npm version](https://img.shields.io/npm/v/create-ai-chat-context)
![GitHub tag](https://img.shields.io/github/v/tag/Vaeshkar/create-ai-chat-context)
![Downloads](https://img.shields.io/npm/dm/create-ai-chat-context.svg)

> **Simple AI Memory System - Never lose context between AI chat sessions**

Create a `.ai/` knowledge base that AI assistants read at the start of each chat. No more re-explaining your project every time.

---

## 🚨 FOR AI ASSISTANTS: READ THIS FIRST 🚨

**CRITICAL: Before working on this project, read the `.ai/` knowledge base:**

1. **`.ai/project-overview.md`** - Project context and conventions
2. **`.ai/conversation-log.md`** - Key decisions from previous chats
3. **`.ai/technical-decisions.md`** - Why we chose X over Y

**Why?** This preserves institutional knowledge so you have full context immediately.

**See `.ai-instructions` file for detailed instructions.**

---

## The Problem

When working with AI coding assistants (ChatGPT, Claude, Copilot, Cursor, Augment, etc.), every new chat session loses all context. You have to re-explain your project architecture, technical decisions, why you chose X over Y, what you accomplished in previous sessions, and known issues. This wastes significant time in every chat session.

Unlike other AI context tools that focus on project planning and rules, `create-ai-chat-context` focuses on preserving conversation history and technical decisions across sessions. It works with ALL AI assistants and maintains institutional knowledge through files like `conversation-log.md`, `technical-decisions.md`, and `known-issues.md`.

## The Solution

`create-ai-chat-context` creates a `.ai/` knowledge base in your project that AI assistants read at the start of each chat. Result: AI gets full context immediately. No more re-explaining.

### � What Gets Created

The tool creates **7 essential documentation files** in your project:

| File                       | Purpose                           |
| -------------------------- | --------------------------------- |
| **conversation-log.md**    | Chat history and key decisions    |
| **technical-decisions.md** | Why you chose X over Y            |
| **next-steps.md**          | Current priorities and tasks      |
| **project-overview.md**    | Project context for AI assistants |
| **design-system.md**       | Design patterns and conventions   |
| **code-style.md**          | Coding standards and guidelines   |
| **README.md**              | Overview of the knowledge base    |

**Simple, focused, and effective.** No complex formats or token optimization needed.

## What's New

- **v1.0.0** - 🎯 Simplified to 7 essential files! Removed complex .aicf/ format. Focus on what works.
- **v0.14.0** - Direct .aicf/ reading - ZERO manual steps! AI reads files directly, no copy/paste!
- **v0.13.0** - AICF 2.0 - Universal AI Memory Protocol! 88% token reduction!
- **v0.12.0** - AI-Native Format (AICF) - 85% token reduction! Keep 6x more history in context!

See [CHANGELOG.md](./CHANGELOG.md) for complete version history.

## Quick Start

```bash
# Initialize (auto-detects Next.js, Python, or Rust)
npx aic init

# Customize for your project
vim .ai/project-overview.md
vim .ai/technical-decisions.md

# Commit to Git
git add .ai/ .ai-instructions NEW_CHAT_PROMPT.md
git commit -m "Add AI knowledge base"

# In your next AI chat, start with:
"Read .ai-instructions first, then help me with [your task]"
```

**💡 Tip:** Use `npx aic` instead of `npx create-ai-chat-context` for shorter commands!

## Key Commands

```bash
npx aic init                    # Initialize knowledge base (7 files)
npx aic migrate                 # Upgrade existing projects to v1.0.0
npx aic search "query"          # Find information in knowledge base
npx aic stats                   # View analytics and token usage
npx aic validate                # Check knowledge base quality
npx aic config                  # Manage configuration
```

**Manual workflow:** At the end of each AI session, ask the AI to update the `.ai/` files with what was accomplished.

## Configuration

Set your preferences to customize the tool for your workflow:

```bash
# View current configuration
npx aic config

# Set your preferred AI model (gets highlighted with ⭐ in token reports)
npx aic config set preferredModel "Claude Sonnet 4.5"
npx aic config set preferredModel "GPT-5"
npx aic config set preferredModel "Gemini 1.5 Pro"

# Always show all models in token reports (default: top 4)
npx aic config set showAllModels true

# Get a specific config value
npx aic config get preferredModel
```

**Available Models:**

- OpenAI: GPT-5, GPT-5 mini, GPT-5 nano, GPT-4o, GPT-4 Turbo, o1-preview, o1-mini
- Anthropic: Claude Sonnet 4.5, Claude Opus 4.1, Claude Sonnet 4, Claude Opus 4, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- Google: Gemini 1.5 Pro, Gemini 1.5 Flash

**Configuration is stored per-project** in `.ai/config.json`, so you can use different models for different projects.

## Full Documentation

### Core Documentation

- **[COMMANDS.md](COMMANDS.md)** - Complete command reference with examples
- **[CONFIGURATION.md](CONFIGURATION.md)** - Detailed configuration guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates

### After Running `init`

These files are created in your project:

- **`.ai/README.md`** - Overview of the knowledge base system
- **`.ai/project-overview.md`** - Project context and conventions (AI config)
- **`.ai/conversation-log.md`** - Chat history and decisions
- **`.ai/technical-decisions.md`** - Architecture and technical choices
- **`.ai/next-steps.md`** - Current priorities and tasks
- **`.ai/design-system.md`** - Design patterns and conventions
- **`.ai/code-style.md`** - Coding standards and guidelines
- **`.ai-instructions`** - Instructions for AI assistants
- **`NEW_CHAT_PROMPT.md`** - Quick reference for the one-liner prompt

## Links

- [GitHub](https://github.com/Vaeshkar/create-ai-chat-context)
- [npm](https://www.npmjs.com/package/create-ai-chat-context)
- [Issues](https://github.com/Vaeshkar/create-ai-chat-context/issues)
- [Full Documentation](https://github.com/Vaeshkar/create-ai-chat-context#readme)

## License

MIT

---

**Made with ❤️ for developers who use AI assistants daily**

Questions or issues? [Open an issue on GitHub](https://github.com/Vaeshkar/create-ai-chat-context/issues)
