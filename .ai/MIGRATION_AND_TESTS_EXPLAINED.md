# Migration & Test Architecture Explained

## How Migration Handles Existing Files

### Smart Auto-Detection

When you run `aice init` and it finds existing `.ai/` and `.aicf/` folders:

```typescript
// InitCommand.ts lines 85-95
if (existsSync(aicfDir) && existsSync(aiDir) && !existsSync(permissionsFile)) {
  // Existing setup from base package - migrate it
  spinner.info('Found existing memory files. Switching to migration workflow...');
  return await this.migrateExistingSetup(spinner);
}
```

**It automatically switches to migration mode!** No need to run `aice migrate` separately.

### Non-Destructive File Handling

**Key Principle:** Only copy files that don't already exist

```typescript
// MigrateCommand.ts lines 311-325
const aiFiles = readdirSync(aiTemplateDir);
for (const file of aiFiles) {
  const srcFile = join(aiTemplateDir, file);
  const destFile = join(aiDir, file);
  if (!existsSync(destFile)) {  // ← Only if it doesn't exist!
    copyFileSync(srcFile, destFile);
  }
}
```

### What Gets Preserved vs. Created

| File | Behavior | Reason |
|------|----------|--------|
| `.ai/code-style.md` | ✅ **Preserved** | Your custom coding standards |
| `.ai/design-system.md` | ✅ **Preserved** | Your custom design rules |
| `.ai/npm-publishing-checklist.md` | ✅ **Preserved** | Your custom checklist |
| `.aicf/conversations.aicf` | ✅ **Preserved** | Your conversation history |
| `.aicf/decisions.aicf` | ✅ **Preserved** | Your decision log |
| `.permissions.aicf` | 🆕 **Created** | New automation file |
| `.watcher-config.json` | 🆕 **Created** | New automation file |
| `.cache/llm/` | 🆕 **Created** | New cache directory |

**Important:** Migrate does NOT update existing files. It only adds missing ones. If you want to update your templates, you must do it manually.

---

## How We Got to 567 Tests

### Test Statistics

- **40 test files** (`.test.ts` files)
- **10,513 lines** of test code
- **567 tests** passing
- **25 tests** skipped (platform-specific)
- **592 total** test cases

### Test Distribution by Module

| Module | Tests | Purpose |
|--------|-------|---------|
| **Parsers** | 121 | Parse conversations from 8 LLM platforms |
| **Extractors** | 80 | Extract decisions, actions, state, flow, intent, technical work |
| **Utils** | 117 | Logging, templates, tokens, file I/O, config, archive |
| **Permission & Config** | 66 | Permission management, watcher config, manager |
| **Commands** | 63 | Init, migrate, import, checkpoint, watcher commands |
| **Integration** | 54 | End-to-end workflows, orchestrators |
| **Agents** | 47 | Agent routing and utilities |
| **Services & Writers** | 30 | Consolidation service, memory file writer |
| **Watchers** | 25 | Claude CLI and Desktop watchers |

### Why So Many Tests?

1. **Multi-Platform Support** - 8 LLM platforms = 8 parser implementations
2. **Complex Extraction** - 6 different extractors for different data types
3. **State Management** - Permission manager, watcher config, background service
4. **File Operations** - Multiple file I/O utilities with error handling
5. **Integration Tests** - Full pipeline tests from checkpoint → analysis → memory files
6. **Edge Cases** - Error handling, validation, large files, missing data

### Test Execution Time

- **Total Duration:** ~5 seconds
- **Transform:** 1.82s (TypeScript compilation)
- **Collection:** 5.94s (test discovery)
- **Execution:** 11.01s (actual test runs)
- **Setup/Prepare:** 7.48s (environment setup)

---

## Key Takeaways

✅ **Migration is safe** - Existing files are never overwritten
✅ **Auto-detection works** - Init automatically detects and migrates old setups
✅ **Comprehensive testing** - 567 tests ensure reliability across all platforms
✅ **Fast execution** - Full test suite runs in ~5 seconds
✅ **Well-organized** - Tests grouped by module for easy maintenance

