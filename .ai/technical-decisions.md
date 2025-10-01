# Technical Decisions

Document WHY you made specific technical choices.

---

## Per-Project Configuration Storage

**Date:** 2025-10-01
**Status:** ✅ Implemented (v0.7.0)

### Decision

Store configuration in `.ai/config.json` (per-project) instead of global config in `~/.aic/config.json`.

### Rationale

- Different projects may use different AI models
- Configuration should be part of the project's knowledge base
- Allows team members to share configuration via Git
- Keeps all AI-related settings in one place (`.ai/` directory)

### Alternatives Considered

- **Global config in `~/.aic/config.json`:** Would apply to all projects, but doesn't allow per-project customization
- **Environment variables:** Less user-friendly, harder to discover and manage
- **Command-line flags:** Would require passing flags every time, not persistent

### Trade-offs

**Pros:**

- Per-project flexibility (different models for different projects)
- Configuration is version-controlled with the project
- Team members can share preferred settings
- All AI context in one place (`.ai/` directory)

**Cons:**

- Need to configure each project separately
- Configuration not shared across projects (but this is actually a feature)

### Impact

- Users can set different preferred models for different projects
- Configuration is stored in `.ai/config.json` alongside knowledge base
- Teams can commit configuration to Git for consistency

---

## Simplified Token Report (Show 4 Models by Default)

**Date:** 2025-10-01
**Status:** ✅ Implemented (v0.7.0)

### Decision

Show only 4 AI models by default in token reports (preferred model + top 3 popular), with `--all` flag to show all 16.

### Rationale

- Showing 16 models was overwhelming for most users
- Most users only care about 1-2 models they actually use
- Cleaner output improves user experience
- Power users can still see all models with `--all` flag

### Alternatives Considered

- **Show all 16 models always:** Too overwhelming, cluttered output
- **Show only 1 model (preferred):** Too limited, users want to compare a few options
- **Make it configurable (showAllModels setting):** Added this as well for flexibility

### Trade-offs

**Pros:**

- Cleaner, less overwhelming output
- Focuses on what users actually need
- Still accessible via `--all` flag
- Adapts to user's preferred model

**Cons:**

- Users need to know about `--all` flag to see all models
- Might miss discovering other models

### Impact

- Default `npx aic tokens` shows 4 models
- Preferred model always included and marked with ⭐
- Hint message tells users about `--all` flag
- Much better user experience

---

## Star (⭐) for Preferred Model

**Date:** 2025-10-01
**Status:** ✅ Implemented (v0.7.0)

### Decision

Mark preferred model with ⭐ star prefix in token reports.

### Rationale

- Visual indicator makes it easy to spot your model
- Works in all terminals (unlike color highlighting)
- Simple and universally understood symbol
- Doesn't interfere with existing formatting

### Alternatives Considered

- **Color highlighting:** Doesn't work well in all terminals, less accessible
- **Bold text:** Less visually distinct
- **Arrow (→):** Less intuitive than star
- **Checkmark (✓):** Could be confused with "completed" status

### Trade-offs

**Pros:**

- Clear visual indicator
- Works in all terminals
- Universally understood
- Simple to implement

**Cons:**

- Adds one extra character to line length
- None really - this was a clear win

### Impact

- Users can immediately spot their preferred model
- Makes token reports more personalized
- Improves user experience

---

## Conversation Entry Counting Regex

**Date:** 2025-10-01
**Status:** ✅ Implemented (v0.6.5)

### Decision

Changed regex from `/^## Chat #\d+/gm` to `/^##.*Chat\s*#?\d+/gim` for counting conversation entries.

### Rationale

- Original regex only matched "Chat #" at start of line
- Users have different formats: `## 2025-09-30 - Chat #19: Topic`
- Need to support multiple conversation log formats
- More flexible regex supports all common formats

### Alternatives Considered

- **Strict format enforcement:** Would require users to change their existing logs
- **Multiple regex patterns:** More complex, harder to maintain
- **Parse markdown AST:** Overkill for this simple task

### Trade-offs

**Pros:**

- Works with all common conversation log formats
- No breaking changes for existing users
- More flexible and forgiving

**Cons:**

- Slightly more complex regex
- Could match false positives (but unlikely in practice)

### Impact

- Stats command now correctly counts conversation entries
- Works with date-first format: `## 2025-09-30 - Chat #19`
- Works with original format: `## Chat #19`
- Works with format without #: `## Chat 19`

---

## Comprehensive Documentation Files

**Date:** 2025-10-01
**Status:** ✅ Implemented (v0.8.0)

### Decision

Create separate COMMANDS.md and CONFIGURATION.md files instead of putting everything in README.

### Rationale

- README was getting too long and overwhelming
- Users need detailed reference documentation
- Separate files allow deep-dive without cluttering README
- Better organization and discoverability

### Alternatives Considered

- **Put everything in README:** Would be 2000+ lines, overwhelming
- **Wiki pages:** Requires separate maintenance, not in repo
- **Separate docs/ directory:** Less discoverable than root-level files
- **Online documentation site:** More overhead, not version-controlled with code

### Trade-offs

**Pros:**

- Clear separation of concerns (overview vs reference)
- README stays concise and approachable
- Detailed docs available when needed
- All documentation version-controlled with code
- Easy to link to specific sections

**Cons:**

- More files to maintain
- Users need to know about these files (solved with links in README)

### Impact

- README.md: Quick start and overview (150 lines)
- COMMANDS.md: Complete command reference (600+ lines)
- CONFIGURATION.md: Detailed configuration guide (350+ lines)
- Total: 950+ lines of professional documentation
- Much better user experience

---

## Worked on new features, bug fixes, documentation

**Date:** 2025-10-01
**Status:** ✅ Implemented

### Decision

- feat: v0.9.0 - chat-finish command with dev handle tracking
- feat: v0.9.0 - chat-finish command with dev handle tracking

### Impact

- Worked on new features, bug fixes, documentation

---


## Worked on new features, bug fixes, documentation

**Date:** 2025-10-01
**Status:** ✅ Implemented

### Decision

- feat: v0.10.0 - 100% automatic chat-finish with git analysis
- feat: v0.9.0 - chat-finish command with dev handle tracking
- feat: v0.9.0 - chat-finish command with dev handle tracking

### Impact

- Worked on new features, bug fixes, documentation

---


## V0.10.0 - 100% automatic chat-finish with git analysis

**Date:** 2025-10-01
**Status:** ✅ Implemented
**Chat:** #7

### Decision

- v0.10.0 - 100% automatic chat-finish with git analysis
- v0.9.0 - chat-finish command with dev handle tracking
- v0.9.0 - chat-finish command with dev handle tracking

### Impact

Implemented during Chat #7. 

---


## Template for New Decisions

```markdown
## [Decision Name]

**Date:** [Date]
**Status:** [Status]

### Decision

[What you decided]

### Rationale

[Why]

### Alternatives Considered

- **[Alternative]:** [Why not]

### Trade-offs

**Pros:**

- [Pro]

**Cons:**

- [Con]

### Impact

- [Impact]
```

---

**Last Updated:** 2025-10-01
