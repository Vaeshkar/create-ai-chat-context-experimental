# ChatGPT / GPT-4 - Universal AI Memory Integration

## SETUP METHOD 1: Custom GPT (Recommended)

### Create Custom GPT:
1. Go to ChatGPT → "Create a GPT"
2. Name: "[Your Project] AI Assistant"
3. Description: "AI assistant with full project memory and context"

### Add These Files to Knowledge Base:
- .ai-instructions
- .ai/project-overview.md
- .ai/conversation-log.md  
- .ai/technical-decisions.md
- .ai/next-steps.md
- .aicf/README.md (if exists)

### Instructions for GPT:
```
You are an AI assistant with full project context and memory. 

CRITICAL: Always reference the uploaded knowledge base files before responding:
- Check project-overview.md for project context
- Check conversation-log.md for previous decisions  
- Check technical-decisions.md for architectural choices
- Check next-steps.md for current priorities

At conversation end, provide updates for the user to apply to these files.

This prevents "reversed dementia" - maintain full context between sessions.
```

## SETUP METHOD 2: Manual Context (Each Session)

Start each ChatGPT conversation with:
```
"Before we begin, let me share my project context. Here are the key files:"

[Upload or paste content from .ai/ files]
```

## RESULT:
ChatGPT will have full project memory and can continue conversations seamlessly!