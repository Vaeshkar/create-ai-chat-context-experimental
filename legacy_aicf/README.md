# Legacy AICF Files (Phase 1 JavaScript)

These files are from the **OLD ARCHITECTURE** (Phase 1 - JavaScript implementation).

## 🗂️ Files Moved Here

- `conversations.aicf` - Old conversation history format
- `technical-context.aicf` - Old technical insights format
- `work-state.aicf` - Old work state format
- `design-system.aicf` - Old design decisions format

## ❌ Why They're Not Used Anymore

**Phase 1 (JavaScript):**
```
BackgroundService → MemoryFileWriter → .aicf/conversations.aicf
                                    → .aicf/technical-context.aicf
                                    → .aicf/work-state.aicf
                                    → .aicf/design-system.aicf
```

**Phase 6 (TypeScript - Cache-First):**
```
AugmentCacheWriter → .cache/llm/augment/chunk-*.json
ClaudeCacheWriter  → .cache/llm/claude/chunk-*.json
                           ↓
              CacheConsolidationAgent
                           ↓
              .aicf/recent/{date}_{conversationId}.aicf
```

## 🎯 New Architecture

**All conversations now go to:**
- `.aicf/recent/{date}_{conversationId}.aicf` - Individual conversation files

**Future (MemoryDropoffAgent):**
- `.aicf/medium/` - 7-30 days old (compressed)
- `.aicf/old/` - 30-90 days old (more compressed)
- `.aicf/archive/` - 90+ days old (single line summaries)

## 🔧 AgentRouter

The `AgentRouter` class still references these files for **future specialized routing**, but it's not implemented yet:

```typescript
// Future: Route different content types to specialized files
technical_insight → .aicf/technical-context.aicf
task_progress → .aicf/work-state.aicf
design_decision → .aicf/design-system.aicf
```

**Current behavior:** All content goes to `.aicf/recent/{conversationId}.aicf`

---

**These files are kept for reference only. They are NOT used by the current system.**

