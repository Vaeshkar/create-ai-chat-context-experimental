# New Chat Prompt

## 🔄 Complete Workflow (START + END)

### **At START of Chat:**

#### First Chat (Starting Fresh)

```
Read .ai-instructions first, then help me with [your task].
```

#### With Health Check (RECOMMENDED)

```
Read .ai-instructions first, check token usage, then help me with [your task].
```

**What this does:**

- AI reads the knowledge base
- AI counts conversation entries and warns if high
- You get proactive token management

#### Continuing from Previous Chat

```
Read .ai-instructions first, and help me continue where we left off with chat #[number].
```

**Or combine both:**

```
Read .ai-instructions first, continue from chat #[number], then help me [specific task].
```

---

### **At END of Chat (CRITICAL!):**

**⚠️ Don't forget this step! Without it, the next chat won't know what you did.**

```
Before we finish, please update .ai/conversation-log.md with what we accomplished today.
```

**Or more detailed:**

```
Before we finish, please update the knowledge base:
- Add today's work to .ai/conversation-log.md
- Update any relevant technical decisions
- Note what should be done next
```

**The AI will then:**

1. Update the conversation log
2. Summarize what was documented
3. Tell you what to say at the start of the next chat

---

## 📊 Token Management (Optional)

### Check Token Usage Anytime

```bash
npx create-ai-chat-context check
```

**Shows:**

- Current token usage
- Number of conversation entries
- Status (healthy/moderate/high)
- Recommended actions if needed

### When to Check

- Every 10-20 chats
- When AI responses seem slower
- Before starting a major feature
- If you're curious!

### If Token Usage is High

**Archive old conversations:**

```bash
npx create-ai-chat-context archive --keep 10
```

**Or summarize them:**

```bash
npx create-ai-chat-context summary --keep 10
```

---

## Alternative Prompts

### Short Version

```
Read .ai-instructions first.
```

### Continue from Previous Chat (RECOMMENDED)

```
Read .ai-instructions first, and help me continue where we left off with chat #[number].
```

Examples:

- `Read .ai-instructions first, and help me continue where we left off with chat #1.`
- `Read .ai-instructions first, and help me continue where we left off with chat #5.`

**Why this is better:**

- Makes continuity explicit
- AI knows to check conversation-log.md for the specific chat
- AI understands it should continue the work, not start fresh
- Reinforces the session-to-session context preservation

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

### Continue + Specific Task (BEST)

```
Read .ai-instructions first, continue from chat #[number], then help me [specific task].
```

Examples:

- `Read .ai-instructions first, continue from chat #3, then help me add password reset.`
- `Read .ai-instructions first, continue from chat #7, then help me fix the login bug.`

**This is the most explicit and effective prompt!**

---

## What This Does

1. AI reads `.ai-instructions` (root-level file)
2. `.ai-instructions` tells AI to read all `.ai/` knowledge base files
3. AI reads `.ai/conversation-log.md` to see what previous chats accomplished
4. AI gets full context immediately - architecture, decisions, history
5. AI knows where the last chat stopped and can continue from there
6. No need to explain anything - AI has complete context

---

## Why This Works

- **Explicit instruction** - AI knows exactly what to do
- **Single command** - One line, easy to copy/paste
- **Triggers chain** - `.ai-instructions` → `.ai/` directory → full context
- **Preserves continuity** - AI reads conversation log to see what Chat #1, #2, etc. did
- **Saves time** - No need to re-explain context or repeat what was done before

---

## 🔄 How Chat Continuity Works

### Chat #1:

1. You: "Read .ai-instructions first, then help me add authentication"
2. AI reads the knowledge base (mostly empty templates at first)
3. AI helps you add authentication
4. **AI updates `.ai/conversation-log.md`** with what was accomplished
5. Chat ends

### Chat #2:

1. You: "Read .ai-instructions first, then help me add user profiles"
2. AI reads the knowledge base
3. **AI sees in conversation-log.md that Chat #1 added authentication**
4. AI knows the auth system exists and can build on it
5. AI helps you add user profiles (using the existing auth)
6. **AI updates `.ai/conversation-log.md`** with new work
7. Chat ends

### Chat #3:

1. You: "Read .ai-instructions first, then help me fix the login bug"
2. AI reads the knowledge base
3. **AI sees Chat #1 added auth, Chat #2 added profiles**
4. AI has full context of the entire project evolution
5. AI can fix the bug with complete understanding
6. **AI updates the conversation log**

**This is how context is preserved across sessions!**

---

## Bookmark This File

Keep this file open or bookmarked so you can quickly copy the prompt when starting new chats.

---

**Last Updated:** [Date]
**Status:** Use "Read .ai-instructions first" at the start of every new chat
