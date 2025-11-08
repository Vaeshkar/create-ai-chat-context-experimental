# 🔐 AETHER Memory Encryption

**Encrypt your `.lill/` directory and backup to GitHub with git-crypt.**

---

## 🎯 Why Encrypt?

When you use AETHER on a project, the `.lill/` directory contains:
- ✅ All conversations about your project
- ✅ Extracted principles and insights
- ✅ Architectural decisions and reasoning
- ✅ Your thinking process and work patterns

**This is valuable project knowledge that should be:**
1. **Backed up** (disaster recovery if computer dies)
2. **Version controlled** (see how understanding evolved)
3. **Private** (conversations may contain sensitive business logic)
4. **Shareable** (team members can unlock with encryption key)

---

## 🚀 Quick Start

### **During `aether init`**

When you run `aether init`, you'll be asked:

```
🔐 Memory Encryption

AETHER can encrypt your .lill/ directory before committing to GitHub.

Benefits:
  ✓ Conversations stay private (encrypted with AES-256)
  ✓ Backup to GitHub (disaster recovery)
  ✓ Version history (see how AI understanding evolved)
  ✓ Team sharing (share encryption key with team)

Requirements:
  • git-crypt (will be installed automatically)
  • Encryption key management (stored in ~/.aether-keys/)

⚠️  Without encryption, .lill/ stays local only (no backup)

? Encrypt .lill/ directory and backup to GitHub? (Y/n)
```

**Answer `Y` to enable encryption.**

### **During `aether migrate`**

If you're migrating from manual mode, you'll see the same question after migration completes.

---

## 🔧 How It Works

### **1. git-crypt Installation**

AETHER automatically installs git-crypt using Homebrew (macOS):

```bash
brew install git-crypt
```

### **2. Repository Initialization**

AETHER initializes git-crypt in your repository:

```bash
git-crypt init
```

### **3. Encryption Key Export**

AETHER exports the encryption key to a safe location:

```
~/.aether-keys/<project-name>-git-crypt-key
```

**⚠️  CRITICAL: Store this key safely!**
- Add to password manager (1Password, Bitwarden, LastPass)
- Print and store in safe
- Copy to USB drive (encrypted)
- Share with team members (secure channel only)

**If you lose this key, your data is UNRECOVERABLE!**

### **4. .gitattributes Configuration**

AETHER adds encryption rules to `.gitattributes`:

```gitattributes
# AETHER Memory Encryption (git-crypt)
# Encrypt all files in .lill/ directory
.lill/** filter=git-crypt diff=git-crypt
.gitattributes !filter !diff
```

### **5. .gitignore Update**

AETHER removes `.lill/` from `.gitignore` so it can be committed:

```gitignore
# AETHER Memory (.lill/) is encrypted with git-crypt and committed to repo
# Individual subdirectories can still be ignored:
.lill/.watcher-config.json
.lill/logs/
```

---

## 📦 Committing Encrypted Data

After encryption is set up:

```bash
# Stage encrypted files
git add .gitattributes .gitignore .lill/

# Commit
git commit -m "feat: add encrypted AETHER memory"

# Push to GitHub
git push
```

**Files in `.lill/` are automatically encrypted before being pushed!**

---

## 🔓 Unlocking on Another Machine

### **Clone the Repository**

```bash
git clone git@github.com:your-username/your-project.git
cd your-project
```

### **Install git-crypt**

```bash
brew install git-crypt
```

### **Unlock with Key**

```bash
# Copy the key to the new machine
# Then unlock:
git-crypt unlock ~/.aether-keys/<project-name>-git-crypt-key
```

**Now `.lill/` files are decrypted and readable!**

---

## 👥 Team Sharing

### **Share Encryption Key**

1. **Export key** (already done during setup):
   ```bash
   ls ~/.aether-keys/<project-name>-git-crypt-key
   ```

2. **Share securely** with team members:
   - Use password manager shared vault
   - Use encrypted USB drive
   - Use secure file transfer (not email!)

3. **Team member unlocks**:
   ```bash
   git-crypt unlock /path/to/key
   ```

### **Add GPG Users (Alternative)**

Instead of sharing a symmetric key, you can add team members via GPG:

```bash
# Team member generates GPG key
gpg --gen-key

# Team member exports public key
gpg --armor --export user@example.com > user.gpg

# You import and trust their key
gpg --import user.gpg
gpg --edit-key user@example.com
  > trust
  > 5 (ultimate)
  > quit

# Add them to git-crypt
git-crypt add-gpg-user user@example.com

# Commit and push
git add .git-crypt/
git commit -m "chore: add team member to git-crypt"
git push
```

**Now they can unlock without needing the symmetric key!**

---

## 🔍 Verifying Encryption

### **Check Encryption Status**

```bash
git-crypt status
```

**Output:**
```
encrypted: .lill/raw/2025-11-08-conversation.json
encrypted: .lill/snapshots/rolling/snapshot-2025-11-08.bin
not encrypted: README.md
not encrypted: package.json
```

### **View Encrypted File on GitHub**

Go to GitHub and view a file in `.lill/`:
- You'll see binary gibberish (encrypted!)
- Only users with the key can decrypt

---

## 🚨 Security Best Practices

### **DO:**
- ✅ Store encryption key in password manager
- ✅ Print key and store in safe
- ✅ Keep USB backup of key (encrypted)
- ✅ Share key via secure channel only
- ✅ Use GPG for team access (more secure)

### **DON'T:**
- ❌ Commit encryption key to git
- ❌ Email encryption key
- ❌ Store key in Slack/Discord
- ❌ Share key via unencrypted channel
- ❌ Lose the key (data is unrecoverable!)

---

## 🛠️ Troubleshooting

### **"git-crypt: command not found"**

Install git-crypt:
```bash
brew install git-crypt
```

### **"Failed to unlock"**

Make sure you're using the correct key:
```bash
git-crypt unlock ~/.aether-keys/<project-name>-git-crypt-key
```

### **"Files are not encrypted"**

Check `.gitattributes`:
```bash
cat .gitattributes | grep .lill
```

Should show:
```
.lill/** filter=git-crypt diff=git-crypt
```

### **"I lost my encryption key!"**

**Unfortunately, your data is unrecoverable.** 😢

This is why we emphasize storing the key in multiple safe locations:
- Password manager
- Printed copy in safe
- USB backup

---

## 📊 Comparison: Encrypted vs Unencrypted

| Aspect | Unencrypted | Encrypted |
|--------|-------------|-----------|
| **Backup** | ❌ Local only | ✅ GitHub backup |
| **Disaster recovery** | ❌ Lost if computer dies | ✅ Restore from GitHub |
| **Privacy** | ✅ Private (local) | ✅ Private (encrypted) |
| **Team sharing** | ❌ Manual file sharing | ✅ Git + encryption key |
| **Version history** | ❌ No history | ✅ Full git history |
| **Complexity** | ⭐ Simple | ⭐⭐⭐ Moderate |

---

## 🎯 Recommendation

**Use encryption if:**
- ✅ You want disaster recovery (backup to GitHub)
- ✅ You work on multiple machines
- ✅ You work with a team
- ✅ You want version history
- ✅ Your conversations contain sensitive info

**Skip encryption if:**
- ✅ You only work on one machine
- ✅ You have Time Machine backups
- ✅ You work alone
- ✅ You don't need version history
- ✅ You prefer simplicity

---

## 📚 Learn More

- [git-crypt Documentation](https://github.com/AGWA/git-crypt)
- [GPG Tutorial](https://www.gnupg.org/gph/en/manual.html)
- [AETHER Security](./SECURITY.md)

---

**Remember: Encryption is about protecting your valuable project knowledge while enabling disaster recovery and team collaboration!** 🔐🚀

