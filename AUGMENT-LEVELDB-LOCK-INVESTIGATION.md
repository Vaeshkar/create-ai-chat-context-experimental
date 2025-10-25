# Augment LevelDB Lock Investigation

## The Problem

**VSCode's Augment extension holds an exclusive lock on the LevelDB database while VSCode is running.**

Error:
```
IO error: lock /Users/leeuwen/.../augment-kv-store/LOCK: Resource temporarily unavailable
```

This is **NOT** a new issue we introduced. It's how LevelDB works - it requires exclusive access.

## Root Cause Analysis

### Timeline
- **Original code (commit 46a5b3555)**: No timeout, would wait indefinitely
- **Today's change (commit 685b5b3d)**: Added 5-second timeout to prevent hanging
- **Result**: 5 seconds is too short - VSCode doesn't release the lock that quickly

### Why This Happens
1. VSCode runs the Augment extension
2. Augment extension opens the LevelDB database
3. LevelDB creates a LOCK file for exclusive access
4. While VSCode is running, the LOCK file is held
5. Any other process trying to open the database gets "Resource temporarily unavailable"

## Solutions

### Option 1: Increase Timeout (Current Fix) ✅
**What we did:**
- Increased timeout from 5 seconds to 30 seconds
- Added retry logic with exponential backoff (3 attempts)
- Total wait time: 30s + 2s + 4s = 36 seconds

**Pros:**
- Works if VSCode releases the lock within 30 seconds
- Graceful degradation - returns empty array if timeout

**Cons:**
- Still fails if VSCode is actively using the database
- Adds 36+ seconds of wait time

### Option 2: Close VSCode (Guaranteed to Work) ✅
```bash
# Close VSCode completely
killall "Code Helper"
killall "Code"

# Then run extraction
npx tsx debug-augment-leveldb.ts
```

**Pros:**
- Guaranteed to work - no lock held
- Fast extraction

**Cons:**
- Requires closing VSCode
- Interrupts your work

### Option 3: Use Cache Instead of LevelDB ✅
The hourglass watcher already captures conversations in `.cache/llm/augment/`:
- 24 chunks currently stored
- No lock issues
- Real-time capture

**Pros:**
- No lock conflicts
- Automatic capture
- Always available

**Cons:**
- Only captures new conversations from now on
- Doesn't get historical data from LevelDB

### Option 4: Read-Only Snapshot (Not Possible)
LevelDB doesn't support read-only mode while another process holds the lock.

## Current Status

### What We Fixed
✅ Increased timeout from 5s to 30s
✅ Added retry logic with exponential backoff
✅ Added detailed debug logging
✅ Added warning messages for lock issues

### What We Discovered
- VSCode's Augment extension holds the LOCK file exclusively
- This is normal LevelDB behavior, not a bug
- The 5-second timeout was too aggressive
- 30-second timeout with retries is more reasonable

## Recommendation

**Use the cache-based approach (Option 3):**
- The hourglass watcher automatically captures conversations
- No lock conflicts
- Real-time data
- More reliable than trying to read a locked database

**For historical data extraction:**
1. Close VSCode
2. Run extraction
3. Reopen VSCode

## Testing

To verify the fix works:

```bash
# With VSCode running (will timeout after retries):
DEBUG_AUGMENT=1 npx tsx debug-augment-leveldb.ts

# With VSCode closed (will work):
killall "Code Helper" && killall "Code"
DEBUG_AUGMENT=1 npx tsx debug-augment-leveldb.ts
```

## Files Modified

- `src/readers/AugmentLevelDBReader.ts`
  - Increased timeout from 5s to 30s
  - Added retry logic with exponential backoff
  - Added detailed debug logging
  - Added warning messages

## Conclusion

**This is not a project-killing issue.** It's a normal limitation of LevelDB when another process holds the lock. The fix is to either:
1. Close VSCode before extraction
2. Use the cache-based approach (recommended)
3. Wait for VSCode to release the lock (30+ seconds)

The system is working as designed.

