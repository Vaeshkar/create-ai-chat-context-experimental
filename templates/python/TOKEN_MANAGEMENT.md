# Token Management Guide

> **How to keep your AI knowledge base efficient and within context limits**

---

## 📊 Understanding Token Usage

### What Are Tokens?

Tokens are the units AI models use to process text. Roughly:
- **1 token ≈ 0.75 words** (or 1.33 tokens per word)
- **1 token ≈ 4 characters** on average

### Why Token Usage Matters

AI models have context window limits:
- **GPT-3.5:** 4K tokens
- **GPT-4:** 8K-32K tokens
- **GPT-4 Turbo:** 128K tokens
- **Claude 3/3.5:** 200K tokens

Your `.ai/` knowledge base consumes part of this context window.

---

## 📈 Typical Token Usage

### Fresh Project (Day 1)
```
Total: ~3,000 tokens (1.5% of Claude's context)
```
- `.ai-instructions`: 1,380 tokens
- `.ai/` templates (mostly empty): 1,620 tokens

### Active Project (10 chats)
```
Total: ~8,000 tokens (4% of Claude's context)
```
- `.ai-instructions`: 1,380 tokens
- `.ai/architecture.md`: 1,500 tokens (filled in)
- `.ai/conversation-log.md`: 3,000 tokens (10 entries)
- Other files: 2,120 tokens

### Mature Project (50 chats)
```
Total: ~22,000 tokens (11% of Claude's context)
```
- `.ai-instructions`: 1,380 tokens
- `.ai/architecture.md`: 2,000 tokens
- `.ai/conversation-log.md`: 15,000 tokens (50 entries)
- Other files: 3,620 tokens

### Large Project (100+ chats)
```
Total: ~40,000-50,000 tokens (20-25% of Claude's context)
⚠️ Time to manage token usage!
```

---

## 🔍 Check Your Token Usage

Run this command to see your current token usage:

```bash
npx create-ai-chat-context tokens
```

This shows:
- Token count per file
- Percentage of context window used
- Recommendations based on usage

---

## 🎯 When to Take Action

### ✅ Low Usage (< 10,000 tokens)
**Status:** Healthy  
**Action:** None needed

### ⚠️ Moderate Usage (10,000 - 25,000 tokens)
**Status:** Monitor  
**Action:** Consider archiving or summarizing soon

### 🚨 High Usage (> 25,000 tokens)
**Status:** Take action  
**Action:** Archive or summarize old conversations now

---

## 🛠️ Management Strategies

### Strategy 1: Archive Old Conversations

**Best for:** Projects with many completed chat sessions

**Command:**
```bash
npx create-ai-chat-context archive --keep 10
```

**What it does:**
- Moves old conversation entries to `.ai/archive/`
- Keeps the 10 most recent entries in the main log
- Preserves all history in archive files

**When to use:**
- After 30+ conversation entries
- When you want to preserve all details
- For compliance/audit purposes

**Example:**
```bash
# Keep last 15 entries, archive the rest
npx create-ai-chat-context archive --keep 15
```

---

### Strategy 2: Summarize Old Conversations

**Best for:** Projects where you need quick historical context

**Command:**
```bash
npx create-ai-chat-context summary --keep 10
```

**What it does:**
- Condenses old entries into brief summaries
- Keeps the 10 most recent entries detailed
- Reduces token usage by 60-80%

**When to use:**
- When you need historical context but not full details
- To maximize token efficiency
- For long-running projects

**Example:**
```bash
# Keep last 20 entries detailed, summarize the rest
npx create-ai-chat-context summary --keep 20
```

---

### Strategy 3: Manual Cleanup

**Best for:** Fine-grained control

**Steps:**
1. Open `.ai/conversation-log.md`
2. Review old entries
3. Delete or condense outdated information
4. Keep important decisions and context

**Tips:**
- Remove duplicate information
- Consolidate similar entries
- Keep "why" decisions, remove "how" details
- Archive before deleting

---

## 💡 Best Practices

### 1. Be Concise in Logs

**❌ Verbose:**
```markdown
### What We Did
- We spent a lot of time working on the authentication system
- First we tried using sessions but that didn't work well
- Then we switched to JWT tokens which was much better
- We also added password hashing with bcrypt
- And we implemented email verification
```

**✅ Concise:**
```markdown
### What We Did
- Implemented JWT authentication with bcrypt password hashing
- Added email verification system
```

### 2. Focus on Decisions, Not Details

**❌ Too detailed:**
```markdown
- Changed line 45 in auth.js to use bcrypt.hash() instead of md5
- Updated the user model to include a verified_email field
- Modified the login route to check email verification status
```

**✅ Decision-focused:**
```markdown
- Chose JWT over sessions for stateless API
- Required email verification before account activation
```

### 3. Regular Maintenance

**Schedule:**
- **Every 10 chats:** Review conversation log
- **Every 30 chats:** Archive or summarize old entries
- **Every 50 chats:** Clean up outdated technical decisions

### 4. Archive Before Deleting

Always create an archive before removing information:
```bash
# Archive first
npx create-ai-chat-context archive --keep 10

# Then review and clean up if needed
```

---

## 📊 Token Savings Examples

### Example 1: Archive Strategy

**Before:**
- 50 conversation entries
- 15,000 tokens

**After archiving (keep 10):**
- 10 recent entries in main log: 3,000 tokens
- 40 archived entries: Moved to archive file
- **Savings: 12,000 tokens (80%)**

### Example 2: Summary Strategy

**Before:**
- 50 conversation entries
- 15,000 tokens

**After summarizing (keep 10):**
- 10 recent entries detailed: 3,000 tokens
- 40 entries summarized: 1,500 tokens
- **Savings: 10,500 tokens (70%)**

---

## 🔄 Workflow Recommendation

### For Most Projects:

1. **Chats 1-30:** No action needed
2. **Chat 30:** Run `npx create-ai-chat-context tokens` to check usage
3. **If > 15,000 tokens:** Run `npx create-ai-chat-context summary --keep 15`
4. **Chat 60:** Run `npx create-ai-chat-context archive --keep 20`
5. **Repeat:** Archive or summarize every 30-50 chats

### For Large Projects:

1. **Every 20 chats:** Check token usage
2. **Every 30 chats:** Summarize old entries
3. **Every 60 chats:** Archive to separate files
4. **Quarterly:** Review and clean up technical decisions

---

## 🎯 Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `tokens` | Check usage | Anytime, regularly |
| `archive --keep 10` | Move old entries | After 30+ chats |
| `summary --keep 10` | Condense old entries | When tokens > 15K |

---

## ❓ FAQ

### Q: Will archiving lose information?
**A:** No! Archives are saved in `.ai/archive/` with full details.

### Q: Can I undo a summary?
**A:** Not automatically. Use Git to revert if needed. Always commit before summarizing.

### Q: How often should I check token usage?
**A:** Every 10-20 chats, or when AI responses seem slower.

### Q: What's better: archive or summary?
**A:** 
- **Archive:** Preserves all details, moves to separate file
- **Summary:** Keeps context in main file, more token-efficient

### Q: Can I use both strategies?
**A:** Yes! Summarize first, then archive the summaries later.

---

## 🚀 Next Steps

1. Check your current usage:
   ```bash
   npx create-ai-chat-context tokens
   ```

2. If needed, take action:
   ```bash
   npx create-ai-chat-context archive --keep 10
   # or
   npx create-ai-chat-context summary --keep 10
   ```

3. Commit changes:
   ```bash
   git add .ai/
   git commit -m "chore: Manage token usage in conversation log"
   ```

---

**Last Updated:** [Date]
**Maintained By:** [Your Name/Team]

