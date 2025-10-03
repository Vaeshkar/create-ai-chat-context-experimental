# Source Files Audit - What's Needed?

**Date:** 2025-10-03
**Purpose:** Determine which src/ files are needed for v1.0.0

---

## Files in `src/`

### ✅ KEEP - Core Functionality

**`init.js`**

- **Purpose:** Initialize .ai/ and .aicf/ folders
- **Used by:** `aic init` command
- **Status:** ✅ ESSENTIAL - Core feature

**`templates.js`**

- **Purpose:** Template management for init
- **Used by:** `init.js`
- **Status:** ✅ ESSENTIAL - Needed for init

**`index.js`**

- **Purpose:** Main entry point / exports
- **Used by:** package.json main field
- **Status:** ✅ ESSENTIAL - Package entry

---

### ✅ KEEP - Useful Commands

**`validate.js`**

- **Purpose:** Validate knowledge base quality
- **Used by:** `aic validate` command
- **Status:** ✅ USEFUL - Quality checks

**`check.js`**

- **Purpose:** Quick health check
- **Used by:** `aic check` command
- **Status:** ✅ USEFUL - Quick diagnostics

**`tokens.js`**

- **Purpose:** Show token usage breakdown
- **Used by:** `aic tokens` command
- **Status:** ✅ USEFUL - Token management

**`search.js`**

- **Purpose:** Search across knowledge base
- **Used by:** `aic search` command
- **Status:** ✅ USEFUL - Find information

**`stats.js`**

- **Purpose:** Show statistics and insights
- **Used by:** `aic stats` command
- **Status:** ✅ USEFUL - Analytics

**`export.js`**

- **Purpose:** Export knowledge base (markdown, json, html)
- **Used by:** `aic export` command
- **Status:** ✅ USEFUL - Data portability

**`update.js`**

- **Purpose:** Update knowledge base with latest templates
- **Used by:** `aic update` command
- **Status:** ✅ USEFUL - Keep templates current

**`config.js`**

- **Purpose:** Manage configuration
- **Used by:** `aic config` command
- **Status:** ✅ USEFUL - Configuration management

---

### ⚠️ REVIEW - AI Integration Commands

**`cursor.js`**

- **Purpose:** Generate .cursorrules file for Cursor AI
- **Used by:** `aic cursor` command
- **Status:** ⚠️ REVIEW - Is this still relevant?
- **Decision:** KEEP if we want Cursor integration

**`copilot.js`**

- **Purpose:** Generate GitHub Copilot instructions
- **Used by:** `aic copilot` command
- **Status:** ⚠️ REVIEW - Is this still relevant?
- **Decision:** KEEP if we want Copilot integration

**`claude-project.js`**

- **Purpose:** Generate Claude Projects export
- **Used by:** `aic claude-project` command
- **Status:** ⚠️ REVIEW - Is this still relevant?
- **Decision:** KEEP if we want Claude integration

---

### ⚠️ REVIEW - Conversation Management

**`archive.js`**

- **Purpose:** Archive old conversation log entries
- **Used by:** `aic archive` command
- **Status:** ⚠️ REVIEW - Still needed with manual AICF?
- **Decision:** KEEP - Still useful for .ai/ folder

**`summary.js`**

- **Purpose:** Summarize old conversation log entries
- **Used by:** `aic summary` command
- **Status:** ⚠️ REVIEW - Still needed with manual AICF?
- **Decision:** KEEP - Still useful for .ai/ folder

**`chat-finish.js`**

- **Purpose:** Auto-update knowledge base at session end
- **Used by:** `aic chat-finish` command
- **Status:** ⚠️ REVIEW - What does this do now?
- **Decision:** REVIEW - Check if it's compatible with manual AICF

---

### ⚠️ REVIEW - Format Conversion

**`convert.js`**

- **Purpose:** Convert conversation log format
- **Used by:** `aic convert` command
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** REVIEW - Check if relevant for manual approach

**`aicf-migrate.js`**

- **Purpose:** Convert .ai/ to .aicf/ format
- **Used by:** `aic migrate` command
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** REVIEW - Check if relevant for manual approach

**`aicf-context.js`**

- **Purpose:** View AI context summary
- **Used by:** `aic context` command
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** KEEP - Useful for starting new sessions

**`aicf-parser.js`**

- **Purpose:** Parse AICF format
- **Used by:** Other AICF tools
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** KEEP if other AICF tools use it

**`aicf-compiler.js`**

- **Purpose:** Compile AICF format
- **Used by:** Other AICF tools
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** REVIEW - Check usage

**`aicf-all-files.js`**

- **Purpose:** Convert ALL files to AICF
- **Used by:** `aic convert --all-files`
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** REVIEW - Check if relevant

**`ai-native-format.js`**

- **Purpose:** AI-native format conversion
- **Used by:** Convert command
- **Status:** ⚠️ REVIEW - Still needed?
- **Decision:** REVIEW - Check usage

---

### ⚠️ REVIEW - Git Integration

**`install-hooks.js`**

- **Purpose:** Install Git hooks for maintenance
- **Used by:** `aic install-hooks` command
- **Status:** ⚠️ REVIEW - What hooks does it install?
- **Decision:** REVIEW - Check if compatible with manual AICF

---

### ✅ KEEP - Utilities

**`log.js`**

- **Purpose:** Conversation log utilities (get next chat number, etc.)
- **Used by:** `chat-finish.js`, other commands
- **Status:** ✅ USEFUL - Needed for log management

**`detect.js`**

- **Purpose:** Auto-detect project type (Next.js, Python, Rust)
- **Used by:** `init.js` for template selection
- **Status:** ✅ USEFUL - Needed for smart init

---

## Recommendations

### Immediate Actions

1. **Check these files:**

   - `chat-finish.js` - Does it work with manual AICF?
   - `convert.js` - Still relevant?
   - `aicf-migrate.js` - Still relevant?
   - `install-hooks.js` - What hooks does it install?
   - `log.js` - What does it do?
   - `detect.js` - What does it do?

2. **Test these commands:**

   ```bash
   aic chat-finish
   aic convert --help
   aic migrate
   aic install-hooks
   ```

3. **Review AI integration:**
   - Do we want Cursor integration?
   - Do we want Copilot integration?
   - Do we want Claude Projects integration?

### Potential Deletions

**If not needed:**

- `aicf-compiler.js` (if not used)
- `aicf-all-files.js` (if not relevant)
- `ai-native-format.js` (if not used)
- `log.js` (if just logging)
- `detect.js` (if not used)

---

## Next Steps

1. **Review each ⚠️ file** - Check what it does
2. **Test each command** - Make sure it works
3. **Delete unused files** - Clean up dead code
4. **Update CLI** - Remove commands for deleted files
5. **Update documentation** - Reflect actual features

---

**Need to audit 15 files before v1.0.0 release!**
