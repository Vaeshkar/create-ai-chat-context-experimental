# 🧹 CLI Cleanup Plan

**Date:** October 25, 2025  
**Status:** Approved by Dennis

---

## ✅ **KEEP - Core Pipeline Commands**

These 4 commands are fully connected to the Phase 6+ Cache-First Pipeline:

### **1. `aice init`**
- **Purpose:** Initialize project with automatic conversation capture
- **Status:** ✅ WORKING
- **Pipeline:** Starts WatcherCommand with full pipeline
- **Keep:** YES

### **2. `aice migrate`**
- **Purpose:** Migrate from old create-ai-chat-context to automatic mode
- **Status:** ✅ WORKING
- **Pipeline:** Starts WatcherCommand with full pipeline
- **Keep:** YES

### **3. `aice watch`**
- **Purpose:** Run background watcher (every 5 minutes)
- **Status:** ✅ WORKING (JUST FIXED - added SessionConsolidationAgent)
- **Pipeline:** Full cache-first pipeline
  1. writeLLMDataToCache() → .cache/llm/
  2. consolidateCacheChunks() → .aicf/recent/
  3. consolidateSessionFiles() → .aicf/sessions/ ✅
  4. runMemoryDropoff() → .aicf/medium/old/archive/
- **Keep:** YES

### **4. `aice permissions <action> [platform]`**
- **Purpose:** Manage platform permissions (list, grant, revoke)
- **Status:** ✅ WORKING
- **Pipeline:** Manages .permissions.aicf for WatcherCommand
- **Keep:** YES

---

## 🗑️ **REMOVE - Not Needed**

### **Old CLI (bin/cli.js) - 12+ commands**

**File:** `bin/cli.js`  
**Status:** OLD ARCHITECTURE (Phase 1-4)  
**Decision:** REMOVE

**Commands to remove:**
1. `aic tokens` - Token usage display
2. `aic archive` - Archive old conversations
3. `aic summary` - Generate summaries
4. `aic validate` - Validate knowledge base
5. `aic search` - Search knowledge base
6. `aic stats` - Show statistics
7. `aic export` - Export knowledge base
8. `aic update` - Update with latest conversation
9. `aic finish` - Finish session
10. `aic convert` - Convert formats
11. `aic cursor` - Generate Cursor rules
12. `aic copilot` - Generate Copilot instructions
13. `aic claude-project` - Generate Claude project
14. `aic install-hooks` - Install git hooks
15. `aic config` - Configuration management
16. `aic aicf-migrate` - AICF migration
17. `aic context` - Context management
18. `aic checkpoint-process` - Process checkpoints
19. `aic memory-decay` - Memory decay processing

**Reason:** 
- Old architecture (manual mode)
- Automatic mode handles everything
- AI can read files directly (no need for search/stats/export)
- Not connected to new pipeline

**Action:** 
- Delete `bin/cli.js`
- Remove from package.json if referenced
- Update documentation

---

### **Checkpoint Command**

**File:** `src/commands/CheckpointProcessor.ts`  
**Command:** `aice checkpoint <file>`  
**Status:** LEGACY SUPPORT  
**Decision:** REMOVE

**Reason:**
- Automatic mode extracts from LLM libraries directly
- No need for manual checkpoint processing
- Bypasses new pipeline (writes to old unified files)

**Action:**
- Delete `src/commands/CheckpointProcessor.ts`
- Delete `src/commands/CheckpointProcessor.test.ts`
- Remove from `src/cli.ts`
- Remove from `src/index.ts` exports

---

## ⏳ **KEEP FOR FUTURE - Work on Later**

### **Import Claude Command**

**File:** `src/commands/ImportClaudeCommand.ts`  
**Command:** `aice import-claude <file>`  
**Status:** PARTIALLY WORKING  
**Decision:** KEEP (enhance later)

**Current behavior:**
- Reads Claude export files
- Writes to `.cache/llm/claude/`
- ✅ Correct (uses cache-first approach)
- ⚠️ Doesn't trigger consolidation

**Future enhancement:**
- After writing to cache, trigger:
  1. `CacheConsolidationAgent.consolidate()`
  2. `SessionConsolidationAgent.consolidate()`
  3. `MemoryDropoffAgent.dropoff()`

**Priority:** LOW (can work on when needed)

**Action:** 
- Keep as-is for now
- Add TODO comment for future enhancement
- Document in CLI-COMMANDS.md

---

## 📋 **CLEANUP CHECKLIST**

### **Phase 1: Remove Old CLI**
- [ ] Delete `bin/cli.js`
- [ ] Remove any references in package.json
- [ ] Update README.md (remove old commands)
- [ ] Update CLI-COMMANDS.md (remove old commands)

### **Phase 2: Remove Checkpoint Command**
- [ ] Delete `src/commands/CheckpointProcessor.ts`
- [ ] Delete `src/commands/CheckpointProcessor.test.ts`
- [ ] Remove from `src/cli.ts` (command registration)
- [ ] Remove from `src/index.ts` (exports)
- [ ] Update CLI-COMMANDS.md

### **Phase 3: Document Import Claude**
- [ ] Add TODO comment in `ImportClaudeCommand.ts`
- [ ] Document current behavior in CLI-COMMANDS.md
- [ ] Note future enhancement needed

### **Phase 4: Update Documentation**
- [ ] Update README.md with final 4 commands
- [ ] Update CLI-COMMANDS.md with final 4 commands
- [ ] Update USER-JOURNEY-COMPLETE.md
- [ ] Remove references to old commands

### **Phase 5: Test**
- [ ] Run `npm run build`
- [ ] Run `npm test`
- [ ] Test all 4 core commands
- [ ] Verify no broken imports

---

## 🎯 **FINAL CLI STRUCTURE**

```bash
# Core Commands (4 total)
aice init [--automatic|--manual] [--force] [--verbose]
aice migrate [--verbose]
aice watch [--interval <ms>] [--verbose] [--daemon|--foreground]
aice permissions <list|grant|revoke> [platform]

# Future Enhancement (1 total)
aice import-claude <file> [--output <dir>] [--verbose]
```

**Total:** 5 commands (4 core + 1 future)

**Philosophy:**
- Automatic mode handles everything
- AI reads files directly (no need for search/stats/export)
- Simple, focused CLI
- Pipeline-first architecture

---

## ✅ **APPROVAL**

**Approved by:** Dennis van Leeuwen  
**Date:** October 25, 2025  
**Decision:**
- ✅ Keep 4 core pipeline commands
- 🗑️ Remove old CLI (bin/cli.js)
- 🗑️ Remove checkpoint command
- ⏳ Keep import-claude for future enhancement
- ❌ No need for search/stats/export (AI can do this)

**Next Steps:**
1. Execute cleanup checklist
2. Update documentation
3. Test and verify
4. Commit and tag release

---

**This cleanup will result in a clean, focused CLI that's 100% connected to the new Cache-First Pipeline!** 🚀

