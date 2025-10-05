# Session Dump Instructions

## Consistent Session Dumping

The inconsistent automatic session detection has been disabled. Use these methods instead:

### Manual Session Dumps
Create session dumps when needed:
```bash
# Quick checkpoint dump
node src/session-dump-trigger.js quick "reason for dump" NORMAL

# Examples:
node src/session-dump-trigger.js quick "completed testing" NORMAL
node src/session-dump-trigger.js quick "major architectural change" CRITICAL_ARCHITECTURAL_BREAKTHROUGH
node src/session-dump-trigger.js quick "debugging session" NORMAL
```

### Significance Levels
- `NORMAL`: Regular work sessions
- `SYSTEM_VALIDATION`: Testing and validation
- `CRITICAL_ARCHITECTURAL_BREAKTHROUGH`: Major system changes
- `CHECKPOINT`: Simple checkpoints

### Files Created
- Session dump JSON in `.meta/session-dumps/`
- Automatic processing updates `.aicf/` files
- Human-readable updates in `.ai/` files

### Benefits
- ✅ Predictable session boundaries
- ✅ No unexpected session dumps  
- ✅ Complete control over when dumps are created
- ✅ Consistent 3-tier system processing
- ✅ Better debugging and troubleshooting

The 3-tier memory system continues to work perfectly - just with explicit rather than automatic triggering.
