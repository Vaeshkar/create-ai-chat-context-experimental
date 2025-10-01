# System Architecture

**Last Updated:** 2025-10-01
**Status:** Production

---

## Overview

**Project Name:** create-ai-chat-context
**Purpose:** Preserve AI chat context and history across sessions
**Target Users:** Developers using AI coding assistants (ChatGPT, Claude, Copilot, Cursor, Augment, etc.)

---

## Tech Stack

### CLI Tool

- **Language:** JavaScript (Node.js)
- **CLI Framework:** Commander.js
- **File System:** fs-extra
- **Terminal Output:** chalk (colors), ora (spinners)
- **Package Manager:** npm

### Infrastructure

- **Distribution:** npm registry
- **Version Control:** Git/GitHub
- **CI/CD:** Manual releases (npm publish)

---

## System Components

### Core Commands (`bin/cli.js`)

**Purpose:** Entry point for all CLI commands
**Technology:** Commander.js
**Key Features:**

- Command routing and parsing
- Option handling
- Error handling
- Help text generation

### Configuration System (`src/config.js`)

**Purpose:** Manage user preferences per-project
**Technology:** JSON file storage (`.ai/config.json`)
**Key Features:**

- Load/save configuration
- Get/set specific values
- List all configuration
- Default values fallback

**Configuration Options:**

- `preferredModel` - User's preferred AI model
- `showAllModels` - Whether to always show all 16 models

### Token Analysis (`src/tokens.js`)

**Purpose:** Calculate and display token usage across AI models
**Technology:** Word counting + token estimation
**Key Features:**

- File scanning and word counting
- Token estimation (1 token ≈ 0.75 words)
- Context window percentage calculation
- Model comparison (16 AI models)
- Preferred model highlighting (⭐)
- Simplified display (4 models default, `--all` for 16)

**Supported Models:**

- OpenAI: GPT-5, GPT-5 mini, GPT-5 nano, GPT-4o, GPT-4 Turbo, o1-preview, o1-mini
- Anthropic: Claude Sonnet 4.5, Claude Opus 4.1, Claude Sonnet 4, Claude Opus 4, Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- Google: Gemini 1.5 Pro, Gemini 1.5 Flash

### Statistics (`src/stats.js`)

**Purpose:** Analyze knowledge base and provide insights
**Technology:** File system analysis + regex parsing
**Key Features:**

- File counting and size analysis
- Line/word/token counting
- Conversation entry counting (flexible regex)
- Last updated tracking
- Actionable insights

### Knowledge Base Templates (`templates/`)

**Purpose:** Project-specific templates for different tech stacks
**Technology:** Markdown files
**Key Features:**

- Default template (generic)
- Next.js template
- Python template
- Rust template
- Auto-detection based on project files

### Other Commands

- **init** (`src/init.js`) - Initialize knowledge base
- **log** (`src/log.js`) - Add conversation entries
- **search** (`src/search.js`) - Search knowledge base
- **validate** (`src/validate.js`) - Quality checks
- **archive** (`src/archive.js`) - Archive old conversations
- **export** (`src/export.js`) - Export in various formats
- **cursor/copilot/claude-project** - AI tool integrations

---

## Data Flow

### Configuration Flow

1. User runs `npx aic config set preferredModel "Claude Sonnet 4.5"`
2. CLI parses command and arguments
3. `handleConfigCommand()` in `src/config.js` is called
4. `loadConfig()` reads `.ai/config.json` (or creates with defaults)
5. `setConfigValue()` updates the configuration object
6. `saveConfig()` writes back to `.ai/config.json`
7. Success message displayed to user

### Token Report Flow

1. User runs `npx aic tokens` or `npx aic tokens --all`
2. CLI parses command and options
3. `displayTokenUsage()` in `src/tokens.js` is called
4. Load configuration to get preferred model
5. Scan `.ai/` directory for all files
6. Count words in each file
7. Calculate tokens (words × 1.33)
8. Calculate percentage for each AI model
9. Determine which models to show (4 or 16)
10. Mark preferred model with ⭐
11. Display formatted report with progress bars

### Stats Flow

1. User runs `npx aic stats`
2. `displayStats()` in `src/stats.js` is called
3. Scan `.ai/` directory for files
4. Count lines, words, tokens
5. Parse conversation log with regex: `/^##.*Chat\s*#?\d+/gim`
6. Find most active file
7. Calculate last updated time
8. Generate insights based on token usage and entry count
9. Display formatted statistics

---

## File Structure

```
create-ai-chat-context/
├── bin/
│   └── cli.js                 # CLI entry point
├── src/
│   ├── config.js              # Configuration management (NEW in v0.7.0)
│   ├── tokens.js              # Token analysis
│   ├── stats.js               # Statistics
│   ├── init.js                # Initialization
│   ├── log.js                 # Conversation logging
│   ├── search.js              # Search functionality
│   ├── validate.js            # Validation
│   ├── archive.js             # Archiving
│   └── export.js              # Export functionality
├── templates/
│   ├── default/               # Generic template
│   ├── nextjs/                # Next.js template
│   ├── python/                # Python template
│   └── rust/                  # Rust template
├── .ai/                       # This project's knowledge base
│   ├── README.md
│   ├── architecture.md        # This file
│   ├── conversation-log.md    # Chat history
│   ├── technical-decisions.md # Decision log
│   ├── known-issues.md        # Issues tracker
│   └── next-steps.md          # Roadmap
├── COMMANDS.md                # Command reference (NEW in v0.8.0)
├── CONFIGURATION.md           # Config guide (NEW in v0.8.0)
├── README.md                  # Main documentation
├── CHANGELOG.md               # Version history
└── package.json               # npm package config
```

---

## Performance

- **Response Time:** <100ms for most commands (local file operations)
- **Token Calculation:** <500ms for typical knowledge base (~10 files)
- **File Scanning:** Recursive directory traversal with fs-extra
- **Memory:** Minimal (loads files one at a time)

---

## Security

- **No Network Calls:** All operations are local file system only
- **No Data Collection:** No telemetry or analytics
- **File Permissions:** Respects system file permissions
- **Git Integration:** Optional, user-controlled

---

## Key Design Principles

1. **Local-First:** All data stays on user's machine
2. **No Lock-In:** Plain markdown files, no proprietary formats
3. **Git-Friendly:** All files are text-based and version-controllable
4. **AI-Agnostic:** Works with any AI assistant
5. **Per-Project:** Configuration and context are project-specific
6. **Progressive Enhancement:** Basic features work immediately, advanced features optional

---

**Maintained By:** Dennis H. A. van Leeuwen (@Vaeshkar)
