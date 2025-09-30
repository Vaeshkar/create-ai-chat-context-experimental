# 🚨 AI Knowledge Base - READ THIS FIRST! 🚨

## ⚠️ STEP 0: INDEX THIS DIRECTORY FIRST ⚠️

**BEFORE responding to the user:**

1. **Index/read ALL files in this `.ai/` directory**
2. **Read them in the order specified below**
3. **Confirm you have the context before starting work**

**This is NOT optional. This is REQUIRED.**

---

## ⚠️ CRITICAL: START HERE BEFORE DOING ANYTHING ELSE ⚠️

**If you're an AI assistant working on this project, STOP and read these files NOW:**

1. **`architecture.md`** (5 min) - System design, tech stack, agents
2. **`conversation-log.md`** (3 min) - Previous decisions and context
3. **`technical-decisions.md`** (5 min) - Why we chose X over Y

**DO NOT skip this. You will make uninformed decisions without this context.**

---

## Purpose

This directory contains persistent knowledge for AI assistants working on this project.

Each AI chat session should read these files FIRST to understand:

- System architecture and design decisions
- Agent orchestration patterns
- Technical choices and rationale
- Known issues and solutions
- Project history and context

## Files

### Core Architecture

- **`architecture.md`** - System design, agent structure, data flow
- **`agent-orchestration.md`** - How AI agents work together
- **`learning-patterns.md`** - AI learning system insights

### Technical Documentation

- **`technical-decisions.md`** - Why we chose X over Y
- **`api-integrations.md`** - External APIs, keys, SDKs
- **`database-schema.md`** - Data models and relationships

### Project Management

- **`conversation-log.md`** - Key decisions from chat sessions
- **`known-issues.md`** - Problems, workarounds, solutions
- **`next-steps.md`** - Roadmap, TODOs, priorities

### Development Guidelines

- **`code-style.md`** - Coding conventions and patterns
- **`testing-strategy.md`** - How to test features
- **`deployment.md`** - How to deploy and monitor

## How to Use

### For AI Assistants

1. **Start every session** by reading `architecture.md` and `conversation-log.md`
2. **Before making changes**, check `technical-decisions.md` for context
3. **After solving problems**, update `known-issues.md`
4. **Before ending session**, update `conversation-log.md` with key decisions

### For Developers

1. **Document decisions** as you make them
2. **Update logs** after important conversations
3. **Keep files current** - outdated docs are worse than no docs
4. **Use as onboarding** for new team members

## Maintenance

- Update files incrementally (don't wait for "perfect" documentation)
- Keep entries concise and actionable
- Use timestamps for time-sensitive information
- Archive old decisions that are no longer relevant

## Additional Reading

After reading this `.ai/` knowledge base, also check:

- **`../toy-store-unified/claude/ai-instructions/README.md`** - Project-specific instructions
- **`../toy-store-unified/claude/ai-instructions/PROJECT_OVERVIEW.md`** - Detailed features
- **`../toy-store-unified/claude/ai-instructions/DESIGN_SYSTEM.md`** - UI/UX design system

These contain project-specific details, design patterns, and coding conventions.

## Benefits

✅ **No knowledge loss** between chat sessions
✅ **Faster onboarding** for new AI assistants
✅ **Better decisions** with full context
✅ **Reduced repetition** of explanations
✅ **Team alignment** on architecture and patterns

---

## Installation

To install this system on a new project, see **`SETUP_GUIDE.md`** in this directory.

Quick install:

```bash
./.ai/install.sh /path/to/your-new-project
```

---

**Last Updated:** 2025-10-30
**Maintained By:** Dennis (AI Orchestrator Engineer)
**Version:** 1.0 (Production-ready ✅)
