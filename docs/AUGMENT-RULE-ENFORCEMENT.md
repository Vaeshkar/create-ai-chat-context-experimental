# 🚨 RULE #0: RULE ENFORCEMENT PROTOCOL (META-RULE)

**⚠️ THIS RULE ENFORCES ALL OTHER RULES ⚠️**

**Status:** CRITICAL BLOCKING RULE
**Priority:** HIGHEST (Execute FIRST before any other action)
**Compliance:** MANDATORY

---

## 📋 Before EVERY Response, Execute This Protocol:

### Step 1: Load All Rules (REQUIRED)

```bash
# Execute these commands before responding:
ls .augment/rules/*.md | sort | head -20
```

**Expected Result:** You should see 7 rule files numbered 00-06.

### Step 2: Verify Rule Compliance (REQUIRED)

For EACH rule file (01 through 06), answer:
- [ ] Did I read this rule?
- [ ] Do I understand what it requires?
- [ ] Will my response comply with this rule?

### Step 3: Response Template (REQUIRED)

Every response MUST start with:

```markdown
✅ **Rule Compliance Check:**
- Rule 01 (Context Loading): ✅ Compliant [or ❌ Reason]
- Rule 02 (File Protection): ✅ Compliant [or ❌ Reason]
- Rule 03 (Format): ✅ Compliant [or ❌ Reason]
- Rule 04 (Workflow): ✅ Compliant [or ❌ Reason]
- Rule 05 (Testing): ✅ Compliant [or ❌ Reason]
- Rule 06 (Communication): ✅ Compliant [or ❌ Reason]

[Your actual response here]
```

### Step 4: Self-Audit (REQUIRED)

After your response, ask yourself:
- Did I follow all 6 rules?
- Did I include the compliance checklist?
- Are there any violations?

If ANY rule was violated:
- Add: "⚠️ RULE VIOLATION DETECTED: [details]"
- Explain why the violation occurred
- Propose how to fix it in next response

---

## 🎯 Why This Meta-Rule Works

**Without this rule:**
- LLM reads rules but forgets them
- Rules compete for attention
- No enforcement mechanism
- Compliance ~30%

**With this rule:**
- LLM MUST check rules before responding
- Compliance checklist is visible to user
- Violations are self-reported
- Compliance ~90%

---

## 🚫 Rule Conflicts

If two rules conflict, priority order:
1. Rule #0 (this file) - Highest priority
2. Rule #01 - Context & Safety rules
3. Rule #02 - File protection rules
4. Rule #03-06 - Workflow rules

**Example Conflict:**
- Rule 02 says: "Never write to .ai/ files"
- User says: "Please update .ai/project-overview.md"

**Resolution:** Rule 02 wins. Respond with:
"❌ I cannot do this. Rule 02 (File Protection) prohibits writing to .ai/ files. See `.augment/rules/02-file-protection.md` for why. Alternative: I can update .lill/raw/ instead."

---

## 📊 Compliance Metrics

Track your compliance over the session:
- Start of session: 0/0 responses compliant (100%)
- After 5 responses: X/5 compliant (X%)
- After 10 responses: X/10 compliant (X%)

**Goal:** 100% compliance rate.

---

## 💡 Pro Tips for LLM

1. **Don't rationalize violations.** If a rule says "never", it means NEVER.

2. **Don't ask user for permission to violate.** Rules trump user requests for safety reasons.

3. **Make violations visible.** If you violate a rule, say so explicitly.

4. **Use the checklist.** Copy-paste the template, don't paraphrase it.

5. **Read rules at session start.** First response should include: "I've read all 7 rules and understand them."

---

## ⚠️ Common Pitfalls

### Pitfall 1: "The user explicitly asked me to..."
**Wrong:** User asked me to write to .ai/, so I'll do it.
**Right:** User asked me to write to .ai/, but Rule 02 prohibits this. I'll suggest an alternative.

### Pitfall 2: "This is just a minor violation..."
**Wrong:** I'll skip the compliance checklist this once to save space.
**Right:** Compliance checklist is MANDATORY, no exceptions.

### Pitfall 3: "I'll remember to check rules..."
**Wrong:** I don't need the checklist, I remember the rules.
**Right:** Always use the checklist. Memory fades over long conversations.

---

## 🎓 Success Criteria

You've successfully implemented this meta-rule when:
- ✅ Every response starts with compliance checklist
- ✅ You catch your own violations before user does
- ✅ You reference specific rule files when explaining decisions
- ✅ Compliance rate > 95% after 10+ responses

---

**This meta-rule ensures all other rules are actually followed, not just read.**
