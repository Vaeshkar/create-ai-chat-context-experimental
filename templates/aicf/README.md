# AICF (AI Chat Context Format) - AI Memory System

**Purpose:** AI-optimized memory format for preserving context across chat sessions

**Format:** Pipe-delimited structured data (compact, efficient)

**Audience:** AI assistants (not humans - use `.ai/` folder for human-readable docs)

---

## 📋 HOW AI SHOULD USE THIS FOLDER

### At START of Session:

1. **Read `.aicf/` files FIRST** (compact, fast context loading)
2. **Read `.ai/` files if needed** (detailed context)
3. **Understand current state** from `work-state.aicf`
4. **Review recent decisions** from `conversation-memory.aicf`

### At END of Session:

**User will say:** "Can you update the .ai and .aicf files"

**Then you:**
1. Update `.ai/` files (human-readable markdown)
2. Update `.aicf/` files (AI-optimized structured format)
3. Report what was updated
4. User reviews with `git diff` and commits

---

## 📁 FILES IN THIS FOLDER

### `conversation-memory.aicf`
**Purpose:** Recent conversation history and key insights

**Sections:**
- `@CONVERSATION` - Session metadata
- `@FLOW` - Conversation flow (who said what, in order)
- `@DETAILS` - Important details (test results, metrics, etc.)
- `@INSIGHTS` - Key learnings and realizations
- `@DECISIONS` - Decisions made and their impact
- `@STATE` - Current state (last update, status, files changed)

### `technical-context.aicf`
**Purpose:** Technical architecture and decisions

**Sections:**
- `@ARCHITECTURE` - System components and structure
- `@TECHNOLOGIES` - Tech stack and versions
- `@DECISIONS` - Technical decisions and rationale
- `@PATTERNS` - Code patterns and conventions

### `work-state.aicf`
**Purpose:** Current work status and next actions

**Sections:**
- `@CURRENT` - What's being worked on now
- `@NEXT` - What needs to be done next
- `@BLOCKED` - What's blocked and why
- `@COMPLETED` - Recently completed work

---

## 🔧 FORMAT SPECIFICATION

### Pipe-Delimited Format

**Structure:** `key=value|key=value|key=value`

**Example:**
```
task=implement_feature_x|status=in_progress|priority=high
```

### Snake_Case Convention

**All values use underscores instead of spaces:**
- ✅ `user_authentication_system`
- ❌ `user authentication system`

### Section Headers

**Format:** `@SECTION_NAME`

**Example:**
```
@CONVERSATION:session_identifier
timestamp_start=2025-10-03T14:00:00Z
timestamp_end=2025-10-03T15:00:00Z
messages=50
tokens=15000

@FLOW
user_asked_question|ai_responded|user_clarified|ai_implemented_solution

@INSIGHTS
key_insight_about_problem|another_important_realization|CRITICAL
```

### Multi-Line Entries

**Use pipe `|` to separate sequence items:**
```
@FLOW
step1|step2|step3|step4
```

**Use newlines for separate entries:**
```
@INSIGHTS
insight1|details|priority
insight2|details|priority
insight3|details|priority
```

---

## 💡 WRITING GUIDELINES FOR AI

### Be Concise But Complete

**Good:**
```
@DECISIONS
abandoned_automated_compression_after_quality_tests_failed|20_26_percent_preservation_below_60_percent_threshold|IMPACT:CRITICAL
```

**Bad (too verbose):**
```
@DECISIONS
We decided to abandon the automated compression approach because after running quality tests, we found that it only achieved 20-26% preservation which was below our 60% threshold.
```

### Use Structured Data

**Good:**
```
@DETAILS:test_results
test1_tokens=2225|test1_preserved=32_of_123|test1_rate=26_percent|test1_status=FAILED
```

**Bad (unstructured):**
```
@DETAILS:test_results
Test 1 had 2225 tokens and preserved 32 out of 123 terms (26%) and failed.
```

### Prioritize Information

**Use priority markers:**
- `CRITICAL` - Must know for next session
- `HIGH` - Important context
- `MEDIUM` - Useful background
- `LOW` - Nice to have

**Example:**
```
@INSIGHTS
core_architecture_changed_from_monolith_to_microservices|affects_all_future_development|CRITICAL
added_logging_to_debug_module|helps_with_troubleshooting|MEDIUM
```

---

## 🔄 UPDATE WORKFLOW

### When User Says: "Update the .ai and .aicf files"

**Step 1: Update `.ai/` files (human-readable)**
- `conversation-log.md` - Add new chat entry
- `technical-decisions.md` - Add decisions (if any)
- `next-steps.md` - Update tasks (completed at top!)
- `known-issues.md` - Add issues (if any)

**Step 2: Update `.aicf/` files (AI-optimized)**
- `conversation-memory.aicf` - Add new @CONVERSATION section
- `technical-context.aicf` - Update if architecture changed
- `work-state.aicf` - Update @CURRENT, @NEXT, @COMPLETED

**Step 3: Report back**
- List what files were updated
- Summarize key changes
- Remind user to review and commit

---

## 📊 TOKEN EFFICIENCY

**Why AICF format?**

**Markdown (verbose):**
```markdown
### Chat #15
**Date:** 2025-10-03
**Goal:** Big cleanup for v1.0.0 release

**Key Decisions:**
- Abandoned automated compression approach
- Adopted manual AICF writing
```
**~50 tokens**

**AICF (compact):**
```
@CONVERSATION:chat_15_big_cleanup
timestamp=2025-10-03
goal=big_cleanup_for_v1_0_0_release

@DECISIONS
abandoned_automated_compression|adopted_manual_aicf_writing
```
**~25 tokens** (50% reduction)

---

## 🎯 REMEMBER

1. **AICF is for AI, not humans** - Optimize for parsing, not readability
2. **Update at session end** - When user asks
3. **Be comprehensive** - Capture all important context
4. **Use structured format** - Pipe-delimited, snake_case
5. **Prioritize information** - CRITICAL, HIGH, MEDIUM, LOW
6. **Keep both systems** - .ai/ for humans, .aicf/ for AI

---

**This folder is YOUR memory system. Use it well!** 🧠

