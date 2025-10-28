# 🧹 Cleanup After Completion Rule

**CRITICAL: Clean up planning documents after tasks are complete.**

---

## 📋 The Rule

**When a task/phase/feature is COMPLETE:**

1. ✅ **Execute the work** - Write code, fix bugs, implement features
2. ✅ **Verify completion** - Tests pass, code works, user approves
3. ✅ **Clean up planning docs** - Delete temporary planning/session markdown files
4. ✅ **Keep only essentials** - Preserve only what's needed long-term

---

## 🗑️ What to Delete After Completion

### **Always Delete:**
- `SESSION-*.md` - Session summaries (temporary planning)
- `PHASE-*-COMPLETE.md` - Phase completion reports (temporary status)
- `*-PLAN.md` - Planning documents (temporary roadmaps)
- `*-SUMMARY.md` - Work summaries (temporary recaps)
- `*-ANALYSIS.md` - Analysis documents (temporary investigations)
- `*-AUDIT.md` - Audit reports (temporary assessments)
- `*-INVESTIGATION.md` - Investigation reports (temporary debugging)
- `*-RESULTS.md` - Test/extraction results (temporary verification)
- `*-REPORT.md` - Status reports (temporary updates)
- `ACTION_PLAN_*.md` - Action plans (temporary task lists)
- `CLEANUP-*.md` - Cleanup summaries (ironic, but delete these too!)

### **Keep Only:**
- `README.md` - User-facing documentation
- `PRIVACY.md` - Legal/privacy policy
- `SECURITY.md` - Security policy
- `RELEASE-NOTES.md` - Version history
- Architecture docs that are **actively referenced** in code or by users
- User guides that are **actively needed** for installation/usage

---

## 📁 Where Planning Docs Can Live (Temporarily)

### **Option 1: Root Folder (Temporary)**
- ✅ Create planning docs in root during active work
- ❌ **MUST DELETE** when task is complete
- Use for: Quick planning, session notes, phase tracking

### **Option 2: `.ai-planning/` Folder (AI Reference Only)**
- ✅ Create planning docs here if you need them for future reference
- ✅ Add `.ai-planning/` to `.gitignore` (not committed)
- Use for: AI's own planning, breadcrumbs for context loading

### **Option 3: Don't Create Them**
- ✅ Best option: Just do the work without creating planning docs
- ✅ Use task management tools instead (if needed)
- Use for: Simple tasks that don't need extensive planning

---

## 🎯 The Philosophy

**"Plans are ephemeral. Code is permanent."**

- **Planning docs** = Scaffolding (remove after building is done)
- **Code + Tests** = The actual building (keep forever)
- **User docs** = Instructions for using the building (keep forever)

**Dennis's memory works fine. He doesn't need 106 planning documents.**

---

## ✅ Cleanup Checklist

After completing a task/phase/feature:

- [ ] Code is working and tested
- [ ] User has approved/verified
- [ ] Delete all `SESSION-*.md` files
- [ ] Delete all `PHASE-*-COMPLETE.md` files
- [ ] Delete all `*-PLAN.md` files
- [ ] Delete all `*-SUMMARY.md` files
- [ ] Delete all `*-ANALYSIS.md` files
- [ ] Delete all temporary investigation/audit/report files
- [ ] Keep only: README, PRIVACY, SECURITY, RELEASE-NOTES, essential architecture docs
- [ ] Commit the cleanup: `git rm <files> && git commit -m "chore: cleanup planning docs after completion"`

---

## 🚫 Exception: Active Work

**DO NOT delete planning docs if:**
- The task is still IN PROGRESS
- The phase is not yet COMPLETE
- The user explicitly asks to keep them
- They contain information not yet captured in code/tests

**Only delete when work is DONE and VERIFIED.**

---

## 💡 Example Workflow

### **During Work:**
```bash
# Create planning doc
echo "## Plan\n- Step 1\n- Step 2" > PHASE-X-PLAN.md

# Do the work
# Write code, tests, etc.

# Verify completion
npm test  # All tests pass ✅
```

### **After Completion:**
```bash
# Clean up
git rm PHASE-X-PLAN.md PHASE-X-COMPLETE.md SESSION-*.md
git commit -m "chore: cleanup planning docs after Phase X completion"
```

---

## 📊 Current State (Example)

**Root folder:** 40 markdown files (should be ~5-10)  
**docs/ folder:** 66 markdown files (should be ~10-15)  
**Total:** 106 markdown files (should be ~15-25)

**Most of these are planning/session/completion docs that should have been deleted after the work was done.**

---

## 🎯 Success Criteria

**You know cleanup is working when:**
- ✅ Root folder has < 10 markdown files
- ✅ docs/ folder has < 20 markdown files
- ✅ Only essential user-facing and architecture docs remain
- ✅ No `SESSION-*.md` or `*-COMPLETE.md` files linger after work is done
- ✅ Dennis doesn't have to ask "why are there so many .md files?" 😊

---

**Remember: Make plans, execute, clean up. Don't leave scaffolding after the building is done!**

