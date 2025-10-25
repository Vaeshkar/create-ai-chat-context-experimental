# Augment Extraction - FINAL PLAN

## 🎯 CRITICAL CONSTRAINT

**ONLY extract conversations related to `create-ai-chat-context-experimental` project.**

Other conversations from other projects must be extracted separately in their own project folders.

---

## 📋 Template Files (Source of Truth)

These are the ONLY files we append to:

### `.ai/` Files (Human-Readable)
- `conversation-log.md` - Chat history with YAML format
- `known-issues.md` - Issues and resolutions
- `next-steps.md` - Planned work
- `technical-decisions.md` - Architecture decisions

### `.aicf/` Files (AI-Optimized, Pipe-Delimited)
- `conversations.aicf` - Pipe-delimited conversation index
- `decisions.aicf` - Pipe-delimited decisions
- `issues.aicf` - Pipe-delimited issues
- `tasks.aicf` - Pipe-delimited tasks
- `technical-context.aicf` - Pipe-delimited tech stack

---

## 🔄 Extraction Strategy

### Step 1: Filter Augment Records
- Only extract conversations mentioning "create-ai-chat-context-experimental" or "aicf"
- Skip conversations about other projects
- Group by conversationId

### Step 2: Parse Each Conversation
Extract from Augment record:
- **User input:** request_message
- **AI response:** response_text
- **Timestamp:** timestamp
- **Model:** model_id
- **Tool results:** request_nodes (IDE state, tool calls)

### Step 3: Analyze Content
From the conversation text, extract:
- **Decisions:** "We decided...", "We chose...", "Architecture..."
- **Issues:** "Bug:", "Problem:", "Error:", "Issue:"
- **Tasks:** "TODO:", "Need to:", "Implement:", "Create:"
- **Next steps:** "Next:", "Then:", "After that:"
- **Technical context:** Language, framework, database, etc.

### Step 4: Append to Template Files
- **conversations.aicf:** Add pipe-delimited row
- **decisions.aicf:** Add pipe-delimited row for each decision found
- **issues.aicf:** Add pipe-delimited row for each issue found
- **tasks.aicf:** Add pipe-delimited row for each task found
- **technical-context.aicf:** Add pipe-delimited row for tech mentions
- **conversation-log.md:** Add YAML entry for conversation
- **known-issues.md:** Add issue section if applicable
- **next-steps.md:** Add step if applicable

---

## 📊 Pipe-Delimited Format

### conversations.aicf
```
C#|TIMESTAMP|TITLE|SUMMARY|AI_MODEL|DECISIONS|ACTIONS|STATUS
1|20251024T120000Z|Augment Parser Implementation|Implemented parser for Augment LevelDB|claude-sonnet-4-5|Use pipe-delimited format|Created parser|COMPLETED
```

### decisions.aicf
```
D#|TIMESTAMP|TITLE|DECISION|RATIONALE|IMPACT|STATUS
1|20251024T120000Z|Pipe-Delimited Format|Use pipe-delimited AICF format|Token-optimized, AI-readable|All memory files use this format|ACTIVE
```

### issues.aicf
```
I#|TIMESTAMP|TITLE|DESCRIPTION|SEVERITY|WORKAROUND|STATUS
1|20251024T120000Z|Augment Data Loss|4000+ files created with no real data|CRITICAL|Delete and restart|RESOLVED
```

### tasks.aicf
```
T#|PRIORITY|EFFORT|STATUS|TASK|DEPENDENCIES|ASSIGNED|CREATED|COMPLETED
1|H|M|DONE|Extract Augment conversations|None|AI|20251024T120000Z|20251024T150000Z
```

### technical-context.aicf
```
TC#|CATEGORY|KEY|VALUE|DESCRIPTION
1|LANGUAGE|primary|TypeScript|Main language for AICF system
2|FRAMEWORK|main|Node.js|Runtime environment
```

---

## ✅ Test Plan

### Test 1: Single Conversation
- Extract ONE conversation about create-ai-chat-context-experimental
- Verify all fields populated correctly
- Check pipe-delimited format is valid
- Verify no data loss

### Test 2: 10 Conversations
- Extract 10 conversations
- Verify grouping by conversationId works
- Check timestamp ordering
- Verify deduplication (skip if already processed)

### Test 3: Format Validation
- Verify pipe-delimited rows match template schema
- Check all required fields present
- Verify no pipes in data (escape if needed)

---

## 🚀 Implementation Rules

1. **NO new files** - Only append to template files
2. **Overwrite garbage** - If old data is corrupted, replace it
3. **Append mode** - Add new conversations to existing files
4. **Per conversationId** - One entry per conversation (groups all messages)
5. **Pipe-delimited** - Use `|` as separator in .aicf files
6. **YAML format** - Use YAML in .ai/conversation-log.md

---

## 🎯 Success Criteria

- [ ] Only create-ai-chat-context-experimental conversations extracted
- [ ] All 6 template files updated with new data
- [ ] Pipe-delimited format valid and parseable
- [ ] No data loss or corruption
- [ ] Deduplication working (no duplicate entries)
- [ ] All tests passing
- [ ] User can search and find conversations

