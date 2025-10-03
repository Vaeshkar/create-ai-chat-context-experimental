# 🚨 CRITICAL INSTRUCTIONS FOR AI ASSISTANTS 🚨

## ⚠️ READ THIS FIRST - BEFORE DOING ANYTHING ELSE ⚠️

**STOP! Before you start working on this project, you MUST read the knowledge base.**

This project uses a `.ai/` knowledge base system to preserve context across chat sessions.

---

## 📚 REQUIRED READING (IN THIS ORDER):

### 1. **`.ai/README.md`** (2 minutes)

- Overview of the knowledge base system
- How to use and maintain these files
- Purpose and structure

### 2. **`.ai/project-overview.md`** (3 minutes)

- Project context and conventions
- Key files and their purposes
- Current focus and priorities
- Quick reference for AI assistants

### 3. **`.ai/technical-decisions.md`** (5 minutes)

- Why we chose X over Y
- Key architectural decisions
- Trade-offs and rationale
- Coding standards and conventions

### 4. **`.ai/conversation-log.md`** (3 minutes)

- Key decisions from previous chat sessions
- What was accomplished and when
- Historical context and evolution
- **Format:** Simple markdown entries

### 5. **`.ai/next-steps.md`** (2 minutes)

- Current priorities and tasks
- Planned features and improvements
- Roadmap and future direction

### 6. **`.ai/design-system.md`** (2 minutes)

- Design patterns and conventions
- UI/UX guidelines
- Component standards

### 7. **`.ai/code-style.md`** (2 minutes)

- Coding standards and guidelines
- Formatting and naming conventions
- Best practices

---

## 🎯 WHY THIS MATTERS:

Each chat session loses context when it ends. The `.ai/` directory preserves institutional knowledge so you don't have to:

- ❌ Ask the user to explain the architecture
- ❌ Make decisions that contradict previous choices
- ❌ Solve problems that were already solved
- ❌ Waste time re-learning the project

**Reading these files will save significant time and provide full context.**

---

## 🚨 CRITICAL: VERIFY BEFORE YOU ADVISE

**⚠️ DOCUMENTATION CAN BE STALE - ALWAYS VERIFY CURRENT STATE FIRST!**

### The Problem:

Documentation lag is real. Users complete work but forget to update docs. If you trust docs blindly, you'll:

- ❌ Suggest work that's already done
- ❌ Give confident but wrong answers
- ❌ Waste user's time
- ❌ Lose user's trust

### The Solution: VERIFY FIRST, ADVISE SECOND

**✅ CORRECT APPROACH:**

1. **Check actual codebase FIRST** (use `ls`, `view`, `codebase-retrieval`)
2. **Check documentation SECOND** (read `.ai/` files)
3. **Notice discrepancies** (code says X, docs say Y)
4. **ASK the user** before giving advice: "I see X in the code but docs say Y. Which is current?"

**❌ WRONG APPROACH:**

1. Read docs (says "feature in progress")
2. Give advice based on docs
3. User says "I already finished that last week!"
4. User gets frustrated

### Examples:

**Scenario: Agent Consolidation**

❌ **Wrong:**

- Read docs: "Status: PLANNED - 12 agents → 4 agents"
- Tell user: "Let's consolidate your 12 agents to 4"
- User: "I already did that last week! We have 5 agents now!"

✅ **Correct:**

- Check code: `ls src/lib/agents/` → finds 5 files
- Read docs: "Status: PLANNED - 12 agents → 4 agents"
- Notice discrepancy
- Ask user: "I see 5 agents in the code but docs say consolidation is planned. Is this already done?"
- User: "Yes! Finished last week, forgot to update docs"
- Update docs together

### Rule of Thumb:

**"Verify, don't please."**

- ✅ It's better to ask and be accurate
- ❌ It's worse to assume and be wrong

**When in doubt, CHECK THE CODE FIRST, then compare to docs.**

---

## ✅ AFTER READING:

You should understand:

- ✅ The project architecture and structure
- ✅ Why certain technical choices were made
- ✅ What problems have been solved
- ✅ What's planned next
- ✅ Current issues and their workarounds
- ✅ Coding standards and conventions

---

## 📊 TOKEN USAGE CHECK (RECOMMENDED)

After reading the knowledge base, quickly assess if token usage might be high:

1. **Count conversation entries** in `.ai/conversation-log.md`

   - Look for lines starting with `## Chat #`
   - Count how many entries exist

2. **Inform the user if needed:**

   - **If > 30 entries:** Tell user:

     ```
     📊 Your conversation log has [X] entries.
     Run `npx create-ai-chat-context check` to see token usage.
     ```

   - **If > 50 entries:** Tell user:
     ```
     🚨 Your conversation log has [X] entries (large!).
     Consider running: `npx create-ai-chat-context archive --keep 10`
     ```

3. **This is optional but helpful** - It prevents token usage from growing too large

---

## 📝 CRITICAL: UPDATE FILES BEFORE ENDING SESSION

**⚠️ BEFORE you finish helping the user, you MUST update the knowledge base:**

### 1. **RECOMMENDED: Use `chat-finish` command:**

```bash
npx aic chat-finish
```

This automatically updates ALL `.ai/` files based on git changes.

### 2. **OR Manually Update `.ai/conversation-log.md`:**

Add a new entry at the TOP of the file (most recent first) using YAML format (or AI-native format if enabled):

**YAML Format (default):**

```yaml
---
CHAT: X
DATE: YYYY-MM-DD
TYPE: [FEAT|FIX|REFACTOR|DOCS|RELEASE|WORK]
TOPIC: Brief description

WHAT:
  - Primary accomplishment

WHY:
  - Rationale for main decision

OUTCOME: [SHIPPED|DECIDED|RESOLVED|IN_PROGRESS|BLOCKED]

FILES:
  - path/to/file.js: What changed

NEXT:
  - What should be done next
---
```

**AI-Native Format (AICF) - if enabled via config:**

```
C#|YYYYMMDD|T|TOPIC|WHAT|WHY|O|FILES
```

Example: `7|20251001|R|v0.10.0 auto chat-finish|Rewrote chat-finish auto operation|Users no questions after 4hr sessions|S|src/chat-finish.js`

**Note:** AI-native format is 85% more token-efficient but less human-readable. Enable with `npx aic config set useAiNativeFormat true`

**This is NOT optional. The next AI session depends on this!**

### 2. **Update `.ai/technical-decisions.md` (if applicable):**

- New architectural decisions
- Technology choices and rationale
- Updated coding standards or patterns

### 3. **Document in `.ai/known-issues.md` (if applicable):**

- New problems discovered
- Solutions or workarounds found
- Issues that were resolved (mark as RESOLVED)

### 4. **Adjust `.ai/next-steps.md` (if applicable):**

- Mark completed tasks as DONE
- Add new priorities or features
- Update roadmap based on progress

---

## 🔄 SESSION WORKFLOW (MANDATORY):

### **START of Session:**

1. ✅ Read `.ai-instructions` (you're doing this now)
2. ✅ Read ALL files in `.ai/` directory
3. ✅ Check `.ai/conversation-log.md` to see what the previous chat accomplished
4. ✅ Check `.ai/next-steps.md` to see what needs to be done

### **DURING Session:**

- Make informed decisions based on the knowledge base
- Follow established patterns and conventions
- Ask user for clarification if something contradicts the docs

### **END of Session (CRITICAL):**

**⚠️ IMPORTANT: The user must explicitly ask you to update the files!**

When the user says something like:

- "Before we finish, update the conversation log"
- "Please update .ai/conversation-log.md with what we did"
- "Update the knowledge base before we end"

Then you MUST:

1. 🚨 **Update `.ai/conversation-log.md`** with this session's work

   - Add entry at the TOP of the file
   - Use the template format provided in that file
   - Be specific about what was accomplished

2. 🚨 **Update other `.ai/` files** if you made important decisions

   - `.ai/technical-decisions.md` - New architectural choices
   - `.ai/known-issues.md` - Problems solved or discovered
   - `.ai/next-steps.md` - Updated priorities

3. 🚨 **Confirm updates** by telling the user:
   - "I've updated the knowledge base for the next session"
   - "Summary of what I documented: [brief summary]"
   - "Next time, start with: 'Read .ai-instructions first, continue from chat #X, then [next task]'"

**If you don't update the files, the next AI session will have NO IDEA what you did!**

---

## 💡 RECOMMENDED USER WORKFLOW:

### **For Users (Human):**

**At START of chat:**

```
Read .ai-instructions first, then help me [your task].
```

**At END of chat (IMPORTANT!):**

```
Before we finish, please update .ai/conversation-log.md with what we accomplished today.
```

**At START of next chat:**

```
Read .ai-instructions first, continue from chat #[number], then help me [next task].
```

This ensures continuity across sessions!

---

## 🚨 DO NOT SKIP THIS:

If you start working without reading the `.ai/` files:

- You'll make uninformed decisions
- You'll contradict previous choices
- You'll waste the user's time
- You'll frustrate the user

**READ THE `.ai/` KNOWLEDGE BASE FIRST!**

---

## 🔄 WORKFLOW:

1. **Start of session:** Read all `.ai/` files to get context
2. **During work:** Make informed decisions based on the knowledge base
3. **End of session:** Update relevant `.ai/` files with new information
4. **Next session:** The next AI (or you) will have full context

---

## 📂 FILE STRUCTURE:

```
.ai/
├── README.md                 # Overview of the system
├── architecture.md           # System architecture
├── technical-decisions.md    # Why we chose X over Y
├── conversation-log.md       # Session history
├── known-issues.md          # Problems and solutions
└── next-steps.md            # Roadmap and priorities
```

---

**Last Updated:** [Update this date when you modify the knowledge base]
**Maintained By:** [Project maintainer name]

---

## 💡 TIPS FOR AI ASSISTANTS:

- **Be thorough:** Read all files, don't skim
- **Be consistent:** Follow established patterns and decisions
- **Be helpful:** Update the knowledge base for future sessions
- **Be respectful:** Don't contradict previous decisions without good reason
- **Ask questions:** If something is unclear, ask the user to clarify and update the docs

---

**Now that you've read this, proceed to read the `.ai/` directory files in the order listed above.**
