# Cleanup: Removed Legacy Unified Files

**Date:** 2025-10-25
**Issue:** Unwanted `.aicf` files being written to `.aicf/` root folder

---

## 🔍 **Problem**

Four unified files were being written to `.aicf/` root folder:

- `conversations.aicf` (6.0KB)
- `technical-context.aicf` (3.4KB)
- `design-system.aicf` (2.3KB)
- `work-state.aicf` (2.8KB)

These files were from the **OLD architecture** (Phase 5 and earlier) where all conversations were written to unified files instead of individual session files.

---

## 🕵️ **Root Cause**

The files were being written by **legacy JavaScript watchers** from Phase 5:

### **Legacy Watchers (OLD - Phase 5)**

```
legacy-js/watch-augment.js
    ↓
CheckpointOrchestrator
    ↓
IntelligentConversationParser
    ↓
Writes to unified files:
  - conversations.aicf
  - technical-context.aicf
  - design-system.aicf
  - work-state.aicf
```

### **New TypeScript Watchers (NEW - Phase 6+)**

```
src/commands/WatcherCommand.ts
    ↓
CacheConsolidationAgent
    ↓
MemoryFileWriter
    ↓
Writes to individual files:
  - .aicf/recent/{date}_{conversationId}.aicf
```

### **What Happened:**

Multiple legacy watcher processes were still running in the background:

```bash
leeuwen 25281  node .../cli.js watch --claude-cli
leeuwen 23576  node .../cli.js watch --augment
leeuwen 17022  node .../cli.js watch --augment --claude-desktop --warp
leeuwen 15986  node .../cli.js watch --augment
leeuwen 33955  node .../watch-augment.js  # ← Legacy JavaScript watcher!
```

These old watchers were using the **Phase 5 architecture** which writes to unified files.

---

## ✅ **Solution**

1. **Stopped the watcher** (killed any background processes)
2. **Deleted the unified files:**

   ```bash
   rm -f .aicf/conversations.aicf
   rm -f .aicf/technical-context.aicf
   rm -f .aicf/design-system.aicf
   rm -f .aicf/work-state.aicf
   ```

3. **Verified clean state:**
   ```
   .aicf/
   ├── .watcher-events.aicf  ✅ (watcher logs only)
   ├── sessions/             ✅ (Phase 6.5 session files)
   ├── medium/               ✅ (Phase 7 compressed files)
   ├── old/                  ✅ (Phase 7 compressed files)
   └── archive/              ✅ (Phase 7 compressed files)
   ```

---

## 📋 **Current Architecture (Phase 6.5 + 7)**

### **Correct File Structure:**

```
.aicf/
├── recent/                 # Empty (ready for new conversations from cache)
├── sessions/               # Session files (0-2 days, FULL format)
│   ├── 2025-10-24-session.aicf
│   └── 2025-10-25-session.aicf
├── medium/                 # Compressed sessions (2-7 days, SUMMARY format)
│   ├── 2025-10-21-session.aicf
│   ├── 2025-10-22-session.aicf
│   └── 2025-10-23-session.aicf
├── old/                    # Old sessions (7-14 days, KEY_POINTS format)
└── archive/                # Archive sessions (14+ days, SINGLE_LINE format)
```

### **Watcher Files (OK to keep):**

```
.aicf/
├── .watcher-events.aicf    # Watcher event log (uses aicf-core)
├── .watcher-state.json     # Watcher state
├── .watcher.log            # Watcher console log
└── .watcher.error.log      # Watcher error log
```

---

## 🚫 **Files That Should NOT Exist**

These are from the OLD architecture and should be deleted if they appear:

- ❌ `.aicf/conversations.aicf` (unified conversation file)
- ❌ `.aicf/technical-context.aicf` (unified technical insights)
- ❌ `.aicf/design-system.aicf` (unified design decisions)
- ❌ `.aicf/work-state.aicf` (unified work state)
- ❌ `.aicf/decisions.aicf` (unified decisions)
- ❌ `.aicf/memories.aicf` (unified memories)
- ❌ `.aicf/tasks.aicf` (unified tasks)
- ❌ `.aicf/issues.aicf` (unified issues)

---

## 🔧 **How to Prevent This**

### **1. Always use the NEW TypeScript watchers**

**✅ CORRECT (Phase 6+ TypeScript):**

```bash
# Use the new TypeScript CLI
aice watch --augment
aice watch --claude-cli
aice watch --claude-desktop
aice watch --warp
```

**❌ WRONG (Phase 5 Legacy JavaScript):**

```bash
# DON'T use these old commands
node legacy-js/watch-augment.js
node watch-augment.js
npm run watch  # if it points to legacy code
```

### **2. Kill all legacy watcher processes before starting new ones**

```bash
# Find all watcher processes
ps aux | grep -E "watch-augment|cli.js watch" | grep -v grep

# Kill them all
pkill -f "watch-augment"
pkill -f "cli.js watch"
```

### **3. Don't use `aicf-core` for conversation data**

The `aicf-core` package is designed for the OLD unified file architecture. Only use it for watcher events:

```typescript
// ✅ GOOD: Use for watcher events only
const aicfWriter = new AICFWriter('.aicf');
await aicfWriter.appendLine('.watcher-events.aicf', eventData);

// ❌ BAD: Don't use for conversation data
await aicfWriter.writeConversation(conversationData); // Writes to conversations.aicf
await aicfWriter.writeDecision(decisionData); // Writes to decisions.aicf
```

### **4. Use MemoryFileWriter for conversation data**

Our custom `MemoryFileWriter` writes to the correct location:

```typescript
// ✅ GOOD: Use MemoryFileWriter for conversations
const writer = new MemoryFileWriter();
writer.writeAICF(conversationId, content, cwd, timestamp);
// Writes to: .aicf/recent/{date}_{conversationId}.aicf
```

### **5. Use SessionConsolidationAgent for session files**

```typescript
// ✅ GOOD: Use SessionConsolidationAgent for session consolidation
const agent = new SessionConsolidationAgent('.aicf/recent', '.aicf/sessions');
await agent.consolidate();
// Writes to: .aicf/sessions/{date}-session.aicf
```

### **6. Use MemoryDropoffAgent for compression**

```typescript
// ✅ GOOD: Use MemoryDropoffAgent for age-based compression
const agent = new MemoryDropoffAgent('.aicf');
await agent.runDropoff();
// Moves files: sessions/ → medium/ → old/ → archive/
```

---

## 📊 **Storage After Cleanup**

**Before:**

- `.aicf/recent/`: 10,260 files, 92MB ❌
- `.aicf/` root: 4 unified files, 14KB ❌
- **Total: 93MB**

**After:**

- `.aicf/recent/`: 0 files, 0B ✅ (empty, ready for new conversations)
- `.aicf/sessions/`: 2 files, 116KB ✅
- `.aicf/medium/`: 4 files, 116KB ✅
- `.aicf/old/`: 1 file, 4KB ✅
- `.aicf/archive/`: 1 file, 4KB ✅
- `.aicf/` root: 0 unified files ✅
- **Total: 1.1MB** (98.8% reduction!)

---

## ✅ **Verification**

To verify the cleanup worked:

```bash
# Check for unwanted unified files
ls -lh .aicf/*.aicf 2>/dev/null

# Should only show:
# .watcher-events.aicf (watcher logs)

# Check session files
ls -lh .aicf/sessions/

# Should show:
# 2025-10-24-session.aicf
# 2025-10-25-session.aicf

# Check total storage
du -sh .aicf/

# Should show:
# ~1.1MB
```

---

## 🎯 **Summary**

✅ **Deleted 4 unwanted unified files** (conversations.aicf, technical-context.aicf, design-system.aicf, work-state.aicf)
✅ **Stopped old watcher process** that was writing to unified files
✅ **Verified clean architecture** (sessions/ + medium/ + old/ + archive/)
✅ **Reduced storage** from 93MB to 1.1MB (98.8% reduction)
✅ **Ready for Phase 8** (End-to-End Testing)

**The `.aicf/` folder is now clean and follows the Phase 6.5 + 7 architecture!** 🚀
