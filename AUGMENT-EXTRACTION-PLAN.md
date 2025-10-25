# Augment Extraction Plan - Detailed Analysis

## 📊 Current State

**Augment LevelDB Data:**
- Total records: 4,063 exchanges
- Key format: `exchange:conversationId:messageId`
- Data structure: JSON with user input, AI response, tool results, IDE state

**Template Files (Target Format):**
- `.aicf/conversations.aicf` - Simple conversation index
- `.aicf/conversation-memory.aicf` - Rich conversation metadata with insights
- `.aicf/work-state.aicf` - Next steps and work tracking
- `.aicf/decisions.aicf` - Decision records
- `.ai/*.md` - Human-readable markdown files

---

## 🎯 Extraction Requirements

### What We Have (Augment Record)
```
{
  uuid: "message-id",
  conversationId: "conv-id",
  request_message: "user input" (can be empty),
  response_text: "AI response",
  request_nodes: [...],  // tool results, IDE state
  response_nodes: [...], // AI response structure
  model_id: "claude-sonnet-4-5",
  timestamp: "2025-10-20T06:45:53.832Z"
}
```

### What We Need to Extract

**For `.aicf/conversations.aicf`:**
```
@CONVERSATION:augment-{conversationId}
timestamp_start={timestamp}
timestamp_end={timestamp}
messages=1 (or 2 if has request)
tokens={estimated_token_count}
```

**For `.aicf/conversation-memory.aicf`:**
```
@CONVERSATION:augment-{conversationId}
timestamp={timestamp}
platform=augment
model={model_id}
user_inputs={1_or_0}
ai_responses=1
user_topics={extracted_topics}
ai_actions={extracted_actions}
processing_status=completed
```

**For `.ai/{conversationId}.md`:**
```markdown
# Augment Conversation

**Conversation ID:** {conversationId}
**Model:** {model_id}
**Timestamp:** {timestamp}

## User Input
{request_message}

## AI Response
{response_text}

## Context
- Tool results: {count}
- IDE state captured: {yes/no}
```

---

## 🔍 Parsing Strategy

### Step 1: Identify Conversation Boundaries
- Group by `conversationId` (multiple messages per conversation)
- Sort by timestamp within each conversation
- Detect conversation start/end

### Step 2: Extract Metadata
- **User topics:** Analyze `request_message` for key topics
- **AI actions:** Parse `response_text` for action keywords (Created, Updated, Fixed, etc.)
- **Token count:** Estimate from text length (rough: 1 token ≈ 4 chars)
- **Processing status:** Always "completed" for Augment records

### Step 3: Handle Edge Cases
- **Empty request_message:** Mark as AI-only response
- **Tool results:** Count and note in metadata
- **IDE state:** Detect and flag presence
- **Duplicates:** Skip if same conversationId + timestamp already processed

---

## 📋 Test Plan (Before Full Import)

### Test 1: Single Conversation
- Extract ONE conversation with both request and response
- Verify all three output files created correctly
- Check AICF format matches template exactly
- Verify markdown is readable

### Test 2: Conversation Group
- Extract 10 conversations from same workspace
- Verify grouping by conversationId works
- Check timestamp ordering
- Verify no data loss

### Test 3: Edge Cases
- Extract conversation with empty request_message
- Extract conversation with tool results
- Extract conversation with IDE state
- Verify all handled gracefully

### Test 4: Deduplication
- Process same 10 conversations twice
- Verify duplicates detected and skipped
- Check no data corruption

---

## 🚀 Full Import Strategy

**Phase 1: Validation (This Session)**
- ✅ Understand Augment data structure
- ✅ Create test extraction for 1 conversation
- ⏳ Create test extraction for 10 conversations
- ⏳ Verify output format matches templates
- ⏳ Get user approval

**Phase 2: Safe Import (Next Session)**
- Extract all 4,063 conversations
- Write to `.cache/augment-chunks/` first (not directly to .aicf/.ai)
- Process chunks through parser
- Append to existing .aicf files (don't overwrite)
- Create individual .ai files per conversation

**Phase 3: Verification**
- Count total conversations imported
- Verify no data loss
- Check file sizes reasonable
- Spot-check random conversations

---

## ⚠️ Critical Decisions

1. **Grouping:** Should we group multiple messages by conversationId into ONE .aicf entry, or create separate entries per message?
   - **Recommendation:** One entry per conversationId (groups all messages in that conversation)

2. **Deduplication:** How to detect duplicates?
   - **Recommendation:** Hash of (conversationId + timestamp + response_text)

3. **File Appending:** Should we append to existing .aicf files or create new ones?
   - **Recommendation:** Append to conversations.aicf, create new conversation-memory.aicf entries

4. **Markdown Files:** One file per conversation or one file per message?
   - **Recommendation:** One file per conversationId (groups all messages)

---

## 📊 Expected Output

After full import:
- **conversations.aicf:** +4,063 @CONVERSATION entries
- **conversation-memory.aicf:** +4,063 @CONVERSATION entries with metadata
- **.ai/ folder:** +4,063 markdown files (one per conversation)
- **Total files created:** ~8,126 files

---

## ✅ Success Criteria

- [ ] All 4,063 conversations extracted
- [ ] Zero data loss
- [ ] AICF format matches templates exactly
- [ ] Markdown files are readable and complete
- [ ] No duplicate entries
- [ ] All tests passing
- [ ] User can search and find conversations

