# Documentation

Complete documentation for `create-ai-chat-context`.

---

## 📚 Main Documentation

- **[README.md](../README.md)** - Main project documentation
- **[COMMANDS.md](../COMMANDS.md)** - Complete command reference
- **[CONFIGURATION.md](../CONFIGURATION.md)** - Configuration guide
- **[CHANGELOG.md](../CHANGELOG.md)** - Version history
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guidelines
- **[ROADMAP.md](../ROADMAP.md)** - Future plans

---

## 🎯 v1.0.0 - Simplified Approach

**v1.0.0 focuses on simplicity and maintainability:**

- **7 essential files** in `.ai/` folder
- **Simple markdown format** - no complex optimization needed
- **Manual workflow** - ask AI to update files at session end
- **Works with all AI assistants** - no special format requirements

**Key files:**

- `conversation-log.md` - Chat history and decisions
- `technical-decisions.md` - Architecture choices
- `next-steps.md` - Current priorities
- `project-overview.md` - Project context for AI
- `design-system.md` - Design patterns
- `code-style.md` - Coding standards
- `README.md` - Knowledge base overview

---

## 📖 Guides

- **[Publishing Guide](./guides/PUBLISH_GUIDE.md)** - How to publish to npm
- **[New Chat Prompt](./guides/NEW_CHAT_PROMPT.md)** - Template for starting new AI chats

---

## 📦 Archive

Historical documents and notes:

- **[Bugfix v0.11.1](./archive/BUGFIX-v0.11.1.md)** - Bug fix notes
- **[Summary](./archive/SUMMARY.md)** - Project summary
- **[Wake Up README](./archive/WAKE-UP-README.md)** - Development notes

---

## 🎨 Diagrams

Visual representations of the system:

### Core Concepts

- **[AI Knowledge Persistence](./01_ai-knowledge-persistence.png)** - How context is preserved
- **[Knowledge Loss vs Persistence](./02_knowledge-loss-vs-persistence.png)** - Problem vs solution
- **[AI Knowledge Base Structure](./03_ai-knowledge-base-structure.png)** - Directory structure

### AICF 2.0

- **[AICF Workflow](./04_aicf-workflow.png)** - How AICF 2.0 enables persistent memory
- **[Token Efficiency](./05_token-efficiency.png)** - Markdown vs YAML vs AICF comparison
- **[Anthropic Alignment](./06_anthropic-alignment.png)** - How AICF aligns with Anthropic's vision

### Generate Diagrams

```bash
# Generate PNGs from Mermaid files
for file in *.mmd; do mmdc -i "$file" -o "${file%.mmd}.png" -w 1920 -H 1080 -s 3; done
```

---

## 🔗 External Links

- **[GitHub Repository](https://github.com/Vaeshkar/create-ai-chat-context)**
- **[npm Package](https://www.npmjs.com/package/create-ai-chat-context)**
- **[Issue Tracker](https://github.com/Vaeshkar/create-ai-chat-context/issues)**

---

## 📝 Quick Links

### For Users

- [Getting Started](../README.md#quick-start)
- [AICF 2.0 Guide](./aicf/AICF-GUIDE.md)
- [Command Reference](../COMMANDS.md)
- [Configuration](../CONFIGURATION.md)

### For Contributors

- [Contributing Guidelines](../CONTRIBUTING.md)
- [Roadmap](../ROADMAP.md)
- [Changelog](../CHANGELOG.md)

### For Developers

- [AICF Specification](./aicf/AICF-SPEC.md)
- [Implementation Details](./aicf/AI-NATIVE-FORMAT-IMPLEMENTATION.md)
- [Benchmark Report](./aicf/AICF-BENCHMARK-REPORT.md)

---

**Questions?** [Open an issue on GitHub](https://github.com/Vaeshkar/create-ai-chat-context/issues)
