# Permission & Consent Strategy

## Overview

The memory consolidation system can operate in two modes:

1. **Automatic Mode** (aicf-watcher) - Reads LLM platform data automatically
2. **Manual Mode** (create-ai-chat-context) - User manually updates memory files

This document outlines the permission and consent requirements for each mode.

---

## Mode 1: Automatic Mode (aicf-watcher)

### What It Does
- Scans LLM platform directories for new conversations
- Extracts conversation data from:
  - Augment VSCode: `.cache/llm/augment/.conversations/`
  - Warp Terminal: `~/Library/Group Containers/2BBY89MBSN.dev.warp/.../warp.sqlite`
  - Claude Desktop: `~/Library/Application Support/Claude/...`
  - Claude Web: Browser storage (if accessible)
  - Copilot: `~/AppData/Local/Microsoft/Copilot/...`
  - ChatGPT: Browser storage (if accessible)
- Processes conversations into `.aicf/` and `.ai/` memory files
- Runs every 5 minutes (configurable)

### Why It Needs Permission
- Reads private data from LLM applications
- Accesses user's home directory
- Reads SQLite databases
- Processes potentially sensitive conversations

### Consent Flow

#### At `aicf init`

```
🔐 PERMISSION & CONSENT
═══════════════════════════════════════════════════════════════════════════

This project uses aicf-watcher to automatically capture AI conversations
and consolidate them into memory files (.aicf/ and .ai/).

TWO MODES AVAILABLE:

1️⃣  AUTOMATIC MODE (Recommended for power users)
   ✅ Automatically reads LLM platform data
   ✅ Processes conversations every 5 minutes
   ✅ Keeps memory files always up-to-date
   ⚠️  Requires permission to access:
       - Augment VSCode extension data
       - Warp Terminal SQLite database
       - Claude Desktop/Web data
       - Copilot data
       - ChatGPT data

2️⃣  MANUAL MODE (Recommended for privacy-conscious users)
   ✅ You control what gets captured
   ✅ No automatic data access
   ✅ You ask LLM to update memory files
   ✅ Full transparency and control
   ⚠️  Requires manual effort each session

═══════════════════════════════════════════════════════════════════════════

Which mode would you prefer? (automatic/manual)
```

#### If User Chooses Automatic Mode

```
🔐 AUTOMATIC MODE - DETAILED PERMISSIONS
═══════════════════════════════════════════════════════════════════════════

Which LLM platforms do you use? (Select all that apply)

[ ] Augment VSCode
    Location: .cache/llm/augment/.conversations/
    Access: Read-only JSON files
    Data: Conversation chunks

[ ] Warp Terminal
    Location: ~/Library/Group Containers/2BBY89MBSN.dev.warp/.../warp.sqlite
    Access: Read-only SQLite database
    Data: AI queries and responses

[ ] Claude Desktop
    Location: ~/Library/Application Support/Claude/...
    Access: Read-only database files
    Data: Conversation history

[ ] Claude Web
    Location: Browser storage
    Access: Browser extension (if available)
    Data: Conversation history

[ ] Copilot
    Location: ~/AppData/Local/Microsoft/Copilot/...
    Access: Read-only files
    Data: Conversation history

[ ] ChatGPT
    Location: Browser storage
    Access: Browser extension (if available)
    Data: Conversation history

═══════════════════════════════════════════════════════════════════════════

By selecting platforms above, you grant aicf-watcher permission to:
  ✅ Read conversation data from selected platforms
  ✅ Extract and process conversations
  ✅ Store processed data in .aicf/ and .ai/ folders
  ✅ Run automatic processing every 5 minutes

You can revoke permissions at any time by running:
  $ aicf permissions revoke

═══════════════════════════════════════════════════════════════════════════
```

#### If User Chooses Manual Mode

```
📝 MANUAL MODE - SETUP COMPLETE
═══════════════════════════════════════════════════════════════════════════

Manual mode is now active. Here's how to use it:

1. Have a conversation with your LLM (Augment, Warp, Claude, etc.)

2. When done, ask the LLM to update your memory files:

   "Please update my project memory files. Here's the context:
   
   - Project: create-ai-chat-context-experimental
   - Location: /Users/leeuwen/Programming/create-ai-chat-context-experimental
   - Memory format: AICF (AI Context Format)
   
   Update these files:
   - .aicf/work-state.aicf (current work status)
   - .aicf/conversations.aicf (conversation history)
   - .aicf/decisions.aicf (key decisions)
   - .ai/conversation-log.md (human-readable log)
   - .ai/next-steps.md (planned work)
   
   See: https://github.com/Vaeshkar/create-ai-chat-context"

3. The LLM will update your memory files directly

4. Commit the changes to git

Benefits:
  ✅ Full transparency - you see exactly what's captured
  ✅ Full control - you decide what to share
  ✅ No automatic data access
  ✅ Privacy-first approach
  ✅ Works with any LLM

═══════════════════════════════════════════════════════════════════════════
```

---

## Mode 2: Manual Mode (create-ai-chat-context)

### What It Does
- User asks LLM to update memory files
- LLM reads `.aicf/` and `.ai/` files
- LLM updates memory based on conversation
- User commits changes to git

### Why It's Safe
- No automatic data access
- User explicitly asks for updates
- LLM only sees what user shares
- Full transparency
- User has complete control

### Setup
- Link to: https://github.com/Vaeshkar/create-ai-chat-context
- Instructions in project README
- Example prompts provided

---

## Consent Storage

### `.aicf/.permissions.aicf`

```
@PERMISSIONS|timestamp=2025-10-22T10:00:00Z|mode=automatic|version=1.0

@PLATFORM_CONSENT
platform=augment|status=granted|timestamp=2025-10-22T10:00:00Z|reason=user_selected
platform=warp|status=granted|timestamp=2025-10-22T10:00:00Z|reason=user_selected
platform=claude|status=denied|timestamp=2025-10-22T10:00:00Z|reason=user_declined

@DATA_RETENTION
retention_days=90|auto_delete=true|user_can_delete=true

@AUDIT_LOG
timestamp=2025-10-22T10:05:00Z|event=warp_scan|status=success|conversations_found=14
timestamp=2025-10-22T10:05:30Z|event=augment_scan|status=success|conversations_found=32
timestamp=2025-10-22T10:06:00Z|event=claude_scan|status=denied|reason=no_permission
```

---

## Legal & Privacy

### What We Do
- ✅ Read conversation data from LLM platforms
- ✅ Extract and process conversations
- ✅ Store processed data locally in `.aicf/` and `.ai/`
- ✅ Log all access attempts

### What We Don't Do
- ❌ Write to LLM platform data
- ❌ Share data with third parties
- ❌ Upload data to cloud
- ❌ Modify LLM platform behavior
- ❌ Access data without permission

### User Rights
- ✅ Full ownership of extracted data
- ✅ Can revoke permissions anytime
- ✅ Can delete extracted data anytime
- ✅ Can switch to manual mode anytime
- ✅ Can audit all access logs

### Data Retention
- Default: 90 days
- User configurable
- Auto-delete old data
- User can manually delete anytime

---

## Implementation Checklist

- [ ] Create permission consent flow in `aicf init`
- [ ] Store consent in `.aicf/.permissions.aicf`
- [ ] Add `aicf permissions` command
- [ ] Add audit logging to watcher
- [ ] Create privacy policy in README
- [ ] Add manual mode instructions
- [ ] Create example prompts for LLMs
- [ ] Add data deletion command
- [ ] Add permission revocation command
- [ ] Document in WARP.md, CLAUDE.md, etc.

---

## References

- Manual mode: https://github.com/Vaeshkar/create-ai-chat-context
- AICF Format: https://github.com/Vaeshkar/aicf-core
- Privacy Policy: (to be created)

