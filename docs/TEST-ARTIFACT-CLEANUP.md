# Test Artifact Cleanup

## Problem

Test artifacts (temporary directories and files) were being created in the project root directory during test runs and not being cleaned up properly. This resulted in:

- 100+ test directories cluttering the project root (`.test-init-command-*`, `.test-migrate-*`, `.test-phase4-*`, etc.)
- Test log files (`.watcher.log`, `augment-import.log`, etc.)
- Confusion about which files should be committed to version control

## Solution

Implemented a comprehensive test artifact cleanup system with three components:

### 1. Global Teardown (`vitest.global-setup.ts`)

The global teardown runs after all tests complete and:

- Cleans up the centralized `.test-output/` directory
- Removes any legacy test artifacts from the project root (`.test-*` directories and files)
- Provides detailed logging of cleanup operations

### 2. Test Setup (`vitest.setup.ts`)

Creates a centralized test output directory (`.test-output/`) that can be used by tests to store artifacts in a single location.

### 3. Test Helpers (`src/test-utils/test-helpers.ts`)

Provides utility functions for tests to create and manage temporary directories:

- `getTestOutputDir()` - Get the centralized test output directory path
- `createTestDir(prefix)` - Create a temporary test directory
- `cleanupTestDir(testDir)` - Clean up a test directory with retry logic
- `TestDirManager` - Class for managing multiple test directories with automatic cleanup

### 4. Updated `.gitignore`

Added patterns to exclude test artifacts:

```gitignore
# Testing
coverage/
*.log
.test-output/
.test-*/
```

## Current Behavior

### Test Execution

1. Tests run and create temporary directories in the OS temp folder (`/var/folders/.../T` on macOS)
2. Each test cleans up its own directories in `afterEach` hooks
3. If cleanup fails (e.g., due to file locks or test interruption), directories remain

### Global Cleanup

After all tests complete, the global teardown:

1. Removes the `.test-output/` directory (if it exists)
2. Scans the project root for any leftover test artifacts
3. Removes all artifacts matching these patterns:
   - Directories starting with `.test-`
   - Files: `.watcher.log`, `augment-import.log`, `NEW_CHAT_PROMPT.md`
   - Directories starting with `TEST-`

### Result

- Project root stays clean after test runs
- All test artifacts are automatically cleaned up
- No manual cleanup required
- Clear separation between test artifacts and project files

## Migration Path (Optional)

Tests can optionally be migrated to use the centralized test output directory:

### Before (using OS temp directory)

```typescript
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const testDir = mkdtempSync(join(tmpdir(), 'test-mytest-'));
// ... test code ...
rmSync(testDir, { recursive: true, force: true });
```

### After (using centralized test output)

```typescript
import { createTestDir, cleanupTestDir } from '../test-utils/test-helpers.js';

const testDir = createTestDir('test-mytest-');
// ... test code ...
cleanupTestDir(testDir);
```

### Or with TestDirManager

```typescript
import { TestDirManager } from '../test-utils/test-helpers.js';

const manager = new TestDirManager();

beforeEach(() => {
  testDir = manager.create('test-mytest-');
});

afterEach(() => {
  manager.cleanupAll();
});
```

## Benefits

1. **Clean Project Root** - No test artifacts cluttering the repository
2. **Automatic Cleanup** - Global teardown ensures cleanup even if tests fail
3. **Better Organization** - All test artifacts in one place (when using centralized approach)
4. **Easier Debugging** - Clear separation between test artifacts and project files
5. **Version Control** - `.gitignore` properly excludes all test artifacts

## Verification

To verify the cleanup is working:

```bash
# Run tests
npm test

# Check for test artifacts in project root
ls -la | grep "\.test-"

# Should return no results (or only vitest config files)
```

## Notes

- The current implementation uses the OS temp directory (`tmpdir()`) for test artifacts, which is the standard approach
- The global teardown cleans up any artifacts that end up in the project root (from failed cleanups or interrupted tests)
- Tests can optionally migrate to use the centralized `.test-output/` directory for better organization
- The cleanup is backward compatible - it handles both old and new test artifact patterns

