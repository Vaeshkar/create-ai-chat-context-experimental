# AICF 2.0 Specification
## AI Context Format - Universal AI Memory Protocol

**Version:** 2.0.0  
**Status:** Draft  
**Created:** 2025-10-01  
**Purpose:** Enable seamless AI context continuity across infinite chat sessions

---

## 1. Core Principles

1. **Zero Ambiguity** - Every byte has exactly one meaning
2. **Instant Parsing** - O(1) lookup via index
3. **Hierarchical** - Supports nested structures
4. **Temporal** - Tracks evolution over time
5. **Concurrent** - Multiple AIs can read simultaneously
6. **Lossless** - Can reconstruct full context
7. **Extensible** - New types without breaking parsers

---

## 2. Directory Structure

```
.aicf/
├── index.aicf              # Fast lookup index (REQUIRED)
├── conversations.aicf      # All chat history
├── decisions.aicf          # All decisions made
├── tasks.aicf              # All tasks (TODO/DONE)
├── issues.aicf             # Known issues
├── architecture.aicf       # System structure
├── knowledge.aicf          # General project facts
└── .meta                   # Project metadata (JSON)
```

**Optional:**
```
.aicf/
└── docs/                   # Human-readable exports (optional)
    ├── README.md
    └── ARCHITECTURE.md
```

---

## 3. File Format: index.aicf

**Purpose:** Instant context overview without parsing all files

```
@AICF_VERSION
2.0.0

@PROJECT
name=create-ai-chat-context
version=0.12.0
language=javascript
repo=github.com/Vaeshkar/create-ai-chat-context
last_update=20251001T230000Z

@COUNTS
conversations=12
decisions=8
tasks=45
issues=3
components=6

@STATE
status=active_development
phase=implementing_aicf_format
last_chat=12
last_commit=abc123f

@CONTEXT
We're building an npm CLI tool to preserve AI chat context across sessions.
Just released v0.12.0 with AICF format achieving 85% token reduction.
Currently implementing --all-files converter for entire knowledge base.
Goal: Connect all chats so new sessions have instant context continuity.

@CURRENT_WORK
task=Design and implement AICF 2.0 specification
priority=HIGH
started=20251001T220000Z
blockers=none

@RECENT_ACTIVITY
20251001T230000Z|COMMIT|feat: Add AICF format
20251001T220000Z|DECISION|Use AICF for all knowledge base files
20251001T210000Z|TASK_COMPLETE|Publish v0.12.0 to npm
```

---

## 4. File Format: conversations.aicf

**Purpose:** Ultra-compact chat history

**Format:** `C#|YYYYMMDDTHHMMSSZ|TYPE|TOPIC|WHAT|WHY|OUTCOME|FILES`

**Type Codes:**
- R=Release, F=Feature, X=Fix, D=Docs, W=Work, M=Refactor, T=Test

**Outcome Codes:**
- S=Shipped, D=Decided, R=Resolved, P=InProgress, B=Blocked, C=Cancelled

**Example:**
```
@CONVERSATIONS
@SCHEMA
C#|TIMESTAMP|TYPE|TOPIC|WHAT|WHY|OUTCOME|FILES

@DATA
12|20251001T230000Z|F|AICF 2.0 design|Designing universal AI context format|Connect chats seamlessly|P|AICF-SPEC.md
11|20251001T220000Z|F|AICF converter|Added --all-files option|Convert entire knowledge base|S|src/aicf-all-files.js,bin/cli.js
10|20251001T210000Z|R|v0.12.0 release|Published AICF format to npm|85% token reduction|S|package.json,README.md
9|20251001T200000Z|M|Format improvements|Fixed chat-finish formatting|Always update next-steps|S|src/chat-finish.js
8|20251001T190000Z|X|Prefix cleanup|Cleaned up commit prefixes|Consistent formatting|S|src/chat-finish.js

@LINKS
C:12->D:8|C:11->D:7|C:10->T:45
```

---

## 5. File Format: decisions.aicf

**Purpose:** All architectural and technical decisions

**Format:** `D#|TIMESTAMP|TITLE|DECISION|RATIONALE|IMPACT|STATUS`

**Status Codes:**
- ACTIVE, SUPERSEDED, DEPRECATED, CANCELLED

**Example:**
```
@DECISIONS
@SCHEMA
D#|TIMESTAMP|TITLE|DECISION|RATIONALE|IMPACT|STATUS

@DATA
8|20251001T220000Z|AICF directory name|Use .aicf/ not .ai/|More universal, self-documenting|Breaking change, migration needed|ACTIVE
7|20251001T210000Z|All files to AICF|Convert entire knowledge base|Maximum token efficiency|85-90% token reduction|ACTIVE
6|20251001T200000Z|Config location|Store in .aicf/.meta|Keep all AI context together|Cleaner structure|ACTIVE
5|20251001T150000Z|Token report default|Show 4 models not 16|Less overwhelming for users|Better UX|ACTIVE
4|20251001T140000Z|Preferred model star|Highlight with ⭐|Visual indicator|Easier to find|ACTIVE

@LINKS
D:8->D:7|D:7->C:11|D:6->D:7
```

---

## 6. File Format: tasks.aicf

**Purpose:** All tasks (TODO/DONE/BLOCKED)

**Format:** `T#|PRIORITY|EFFORT|STATUS|TASK|DEPENDENCIES|ASSIGNED|CREATED|COMPLETED`

**Priority:** H=High, M=Medium, L=Low  
**Effort:** S=Small, M=Medium, L=Large  
**Status:** TODO, DOING, DONE, BLOCKED, CANCELLED

**Example:**
```
@TASKS
@SCHEMA
T#|PRIORITY|EFFORT|STATUS|TASK|DEPENDENCIES|ASSIGNED|CREATED|COMPLETED

@DATA
45|H|L|DOING|Design AICF 2.0 specification|T:44|@vaeshkar|20251001T220000Z|
44|H|M|DONE|Implement --all-files converter|T:43|@vaeshkar|20251001T210000Z|20251001T220000Z
43|H|M|DONE|Add AICF format to conversation-log|T:42|@vaeshkar|20251001T200000Z|20251001T210000Z
42|H|S|DONE|Publish v0.12.0 to npm|T:41|@vaeshkar|20251001T190000Z|20251001T200000Z
41|M|S|DONE|Test v0.10.0 in real projects||@vaeshkar|20251001T180000Z|20251001T190000Z

@LINKS
T:45->D:8|T:44->D:7|T:43->C:10
```

---

## 7. File Format: issues.aicf

**Purpose:** Known issues and limitations

**Format:** `I#|TIMESTAMP|SEVERITY|TITLE|ISSUE|IMPACT|WORKAROUND|STATUS`

**Severity:** CRITICAL, HIGH, MEDIUM, LOW  
**Status:** OPEN, INVESTIGATING, WORKAROUND, FIXED, WONTFIX

**Example:**
```
@ISSUES
@SCHEMA
I#|TIMESTAMP|SEVERITY|TITLE|ISSUE|IMPACT|WORKAROUND|STATUS

@DATA
3|20251001T220000Z|MEDIUM|Architecture parser incomplete|Parser doesn't handle nested sections|Some info lost in conversion|Manual review after conversion|OPEN
2|20251001T150000Z|LOW|Token estimates approximate|Word count * 1.33 not exact|±10% accuracy|Use --all flag for comparison|WORKAROUND
1|20251001T140000Z|LOW|Config validation missing|No validation for config values|Could set invalid values|Manual validation|OPEN

@LINKS
I:3->T:46|I:2->D:5
```

---

## 8. File Format: architecture.aicf

**Purpose:** System structure and components

**Format:** `A#|NAME|TYPE|PURPOSE|LOCATION|DEPENDENCIES|INTERFACES|STATUS`

**Type:** MODULE, COMPONENT, SERVICE, FUNCTION, CLASS, FILE  
**Status:** ACTIVE, DEPRECATED, PLANNED

**Example:**
```
@ARCHITECTURE
@SCHEMA
A#|NAME|TYPE|PURPOSE|LOCATION|DEPENDENCIES|INTERFACES|STATUS

@DATA
6|AICF System|MODULE|Universal AI context format|.aicf/|none|all|ACTIVE
5|Convert Command|COMPONENT|Format conversion|src/convert.js|fs-extra,chalk|CLI|ACTIVE
4|Config System|COMPONENT|User preferences|src/config.js|fs-extra|CLI,tokens,chat-finish|ACTIVE
3|Token Analysis|COMPONENT|Calculate token usage|src/tokens.js|fs-extra|CLI,stats|ACTIVE
2|Chat Finish|COMPONENT|Auto-update knowledge base|src/chat-finish.js|fs-extra,chalk,simple-git|CLI|ACTIVE
1|CLI System|COMPONENT|Command routing|bin/cli.js|commander,chalk|all|ACTIVE

@HIERARCHY
A:6[A:5,A:4,A:3,A:2]|A:1[A:5,A:4,A:3,A:2]

@LINKS
A:5->D:7|A:4->D:6|A:2->C:10
```

---

## 9. File Format: knowledge.aicf

**Purpose:** General facts about the project

**Format:** `K#|CATEGORY|KEY|VALUE|SOURCE|TIMESTAMP`

**Categories:** TECH, TEAM, PROCESS, BUSINESS, DOMAIN

**Example:**
```
@KNOWLEDGE
@SCHEMA
K#|CATEGORY|KEY|VALUE|SOURCE|TIMESTAMP

@DATA
12|TECH|language|JavaScript (Node.js)|package.json|20251001T000000Z
11|TECH|package_manager|npm|package.json|20251001T000000Z
10|TECH|cli_framework|Commander.js|package.json|20251001T000000Z
9|TECH|distribution|npm registry|README.md|20251001T000000Z
8|TEAM|maintainer|Dennis H. A. van Leeuwen (@Vaeshkar)|package.json|20251001T000000Z
7|PROCESS|versioning|Semantic versioning|CHANGELOG.md|20251001T000000Z
6|PROCESS|release_process|Manual npm publish|docs|20251001T000000Z
5|BUSINESS|target_users|Developers using AI coding assistants|README.md|20251001T000000Z
4|BUSINESS|problem_solved|Context loss between AI chat sessions|README.md|20251001T000000Z
3|DOMAIN|key_concept|Knowledge base persistence|README.md|20251001T000000Z
```

---

## 10. File Format: .meta

**Purpose:** Project metadata (JSON for easy parsing)

```json
{
  "aicf_version": "2.0.0",
  "project": {
    "name": "create-ai-chat-context",
    "version": "0.12.0",
    "language": "javascript",
    "repository": "github.com/Vaeshkar/create-ai-chat-context"
  },
  "created": "2025-10-01T230000Z",
  "last_update": "2025-10-01T230000Z",
  "stats": {
    "total_conversations": 12,
    "total_decisions": 8,
    "total_tasks": 45,
    "total_issues": 3,
    "total_components": 6
  },
  "tools": {
    "generator": "create-ai-chat-context",
    "generator_version": "0.12.0"
  }
}
```

---

## 11. The Magic: Context Loading

**Command:** `npx aic context`

**Output:**
```
📋 AI Context Ready - AICF 2.0

Project: create-ai-chat-context v0.12.0
Status: Active development
Last Update: 2 hours ago

🎯 Current Work:
- Designing AICF 2.0 specification
- Goal: Connect all chats seamlessly
- Priority: HIGH

📊 Project Stats:
- 12 conversations
- 8 decisions
- 45 tasks (3 active, 42 done)
- 3 known issues

🔥 Recent Activity:
- 2h ago: Started AICF 2.0 design
- 3h ago: Added --all-files converter
- 4h ago: Published v0.12.0 to npm

💡 Key Context:
We're building an npm CLI tool to preserve AI chat context.
Just achieved 85% token reduction with AICF format.
Working on universal AI memory system for seamless chat continuity.

📝 For AI: Read .aicf/ for full context
```

---

## 12. Token Efficiency

**Comparison:**

| Format | Tokens | Example |
|--------|--------|---------|
| Markdown | 150 | Full prose with sections |
| YAML | 80 | Structured with labels |
| AICF 1.0 | 12 | Pipe-delimited |
| AICF 2.0 | 10 | Optimized with index |

**Impact:**
- 93% reduction vs Markdown
- 87% reduction vs YAML
- 17% reduction vs AICF 1.0

---

**END OF SPECIFICATION**

Next: Implementation

