# Init & Migrate Command Summary

**Date:** 2025-10-25  
**Status:** Ready for Implementation

---

## 🎯 What We Need to Fix

### 1. **Templates Need Updates**

**Problem:** Templates are outdated for Phase 6-8 architecture.

**Current templates:**
- ✅ `templates/ai/` - 6 files (correct)
- ❌ `templates/aicf/README.md` - Describes old unified file structure
- ❌ Missing `templates/aicf/config.json`

**Fix:**
- Update `templates/aicf/README.md` to describe Phase 6-8 structure
- Add `templates/aicf/config.json`

---

### 2. **Init Command Missing Folder Creation**

**Problem:** InitCommand creates `.aicf/` but not subdirectories.

**Current behavior:**
```
.aicf/
  .permissions.aicf
  .watcher-config.json
```

**Should create:**
```
.aicf/
  recent/          ← Missing!
  sessions/        ← Missing!
  medium/          ← Missing!
  old/             ← Missing!
  archive/         ← Missing!
  config.json      ← Missing!
  README.md        ← Exists but outdated
  .permissions.aicf
  .watcher-config.json
```

**Fix:** Add folder creation to `initAutomaticMode()` and `initManualMode()`

---

### 3. **Migrate Command Doesn't Handle Legacy Data**

**Problem:** When users migrate from v2.0.1, they have old `.aicf/` files that don't match Phase 6-8 structure.

**Current behavior:**
- Preserves `.aicf/` and `.ai/` as-is
- Adds `.permissions.aicf` and `.watcher-config.json`
- Doesn't move old files

**Proposed behavior:**
1. Detect old structure (files directly in `.aicf/`)
2. Create `legacy_memory/` folder
3. Move old files to `legacy_memory/`
4. Create new Phase 6-8 structure
5. User runs `aice watch` to re-extract from library data

**Why this approach?**
- ✅ Preserves user's existing memory files (no data loss)
- ✅ Clean slate for Phase 6-8 architecture
- ✅ Users can reference legacy files if needed
- ✅ Fresh extraction ensures correct Phase 6-8 data

---

## 📋 Implementation Plan

### Step 1: Update Templates (2 files)

**File 1: `templates/aicf/README.md`**
- Replace with Phase 6-8 architecture explanation
- Describe folder structure (recent, sessions, medium, old, archive)
- Explain memory dropoff strategy (2/7/14 day windows)

**File 2: `templates/aicf/config.json`** (NEW)
- Copy from current `.aicf/config.json`
- Contains checkpoint frequency, quality check, cost estimates

---

### Step 2: Update InitCommand (1 file)

**File: `src/commands/InitCommand.ts`**

**Changes:**
1. Add folder creation in `initAutomaticMode()` (line ~437)
2. Add folder creation in `initManualMode()` (line ~338)

**Code to add:**
```typescript
// Create Phase 6-8 directory structure
const recentDir = join(aicfDir, 'recent');
const sessionsDir = join(aicfDir, 'sessions');
const mediumDir = join(aicfDir, 'medium');
const oldDir = join(aicfDir, 'old');
const archiveDir = join(aicfDir, 'archive');

mkdirSync(recentDir, { recursive: true });
mkdirSync(sessionsDir, { recursive: true });
mkdirSync(mediumDir, { recursive: true });
mkdirSync(oldDir, { recursive: true });
mkdirSync(archiveDir, { recursive: true });

filesCreated.push(recentDir, sessionsDir, mediumDir, oldDir, archiveDir);
```

---

### Step 3: Update MigrateCommand (1 file)

**File: `src/commands/MigrateCommand.ts`**

**Changes:**
1. Add `migrateLegacyData()` method
2. Call method in `execute()` after creating `.cache/llm/`
3. Add user messaging about legacy data

**New method:**
```typescript
private async migrateLegacyData(): Promise<string[]> {
  const aicfDir = join(this.cwd, '.aicf');
  const legacyDir = join(this.cwd, 'legacy_memory');
  const movedFiles: string[] = [];
  
  // Check if .aicf/ has files directly in it (old structure)
  const files = readdirSync(aicfDir).filter(f => {
    const fullPath = join(aicfDir, f);
    const stat = statSync(fullPath);
    // Skip directories and new config files
    return !stat.isDirectory() && 
           f !== '.permissions.aicf' && 
           f !== '.watcher-config.json' &&
           f !== 'README.md' &&
           f !== 'config.json';
  });
  
  if (files.length > 0) {
    // Create legacy_memory folder
    mkdirSync(legacyDir, { recursive: true });
    
    // Move old files
    for (const file of files) {
      const srcPath = join(aicfDir, file);
      const destPath = join(legacyDir, file);
      renameSync(srcPath, destPath);
      movedFiles.push(file);
    }
  }
  
  // Create new Phase 6-8 structure
  const recentDir = join(aicfDir, 'recent');
  const sessionsDir = join(aicfDir, 'sessions');
  const mediumDir = join(aicfDir, 'medium');
  const oldDir = join(aicfDir, 'old');
  const archiveDir = join(aicfDir, 'archive');
  
  mkdirSync(recentDir, { recursive: true });
  mkdirSync(sessionsDir, { recursive: true });
  mkdirSync(mediumDir, { recursive: true });
  mkdirSync(oldDir, { recursive: true });
  mkdirSync(archiveDir, { recursive: true });
  
  return movedFiles;
}
```

**Update `execute()` method:**
```typescript
// After creating .cache/llm directory (line ~85)
const movedFiles = await this.migrateLegacyData();

// Update success message to show moved files
if (movedFiles.length > 0) {
  console.log();
  console.log(chalk.yellow('📦 Legacy Data Migration'));
  console.log(chalk.dim(`  Moved ${movedFiles.length} files to legacy_memory/`));
  console.log(chalk.dim('  Your old memory files are preserved'));
  console.log(chalk.dim('  Run "aice watch" to re-extract from library data'));
}
```

---

### Step 4: Update .gitignore

**File: `.gitignore`**

**Add:**
```
# Phase 6-8 memory files (auto-generated)
.aicf/recent/
.aicf/sessions/
.aicf/medium/
.aicf/old/
.aicf/archive/

# Legacy memory (user should commit this)
# legacy_memory/  ← DO NOT IGNORE
```

**Note:** `legacy_memory/` should NOT be ignored so users can commit their old data.

---

## 🚀 User Experience

### Scenario 1: New User

**Command:** `aice init --automatic`

**Output:**
```
✅ Automatic Mode Setup Complete

📊 Enabled Platforms:
  ✓ augment

📁 Directory Structure Created:
  ✓ .ai/ (5 protected files)
  ✓ .aicf/recent/
  ✓ .aicf/sessions/
  ✓ .aicf/medium/
  ✓ .aicf/old/
  ✓ .aicf/archive/
  ✓ .cache/llm/

To start watching for conversations, run:
  aice watch
```

---

### Scenario 2: Existing v2.0.1 User

**Command:** `aice migrate`

**Output:**
```
✅ Migration to Automatic Mode Complete

📦 Legacy Data Migration
  Moved 15 files to legacy_memory/
  Your old memory files are preserved
  Run "aice watch" to re-extract from library data

Preserved:
  ✓ .ai/
  ✓ legacy_memory/

Created:
  ✓ .aicf/recent/
  ✓ .aicf/sessions/
  ✓ .aicf/medium/
  ✓ .aicf/old/
  ✓ .aicf/archive/
  ✓ .cache/llm/
  ✓ .permissions.aicf
  ✓ .watcher-config.json

To start watching for conversations, run:
  aice watch
```

---

## ✅ Testing Checklist

After implementation:

- [ ] Run `npm test` - all 548 tests pass
- [ ] Test `aice init --automatic` in empty directory
- [ ] Test `aice init --manual` in empty directory
- [ ] Test `aice migrate` with existing v2.0.1 structure
- [ ] Verify folder structure is correct
- [ ] Verify legacy files are moved
- [ ] Verify templates are copied correctly
- [ ] Verify .gitignore is updated

---

## 📝 Summary

**Files to change:**
1. `templates/aicf/README.md` - Update for Phase 6-8
2. `templates/aicf/config.json` - Add new file
3. `src/commands/InitCommand.ts` - Add folder creation
4. `src/commands/MigrateCommand.ts` - Add legacy data migration
5. `.gitignore` - Add Phase 6-8 folders

**Result:**
- ✅ New users get correct Phase 6-8 structure
- ✅ Existing users preserve legacy data
- ✅ Fresh extraction from library data
- ✅ No data loss
- ✅ Clean architecture

**Ready to implement?** Let me know and I'll make the changes! 🚀

