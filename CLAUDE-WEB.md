# Claude/Web Integration Guide

## Overview

Claude/Web (claude.ai) conversations are captured using **MANUAL MODE ONLY**.

This document explains why and how to use it.

---

## Why Manual Mode for Claude/Web?

### Browser Storage Complexity

Claude.ai stores conversations in browser storage (IndexedDB, LocalStorage), which varies by browser:

- **Chrome/Edge**: LevelDB format (binary, encrypted)
- **Firefox**: SQLite format
- **Safari**: Binary format
- **All browsers**: Encryption and access restrictions

### Technical Challenges

1. **No direct Node.js access** - Can't read IndexedDB from command line
2. **Browser-specific formats** - Each browser stores data differently
3. **Encryption** - Requires browser context to decrypt
4. **Fragility** - Depends on browser internals that change frequently

### Permission & Privacy

- Accessing browser storage without explicit user action = legal risk
- Browser extensions require separate installation and maintenance
- Puppeteer/Playwright automation is slow and fragile

### Solution: Manual Mode

**Manual mode is actually the best approach for Claude/Web:**

✅ No technical complexity
✅ Perfect transparency
✅ Works with any browser
✅ Zero privacy concerns
✅ User has full control
✅ Leverages Claude's strength (formatting data)

---

## How to Use Manual Mode with Claude/Web

### Step 1: Have Your Conversation

Use Claude.ai normally at https://claude.ai

### Step 2: Ask Claude to Export

When you're done with a conversation, ask Claude:

```
Please update my project memory files with this conversation.

Project: create-ai-chat-context-experimental
Location: /Users/leeuwen/Programming/create-ai-chat-context-experimental

Update these files:
- .aicf/work-state.aicf (current work status)
- .aicf/conversations.aicf (conversation history)
- .aicf/decisions.aicf (key decisions)
- .ai/conversation-log.md (human-readable log)
- .ai/next-steps.md (planned work)

Format: AICF (AI Context Format) v3.0.0
Reference: https://github.com/Vaeshkar/aicf-core

See project structure at:
https://github.com/Vaeshkar/create-ai-chat-context-experimental
```

### Step 3: Claude Generates Files

Claude will create/update the memory files with:
- Conversation summary
- Key decisions made
- Current work status
- Next steps
- Technical insights

### Step 4: Review & Commit

1. Review the changes Claude made
2. Commit to git:
   ```bash
   git add .aicf/ .ai/
   git commit -m "docs: update memory files from Claude/Web session"
   ```

---

## Example Prompt for Claude

Here's a complete prompt you can use:

```
I'm working on a project called "create-ai-chat-context-experimental" 
that consolidates AI conversations into memory files.

Please update my project memory files based on our conversation:

PROJECT STRUCTURE:
- .aicf/ - AI-optimized memory (pipe-delimited format)
  - index.aicf - Project overview
  - work-state.aicf - Current work status
  - conversations.aicf - Conversation history
  - decisions.aicf - Key decisions
  - technical-context.aicf - Architecture & patterns

- .ai/ - Human-readable memory (markdown)
  - project-overview.md
  - conversation-log.md
  - technical-decisions.md
  - next-steps.md
  - known-issues.md

WHAT TO UPDATE:
1. Add this conversation to conversations.aicf
2. Update work-state.aicf with current progress
3. Add any new decisions to decisions.aicf
4. Update conversation-log.md with session summary
5. Update next-steps.md with planned work

FORMAT: AICF v3.0.0 (pipe-delimited structured data)
REFERENCE: https://github.com/Vaeshkar/aicf-core

Please generate the updated files and show me the changes.
```

---

## Future: Browser Extension (Optional)

If we want automatic Claude/Web extraction in the future:

1. Create browser extension
2. Extension reads IndexedDB via browser API
3. Extension exports to .aicf/.ai files
4. User explicitly installs and grants permission
5. Fully transparent and safe

But this is **NOT needed for MVP**. Manual mode works great.

---

## Comparison: Manual vs Automatic

| Feature | Manual Mode | Automatic (Future) |
|---------|------------|-------------------|
| Setup | None | Browser extension |
| Transparency | Perfect | Good |
| Privacy | Excellent | Good |
| User control | Full | Full |
| Effort | Manual | Automatic |
| Complexity | Low | High |
| Maintenance | None | Extension updates |
| Works with any browser | ✅ | ✅ |
| Requires permission | ✅ | ✅ |

---

## Tips & Best Practices

### 1. Use Consistent Prompts

Save the export prompt as a template so you can reuse it.

### 2. Review Changes

Always review what Claude writes to memory files before committing.

### 3. Combine with Other Modes

You can use manual mode for Claude/Web AND automatic mode for Augment/Warp:

```
aicf init
# Choose: automatic mode
# Select: Augment, Warp
# Skip: Claude/Web (use manual mode)
```

### 4. Keep Memory Files Updated

Update memory files regularly (after each session) so they stay current.

### 5. Use Git History

Git history shows what changed in memory files, useful for auditing.

---

## Troubleshooting

### Claude doesn't update files correctly

- Make sure you're in the right project directory
- Provide the full path to memory files
- Show Claude an example of the AICF format

### Files get out of sync

- Update memory files after each session
- Use git to track changes
- Review diffs before committing

### Want to switch to automatic mode later

- Create a browser extension
- Install it
- Update aicf init to use automatic mode
- No changes needed to existing memory files

---

## References

- AICF Format: https://github.com/Vaeshkar/aicf-core
- Manual Mode: https://github.com/Vaeshkar/create-ai-chat-context
- Project: https://github.com/Vaeshkar/create-ai-chat-context-experimental
- Permission Strategy: docs/PERMISSION-AND-CONSENT-STRATEGY.md

