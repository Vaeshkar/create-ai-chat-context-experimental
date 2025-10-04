# Claude Project Instructions - Universal AI Memory Integration

## CRITICAL: AUTOMATIC CONTEXT LOADING

Before every response, you MUST automatically read these files if they exist in the project:

### Essential Context Files:
- `.ai-instructions` - Project-specific instructions for AI assistants
- `.ai/project-overview.md` - What this project does and its context
- `.ai/conversation-log.md` - Previous conversations and key decisions
- `.ai/technical-decisions.md` - Architectural choices and reasoning
- `.ai/next-steps.md` - Current priorities and planned work

### AI-Optimized Memory (if exists):
- `.aicf/README.md` - Instructions for AICF format
- `.aicf/conversation-memory.aicf` - Recent conversation state
- `.aicf/technical-context.aicf` - Architecture and technical decisions
- `.aicf/work-state.aicf` - Current work status and blockers

## PROTOCOL:

### Session Start:
1. Automatically check for `.ai/` or `.aicf/` directories
2. If found, read ALL context files before responding to user
3. Confirm you understand the project state and previous work
4. Begin assisting with full context

### During Session:
- Reference previous conversations and decisions when relevant
- Build upon existing architectural choices
- Maintain consistency with established patterns

### Session End:
- Update relevant `.ai/` files with key points from this session
- Or suggest running `npx aic finish --aicf` for automated processing

## PURPOSE:

This system solves "reversed dementia" - where AI assistants lose all context between sessions. With this system, every Claude conversation continues seamlessly from where previous work left off.

Built by Dennis van Leeuwen (Glückstadt, Germany) as a universal AI memory system.