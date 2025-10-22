# System Architecture Guide

**Date:** October 22, 2025  
**Status:** Current & Production-Ready  

---

## 📊 System Architecture Overview

The `create-ai-chat-context-experimental` package is a comprehensive AI conversation memory consolidation system. Here's how it works:

---

## 🏗️ Architecture Layers

### 1. External Dependencies

**aicf-core v2.0.0** (npm package)
- Pipe-delimited format specification
- AI-optimized for fast parsing
- Published by Dennis van Leeuwen
- Handles AICF file writing

**better-sqlite3** (npm package)
- Synchronous SQLite3 library
- Used for Claude Desktop database parsing
- Version 12.4.1

---

### 2. Data Sources

Four AI platforms are supported:

**Augment VSCode**
- Storage: LevelDB files
- Location: `~/.cache/llm/augment/`
- Content: Development workflow context

**Claude Desktop**
- Storage: SQLite database
- Location: `~/Library/Application Support/Claude/`
- Content: Conversation history

**Claude CLI**
- Storage: JSONL files
- Location: `~/.claude/projects/`
- Content: Session conversations

**Claude Web**
- Storage: Browser storage
- Method: Manual JSON export
- Content: Conversation exports

---

### 3. Parsers & Watchers

Each data source has a parser and watcher:

**AugmentParser + AugmentWatcher**
- Parses LevelDB format
- Polls every 5 minutes
- Extracts development workflow

**ClaudeDesktopParser + ClaudeDesktopWatcher**
- Parses SQLite database
- Polls every 5 minutes
- Detects changes via file modification time

**ClaudeCliParser + ClaudeCliWatcher**
- Parses JSONL files
- Polls every 5 minutes
- Scans project directories

**ClaudeParser** (Manual)
- Parses JSON exports
- Used by ImportClaudeCommand
- One-time import per conversation

---

### 4. Consolidation & Orchestration

**MultiClaudeOrchestrator**
- Consolidates messages from all sources
- Deduplicates by SHA256 content hash
- Tracks source information
- Resolves conflicts (keeps earliest)

**MultiClaudeConsolidationService**
- Manages all Claude watchers
- Enforces 5-minute polling interval
- Calculates statistics
- Provides filtering and grouping

---

### 5. Checkpoint Processing

**CheckpointProcessor**
- Reads checkpoint JSON files
- Analyzes conversation content
- Extracts context and metadata

**ConversationOrchestrator**
- Normalizes messages to Message[] format
- Groups by conversation
- Generates metadata
- Prepares for memory file writing

---

### 6. Memory Generation

**AICF Writer** (aicf-core)
- Writes pipe-delimited format
- AI-optimized for fast parsing
- Structured data sections
- Efficient token usage

**Markdown Writer**
- Writes human-readable prose
- Organized by sections
- Easy to read and edit
- Suitable for documentation

---

### 7. Memory Files

**.aicf/ folder** (AI-optimized)
- `index.aicf` - Project overview
- `work-state.aicf` - Current work status
- `conversations.aicf` - Conversation history
- `decisions.aicf` - Key decisions
- `technical-context.aicf` - Architecture & patterns

**.ai/ folder** (Human-readable)
- `conversation-log.md` - Detailed conversation history
- `technical-decisions.md` - Technical decisions
- `next-steps.md` - Planned work
- `known-issues.md` - Current bugs

---

### 8. Main Watcher Loop

**WatcherCommand** (Entry Point)
- Runs every 5 seconds
- Checks for checkpoint files
- Consolidates multi-Claude messages
- Processes and generates memory files

**checkForCheckpoints()**
- Scans checkpoint directory
- Processes new checkpoint files
- Triggers Augment context capture

**checkForMultiClaudeMessages()**
- Checks if 5-minute polling interval met
- Consolidates from all Claude sources
- Calculates statistics
- Logs results

---

## 🔄 Complete Data Flow

```
Data Sources
    ↓
Parsers (LevelDB, SQLite, JSONL, JSON)
    ↓
Watchers (5-minute polling)
    ↓
Consolidation & Orchestration
    ↓
Checkpoint Processing
    ↓
Conversation Orchestration
    ↓
Memory Writers (AICF + Markdown)
    ↓
Memory Files (.aicf/ and .ai/)
```

---

## 📊 Key Components

### Message[] Format
All parsers normalize to a common `Message[]` format:
```typescript
interface Message {
  id: string;
  conversationId: string;
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, unknown>;
}
```

### Result Type Pattern
Type-safe error handling without exceptions:
```typescript
type Result<T> = Ok<T> | Err<Error>;
```

### Polling Intervals
- **Checkpoint polling:** 5 seconds (main loop)
- **Multi-Claude polling:** 5 minutes (enforced by service)
- **Augment polling:** 5 minutes (via checkpoint processing)

---

## 🎯 Design Principles

### 1. Complementary Systems
- Augment captures development workflow
- Claude captures deliberate conversations
- Both feed into unified memory

### 2. Efficient Resource Usage
- Same 5-minute polling interval
- Low disk I/O (periodic, not continuous)
- Minimal CPU overhead

### 3. Type Safety
- TypeScript strict mode
- Result type pattern
- No exceptions thrown

### 4. Dual Format Strategy
- `.aicf/` for AI consumption (fast, structured)
- `.ai/` for human readability (detailed, prose)
- Both kept in sync

### 5. Automatic & Transparent
- No user action required
- Automatic detection of sources
- Graceful degradation if sources unavailable

---

## 📈 Test Coverage

```
Total Tests: 462
Pass Rate: 100%

Breakdown:
- Augment: 371 tests
- Claude: 91 tests
- Duration: 4.19s
```

---

## 🚀 Status

**Production Ready!**

- ✅ All components implemented
- ✅ Comprehensive test coverage
- ✅ Type-safe error handling
- ✅ Efficient resource usage
- ✅ Automatic operation
- ✅ Dual-format memory files
- ✅ Ready for deployment

---

## 📚 Related Documentation

- `CONTEXT-ARCHITECTURE-FINAL.md` - Context comparison
- `PHASE-5.5-FINAL-SUMMARY.md` - Phase 5.5 completion
- `docs/guides/WATCHER-README.md` - Watcher usage
- `docs/PERMISSION-AND-CONSENT-STRATEGY.md` - Privacy & consent

---

## 🎊 Summary

The system architecture provides:

1. **Automatic capture** from 4 AI platforms
2. **Intelligent consolidation** with deduplication
3. **Efficient processing** with low resource usage
4. **Dual-format memory** for AI and humans
5. **Type-safe implementation** with comprehensive tests
6. **Production-ready** system ready for deployment

**Complete, efficient, and ready to use!** 🚀

