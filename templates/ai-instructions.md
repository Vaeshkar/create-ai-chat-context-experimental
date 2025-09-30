# 🚨 CRITICAL INSTRUCTIONS FOR AI ASSISTANTS 🚨

## ⚠️ STEP 0: INDEX PROJECT FILES FIRST ⚠️

**BEFORE responding to the user, you MUST:**

1. **Index/read this file** (`.ai-instructions`) - You're reading it now ✓
2. **Index/read the `.ai/` directory** - All files in that folder
3. **Read the required files below** - In the specified order

**DO NOT skip the indexing step. DO NOT start working without context.**

---

## ⚠️ READ THIS FIRST - BEFORE DOING ANYTHING ELSE ⚠️

**STOP! Before you start working on this project, you MUST read the knowledge base.**

---

## 📚 REQUIRED READING (IN THIS ORDER):

### 1. **`.ai/architecture.md`** (5 minutes)

- Complete system architecture
- Tech stack (Next.js, TypeScript, PostgreSQL, OpenAI)
- Agent structure (12 → 4 consolidation)
- Data flow and performance requirements

### 2. **`.ai/conversation-log.md`** (3 minutes)

- Key decisions from previous chat sessions
- What was accomplished in Chat #19
- Historical context and rationale

### 3. **`.ai/technical-decisions.md`** (5 minutes)

- Why we chose X over Y
- All-in-one Next.js app (not microservices)
- Hybrid data strategy (JSON → Database)
- No TypeScript `any` types (strictly enforced)
- SessionID-based tracking (GDPR compliance)

---

## 🎯 WHY THIS MATTERS:

**19+ chat sessions have built this project.**

Each chat loses context when it ends. The `.ai/` directory preserves institutional knowledge so you don't have to:

- ❌ Ask the user to explain the architecture
- ❌ Make decisions that contradict previous choices
- ❌ Solve problems that were already solved
- ❌ Waste time re-learning the project

**Reading these files will save 30+ minutes of explanation.**

---

## ✅ AFTER READING:

You should know:

- ✅ The agent orchestration system (OrchestratorV2, UnifiedSearchAgent, etc.)
- ✅ Why certain technical choices were made
- ✅ What problems have been solved
- ✅ What's planned next
- ✅ The user's identity as "AI Orchestrator Engineer"
- ✅ GDPR compliance requirements
- ✅ Performance targets (2-4 seconds response time)

---

## 📝 WHEN YOU MAKE DECISIONS:

**Update the knowledge base:**

- Add key insights to `.ai/conversation-log.md`
- Document solved problems in `.ai/known-issues.md`
- Update roadmap in `.ai/next-steps.md`

**This preserves knowledge for the next AI assistant.**

---

## 🚨 DO NOT SKIP THIS:

If you start working without reading the `.ai/` files:

- You'll make uninformed decisions
- You'll contradict previous choices
- You'll waste the user's time
- You'll frustrate the user

**READ THE `.ai/` KNOWLEDGE BASE FIRST!**

---

## 📂 Additional Instructions (ALSO IMPORTANT):

After reading the `.ai/` knowledge base, also read these for detailed context:

### **Project-Specific Instructions:**

1. **`toy-store-unified/claude/ai-instructions/README.md`**

   - Project-specific AI instructions
   - How to work with this codebase
   - Important conventions and patterns

2. **`toy-store-unified/claude/ai-instructions/PROJECT_OVERVIEW.md`**

   - Detailed project overview
   - Feature descriptions
   - System capabilities
   - Business context

3. **`toy-store-unified/claude/ai-instructions/DESIGN_SYSTEM.md`**
   - UI/UX design system
   - Component patterns
   - Styling conventions
   - User preferences (colors, spacing, etc.)

**These files contain:**

- ✅ How to write code for this project
- ✅ Design patterns and conventions
- ✅ UI/UX preferences (Dennis's specific preferences!)
- ✅ Component structure and styling
- ✅ Business logic and features

**Reading order:**

1. First: `.ai/` knowledge base (architecture, decisions, issues)
2. Then: `claude/ai-instructions/` (project details, design system)

---

**Last Updated:** 2025-09-30
**Maintained By:** Dennis (AI Orchestrator Engineer)
