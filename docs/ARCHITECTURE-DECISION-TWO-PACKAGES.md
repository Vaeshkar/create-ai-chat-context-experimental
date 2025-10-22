# Architecture Decision: Two Packages (Option C)

**Decision Date:** 2025-10-22  
**Status:** APPROVED  
**Owner:** Dennis van Leeuwen

---

## Decision

Build aicf-watcher as a **separate package** from create-ai-chat-context.

### Two Packages

**Package 1: create-ai-chat-context** (v2.0.0 - unchanged)
- Manual mode only
- 4 commands: init, migrate, tokens, stats
- User controls everything
- User asks LLM to update memory files
- Minimal, focused, proven

**Package 2: create-ai-chat-context-experimental** (aicf-watcher)
- Automatic mode
- Extends create-ai-chat-context
- Reads LLM platform data automatically
- Creates .cache/llm/ (automated folder for LLM to read)
- Checkpoints update conversation automatically
- Permission & consent system

---

## Why Two Packages?

### Separation of Concerns
- Base package = Manual mode (user controls)
- Experimental package = Automatic mode (system controls)
- Each tool does one thing well

### Lower Maintenance
- Base package stays minimal (no watcher complexity)
- Experimental package is separate concern
- Easier to maintain and test independently

### Clear User Choice
- Users can choose which to use
- No forced complexity
- Both workflows work independently

### Gradual Adoption
- Users start with manual mode (create-ai-chat-context)
- Users can upgrade to automatic mode later (aicf-watcher)
- No re-initialization needed
- Existing .ai/ and .aicf/ files preserved

### Future Flexibility
- Can merge into single package later if needed
- No lock-in to two packages
- Can always consolidate based on user feedback

---

## Workflow Comparison

### Manual Mode (create-ai-chat-context)

```bash
$ npx create-ai-chat-context init
→ Creates .ai/, .aicf/, .ai-instructions, NEW_CHAT_PROMPT.md

User: "Update my memory files"
LLM: Reads .ai/ and .aicf/, updates them
User: git commit
```

**LLM reads:** .ai/, .aicf/  
**User controls:** Everything  
**Effort:** Manual (user asks LLM each time)

### Automatic Mode (aicf-watcher)

```bash
$ npx aicf init --automatic
→ Runs create-ai-chat-context init
→ Creates .cache/llm/, .permissions.aicf, .watcher-config.json
→ Starts watcher

Watcher: Automatically reads LLM platform data
Watcher: Updates .aicf/ files
LLM: Reads .ai/, .aicf/, .cache/llm/ for context
Checkpoints: Automatically update conversation
```

**LLM reads:** .ai/, .aicf/, .cache/llm/  
**System controls:** Automatic data capture  
**Effort:** Automatic (watcher runs every 5 minutes)

### Upgrade Path (Manual → Automatic)

```bash
User has been using manual mode for a while
User: "I want automatic mode now"

$ npx aicf init --automatic
→ Watcher starts
→ Existing .ai/ and .aicf/ files preserved
→ .cache/llm/ is created
→ Automatic mode takes over
```

**No re-initialization needed**  
**No data loss**  
**Seamless upgrade**

---

## File Structure

### After Manual Mode Init

```
project/
├── .ai/                          # Manual mode files
│   ├── README.md
│   ├── project-overview.md
│   ├── conversation-log.md
│   ├── technical-decisions.md
│   ├── next-steps.md
│   ├── design-system.md
│   └── code-style.md
│
├── .aicf/                        # AI-optimized memory
│   ├── index.aicf
│   ├── conversations.aicf
│   ├── decisions.aicf
│   └── README.md
│
├── .ai-instructions              # AI instructions
└── NEW_CHAT_PROMPT.md            # Chat template
```

### After Automatic Mode Init

```
project/
├── .ai/                          # Manual mode files (preserved)
├── .aicf/                        # AI-optimized memory (preserved)
├── .ai-instructions              # AI instructions (preserved)
├── NEW_CHAT_PROMPT.md            # Chat template (preserved)
│
├── .cache/llm/                   # NEW: Automated folder
│   ├── augment/
│   │   ├── .conversations/       # Augment cache
│   │   └── .meta/
│   ├── warp/
│   │   └── .warp-cache/          # Warp extracted data
│   └── claude/
│       └── .claude-cache/        # Claude Desktop (future)
│
├── .aicf/.permissions.aicf       # NEW: Permission tracking
├── .aicf/.watcher-config.json    # NEW: Watcher configuration
└── .watcher.pid                  # NEW: Watcher process ID
```

---

## Implementation Plan

### Phase 1: Keep Base Package As-Is
- ✅ create-ai-chat-context v2.0.0 (no changes)
- ✅ Users can use manual mode immediately
- ✅ No breaking changes

### Phase 2: Build aicf-watcher in -experimental
- ✅ aicf init (extends create-ai-chat-context)
- ✅ aicf watcher (automatic mode)
- ✅ .cache/llm/ (automated folder)
- ✅ Checkpoints (update conversation)
- ✅ Permission system
- ✅ Audit logging

### Phase 3: Optional - Merge Later
- ✅ If users want single package
- ✅ Can always do this later
- ✅ No rush, gather feedback first

---

## Benefits

✅ **Base package stays minimal** - Proven, focused, 4 commands  
✅ **Clear separation** - Manual vs Automatic modes  
✅ **User choice** - Can use either independently  
✅ **Gradual adoption** - Start manual, upgrade to automatic  
✅ **Lower maintenance** - Each tool does one thing well  
✅ **Future flexibility** - Can merge later if needed  
✅ **No breaking changes** - Base package unchanged  
✅ **Seamless upgrade** - Existing files preserved  

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Users confused about which package to use | Clear documentation, README, examples |
| Two packages to maintain | Separate concerns, easier to maintain |
| Installation complexity | Simple: `npx create-ai-chat-context init` or `npx aicf init` |
| Divergence between packages | Shared types, clear interfaces, tests |

---

## Next Steps

1. ✅ Document decision (THIS FILE)
2. Create InitCommand.ts in aicf-watcher
3. Create PermissionManager.ts
4. Create WatcherConfigManager.ts
5. Update CLI with `aicf init` command
6. Test both manual and automatic modes
7. Document in README

---

## References

- create-ai-chat-context: `/Users/leeuwen/Programming/create-ai-chat-context`
- aicf-watcher: `/Users/leeuwen/Programming/create-ai-chat-context-experimental`
- Permission Strategy: docs/PERMISSION-AND-CONSENT-STRATEGY.md
- Init Strategy: docs/INIT-COMMAND-STRATEGY.md
- Analysis: docs/CREATE-AI-CHAT-CONTEXT-ANALYSIS.md

