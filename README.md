# create-ai-chat-context

> Preserve AI chat context and history across sessions

## The Problem

When working with AI coding assistants (ChatGPT, Claude, Copilot, Cursor, Augment, etc.), every new chat session loses all context.

You have to re-explain:

- Your project architecture
- Technical decisions you made
- Why you chose X over Y
- What you accomplished in previous sessions
- Known issues and solutions

This wastes significant time in every chat session.

## What Makes This Different

Unlike other AI context tools that focus on project planning and rules, `create-ai-chat-context` focuses on preserving conversation history and technical decisions:

| Feature       | This Package                                                       | Other Tools                             |
| ------------- | ------------------------------------------------------------------ | --------------------------------------- |
| **Focus**     | Chat history & knowledge preservation                              | Project planning & rules                |
| **Key Files** | `conversation-log.md`, `technical-decisions.md`, `known-issues.md` | Development plans, project rules        |
| **Use Case**  | Maintain context across AI chat sessions                           | Set up project structure and guidelines |
| **Universal** | Works with ALL AI assistants                                       | Varies by tool                          |

Perfect for developers who work with AI assistants daily and need to preserve context across multiple chat sessions.

## The Solution

`create-ai-chat-context` creates a `.ai/` knowledge base in your project that AI assistants read at the start of each chat.

Result: AI gets full context immediately. No more re-explaining.

## Quick Start

```bash
# Navigate to your project
cd your-project

# Initialize AI knowledge base
npx create-ai-chat-context init

# Customize the files for your project
vim .ai/architecture.md
vim .ai/technical-decisions.md

# Commit to Git
git add .ai/ .ai-instructions NEW_CHAT_PROMPT.md
git commit -m "feat: Add .ai/ knowledge base system"

# In your next AI chat, use this prompt:
"Read .ai-instructions first, then help me with [your task]."
```

That's it. AI now has full context.

## What It Creates

```
your-project/
├─ .ai/                          # Knowledge base directory
│  ├─ README.md                  # How to use the system
│  ├─ architecture.md            # System architecture
│  ├─ conversation-log.md        # Chat session history
│  ├─ technical-decisions.md     # Why you chose X over Y
│  ├─ known-issues.md            # Problems and solutions
│  ├─ next-steps.md              # Roadmap and priorities
│  └─ SETUP_GUIDE.md             # Installation guide
├─ .ai-instructions              # Entry point for AI
└─ NEW_CHAT_PROMPT.md            # Quick reference
```

## Works with ALL AI Assistants

This package is universally compatible with every AI coding assistant:

| AI Assistant             | Compatible | How to Use                                          |
| ------------------------ | ---------- | --------------------------------------------------- |
| **ChatGPT**              | Yes        | Paste or upload `.ai-instructions` and `.ai/` files |
| **Claude**               | Yes        | "Read .ai-instructions first, then help me..."      |
| **GitHub Copilot**       | Yes        | Automatically uses workspace context                |
| **Cursor**               | Yes        | Use `@.ai-instructions` and `@.ai/architecture.md`  |
| **Augment**              | Yes        | "Read .ai-instructions first, then help me..."      |
| **Codeium**              | Yes        | Automatically reads workspace files                 |
| **Tabnine**              | Yes        | Uses project documentation for context              |
| **Amazon CodeWhisperer** | Yes        | Reads project context automatically                 |
| **Replit AI**            | Yes        | Access files in workspace                           |
| **Sourcegraph Cody**     | Yes        | Reads codebase context                              |

### Why Universal

- Plain markdown files - Every AI can read them
- No proprietary format - Just text files
- Standard structure - Clear, organized documentation
- Explicit instructions - `.ai-instructions` tells AI what to read

### Usage Examples

**ChatGPT / Claude / Augment:**

```
Read .ai-instructions first, then help me add a new feature to the authentication system.
```

**Cursor:**

```
@.ai-instructions @.ai/architecture.md
Help me refactor the database layer.
```

**GitHub Copilot:**

Just start coding. Copilot automatically reads your `.ai/` files for context.

**Replit / Sourcegraph Cody:**

Reference files directly or let the AI discover them in your workspace.

## How It Works

### 1. Initialize the system

```bash
npx create-ai-chat-context init
```

### 2. Customize for your project

Edit the template files with your project details.

### 3. Use the one-liner in every new chat

```
Read .ai-instructions first, then help me with [your task].
```

### 4. AI reads the knowledge base

`.ai-instructions` → `.ai/` directory → Full context

### 5. Save time per chat

No more re-explaining architecture, decisions, or history.

## Benefits

### For You

- Save time per chat session
- No more re-explaining architecture
- Consistent context across sessions
- Better AI suggestions with full context

### For Your Team

- Faster onboarding for new members
- Shared understanding of decisions
- Historical record of why things were done
- Reduced knowledge silos

### For Your Project

- Better documentation
- Preserved institutional knowledge
- Easier to maintain and evolve
- Clear decision trail

## Usage

### Initialize in existing project

```bash
cd your-project
npx create-ai-chat-context init
```

### Force overwrite existing files

```bash
npx create-ai-chat-context init --force
```

### Skip Git integration

```bash
npx create-ai-chat-context init --no-git
```

### Show help

```bash
npx create-ai-chat-context --help
```

### Show version

```bash
npx create-ai-chat-context --version
```

## Documentation

After initialization, see these files for detailed information:

- `.ai/README.md` - Overview of the knowledge base system
- `.ai/SETUP_GUIDE.md` - Comprehensive setup and usage guide
- `NEW_CHAT_PROMPT.md` - Quick reference for the one-liner prompt

## Contributing

Contributions are welcome. This is an open-source project.

### How to contribute

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Ideas for contributions

- Additional templates (React, Python, Django, etc.)
- New CLI commands (validate, log, update)
- Improved documentation
- Bug fixes and improvements

## Maintenance

### After important work

- Update `.ai/conversation-log.md` with key decisions
- Add solved problems to `.ai/known-issues.md`
- Update `.ai/next-steps.md` if priorities changed

### Keep it current

- Review and clean up outdated information
- Ensure documentation matches reality
- Commit changes regularly

## Troubleshooting

### AI doesn't read files automatically

Use the explicit prompt: "Read .ai-instructions first"

### AI skips some files

Be more specific: "Read .ai-instructions and all files in .ai/ directory"

### AI has outdated information

Update the knowledge base files and commit changes

### Files already exist

Use `--force` flag to overwrite: `npx create-ai-chat-context init --force`

## Links

- GitHub: https://github.com/Vaeshkar/create-ai-chat-context
- npm: https://www.npmjs.com/package/create-ai-chat-context
- Issues: https://github.com/Vaeshkar/create-ai-chat-context/issues

## License

MIT License - See LICENSE file for details

## Author

Dennis van Leeuwen

- GitHub: [@Vaeshkar](https://github.com/Vaeshkar)

## Get Started

```bash
npx create-ai-chat-context init
```

Questions or issues? Open an issue on GitHub: https://github.com/Vaeshkar/create-ai-chat-context/issues
