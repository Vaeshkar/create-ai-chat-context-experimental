# New Chat Prompt

## Copy/Paste This When Starting a New Chat

```
Read .ai-instructions first, then help me with [your task].
```

---

## Alternative Prompts

### Short Version

```
Read .ai-instructions first.
```

### Detailed Version

```
Read .ai-instructions file and all .ai/ knowledge base files, then help me with [your task].
```

### With Specific Task

```
Read .ai-instructions first, then help me [specific task].
```

Examples:

- `Read .ai-instructions first, then help me add authentication.`
- `Read .ai-instructions first, then help me optimize the database queries.`
- `Read .ai-instructions first, then help me improve the UI layout.`

---

## What This Does

1. AI reads `.ai-instructions` (root-level file)
2. `.ai-instructions` points to `.ai/` knowledge base
3. AI gets full context immediately
4. No need to explain architecture, decisions, or history

---

## Why This Works

- Explicit instruction - AI knows exactly what to do
- Single command - One line, easy to copy/paste
- Triggers chain - `.ai-instructions` → `.ai/` directory
- Saves time - No need to re-explain context

---

## Bookmark This File

Keep this file open or bookmarked so you can quickly copy the prompt when starting new chats.

---

**Last Updated:** [Date]
**Status:** Use "Read .ai-instructions first" at the start of every new chat
