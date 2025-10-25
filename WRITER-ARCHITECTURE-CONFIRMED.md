# Writer Architecture - Confirmed

## ✅ Existing Writers Found

### 1. MemoryFileWriter (src/writers/MemoryFileWriter.ts)
**Purpose:** Generates both AICF and Markdown formats from AnalysisResult

**Two Output Formats:**

#### AICF Format (Pipe-Delimited)
```typescript
generateAICF(analysis: AnalysisResult, conversationId: string): string
```

Output:
```
version|3.0.0-alpha
timestamp|2025-10-24T...
conversationId|0da34e3e-...
userIntents|timestamp|intent|confidence;...
aiActions|timestamp|type|details;...
technicalWork|timestamp|type|work;...
decisions|timestamp|decision|impact;...
flow|turns|dominantRole|sequence
workingState|currentTask|blockers|nextAction
```

#### Markdown Format (Human-Readable)
```typescript
generateMarkdown(analysis: AnalysisResult, conversationId: string): string
```

Output:
```markdown
# Conversation Analysis

**Conversation ID:** 0da34e3e-...
**Generated:** 2025-10-24T...

## User Intents
- **high:** User intent here

## AI Actions
- **type:** Details here

## Technical Work
- **type:** Work description

## Decisions
- **impact impact:** Decision text
  - Context: Context here

## Flow
- Turns: X
- Dominant Role: user/ai
- Sequence: [...]

## Working State
- Current Task: Task name
- Blockers: [...]
- Next Action: Action
```

---

## 🔄 Data Flow

```
Augment LevelDB Record
    ↓
Parse to AnalysisResult
    ↓
MemoryFileWriter
    ├─ generateAICF() → Pipe-delimited format
    │  └─ writeAICF() → .aicf/{conversationId}.aicf
    │
    └─ generateMarkdown() → Human-readable format
       └─ writeMarkdown() → .ai/{conversationId}.md
```

---

## 📝 Serialization Strategy

### AICF (Pipe-Delimited)
- **Separator:** `|` (pipe)
- **Multi-value separator:** `;` (semicolon)
- **Format:** `field1|field2|field3`
- **Arrays:** `item1;item2;item3`
- **Purpose:** AI-optimized, token-efficient, fast parsing

### Markdown (Prose)
- **Format:** Standard markdown with headers
- **Sections:** User Intents, AI Actions, Technical Work, Decisions, Flow, Working State
- **Purpose:** Human-readable, easy to edit, suitable for documentation

---

## ✅ Both Formats Are Correct

**Your observation is correct:**
- `.md` files use normalized/prose format (human-readable)
- `.aicf` files use pipe-delimited format (AI-optimized)

**This is by design:**
- MemoryFileWriter has separate methods for each format
- Each format is optimized for its use case
- Both are generated from the same AnalysisResult

---

## 🎯 For Augment Extraction

We should use MemoryFileWriter pattern:

1. **Parse Augment record** → Create AnalysisResult
2. **Generate AICF** → Pipe-delimited format
3. **Generate Markdown** → Human-readable format
4. **Write both files** → `.aicf/{id}.aicf` and `.ai/{id}.md`

This ensures consistency with existing architecture.

---

## 📊 Example Output

### Input: Augment Record
```json
{
  "conversationId": "0da34e3e-...",
  "request_message": "How do we...",
  "response_text": "Here's the approach...",
  "model_id": "claude-sonnet-4-5",
  "timestamp": "2025-10-20T06:45:53.832Z"
}
```

### Output: AICF File
```
version|3.0.0-alpha
timestamp|2025-10-20T06:45:53.832Z
conversationId|0da34e3e-74df-489c-9e2e-267d4ec2a161
userIntents|2025-10-20T06:45:53Z|How do we approach this|high
aiActions|2025-10-20T06:45:53Z|analysis|Here's the approach
technicalWork|2025-10-20T06:45:53Z|planning|Designed solution
decisions|2025-10-20T06:45:53Z|Use TypeScript|HIGH
flow|1|ai|ai
workingState|planning|none|continue
```

### Output: Markdown File
```markdown
# Conversation Analysis

**Conversation ID:** 0da34e3e-74df-489c-9e2e-267d4ec2a161
**Generated:** 2025-10-20T06:45:53.832Z

## User Intents
- **high:** How do we approach this

## AI Actions
- **analysis:** Here's the approach

## Technical Work
- **planning:** Designed solution

## Decisions
- **HIGH impact:** Use TypeScript
  - Context: From conversation analysis

## Flow
- Turns: 1
- Dominant Role: ai
- Sequence: [ai]

## Working State
- Current Task: planning
- Blockers: none
- Next Action: continue
```

---

## ✅ Confirmed Architecture

Both formats are correct and intentional:
- ✅ AICF = Pipe-delimited (AI-optimized)
- ✅ Markdown = Prose (Human-optimized)
- ✅ MemoryFileWriter handles both
- ✅ Ready to use for Augment extraction

