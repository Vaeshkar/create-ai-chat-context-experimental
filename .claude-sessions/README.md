# Claude CLI Session Data

This directory contains Claude CLI conversation sessions from your projects.

## Sessions Captured

### 1. create-ai-chat-context (Session: 919edfca)
- **Date:** October 4, 2025
- **File:** `create-ai-chat-context_919edfca.jsonl`
- **Messages:** 2 (1 user, 1 assistant)
- **Project:** create-ai-chat-context

### 2. create-ai-chat-context-experimental (Session: 822ffcbf)
- **Date:** October 22, 2025
- **File:** `create-ai-chat-context-experimental_822ffcbf.jsonl`
- **Messages:** 2 (1 user, 1 assistant)
- **Project:** create-ai-chat-context-experimental

## Format

These files are in JSONL format (JSON Lines):
- One JSON object per line
- Each line represents a single message (user or assistant)
- Contains full metadata: timestamps, session IDs, git context, working directory

## How to View

### Pretty-print a session:
```bash
cat create-ai-chat-context_919edfca.jsonl | jq .
```

### Extract user messages:
```bash
cat create-ai-chat-context_919edfca.jsonl | jq -r 'select(.type == "user") | .message.content'
```

### Extract assistant messages:
```bash
cat create-ai-chat-context_919edfca.jsonl | jq -r 'select(.type == "assistant") | .message.content[0].text'
```

## Source

These sessions were copied from:
- `~/.claude/projects/-Users-leeuwen-Programming-create-ai-chat-context/`
- `~/.claude/projects/-Users-leeuwen-Programming-create-ai-chat-context-experimental/`

## Phase 5.5 Testing

These files were used to test Phase 5.5 Multi-Claude Support:
- ✅ Claude CLI detection
- ✅ JSONL parsing
- ✅ Message extraction
- ✅ Role identification (user/assistant)
- ✅ Cache writing

See `docs/PHASE-5.5-ENABLED.md` for full test results.
