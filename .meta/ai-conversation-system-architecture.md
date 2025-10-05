# AI Conversation System Architecture

## 🚨 CRITICAL: Read This When Warp Resets Conversation

When Warp creates a new conversation ID, this document preserves knowledge about how the system works.

---

## System Overview

We have **TWO DIFFERENT SYSTEMS** for processing AI conversations:

### 1. 🎯 **CORRECT SYSTEM (Rich Content)** - MarkdownUpdater
- **File**: `src/agents/markdown-updater.js`
- **Purpose**: Creates rich, detailed conversation-log.md entries
- **Output Format**: 
  ```markdown
  ## Chat 1237cec7 - 2025-10-04 - AI Terminal Session
  ### What We Accomplished
  - **Major work completed:** [detailed list of actual work]
  ### Key Decisions  
  - **Strategic decisions:** [real decisions made]
  ### Problems & Solutions
  - **Issues addressed:** [actual problems solved]
  ```
- **Used by**: Direct SQLite extraction with conversation analysis
- **Status**: ✅ **THIS IS WHAT WE WANT**

### 2. ❌ **WRONG SYSTEM (Generic Content)** - FileWriter
- **File**: `src/agents/file-writer.js` 
- **Purpose**: Basic checkpoint processing for .aicf files
- **Output Format**:
  ```markdown
  **2025-10-05 - conversation-id Checkpoint 1:**
  - 🔄 **Working on:** ongoing development
  - 📈 **Progress:** 1/1 tasks (85%)
  ```
- **Used by**: Checkpoint orchestrator with structured sections
- **Status**: ❌ **AVOID FOR CONVERSATION-LOG.MD**

---

## How It Should Work

### For Warp Conversations:
1. **Extract conversation** using `ContextExtractor` + direct SQLite access
2. **Process with MarkdownUpdater** using `analyzeConversation()` method
3. **Generate rich content** with actual user intents, AI actions, decisions
4. **Write to conversation-log.md** with detailed sections

### For Augment Conversations:
1. **Extract messages** using `AugmentParser` with LevelDB parsing
2. **Group messages** into meaningful conversation sessions (not individual messages)
3. **Process with Augment-specific analysis** 
4. **Write rich content** to both .aicf and .ai files

---

## Current Issues (2025-10-05)

### ✅ FIXED: System Swap Issue
~~❌ **Problem**: System switched to using FileWriter instead of MarkdownUpdater~~
- ~~FileWriter creates generic "ongoing development" entries~~
- ~~MarkdownUpdater creates rich detailed entries we actually want~~

✅ **Solution**: 
1. ✅ Use MarkdownUpdater for conversation-log.md updates
2. ✅ Keep FileWriter only for basic .aicf checkpoint processing
3. ✅ Route conversation processing correctly based on source

### 🚨 CRITICAL: History Destruction Bug
❌ **Problem**: MarkdownUpdater was DESTROYING existing conversation history
- File should accumulate **5 days of development work** (3000+ lines)
- Instead it kept **replacing/truncating** to ~300 lines
- **Root cause**: Line 201-217 replaced entire history section instead of prepending
- **Data loss**: "Many many times" - critical development history lost

✅ **Solution**: 
1. ✅ **PRESERVE existing history** when updating conversation-log.md
2. ✅ **PREPEND new entries** to existing content (don't replace)
3. ✅ Extract `existingHistory` and append it after new entries
4. ❌ **TODO**: Implement backup strategy to prevent future data loss

---

## File Responsibilities

### Source Detection & Extraction:
- `src/context-extractor.js` - Multi-platform conversation extraction
- `src/session-parsers/augment-parser.js` - Augment LevelDB parsing
- `src/auto-updater.js` - Source-exclusive mode logic

### Analysis & Processing:
- `src/agents/intelligent-conversation-parser.js` - Platform-specific analysis
- `src/agents/markdown-updater.js` - **Rich conversation-log.md creation**
- `src/agents/file-writer.js` - Basic .aicf file writing

### Orchestration:
- `src/checkpoint-orchestrator.js` - Controls which system is used
- `bin/cli.js` - Manual vs automatic update commands

---

## Command Usage

### Manual Updates (All Sources):
```bash
npx aic update --conversation
```
- Checks all AI sources for latest conversation
- Should use MarkdownUpdater for rich content

### Auto Updates (Source-Exclusive):
```bash  
npx aic auto-update --start
```
- Uses source-exclusive mode (Augment OR Warp, not both)
- Should maintain rich content processing

### Force Extract Specific Conversation:
```bash
npx aic extract-conversation [ID] --source warp
```
- Bypasses detection, forces processing
- Good for debugging and manual fixes

---

## Expected Data Quality

### Conversation-Log.md Should Show:
- ✅ **Actual work accomplished** (not "ongoing development")
- ✅ **Real user intents** (not "no_intent_detected")  
- ✅ **Specific AI actions** (not generic "processing")
- ✅ **Concrete decisions made** (not empty decisions)
- ✅ **Real problems solved** (not placeholder text)

### Signs System Is Broken:
- ❌ Generic "ongoing development" entries
- ❌ Empty user_queries/ai_actions in .aicf files
- ❌ "no_intent_detected" instead of actual content
- ❌ FileWriter being used for conversation-log.md

---

## Recovery Steps When System Breaks:

1. **Check current conversation ID**:
   ```bash
   node -e "const {ContextExtractor}=require('./src/context-extractor'); const e=new ContextExtractor(); e.listConversations('warp',{limit:1}).then(c=>console.log(c[0]?.id))"
   ```

2. **Force extract with rich processing**:
   ```bash
   npx aic extract-conversation [ID] --source warp --verbose
   ```

3. **Verify MarkdownUpdater is being used** (not FileWriter)

4. **Check .aicf/conversation-memory.aicf** for rich content vs empty content

---

## Development Notes

- **Warp conversation resets**: Happen unpredictably, new IDs created
- **Source-exclusive mode**: Prevents mixing Augment + Warp data  
- **Timestamp sync issues**: Warp metadata lags behind actual message timestamps
- **Message grouping**: Critical for Augment (individual messages → sessions)

---

**Last Updated**: 2025-10-05  
**Status**: Documented system swap issue - needs fix to route to MarkdownUpdater