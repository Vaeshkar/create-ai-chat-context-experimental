\*\*\*\*# create-ai-chat-context - Project Overview

**Last Updated:** 2025-10-03
**Version:** 11.0+
**Status:** ✅ Active Development

---

## Project Overview

**create-ai-chat-context** is an NPM package that initializes AI memory systems for software projects. It creates structured documentation folders (`.ai/` and `.aicf/`) that enable AI assistants to maintain context across chat sessions.

### Key Information

- **Package Name:** create-ai-chat-context
- **Type:** CLI tool + NPM package
- **Language:** JavaScript (Node.js)
- **License:** MIT
- **Repository:** GitHub

---

## Problem Statement

### The Challenge

AI assistants lose context between chat sessions, leading to:

- Repeated explanations of project architecture
- Loss of previous decisions and rationale
- Inconsistent coding patterns
- Wasted time re-establishing context

### The Solution

A dual-folder system that provides:

- **`.ai/` folder:** Human-readable markdown documentation
- **`.aicf/` folder:** AI-optimized structured memory format

---

## Core Concept

### Dual Documentation System

**For Humans (`.ai/` folder):**

- Markdown files for project documentation
- Easy to read and edit
- Version controlled
- Onboarding resource

**For AI (`.aicf/` folder):**

- Structured AICF format (AI Chat Context Format)
- Token-efficient representation
- Fast to parse
- 100% information preservation

---

## Architecture Overview

### Technology Stack

```
Runtime: Node.js
Language: JavaScript (CommonJS)
Package Manager: NPM
Distribution: NPX (npx create-ai-chat-context)
```

### Project Structure

```
create-ai-chat-context/
├── .ai/                    # Human documentation
│   ├── README.md          # Instructions
│   ├── architecture.md    # System design
│   ├── conversation-log.md # Chat history
│   ├── technical-decisions.md # Decisions
│   ├── known-issues.md    # Problems/solutions
│   ├── next-steps.md      # Roadmap
│   ├── design-system.md   # Design patterns
│   ├── code-style.md      # Coding standards
│   └── project-overview.md # This file
├── .aicf/                  # AI memory
│   ├── README.md          # AI instructions
│   ├── conversation-memory.aicf # Recent conversations
│   ├── technical-context.aicf # Architecture
│   └── work-state.aicf    # Current work
├── src/                    # Source code (archived)
│   ├── checkpoint-agent-sdk.js # Anthropic agent (abandoned)
│   └── checkpoint-agent-openai.js # OpenAI agent (abandoned)
├── templates/              # Init templates
├── package.json           # NPM config
└── README.md              # Public docs
```

---

## AICF Format Specification

### Structure

AICF (AI Chat Context Format) uses 6 mandatory sections:

```
@CONVERSATION:identifier
timestamp_start=ISO8601
timestamp_end=ISO8601
messages=count
tokens=count

@FLOW
event1|event2|event3|event4

@DETAILS:tag
key=value|key=value|key=value

@INSIGHTS
insight_with_context|explanation|CRITICAL/HIGH/MEDIUM

@DECISIONS
decision_with_reasoning|alternatives_considered|IMPACT:CRITICAL/HIGH/MEDIUM

@STATE
working_on=[current task]
current_phase=[phase]
next_action=[next steps]
blockers=[blockers or none]
progress=[percentage]
timeline=[timeline]
```

### Formatting Rules

1. **Section headers:** UPPERCASE with @ prefix
2. **Keys:** snake_case
3. **Values:** underscores instead of spaces
4. **Delimiters:** Pipe (|) for sequences
5. **Pairs:** key=value format
6. **Preserve:** ALL numbers, prices, percentages, names

---

## Workflow

### Installation

```bash
# Via NPX (recommended)
npx create-ai-chat-context init

# Via NPM
npm install -g create-ai-chat-context
create-ai-chat-context init
```

### Usage Pattern

**1. Project Start:**

```bash
cd my-project
npx create-ai-chat-context init
```

**2. During Development:**

- AI reads `.ai/` and `.aicf/` files at session start
- AI has full context of project history
- AI follows established patterns

**3. Session End:**

- AI updates `.aicf/` files with new information
- Developer reviews changes
- Commit to version control

**4. Next Session:**

- AI reads updated files
- Perfect memory restoration
- No context loss

---

## Key Features

### Manual AICF Writing

**Approach:** AI writes `.aicf/` files at session end (not automated compression)

**Benefits:**

- ✅ 100% preservation (AI controls what to save)
- ✅ Zero cost (no API calls)
- ✅ Instant (no processing time)
- ✅ Full control (human reviews before commit)

### Abandoned Approach: Automated Compression

**What we tried:**

- Multi-agent system with Analysis, Quality, and Format agents
- Automated compression of 20k token conversations
- Regex-based quality validation

**Why it failed:**

- Only 20-26% key term preservation (needed 60%+)
- AI couldn't determine what's important
- Cost $14.63/month with 2-minute processing
- Fundamental limitation: compression AI lacks context

**Decision:** Abandoned automated approach, adopted manual AICF writing

---

## File Descriptions

### `.ai/` Folder (Human Documentation)

**README.md**

- Instructions for AI assistants
- Reading order
- File purposes

**architecture.md**

- System design
- Tech stack
- Data flow
- Component relationships

**conversation-log.md**

- Chat session history
- Key decisions
- Progress tracking
- Most recent first

**technical-decisions.md**

- Why we chose X over Y
- Alternatives considered
- Rationale and tradeoffs

**known-issues.md**

- Current problems
- Workarounds
- Solutions
- Status tracking

**next-steps.md**

- Roadmap
- TODOs
- Priorities
- Future features

**design-system.md**

- File structure patterns
- Documentation standards
- CLI interface design
- API patterns

**code-style.md**

- Coding conventions
- Naming standards
- Error handling
- Testing patterns

**project-overview.md**

- This file
- High-level project description
- Architecture overview
- Workflow explanation

### `.aicf/` Folder (AI Memory)

**README.md**

- AICF format specification
- Workflow instructions
- Formatting rules
- Examples

**conversation-memory.aicf**

- Recent conversation state
- Decisions made
- Insights discovered
- Current context

**technical-context.aicf**

- Architecture details
- Technical decisions
- Design patterns
- Implementation details

**work-state.aicf**

- Current work status
- Next actions
- Blockers
- Progress tracking

---

## Development History

### Evolution

**v1.0 - Initial Concept**

- Created `.ai/` folder with markdown files
- Manual documentation approach

**v2.0 - AICF Format**

- Designed AI-optimized format
- Structured sections
- Token efficiency

**v3.0 - Automated Compression (Abandoned)**

- Multi-agent architecture
- Tested 6 AI models
- Failed at 20k token preservation
- Abandoned approach

**v11.0 - Manual AICF Writing (Current)**

- AI writes `.aicf/` at session end
- 100% preservation
- Zero cost
- Simple and effective

---

## Technical Decisions

### Key Choices

**1. Dual Folder System**

- **Decision:** Keep both `.ai/` and `.aicf/` folders
- **Reasoning:** Different audiences need different formats
- **Impact:** CRITICAL

**2. Manual AICF Writing**

- **Decision:** AI writes files at session end, not automated
- **Reasoning:** Automated compression failed (20-26% preservation)
- **Impact:** CRITICAL

**3. CommonJS Modules**

- **Decision:** Use CommonJS instead of ES modules
- **Reasoning:** Better Node.js compatibility
- **Impact:** MEDIUM

**4. NPX Distribution**

- **Decision:** Distribute via NPX, not global install
- **Reasoning:** No global pollution, always latest version
- **Impact:** HIGH

---

## Known Issues

### Current Limitations

1. **No automated updates:** AI must manually update files
2. **No validation tool:** No CLI command to validate AICF format yet
3. **No templates customization:** Templates are fixed
4. **No multi-language support:** English only

### Future Improvements

- Add `validate` command for AICF format checking
- Add `update` command for easier file updates
- Add template customization options
- Add multi-language support

---

## Usage Guidelines

### For Developers

**Setup:**

1. Run `npx create-ai-chat-context init` in project root
2. Review generated files
3. Customize for your project
4. Commit to version control

**Maintenance:**

1. Update `.ai/` files as project evolves
2. Let AI update `.aicf/` files at session end
3. Review AI changes before committing
4. Keep documentation current

### For AI Assistants

**Session Start:**

1. Read ALL files in `.ai/` and `.aicf/` folders
2. Understand project context
3. Follow established patterns

**During Session:**

1. Track important decisions
2. Note technical details
3. Remember insights

**Session End:**

1. Update `.aicf/` files with new information
2. Preserve ALL key details
3. Use proper AICF format
4. Tell user to review and commit

---

## Success Metrics

### Goals

- ✅ Zero context loss between sessions
- ✅ Faster AI onboarding (< 1 minute)
- ✅ Consistent coding patterns
- ✅ Reduced repeated explanations
- ✅ Better decision tracking

### Measurements

- Time to restore context: < 1 minute
- Information preservation: 100%
- Cost: $0 (no API calls)
- Developer satisfaction: High

---

## Contributing

### How to Contribute

1. Fork repository
2. Create feature branch
3. Follow code style guide
4. Add tests
5. Update documentation
6. Submit pull request

### Areas for Contribution

- CLI improvements
- Template enhancements
- Validation tools
- Documentation
- Examples

---

## License

MIT License - Free to use, modify, and distribute

---

**This project aims to solve AI context loss with a simple, effective, zero-cost solution.**
