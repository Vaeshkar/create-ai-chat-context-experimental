# Claude Project Instructions for AETHER

## 🧠 Essential Context Loading

**CRITICAL: Before every response, you MUST:**

1. **Read .ai-instructions** - Universal AI assistant entry point
2. **Check .ai/conversation-log.md** - Recent work and decisions  
3. **Review .ai/rules/** - All project-specific rules and guidelines
4. **Query recent principles** - Check .lill/snapshots/ for latest insights

## 📋 Project Context

**Project:** AETHER - Distributed AI Memory System
**Phase:** Phase 6 - Complete Pipeline ✅
**Architecture:** Monorepo with git submodules

**Key Packages:**
- `packages/aice/` - AI Conversation Extractor
- `packages/aicf-core/` - AI Context Format
- `packages/lill-core/` - Learning & Intelligence Layer
- `packages/lill-meta/` - Meta-learning engine

## 🚫 Protected Files (NEVER Auto-Modify)

These files are manual documentation only:
- `.ai/code-style.md`
- `.ai/design-system.md`
- `.ai/npm-publishing-checklist.md`
- `.ai/Testing-philosophy.md`
- `.ai/conversation-log.md`

**Auto-generated data goes to:**
- `.lill/raw/` - Conversation exports and principles
- `.cache/llm/` - Platform-specific cache data

## 🔧 Development Standards

### **TypeScript & Code Quality**
- Strict mode enabled - no `any` types
- Use Result<T> pattern for error handling
- No throwing errors - return Result<T, Error>
- Follow existing command patterns

### **Package Management**
- Use npm/pnpm commands, not manual package.json edits
- Respect submodule workflow: commit to submodule first, then parent

### **Testing Philosophy**
- Write tests for new functionality
- Use existing test utilities and patterns
- Run `npm test` before committing

## 🏁 Session End Protocol

**CRITICAL: Before ending our conversation:**

1. **Update conversation log:**
   ```bash
   aether finish
   ```
   OR manually update `.ai/conversation-log.md`

2. **Commit changes with meaningful messages**

3. **Ensure watcher is running for continuous learning:**
   ```bash
   aether status
   aether watch  # if not running
   ```

## 🎯 Quality Checklist

Before completing any task:
- [ ] Read project context and rules
- [ ] Used proper error handling (Result<T>)
- [ ] Wrote/updated tests if applicable
- [ ] Used package managers for dependencies
- [ ] Did not modify protected `.ai/` files
- [ ] Updated session notes

## 💡 Useful Commands

```bash
# Project setup
aether init

# Memory system
aether watch          # Start continuous learning
aether status         # Check system health
aether query "text"   # Search principles

# Session management  
aether finish         # End session properly
aether install-hooks  # Git reminders

# Development
npm test             # Run tests
npm run build        # Build packages
```

## 🧠 Memory System Integration

This project uses **LILL-MQ (QuadIndex)** for intelligent memory:
- **VectorStore** - Semantic search
- **MetadataStore** - Exact filters  
- **GraphStore** - Relationships
- **ReasoningStore** - Alternatives and lessons

Query it for context: `aether query "your question"`

---

**Remember: Every conversation contributes to the collective AI memory. Work clean and follow the protocols!** 🚀
