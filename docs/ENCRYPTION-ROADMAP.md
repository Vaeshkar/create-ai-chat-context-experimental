# 🔐 Encryption Roadmap

**Status:** Phase 1 (Shipped)  
**Last Updated:** 2025-01-09

---

## 🎯 Product Philosophy

**"Make it work, make it right, make it fast"**

1. **Make it work** (Phase 1) - Ship basic encryption, get users
2. **Make it right** (Phase 2) - Add contexts when users ask for it
3. **Make it fast** (Phase 3) - Add enterprise features when companies pay for it

**Don't build enterprise features before you have enterprise users!**

---

## 📊 The Core Tension

**Simple (Easy to use)** ⚖️ **Secure (Enterprise-ready)**

```
Too Simple                    Sweet Spot                    Too Complex
    ↓                             ↓                              ↓
No encryption          One key per context           GPG + key rotation
Easy to use            Still manageable              Enterprise security
Not secure enough      Good enough for most          Overkill for solo devs
```

---

## 🚀 Phase 1: Simple (Current - Shipped)

### **Status:** ✅ Shipped (2025-01-09)

### **What We Built:**
```bash
aether init
# Asks: "Encrypt .lill/? (Y/n)"
# Creates ONE key per project
# Saves to ~/.aether-keys/<project-name>-git-crypt-key
```

### **Architecture:**
```
~/.aether-keys/
├── ToyStore-git-crypt-key
├── GameShop-git-crypt-key
└── PuzzleWorld-git-crypt-key

/Users/leeuwen/Programming/ToyStore/
├── .lill/                    # Encrypted with ToyStore-git-crypt-key
├── .gitattributes            # .lill/** filter=git-crypt diff=git-crypt
└── .gitignore                # (removed .lill/ ignore rule)
```

### **Good For:**
- ✅ Solo developers
- ✅ Personal projects
- ✅ Getting started quickly
- ✅ Simple backup to GitHub

### **Limitations:**
- ❌ Multiple projects = multiple keys (annoying to manage)
- ❌ No team support (everyone shares same key)
- ❌ No access control (can't revoke one person's access)

### **When to Move to Phase 2:**
- When you have 3+ projects and managing keys is annoying
- When you introduce AETHER to colleagues and they ask "how do we share keys?"
- When users file GitHub issues asking for context support

---

## 🏗️ Phase 2: Contexts (Future)

### **Status:** 📋 Planned (Not Started)

### **The Problem:**
**Scenario 1:** You have 5 personal projects → 5 separate keys (annoying!)  
**Scenario 2:** You work at company on 12 projects → 12 separate keys (very annoying!)  
**Scenario 3:** You have personal + company projects → keys are mixed together

### **The Solution: Key = Context (Not Person, Not Project)**

**Keys should represent CONTEXT:**
- **Personal context** → `dennis-personal-key` (for all personal projects)
- **Company context** → `spielzeug-meiners-key` (for all company projects)
- **Team context** → `toy-team-key` (for specific team projects)

### **Architecture:**
```json
// ~/.aether/profile.json
{
  "user": {
    "name": "Dennis",
    "email": "bendora@gmail.com"
  },
  "contexts": [
    {
      "name": "personal",
      "key": "~/.aether/keys/dennis-personal-key",
      "paths": ["/Users/leeuwen/Programming/*"],
      "default": true
    },
    {
      "name": "spielzeug-meiners",
      "key": "~/.aether/keys/spielzeug-meiners-key",
      "paths": ["/Users/leeuwen/Work/*"],
      "company": true
    }
  ],
  "projects": [
    {
      "name": "ToyStore",
      "path": "/Users/leeuwen/Programming/ToyStore",
      "context": "personal"
    },
    {
      "name": "BigToyStore",
      "path": "/Users/leeuwen/Work/BigToyStore",
      "context": "spielzeug-meiners"
    }
  ]
}
```

### **Commands:**
```bash
# Setup user profile
aether profile init
# Creates ~/.aether/ with "personal" context

# Add company context
aether context add spielzeug-meiners
# Option 1: Generate new key (you're first employee)
# Option 2: Import existing key (company already has one)

# Initialize project (auto-detects context by path)
cd /Users/leeuwen/Work/BigToyStore
aether init
# Detects you're in /Users/leeuwen/Work/ (company folder)
# Uses spielzeug-meiners-key automatically

# List contexts
aether context list
# personal (default) - 5 projects
# spielzeug-meiners - 12 projects

# Switch context
aether context use spielzeug-meiners
```

### **Good For:**
- ✅ Solo developers with multiple projects (5 projects = 1 key)
- ✅ Small teams (2-5 people, shared key)
- ✅ Personal + company separation
- ✅ Auto-detect context by folder path

### **Limitations:**
- ❌ No individual access control (everyone shares same key)
- ❌ Can't revoke one person's access
- ❌ If key leaks, all projects in that context are exposed

### **When to Move to Phase 3:**
- When a company with 10+ people wants to use AETHER
- When someone asks "how do I revoke access for an employee who left?"
- When you have revenue to justify the complexity

---

## 🏢 Phase 3: Enterprise (Future)

### **Status:** 💭 Concept (Not Planned Yet)

### **The Problem:**
**Scenario:** Company with 45 people sharing ONE key  
- If one person leaks the key, everyone's data is exposed
- Can't revoke access for one person (need to rotate key for everyone)
- No audit trail (who accessed what?)

### **The Solution: GPG (Asymmetric Encryption)**

**Each person has their own GPG key pair:**
- Public key encrypts data
- Private key decrypts data
- Can add/remove people without rotating keys

### **Commands:**
```bash
# Company setup (first person)
aether context add spielzeug-meiners --gpg
# Uses GPG instead of symmetric key

# Add employee
aether context add-user alice@spielzeug-meiners.com
# Adds Alice's GPG public key
# She can now decrypt .lill/

# Remove employee (when they leave)
aether context remove-user bob@spielzeug-meiners.com
# Removes Bob's GPG key
# He can no longer decrypt NEW commits
# (Old commits he already has are still accessible)

# Rotate keys (if needed)
aether context rekey spielzeug-meiners
# Re-encrypts all data with new GPG keys
# Removes access for all removed users
```

### **Good For:**
- ✅ Large teams (10+ people)
- ✅ Sensitive data (customer data, trade secrets)
- ✅ Compliance requirements (audit logs, access control)
- ✅ Individual access control (revoke one person)

### **Complexity:**
- ⚠️ Requires GPG setup (everyone needs GPG key pair)
- ⚠️ More commands to learn
- ⚠️ More complex onboarding
- ⚠️ Key rotation rewrites git history

### **When to Build:**
- When companies are willing to pay for AETHER
- When compliance requirements demand it
- When security incidents happen with shared keys

---

## 🤔 Design Decisions (Captured from Discussion)

### **Question 1: Multi-project key sharing**
**Decision:** Phase 2 (contexts) - One key per context, not per project  
**Rationale:** 5 projects = 1 key (manageable), not 5 keys (annoying)

### **Question 2: Key rotation (compromised key)**
**Decision:** Phase 3 (enterprise) - Not worth complexity for Phase 1/2  
**Rationale:** Rare edge case, can document manual process for now

### **Question 3: Team onboarding (GPG keys)**
**Decision:** Phase 3 (enterprise) - Symmetric keys sufficient for small teams  
**Rationale:** GPG adds complexity, only needed for large teams (10+ people)

### **Question 4: Encrypt existing repos**
**Decision:** Phase 2 (contexts) - Add `aether encrypt-existing` command  
**Rationale:** Users will want to encrypt existing projects, worth building

---

## 📋 Scenario Analysis

### **Scenario 1: Solo Developer (You, Now)**
- **Needs:** Simple, works, backs up to GitHub
- **Security:** Moderate (not handling customer data)
- **Key management:** 1-2 keys max
- **Solution:** Phase 1 (per-project keys)

### **Scenario 2: Small Team (You + 2-3 Colleagues, Next Year)**
- **Needs:** Share memory across team, easy onboarding
- **Security:** Moderate (internal tools, no customer data)
- **Key management:** 1 shared key per team
- **Solution:** Phase 2 (contexts with shared keys)

### **Scenario 3: Company with 45 People**
- **Needs:** Audit logs, access control, compliance
- **Security:** High (customer data, trade secrets)
- **Key management:** Individual keys, revocation, rotation
- **Solution:** Phase 3 (GPG + enterprise features)

### **Scenario 4: You Work on 12 Company Projects**
- **Needs:** Easy switching between projects, one key for all company work
- **Security:** Moderate (company data, but small team)
- **Key management:** 1 company key, 1 personal key
- **Solution:** Phase 2 (contexts: personal + company)

---

## 🎯 Current Status (2025-01-09)

**Phase 1:** ✅ Shipped  
**Phase 2:** 📋 Planned (build when needed)  
**Phase 3:** 💭 Concept (build when companies pay)

**Current user:** Solo developer (Dennis)  
**Current need:** Simple encryption for personal projects  
**Next milestone:** When Dennis has 3+ projects or introduces colleagues

---

## 📚 Related Documentation

- [ENCRYPTION.md](./ENCRYPTION.md) - User guide for Phase 1 encryption
- [README.md](../README.md) - Main documentation
- [packages/aether/src/utils/GitCryptManager.ts](../src/utils/GitCryptManager.ts) - Implementation

---

## 💡 Key Insights

1. **Key = Context, Not Person, Not Project**
   - Personal context → One key for all personal projects
   - Company context → One key for all company projects
   - NOT: One key per project (too many keys)
   - NOT: One key for everything (security risk)

2. **Progressive Complexity**
   - Start simple (per-project keys)
   - Add complexity when needed (contexts)
   - Add enterprise features when companies pay (GPG)

3. **Build for Current Users, Plan for Future Users**
   - Phase 1: Solo developers (current)
   - Phase 2: Small teams (next year)
   - Phase 3: Enterprise (when revenue justifies it)

4. **Don't Over-Engineer**
   - Don't build enterprise features before you have enterprise users
   - Get feedback from real users before adding complexity
   - Ship fast, iterate based on feedback

---

**Last Updated:** 2025-01-09  
**Author:** Dennis (with AI assistance)  
**Status:** Living document (update as we learn)

