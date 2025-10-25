# 🧪 Test Scripts Audit - What to Keep vs Remove

**Date:** 2025-10-25  
**Context:** After Phase 6-8 (Cache-First + Session Consolidation + aicf-core integration), many test scripts are obsolete.

---

## 📊 Summary

**Total Scripts:** 27  
**Keep:** 5 (useful for debugging/testing)  
**Remove:** 22 (obsolete, replaced by automated pipeline)

---

## ✅ KEEP (5 scripts)

### **1. `test-llm-memory-readability.ts`** ✅
**Purpose:** Tests if AI can read session files correctly  
**Why Keep:** Validates end-to-end memory readability (critical for LILL)  
**Status:** Still relevant - tests the final output format

### **2. `test-cache-pipeline.ts`** ✅
**Purpose:** Manually triggers cache-first pipeline  
**Why Keep:** Useful for debugging pipeline issues  
**Status:** Still relevant - tests Phase 6 architecture

### **3. `test-session-consolidation.ts`** ✅
**Purpose:** Tests SessionConsolidationAgent  
**Why Keep:** Useful for debugging session consolidation  
**Status:** Still relevant - tests Phase 6.5 architecture

### **4. `test-dropoff-agent.ts`** ✅
**Purpose:** Tests MemoryDropoffAgent  
**Why Keep:** Useful for debugging memory dropoff  
**Status:** Still relevant - tests Phase 7 architecture

### **5. `test-phase7-e2e.ts`** ✅
**Purpose:** End-to-end test of Phase 7 (memory dropoff)  
**Why Keep:** Validates complete pipeline  
**Status:** Still relevant - tests full Phase 6-7 flow

---

## 🗑️ REMOVE (22 scripts)

### **Category 1: Debugging Scripts (11 scripts)** - Obsolete

These were used during development to understand Augment LevelDB structure. Now replaced by automated extraction.

1. `check-augment-timestamps.ts` - Checked timestamp format (now automated)
2. `check-leveldb-structure.ts` - Inspected LevelDB structure (now automated)
3. `debug-augment-leveldb.ts` - Debugged LevelDB reading (now automated)
4. `debug-claude-watcher.ts` - Debugged Claude watcher (now automated)
5. `debug-workspace-filter.ts` - Debugged workspace filtering (now automated)
6. `find-workspace-id.ts` - Found workspace ID (now automated)
7. `inspect-keys.ts` - Inspected LevelDB keys (now automated)
8. `inspect-leveldb-keys.ts` - Inspected LevelDB keys (duplicate)
9. `inspect-leveldb.ts` - Inspected LevelDB (now automated)
10. `inspect-one-augment-record.ts` - Inspected single record (now automated)
11. `inspect-workspace-filter.ts` - Inspected workspace filter (now automated)

**Reason:** All replaced by `AugmentLevelDBReader` + `WatcherCommand` automatic extraction.

---

### **Category 2: Manual Consolidation Scripts (4 scripts)** - Obsolete

These were used to manually consolidate conversations before automatic pipeline existed.

12. `consolidate-augment-cache.ts` - Manual cache consolidation (now automated by `CacheConsolidationAgent`)
13. `consolidate-augment-conversations.ts` - Manual conversation consolidation (now automated)
14. `write-augment-to-aicf.ts` - Manual AICF writing (now automated by `MemoryFileWriter`)
15. `read-leveldb-readonly.ts` - Manual LevelDB reading (now automated by `AugmentLevelDBReader`)

**Reason:** All replaced by `WatcherCommand` automatic pipeline (runs every 5 minutes).

---

### **Category 3: Old Test Scripts (7 scripts)** - Obsolete

These tested old architectures that no longer exist.

16. `test-10-conversations-e2e.ts` - Tested old extraction (now automated)
17. `test-augment-parser.ts` - Tested old parser (now has proper unit tests in `src/parsers/AugmentParser.test.ts`)
18. `test-dropoff-sessions.ts` - Tested old dropoff (replaced by `test-dropoff-agent.ts`)
19. `test-extract-10-conversations.ts` - Tested old extraction (now automated)
20. `test-read-db.ts` - Tested old DB reading (now automated)
21. `test-single-conversation-workflow.ts` - Tested old workflow (now automated)
22. `test-timestamp-preservation.ts` - Tested timestamp preservation (now has proper unit tests)

**Reason:** All replaced by proper unit tests in `src/` or automated by pipeline.

---

### **Category 4: Utility Scripts (1 script)** - Obsolete

23. `count-conversations.ts` - Counted conversations manually (now automated by `WatcherCommand` stats)

**Reason:** Stats are now logged automatically by `WatcherCommand`.

---

## 🎯 Recommendation

### **Action 1: Delete 22 obsolete scripts**

```bash
# Category 1: Debugging scripts (11)
rm check-augment-timestamps.ts
rm check-leveldb-structure.ts
rm debug-augment-leveldb.ts
rm debug-claude-watcher.ts
rm debug-workspace-filter.ts
rm find-workspace-id.ts
rm inspect-keys.ts
rm inspect-leveldb-keys.ts
rm inspect-leveldb.ts
rm inspect-one-augment-record.ts
rm inspect-workspace-filter.ts

# Category 2: Manual consolidation scripts (4)
rm consolidate-augment-cache.ts
rm consolidate-augment-conversations.ts
rm write-augment-to-aicf.ts
rm read-leveldb-readonly.ts

# Category 3: Old test scripts (7)
rm test-10-conversations-e2e.ts
rm test-augment-parser.ts
rm test-dropoff-sessions.ts
rm test-extract-10-conversations.ts
rm test-read-db.ts
rm test-single-conversation-workflow.ts
rm test-timestamp-preservation.ts

# Category 4: Utility scripts (1)
rm count-conversations.ts
```

### **Action 2: Keep 5 useful scripts**

These remain useful for debugging and testing:
- `test-llm-memory-readability.ts` - Validates AI readability
- `test-cache-pipeline.ts` - Tests Phase 6 pipeline
- `test-session-consolidation.ts` - Tests Phase 6.5 consolidation
- `test-dropoff-agent.ts` - Tests Phase 7 dropoff
- `test-phase7-e2e.ts` - Tests full pipeline

---

## 📝 Notes

**Why so many scripts?**
- These were created during Phase 6-7 development to understand and debug the Augment LevelDB format
- They were essential for building the automatic extraction system
- Now that automatic extraction works, they're no longer needed

**What replaced them?**
- **Automatic extraction:** `WatcherCommand` runs every 5 minutes
- **Proper unit tests:** All parsers/agents have tests in `src/`
- **Built-in stats:** `WatcherCommand` logs stats automatically

**Are we losing anything?**
- No! All functionality is now automated or properly tested
- The 5 scripts we're keeping are sufficient for debugging

---

## ✅ Final State

After cleanup:
```
Root directory:
├── test-llm-memory-readability.ts    ✅ Keep (validates AI readability)
├── test-cache-pipeline.ts            ✅ Keep (tests Phase 6)
├── test-session-consolidation.ts     ✅ Keep (tests Phase 6.5)
├── test-dropoff-agent.ts             ✅ Keep (tests Phase 7)
└── test-phase7-e2e.ts                ✅ Keep (tests full pipeline)

All other test scripts: REMOVED ✅
```

**Result:** Clean root directory with only essential test scripts! 🎉

