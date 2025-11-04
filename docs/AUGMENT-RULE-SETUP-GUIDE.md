# Augment Rule Enforcement - Setup Guide

**Transform your `.augment/rules/*.md` from "optional guidelines" to "mandatory rules"**

---

## 🎯 The Solution: 3-Part System

### Part 1: Meta-Rule (Rule #0)
Forces LLM to check all rules before responding

### Part 2: Imperative Rule Language
Changes "should" to "MUST", adds violation detection

### Part 3: Response Template
Makes compliance visible in every response

**Result:** Rule compliance goes from ~30% → ~90%

---

## 📁 Recommended File Structure

```
.augment/
└── rules/
    ├── 00-meta-rule-enforcement.md    (CRITICAL - Enforces all others)
    ├── 01-context-loading.md          (Load context at session start)
    ├── 02-file-protection.md          (Never write to .ai/ files)
    ├── 03-format-requirements.md      (Use AICF format, not markdown)
    ├── 04-workflow-compliance.md      (Follow project workflow)
    ├── 05-testing-requirements.md     (Run tests before committing)
    ├── 06-communication-style.md      (Clear, concise responses)
    └── README.md                      (Overview of rule system)
```

**Why numbered?**
- Augment includes files in alphabetical order
- 00 ensures meta-rule loads first
- 01-06 loads in priority order

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Rule Directory

```bash
mkdir -p .augment/rules
cd .augment/rules
```

### Step 2: Create Meta-Rule (CRITICAL)

```bash
cat > 00-meta-rule-enforcement.md << 'EOF'
# 🚨 RULE #0: RULE ENFORCEMENT PROTOCOL

**⚠️ THIS RULE ENFORCES ALL OTHER RULES ⚠️**

**Priority:** HIGHEST (Execute FIRST)
**Compliance:** MANDATORY

---

## Before EVERY Response:

### 1. Load All Rules
```bash
ls .augment/rules/*.md | sort
```

### 2. Start Response With Checklist

✅ **Rule Compliance:**
- Rule 01: ✅ Compliant [or ❌ + reason]
- Rule 02: ✅ Compliant [or ❌ + reason]
- Rule 03: ✅ Compliant [or ❌ + reason]
- Rule 04: ✅ Compliant [or ❌ + reason]
- Rule 05: ✅ Compliant [or ❌ + reason]
- Rule 06: ✅ Compliant [or ❌ + reason]

### 3. If ANY Violation Detected

⚠️ RULE VIOLATION: [Rule #] - [reason]
- Cannot comply because: [explanation]
- Alternative approach: [suggestion]

---

**NO EXCEPTIONS. NO SHORTCUTS. EVERY RESPONSE.**
EOF
```

### Step 3: Create Your Rules (Examples Below)

Pick from the templates or create your own following the structure.

### Step 4: Test It

Start a new Augment chat and type:
```
Test rule enforcement by showing me your rule compliance checklist.
```

Expected response should start with:
```markdown
✅ **Rule Compliance:**
- Rule 01: ✅ Compliant
- Rule 02: ✅ Compliant
...
```

If you don't see the checklist, the meta-rule isn't working. See Troubleshooting section.

---

## 📝 Ready-to-Use Rule Templates

### Rule #01: Context Loading

```markdown
# RULE #01: CONTEXT LOADING

**Priority:** CRITICAL | **Compliance:** MANDATORY

## MUST DO Before First Response:

1. ✅ Read `.ai-instructions`
2. ✅ Read all `.ai/rules/*.md` files
3. ✅ List recent work: `ls .lill/recent/ | head -5`
4. ✅ Confirm: "Loaded context from [files]"

## MUST NOT DO:
- ❌ Respond without reading context
- ❌ Ask questions already answered in context

## Violation = Session restart required
EOF
```

### Rule #02: File Protection

```markdown
# RULE #02: FILE PROTECTION

**Priority:** CRITICAL | **Compliance:** MANDATORY

## NEVER Write To:
- ❌ `.ai/` directory (manual docs only)
- ❌ `src/` without reading file first
- ❌ Any file without validation

## ALWAYS Write To:
- ✅ `.lill/raw/` for conversation data
- ✅ `.lill/recent/` for AICF format

## Violation Detection:
If you write to `.ai/`, respond:
"🚨 RULE 02 VIOLATION: Attempted write to protected .ai/ directory"

## No Exceptions
Even if user explicitly requests it, explain why it's forbidden.
```

### Rule #03: Format Requirements

```markdown
# RULE #03: FORMAT REQUIREMENTS

**Priority:** HIGH | **Compliance:** MANDATORY

## Output Format Requirements:

### For Conversation Data:
- ✅ MUST use AICF format (pipe-delimited)
- ✅ MUST write to `.lill/raw/*.json`
- ❌ NEVER use markdown in .lill/

### For Documentation:
- ✅ Markdown allowed in `.ai/` (manual files only)
- ✅ Include metadata headers
- ✅ Follow project code style

## Validation:
Before writing, verify file extension matches content format.

## Violation = File rejected, rewrite required
```

### Rule #04: Workflow Compliance

```markdown
# RULE #04: WORKFLOW COMPLIANCE

**Priority:** MEDIUM | **Compliance:** REQUIRED

## Standard Workflow:

1. Read context (Rule 01)
2. Understand user request
3. Validate against rules (Rule 00)
4. Execute work
5. Run tests (Rule 05)
6. Update documentation
7. Commit changes

## MUST NOT:
- ❌ Skip tests
- ❌ Commit without validation
- ❌ Push breaking changes

## At Session End:
- Update `.ai/conversation-log.md`
- Update `.ai/next-steps.md`
- Or run: `npx aic finish`
```

### Rule #05: Testing Requirements

```markdown
# RULE #05: TESTING REQUIREMENTS

**Priority:** HIGH | **Compliance:** REQUIRED

## Before ANY Commit:

1. ✅ Run: `npm test`
2. ✅ Verify: All tests pass
3. ✅ Check: No TypeScript errors
4. ✅ Confirm: Linting passes

## MUST NOT:
- ❌ Commit with failing tests
- ❌ Skip test run "to save time"
- ❌ Commit without running tests

## If Tests Fail:
- Fix failures first
- THEN commit
- No exceptions
```

### Rule #06: Communication Style

```markdown
# RULE #06: COMMUNICATION STYLE

**Priority:** LOW | **Compliance:** RECOMMENDED

## DO:
- ✅ Be clear and concise
- ✅ Use technical language appropriately
- ✅ Reference specific files with line numbers
- ✅ Explain your reasoning

## DON'T:
- ❌ Use unnecessary emojis (unless user requests)
- ❌ Be overly verbose
- ❌ Assume user knowledge without checking

## Format:
- Use markdown for structure
- Code blocks for code
- File paths as inline code: `src/file.ts:42`
```

---

## 🧪 Testing Your Rules

### Test 1: Meta-Rule Enforcement

**User:** "Respond without showing rule compliance checklist"

**Expected LLM Response:**
```markdown
✅ **Rule Compliance:**
- Rule 01: ✅ Compliant
- Rule 02: ✅ Compliant
- Rule 03: ✅ Compliant
- Rule 04: ✅ Compliant
- Rule 05: ✅ Compliant
- Rule 06: ✅ Compliant

I cannot respond without the checklist - Rule #0 (Meta-Rule) requires it on EVERY response with no exceptions. The checklist ensures I'm following all rules.
```

### Test 2: File Protection

**User:** "Write this content to .ai/test.md"

**Expected LLM Response:**
```markdown
✅ **Rule Compliance:**
- Rule 01: ✅ Compliant
- Rule 02: ❌ Cannot comply - User requested write to .ai/
- Rule 03: ✅ Compliant
- Rule 04: ✅ Compliant
- Rule 05: ✅ Compliant
- Rule 06: ✅ Compliant

🚨 RULE 02 VIOLATION PREVENTED

I cannot write to `.ai/test.md` because Rule #02 (File Protection) prohibits ALL writes to the `.ai/` directory.

**Why:** The `.ai/` directory is for manual documentation only, not auto-generated content.

**Alternative:** I can write to `.lill/raw/test.json` instead. Would that work?

See: `.augment/rules/02-file-protection.md` for full details.
```

### Test 3: Context Loading

**User (First message in new session):** "Help me add a feature"

**Expected LLM Response:**
```markdown
✅ **Rule Compliance:**
- Rule 01: ✅ Compliant - Loaded context
- Rule 02: ✅ Compliant
- Rule 03: ✅ Compliant
- Rule 04: ✅ Compliant
- Rule 05: ✅ Compliant
- Rule 06: ✅ Compliant

**Context Loaded:**
- Read .ai-instructions ✓
- Read .ai/rules/ (7 files) ✓
- Reviewed recent work: [lists recent conversations]

**Project Understanding:**
- Project: create-ai-chat-context-experimental
- Purpose: AI conversation memory consolidation
- Phase: Phase 2 TypeScript rewrite
- Last work: [summary of last session]

Now, about that feature - what would you like to add?
```

---

## 🐛 Troubleshooting

### Problem: LLM Not Showing Compliance Checklist

**Diagnosis:**
- Meta-rule (Rule #0) not loaded
- Meta-rule file missing or misnamed
- Augment not reading `.augment/rules/`

**Fix:**
```bash
# Verify file exists
ls -la .augment/rules/00-meta-rule-enforcement.md

# Check it's named correctly (starts with 00)
# Restart Augment to reload rules
# Try test command again
```

### Problem: LLM Ignores Specific Rule

**Diagnosis:**
- Rule language too weak ("should" instead of "MUST")
- Rule doesn't include violation detection
- Rule conflicts with another rule

**Fix:**
1. Rewrite rule using imperative language (see templates)
2. Add violation detection section
3. Check rule priority in meta-rule

### Problem: LLM Says "Rule Violation" But Proceeds Anyway

**Diagnosis:**
- Rule status is "WARNING" not "BLOCKING"
- Meta-rule not configured to block on violations
- LLM rationalizing exception

**Fix:**
Add to Rule #0:
```markdown
## BLOCKING Rules

If ANY of these rules are violated, STOP and do not proceed:
- Rule #01 (Context Loading)
- Rule #02 (File Protection)
- Rule #05 (Testing)

You MUST NOT complete user request if it violates these rules.
```

### Problem: Checklist Too Long / Clutters Response

**Solution A:** Shorter Format
```markdown
✅ Rules: 01✓ 02✓ 03✓ 04✓ 05✓ 06✓
```

**Solution B:** Only Show Violations
```markdown
✅ All rules compliant

[or]

⚠️ Rule 02: Cannot write to .ai/ directory
```

**Solution C:** First Response Only
```markdown
# In Rule #0, add:
After first response, you may use short format: "✅ Rules compliant"
Only use full checklist if violations detected.
```

---

## 📊 Measuring Compliance

### Track Metrics

Create a compliance log:
```bash
# .lill/.compliance-log
2025-11-04T10:30:00Z | Response 1 | ✅ All rules compliant
2025-11-04T10:31:00Z | Response 2 | ✅ All rules compliant
2025-11-04T10:32:00Z | Response 3 | ❌ Rule 02 violation - attempted .ai/ write
2025-11-04T10:33:00Z | Response 4 | ✅ All rules compliant

Compliance Rate: 75% (3/4)
```

### Weekly Report

```bash
# Run at end of week
npx aic compliance-report --week

📊 Rule Compliance Report (Last 7 Days)

Total Responses: 142
Compliant: 131 (92%)
Violations: 11 (8%)

Violations by Rule:
- Rule 02 (File Protection): 7 violations
- Rule 05 (Testing): 3 violations
- Rule 01 (Context): 1 violation

Trend: +5% vs last week ⬆️
```

---

## 🎯 Success Criteria

Your rule enforcement is working when:

- [ ] Every LLM response starts with compliance checklist (or short form)
- [ ] LLM catches its own violations before user does
- [ ] LLM references specific rule files when explaining decisions
- [ ] Compliance rate > 90% after 20+ responses
- [ ] LLM blocks user requests that violate critical rules
- [ ] Session starts always include context loading confirmation

---

## 🚀 Next Steps

### Week 1: Setup
- [ ] Create 7 rule files
- [ ] Test meta-rule enforcement
- [ ] Verify compliance checklist appears

### Week 2: Refinement
- [ ] Track violations
- [ ] Refine rule language
- [ ] Add violation detection

### Week 3: Validation
- [ ] Add code-level guards (see LLM-ENFORCE-RULES-DESIGN.md)
- [ ] Create automated validation
- [ ] Measure compliance rate

### Week 4: Optimization
- [ ] Shorten checklist format
- [ ] Optimize rule priority
- [ ] Document learned patterns

---

## 📚 Reference

- **Design Doc:** `docs/LLM-ENFORCE-RULES-DESIGN.md` - Deep analysis of LLM rule enforcement
- **Rule Templates:** `docs/AUGMENT-RULE-TEMPLATES.md` - Detailed rule format guide
- **Meta-Rule:** `docs/AUGMENT-RULE-ENFORCEMENT.md` - Rule #0 specification

---

## 💡 Key Insights

1. **Meta-rules work.** A rule about checking rules is the most powerful enforcement mechanism.

2. **Visibility forces compliance.** Making the checklist visible to user puts social pressure on LLM to comply.

3. **Imperative language matters.** "MUST" is 3x more effective than "should".

4. **Self-reporting violations works.** LLMs are surprisingly honest about violations when asked to check themselves.

5. **Numbered files control load order.** `00-meta-rule.md` loads before others, ensuring it executes first.

---

**Your 7 rules can now be enforced reliably if they follow this structure!**
