# Augment Rule Templates - Enforceable Format

**How to make rules that LLMs actually follow, not treat as optional guidelines.**

---

## 🎯 The Problem

**Weak language = Optional behavior:**
- ❌ "You should read context files"
- ❌ "It's recommended to check for protected files"
- ❌ "Please try to follow the workflow"

**Strong language = Mandatory behavior:**
- ✅ "You MUST read context files before responding"
- ✅ "All writes to .ai/ directory are FORBIDDEN"
- ✅ "Every response MUST include rule compliance checklist"

---

## 📝 Rule Template Structure

Every rule file should follow this structure:

```markdown
# RULE #[NUMBER]: [SHORT TITLE]

**Status:** [BLOCKING | WARNING | ADVISORY]
**Priority:** [CRITICAL | HIGH | MEDIUM | LOW]
**Compliance:** [MANDATORY | REQUIRED | RECOMMENDED]

---

## What This Rule Requires

[Clear, imperative statement of what the LLM must do or must not do]

### MUST DO:
- [ ] Action 1
- [ ] Action 2

### MUST NOT DO:
- [ ] Forbidden action 1
- [ ] Forbidden action 2

---

## Why This Rule Exists

[Explain the reason - helps LLM understand context and importance]

---

## How to Comply

### Step 1: [First action]
```bash
# Example command if applicable
```

### Step 2: [Second action]
```typescript
// Example code if applicable
```

---

## Violation Detection

**This rule is violated when:**
- [ ] Condition 1
- [ ] Condition 2

**If you violate this rule:**
1. Add to your response: "⚠️ RULE [NUMBER] VIOLATION: [reason]"
2. Explain why violation occurred
3. Propose fix for next response

---

## Examples

### ✅ Good - Compliant:
[Example of compliant behavior]

### ❌ Bad - Violation:
[Example of rule violation]

---

## Success Criteria

You are compliant with this rule when:
- [ ] Criterion 1
- [ ] Criterion 2
```

---

## 📚 Example Rules

### Rule #00: Meta-Rule (Already Created)
**Location:** `.augment/rules/00-meta-rule-enforcement.md`
**Purpose:** Enforce all other rules
**Status:** BLOCKING
**See:** `docs/AUGMENT-RULE-ENFORCEMENT.md`

---

### Rule #01: Context Loading

```markdown
# RULE #01: CONTEXT LOADING

**Status:** BLOCKING
**Priority:** CRITICAL
**Compliance:** MANDATORY

---

## What This Rule Requires

Before responding to ANY user query, you MUST load project context in this order:

### MUST DO (Execute FIRST):
1. ✅ Read `.ai-instructions` file
2. ✅ Read all files in `.ai/rules/` directory
3. ✅ List and review recent conversations: `ls .lill/recent/ | head -5`
4. ✅ Confirm context loaded: "I've loaded project context from [files]"

### MUST NOT DO:
- ❌ Respond without reading context files
- ❌ Skip context loading to save time
- ❌ Assume you remember context from previous sessions

---

## Why This Rule Exists

Without context:
- You don't know project architecture
- You repeat questions already answered
- You make decisions that contradict previous work
- User wastes time re-explaining everything

With context:
- You understand project immediately
- You continue previous work seamlessly
- You make informed decisions
- User saves 10+ minutes per session

---

## How to Comply

### At Session Start (First Response):

```markdown
**Context Loading:**
✅ Read .ai-instructions
✅ Read .ai/rules/ (7 files)
✅ Reviewed recent conversations: [list top 3]

**Project Understanding:**
- Project: [name]
- Purpose: [what it does]
- Current phase: [phase]
- Last work: [summary]

I'm ready to help! What would you like to work on?
```

### During Session (Every Response):

Verify you still have context. If conversation is long (>20 messages), re-read recent decisions.

---

## Violation Detection

**This rule is violated when:**
- [ ] You ask questions already answered in context files
- [ ] You suggest solutions that contradict previous decisions
- [ ] You don't mention what phase the project is in
- [ ] First response doesn't include context confirmation

**If you violate this rule:**
Response: "⚠️ RULE 01 VIOLATION: I responded without loading context. Let me fix that now." Then load context and respond properly.

---

## Examples

### ✅ Good - Compliant:

User: "Help me add a new feature"