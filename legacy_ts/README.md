# Legacy TypeScript Files

**Status:** ❌ DEPRECATED  
**Date Moved:** October 25, 2025  
**Reason:** Replaced by Cache-First Architecture (Phase 6)

---

## What's Here

This folder contains the **old direct-extraction architecture** (Phase 5.5a) that was replaced by the **cache-first architecture** (Phase 6).

### Files

- **`BackgroundService.ts`** - Old background service that read Augment LevelDB and wrote directly to `.aicf/` files

---

## Why It Was Replaced

### Old Architecture (Phase 5.5a - Direct Extraction)
```
Augment LevelDB
    ↓
AugmentLevelDBReader
    ↓
BackgroundService (5-minute polling)
    ↓
Parse & Analyze
    ↓
.aicf/{conversationId}.aicf (DIRECT)
```

**Problems:**
- ❌ Hard to add new LLM platforms
- ❌ No cross-platform deduplication
- ❌ BackgroundService did too many things
- ❌ Poor separation of concerns

---

### New Architecture (Phase 6 - Cache-First)
```
Augment LevelDB → AugmentCacheWriter → .cache/llm/augment/chunk-*.json
Claude CLI      → ClaudeCacheWriter  → .cache/llm/claude/chunk-*.json
Warp            → WarpCacheWriter    → .cache/llm/warp/chunk-*.json
                        ↓
                CacheConsolidationAgent
                        ↓
                .aicf/recent/{conversationId}.aicf
```

**Benefits:**
- ✅ Easy to add new LLM platforms (just create new cache writer)
- ✅ Cross-platform deduplication in one place
- ✅ Better separation of concerns
- ✅ Better error recovery (chunks remain if consolidation fails)
- ✅ Scalable for multiple LLMs

---

## Migration Notes

### What Changed

1. **Removed `BackgroundService.ts`** from `src/services/`
2. **Removed imports** from `InitCommand.ts` and `MigrateCommand.ts`
3. **Updated `aice init`** to not start BackgroundService
4. **Updated `aice migrate`** to not start BackgroundService
5. **Users now run `aice watch`** to start the cache-first pipeline

### What Stayed the Same

- ✅ `AugmentLevelDBReader.ts` - Still used by `AugmentCacheWriter`
- ✅ `AugmentParser.ts` - Still used for parsing
- ✅ `ConversationOrchestrator.ts` - Still used for analysis
- ✅ `MemoryFileWriter.ts` - Still used for writing AICF files

---

## Should You Use This?

**NO.** This code is deprecated and should not be used.

Use the **Cache-First Architecture (Phase 6)** instead:
- `src/writers/AugmentCacheWriter.ts`
- `src/writers/ClaudeCacheWriter.ts`
- `src/agents/CacheConsolidationAgent.ts`

---

## Documentation

See:
- `PHASE-6-CACHE-FIRST-ARCHITECTURE.md` - Full Phase 6 documentation
- `PHASE-6-CACHE-FIRST-TESTING-REPORT.md` - Testing report
- `test-cache-pipeline.ts` - End-to-end test

---

**This folder exists for historical reference only. Do not use these files in production.**

