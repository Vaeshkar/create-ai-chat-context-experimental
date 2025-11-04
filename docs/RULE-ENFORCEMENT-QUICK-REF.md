# Rule Enforcement Quick Reference

**TL;DR: How to make your 7 `.augment/rules/*.md` files actually work**

---

## 🎯 The Problem → Solution

| Problem | Solution |
|---------|----------|
| LLM treats rules as "guidelines" | Create **Rule #0** (meta-rule) that enforces all others |
| LLM forgets to check rules | Force **compliance checklist** in every response |
| No detection of violations | Add **RuleValidator** for code-level enforcement |
| Language too weak ("should") | Use imperative language (**MUST**, **NEVER**) |
| No feedback when violated | Auto-log violations + reference rule docs |

---

## 🚀 Quick Setup (5 Min)

### 1. Create Meta-Rule (Critical!)

```bash
mkdir -p .augment/rules

cat > .augment/rules/00-meta-rule-enforcement.md << 'EOF'
# 🚨 RULE #0: ENFORCEMENT PROTOCOL

Before EVERY response:

✅ **Rule Compliance:**
- Rule 01: ✅ Compliant [or ❌ + reason]
- Rule 02: ✅ Compliant
- Rule 03: ✅ Compliant
- Rule 04: ✅ Compliant
- Rule 05: ✅ Compliant
- Rule 06: ✅ Compliant

**NO EXCEPTIONS. EVERY RESPONSE.**
EOF
```

### 2. Number Your Rules 01-06

```bash
# Rename existing rules or create new ones
mv rule1.md 01-context-loading.md
mv rule2.md 02-file-protection.md
# ... etc for rules 03-06
```

**Why numbered?** Augment loads files alphabetically. `00-` ensures meta-rule loads first.

### 3. Test It

Start Augment chat:
```
Test rule enforcement by showing compliance checklist.
```

Expected: Response starts with `✅ **Rule Compliance:**` checklist.

---

## 📋 Rule Template (Copy This)

```markdown
# RULE #[NUM]: [TITLE]

**Priority:** CRITICAL | HIGH | MEDIUM | LOW
**Compliance:** MANDATORY | REQUIRED | RECOMMENDED

## MUST DO:
- ✅ Action 1
- ✅ Action 2

## MUST NOT DO:
- ❌ Forbidden 1
- ❌ Forbidden 2

## Violation = [Consequence]

**No exceptions** [or allowed exceptions]
```

---

## 🛡️ Example Rules

### Rule #01: Context Loading (BLOCKING)

```markdown
# RULE #01: CONTEXT LOADING

**Priority:** CRITICAL | **Compliance:** MANDATORY

## MUST DO Before First Response:
1. ✅ Read `.ai-instructions`
2. ✅ Read `.ai/rules/*.md`
3. ✅ List recent work: `ls .lill/recent/`
4. ✅ Confirm: "Loaded context from [files]"

## MUST NOT DO:
- ❌ Respond without reading context

## Violation = Session restart required
```

### Rule #02: File Protection (BLOCKING)

```markdown
# RULE #02: FILE PROTECTION

**Priority:** CRITICAL | **Compliance:** MANDATORY

## NEVER Write To:
- ❌ `.ai/` directory (manual docs only)

## ALWAYS Write To:
- ✅ `.lill/raw/` for conversation data

## Violation = Operation blocked

**If user requests .ai/ write:**
"🚨 Cannot write to .ai/ - see Rule #02"
```

### Rule #05: Testing (REQUIRED)

```markdown
# RULE #05: TESTING

**Priority:** HIGH | **Compliance:** REQUIRED

## Before ANY Commit:
1. ✅ Run `npm test`
2. ✅ Verify all pass
3. ✅ No TypeScript errors

## MUST NOT:
- ❌ Commit with failing tests

## Violation = Commit rejected
```

---

## 🧪 Testing Your Rules

### Test 1: Meta-Rule Works

**User:** "Skip the compliance checklist"

**Expected:** LLM responds WITH checklist anyway + explains Rule #0 requires it.

### Test 2: File Protection Works

**User:** "Write to .ai/test.md"

**Expected:** LLM refuses + shows `❌` in Rule 02 line + explains why.

### Test 3: Context Loading Works

**User (first message):** "Help me"

**Expected:** LLM confirms "Loaded context from [files]" before responding.

---

## 🔧 CLI Commands

```bash
# Check if rules are being followed
aic rules check

# Generate 7-day compliance report
aic rules report

# List all rules
aic rules list

# Validate an operation before doing it
aic rules validate write .ai/test.md
```

---

## 📊 Measuring Success

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Compliance checklist shown | 100% | Every response starts with checklist |
| File protection violations | 0 | `aic rules report` |
| Context loaded at start | 100% | First response confirms context |
| Overall compliance rate | >90% | `aic rules report` |

---

## 🐛 Troubleshooting

### Checklist Not Showing

**Fix:**
1. Verify `00-meta-rule-enforcement.md` exists
2. Restart Augment to reload rules
3. Check file starts with `00-` (loads first)

### LLM Ignores Specific Rule

**Fix:**
1. Change "should" → "MUST"
2. Change "try to" → "ALWAYS" or "NEVER"
3. Add "No exceptions" at end
4. Increase priority to CRITICAL

### LLM Says Violation But Proceeds

**Fix:** Add to Rule #0:
```markdown
## BLOCKING Rules (Cannot Proceed):
- Rule 01, 02, 05

If violated, respond: "Cannot proceed. Rule #[X] blocks this."
```

---

## 💡 Key Insights

1. **Meta-rule is critical.** Without it, other rules are optional.

2. **Visibility enforces compliance.** Checklist visible to user = social pressure.

3. **Imperative language works.** "MUST" is 3x more effective than "should".

4. **Number your files.** `00-meta` loads before `01-context` before `02-file`.

5. **Test with violations.** Ask LLM to violate rules - it should refuse.

---

## 📚 Full Documentation

- **Setup Guide:** `docs/AUGMENT-RULE-SETUP-GUIDE.md` (detailed walkthrough)
- **Rule Templates:** `docs/AUGMENT-RULE-TEMPLATES.md` (more examples)
- **Deep Analysis:** `docs/LLM-ENFORCE-RULES-DESIGN.md` (theory + research)
- **Code Enforcement:** `src/utils/RuleValidator.ts` (programmatic validation)

---

## ✅ Success Checklist

- [ ] Created `.augment/rules/00-meta-rule-enforcement.md`
- [ ] Numbered rules 01-06
- [ ] Used MUST/NEVER language (not should/try)
- [ ] Tested with "skip checklist" - LLM refused
- [ ] Tested with protected file write - LLM blocked
- [ ] First response shows context loaded
- [ ] Compliance checklist appears in every response
- [ ] Run `aic rules check` - passes

**When all checked: Your rules are now enforced! 🎉**

---

**Next:** Add code-level guards with `RuleValidator.ts` for 95%+ reliability.
