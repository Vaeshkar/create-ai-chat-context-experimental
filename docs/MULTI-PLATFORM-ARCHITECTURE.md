# Multi-Platform LLM Architecture

## Overview

The system is designed to support multiple LLM platforms (Warp, Claude, Copilot, ChatGPT, Cursor, Augment, etc.) through a unified extraction and consolidation pipeline.

---

## Current Implementation

### Augment (VSCode Extension)
**Status:** ✅ Fully Implemented

**Files:**
- `src/parsers/AugmentParser.ts` - Parses Augment LevelDB format
- `src/session-parsers/augment-parser.js` - Legacy parser
- `src/agents/intelligent-conversation-parser.js` - Analyzes Augment conversations

**Data Source:**
- Location: `~/.cache/llm/augment/.conversations/` (JSON chunks)
- Format: JSON with complete conversation data
- Extraction: Reads from LevelDB cache

**Flow:**
```
Augment IDE → .cache/llm/augment/.conversations/ (JSON)
           → AugmentParser → ConversationOrchestrator
           → IntelligentConversationParser → .aicf/ + .ai/
```

---

### Warp (Terminal AI)
**Status:** ✅ Partially Implemented

**Files:**
- `scripts/extract-warp-conversation.js` - Main Warp extractor
- `scripts/extract-warp-simple.js` - Simplified extractor
- `src/agents/intelligent-conversation-parser.js` - Warp analysis methods:
  - `analyzeWarpConversation()`
  - `extractWarpWorkingState()`
  - `extractWarpBlockers()`
  - `extractWarpNextAction()`
  - `extractWarpAIActions()`
  - `extractWarpTechnicalWork()`
  - `extractWarpDecisions()`
  - `extractWarpInsights()`

**Data Source:**
- Location: Warp SQLite database
- Path: `~/Library/Group Containers/2BBY89MBSN.dev.warp/Library/Application Support/dev.warp.Warp-Stable/warp.sqlite`
- Tables: `agent_conversations`, `ai_queries`

**Flow:**
```
Warp Terminal → SQLite DB
             → extract-warp-conversation.js
             → IntelligentConversationParser.analyzeWarpConversation()
             → .aicf/ + .ai/
```

**What's Missing:**
- Automatic watcher (like Augment has)
- Integration into main CLI
- Scheduled extraction

---

## Planned Platforms

### Claude (Desktop)
**Status:** 🚀 Ready for Implementation

**Data Source:**
- Location: `~/Library/Application Support/Claude/` (estimated)
- Format: Likely JSON or SQLite
- Extraction: Need to research Claude's storage format

**Required:**
- `src/parsers/ClaudeParser.ts`
- `src/extractors/ClaudeExtractor.ts`
- Watcher integration

---

### Copilot (VS Code)
**Status:** 🚀 Ready for Implementation

**Data Source:**
- Location: VS Code extensions storage
- Format: Likely JSON or SQLite
- Extraction: Need to research Copilot's storage format

**Required:**
- `src/parsers/CopilotParser.ts`
- `src/extractors/CopilotExtractor.ts`
- Watcher integration

---

### ChatGPT (Desktop/Web)
**Status:** 🚀 Ready for Implementation

**Data Source:**
- Location: `~/Library/Application Support/com.openai.chat/` (Desktop)
- Format: JSON files
- Extraction: Partially implemented in `src/context-extractor.js`

**Required:**
- `src/parsers/ChatGPTParser.ts`
- `src/extractors/ChatGPTExtractor.ts`
- Watcher integration

---

### Cursor (IDE)
**Status:** 🚀 Ready for Implementation

**Data Source:**
- Location: Cursor IDE storage (similar to VS Code)
- Format: Likely JSON or SQLite
- Extraction: Need to research Cursor's storage format

**Required:**
- `src/parsers/CursorParser.ts`
- `src/extractors/CursorExtractor.ts`
- Watcher integration

---

## Architecture Pattern

### Directory Structure
```
.cache/llm/
├── augment/
│   ├── .meta/
│   ├── .conversations/
│   └── .watcher-state.json
├── warp/
│   ├── .meta/
│   ├── .conversations/
│   └── .watcher-state.json
├── claude/
│   ├── .meta/
│   ├── .conversations/
│   └── .watcher-state.json
├── copilot/
│   ├── .meta/
│   ├── .conversations/
│   └── .watcher-state.json
├── chatgpt/
│   ├── .meta/
│   ├── .conversations/
│   └── .watcher-state.json
└── cursor/
    ├── .meta/
    ├── .conversations/
    └── .watcher-state.json
```

### Parser Pattern
Each platform needs:
1. **Parser** (`src/parsers/{Platform}Parser.ts`)
   - Converts platform-specific format to standard Message[]
   - Handles platform quirks and data structures

2. **Extractor** (`src/extractors/{Platform}Extractor.ts`)
   - Extracts platform-specific insights
   - Analyzes working state, blockers, next actions

3. **Watcher** (integrated into `src/commands/WatcherCommand.ts`)
   - Monitors platform data source
   - Triggers extraction on new conversations

---

## Implementation Roadmap

### Phase 1: Warp Integration ✅
- [x] Extract Warp conversations from SQLite
- [x] Analyze Warp-specific patterns
- [ ] Add automatic watcher
- [ ] Integrate into CLI

### Phase 2: Claude Integration 🚀
- [ ] Research Claude storage format
- [ ] Create ClaudeParser
- [ ] Create ClaudeExtractor
- [ ] Add watcher

### Phase 3: Copilot Integration 🚀
- [ ] Research Copilot storage format
- [ ] Create CopilotParser
- [ ] Create CopilotExtractor
- [ ] Add watcher

### Phase 4: ChatGPT Integration 🚀
- [ ] Finalize ChatGPT extraction
- [ ] Create ChatGPTParser
- [ ] Create ChatGPTExtractor
- [ ] Add watcher

### Phase 5: Cursor Integration 🚀
- [ ] Research Cursor storage format
- [ ] Create CursorParser
- [ ] Create CursorExtractor
- [ ] Add watcher

---

## Key Files Reference

**Core Orchestration:**
- `src/orchestrators/ConversationOrchestrator.ts` - Routes to correct parser/extractor

**Existing Parsers:**
- `src/parsers/AugmentParser.ts` - Augment format
- `src/parsers/GenericParser.ts` - Fallback parser

**Existing Extractors:**
- `src/extractors/IntentExtractor.ts` - User intents
- `src/extractors/ActionExtractor.ts` - AI actions
- `src/extractors/TechnicalWorkExtractor.ts` - Technical work
- `src/extractors/DecisionExtractor.ts` - Decisions
- `src/extractors/FlowExtractor.ts` - Conversation flow
- `src/extractors/StateExtractor.ts` - State tracking

**Watcher:**
- `src/commands/WatcherCommand.ts` - Main watcher loop
- `src/utils/WatcherManager.ts` - Watcher lifecycle

**Analysis:**
- `src/agents/intelligent-conversation-parser.js` - Platform-specific analysis

---

## Next Steps

1. Research Warp SQLite schema (already partially done)
2. Implement automatic Warp watcher
3. Research Claude storage format
4. Create Claude parser and extractor
5. Repeat for other platforms

