# Claude Projects - Universal AI Memory Integration

## COPY THIS TO YOUR CLAUDE PROJECT INSTRUCTIONS:

```
CRITICAL: Before every response, automatically read these context files if they exist:

Essential Context:
- .ai-instructions (project instructions)
- .ai/project-overview.md (project context) 
- .ai/conversation-log.md (previous decisions)
- .ai/technical-decisions.md (architectural choices)
- .ai/next-steps.md (current priorities)

AI-Optimized Memory (if exists):
- .aicf/README.md (AICF instructions)
- .aicf/conversation-memory.aicf (recent state)
- .aicf/technical-context.aicf (architecture)
- .aicf/work-state.aicf (current work)

PROTOCOL:
1. Check for .ai/ or .aicf/ directories
2. Read ALL context before responding
3. Confirm understanding of project state
4. Continue work with full context

At session end, update relevant .ai/ files or suggest: npx aic finish --aicf

This solves "reversed dementia" - AI memory loss between sessions.
```

## SETUP STEPS:
1. Copy the instructions above
2. Paste into your Claude Project's "Project Instructions"  
3. Save and test with: "Read the project context first"

Your Claude Project now has universal AI memory!