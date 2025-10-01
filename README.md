# create-ai-chat-context

---

## 🚨 FOR AI ASSISTANTS: READ THIS FIRST 🚨

**CRITICAL: Before working on this project, read the `.ai/` knowledge base:**

1. **`.ai/architecture.md`** - Complete system architecture
2. **`.ai/conversation-log.md`** - Key decisions from previous chats
3. **`.ai/technical-decisions.md`** - Why we chose X over Y

**Why?** This preserves institutional knowledge so you have full context immediately.

**See `.ai-instructions` file for detailed instructions.**

---

![npm version](https://img.shields.io/npm/v/create-ai-chat-context)
![GitHub tag](https://img.shields.io/github/v/tag/Vaeshkar/create-ai-chat-context)

> Preserve AI chat context and history across sessions

## The Problem

When working with AI coding assistants (ChatGPT, Claude, Copilot, Cursor, Augment, etc.), every new chat session loses all context. You have to re-explain your project architecture, technical decisions, why you chose X over Y, what you accomplished in previous sessions, and known issues. This wastes significant time in every chat session.

Unlike other AI context tools that focus on project planning and rules, `create-ai-chat-context` focuses on preserving conversation history and technical decisions across sessions. It works with ALL AI assistants and maintains institutional knowledge through files like `conversation-log.md`, `technical-decisions.md`, and `known-issues.md`.

## The Solution

`create-ai-chat-context` creates a `.ai/` knowledge base in your project that AI assistants read at the start of each chat. Result: AI gets full context immediately. No more re-explaining.

## What's New

- **v0.6.3** - 🧠 Smarter insights (context-aware token recommendations)
- **v0.6.2** - ⚡ Added `aic` short alias (use `npx aic` instead of `npx create-ai-chat-context`)
- **v0.6.1** - 📖 Cleaned up README (76% shorter, easier to read)
- **v0.6.0** - 🎯 Auto-detection (Next.js, Python, Rust) + Git hooks for reminders
- **v0.5.0** - 🔍 Search, stats, export, and update commands
- **v0.4.0** - 🤖 GitHub Copilot & Claude Projects integration
- **v0.3.0** - 🎨 Project-specific templates (Next.js, Python)
- **v0.2.0** - 📝 Effortless logging, validation, Cursor integration

## Quick Start

```bash
# Initialize (auto-detects Next.js, Python, or Rust)
npx aic init

# Customize for your project
vim .ai/architecture.md
vim .ai/technical-decisions.md

# Commit to Git
git add .ai/ .ai-instructions
git commit -m "Add AI knowledge base"

# In your next AI chat, start with:
"Read .ai-instructions first, then help me with [your task]"
```

**💡 Tip:** Use `npx aic` instead of `npx create-ai-chat-context` for shorter commands!

## Key Commands

```bash
npx aic init                    # Initialize (auto-detects project type)
npx aic log                     # Add conversation entry
npx aic search "query"          # Find information
npx aic stats                   # View analytics
npx aic validate                # Check quality
npx aic export --format md      # Export knowledge base
npx aic update                  # Update templates
npx aic install-hooks           # Install Git hooks
npx aic cursor                  # Cursor AI integration
npx aic copilot                 # GitHub Copilot integration
npx aic claude-project          # Claude Projects export
npx aic archive --keep 10       # Archive old entries
npx aic tokens                  # Check token usage
```

Run `npx aic --help` for all commands.

## Full Documentation

After running `init`, see these files for complete documentation:

- **`.ai/README.md`** - Overview of the knowledge base system
- **`.ai/SETUP_GUIDE.md`** - Comprehensive setup and usage guide
- **`.ai/TOKEN_MANAGEMENT.md`** - Token usage and optimization tips
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
