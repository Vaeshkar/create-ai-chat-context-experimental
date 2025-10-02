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

## 🚀 AICF 2.0 Documentation

### Getting Started

- **[AICF Guide](./aicf/AICF-GUIDE.md)** - Complete guide to AICF 2.0
- **[Quick Start](./aicf/QUICKSTART-AICF.md)** - Get started in 3 commands
- **[AICF Specification](./aicf/AICF-SPEC.md)** - Technical specification

### Deep Dive

- **[Anthropic Alignment](./aicf/ANTHROPIC-ALIGNMENT.md)** - How AICF aligns with Anthropic's vision
- **[Benchmark Report](./aicf/AICF-BENCHMARK-REPORT.md)** - Real-world performance data
- **[Implementation Details](./aicf/AI-NATIVE-FORMAT-IMPLEMENTATION.md)** - How it was built
- **[AICF Demo](./aicf/AICF-DEMO.md)** - Example output
- **[Complete Overview](./aicf/AICF-2.0-COMPLETE.md)** - Full system overview
- **[Example Summary](./aicf/EXAMPLE-AI-OPTIMIZED-SUMMARY.md)** - AI-optimized format example

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
