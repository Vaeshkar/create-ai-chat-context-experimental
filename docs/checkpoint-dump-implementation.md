# Checkpoint Dump Implementation

**Status:** ✅ Phase 1 Complete
**Date:** 2025-10-02
**Goal:** Fast (<1 second) raw conversation dump for async agent processing

---

## 🎯 What We Built

### 1. **Checkpoint Dump Function** (`src/checkpoint-dump.js`)

**Purpose:** Quickly dump raw conversation data to checkpoint queue without analysis

**Key Functions:**
- `dumpCheckpoint(options)` - Main dump function
- `countTokens(text)` - Token estimation (1 token ≈ 4 characters)
- `parseConversationText(text)` - Extract messages from raw text
- `handleCheckpointDump()` - CLI command handler

**Time:** <1 second (just writes JSON, no AI analysis)

---

## 📁 File Structure

```
.aicf/
├── checkpoint-queue/          # NEW: Raw dumps go here
│   ├── C13-CP1-raw.aicf      # Example: Session 13, Checkpoint 1
│   ├── C13-CP2-raw.aicf      # Example: Session 13, Checkpoint 2
│   └── C13-CP3-raw.aicf      # Example: Session 13, Checkpoint 3
│
└── conversations.aicf         # Final compressed checkpoints (agent writes here)
```

---

## 📋 Checkpoint Format (JSON)

```json
{
  "id": "C13-CP1",
  "sessionId": "C13",
  "checkpointNumber": 1,
  "timestamp": "2025-10-02T16:30:00Z",
  "tokenCount": 10234,
  "messageCount": 50,
  "messages": [
    {
      "role": "user",
      "content": "Let's build a checkpoint system...",
      "timestamp": "2025-10-02T16:15:00Z",
      "tokens": 45
    },
    {
      "role": "assistant",
      "content": "Great idea! Let me think...",
      "timestamp": "2025-10-02T16:16:00Z",
      "tokens": 180
    }
  ],
  "metadata": {
    "dumpedAt": "2025-10-02T16:30:00Z",
    "version": "3.0",
    "status": "pending"
  }
}
```

---

## 🔄 The Flow

### **Current State (Phase 1 - Manual):**

```
1. User works with AI (main conversation)
   ↓
2. User manually runs: npx aic checkpoint-dump
   ↓
3. Function reads .ai/conversation-log.md
   ↓
4. Dumps raw JSON to .aicf/checkpoint-queue/
   ↓ (<1 second)
5. Done! (Agent will process later)
```

### **Future State (Phase 2 - Automatic):**

```
1. User + AI working (main conversation continues)
   ↓
2. Token threshold reached (10,000 tokens accumulated)
   ↓
3. Main AI dumps raw conversation to .aicf/checkpoint-queue/
   ↓ (<1 second, no interruption)
4. Main AI continues conversation with user
   ↓
5. Background agent picks up raw dump
   ↓
6. Agent calls AI to analyze and compress
   ↓ (2-3 minutes, but user doesn't wait)
7. Agent writes final checkpoint to .aicf/conversations.aicf
   ↓
8. Agent logs: "✅ Checkpoint CP1 saved (10,234 tokens → 587 tokens)"
```

---

## 💡 Key Design Decisions

### **1. Why JSON Format?**
- ✅ Structured and parseable
- ✅ Human-readable (can verify accuracy)
- ✅ Universal (works in all languages)
- ✅ Easy to extend (add new fields)

### **2. Why Separate Queue Directory?**
- ✅ Clear separation: raw dumps vs. processed checkpoints
- ✅ Agent knows what to process (anything in checkpoint-queue/)
- ✅ Easy cleanup (delete after processing)
- ✅ Fault tolerance (if agent crashes, raw dumps are preserved)

### **3. Why <1 Second Dump?**
- ✅ No downtime for user
- ✅ Main conversation continues immediately
- ✅ Agent does heavy work asynchronously
- ✅ User never waits

---

## 🧪 Testing

### **Manual Test:**

```bash
# 1. Create checkpoint-queue directory
mkdir -p .aicf/checkpoint-queue

# 2. Run dump command
npx aic checkpoint-dump

# 3. Check output
ls -la .aicf/checkpoint-queue/
cat .aicf/checkpoint-queue/C*-raw.aicf
```

### **Programmatic Test:**

```javascript
const { dumpCheckpoint } = require('./src/checkpoint-dump.js');

const messages = [
  { role: 'user', content: 'Hello', timestamp: new Date().toISOString() },
  { role: 'assistant', content: 'Hi!', timestamp: new Date().toISOString() }
];

await dumpCheckpoint({
  messages,
  tokenCount: 10,
  sessionId: 'TEST',
  checkpointNumber: 1
});

// Output: .aicf/checkpoint-queue/TEST-CP1-raw.aicf
```

---

## 📊 Example Output

**Console:**
```
📦 Dumped checkpoint C13-CP1 (10,234 tokens, 50 messages)
   → /Users/leeuwen/Programming/create-ai-chat-context/.aicf/checkpoint-queue/C13-CP1-raw.aicf
```

**File:** `.aicf/checkpoint-queue/C13-CP1-raw.aicf`
```json
{
  "id": "C13-CP1",
  "sessionId": "C13",
  "checkpointNumber": 1,
  "timestamp": "2025-10-02T16:30:00Z",
  "tokenCount": 10234,
  "messageCount": 50,
  "messages": [...],
  "metadata": {
    "dumpedAt": "2025-10-02T16:30:00Z",
    "version": "3.0",
    "status": "pending"
  }
}
```

---

## ✅ What's Complete

- [x] `src/checkpoint-dump.js` - Core dump function
- [x] `dumpCheckpoint()` - Main function
- [x] `countTokens()` - Token estimation
- [x] `parseConversationText()` - Message extraction
- [x] `handleCheckpointDump()` - CLI handler
- [x] CLI command: `npx aic checkpoint-dump`
- [x] JSON format specification
- [x] Example checkpoint file

---

## 🚧 Next Steps (Phase 2: Agent)

### **Immediate:**
- [ ] Build checkpoint agent (`src/checkpoint-agent.js`)
- [ ] Watch `.aicf/checkpoint-queue/` for new files
- [ ] Process raw dumps with AI analysis
- [ ] Write compressed checkpoints to `.aicf/conversations.aicf`
- [ ] CLI command: `npx aic checkpoint-agent --watch`

### **Future:**
- [ ] Automatic dump trigger (every 10,000 tokens)
- [ ] Integration with chat platforms (Augment, Claude, etc.)
- [ ] Real-time checkpoint monitoring
- [ ] Cost tracking and optimization

---

## 🎯 Success Criteria

**Phase 1 (Complete):**
- ✅ Dump function works
- ✅ Creates valid JSON
- ✅ Takes <1 second
- ✅ CLI command accessible

**Phase 2 (Next):**
- [ ] Agent processes dumps automatically
- [ ] Compresses 10,000 tokens → 500-600 tokens
- [ ] Preserves 70% of information
- [ ] User never waits for processing

---

## 📝 Usage Examples

### **Example 1: Manual Dump**

```bash
# After long conversation session
npx aic checkpoint-dump

# Output:
# 📦 Dumped checkpoint C13-CP1 (10,234 tokens, 50 messages)
#    → .aicf/checkpoint-queue/C13-CP1-raw.aicf
```

### **Example 2: Programmatic Dump**

```javascript
const { dumpCheckpoint, countTokens } = require('./src/checkpoint-dump.js');

// During conversation, track tokens
let tokensSinceLastCheckpoint = 0;

// After each message
tokensSinceLastCheckpoint += countTokens(message.content);

if (tokensSinceLastCheckpoint >= 10000) {
  // Quick dump (no analysis)
  await dumpCheckpoint({
    messages: conversationHistory,
    tokenCount: tokensSinceLastCheckpoint,
    sessionId: 'C13',
    checkpointNumber: 1
  });
  
  // Reset counter
  tokensSinceLastCheckpoint = 0;
  
  // Continue conversation immediately
}
```

---

## 🔍 Technical Details

### **Token Estimation:**
- 1 token ≈ 4 characters
- 1 token ≈ 0.75 words
- Rough estimate, good enough for threshold detection

### **Message Structure:**
```javascript
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: ISO 8601 string,
  tokens: number (estimated)
}
```

### **Checkpoint ID Format:**
- `{sessionId}-CP{checkpointNumber}`
- Example: `C13-CP1` (Session 13, Checkpoint 1)
- Example: `C13-CP2` (Session 13, Checkpoint 2)

---

**Last Updated:** 2025-10-02
**Status:** Phase 1 Complete ✅
**Next:** Build checkpoint agent (Phase 2)

