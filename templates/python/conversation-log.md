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

## Template for New Entries

**Copy this template and add it at the TOP of the "CHAT HISTORY" section:**

```markdown
## Chat #X - [Date: YYYY-MM-DD] - [Brief Topic]

### What We Did

- [List all accomplishments, changes, features added]
- [Be specific and detailed]

### Key Decisions

- **[Decision]:** [Rationale and alternatives considered]

### Problems Solved

- **[Problem]:** [Solution implemented]

### Next Steps

- [What should be done in the next session]
- [Unfinished work or follow-ups]
```

---

## 💡 Tips for Good Entries

- **Be specific:** "Added login API endpoint with bcrypt password hashing" not "worked on login"
- **Include context:** Why decisions were made, what alternatives were considered
- **Link to code:** Mention file names or functions that were changed
- **Note blockers:** If something is waiting on external factors
- **Update regularly:** Don't wait until the end of a long session

---

**Last Updated:** [Date]

---

## 🚨 REMINDER FOR AI ASSISTANTS

**Before ending your session, you MUST:**

1. Add a new entry at the TOP of the "CHAT HISTORY" section
2. Fill in all sections (What We Did, Key Decisions, Problems Solved, Next Steps)
3. Update the "Last Updated" date at the bottom
4. Tell the user: "I've updated the conversation log for the next session"

**If you don't do this, the next AI session will NOT know what you accomplished!**
