# 📦 Release Notes - Version 3.0.0

**Release Date:** October 24, 2025

---

## 🎉 What's New in v3.0.0

This is the **first stable release** of the experimental memory consolidation system. All features are production-ready with comprehensive privacy and security documentation.

---

## ✨ Major Features

### 1. 🔐 Explicit Consent & Permission Management

**NEW:** Users now explicitly grant permission for each LLM platform before data access.

```bash
# View all permissions
aice permissions list

# Revoke access to a platform
aice permissions revoke warp

# Grant access to a platform
aice permissions grant warp
```

**Features:**
- ✅ Explicit opt-in for each platform
- ✅ Revoke access anytime
- ✅ Complete audit trail in `.aicf/.permissions.aicf`
- ✅ Timestamps for all permission changes

### 2. 📋 Comprehensive Documentation

**NEW:** Three bulletproof documentation files:

- **[PRIVACY.md](PRIVACY.md)** - Privacy policy & data handling
- **[SECURITY.md](SECURITY.md)** - Security architecture & audit logging
- **[CLI-COMMANDS.md](CLI-COMMANDS.md)** - Complete command reference

### 3. ⏰ Correct Polling Interval

**FIXED:** System now polls every 5 minutes (300000ms) instead of 5 seconds.

- ✅ Reduced system load
- ✅ Respects user's machine resources
- ✅ Configurable via `--interval` flag

### 4. 🎯 Transparent Data Flow

**NEW:** Clear messaging about what data is accessed and why.

```
🔐 Conversation Capture Mode

📁 Data Discovery
To set up automatic mode, we need your permission to:
  • Read conversations from your LLM library folders
  • Extract and consolidate them into memory files
  • Store them locally in .aicf/ and .ai/ directories
```

---

## 🔧 Technical Improvements

### Build & Quality

- ✅ **567 tests passing** (100% pass rate)
- ✅ **0 TypeScript errors** (strict mode)
- ✅ **0 ESLint errors** (strict linting)
- ✅ **100% type coverage** (no `any` types)
- ✅ **Dual build** (ESM + CJS)

### Performance

- ✅ **5-minute polling interval** (configurable)
- ✅ **Efficient AICF format** (5x smaller than markdown)
- ✅ **Lazy loading** (only read what's needed)
- ✅ **Streaming writes** (no memory bloat)

### Security

- ✅ **Read-only access** (never modifies LLM data)
- ✅ **Local processing** (no cloud uploads)
- ✅ **Audit logging** (complete access trail)
- ✅ **Permission enforcement** (no backdoors)

---

## 📋 Platform Support

All 6 platforms fully supported:

| Platform | Status | Location |
|----------|--------|----------|
| **Augment** | ✅ Supported | `.cache/llm/augment/` |
| **Warp** | ✅ Supported | `~/Library/Group Containers/.../warp.sqlite` |
| **Claude Desktop** | ✅ Supported | `~/Library/Application Support/Claude/` |
| **Claude CLI** | ✅ Supported | `~/.claude/projects/` |
| **Copilot** | ✅ Supported | `~/AppData/Local/Microsoft/Copilot/` |
| **ChatGPT** | ✅ Supported | Browser storage |

---

## 🚀 Getting Started

### Installation

```bash
npm install create-ai-chat-context
# or
pnpm add create-ai-chat-context
```

### Quick Start

```bash
# Initialize project
aice init

# Select platforms you use
# (Augment, Warp, Claude Desktop, Claude CLI, Copilot, ChatGPT)

# Watcher starts automatically
# (Checks every 5 minutes)

# View permissions
aice permissions list
```

### Read Documentation

1. **[PRIVACY.md](PRIVACY.md)** - Understand privacy guarantees
2. **[SECURITY.md](SECURITY.md)** - Understand security architecture
3. **[CLI-COMMANDS.md](CLI-COMMANDS.md)** - Learn all commands
4. **[README.md](README.md)** - Quick reference

---

## 🔄 Migration from v2.0.1

If you're using the base package (v2.0.1), upgrade to experimental:

```bash
# Upgrade to experimental
npm install create-ai-chat-context@latest

# Migrate existing setup
aice migrate

# Done! Your data is preserved
```

---

## 🐛 Bug Fixes

### Fixed in v3.0.0

1. **Polling Interval Bug** - Was 5 seconds, now correctly 5 minutes
2. **Hardcoded Version** - Now reads from package.json dynamically
3. **Missing Consent Messaging** - Now shows explicit opt-in prompts
4. **No Permission Management** - Now has `aice permissions` command

---

## 📊 Project Status

### Phase 2: TypeScript Rewrite
- ✅ **COMPLETE** - Pure TypeScript codebase
- ✅ **567 tests passing** - 100% pass rate
- ✅ **0 errors** - TypeScript strict mode
- ✅ **Comprehensive docs** - Privacy, security, CLI reference

### Phase 5.5: Multi-Platform Architecture
- ✅ **COMPLETE** - All 6 platforms supported
- ✅ **Automatic capture** - Background watcher
- ✅ **Manual mode** - User-controlled updates
- ✅ **Permission management** - Explicit consent

---

## 📚 Documentation

### Essential Reading

- **[PRIVACY.md](PRIVACY.md)** ⭐ **START HERE** - Privacy policy
- **[SECURITY.md](SECURITY.md)** - Security architecture
- **[CLI-COMMANDS.md](CLI-COMMANDS.md)** - Command reference
- **[README.md](README.md)** - Quick start guide

### Additional Resources

- **[docs/PERMISSION-AND-CONSENT-STRATEGY.md](docs/PERMISSION-AND-CONSENT-STRATEGY.md)** - Detailed consent flow
- **[docs/USER-JOURNEY-COMPLETE.md](docs/USER-JOURNEY-COMPLETE.md)** - Complete system overview
- **[docs/DATA-FLOW-EXAMPLES.md](docs/DATA-FLOW-EXAMPLES.md)** - Real examples

---

## 🔐 Privacy & Security Guarantees

### What We Do

✅ Read conversation data from your LLM platforms (only ones you select)
✅ Extract key information locally on your machine
✅ Store processed data in `.aicf/` and `.ai/` folders
✅ Log all access attempts for audit purposes
✅ Commit changes to your git repository

### What We DON'T Do

❌ Send data to cloud
❌ Share with third parties
❌ Modify your LLM data
❌ Track you or collect telemetry
❌ Store credentials or API keys
❌ Access without permission

---

## 🎯 Next Steps

### For Users

1. Read [PRIVACY.md](PRIVACY.md) to understand privacy guarantees
2. Read [SECURITY.md](SECURITY.md) to understand security architecture
3. Run `aice init` to set up your project
4. Select which platforms you use
5. Watcher starts automatically (checks every 5 minutes)

### For Developers

1. Review source code on GitHub
2. Run tests: `pnpm test`
3. Build: `pnpm build`
4. Contribute: See [CONTRIBUTING.md](docs/CONTRIBUTING.md)

---

## 📞 Support

### Questions?

1. **Read the docs** - See `/docs/` folder
2. **Check FAQ** - See [PRIVACY.md](PRIVACY.md#-faq)
3. **Review source code** - It's open source on GitHub
4. **Open an issue** - GitHub issues welcome

### Privacy Concerns?

1. **Review [PRIVACY.md](PRIVACY.md)** - Complete privacy policy
2. **Review [SECURITY.md](SECURITY.md)** - Security architecture
3. **Check audit trail** - See `.aicf/.permissions.aicf`
4. **Use manual mode** - No automatic access

---

## 🙏 Thank You

Thank you for using Create AI Chat Context! We're committed to:

- ✅ **Privacy** - Your data stays on your machine
- ✅ **Transparency** - You can audit everything
- ✅ **Security** - Multiple layers of protection
- ✅ **Quality** - 567 tests, 0 errors, 100% type coverage

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

**Ready to consolidate your AI conversations? Start with: `aice init` 🚀**

**First time? Read [PRIVACY.md](PRIVACY.md) first! 🔐**

