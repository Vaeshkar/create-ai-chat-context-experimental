# Corrected Extraction Plan - Where Data Goes

## 🎯 The Complete Picture

### Files Structure

**Template Files (6 files - append only):**
1. `.ai/conversation-log.md` - YAML summary of all chats
2. `.ai/known-issues.md` - Issues found in conversations
3. `.ai/next-steps.md` - Next steps from conversations
4. `.ai/technical-decisions.md` - Decisions from conversations
5. `.aicf/conversations.aicf` - Pipe-delimited index
6. `.aicf/decisions.aicf` - Pipe-delimited decisions

**Individual Conversation Files (one per conversationId):**
- `.ai/{conversationId}.md` - Full conversation content (user input + AI output)
- `.aicf/{conversationId}.aicf` - Pipe-delimited conversation data

---

## 📊 Data Flow

### For Each Augment Conversation:

```
Augment LevelDB Record
  ├─ conversationId
  ├─ request_message (user input)
  ├─ response_text (AI output)
  ├─ timestamp
  └─ model_id

        ↓ PARSE ↓

1. Create `.ai/{conversationId}.md`
   - Full conversation content
   - User input section
   - AI output section
   - Context/metadata

2. Create `.aicf/{conversationId}.aicf`
   - Pipe-delimited format
   - Metadata only (not full content)

3. Append to `.ai/conversation-log.md`
   - YAML entry with summary
   - What was accomplished
   - Key decisions
   - Next steps

4. Append to `.aicf/conversations.aicf`
   - Pipe-delimited row
   - Index entry

5. Extract & Append to other files:
   - Decisions → `.aicf/decisions.aicf` + `.ai/technical-decisions.md`
   - Issues → `.aicf/issues.aicf` + `.ai/known-issues.md`
   - Next steps → `.ai/next-steps.md`
```

---

## 📝 Example Output

### `.ai/{conversationId}.md`
```markdown
# Augment Conversation

**Conversation ID:** 0da34e3e-74df-489c-9e2e-267d4ec2a161
**Model:** claude-sonnet-4-5
**Timestamp:** 2025-10-20T06:45:53.832Z

## User Input

[Full user request_message here]

## AI Response

[Full AI response_text here]

## Context

- Tool results: [count]
- IDE state: [captured/not captured]
```

### `.aicf/{conversationId}.aicf`
```
@CONVERSATION:0da34e3e-74df-489c-9e2e-267d4ec2a161
timestamp=2025-10-20T06:45:53.832Z
model=claude-sonnet-4-5
user_input_length=0
ai_response_length=3194
has_tool_results=yes
```

### `.ai/conversation-log.md` (YAML entry)
```yaml
---
CHAT: 1
DATE: 2025-10-20
TYPE: WORK
TOPIC: Migration progress update

WHAT:
  - Analyzed migration progress
  - Identified remaining work
  - Updated status tracking

WHY:
  - Need to track project completion
  - Ensure all files migrated correctly

OUTCOME: COMPLETED

FILES:
  - src/file-1.ts: Migrated
  - src/file-2.ts: Migrated

NEXT:
  - Continue with remaining files
---
```

### `.aicf/conversations.aicf` (pipe-delimited row)
```
C#|20251020T064553Z|Augment-0da34e3e|Migration progress update|claude-sonnet-4-5|None|Reviewed|COMPLETED
```

---

## ✅ Extraction Checklist

For each Augment conversation:

- [ ] Filter: Only create-ai-chat-context-experimental conversations
- [ ] Create `.ai/{conversationId}.md` with full content
- [ ] Create `.aicf/{conversationId}.aicf` with metadata
- [ ] Append to `.ai/conversation-log.md` (YAML)
- [ ] Append to `.aicf/conversations.aicf` (pipe-delimited)
- [ ] Extract decisions → append to `.aicf/decisions.aicf` + `.ai/technical-decisions.md`
- [ ] Extract issues → append to `.aicf/issues.aicf` + `.ai/known-issues.md`
- [ ] Extract next steps → append to `.ai/next-steps.md`

---

## 🎯 Key Points

1. **Individual files store full content** (`.ai/{conversationId}.md`)
2. **Template files store summaries** (`.ai/conversation-log.md`, etc.)
3. **Pipe-delimited files are indexes** (`.aicf/conversations.aicf`)
4. **No new files created** - only append to existing templates
5. **One entry per conversationId** - groups all messages in that conversation

