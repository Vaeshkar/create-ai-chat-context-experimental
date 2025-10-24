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
├── .aicf/                  # AI-optimized memory
│   ├── README.md          # Instructions for AI
│   ├── conversation-memory.aicf # Recent conversations
│   ├── technical-context.aicf # Architecture and decisions
│   └── work-state.aicf    # Current work status
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

### AICF Files

**Format:** kebab-case with `.aicf` extension  
**Examples:**
- `conversation-memory.aicf`
- `technical-context.aicf`
- `work-state.aicf`

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

### AICF Structure

All `.aicf/` files must follow the 6-section format:

```
@CONVERSATION:identifier
timestamp_start=ISO8601
timestamp_end=ISO8601
messages=count
tokens=count

@FLOW
event1|event2|event3

@DETAILS:tag
key=value|key=value

@INSIGHTS
insight|explanation|PRIORITY

@DECISIONS
decision|reasoning|IMPACT:LEVEL

@STATE
working_on=[description]
current_phase=[phase]
next_action=[action]
blockers=[blockers or none]
progress=[percentage]
timeline=[timeline]
```

---

## CLI Interface Design

### Command Structure

```bash
npx create-ai-chat-context <command> [options]
```

### Commands

- `init` - Initialize .ai/ and .aicf/ folders in current project
- `update` - Update AI memory files
- `validate` - Validate AICF format
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
└── aicf/
    ├── README.md
    ├── conversation-memory.aicf
    ├── technical-context.aicf
    └── work-state.aicf
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
- `.aicf/` folder (AI memory)
- Template files
- Source code

**DO NOT commit:**
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
  "files": [
    "templates/",
    "src/",
    "README.md"
  ]
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
- **`.aicf/` folder** = AI-optimized structured format for AI assistants

### 2. Manual Over Automated

- AI writes `.aicf/` files at session end (manual)
- No automated compression agents
- Human reviews before committing

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

- Structured, parseable format (`.aicf/` files)
- Token-efficient representation
- Fast to read and parse
- Preserves all important information

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

