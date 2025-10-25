# Phase 6.5: Session Consolidation - AI-Readable Memory

**Goal:** Convert 10,260 individual conversation files into ~20 clean, readable session files using the template format.

---

## 🎯 **The Problem**

**Current (Phase 6):**
- ✅ Extracts all conversations from Augment LevelDB
- ✅ Preserves timestamps correctly
- ❌ Creates 10,260 individual files (92MB)
- ❌ Unreadable JSON blobs
- ❌ 18.5M tokens to read all conversations
- ❌ Full of duplicates and noise

**What AI needs:**
- ✅ Clean, scannable format
- ✅ One file per session/day
- ✅ Only essential information
- ✅ Deduplicated content
- ✅ 97% token reduction

---

## 📋 **Architecture**

### **New Pipeline:**
```
Augment LevelDB
    ↓
AugmentCacheWriter (cache chunks)
    ↓
SessionConsolidationAgent (NEW!)
    ↓
    ├─ Group by session (date + activity gaps)
    ├─ Extract essentials (title, summary, decisions, actions)
    ├─ Deduplicate content
    └─ Write template format
    ↓
.aicf/recent/2025-10-21-session.aicf (ONE file per session)
```

### **Session Detection:**
Group conversations into sessions by:
1. **Same date** (YYYY-MM-DD)
2. **Activity continuity** (< 30 min gap between conversations)
3. **Same workspace** (same project)

**Result:** ~10-20 sessions instead of 10,260 conversations

---

## 🔧 **Components to Build**

### **1. SessionConsolidationAgent**
**Location:** `src/agents/SessionConsolidationAgent.ts`

**Responsibilities:**
- Read all conversations from `.aicf/recent/`
- Group by session (date + time gaps)
- Extract essential information
- Deduplicate content
- Write template format

**Key Methods:**
```typescript
class SessionConsolidationAgent {
  // Group conversations into sessions
  groupIntoSessions(conversations: Conversation[]): Session[]
  
  // Extract essential info from conversation
  extractEssentials(conversation: Conversation): ConversationEssentials
  
  // Deduplicate conversations within session
  deduplicateSession(session: Session): Session
  
  // Write session to template format
  writeSessionFile(session: Session, outputPath: string): void
}
```

### **2. Template Format Writer**
**Location:** `src/writers/TemplateFormatWriter.ts`

**Responsibilities:**
- Generate AICF template format
- Follow schema: `C#|TIMESTAMP|TITLE|SUMMARY|AI_MODEL|DECISIONS|ACTIONS|STATUS`
- Handle escaping and formatting

### **3. Content Extractor**
**Location:** `src/extractors/ConversationEssentialsExtractor.ts`

**Responsibilities:**
- Extract TITLE from first user message
- Generate SUMMARY from conversation flow
- Extract DECISIONS from analysis
- Extract ACTIONS from code changes
- Determine STATUS (COMPLETED/ONGOING)

### **4. Deduplicator**
**Location:** `src/utils/ConversationDeduplicator.ts`

**Responsibilities:**
- Detect duplicate conversations (same content hash)
- Merge similar conversations
- Remove noise (typos, formatting-only changes)

---

## 📝 **Template Format**

### **Schema:**
```
@CONVERSATIONS
@SCHEMA
C#|TIMESTAMP|TITLE|SUMMARY|AI_MODEL|DECISIONS|ACTIONS|STATUS

@DATA
[conversation entries]

@NOTES
[session metadata]
```

### **Example Output:**
```
@CONVERSATIONS
@SCHEMA
C#|TIMESTAMP|TITLE|SUMMARY|AI_MODEL|DECISIONS|ACTIONS|STATUS

@DATA
1|20251021T212309Z|Fix StateExtractor TypeScript errors|Fixed undefined array access errors in StateExtractor|Claude Haiku 4.5|Use optional chaining and nullish coalescing|Fixed 2 TypeScript errors in StateExtractor.ts|COMPLETED
2|20251021T213304Z|Fix parser error handling|Fixed ConversationOrchestrator to handle parser errors gracefully|Claude Haiku 4.5|Return empty array on parser error|Modified parseRawData method in ConversationOrchestrator.ts|COMPLETED
3|20251021T214512Z|Implement BackgroundService|Created background service for polling Augment LevelDB|Claude Haiku 4.5|5-minute polling interval, use workspaceStorage path|Created BackgroundService.ts with polling logic|COMPLETED

@NOTES
- Session: 2025-10-21 Evening Development
- Total conversations: 372
- Unique conversations: 3 (after deduplication)
- Duration: 2.5 hours
- Focus: Bug fixes and service implementation
```

---

## 🔄 **Migration Strategy**

### **Phase 1: Build Components**
1. Create `SessionConsolidationAgent`
2. Create `TemplateFormatWriter`
3. Create `ConversationEssentialsExtractor`
4. Create `ConversationDeduplicator`

### **Phase 2: Test with Sample**
1. Take 100 conversations from one day
2. Group into sessions
3. Extract essentials
4. Deduplicate
5. Write template format
6. Verify readability

### **Phase 3: Process All Data**
1. Run on all 10,260 conversations
2. Generate ~20 session files
3. Verify token reduction
4. Compare storage usage

### **Phase 4: Update Dropoff Agent**
1. Update MemoryDropoffAgent to work with session files
2. Compress sessions by age (not individual conversations)
3. Test dropoff with shorter windows (2/7/14 days)

---

## ✅ **Success Criteria**

1. **File Reduction:** 10,260 files → ~20 session files
2. **Storage Reduction:** 92MB → ~2MB (98% reduction)
3. **Token Reduction:** 18.5M → 0.5M tokens (97% reduction)
4. **Readability:** Can scan entire history in < 1 minute
5. **Deduplication:** Remove 99% of duplicate/noise conversations
6. **Format:** Clean template format matching `templates/aicf/conversations.aicf`

---

## 📊 **Expected Results**

### **Before (Current):**
```
.aicf/recent/
├── 2025-10-21_exchange:a5408ef1-...:000c0b0c-....aicf (4KB)
├── 2025-10-21_exchange:a5408ef1-...:00706060-....aicf (5KB)
├── 2025-10-21_exchange:a5408ef1-...:02d28ea0-....aicf (4KB)
... (10,257 more files)
```

### **After (Session Consolidation):**
```
.aicf/recent/
├── 2025-10-21-session.aicf (150KB, 372 conversations → 3 unique)
├── 2025-10-22-session.aicf (500KB, 2882 conversations → 15 unique)
├── 2025-10-23-session.aicf (200KB, 970 conversations → 5 unique)
├── 2025-10-24-session.aicf (450KB, 2436 conversations → 12 unique)
├── 2025-10-25-session.aicf (700KB, 3599 conversations → 20 unique)
```

**Total:** 5 files, ~2MB, ~55 unique conversations

---

## 🚀 **Next Steps**

1. Build `SessionConsolidationAgent`
2. Build `TemplateFormatWriter`
3. Build `ConversationEssentialsExtractor`
4. Build `ConversationDeduplicator`
5. Test with sample data
6. Process all conversations
7. Update MemoryDropoffAgent
8. Test end-to-end pipeline

---

**This will give AI clean, readable, efficient memory instead of 10,260 files of JSON noise!**

