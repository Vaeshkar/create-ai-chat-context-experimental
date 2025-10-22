# 📊 Data Flow Examples: From Input to Memory

## Example 1: Augment Checkpoint → Memory Files

### Input: Checkpoint JSON
```json
{
  "id": "checkpoint-2025-10-22-001",
  "timestamp": "2025-10-22T14:30:00Z",
  "platform": "augment",
  "conversation": {
    "messages": [
      {
        "role": "user",
        "content": "Fix the TypeScript errors in my project"
      },
      {
        "role": "assistant",
        "content": "I'll help fix those errors. Let me analyze the issues..."
      }
    ],
    "metadata": {
      "duration": 2700,
      "tokenUsage": { "input": 5000, "output": 3000 }
    }
  },
  "decisions": [
    "Use bracket notation for index signatures",
    "Separate type imports from value imports"
  ],
  "actions": [
    "Fix 81 TypeScript compilation errors",
    "Run full test suite",
    "Commit changes to git"
  ]
}
```

### Processing Steps

#### 1. Parse
```typescript
// Extract conversation data
const messages = checkpoint.conversation.messages;
const metadata = checkpoint.conversation.metadata;

// Result: Normalized Message objects
[
  { id: "msg-1", role: "user", content: "...", timestamp: "2025-10-22T14:30:00Z" },
  { id: "msg-2", role: "assistant", content: "...", timestamp: "2025-10-22T14:30:15Z" }
]
```

#### 2. Extract
```typescript
// Extract key information
const decisions = checkpoint.decisions;
const actions = checkpoint.actions;

// Extract from message content
const technicalWork = extractTechnicalWork(messages);
const intent = extractIntent(messages);
const state = extractState(messages);

// Result: Structured extraction
{
  decisions: ["Use bracket notation...", "Separate type imports..."],
  actions: ["Fix 81 TypeScript errors", "Run test suite", "Commit changes"],
  technicalWork: ["Fixed index signature access", "Fixed type imports"],
  intent: "Fix TypeScript compilation errors",
  state: "In progress - 81 errors fixed"
}
```

#### 3. Consolidate
```typescript
// Merge with existing memory
const existing = readAICF('conversations.aicf');
const newEntry = {
  id: 'conv-123',
  timestamp: '2025-10-22T14:30:00Z',
  platform: 'augment',
  summary: 'Fixed TypeScript errors in Phase 2 migration',
  decisions: 2,
  actions: 3,
  technicalWork: 8
};

// Result: Updated conversations list
[
  { id: 'conv-122', ... },
  { id: 'conv-123', ... },  // NEW
  { id: 'conv-124', ... }
]
```

#### 4. Write
```typescript
// Update .aicf/conversations.aicf
conv-123|2025-10-22T14:30:00Z|augment|Fixed TypeScript errors|2|3|8

// Update .ai/conversation-log.md
## Conversation: Fixed TypeScript Errors
**Date:** 2025-10-22 14:30 UTC
**Platform:** Augment
**Duration:** 45 minutes

### Summary
Fixed 81 TypeScript compilation errors in Phase 2 migration...

### Key Decisions
1. Use bracket notation for index signatures
2. Separate type imports from value imports

### Actions Completed
1. Fixed 81 TypeScript compilation errors
2. Run full test suite (566/587 passing)
3. Committed changes to git
```

---

## Example 2: Claude Desktop Database → Memory Files

### Input: SQLite Database
```sql
-- Claude Desktop stores conversations in:
-- ~/Library/Application Support/Claude/conversations.db

SELECT * FROM conversations LIMIT 1;
-- id: "conv-abc123"
-- title: "Debug React component"
-- created_at: 1729610400

SELECT * FROM messages WHERE conversation_id = "conv-abc123";
-- id: "msg-1", role: "user", content: "Why is my component re-rendering?"
-- id: "msg-2", role: "assistant", content: "Let me analyze your code..."
```

### Processing Steps

#### 1. Parse (ClaudeDesktopParser)
```typescript
// Read SQLite database
const db = new Database(dbPath);
const conversations = db.prepare('SELECT * FROM conversations').all();
const messages = db.prepare('SELECT * FROM messages').all();

// Result: Normalized conversations
[
  {
    id: "conv-abc123",
    title: "Debug React component",
    messages: [
      { id: "msg-1", role: "user", content: "...", timestamp: 1729610400 },
      { id: "msg-2", role: "assistant", content: "...", timestamp: 1729610415 }
    ],
    platform: "claude-desktop"
  }
]
```

#### 2. Extract
```typescript
// Extract from messages
const decisions = extractDecisions(messages);
// Result: ["Use useCallback for memoization", "Add dependency array"]

const technicalWork = extractTechnicalWork(messages);
// Result: ["Fixed React re-render issue", "Optimized component performance"]

const state = extractState(messages);
// Result: "React component optimization complete"
```

#### 3. Consolidate
```typescript
// Merge with existing conversations
const newEntry = {
  id: 'conv-124',
  timestamp: '2025-10-22T15:00:00Z',
  platform: 'claude-desktop',
  summary: 'Debug React component re-rendering',
  decisions: 2,
  actions: 1,
  technicalWork: 2
};
```

#### 4. Write
```
.aicf/conversations.aicf:
conv-124|2025-10-22T15:00:00Z|claude-desktop|Debug React component|2|1|2

.ai/conversation-log.md:
## Conversation: Debug React Component
**Date:** 2025-10-22 15:00 UTC
**Platform:** Claude Desktop

### Summary
Debugged React component re-rendering issue...

### Key Decisions
1. Use useCallback for memoization
2. Add dependency array to prevent unnecessary renders
```

---

## Example 3: Multiple Conversations → Consolidated Memory

### Input: 3 Conversations
```
Conversation 1 (Augment): Fixed TypeScript errors
Conversation 2 (Claude Desktop): Debug React component
Conversation 3 (Claude CLI): Implement new feature
```

### Processing: Consolidation

#### Before Consolidation
```
.aicf/conversations.aicf:
conv-122|2025-10-22T13:00:00Z|augment|Previous work|1|2|3
conv-123|2025-10-22T14:30:00Z|augment|Fixed TS errors|2|3|8
conv-124|2025-10-22T15:00:00Z|claude-desktop|Debug React|2|1|2
conv-125|2025-10-22T16:00:00Z|claude-cli|New feature|3|4|5
```

#### Consolidation Process
```typescript
// Aggregate statistics
const stats = {
  totalConversations: 4,
  totalDecisions: 8,
  totalActions: 10,
  totalTechnicalWork: 18,
  platforms: {
    augment: 2,
    'claude-desktop': 1,
    'claude-cli': 1
  }
};

// Update index.aicf
project_name|phase|total_conversations|total_decisions|total_actions
my-project|Phase 5.5|4|8|10

// Update work-state.aicf
last_update|active_platform|recent_conversations|pending_actions
2025-10-22T16:00:00Z|claude-cli|4|10
```

#### After Consolidation
```
.aicf/index.aicf:
project_name|phase|total_conversations|total_decisions|total_actions
my-project|Phase 5.5|4|8|10

.aicf/work-state.aicf:
last_update|active_platform|recent_conversations|pending_actions
2025-10-22T16:00:00Z|claude-cli|4|10

.ai/conversation-log.md:
## Recent Conversations (Last 24 Hours)

### 1. Fixed TypeScript Errors (Augment)
**Time:** 2025-10-22 14:30 UTC
**Summary:** Fixed 81 TypeScript compilation errors...

### 2. Debug React Component (Claude Desktop)
**Time:** 2025-10-22 15:00 UTC
**Summary:** Debugged React component re-rendering...

### 3. Implement New Feature (Claude CLI)
**Time:** 2025-10-22 16:00 UTC
**Summary:** Implemented new feature...

## Key Decisions (Last 24 Hours)
1. Use bracket notation for index signatures
2. Use useCallback for memoization
3. Implement feature with TypeScript
4. Add comprehensive tests
5. Document API changes
6. Update README
7. Create migration guide
8. Plan Phase 6 work
```

---

## Example 4: AI Assistant Reading Memory

### AI Assistant Workflow

#### Step 1: Read `.aicf/index.aicf` (Fast)
```
project_name|phase|total_conversations|total_decisions|total_actions
my-project|Phase 5.5|4|8|10
```
**Time:** 10ms | **Tokens:** 50

#### Step 2: Read `.aicf/conversations.aicf` (Fast)
```
id|timestamp|platform|summary|decisions|actions|technical_work
conv-123|2025-10-22T14:30:00Z|augment|Fixed TS errors|2|3|8
conv-124|2025-10-22T15:00:00Z|claude-desktop|Debug React|2|1|2
```
**Time:** 15ms | **Tokens:** 100

#### Step 3: Read `.ai/conversation-log.md` (Detailed)
```markdown
## Recent Conversations
[Full conversation details...]
```
**Time:** 50ms | **Tokens:** 500

#### Total Context Loading
- **Time:** 75ms
- **Tokens:** 650
- **Information:** Complete project context

### AI Assistant Decision Making
```
Based on memory files, I understand:
✅ Project is in Phase 5.5
✅ 4 conversations in last 24 hours
✅ 8 key decisions made
✅ 10 pending actions
✅ TypeScript errors were fixed
✅ React component was debugged
✅ New feature is being implemented

I can now make informed decisions about:
- What work has been done
- What decisions were made
- What's pending
- What context is important
```

---

## Summary: Data Flow

```
Input → Parse → Extract → Consolidate → Write → Git Commit → AI/Human Use
  ↓       ↓       ↓          ↓          ↓        ↓           ↓
JSON    Norm    Struct    Merge      .aicf/   Tracked    Context
DB      Conv    Data      Dedup      .ai/     History    Ready
JSONL   Msgs    Extract   Update     Files    Versioned  Decisions
```

