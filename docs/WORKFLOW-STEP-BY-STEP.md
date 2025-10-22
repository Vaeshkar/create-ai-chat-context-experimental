# 📖 Step-by-Step Workflow Guide

## Scenario 1: Augment User (Manual Mode)

### Your Workflow

#### **Step 1: Start Your Session**
```bash
# Open your project
cd ~/my-project

# Initialize if not already done
npx create-ai-chat-context init --manual
```

#### **Step 2: Have Your Conversation**
- Open Augment in your IDE
- Ask questions, get code suggestions, debug issues
- Augment is capturing everything in its LevelDB

#### **Step 3: Request Memory Update**
At the end of your session, ask Augment:

> "Please generate a checkpoint of our conversation and update my memory files. Include:
> - Key decisions we made
> - Technical work completed
> - Next steps and action items
> - Any important context for future sessions"

#### **Step 4: Process the Checkpoint**
Augment generates a checkpoint JSON file:

```bash
# Augment saves to: ~/Downloads/checkpoint-2025-10-22.json

# Process it
npx create-ai-chat-context checkpoint ~/Downloads/checkpoint-2025-10-22.json
```

#### **Step 5: Review the Results**
```bash
# Check what was captured
cat .aicf/index.aicf
cat .ai/conversation-log.md

# Verify git changes
git diff .aicf/
git diff .ai/
```

#### **Step 6: Commit to Git**
```bash
git add .aicf/ .ai/
git commit -m "Update memory: [Brief description of work done]"
git push
```

---

## Scenario 2: Claude Desktop User (Automatic Mode)

### Your Workflow

#### **Step 1: Initialize Automatic Mode**
```bash
cd ~/my-project
npx create-ai-chat-context init --automatic
```

**What happens:**
- Creates `.permissions.aicf` (platform permissions)
- Creates `.watcher-config.json` (watcher settings)
- Sets up git hooks for automatic commits

#### **Step 2: Grant Permissions**
Review `.aicf/.permissions.aicf`:

```
platform|active|cache_path|last_checked
augment|false|~/.cache/llm/augment|null
claude-desktop|true|~/Library/Application Support/Claude/|null
claude-cli|false|~/.cache/claude-cli|null
warp|false|~/.local/share/warp|null
```

Enable Claude Desktop (already enabled by default).

#### **Step 3: Start the Watcher**
```bash
# Start background watcher
npx create-ai-chat-context watch

# Or with verbose logging
npx create-ai-chat-context watch --verbose
```

**What happens:**
- Watcher monitors Claude's database directory
- Every 5 minutes, checks for new conversations
- Automatically processes new conversations
- Updates memory files
- Commits to git (if enabled)

#### **Step 4: Have Your Conversations**
- Use Claude Desktop normally
- Watcher automatically captures conversations
- No manual steps needed!

#### **Step 5: Review Memory Files**
```bash
# Check recent updates
cat .aicf/work-state.aicf

# Read conversation log
cat .ai/conversation-log.md

# Check git history
git log --oneline | head -10
```

---

## Scenario 3: Claude CLI User

### Your Workflow

#### **Step 1: Export Conversations**
```bash
# Export Claude CLI conversations
claude export --format jsonl > conversations.jsonl
```

#### **Step 2: Import into System**
```bash
npx create-ai-chat-context import-claude conversations.jsonl
```

#### **Step 3: Review & Commit**
```bash
git add .aicf/ .ai/
git commit -m "Import Claude CLI conversations"
```

---

## Scenario 4: Warp Terminal User

### Your Workflow

#### **Step 1: Enable Warp Tracking**
```bash
# Initialize with Warp support
npx create-ai-chat-context init --automatic
```

#### **Step 2: Configure Warp**
Edit `.aicf/.watcher-config.json`:

```json
{
  "platforms": {
    "warp": {
      "active": true,
      "cachePath": "~/.local/share/warp"
    }
  }
}
```

#### **Step 3: Start Watcher**
```bash
npx create-ai-chat-context watch
```

#### **Step 4: Use Warp Normally**
- Warp automatically captures terminal sessions
- Watcher processes them
- Memory files updated automatically

---

## Memory File Updates

### What Gets Updated

#### `.aicf/index.aicf`
```
project_name|phase|total_conversations|total_decisions|total_actions
my-project|Phase 5.5|42|156|89
```

#### `.aicf/conversations.aicf`
```
id|timestamp|platform|summary|decisions|actions|technical_work
conv-123|2025-10-22T14:00:00Z|augment|Fixed TS errors|3|5|8
```

#### `.ai/conversation-log.md`
```markdown
## Conversation: Fixed TypeScript Errors
**Date:** 2025-10-22 14:00 UTC
**Platform:** Augment
**Duration:** 45 minutes

### Summary
Fixed 81 TypeScript compilation errors...

### Key Decisions
1. Use bracket notation for index signatures
2. Separate type imports from value imports
...
```

---

## Monitoring & Maintenance

### Check System Health
```bash
# View watcher status
npx create-ai-chat-context watch --verbose

# Check memory file sizes
du -sh .aicf/ .ai/

# Verify git history
git log --oneline .aicf/ | head -20
```

### Troubleshooting

**Watcher not detecting changes:**
```bash
# Check permissions
cat .aicf/.permissions.aicf

# Verify cache paths
ls -la ~/Library/Application\ Support/Claude/
```

**Memory files not updating:**
```bash
# Run manual checkpoint
npx create-ai-chat-context checkpoint <file>

# Check for errors
pnpm test
```

---

## Best Practices

1. **Commit regularly** - After each session or daily
2. **Review memory files** - Understand what's being captured
3. **Update permissions** - Enable/disable platforms as needed
4. **Monitor watcher** - Check logs for errors
5. **Backup memory files** - They're valuable!

---

## Integration Examples

### GitHub Actions
```yaml
- name: Update memory files
  run: npx create-ai-chat-context checkpoint ${{ github.event.inputs.checkpoint }}
```

### Pre-commit Hook
```bash
#!/bin/bash
npx create-ai-chat-context checkpoint latest
```

### Scheduled Task (cron)
```bash
0 */6 * * * cd ~/my-project && npx create-ai-chat-context watch --once
```

