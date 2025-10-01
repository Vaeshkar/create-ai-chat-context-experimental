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

# At START of AI chat, use this prompt:
"Read .ai-instructions first, then help me with [your task]."

# At END of chat (IMPORTANT!), ask AI to update:
"Before we finish, please update .ai/conversation-log.md with what we accomplished today."

# For subsequent chats, use:
"Read .ai-instructions first, and help me continue where we left off with chat #[number]."
```

That's it. AI now has full context and knows where previous chats left off.

**💡 Pro Tip:** Always ask the AI to update the conversation log at the END of each chat. This ensures the next chat has full context!

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

First chat:

```
Read .ai-instructions first, then help me add authentication to my app.
```

Continuing from previous chat:

```
Read .ai-instructions first, and help me continue where we left off with chat #1.
```

Or combine both:

```
Read .ai-instructions first, continue from chat #2, then help me add user profiles.
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

### 5. AI updates the conversation log

At the end of each session, AI updates `.ai/conversation-log.md` with what was accomplished.

### 6. Next chat continues seamlessly

```
Read .ai-instructions first, and help me continue where we left off with chat #1.
```

AI reads the conversation log and knows exactly where to continue.

### 7. Save time per chat

No more re-explaining architecture, decisions, or history.

---

## 🔄 Chat Continuity Example

**Chat #1:**

```
You (START): "Read .ai-instructions first, then help me add authentication."
AI: [Reads knowledge base, adds authentication]

You (END): "Before we finish, update .ai/conversation-log.md with what we did."
AI: [Updates conversation log with authentication work]
```

**Chat #2:**

```
You (START): "Read .ai-instructions first, continue from chat #1, then add user profiles."
AI: [Reads conversation-log.md, sees auth was added, builds profiles using existing auth]

You (END): "Before we finish, update the conversation log."
AI: [Updates log with user profile work]
```

**Chat #3:**

```
You (START): "Read .ai-instructions first, continue from chat #2, then add password reset."
AI: [Knows about auth + profiles, adds password reset feature]

You (END): "Update the knowledge base before we finish."
AI: [Updates log with password reset work]
```

**Result:** Each chat builds on previous work. No context loss. No re-explaining.

**🔑 Key:** Always ask AI to update the conversation log at the END of each chat!

---

## 📊 Token Usage & Management

### How Many Tokens Does This Use?

Your `.ai/` knowledge base consumes tokens from the AI's context window:

| Project Stage          | Token Usage           | % of Claude 200K | Status      |
| ---------------------- | --------------------- | ---------------- | ----------- |
| **Fresh project**      | ~3,000 tokens         | 1.5%             | ✅ Minimal  |
| **Active (10 chats)**  | ~8,000 tokens         | 4%               | ✅ Low      |
| **Mature (50 chats)**  | ~22,000 tokens        | 11%              | ⚠️ Moderate |
| **Large (100+ chats)** | ~40,000-50,000 tokens | 20-25%           | 🚨 Manage   |

### Is This Efficient?

**YES!** Without this system, you'd spend 1,800-3,500 tokens per chat re-explaining context.

**Savings over 50 chats:**

- **Without:** 90,000-175,000 tokens wasted on repetition
- **With:** 22,000 tokens for persistent context
- **Net savings:** 68,000-153,000 tokens + 8-15 hours of time

### Token Management Commands

**Quick health check (recommended):**

```bash
npx create-ai-chat-context check
```

Shows token usage, conversation count, and status at a glance.

**Detailed token breakdown:**

```bash
npx create-ai-chat-context tokens
```

**Archive old conversations (keeps recent, moves old to archive):**

```bash
npx create-ai-chat-context archive --keep 10
```

Summarize old conversations (condenses old entries):

```bash
npx create-ai-chat-context summary --keep 10
```

### When to Manage Tokens

- **< 10,000 tokens:** No action needed ✅
- **10,000-25,000 tokens:** Consider archiving soon ⚠️
- **> 25,000 tokens:** Archive or summarize now 🚨

### Best Practices

1. **Be concise** in conversation logs - Focus on decisions, not details
2. **Archive regularly** - After 30+ conversation entries
3. **Check token usage** - Run `tokens` command every 10-20 chats
4. **Commit before cleanup** - Always commit before archiving/summarizing

For detailed guidance, see `.ai/TOKEN_MANAGEMENT.md` after running `init`.

---

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

## ✨ New in v0.5.0

### 🔍 Search & Insights

Find information instantly and see what you have!

```bash
# Search across all knowledge base files
npx create-ai-chat-context search "authentication"

# Show statistics and insights
npx create-ai-chat-context stats

# Export knowledge base
npx create-ai-chat-context export --format markdown

# Update with latest templates
npx create-ai-chat-context update
```

**What this does:**

- **Search:** Find information across all `.ai/` files instantly
- **Stats:** See analytics, quality score, and insights about your knowledge base
- **Export:** Share or backup in multiple formats (markdown, json, html)
- **Update:** Get latest template improvements without starting over

**Result:** Your knowledge base is searchable, measurable, and always up-to-date!

---

## 🎯 Previous Features

### 🤖 AI Tool Integrations (v0.4.0)

```bash
npx create-ai-chat-context copilot        # GitHub Copilot
npx create-ai-chat-context claude-project # Claude Projects
npx create-ai-chat-context cursor         # Cursor AI
```

Zero-effort context loading in Cursor, Copilot, and Claude!

### 🎨 Project-Specific Templates (v0.3.0)

```bash
# Next.js/React projects
npx create-ai-chat-context init --template nextjs

# Python projects
npx create-ai-chat-context init --template python
```

Framework-specific architecture and best practices!

### 📝 Effortless Logging (v0.2.0)

```bash
npx create-ai-chat-context log
```

Interactive prompts guide you through adding entries!

### 🔍 Quality Validation (v0.2.0)

```bash
npx create-ai-chat-context validate
```

Get a quality score and recommendations.

### 🎯 Cursor Integration (v0.2.0)

```bash
npx create-ai-chat-context cursor
```

Automatic context loading in Cursor AI!

---

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

### Add conversation log entry

```bash
npx create-ai-chat-context log
```

Interactive prompts guide you through adding an entry.

### Validate knowledge base quality

```bash
npx create-ai-chat-context validate
```

Checks completeness and provides quality score.

### Generate Cursor AI integration

```bash
npx create-ai-chat-context cursor
```

Creates `.cursorrules` file for automatic context loading in Cursor.

### Quick health check

```bash
npx create-ai-chat-context check
```

### Check detailed token usage

```bash
npx create-ai-chat-context tokens
```

### Archive old conversations

```bash
# Keep 10 most recent, archive the rest
npx create-ai-chat-context archive --keep 10

# Keep 20 most recent
npx create-ai-chat-context archive --keep 20
```

### Summarize old conversations

```bash
# Keep 10 most recent detailed, summarize the rest
npx create-ai-chat-context summary --keep 10

# Keep 15 most recent detailed
npx create-ai-chat-context summary --keep 15
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
