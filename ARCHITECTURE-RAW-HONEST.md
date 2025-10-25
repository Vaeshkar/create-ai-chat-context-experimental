# Raw Architecture Analysis - Honest & Detailed

## The Real Data Flow

### Entry Point: `aice watch` command

User runs: `npx aice watch`

This instantiates `WatcherCommand` which:

1. Initializes all services
2. Starts a polling loop every 5 minutes (300000ms)
3. Calls `checkForCheckpoints()` on each interval

---

## Two Parallel Data Flows

### FLOW 1: Augment VSCode Extension (Automatic)

**Source:** Augment LevelDB files in VSCode workspace storage

**Path:**

```
~/Library/Application Support/Code/User/workspaceStorage/[workspace-id]/
  Augment.vscode-augment/augment-kv-store/
    ↓ (LevelDB database)
AugmentLevelDBReader.readAllConversations()
    ↓ (Reads all key-value pairs from LevelDB)
Returns: AugmentConversation[] with rawData
    ↓
BackgroundService.poll() (runs every 5 minutes)
    ↓
AugmentParser.parse(rawData, conversationId)
    ↓ (Converts LevelDB raw data to Message[])
ConversationOrchestrator.analyze(conversation, rawData)
    ↓ (Extracts: intents, actions, technical work, decisions, flow, state)
MemoryFileWriter.generateAICF() + generateMarkdown()
    ↓ (Creates pipe-delimited AICF and markdown)
Writes to disk:
  .aicf/{conversationId}.aicf
  .ai/{conversationId}.md
```

**Key Detail:** BackgroundService is instantiated in InitCommand and runs in background. It polls Augment LevelDB directly, NOT through checkpoint files.

---

### FLOW 2: Claude Desktop & CLI (Automatic)

**Source:** Claude's local storage (Desktop SQLite, CLI JSON files)

**Path:**

```
Claude Desktop: ~/Library/Application Support/Claude/
Claude CLI: ~/.config/claude-cli/

    ↓
WatcherCommand.checkForMultiClaudeMessages()
    ↓ (Called every 5 minutes)
MultiClaudeConsolidationService.consolidate()
    ↓
ClaudeDesktopWatcher.getAllMessages()
ClaudeCliWatcher.getProjectSessions()
    ↓ (Reads from Claude's local storage)
MultiClaudeOrchestrator.consolidate()
    ↓ (Deduplicates by SHA256 content hash)
Returns: Message[] with source metadata
    ↓
Currently: Logged but NOT written to memory files
(This is the gap - Claude data is consolidated but not persisted)
```

**Key Detail:** Claude consolidation happens but the messages are not automatically written to `.aicf/` and `.ai/` files. They're just logged.

---

### FLOW 3: Manual Checkpoint Processing (Optional)

**Source:** User manually creates checkpoint JSON files

**Path:**

```
User creates: ./checkpoints/checkpoint-123.json
    ↓
WatcherCommand.checkForCheckpoints()
    ↓ (Scans ./checkpoints/ every 5 minutes)
CheckpointProcessor.process(filePath)
    ↓
Reads JSON, validates structure
    ↓
ConversationOrchestrator.analyze()
    ↓ (Same analysis as Augment flow)
MemoryFileWriter.generateAICF() + generateMarkdown()
    ↓
Writes to disk:
  .aicf/{conversationId}.aicf
  .ai/{conversationId}.md
    ↓
Deletes checkpoint file after processing
```

---

## The Extractors (Analysis Layer)

All flows converge at `ConversationOrchestrator.analyze()` which runs 6 extractors:

1. **IntentExtractor** - What does the user want?
2. **ActionExtractor** - What did the AI do?
3. **TechnicalWorkExtractor** - What technical work happened?
4. **DecisionExtractor** - What decisions were made?
5. **FlowExtractor** - What's the conversation flow?
6. **StateExtractor** - What's the working state?

Each extractor analyzes the Message[] and returns structured data.

---

## The Writers (Output Layer)

`MemoryFileWriter` takes the analysis and creates:

1. **AICF Format** (pipe-delimited, machine-readable)

   ```
   version|3.0.0-alpha
   timestamp|2025-10-24T...
   conversationId|conv-123
   userIntents|timestamp|intent|confidence;...
   aiActions|timestamp|type|details;...
   technicalWork|timestamp|work|status;...
   decisions|timestamp|decision|confidence;...
   flow|count|initiator|sequence
   workingState|state|blockers|next
   ```

2. **Markdown Format** (human-readable)

   ```
   # Conversation Analysis

   **Conversation ID:** conv-123
   **Generated:** 2025-10-24T...

   ## User Intents
   - ...

   ## AI Actions
   - ...
   ```

---

## The Problem You Identified

**Your Design:**

```
LLM Library Files → .cache/llm/{platform}/chunk-[number].json → Parsers → Memory Files
```

**Current Reality:**

```
Augment LevelDB → BackgroundService → Parser → Memory Files ✅
Claude Storage → MultiClaudeConsolidationService → (NOT written to files) ❌
Checkpoint Files → CheckpointProcessor → Parser → Memory Files ✅
```

**The Gap:** Claude data is consolidated but never persisted to `.aicf/` and `.ai/` files.

---

## What's Actually Working

✅ Augment data flows automatically every 5 minutes
✅ Checkpoint files are processed
✅ Analysis extraction works correctly
✅ Memory files are written in correct format
✅ Deduplication by content hash works
✅ 5-minute polling interval is correct

---

## What's Missing

❌ Claude consolidated messages are not written to memory files
❌ No `.cache/llm/` folder structure being used
❌ No `chunk-[number].json` files being created
❌ Claude data is lost after consolidation

---

## The Real Architecture

This is NOT a `.cache` → `chunk-[number].json` → parser system.

This IS a direct-read system:

- **Augment:** Reads LevelDB directly
- **Claude:** Reads local storage directly
- **Checkpoints:** Reads JSON files directly

All three converge at the same analysis/writing layer.

---

## Why This Happened

You designed a `.cache` → `chunk-[number].json` → parser architecture.

But the implementation went a different direction:

1. **Augment:** Someone implemented `AugmentLevelDBReader` to read LevelDB directly
2. **Claude:** Someone implemented `ClaudeCliWatcher` and `ClaudeDesktopWatcher` to read storage directly
3. **Checkpoints:** Someone implemented `CheckpointProcessor` to read JSON directly

**Result:** Three different input methods, but they all feed into the same analysis/writing layer.

This works, but it's not what you designed. It's more direct, less abstracted.

---

## The Garbage Data Problem

Your `.ai/conversation-log.md` had 23,621 lines of garbage because:

1. Old system wrote individual checkpoint data directly to conversation-log.md
2. No deduplication happened
3. Same conversations got written multiple times
4. File grew to 23k lines with repeated data

The current system doesn't have this problem because:

- Individual files are written per conversation (`.aicf/{id}.aicf`)
- No unified conversation-log.md is being auto-generated
- The garbage was from an older version

---

## What You Need to Know

**The system IS working correctly:**

- ✅ Augment data is captured every 5 minutes
- ✅ Claude data is consolidated every 5 minutes
- ✅ Checkpoint files are processed
- ✅ Analysis is extracted correctly
- ✅ Memory files are written in correct format

**But it's NOT what you designed:**

- ❌ No `.cache/llm/` folder structure
- ❌ No `chunk-[number].json` files
- ❌ No intermediate parser layer reading from cache
- ❌ Claude data is consolidated but not persisted

**The gap:** Claude messages are consolidated but never written to disk.
