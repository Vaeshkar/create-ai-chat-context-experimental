# Design System - create-ai-chat-context

**Last Updated:** 2025-10-03
**Status:** ✅ Current
**Project:** create-ai-chat-context NPM package

---

## Overview

This design system defines the structure, patterns, and conventions for the create-ai-chat-context project. This is a **CLI tool and NPM package**, not a UI application, so the "design system" focuses on:

- File structure and organization
- Documentation patterns
- CLI interface design
- API design patterns

---

## Project Structure

### Directory Organization

```
create-ai-chat-context/
├── .ai/                    # Human-readable documentation
│   ├── README.md          # Instructions for humans
│   ├── architecture.md    # System design
│   ├── conversation-log.md # Chat history
│   ├── technical-decisions.md # Decision log
│   ├── known-issues.md    # Problems and solutions
│   ├── next-steps.md      # Roadmap
│   ├── design-system.md   # This file
│   └── code-style.md      # Coding standards
├── .lill/                  # AETHER memory system
│   ├── README.md          # Instructions for AI
│   ├── raw/               # Raw conversation JSON files
│   ├── snapshots/         # QuadIndex snapshots
│   ├── storage/           # LevelDB storage
│   └── logs/              # Watcher logs
├── src/                    # Source code (if applicable)
├── scripts/                # Utility scripts
├── templates/              # File templates for init command
├── package.json           # NPM package configuration
└── README.md              # Public documentation
```

---

## File Naming Conventions

### Documentation Files

**Format:** kebab-case with `.md` extension
**Examples:**

- `architecture.md`
- `conversation-log.md`
- `technical-decisions.md`
- `known-issues.md`

### Memory Files

**Format:** JSON files in `.lill/raw/` directory
**Examples:**

- `.lill/raw/2025-11-08T10-00-00_conversation-123.json`
- `.lill/snapshots/rolling.json`
- `.lill/snapshots/daily-2025-11-08.json`

### Source Code Files

**Format:** kebab-case for utilities, PascalCase for classes
**Examples:**

- `checkpoint-agent-sdk.js`
- `checkpoint-agent-openai.js`
- `test-run-agent.js`

---

## Documentation Patterns

### Markdown Structure

All `.ai/` markdown files should follow this structure:

```markdown
# Title

**Last Updated:** [Date]
**Status:** ✅ Current / ⚠️ Outdated / 🚧 In Progress

---

## Section 1

Content...

## Section 2

Content...

---

**Footer notes if needed**
```

### Memory Structure

All memory is stored in `.lill/` directory using QuadIndex (4-store RAG system):

```
.lill/
├── raw/                    # Raw JSON conversation files
│   └── 2025-11-08T10-00-00_conversation-123.json
├── snapshots/              # QuadIndex snapshots
│   ├── rolling.json        # Latest snapshot (updated every 5 mins)
│   ├── daily-2025-11-08.json
│   └── weekly-2025-W45.json
├── storage/                # LevelDB storage (internal)
└── logs/                   # Watcher logs

QuadIndex 4-Store System:
- VectorStore: Semantic search using embeddings
- MetadataStore: Exact filters (status, confidence, dates)
- GraphStore: Relationships (enables, depends_on, conflicts_with)
- ReasoningStore: Alternatives, hypotheticals, rejected patterns
```

---

## CLI Interface Design

### Command Structure

```bash
npx create-ai-chat-context <command> [options]
```

### Commands

- `init` - Initialize .ai/ and .lill/ folders in current project
- `start` - Start watcher daemon (captures conversations automatically)
- `stop` - Stop watcher daemon
- `quad-query` - Query QuadIndex for principles and insights
- `help` - Show help information

### Output Patterns

**Success messages:**

```
✅ Success message
```

**Error messages:**

```
❌ Error message
```

**Info messages:**

```
ℹ️  Info message
```

**Progress indicators:**

```
🔄 Processing...
```

---

## API Design Patterns

### Function Naming

**Format:** camelCase for functions, PascalCase for classes
**Examples:**

- `processCheckpoint()`
- `validateFormat()`
- `extractKeyTerms()`
- `class AnalysisAgent`

### Module Exports

**CommonJS format:**

```javascript
module.exports = {
  processCheckpoint,
  validateFormat,
};
```

**ES6 format (if used):**

```javascript
export { processCheckpoint, validateFormat };
```

---

## Template System

### Template Files

Located in `templates/` directory:

```
templates/
├── ai/
│   ├── README.md
│   ├── architecture.md
│   ├── conversation-log.md
│   ├── technical-decisions.md
│   ├── known-issues.md
│   └── next-steps.md
└── .lill/
    ├── raw/                    # Raw JSON conversation files
    ├── snapshots/              # QuadIndex snapshots
    ├── storage/                # LevelDB storage
    └── logs/                   # Watcher logs
```

### Template Variables

Templates can include placeholders:

- `{{PROJECT_NAME}}` - Project name
- `{{DATE}}` - Current date
- `{{USER_NAME}}` - User name (if available)

---

## Documentation Standards

### README Files

Every directory with documentation should have a README that:

1. Explains the purpose of the directory
2. Lists files and their purposes
3. Provides usage instructions
4. Links to related documentation

### Status Indicators

Use emoji status indicators consistently:

- ✅ Current/Complete
- ⚠️ Outdated/Warning
- 🚧 In Progress
- ❌ Failed/Error
- 📝 Note/Important
- 🔄 Processing/Updating

---

## Version Control

### Git Ignore Patterns

**DO commit:**

- `.ai/` folder (human documentation)
- `.lill/snapshots/` folder (QuadIndex snapshots for sharing principles)
- Template files
- Source code

**DO NOT commit:**

- `.lill/raw/` (raw conversation JSON files - too large)
- `.lill/storage/` (LevelDB internal storage)
- `.lill/logs/` (watcher logs)
- `node_modules/`
- `.env` files
- Test output files
- Temporary files

### Commit Message Format

Follow conventional commits:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance

---

## Package Distribution

### NPM Package Structure

```json
{
  "name": "create-ai-chat-context",
  "version": "x.x.x",
  "description": "Initialize AI memory system for projects",
  "main": "index.js",
  "bin": {
    "create-ai-chat-context": "./cli.js"
  },
  "files": ["templates/", "src/", "README.md"]
}
```

### Installation Methods

**Via NPX (recommended):**

```bash
npx create-ai-chat-context init
```

**Via NPM:**

```bash
npm install -g create-ai-chat-context
create-ai-chat-context init
```

---

## Key Principles

### 1. Dual Documentation System

- **`.ai/` folder** = Human-readable markdown for developers
- **`.lill/` folder** = AI memory system with QuadIndex (4-store RAG)

### 2. Automatic Over Manual

- Watcher captures conversations automatically
- QuadIndex indexes principles in real-time
- Snapshots saved every 5 minutes
- No manual updates needed

### 3. Simplicity First

- Keep CLI simple and intuitive
- Minimal configuration required
- Sensible defaults

### 4. Zero Dependencies (where possible)

- Avoid heavy dependencies for core functionality
- Use Node.js built-ins when possible
- Keep package size small

---

## Design Philosophy

### For Humans

- Clear, readable markdown documentation
- Familiar file structure (`.ai/` folder)
- Easy to edit and maintain
- Version controlled

### For AI

- QuadIndex 4-store RAG system (`.lill/snapshots/`)
- Semantic search with VectorStore
- Fast retrieval with MetadataStore
- Relationship traversal with GraphStore
- Deep reasoning with ReasoningStore

### For Developers

- Simple CLI interface
- Minimal setup required
- Works with any project type
- Language/framework agnostic

---

## Future Considerations

### Potential Features

- Interactive CLI prompts for setup
- Automatic git integration
- Template customization
- Multi-language support
- Integration with popular IDEs

### Scalability

- Keep package size under 1MB
- Support projects of any size
- Handle large conversation histories
- Efficient file I/O

---

**This is a living document** - Update as the project evolves.
