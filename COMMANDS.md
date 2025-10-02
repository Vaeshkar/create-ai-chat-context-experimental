# Command Reference

Complete reference for all `create-ai-chat-context` commands.

---

## Table of Contents

- [Quick Reference](#quick-reference)
- [Command Details](#command-details)
  - [init](#init)
  - [log](#log)
  - [config](#config)
  - [tokens](#tokens)
  - [stats](#stats)
  - [search](#search)
  - [validate](#validate)
  - [check](#check)
  - [archive](#archive)
  - [summary](#summary)
  - [export](#export)
  - [update](#update)
  - [cursor](#cursor)
  - [copilot](#copilot)
  - [claude-project](#claude-project)
  - [install-hooks](#install-hooks)

---

## Quick Reference

```bash
# Setup & Initialization
npx aic init                              # Initialize knowledge base
npx aic init --template nextjs            # Initialize with specific template
npx aic init --force                      # Overwrite existing files

# Daily Usage
npx aic chat-finish                       # Auto-update all .ai/ files (recommended!)
npx aic stats                             # View statistics
npx aic search "query"                    # Search knowledge base
npx aic validate                          # Check quality

# Configuration
npx aic config                            # List configuration
npx aic config set preferredModel "GPT-5" # Set preferred model
npx aic config get preferredModel         # Get specific value

# Token Management
npx aic tokens                            # Check token usage (top 4 models)
npx aic tokens --all                      # Check token usage (all 16 models)
npx aic archive --keep 10                 # Archive old conversations
npx aic summary --keep 10                 # Summarize old conversations

# AI Integration
npx aic cursor                            # Generate Cursor AI rules
npx aic copilot                           # Generate Copilot instructions
npx aic claude-project                    # Generate Claude Projects export

# Maintenance
npx aic export --format md                # Export knowledge base
npx aic update                            # Update templates
npx aic install-hooks                     # Install Git hooks
npx aic check                             # Quick health check
```

---

## Command Details

### init

Initialize the `.ai/` knowledge base system in your project.

**Syntax:**

```bash
npx aic init [options]
```

**Options:**

- `-f, --force` - Overwrite existing files
- `--no-git` - Skip Git integration
- `-t, --template <name>` - Specify template (default, nextjs, python, rust, api)

**Examples:**

```bash
# Auto-detect project type
npx aic init

# Force overwrite existing files
npx aic init --force

# Use specific template
npx aic init --template nextjs
npx aic init --template python

# Skip Git integration
npx aic init --no-git
```

**What it creates:**

- `.ai/` directory with knowledge base files
- `.ai-instructions` file (entry point for AI)
- `NEW_CHAT_PROMPT.md` (quick reference)

**Files created in `.ai/`:**

- `README.md` - Overview
- `architecture.md` - System architecture
- `conversation-log.md` - Chat history
- `technical-decisions.md` - Decision log
- `known-issues.md` - Known issues
- `next-steps.md` - Planned work
- `SETUP_GUIDE.md` - Setup instructions
- `TOKEN_MANAGEMENT.md` - Token optimization

**When to use:**

- Starting a new project
- Adding AI context to existing project
- Resetting knowledge base (with `--force`)

---

### chat-finish

**⭐ RECOMMENDED:** Automatically update all `.ai/` files at the end of a chat session.

**Syntax:**

```bash
npx aic chat-finish
```

**What it does:**

1. Analyzes git changes since last run
2. Detects new/modified files
3. Extracts commit messages
4. Auto-generates entries for:
   - `conversation-log.md` - Chat summary (YAML format)
   - `technical-decisions.md` - Decisions with rationale
   - `known-issues.md` - Issues found/resolved
   - `next-steps.md` - Completed tasks and future work
   - `architecture.md` - Updates timestamp

**Output format (YAML):**

```yaml
---
CHAT: 5
DATE: 2025-10-01
TYPE: FEAT
TOPIC: Implement user authentication

WHAT:
  - Added JWT auth with bcrypt password hashing

WHY:
  - JWT for stateless API, bcrypt for secure password storage

OUTCOME: SHIPPED

FILES:
  - src/auth.js: JWT authentication logic
  - src/routes/login.js: Login/logout endpoints

NEXT:
  - Add password reset flow
  - Implement 2FA
---
```

**When to use:**

- ✅ **After every AI chat session** (recommended!)
- After making significant code changes
- Before committing major features

**Why use this instead of `log`:**

- Automatic: No manual typing required
- Consistent: Uses git history for accuracy
- Complete: Updates ALL `.ai/` files at once
- Efficient: Saves time and ensures nothing is missed

---

### log

Add a conversation log entry interactively (manual alternative to `chat-finish`).

**Syntax:**

```bash
npx aic log
```

**Interactive prompts:**

1. Chat number (auto-increments)
2. Topic/title
3. What was accomplished
4. Key decisions made
5. Next steps

**Example session:**

```bash
$ npx aic log

📝 Add Conversation Log Entry

Chat number: 5
Topic: Implement user authentication
What was accomplished: Added JWT auth, login/logout endpoints
Key decisions: Using bcrypt for passwords, 7-day token expiry
Next steps: Add password reset flow, implement 2FA

✅ Entry added to .ai/conversation-log.md
```

**Output format (Markdown):**

```markdown
## Chat #5 - Implement user authentication

### What We Did

- Added JWT auth, login/logout endpoints

### Key Decisions

- Using bcrypt for passwords, 7-day token expiry

### Next Steps

- Add password reset flow, implement 2FA
```

**When to use:**

- When you prefer manual entry over automatic
- When you haven't committed code yet
- For quick notes without git analysis

**Note:** `chat-finish` is recommended over `log` for most use cases.

---

### config

Manage configuration settings.

**Syntax:**

```bash
npx aic config [action] [key] [value]
```

**Actions:**

- `list` (default) - Show all configuration
- `get <key>` - Get specific value
- `set <key> <value>` - Set specific value

**Available keys:**

- `preferredModel` - Your preferred AI model
- `showAllModels` - Show all models (true/false)
- `useAiNativeFormat` - Use AI-native format for conversation logs (true/false)

**Examples:**

```bash
# List all configuration
npx aic config
npx aic config list

# Get specific value
npx aic config get preferredModel

# Set preferred model
npx aic config set preferredModel "Claude Sonnet 4.5"
npx aic config set preferredModel "GPT-5"

# Always show all models
npx aic config set showAllModels true

# Enable AI-native format (85% token reduction!)
npx aic config set useAiNativeFormat true

# Disable AI-native format (back to YAML)
npx aic config set useAiNativeFormat false
```

**AI-Native Format (AICF):**

The AI-native format is an ultra-compact format designed for maximum token efficiency:

- **85% fewer tokens** vs YAML (12 tokens vs 80 tokens per entry)
- **92% fewer tokens** vs prose (150 tokens vs 12 tokens per entry)
- **6x more history** in context windows
- **Instant parsing** - Simple string split, no NLP needed

**Format:** `C#|YYYYMMDD|T|TOPIC|WHAT|WHY|O|FILES`

**Example:**

```
7|20251001|R|v0.10.0 auto chat-finish|Rewrote chat-finish auto operation|Users no questions after 4hr sessions|S|src/chat-finish.js
```

**When to use:**

- Large conversation history (50+ chats)
- Hitting context window limits
- Maximum token efficiency needed
- Don't need to manually read logs

**Backward compatible:** Supports reading all 3 formats (Markdown, YAML, AI-native) simultaneously.

**See also:** [CONFIGURATION.md](CONFIGURATION.md) for detailed guide

---

### tokens

Show detailed token usage breakdown.

**Syntax:**

```bash
npx aic tokens [options]
```

**Options:**

- `-a, --all` - Show all 16 AI models (default: top 4)

**Examples:**

```bash
# Show top 4 models (default)
npx aic tokens

# Show all 16 models
npx aic tokens --all
```

**Output:**

```
📊 Token Usage Report

Entry Point:
  .ai-instructions                       540 words     719 tokens  (4.7%)

Core Knowledge Base:
  .ai/README.md                          492 words     655 tokens  (4.3%)
  .ai/architecture.md                   1085 words    1444 tokens  (9.5%)
  ...

Total:
  All files                            11405 words   15174 tokens

Context Window Usage:

⭐ Claude Sonnet 4.5      7.59%  ███
   GPT-5                  3.79%  █
   GPT-4o                11.85%  █████
   Gemini 1.5 Pro         0.76%

💡 Showing 4 models. Run 'npx aic tokens --all' to see all 16 models
```

**When to use:**

- Check if context fits in AI models
- Decide when to archive old conversations
- Compare token usage across models

---

### stats

Show knowledge base statistics and insights.

**Syntax:**

```bash
npx aic stats
```

**Output:**

```
📊 Knowledge Base Statistics

📝 Content:

   Total files:              7
   Total lines:              3,013
   Total words:              10,499
   Estimated tokens:         ~13,964
   Conversation entries:     24

📈 Activity:

   Last updated:             25 minutes ago
   Most active file:         conversation-log.md
   Most active file size:    3,045 words

💡 Insights:

   💬 24 conversation entries - healthy amount
   ✅ Token usage is healthy - fits comfortably in most AI contexts
```

**When to use:**

- Get overview of knowledge base
- Check conversation entry count
- See which files are most active

---

### search

Search across all knowledge base files.

**Syntax:**

```bash
npx aic search <query> [options]
```

**Options:**

- `-c, --case-sensitive` - Case-sensitive search

**Examples:**

```bash
# Basic search
npx aic search "authentication"

# Case-sensitive search
npx aic search "JWT" --case-sensitive

# Search for phrases
npx aic search "user login flow"
```

**Output:**

```
🔍 Search Results for "authentication"

📄 .ai/architecture.md (2 matches)
  Line 45: ## Authentication System
  Line 67: We use JWT for authentication with bcrypt...

📄 .ai/conversation-log.md (1 match)
  Line 123: ## Chat #5 - Implement user authentication

Found 3 matches in 2 files
```

**When to use:**

- Find where something was discussed
- Locate specific decisions or issues
- Quick lookup without reading all files

---

### validate

Validate knowledge base quality and completeness.

**Syntax:**

```bash
npx aic validate
```

**Checks:**

- All required files exist
- Files are not empty
- Conversation log format is correct
- Token usage is reasonable
- Files have been updated recently

**Output:**

```
✅ Validation passed

Files:
  ✅ .ai-instructions exists
  ✅ .ai/README.md exists
  ✅ .ai/architecture.md exists
  ...

Quality:
  ✅ All files have content
  ✅ Conversation log format is valid
  ✅ Token usage is healthy (15,174 tokens)

Recommendations:
  💡 Consider updating .ai/next-steps.md (last updated 30 days ago)
```

**When to use:**

- Before starting a new AI chat
- After major updates
- Periodic quality checks

---

### check

Quick health check of knowledge base.

**Syntax:**

```bash
npx aic check
```

**Output:**

```
✅ Knowledge base is healthy

Files: 7/7 present
Token usage: 15,174 tokens (healthy)
Last updated: 2 hours ago
```

**When to use:**

- Quick status check
- Verify setup after init
- CI/CD health checks

---

### archive

Archive old conversation log entries to reduce token usage.

**Syntax:**

```bash
npx aic archive [options]
```

**Options:**

- `-k, --keep <number>` - Number of recent chats to keep detailed (default: 10)

**Examples:**

```bash
# Keep last 10 chats detailed, archive older ones
npx aic archive

# Keep last 5 chats detailed
npx aic archive --keep 5

# Keep last 20 chats detailed
npx aic archive --keep 20
```

**What it does:**

- Moves old conversation entries to `.ai/archive/`
- Keeps recent entries in main conversation log
- Reduces token usage significantly

**When to use:**

- Token usage is high (>25,000 tokens)
- Conversation log is very long
- Want to keep recent context only

---

### summary

Summarize old conversation log entries to reduce token usage.

**Syntax:**

```bash
npx aic summary [options]
```

**Options:**

- `-k, --keep <number>` - Number of recent chats to keep detailed (default: 10)

**Examples:**

```bash
# Keep last 10 chats detailed, summarize older ones
npx aic summary

# Keep last 5 chats detailed
npx aic summary --keep 5
```

**What it does:**

- Keeps recent entries detailed
- Summarizes older entries (1-2 lines each)
- Reduces token usage while preserving history

**When to use:**

- Want to keep all history but reduce tokens
- Don't want to archive (lose detail)
- Prefer summaries over full archive

---

### export

Export knowledge base in various formats.

**Syntax:**

```bash
npx aic export [options]
```

**Options:**

- `-f, --format <format>` - Export format (markdown, json, html) (default: markdown)
- `-o, --output <file>` - Output file name
- `--force` - Overwrite existing file

**Examples:**

```bash
# Export as markdown
npx aic export

# Export as JSON
npx aic export --format json

# Export as HTML
npx aic export --format html

# Specify output file
npx aic export --output my-knowledge-base.md

# Overwrite existing file
npx aic export --force
```

**When to use:**

- Share knowledge base with team
- Backup before major changes
- Generate documentation

---

### update

Update knowledge base with latest template improvements.

**Syntax:**

```bash
npx aic update [options]
```

**Options:**

- `-y, --yes` - Skip confirmation prompt

**Examples:**

```bash
# Update with confirmation
npx aic update

# Update without confirmation
npx aic update --yes
npx aic update -y
```

**What it does:**

- Updates template files to latest version
- Preserves your custom content
- Adds new features from updates

**Output:**

```
🔄 Update Knowledge Base

Current version: 0.6.0
Latest version: 0.7.1

Updates available:
  • New configuration system
  • Improved token reporting
  • Enhanced documentation

Continue? (y/n): y

✅ Updated successfully!
```

**When to use:**

- After upgrading the npm package
- To get new features
- Periodic maintenance

---

### cursor

Generate `.cursorrules` file for Cursor AI integration.

**Syntax:**

```bash
npx aic cursor [options]
```

**Options:**

- `-f, --force` - Overwrite existing `.cursorrules` file

**Examples:**

```bash
# Generate .cursorrules
npx aic cursor

# Overwrite existing file
npx aic cursor --force
```

**What it creates:**

- `.cursorrules` file in project root
- Tells Cursor AI to read `.ai/` knowledge base

**Output:**

```
✅ Cursor integration configured!

📝 What this does:
  • Cursor will automatically read your .ai/ knowledge base
  • AI gets full context in every chat
  • No need to manually paste context

🚀 Next steps:
  1. Restart Cursor (if running)
  2. Start a new chat
  3. Cursor will automatically have your project context!
```

**When to use:**

- Using Cursor AI editor
- Want automatic context loading
- First-time Cursor setup

---

### copilot

Generate GitHub Copilot instructions for integration.

**Syntax:**

```bash
npx aic copilot [options]
```

**Options:**

- `-f, --force` - Overwrite existing `copilot-instructions.md` file

**Examples:**

```bash
# Generate Copilot instructions
npx aic copilot

# Overwrite existing file
npx aic copilot --force
```

**What it creates:**

- `.github/copilot-instructions.md` file
- Tells GitHub Copilot to read `.ai/` knowledge base

**Output:**

```
✅ GitHub Copilot integration configured!

📝 What this does:
  • GitHub Copilot will automatically read your .ai/ knowledge base
  • AI gets full context for better suggestions
  • Works in VS Code, GitHub.com, and CLI

🚀 Next steps:
  1. Commit the .github/copilot-instructions.md file
  2. Push to GitHub
  3. GitHub Copilot will automatically use your context!
```

**When to use:**

- Using GitHub Copilot
- Want automatic context loading
- First-time Copilot setup

---

### claude-project

Generate Claude Projects export.

**Syntax:**

```bash
npx aic claude-project [options]
```

**Options:**

- `-f, --force` - Overwrite existing `CLAUDE_PROJECT.md` file

**Examples:**

```bash
# Generate Claude Projects export
npx aic claude-project

# Overwrite existing file
npx aic claude-project --force
```

**What it creates:**

- `CLAUDE_PROJECT.md` file in project root
- Formatted for Claude Projects feature

**Output:**

```
✅ Claude Projects export created!

📝 What this does:
  • Creates CLAUDE_PROJECT.md with your knowledge base
  • Formatted for Claude's Projects feature
  • Single file with all context

🚀 Next steps:
  1. Go to claude.ai
  2. Create a new Project
  3. Upload CLAUDE_PROJECT.md as project knowledge
  4. Claude will have full context in that project!
```

**When to use:**

- Using Claude AI (claude.ai)
- Want to use Claude Projects feature
- Need single-file export for Claude

---

### migrate

Convert `.ai/` directory to `.aicf/` format (AICF 2.0).

**Syntax:**

```bash
npx aic migrate
```

**What it does:**

- Converts `conversation-log.md` → `conversations.aicf`
- Converts `technical-decisions.md` → `decisions.aicf`
- Converts `known-issues.md` → `issues.aicf`
- Converts `next-steps.md` → `tasks.aicf`
- Creates `index.aicf` for fast lookup
- Generates `.meta` with project metadata

**Example Output:**

```
🚀 Migrating to AICF 2.0

Converting files...
  - Conversations: 9
  - Decisions: 6
  - Tasks: 49
  - Issues: 5
✔ Migration complete!

📊 Results:
   Conversations: 9
   Decisions: 6
   Tasks: 49
   Issues: 5
```

**What it preserves:**

- All conversation history
- All technical decisions
- All tasks and their status
- All known issues
- Project metadata

**Safety:**

- Original `.ai/` files are NOT deleted
- You can always go back
- Non-destructive operation
- Can re-migrate anytime: `rm -rf .aicf && npx aic migrate`

**When to use:**

- First time using AICF 2.0
- Want 88% token reduction
- Need persistent AI memory across chat sessions
- Hitting context window limits

**See also:** [AICF Guide](./docs/aicf/AICF-GUIDE.md) for complete documentation

---

### context

Display AI context for starting new chat sessions.

**Syntax:**

```bash
npx aic context [options]
```

**Options:**

- `--ai` - AI-optimized format (paste into new chats)
- `--full` - Show complete details

**Examples:**

```bash
# Human-readable summary
npx aic context

# AI-optimized (for new chats)
npx aic context --ai

# Complete details
npx aic context --full
```

**Example Output (--ai):**

```
# AI Context - create-ai-chat-context v0.13.0

## Project Overview
Preserve AI chat context and history across sessions

## Current State
Status: active_development
Phase: migrated_to_aicf
Last Chat: #9

## Statistics
- Conversations: 9
- Decisions: 6
- Tasks: 49
- Issues: 5

## Active Tasks
- [TODO] Test v0.10.0 and publish to npm (Priority: H)
- [TODO] Gather user feedback (Priority: H)
...

## Recent Decisions
- Per-Project Configuration Storage: Store config in .ai/config.json
- Simplified Token Report: Show 4 models by default
...

---
Full context available in .aicf/ directory
```

**Use Case:**

When your current chat fills up:

1. Run `npx aic context --ai`
2. Copy the output
3. Start a new AI chat
4. Paste the output
5. Say: "Continue from here"

**The new AI instantly has full context!** 🎉

**When to use:**

- Chat session is filling up (approaching token limit)
- Starting a new AI chat session
- Want to transfer context between AIs
- Need quick project overview

**See also:** [AICF Guide](./docs/aicf/AICF-GUIDE.md) for complete documentation

---

### convert

Convert conversation log between formats (Markdown, YAML, AI-native).

**Syntax:**

```bash
npx aic convert [options]
```

**Options:**

- `--to-ai-native` - Convert to AI-native format (85% token reduction)
- `--to-yaml` - Convert to YAML format (human-readable)
- `--to-markdown` - Convert to Markdown format (traditional)
- `--no-backup` - Skip creating backup file (default: creates backup)

**Examples:**

```bash
# Convert to AI-native format (maximum token efficiency)
npx aic convert --to-ai-native

# Convert to YAML format (human-readable)
npx aic convert --to-yaml

# Convert to Markdown format (traditional)
npx aic convert --to-markdown

# Convert without creating backup
npx aic convert --to-ai-native --no-backup
```

**What it does:**

- Detects current format(s) in conversation log
- Converts all entries to target format
- Creates backup by default (`.ai/conversation-log.md.backup`)
- Shows token savings comparison
- Preserves file structure and headers

**Token Savings:**

| Source Format | Target Format | Token Reduction |
| ------------- | ------------- | --------------- |
| Markdown      | YAML          | ~47%            |
| Markdown      | AI-native     | ~92%            |
| YAML          | AI-native     | ~85%            |
| AI-native     | YAML          | -85% (increase) |
| AI-native     | Markdown      | -92% (increase) |

**Example Output:**

```
📝 Converting Conversation Log

✔ Detected current format: YAML
✔ Converting to: AI-native
✔ Found 10 entries
✔ Created backup: .ai/conversation-log.md.backup
✔ Converted 10 entries

✅ Conversion completed successfully!

Token Savings:
   Before: 800 tokens (YAML)
   After: 120 tokens (AI-native)
   Savings: 680 tokens (85% reduction!)

🚀 Impact: Can keep 6x more history in context!

💡 Next steps:
   1. Review the converted log
   2. Run "npx aic tokens" to see updated token usage
   3. If satisfied, delete backup: rm .ai/conversation-log.md.backup
```

**When to use:**

- **To AI-native:** When you have 50+ chat entries or hitting context limits
- **To YAML:** When you want human-readable format with good token efficiency
- **To Markdown:** When you want traditional format (not recommended for large logs)

**Safety:**

- Always creates backup by default
- Can revert by copying backup: `cp .ai/conversation-log.md.backup .ai/conversation-log.md`
- Non-destructive (original preserved in backup)

---

### install-hooks

Install Git hooks for knowledge base maintenance.

**Syntax:**

```bash
npx aic install-hooks [options]
```

**Options:**

- `-f, --force` - Overwrite existing hooks

**Examples:**

```bash
# Install Git hooks
npx aic install-hooks

# Overwrite existing hooks
npx aic install-hooks --force
```

**What it does:**

- Installs `post-commit` Git hook
- Reminds you to update knowledge base after commits
- Non-intrusive (just a reminder)

**Hook behavior:**

```bash
$ git commit -m "Add feature"

✅ Committed successfully!

💡 Reminder: Update your AI knowledge base
   Run: npx aic log

Recent changes:
  • src/auth.js
  • tests/auth.test.js
```

**When to use:**

- Want automatic reminders
- Frequently forget to update logs
- Team wants consistent documentation

---

## Common Workflows

### Daily Development Workflow

```bash
# Morning: Check status
npx aic check

# During work: Search for context
npx aic search "authentication"

# After AI chat: Auto-update knowledge base
npx aic chat-finish

# End of day: Check token usage
npx aic stats
```

### Weekly Maintenance

```bash
# Check quality
npx aic validate

# Check token usage
npx aic tokens

# Archive if needed (>25k tokens)
npx aic archive --keep 10

# Export backup
npx aic export --format json
```

### New Project Setup

```bash
# Initialize
npx aic init

# Configure
npx aic config set preferredModel "Claude Sonnet 4.5"

# Set up AI integration
npx aic cursor          # If using Cursor
npx aic copilot         # If using GitHub Copilot
npx aic claude-project  # If using Claude Projects

# Install Git hooks
npx aic install-hooks

# Verify setup
npx aic check
```

### Token Management Workflow

```bash
# Check current usage
npx aic tokens

# If >25k tokens, archive old conversations
npx aic archive --keep 10

# Or summarize instead
npx aic summary --keep 10

# Verify reduction
npx aic tokens
```

---

## Tips & Best Practices

### Command Aliases

Use `aic` instead of `create-ai-chat-context`:

```bash
npx aic init        # ✅ Short
npx create-ai-chat-context init  # ❌ Long
```

### Regular Maintenance

- Run `npx aic chat-finish` after every AI chat session
- Run `npx aic validate` weekly
- Run `npx aic archive` when tokens >25,000
- Run `npx aic update` after package updates

### Configuration

- Set `preferredModel` for your primary AI
- Use `showAllModels: false` for cleaner output
- Use `--all` flag when comparing models

### Search Tips

- Use specific terms: `npx aic search "JWT authentication"`
- Use quotes for phrases: `npx aic search "user login flow"`
- Use `--case-sensitive` for acronyms: `npx aic search "API" -c`

---

## See Also

- [README.md](README.md) - Main documentation
- [CONFIGURATION.md](CONFIGURATION.md) - Configuration guide
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [GitHub Issues](https://github.com/Vaeshkar/create-ai-chat-context/issues) - Report bugs
