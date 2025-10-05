# AICF (AI Context Format) v3.0 Specification

## Overview
AICF is a token-optimized, semantically structured format designed for AI conversation memory preservation with >90% compression while maintaining full semantic accessibility.

## Format Structure

### Line-Numbered Index System
```
{line_number}|{content}
```

### Semantic Block Types
- `@CONVERSATION` - Conversation metadata and boundaries
- `@STATE` - Session state and progress tracking  
- `@INSIGHTS` - Extracted insights with priority levels
- `@DECISIONS` - Decision records with impact assessment
- `@WORK` - Work context and action tracking
- `@NEXT_STEPS` - Planned actions with step breakdown
- `@FLOW` - User interaction flow patterns

### Key-Value Structure
Within blocks, use: `key=value` format for maximum parsability

### Timestamp Format
ISO 8601: `2025-10-04T10:36:47.342Z`

### Token Optimization Rules
1. Use pipe delimiter (|) for line separation
2. Use semantic tags for instant content classification
3. Compress repetitive data into structured blocks
4. Maintain chronological ordering for temporal queries

## File Organization

### Core Files
- `index.aicf` - Master index and project metadata
- `conversations.aicf` - Conversation logs and chunks
- `decisions.aicf` - Decision records with impact tracking
- `technical-context.aicf` - Technical architecture and patterns
- `work-state.aicf` - Active work tracking and next steps

### Access Patterns
- O(1) file access by content type
- Binary search within files using line numbers
- Semantic filtering using block tags