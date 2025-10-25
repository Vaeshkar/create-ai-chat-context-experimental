# 🧪 Unit Tests Audit - What to Keep vs Remove

**Date:** 2025-10-25
**Context:** After Phase 6-8 completion and CLI cleanup, audit all 565 unit tests to remove obsolete ones.

---

## 📊 Summary

**Total Test Files:** 40
**Total Tests:** 565
**Keep:** 38 files (~548 tests) - Testing current architecture
**Remove:** 2 files (~17 tests) - Testing obsolete functionality

---

## 🗑️ REMOVE (2 test files, ~17 tests)

### **1. `src/commands/CheckpointProcessor.test.ts`** ❌

**Tests:** 9 tests
**What it tests:** Manual checkpoint processing command
**Why remove:**

- CheckpointProcessor marked for removal in CLI-CLEANUP-PLAN.md
- Automatic mode extracts from LLM libraries directly
- No need for manual checkpoint processing
- Bypasses new pipeline (writes to old unified files)

**Decision:** DELETE (obsolete functionality)

---

### **2. `src/integration.test.ts`** ❌

**Tests:** 8 tests
**What it tests:** Old Phase 3 checkpoint → analysis → memory file pipeline
**Why remove:**

- Tests old checkpoint-based workflow (Phase 3)
- Uses CheckpointProcessor (being removed)
- Tests old unified file format (replaced by session files)
- Replaced by `src/integration-phase4.test.ts` (Phase 4 automatic mode)

**Decision:** DELETE (obsolete architecture)

---

### **3. `src/parsers/ConversationSummaryParser.test.ts`** ✅ KEEP

**Tests:** 6 tests
**What it tests:** Parsing conversation summaries
**Why keep:**

- ✅ Used by ConversationOrchestrator (still in use)
- ✅ ConversationOrchestrator used by CacheConsolidationAgent (Phase 6)
- ✅ Part of current pipeline

**Decision:** KEEP (still in use)

---

## ✅ KEEP (37 test files, ~540 tests)

### **Category 1: Core Pipeline (Phase 6-8)** ✅

#### **Agents (3 files)**

1. `src/agents/AgentRouter.test.ts` (18 tests) - Routes conversations to correct agents ✅
2. `src/agents/AgentUtils.test.ts` (29 tests) - Agent utility functions ✅
3. _(No tests for CacheConsolidationAgent, SessionConsolidationAgent, MemoryDropoffAgent - should add!)_

#### **Writers (1 file)**

4. `src/writers/MemoryFileWriter.test.ts` (17 tests) - Writes AICF files ✅

---

### **Category 2: Commands (5 files)** ✅

5. `src/commands/InitCommand.test.ts` (22 tests) - Init command ✅
6. `src/commands/MigrateCommand.test.ts` (5 tests) - Migrate command ✅
7. `src/commands/WatcherCommand.test.ts` (9 tests) - Watcher command ✅
8. `src/commands/ImportClaudeCommand.test.ts` (10 tests) - Import Claude command ✅

---

### **Category 3: Core Systems (2 files)** ✅

9. `src/core/PermissionManager.test.ts` (20 tests) - Permission management ✅
10. `src/core/WatcherConfigManager.test.ts` (21 tests) - Watcher configuration ✅

---

### **Category 4: Extractors (5 files)** ✅

11. `src/extractors/ActionExtractor.test.ts` (12 tests) - Extract actions ✅
12. `src/extractors/DecisionExtractor.test.ts` (15 tests) - Extract decisions ✅
13. `src/extractors/FlowExtractor.test.ts` (10 tests) - Extract conversation flow ✅
14. `src/extractors/IntentExtractor.test.ts` (11 tests) - Extract user intent ✅
15. `src/extractors/StateExtractor.test.ts` (18 tests) - Extract state changes ✅
16. `src/extractors/TechnicalWorkExtractor.test.ts` (14 tests) - Extract technical work ✅

---

### **Category 5: Integration Tests (1 file)** ✅

17. `src/integration-phase4.test.ts` (12 tests) - Phase 4 automatic mode integration ✅

---

### **Category 6: Orchestrators (2 files)** ✅

18. `src/orchestrators/ConversationOrchestrator.test.ts` (14 tests) - Orchestrate conversation analysis ✅
19. `src/orchestrators/MultiClaudeOrchestrator.test.ts` (20 tests) - Orchestrate multi-Claude consolidation ✅

---

### **Category 7: Parsers (7 files)** ✅

20. `src/parsers/AugmentParser.test.ts` (18 tests) - Parse Augment LevelDB ✅
21. `src/parsers/ClaudeCliParser.test.ts` (19 tests) - Parse Claude CLI JSONL ✅
22. `src/parsers/ClaudeDesktopParser.test.ts` (14 tests, SKIPPED) - Parse Claude Desktop SQLite ✅
23. `src/parsers/ClaudeParser.test.ts` (13 tests) - Parse Claude export files ✅
24. `src/parsers/ConversationSummaryParser.test.ts` (6 tests) - Parse conversation summaries ⚠️
25. `src/parsers/GenericParser.test.ts` (23 tests) - Generic parser utilities ✅
26. `src/parsers/WarpParser.test.ts` (9 tests) - Parse Warp terminal ✅

---

### **Category 8: Services (1 file)** ✅

27. `src/services/MultiClaudeConsolidationService.test.ts` (13 tests) - Multi-Claude consolidation ✅

---

### **Category 9: Utils (10 files)** ✅

28. `src/utils/Archive.test.ts` (5 tests) - Archive utilities ✅
29. `src/utils/Config.test.ts` (9 tests) - Configuration management ✅
30. `src/utils/FileIOManager.test.ts` (16 tests) - File I/O operations ✅
31. `src/utils/FileValidator.test.ts` (19 tests) - File validation ✅
32. `src/utils/Logger.test.ts` (14 tests) - Logging utilities ✅
33. `src/utils/Templates.test.ts` (22 tests) - Template utilities ✅
34. `src/utils/TokenMonitor.test.ts` (15 tests) - Token monitoring ✅
35. `src/utils/TokenUtils.test.ts` (13 tests) - Token utilities ✅
36. `src/utils/WatcherLogger.test.ts` (21 tests) - Watcher logging ✅
37. `src/utils/WatcherManager.test.ts` (22 tests) - Watcher management ✅

---

### **Category 10: Watchers (2 files)** ✅

38. `src/watchers/ClaudeCliWatcher.test.ts` (14 tests) - Watch Claude CLI ✅
39. `src/watchers/ClaudeDesktopWatcher.test.ts` (11 tests, SKIPPED) - Watch Claude Desktop ✅

---

## 🎯 Recommendation

### **Action 1: Delete 2 obsolete test files**

```bash
# Remove obsolete test files
rm src/commands/CheckpointProcessor.test.ts
rm src/integration.test.ts
```

### **Action 2: Verified ConversationSummaryParser is still used** ✅

ConversationSummaryParser is used by:

- ConversationOrchestrator (used by CacheConsolidationAgent in Phase 6)
- Part of current pipeline

**Decision:** KEEP ConversationSummaryParser and its tests.

---

## 📝 Missing Tests (Should Add)

### **Critical Missing Tests:**

1. **`src/agents/CacheConsolidationAgent.test.ts`** - Tests Phase 6 cache consolidation ❌
2. **`src/agents/SessionConsolidationAgent.test.ts`** - Tests Phase 6.5 session consolidation ❌
3. **`src/agents/MemoryDropoffAgent.test.ts`** - Tests Phase 7 memory dropoff ❌

These are the **core agents** of the new architecture but have **no unit tests**!

**Recommendation:** Add these tests in a future session.

---

## ✅ Final State

After cleanup:

**Total Test Files:** 38 (down from 40)
**Total Tests:** ~548 (down from 565)

**Removed:**

- CheckpointProcessor.test.ts (9 tests) - Obsolete checkpoint command
- integration.test.ts (8 tests) - Old Phase 3 architecture

**Kept:**

- All 38 files testing current architecture
- All Phase 4-8 tests
- All parser, extractor, orchestrator tests
- ConversationSummaryParser.test.ts (still used by CacheConsolidationAgent)

**Result:** Clean test suite with only relevant tests! 🎉

---

## 🚨 Important Note

**Before removing tests, verify:**

1. CheckpointProcessor is not used anywhere else
2. ConversationSummaryParser is not used in automatic pipeline
3. All 4 core CLI commands still work after removal

**Run after cleanup:**

```bash
npm run build
npm test
aice init --automatic
aice watch
```
