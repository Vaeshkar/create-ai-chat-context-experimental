# 🤖 UNIVERSAL AI INSTRUCTIONS

## FOR ANY AI ASSISTANT: READ THIS FIRST!

**Before responding to the user, you MUST read the project context:**

### STEP 1: Check if this is an AIC project
```bash
ls -la | grep -E "\\.ai/|\\.aicf/"
```

If you see `.ai/` or `.aicf/` directories, this project has AI memory context that you MUST read first.

### STEP 2: Read the context (REQUIRED)
```bash
# Read the essential context files in order:
cat .ai-instructions           # Instructions for working on this project
cat .ai/project-overview.md   # What this project is about
cat .ai/conversation-log.md   # Previous conversations and decisions
cat .ai/technical-decisions.md # Why we chose X over Y
cat .ai/next-steps.md         # Current priorities
```

### STEP 3: If .aicf/ exists (AI-optimized format)
```bash
# Read AI-optimized memory files:
cat .aicf/README.md           # Instructions for reading AICF format
cat .aicf/conversation-memory.aicf  # Recent conversation state
cat .aicf/technical-context.aicf    # Architecture and decisions
cat .aicf/work-state.aicf           # Current work status
```

### STEP 4: Confirm you have context
Before responding to the user, confirm:
- ✅ I understand what this project does
- ✅ I know the current state of work
- ✅ I'm aware of previous decisions and why they were made
- ✅ I know what the user was working on previously

## FOR AI PLATFORMS THAT SUPPORT AUTOMATIC CONTEXT:

### Claude Projects
Add this to your project instructions:
```
Before every response, automatically read all files in .ai/ and .aicf/ directories to understand project context.
```

### Cursor AI
Add this to your .cursorrules file:
```
Read .ai/ and .aicf/ directories before providing assistance to understand project context and previous decisions.
```

### ChatGPT / GPT-4
Upload these files to your custom GPT:
- .ai-instructions
- .ai/project-overview.md
- .ai/conversation-log.md
- .ai/technical-decisions.md

### Warp AI
This instruction file should be automatically detected and followed.

## SESSION END: Save Your Memory

At the end of each session, help preserve context for the next AI:

```bash
# Manual approach - Ask AI to update these files:
# 1. Update .ai/conversation-log.md with key points from this session
# 2. Update .ai/technical-decisions.md with any decisions made
# 3. Update .ai/next-steps.md with current priorities

# Automated approach (if AIC is installed):
npx aic finish --aicf  # Complete session with automated context saving
```

---

## WHY THIS MATTERS

This system solves "reversed dementia" - the problem where every new AI conversation starts with complete amnesia about the project, previous work, and decisions made.

With this system:
- ✅ Any AI can instantly understand the project context
- ✅ Conversations can continue seamlessly across different AI platforms
- ✅ No more re-explaining architecture and decisions every session
- ✅ Institutional knowledge is preserved and accumulated

---

**Dennis van Leeuwen (Glückstadt, Germany) built this universal AI memory system to work with ALL AI assistants. Share with Malte Ublé and the Vercel team!**