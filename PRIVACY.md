# 🔐 Privacy & Security Policy

**Last Updated:** October 24, 2025

## Executive Summary

**This tool reads your private LLM conversations locally on your machine. It does NOT send data anywhere. It does NOT upload to cloud. It does NOT share with third parties. All processing happens on your computer.**

---

## 🎯 What This Tool Does

### ✅ What We DO

1. **Read** conversation data from your LLM platforms (only the ones you explicitly select)
2. **Extract** key information: decisions, actions, technical work, context
3. **Process** conversations locally on your machine
4. **Store** processed data in `.aicf/` and `.ai/` folders in your project
5. **Log** all access attempts for audit purposes
6. **Commit** changes to your git repository

### ❌ What We DON'T Do

1. **Send data anywhere** - No cloud uploads, no external servers
2. **Share with third parties** - Your data stays on your machine
3. **Modify your LLM data** - Read-only access only
4. **Track you** - No telemetry, no analytics, no tracking
5. **Require internet** - Works completely offline
6. **Store credentials** - No passwords, tokens, or API keys stored
7. **Access without permission** - Only reads platforms you explicitly enable

---

## 🔒 Data Access & Permissions

### How Permissions Work

When you run `aice init --automatic`, you explicitly select which LLM platforms to monitor:

```
📁 Data Discovery
To set up automatic mode, we need your permission to:
  • Read conversations from your LLM library folders
  • Extract and consolidate them into memory files
  • Store them locally in .aicf/ and .ai/ directories

? Which LLM platforms do you use? (Select all that apply)
  ☐ Augment
  ☐ Warp
  ☐ Claude Desktop
  ☐ Claude CLI
  ☐ Copilot
  ☐ ChatGPT
```

**You choose. You control. You decide.**

### Platform-Specific Access

| Platform | Location | Access Type | Data Read |
|----------|----------|-------------|-----------|
| **Augment** | `.cache/llm/augment/` | Read-only JSON | Conversation chunks |
| **Warp** | `~/Library/Group Containers/.../warp.sqlite` | Read-only SQLite | AI queries & responses |
| **Claude Desktop** | `~/Library/Application Support/Claude/` | Read-only DB | Conversation history |
| **Claude CLI** | `~/.claude/projects/` | Read-only JSONL | Session files |
| **Copilot** | `~/AppData/Local/Microsoft/Copilot/` | Read-only files | Conversation history |
| **ChatGPT** | Browser storage | Read-only | Conversation history |

**All access is read-only. We never modify your LLM data.**

---

## 📋 Consent & Audit Trail

### Permissions File: `.aicf/.permissions.aicf`

Every permission is recorded with timestamp and consent type:

```
@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=explicit|timestamp=2025-10-24T11:31:15.268Z
@PLATFORM|name=warp|status=active|consent=explicit|timestamp=2025-10-24T11:31:15.269Z
@PLATFORM|name=claude-desktop|status=active|consent=explicit|timestamp=2025-10-24T11:31:15.270Z
@AUDIT|event=init|timestamp=2025-10-24T11:31:15.270Z|user=system|action=created_permissions_file
```

**You can audit exactly what permissions were granted and when.**

### Manage Permissions Anytime

```bash
# View all permissions
aice permissions list

# Revoke access to a platform
aice permissions revoke warp

# Grant access to a platform
aice permissions grant warp
```

**Revoke permissions instantly. No data is accessed from revoked platforms.**

---

## 🗑️ Data Deletion

### What Gets Stored

When the tool processes conversations, it stores:

- `.aicf/` - AI-optimized structured data (pipe-delimited format)
- `.ai/` - Human-readable markdown documentation
- `.watcher-config.json` - Configuration (which platforms to monitor)
- `.permissions.aicf` - Permission audit trail

### Delete Your Data

```bash
# Delete all memory files
rm -rf .aicf/ .ai/

# Delete watcher config
rm .watcher-config.json

# Delete permissions audit trail
rm .aicf/.permissions.aicf
```

**You own your data. Delete it anytime.**

---

## 🔄 How Data Flows

```
Your LLM Platform (Augment, Claude, etc.)
         ↓
    [Read-Only Access]
         ↓
    Local Processing (Your Machine)
         ↓
    Extract Decisions, Actions, Context
         ↓
    Store in .aicf/ and .ai/ (Your Project)
         ↓
    Commit to Git (Your Repository)
         ↓
    [STOP - Data stays on your machine]
```

**No data leaves your machine. Period.**

---

## 🛡️ Security Measures

### 1. Read-Only Access
- Tool only reads from LLM platforms
- Never modifies LLM data
- Never deletes LLM data
- Never writes to LLM platforms

### 2. Local Processing
- All processing happens on your machine
- No external API calls
- No cloud uploads
- No network transmission

### 3. File Permissions
- Respects your system file permissions
- Cannot access files you don't have access to
- Cannot bypass OS security

### 4. Audit Logging
- Every access is logged
- Timestamps recorded
- Audit trail in `.permissions.aicf`
- You can review all access

### 5. No Credentials Stored
- No passwords stored
- No API keys stored
- No tokens stored
- No authentication data persisted

---

## 📊 What Data Is Extracted

### From Conversations, We Extract:

✅ **Decisions** - Key decisions made during conversations
✅ **Actions** - Tasks, TODOs, action items
✅ **Technical Work** - Code changes, architecture decisions
✅ **Context** - Project status, progress, blockers
✅ **Metadata** - Timestamps, participants, platforms

### What We DON'T Extract:

❌ Passwords or secrets
❌ API keys or tokens
❌ Personal information (unless you shared it)
❌ Sensitive business data (unless you shared it)
❌ Anything you didn't explicitly share in the conversation

---

## 🚨 Transparency & Control

### You Have Full Control

1. **Choose which platforms** - Only enable platforms you use
2. **Revoke anytime** - Stop access to any platform instantly
3. **Delete anytime** - Remove all extracted data anytime
4. **Audit anytime** - Review all access logs
5. **Switch modes** - Move to manual mode anytime

### You Have Full Transparency

1. **See what's extracted** - All data in `.aicf/` and `.ai/` folders
2. **See permissions** - All permissions in `.permissions.aicf`
3. **See audit trail** - All access logged with timestamps
4. **See source code** - Open source on GitHub
5. **See documentation** - Complete docs for all features

---

## ⚖️ Legal

### Data Ownership
- **You own all extracted data**
- You can use it however you want
- You can delete it anytime
- You can share it or keep it private

### Liability
- This tool is provided "as-is"
- No warranty or guarantees
- Use at your own risk
- See LICENSE file for full terms

### GDPR & Privacy Laws
- This tool helps you comply with privacy laws
- You control what data is accessed
- You can delete data anytime
- You can audit all access

---

## 🤔 FAQ

### Q: Does this tool send my data to the cloud?
**A:** No. All processing happens on your machine. No data is sent anywhere.

### Q: Can I revoke permissions?
**A:** Yes. Run `aice permissions revoke <platform>` anytime.

### Q: What if I want to delete all extracted data?
**A:** Delete `.aicf/` and `.ai/` folders. Your data is gone.

### Q: Is this tool open source?
**A:** Yes. See https://github.com/Vaeshkar/create-ai-chat-context-experimental

### Q: Can I audit what data was accessed?
**A:** Yes. Check `.aicf/.permissions.aicf` for complete audit trail.

### Q: What if I don't trust this tool?
**A:** Use manual mode instead. You ask your LLM to update memory files. No automatic access.

### Q: Does this tool require internet?
**A:** No. Works completely offline.

### Q: Can I use this tool in a corporate environment?
**A:** Yes. All data stays on your machine. No cloud access. No external dependencies.

---

## 📞 Questions or Concerns?

If you have privacy or security concerns:

1. **Review the source code** - It's open source on GitHub
2. **Check the audit trail** - See `.aicf/.permissions.aicf`
3. **Read the documentation** - See `/docs/` folder
4. **Use manual mode** - No automatic access, full control

---

## 🔗 Related Documentation

- **[README.md](README.md)** - Quick start guide
- **[docs/PERMISSION-AND-CONSENT-STRATEGY.md](docs/PERMISSION-AND-CONSENT-STRATEGY.md)** - Detailed consent flow
- **[LICENSE](LICENSE)** - Full license terms
- **[GitHub Repository](https://github.com/Vaeshkar/create-ai-chat-context-experimental)** - Source code

---

**Your data. Your machine. Your control. 🔐**

