# Known Issues

Track problems and their solutions.

---

## ✅ Resolved Issues

### Always update next-steps.md when decisions exist

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01
**Severity:** 🟡 Medium
**Chat:** #9

**Problem:**
- Always update next-steps.md when decisions exist
- Improve formatting for all .ai/ files - capitalize and clean prefixes
- Improve technical-decisions and known-issues formatting
- V0.9.1 - chat-finish compatibility with older conversation-log formats

**Solution:**
Resolved during Chat #9. 

---

### Improve formatting for all .ai/ files - capitalize and clean prefixes

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01
**Severity:** 🟡 Medium
**Chat:** #8

**Problem:**
- Improve formatting for all .ai/ files - capitalize and clean prefixes
- Improve technical-decisions and known-issues formatting
- V0.9.1 - chat-finish compatibility with older conversation-log formats

**Solution:**
Resolved during Chat #8. 

---

### Improve technical-decisions and known-issues formatting

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01
**Severity:** 🟡 Medium
**Chat:** #7

**Problem:**
- improve technical-decisions and known-issues formatting
- v0.9.1 - chat-finish compatibility with older conversation-log formats

**Solution:**
Resolved during Chat #7. 

---

### Worked on new features, bug fixes, documentation

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01
**Severity:** 🟡 Medium

**Problem:**
- fix: v0.9.1 - chat-finish compatibility with older conversation-log formats

**Solution:**
Resolved during Chat #6

---

### Worked on new features, bug fixes, documentation

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01
**Severity:** 🟡 Medium

**Problem:**
- fix: v0.9.1 - chat-finish compatibility with older conversation-log formats

**Solution:**
Resolved during Chat #5

---

### Worked on new features, bug fixes, documentation, refactoring

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01
**Severity:** 🟡 Medium

**Problem:**
fix: v0.9.1 - chat-finish compatibility with older conversation-log formats

**Solution:**
Resolved during Chat #4

---

### Conversation Entry Counting Showed Zero

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01 (v0.6.5)
**Severity:** 🟡 Medium

**Problem:**
Stats command showed "0 conversation entries" for users with date-first format in conversation logs (e.g., `## 2025-09-30 - Chat #19: Topic`). The regex `/^## Chat #\d+/gm` only matched entries starting with "Chat #" at the beginning of the line.

**Solution:**
Changed regex to `/^##.*Chat\s*#?\d+/gim` to match "Chat #X" anywhere in the heading line. Now supports:

- `## Chat #19 - Topic` (original format)
- `## 2025-09-30 - Chat #19: Topic` (date-first format)
- `## Chat 19 - Topic` (without # symbol)

**Prevention:**

- Use more flexible regex patterns that accommodate different formats
- Test with various real-world conversation log formats
- Consider user customization in the future

---

### Token Report Overwhelming with 16 Models

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01 (v0.7.0)
**Severity:** 🟢 Low (UX issue)

**Problem:**
Showing all 16 AI models in token reports was overwhelming for most users who only care about 1-2 models they actually use. Made the output cluttered and hard to scan.

**Solution:**

- Show only 4 models by default (preferred model + top 3 popular)
- Add `--all` flag to show all 16 models when needed
- Add hint message: "Showing 4 models. Run 'npx aic tokens --all' to see all 16 models"
- Mark preferred model with ⭐ star for easy identification

**Prevention:**

- Default to simpler, cleaner output
- Provide escape hatches for power users
- Always show hints about additional options

---

### Documentation Too Sketchy

**Date Discovered:** 2025-10-01
**Date Resolved:** 2025-10-01 (v0.8.0)
**Severity:** 🟡 Medium (UX issue)

**Problem:**
User feedback: "For the next version we need a full dokumentation. this is to sketchy."

- Config command syntax was confusing: `config [action] [key] [value]`
- No comprehensive command reference
- No detailed configuration guide
- Users had to piece together information from multiple sources

**Solution:**
Created comprehensive documentation:

- **COMMANDS.md** (600+ lines) - Complete command reference with examples
- **CONFIGURATION.md** (350+ lines) - Detailed configuration guide with troubleshooting
- Updated README with clear links to documentation
- Every command now has syntax, options, examples, and "when to use" guidance

**Prevention:**

- Maintain comprehensive documentation from the start
- Include examples for every feature
- Add troubleshooting sections
- Listen to user feedback about documentation quality

---

## ⏳ Active Issues

### None Currently

No active issues at this time! 🎉

---

## Template for New Issues

```markdown
### [Issue Name]

**Date Discovered:** [Date]
**Severity:** [Level]

**Problem:**
[Description]

**Solution/Workaround:**
[Fix or temporary solution]

**Next Steps:**

- [Action]
```

---

**Last Updated:** 2025-10-01
