# Conversation Log

> **📝 IMPORTANT FOR AI ASSISTANTS:**
>
> - **START of session:** Read this file to see what previous chats accomplished
> - **END of session:** Add a new entry at the TOP with today's work
> - **Format:** Use the template below
> - **Purpose:** Preserve context so the next AI session knows where to continue

Track key decisions and progress from AI chat sessions.

---

## 🔄 HOW TO USE THIS FILE

### For AI Assistants:

1. **At START of session:**

   - Read the most recent entries (top of file)
   - Understand what was accomplished in previous chats
   - Check "Next Steps" to see what needs to be done

2. **At END of session:**
   - Add a new entry at the TOP of the file (most recent first)
   - Be specific about what you accomplished
   - List any decisions made and why
   - Note what should be done next

### For Developers:

- Update this file after important AI chat sessions
- Keep entries concise but informative
- Use this to onboard new team members
- Review periodically to track project evolution

---

## 📋 CHAT HISTORY (Most Recent First)

---

## Chat #1 - [Date: YYYY-MM-DD] - [Brief Topic]

### What We Did

- [Be specific: "Implemented user authentication with JWT tokens"]
- [Not vague: "Worked on auth"]
- [List all significant changes, features, or refactors]

### Key Decisions

- **[Decision]:** [Why we chose this approach over alternatives]
- **Example:** "Used JWT instead of sessions because we need stateless API"

### Problems Solved

- **[Problem]:** [Solution we implemented]
- **Example:** "CORS errors on login - Fixed by adding credentials: 'include' to fetch"

### Next Steps

- [What should be done in the next session]
- [Unfinished work or follow-ups]
- [Known issues that need attention]

---

## Template for New Entries (AI-Optimized Format)

**Add this at the TOP of the "CHAT HISTORY" section:**

```yaml
---
CHAT: X
DATE: YYYY-MM-DD
TYPE: [FEAT|FIX|REFACTOR|DOCS|RELEASE|WORK]
TOPIC: Brief description (max 60 chars)

WHAT:
  - Primary accomplishment or change
  - Secondary accomplishment (if any)
  - Tertiary accomplishment (if any)

WHY:
  - Rationale for main decision
  - Alternative considered: [what was rejected and why]

OUTCOME: [SHIPPED|DECIDED|RESOLVED|IN_PROGRESS|BLOCKED]

FILES:
  - path/to/file.js: What changed
  - path/to/other.py: What changed

NEXT:
  - What should be done next
  - Any blockers or dependencies
---
```

**Human-Readable Alternative (if you prefer):**

```markdown
## Chat #X - [Date: YYYY-MM-DD] - [Brief Topic]

### What We Did

- [Primary accomplishment]
- [Secondary accomplishment]

### Key Decisions

- **[Decision]:** [Rationale and alternatives considered]

### Problems Solved

- **[Problem]:** [Solution implemented]

### Next Steps

- [What should be done next]
```

---

## 💡 Tips for AI-Optimized Entries

- **Use YAML format for structured data** - Easier to parse than prose
- **Be specific:** "Added bcrypt password hashing to login API" not "worked on login"
- **Include WHY:** Rationale is more important than WHAT for future decisions
- **Note alternatives:** What was considered and rejected helps avoid repeating mistakes
- **Use semantic types:** FEAT, FIX, REFACTOR, DOCS, RELEASE, WORK
- **Truncate long content:** Max 120 chars per line for token efficiency

---

**Last Updated:** [Date]

---

## 🚨 REMINDER FOR AI ASSISTANTS

**Before ending your session, you MUST:**

1. Run `npx aic chat-finish` to automatically update all .ai/ files
2. OR manually add a YAML entry at the TOP of the "CHAT HISTORY" section
3. Update the "Last Updated" date at the bottom
4. Tell the user: "I've updated the conversation log for the next session"

**If you don't do this, the next AI session will NOT know what you accomplished!**
