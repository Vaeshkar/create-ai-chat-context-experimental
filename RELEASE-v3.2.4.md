# Release Notes - v3.2.4

**Release Date:** October 30, 2025  
**Type:** Critical Bug Fixes  
**Status:** ✅ Ready for Release

---

## 🚨 Critical Bugs Fixed

This release fixes **5 CRITICAL BUGS** that were causing:
- ❌ Conversations from multiple workspaces being mixed together
- ❌ Session files containing 1000+ duplicate decisions
- ❌ Recent files growing to massive sizes
- ❌ Wrong workspace data being captured

---

## 🔧 Bug Fixes

### Bug #1: AugmentCacheWriter Doesn't Pass Project Path
**File:** `src/writers/AugmentCacheWriter.ts:39`

**Problem:** `AugmentLevelDBReader` was created without the project path, defaulting to `process.cwd()` (wherever the daemon was started) instead of the actual project directory.

**Fix:** Pass `cwd` to reader constructor:
```typescript
// Before
this.reader = new AugmentLevelDBReader();

// After
this.reader = new AugmentLevelDBReader(cwd);
```

**Impact:** ✅ Watcher now correctly reads conversations from the target workspace

---

### Bug #2: Workspace Filtering Uses `.includes()` Instead of Exact Match
**File:** `src/readers/AugmentLevelDBReader.ts:131`

**Problem:** Using `.includes()` was too loose - `LILL-Core` matched `LILL-Core`, `LILL-Meta-Learner`, `LILL-anything`, causing conversations from multiple similar projects to be mixed together.

**Fix:** Use exact workspace name matching:
```typescript
// Before
if (!workspace.name.includes(targetWorkspace)) {
  continue;
}

// After
if (workspace.name !== targetWorkspace) {
  continue;
}
```

**Impact:** ✅ Only conversations from the exact workspace are captured

---

### Bug #3: SessionConsolidationAgent Writes Duplicates Without Deduplication
**File:** `src/agents/SessionConsolidationAgent.ts:664-690`

**Problem:** If `conv.decisions` array had 1000 duplicate entries, it wrote all 1000 without checking for duplicates first.

**Fix:** Deduplicate decisions and insights before writing:
```typescript
// Before
for (const decision of conv.decisions) {
  lines.push(`${this.escapeField(decision)}|...`);
}

// After
const uniqueDecisions = this.deduplicateArray(conv.decisions);
for (const decision of uniqueDecisions) {
  lines.push(`${this.escapeField(decision)}|...`);
}
```

**Impact:** ✅ Session files no longer contain duplicate decisions

---

### Bug #4: DecisionExtractor Extracts FULL MESSAGE CONTENT as Decision
**File:** `src/extractors/DecisionExtractor.ts:220-261`

**Problem:** Extracted entire message content as "decision" instead of just the decision text, creating massive session files with repeated full messages.

**Fix:** Extract only the decision sentence:
```typescript
// Before
decisions.push({
  timestamp: msg.timestamp,
  decision: msg.content, // ❌ FULL CONTENT
  context: msg.content.substring(0, 100),
  impact: this.assessImpact(msg.content),
});

// After
const decisionText = this.extractDecisionSentence(msg.content);
decisions.push({
  timestamp: msg.timestamp,
  decision: decisionText, // ✅ Only decision sentence (max 200 chars)
  context: msg.content.substring(0, 100),
  impact: this.assessImpact(decisionText),
});
```

**New Method:** `extractDecisionSentence()` - Extracts the sentence containing decision keywords, truncated to 200 chars max.

**Impact:** ✅ Session files are dramatically smaller and contain only relevant decision text

---

### Bug #5: No Workspace Metadata in Cache Chunks
**File:** `src/writers/AugmentCacheWriter.ts:151-166`

**Problem:** Even if we filtered correctly at read time, the workspace name wasn't preserved in cache chunks, so consolidation couldn't filter by workspace later in the pipeline.

**Fix:** Add `workspaceName` to cache chunk metadata:
```typescript
private formatAsChunk(conv: AugmentConversation): Record<string, unknown> {
  return {
    chunkId: `chunk-${this.lastChunkNumber + 1}`,
    conversationId: conv.conversationId,
    workspaceId: conv.workspaceId,
    workspaceName: conv.workspaceName, // ✅ Added
    timestamp: conv.timestamp,
    lastModified: conv.lastModified,
    source: 'augment-leveldb',
    rawData: conv.rawData,
    contentHash: this.hashContent(conv.rawData),
  };
}
```

**Impact:** ✅ Workspace context is preserved throughout the entire pipeline

---

## ✅ Testing

- **All 624 tests passing** ✅
- **Build successful** ✅
- **TypeScript compilation clean** ✅

---

## 📦 Files Changed

1. `src/writers/AugmentCacheWriter.ts` - Pass cwd to reader, add workspaceName to chunks
2. `src/readers/AugmentLevelDBReader.ts` - Use exact workspace matching
3. `src/agents/SessionConsolidationAgent.ts` - Deduplicate decisions/insights before writing
4. `src/extractors/DecisionExtractor.ts` - Extract only decision sentence, not full message

---

## 🚀 Upgrade Instructions

```bash
# Update to v3.2.4
npm install create-ai-chat-context-experimental@3.2.4

# Or use npx
npx create-ai-chat-context-experimental@3.2.4 init --automatic
```

---

## 🎯 Expected Results After Upgrade

1. ✅ **Workspace Isolation** - Only conversations from the current project are captured
2. ✅ **No Duplicates** - Session files contain unique decisions only
3. ✅ **Smaller Files** - Recent files and session files are dramatically smaller
4. ✅ **Accurate Data** - Decisions are concise and relevant (max 200 chars)

---

## 🔍 Verification

After upgrading, verify the fixes:

```bash
# Check session files - should have no duplicates
cat .aicf/sessions/2025-10-30-session.aicf | grep "@DECISIONS" -A 20

# Check recent files - should be reasonable size
ls -lh .aicf/recent/

# Check cache chunks - should have workspaceName
cat .cache/llm/augment/chunk-1.json | jq '.workspaceName'
```

---

## 📝 Breaking Changes

None - this is a bug fix release with no API changes.

---

## 🙏 Credits

Thanks to the user for identifying these critical issues and providing detailed feedback on the data quality problems!

---

**Ready to publish!** 🚀

