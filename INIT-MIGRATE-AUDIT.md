# Init & Migrate Command Audit

**Date:** 2025-10-25  
**Purpose:** Audit init and migrate commands to ensure correct Phase 6-8 structure

---

## 📊 Current State Analysis

### ✅ What We Have Now

**`.ai/` folder (5 protected files):**
- ✅ `code-style.md` - Code style reference
- ✅ `design-system.md` - Design system reference
- ✅ `npm-publishing-checklist.md` - Publishing checklist
- ✅ `project-overview.md` - Project overview
- ✅ `Testing-philosophy.md` - Testing philosophy

**`.aicf/` folder (Phase 6-8 structure):**
- ✅ `config.json` - Configuration file
- ✅ `recent/` - Recent conversations (0-2 days)
- ✅ `sessions/` - Session files (consolidated by date)
- ✅ `medium/` - Medium-term memory (2-7 days)
- ✅ `old/` - Old memory (7-14 days)
- ✅ `archive/` - Archive (14+ days)

**Templates:**
- ✅ `templates/ai/` - 6 files (README.md + 5 protected files)
- ✅ `templates/aicf/` - 1 file (README.md)
- ✅ `templates/ai-instructions.md` - AI instructions
- ✅ `templates/NEW_CHAT_PROMPT.md` - New chat prompt

---

## ❌ Problems Identified

### Problem 1: Missing `.aicf/README.md` in Init/Migrate

**Issue:** Init and Migrate commands copy `templates/aicf/README.md` but it needs updating for Phase 6-8 structure.

**Current template:** Unknown (need to check)

**Should contain:**
- Explanation of Phase 6-8 architecture
- Folder structure (recent, sessions, medium, old, archive)
- How memory dropoff works (2/7/14 day windows)
- AICF format explanation

### Problem 2: Init Command Doesn't Create Dropoff Folders

**Issue:** InitCommand creates `.aicf/` but doesn't create subdirectories:
- `.aicf/recent/`
- `.aicf/sessions/`
- `.aicf/medium/`
- `.aicf/old/`
- `.aicf/archive/`

**Fix:** Add folder creation to `initAutomaticMode()` and `initManualMode()`

### Problem 3: Migrate Command Doesn't Handle Legacy Data

**Issue:** When users migrate from v2.0.1 to v3.x, they have existing `.aicf/` files that don't match Phase 6-8 structure.

**Current behavior:** Migrate preserves `.aicf/` and `.ai/` but doesn't move old files.

**Proposed solution:**
1. Detect old structure (files directly in `.aicf/`)
2. Create `legacy_memory/` folder
3. Move old files to `legacy_memory/`
4. Create new Phase 6-8 structure
5. Re-extract from library data (fresh start)

**Rationale:**
- Preserves user's existing memory files
- Avoids data loss
- Clean slate for Phase 6-8 architecture
- Users can reference legacy files if needed

### Problem 4: Missing `.aicf/config.json` in Init

**Issue:** Init command doesn't create `.aicf/config.json`

**Current state:** We have `config.json` in this project but it's not in templates.

**Fix:** 
1. Add `config.json` to `templates/aicf/`
2. Update Init to copy it

---

## 🎯 Required Changes

### Change 1: Update `templates/aicf/README.md`

**Action:** Create comprehensive README explaining Phase 6-8 architecture

**Content:**
- Phase 6: Cache-First Architecture
- Phase 6.5: Session Consolidation
- Phase 7: Memory Dropoff Strategy
- Folder structure explanation
- AICF format reference

### Change 2: Add `templates/aicf/config.json`

**Action:** Copy current `config.json` to templates

**Content:**
```json
{
  "checkpointFrequency": "every_response",
  "defaultModel": "claude-sonnet-4-20250514",
  "qualityCheck": {
    "minTokens": 500,
    "maxTokens": 1400,
    "minKeyTermPreservation": 0.6
  },
  "costEstimates": {
    "perCheckpoint": 0,
    "monthly": 0,
    "annual": 0,
    "note": "Zero cost! Logic agents run locally without API calls."
  }
}
```

### Change 3: Update InitCommand to Create Dropoff Folders

**File:** `src/commands/InitCommand.ts`

**Location:** `initAutomaticMode()` and `initManualMode()` methods

**Add after creating `.aicf/` directory:**
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
```

### Change 4: Update MigrateCommand to Handle Legacy Data

**File:** `src/commands/MigrateCommand.ts`

**Add new method:**
```typescript
private async migrateLegacyData(): Promise<void> {
  const aicfDir = join(this.cwd, '.aicf');
  const legacyDir = join(this.cwd, 'legacy_memory');
  
  // Check if .aicf/ has files directly in it (old structure)
  const files = readdirSync(aicfDir).filter(f => {
    const fullPath = join(aicfDir, f);
    return !statSync(fullPath).isDirectory() && f !== '.permissions.aicf' && f !== '.watcher-config.json';
  });
  
  if (files.length > 0) {
    // Create legacy_memory folder
    mkdirSync(legacyDir, { recursive: true });
    
    // Move old files
    for (const file of files) {
      const srcPath = join(aicfDir, file);
      const destPath = join(legacyDir, file);
      renameSync(srcPath, destPath);
    }
    
    console.log(chalk.yellow(`📦 Moved ${files.length} legacy files to legacy_memory/`));
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
}
```

**Call in `execute()` method:**
```typescript
// After creating .cache/llm directory
await this.migrateLegacyData();
```

---

## 📋 Implementation Checklist

### Step 1: Update Templates
- [ ] Create comprehensive `templates/aicf/README.md`
- [ ] Add `templates/aicf/config.json`

### Step 2: Update InitCommand
- [ ] Add dropoff folder creation to `initAutomaticMode()`
- [ ] Add dropoff folder creation to `initManualMode()`
- [ ] Test with `npm test`

### Step 3: Update MigrateCommand
- [ ] Add `migrateLegacyData()` method
- [ ] Call method in `execute()`
- [ ] Add user messaging about legacy data
- [ ] Test with `npm test`

### Step 4: Update .gitignore
- [ ] Ensure `legacy_memory/` is NOT ignored (users should commit it)
- [ ] Ensure `.aicf/recent/`, `.aicf/sessions/`, etc. ARE ignored

### Step 5: Documentation
- [ ] Update README.md with migration instructions
- [ ] Update CLI-COMMANDS.md with new behavior
- [ ] Add migration guide for v2 → v3 users

---

## 🚀 Migration Strategy for Users

### Scenario 1: New User (No Existing Data)

**Command:** `aice init --automatic`

**Result:**
- Creates `.ai/` with 5 protected files
- Creates `.aicf/` with Phase 6-8 structure
- Creates `.cache/llm/`
- Creates `.permissions.aicf`
- Creates `.watcher-config.json`
- Ready to run `aice watch`

### Scenario 2: Existing v2.0.1 User (Has `.ai/` and `.aicf/`)

**Command:** `aice migrate`

**Result:**
1. Detects existing `.aicf/` files
2. Creates `legacy_memory/` folder
3. Moves old `.aicf/` files to `legacy_memory/`
4. Creates new Phase 6-8 structure in `.aicf/`
5. Preserves `.ai/` files (no changes)
6. Creates `.cache/llm/`
7. Creates `.permissions.aicf`
8. Creates `.watcher-config.json`
9. User runs `aice watch` to re-extract from library data

**User sees:**
```
✅ Migration to Automatic Mode Complete

📦 Moved 15 legacy files to legacy_memory/
   - Your old memory files are preserved
   - New Phase 6-8 structure created
   - Run 'aice watch' to re-extract from library data

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
```

---

## ✅ Success Criteria

After implementing these changes:

1. ✅ `aice init` creates complete Phase 6-8 structure
2. ✅ `aice migrate` preserves legacy data in `legacy_memory/`
3. ✅ Users can reference old files if needed
4. ✅ Fresh extraction from library data ensures clean Phase 6-8 data
5. ✅ All 548 tests still passing
6. ✅ No data loss for existing users

