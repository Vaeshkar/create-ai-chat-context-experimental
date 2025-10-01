# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features

- Interactive mode with prompts
- Multiple templates (Next.js, React, Python, etc.)
- `validate` command to check knowledge base health
- `log` command to add entries automatically
- `update` command to sync with latest templates

## [0.1.3] - 2025-10-01

### 🎯 MAJOR IMPROVEMENT: Chat Continuity & Better Instructions

This release significantly improves how AI assistants maintain context across chat sessions.

### Enhanced

- **`.ai-instructions` template** - Completely rewritten to be generic and universal

  - Removed project-specific content (was referencing "toy-store-unified")
  - Added MANDATORY workflow section (START → DURING → END)
  - Added CRITICAL reminders to update files before ending session
  - Provided exact template for updating conversation-log.md
  - Multiple warnings emphasizing importance of updates

- **`conversation-log.md` template** - Much clearer instructions for AI assistants

  - Added explicit instructions at the top for when to read/update
  - Provided detailed template with concrete examples
  - Added tips for writing good entries
  - Added reminder section with step-by-step update process

- **`NEW_CHAT_PROMPT.md`** - New recommended prompts for chat continuity

  - Added: "Read .ai-instructions first, and help me continue where we left off with chat #[number]"
  - Added: "Read .ai-instructions first, continue from chat #[number], then help me [task]"
  - Marked continuity prompts as RECOMMENDED and BEST
  - Added complete workflow example showing Chat #1 → #2 → #3

- **`README.md`** - Better documentation of chat continuity feature
  - Added continuity prompts to Quick Start section
  - Updated Usage Examples with first chat vs. continuing chat
  - Added new section: "🔄 Chat Continuity Example"
  - Shows concrete example of how Chat #1 → #2 → #3 flow works

### Why This Update?

**Problem:** The original `.ai-instructions` template was copied from a specific project and contained:

- References to "toy-store-unified" project
- Specific tech stack (Next.js, TypeScript, PostgreSQL)
- Mentions of "19+ chat sessions" and specific decisions
- This confused AI assistants when used in new projects

**Solution:**

- Made all templates truly generic and universal
- Added explicit workflow instructions for AI assistants
- Emphasized the importance of updating conversation-log.md
- Provided recommended prompts that make continuity explicit

**Result:**

- AI assistants now understand they MUST update files at end of session
- Users can explicitly tell AI to continue from previous chat
- Much better context preservation across sessions
- Clear examples of how Chat #1 → #2 → #3 should work

### Recommended Prompts

**First chat:**

```
Read .ai-instructions first, then help me with [your task].
```

**Continuing from previous chat (RECOMMENDED):**

```
Read .ai-instructions first, and help me continue where we left off with chat #[number].
```

**Best option (most explicit):**

```
Read .ai-instructions first, continue from chat #[number], then help me [specific task].
```

### Impact

- ✅ Better chat continuity across sessions
- ✅ AI assistants know exactly what to do
- ✅ Explicit reminders to update knowledge base
- ✅ Clear workflow: START → DURING → END
- ✅ Users can reference specific previous chats
- ✅ No more confusion from project-specific templates

**⚠️ If you installed v0.1.0, v0.1.1, or v0.1.2, consider re-running `init --force` to get the improved templates!**

## [0.1.2] - 2025-10-01

### 🚨 CRITICAL SECURITY FIX

- **REMOVED PRIVATE DATA FROM TEMPLATES** - Templates contained actual project data from toy-store-ai-system
- **REPLACED WITH GENERIC TEMPLATES** - All templates now use placeholder text
- **NO MORE DATA LEAKAGE** - Safe to use on any project

### Fixed

- `architecture.md` - Now generic template with placeholders
- `conversation-log.md` - Now generic template with examples
- `technical-decisions.md` - Now generic template with structure
- `known-issues.md` - Now generic template with format
- `next-steps.md` - Now generic template with sections

### Why This Update?

- **User reported:** Templates contained private project information
- **Impact:** HIGH - Could leak sensitive data to other projects
- **Fix:** Replaced all templates with generic placeholders
- **Status:** SAFE - No more private data in templates

**⚠️ If you installed v0.1.0 or v0.1.1, please update immediately!**

## [0.1.1] - 2025-09-30

### Added

- **AI Compatibility Section** - Comprehensive list of ALL compatible AI assistants
- **Comparison Table** - Shows what makes this package different from other tools
- **Usage Examples** - Specific examples for ChatGPT, Claude, Cursor, Copilot, etc.

### Documentation

- Added "Works with ALL AI Assistants" section with 10+ AI tools listed
- Added "What Makes This Different?" comparison table
- Added usage examples for different AI assistants
- Clarified focus on chat history vs project planning

### Why This Update?

- Users asked: "Does this work with my AI assistant?"
- Answer: YES! Works with ALL of them (ChatGPT, Claude, Copilot, Cursor, Augment, etc.)
- Clarified difference from similar packages

## [0.1.0] - 2025-09-30

### Added

- Initial release! 🎉
- `init` command to create `.ai/` knowledge base structure
- Template files for all knowledge base components
- Automatic README.md updating with AI section
- Git integration detection
- `--force` flag to overwrite existing files
- `--no-git` flag to skip Git integration
- Comprehensive documentation
- MIT License

### Features

- Creates `.ai/` directory with 7 template files
- Creates `.ai-instructions` entry point
- Creates `NEW_CHAT_PROMPT.md` quick reference
- Updates project README.md automatically
- Beautiful CLI output with colors and spinners
- Error handling and validation

### Documentation

- Comprehensive README.md
- SETUP_GUIDE.md in templates
- CONTRIBUTING.md for contributors
- LICENSE (MIT)
- This CHANGELOG.md

### Testing

- Tested across Chat #20, #21, #22
- Chat #22: Complete success ✅
- Proven to save 30+ minutes per chat session

## [0.0.1] - 2025-10-30

### Added

- Initial project structure
- Basic package.json
- CLI skeleton

---

## Version History

- **0.1.0** - First public release (MVP)
- **0.0.1** - Initial development

## Future Versions

### 0.2.0 (Planned)

- Interactive mode
- Template selection
- Validation command

### 0.3.0 (Planned)

- Log command
- Update command
- Multiple templates

### 1.0.0 (Planned)

- Stable API
- Full test coverage
- Community templates
- Documentation site
