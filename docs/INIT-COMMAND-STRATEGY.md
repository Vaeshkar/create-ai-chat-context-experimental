# Init Command Strategy: aicf-watcher vs create-ai-chat-context

## Current State

### create-ai-chat-context (Basic Package)
- **Purpose**: Manual knowledge base system
- **Scope**: Creates `.ai/` and `.aicf/` directories with templates
- **Approach**: User manually updates files
- **Complexity**: Low (299 lines of init.js)
- **Features**:
  - Auto-detects project type (32 templates)
  - Creates 7 essential markdown files
  - Creates `.ai-instructions` and `NEW_CHAT_PROMPT.md`
  - Checks for existing files (prevents overwrites)
  - Token usage warnings

### aicf-watcher (This Project)
- **Purpose**: Automatic memory consolidation system
- **Scope**: Reads LLM platform data, processes conversations
- **Approach**: Automatic + manual modes
- **Complexity**: High (multi-platform, permission handling)
- **Current Status**: No init command yet

---

## Recommendation: Hybrid Approach

**Use create-ai-chat-context's init as the BASE, then extend it for aicf-watcher.**

### Why?

1. **Don't reinvent the wheel** - create-ai-chat-context already has:
   - Solid project type detection
   - 32 templates
   - File existence checks
   - Good UX

2. **Separation of concerns**:
   - create-ai-chat-context = Manual mode setup
   - aicf-watcher = Automatic mode setup

3. **Reusability** - Users can use create-ai-chat-context standalone OR with aicf-watcher

---

## Implementation Plan

### Phase 1: Create aicf init Command (NEW)

Build on top of create-ai-chat-context's init, add:

```bash
aicf init
```

This should:

1. **Run create-ai-chat-context init first**
   - Creates `.ai/` and `.aicf/` directories
   - Sets up templates
   - Creates `.ai-instructions`

2. **Then add aicf-watcher specific setup**:
   - Ask: "Automatic or Manual mode?"
   - If Automatic:
     - Ask: "Which LLMs do you use?"
     - Create `.cache/llm/{platform}/` directories
     - Create `.aicf/.permissions.aicf`
     - Create watcher config
   - If Manual:
     - Link to create-ai-chat-context docs
     - Done

3. **Create `.aicf/.permissions.aicf`**
   ```
   @PERMISSIONS|timestamp=2025-10-22T10:00:00Z|mode=automatic|version=1.0
   
   @PLATFORM_CONSENT
   platform=augment|status=granted|timestamp=2025-10-22T10:00:00Z
   platform=warp|status=granted|timestamp=2025-10-22T10:00:00Z
   platform=claude|status=denied|timestamp=2025-10-22T10:00:00Z
   
   @DATA_RETENTION
   retention_days=90|auto_delete=true
   ```

4. **Create watcher config**
   ```
   .aicf/.watcher-config.json
   {
     "mode": "automatic",
     "interval": 300000,
     "platforms": {
       "augment": { "enabled": true, "path": ".cache/llm/augment/" },
       "warp": { "enabled": true, "path": "~/Library/Group Containers/..." },
       "claude": { "enabled": false }
     }
   }
   ```

---

## File Structure After `aicf init`

```
project/
├── .ai/                          # Manual mode files (from create-ai-chat-context)
│   ├── README.md
│   ├── project-overview.md
│   ├── conversation-log.md
│   ├── technical-decisions.md
│   ├── next-steps.md
│   ├── design-system.md
│   └── code-style.md
│
├── .aicf/                        # AI-optimized memory (from create-ai-chat-context)
│   ├── index.aicf
│   ├── conversations.aicf
│   ├── decisions.aicf
│   ├── .permissions.aicf         # NEW: Permission tracking
│   └── .watcher-config.json      # NEW: Watcher configuration
│
├── .cache/llm/                   # NEW: Platform-specific caches
│   ├── augment/
│   │   ├── .conversations/       # Symlink or copy from Augment cache
│   │   └── .meta/
│   ├── warp/
│   │   └── .warp-cache/          # Extracted from Warp SQLite
│   └── claude/
│       └── .claude-cache/        # Future: Claude Desktop
│
├── .ai-instructions              # From create-ai-chat-context
├── NEW_CHAT_PROMPT.md            # From create-ai-chat-context
└── .gitignore                    # Updated to ignore .cache/
```

---

## Init Flow Diagram

```
aicf init
  │
  ├─→ Run create-ai-chat-context init
  │   ├─→ Detect project type
  │   ├─→ Create .ai/ directory
  │   ├─→ Create .aicf/ directory
  │   └─→ Create .ai-instructions, NEW_CHAT_PROMPT.md
  │
  └─→ Ask: "Automatic or Manual mode?"
      │
      ├─→ MANUAL MODE
      │   └─→ Done! (use create-ai-chat-context workflow)
      │
      └─→ AUTOMATIC MODE
          ├─→ Ask: "Which LLMs do you use?"
          │   ├─→ Augment? (Y/N)
          │   ├─→ Warp? (Y/N)
          │   ├─→ Claude Desktop? (Y/N)
          │   ├─→ Claude Web? (Y/N)
          │   ├─→ Copilot? (Y/N)
          │   └─→ ChatGPT? (Y/N)
          │
          ├─→ Create .cache/llm/{platform}/ directories
          ├─→ Create .aicf/.permissions.aicf
          ├─→ Create .aicf/.watcher-config.json
          ├─→ Update .gitignore
          └─→ Done! (watcher will auto-start)
```

---

## Implementation Steps

1. **Create InitCommand.ts** (extends create-ai-chat-context init)
   - Call create-ai-chat-context init first
   - Add aicf-watcher specific setup

2. **Create PermissionManager.ts**
   - Read/write `.aicf/.permissions.aicf`
   - Track platform consent
   - Audit logging

3. **Create WatcherConfigManager.ts**
   - Read/write `.aicf/.watcher-config.json`
   - Manage platform settings
   - Enable/disable platforms

4. **Update CLI** (bin/cli.ts)
   - Add `aicf init` command
   - Link to create-ai-chat-context for manual mode

5. **Update .gitignore**
   - Add `.cache/llm/` (but not `.cache/llm/*/`)
   - Add `.watcher.pid`
   - Add `.watcher.log`

---

## Benefits of This Approach

✅ **Reuses proven code** - create-ai-chat-context already works well
✅ **Clear separation** - Manual vs Automatic modes are distinct
✅ **User choice** - Can use either system independently
✅ **Gradual adoption** - Start with manual, upgrade to automatic
✅ **Lower maintenance** - Less code to maintain
✅ **Better UX** - Familiar workflow for existing users

---

## Next Steps

1. Create InitCommand.ts that extends create-ai-chat-context
2. Create PermissionManager.ts for consent tracking
3. Create WatcherConfigManager.ts for platform settings
4. Update CLI with `aicf init` command
5. Test with both automatic and manual modes
6. Document in README

---

## References

- create-ai-chat-context: https://github.com/Vaeshkar/create-ai-chat-context
- Permission Strategy: docs/PERMISSION-AND-CONSENT-STRATEGY.md
- Claude/Web Guide: CLAUDE-WEB.md
- Warp Integration: WARP.md

