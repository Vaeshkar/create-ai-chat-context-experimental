# Cleanup & Integration Plan - Before Augment Extraction

## 📊 Current State Analysis

### `.aicf/` Folder
```
.aicf/
├── 6 individual conversation files (.aicf)
├── 1 chunk file (chunk-24.aicf) - LEFTOVER
├── 5 template/index files:
│   ├── conversations.aicf
│   ├── decisions.aicf
│   ├── issues.aicf
│   ├── technical-context.aicf
│   └── work-state.aicf
├── conversation-memory.aicf
├── design-system.aicf
├── config.json
└── .meta, .watcher-state.json, .watcher-events.aicf, .watcher.log, .watcher.error.log
```

### `.cache/llm/` Folder
```
.cache/llm/
├── augment/
│   └── 628 chunk files (3.2MB total)
└── claude/
    └── chunk files
```

### `.ai/` Folder
```
.ai/
├── 6 individual conversation files (.md)
├── code-style.md ✅ KEEP
├── design-system.md ✅ KEEP
├── npm-publishing-checklist.md ✅ KEEP
├── testing-philosophy.md ✅ KEEP
├── conversation-log.md ❌ DELETE
├── technical-decisions.md ❌ DELETE
├── known-issues.md ❌ DELETE
├── next-steps.md ❌ DELETE
└── {conversationId}.md files ❌ DELETE
```

---

## ✅ Integration Status

### AICF-Core
- ✅ **Imported:** `aicf-core: ^2.0.0` in package.json
- ✅ **Used in:** WatcherLogger.ts, WatcherManager.ts
- ✅ **Import:** `import { AICFWriter } from 'aicf-core'`
- ✅ **Status:** Ready to use

### MemoryFileWriter
- ✅ **Location:** `src/writers/MemoryFileWriter.ts`
- ✅ **Status:** Generates both AICF and Markdown
- ✅ **Tests:** 17 tests - All passing
- ✅ **Integration:** Ready with CacheConsolidationAgent

### CacheConsolidationAgent
- ✅ **Location:** `src/agents/CacheConsolidationAgent.ts`
- ✅ **Status:** Reads chunks, consolidates, writes memory files
- ✅ **Integration:** Uses MemoryFileWriter
- ✅ **Ready:** For Augment extraction

---

## 🧹 Cleanup Tasks

### Task 1: Delete Leftover Chunk Files
```bash
rm -f .aicf/chunk-*.aicf
```
**Reason:** These are leftover from previous failed extraction

### Task 2: Delete Cache Chunk Files (After Extraction)
```bash
rm -rf .cache/llm/augment/*.json
rm -rf .cache/llm/claude/*.json
```
**Reason:** Will be deleted automatically after processing in new pipeline

### Task 3: Clean `.ai/` Folder
```bash
# Keep only:
.ai/code-style.md
.ai/design-system.md
.ai/npm-publishing-checklist.md
.ai/testing-philosophy.md

# Delete:
.ai/conversation-log.md
.ai/technical-decisions.md
.ai/known-issues.md
.ai/next-steps.md
.ai/{conversationId}.md (all individual files)
```

### Task 4: Organize `.aicf/` Folder
```bash
mkdir -p .aicf/recent
mkdir -p .aicf/medium
mkdir -p .aicf/old
mkdir -p .aicf/archive

# Move existing conversations to recent/
mv .aicf/{conversationId}.aicf .aicf/recent/
```

---

## 🔧 Integration Verification

### 1. MemoryFileWriter + AICF-Core
**Status:** ✅ Ready
- MemoryFileWriter generates AICF content (pipe-delimited)
- AICF-Core's AICFWriter can read/write this format
- No changes needed

### 2. CacheConsolidationAgent + MemoryFileWriter
**Status:** ✅ Ready
- CacheConsolidationAgent reads chunks
- Uses MemoryFileWriter to generate AICF + Markdown
- Writes to `.aicf/` and `.ai/`
- No changes needed

### 3. Chunk Deletion Pipeline
**Status:** ⚠️ Needs Implementation
- After CacheConsolidationAgent processes chunk
- Delete chunk file automatically
- Add to `processChunk()` method

---

## 📋 Implementation Order

### Phase 1: Cleanup (5 minutes)
1. Delete `.aicf/chunk-*.aicf` (leftover files)
2. Delete `.ai/conversation-log.md`
3. Delete `.ai/technical-decisions.md`
4. Delete `.ai/known-issues.md`
5. Delete `.ai/next-steps.md`
6. Delete `.ai/{conversationId}.md` files
7. Create `.aicf/recent/`, `.aicf/medium/`, `.aicf/old/`, `.aicf/archive/`
8. Move existing `.aicf/{conversationId}.aicf` to `.aicf/recent/`

### Phase 2: Integration (10 minutes)
1. Verify MemoryFileWriter works with AICF-Core
2. Add chunk deletion to CacheConsolidationAgent
3. Test with 1 chunk
4. Verify output format

### Phase 3: Extraction (30 minutes)
1. Extract 10 test conversations
2. Verify format and organization
3. Get approval
4. Extract all 4,063 conversations
5. Verify cache cleanup

---

## ✅ Checklist Before Starting

- [ ] AICF-Core imported and working
- [ ] MemoryFileWriter ready
- [ ] CacheConsolidationAgent ready
- [ ] `.aicf/` folder cleaned
- [ ] `.ai/` folder cleaned (keep only 4 files)
- [ ] Folder structure created (recent/medium/old/archive)
- [ ] Chunk deletion logic added
- [ ] Ready to extract Augment conversations

---

## 🚀 Ready to Proceed?

Once cleanup is done:
1. Extract 10 test conversations
2. Verify format
3. Extract all 4,063 conversations
4. Verify cache cleanup
5. Done!

