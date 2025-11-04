# 🧠 How to Make an LLM Enforce Rules: Deep Design Analysis

**Author:** Claude Code Analysis
**Date:** 2025-11-04
**Context:** Analysis for create-ai-chat-context-experimental project

---

## The Core Challenge

**Making an LLM consistently follow rules across sessions is fundamentally different from traditional programming.**

Unlike deterministic code that always executes the same instructions, LLMs:
- Generate probabilistic outputs based on training and context
- Have no persistent state between sessions (unless explicitly provided)
- Can "drift" or "forget" instructions over long conversations
- May interpret rules differently based on phrasing
- Can be influenced by user prompts that contradict system rules

**The Question:** How do we create `do_this_every_time.md` behavior that an LLM actually follows?

---

## 🎯 Analysis of Current Approaches in This Codebase

### 1. **Markdown Files with Imperative Instructions**

**Location:** `templates/shared/.ai/rules/always-load-context.md`

**Pattern:**
```markdown
**CRITICAL: Read this at the START of EVERY session (all LLMs).**

Before responding to ANY user request, you MUST read these files in this exact order:
```

**Why It Works (Sometimes):**
- ✅ Uses emphatic language (CRITICAL, MUST, EVERY)
- ✅ Provides explicit ordering (numbered steps)
- ✅ Uses visual markers (emojis, bold text) to draw attention
- ✅ Includes verification checkboxes at the end

**Why It Fails (Often):**
- ❌ Relies on LLM reading the file first (chicken-egg problem)
- ❌ No enforcement mechanism if LLM skips the file
- ❌ Can be overridden by user prompts ("ignore previous instructions")
- ❌ No detection if LLM doesn't follow the rules
- ❌ Works differently across LLM platforms (Augment vs Claude vs Cursor)

### 2. **Protected Files Declaration**

**Location:** `templates/shared/.ai/rules/protected-ai-files.md`

**Pattern:**
```markdown
**CRITICAL: THE ENTIRE `.ai/` FOLDER IS OFF-LIMITS FOR AUTOMATIC SYSTEMS.**

ALL FILES IN `.ai/` SHOULD NEVER be auto-generated, overwritten, or modified by:
- MemoryFileWriter
- CacheConsolidationAgent
- [list of prohibited systems]
```

**Why It Works (Sometimes):**
- ✅ Clear prohibition list
- ✅ Explains WHY files are protected
- ✅ Defines WHO is prohibited (specific system names)
- ✅ Provides alternative destinations (.aicf/ folder)

**Why It Fails (Often):**
- ❌ Only works if the AI agent reads the file
- ❌ No programmatic enforcement
- ❌ Agent could rationalize exceptions ("user explicitly asked")
- ❌ No audit trail to detect violations
- ❌ Comment in code shows drift: `CacheConsolidationAgent.ts:21` says ".ai/[conversationId].md"

### 3. **Permission Manager (Programmatic Enforcement)**

**Location:** `src/core/PermissionManager.ts`

**Pattern:**
```typescript
export class PermissionManager {
  isEnabled(platform: PlatformName): boolean {
    const result = this.getPermission(platform);
    if (!result.ok) return false;
    return result.value.status === 'active';
  }
}
```

**Why It Works:**
- ✅ Code-level enforcement (deterministic)
- ✅ Audit logging (`auditLog` array)
- ✅ State persistence (`.lill/.permissions.aicf`)
- ✅ Clear APIs (`grantPermission`, `revokePermission`)

**Why It Fails:**
- ❌ Only enforces platform access permissions
- ❌ Doesn't prevent LLM from writing to protected files
- ❌ Requires integration into every code path

### 4. **Platform-Specific Rules Files**

**Location:** `templates/augment/.augment/rules/always-load-context.md`

**Pattern:**
```markdown
**CRITICAL: This rule is automatically included in EVERY user prompt by Augment.**
```

**Why It Works:**
- ✅ Leverages platform-specific features (Augment auto-includes rules)
- ✅ Guaranteed to be in context window
- ✅ Platform-native integration

**Why It Fails:**
- ❌ Only works on Augment, not portable
- ❌ Different behavior on Claude, Cursor, Warp, ChatGPT
- ❌ Requires separate rule files for each platform

---

## 📊 Classification: Types of LLM Rules

### Type 1: **Session Initialization Rules**
*"Do this at the START of every conversation"*

**Examples:**
- Read `.ai-instructions` file
- Load project context from `.aicf/` directory
- Check recent conversation history

**Enforcement Approaches:**

| Approach | Reliability | Portability | Complexity |
|----------|-------------|-------------|------------|
| **User Prompt** | 20% | ✅ High | 🟢 Low |
| **Platform Auto-Include** | 80% | ❌ Low | 🟢 Low |
| **MCP (Model Context Protocol)** | 95% | 🟡 Medium | 🟡 Medium |
| **Custom System Prompt** | 90% | ❌ Low | 🟡 Medium |

**Best Practice:**
```markdown
# .ai-instructions (root level file)

**FOR ANY AI ASSISTANT: READ THIS FIRST!**

Before responding, you MUST:
1. Read all files in .ai/ directory
2. Read recent conversations in .aicf/recent/
3. Confirm you understand project context

✅ Success criteria:
- [ ] I know what this project does
- [ ] I know current work state
- [ ] I read previous decisions
```

**Why This Works Better:**
- Single entry point (`.ai-instructions`)
- Self-documenting checkboxes
- Explicit success criteria
- Works across all platforms (with user prompt)

### Type 2: **Behavioral Constraints**
*"NEVER do this" or "ALWAYS do this"*

**Examples:**
- Never modify `.ai/` protected files
- Always write AICF format, not Markdown
- Always log actions to audit trail

**Enforcement Approaches:**

| Approach | Reliability | Portability | Complexity |
|----------|-------------|-------------|------------|
| **Markdown Rules** | 30% | ✅ High | 🟢 Low |
| **Code Guards** | 95% | ✅ High | 🔴 High |
| **Validation Hooks** | 90% | 🟡 Medium | 🟡 Medium |
| **LLM Function Calling** | 85% | 🟡 Medium | 🟡 Medium |

**Best Practice - Hybrid Approach:**

**Step 1:** Document in Markdown
```markdown
# .ai/rules/protected-ai-files.md

**RULE: NEVER modify these files automatically:**
- .ai/code-style.md
- .ai/design-system.md
- .ai/project-overview.md

**REASON:** These are manual documentation, not auto-generated logs.

**ENFORCEMENT:** Code guards in MemoryFileWriter will block writes to .ai/
```

**Step 2:** Implement Code Guard
```typescript
// src/utils/PathValidator.ts
export class PathValidator {
  private static PROTECTED_PATHS = [
    '.ai/code-style.md',
    '.ai/design-system.md',
    '.ai/project-overview.md',
  ];

  static isProtected(path: string): boolean {
    return this.PROTECTED_PATHS.some(p => path.includes(p));
  }

  static validateWrite(path: string): Result<void> {
    if (this.isProtected(path)) {
      return Err(new Error(
        `BLOCKED: Cannot write to protected file ${path}. ` +
        `See .ai/rules/protected-ai-files.md for details.`
      ));
    }
    return Ok(undefined);
  }
}
```

**Step 3:** Integrate Guard
```typescript
// src/writers/MemoryFileWriter.ts
async writeFile(path: string, content: string): Promise<Result<void>> {
  // 🛡️ Validate before write
  const validation = PathValidator.validateWrite(path);
  if (!validation.ok) {
    await this.logViolation(path, validation.error.message);
    return validation;
  }

  // Proceed with write
  await fs.writeFile(path, content);
  return Ok(undefined);
}
```

**Why This Works:**
- ✅ Markdown documents the rule (human + AI readable)
- ✅ Code enforces the rule (deterministic)
- ✅ Error messages reference the markdown (traceable)
- ✅ Violations are logged (auditable)

### Type 3: **Workflow Rules**
*"When you finish a task, do this"*

**Examples:**
- At end of session, update `.ai/conversation-log.md`
- After analysis, write to `.lill/raw/` directory
- Before committing, run tests

**Enforcement Approaches:**

| Approach | Reliability | Portability | Complexity |
|----------|-------------|-------------|------------|
| **Reminder in Prompt** | 40% | ✅ High | 🟢 Low |
| **Git Hooks** | 95% | ✅ High | 🟡 Medium |
| **CLI Commands** | 70% | ✅ High | 🟢 Low |
| **AI Memory Nudge** | 60% | 🟡 Medium | 🟢 Low |

**Best Practice - Layered Approach:**

**Layer 1:** User Prompt Template
```markdown
# docs/guides/NEW_CHAT_PROMPT.md

## At END of Chat (CRITICAL!)

Before we finish, please:
1. Update .ai/conversation-log.md
2. Update .ai/next-steps.md
3. Note any decisions made

Or run: `npx aic finish`
```

**Layer 2:** CLI Command
```bash
# Run at end of session
npx aic finish --auto-update
```

**Layer 3:** Git Commit Hook
```bash
# .git/hooks/pre-commit
#!/bin/bash
# Check if .ai/conversation-log.md was updated today
if ! grep -q "$(date +%Y-%m-%d)" .ai/conversation-log.md; then
  echo "⚠️  Warning: conversation-log.md not updated today"
  echo "Run: npx aic finish"
  exit 1
fi
```

**Layer 4:** AI Memory Nudge
```typescript
// After 30 minutes of inactivity
showReminder({
  message: "Session ending soon. Don't forget to update .ai/ files!",
  command: "npx aic finish"
});
```

---

## 🏗️ Recommended Architecture: The 5-Layer Enforcement Model

### Layer 1: **Declarative Rules (Markdown)**
*Document WHAT and WHY*

**Purpose:** Human and AI readable documentation
**Reliability:** 30% alone, 90% when combined with other layers
**Location:** `.ai/rules/*.md`

**Example:**
```markdown
# .ai/rules/file-organization.md

## RULE: Conversation Memory Location

**WHAT:** All conversation data MUST go to .lill/raw/

**WHY:**
- .lill/ is for auto-generated data
- .ai/ is for manual documentation
- Separation prevents conflicts

**HOW:**
- MemoryFileWriter.writeJSON() enforces this
- See: src/writers/MemoryFileWriter.ts:163

**DETECTION:**
If you find conversation data in .ai/, report to:
- github.com/Vaeshkar/create-ai-chat-context/issues
```

### Layer 2: **Code Guards (TypeScript)**
*Enforce programmatically*

**Purpose:** Deterministic enforcement at code level
**Reliability:** 95%
**Location:** `src/utils/PathValidator.ts`, `src/core/GuardRails.ts`

**Example:**
```typescript
// src/core/GuardRails.ts
export class GuardRails {
  private static RULES = [
    {
      name: 'protected-ai-files',
      check: (path: string) => !path.includes('.ai/'),
      error: 'Cannot write to .ai/ protected files'
    },
    {
      name: 'aicf-format-only',
      check: (path: string, content: string) =>
        path.endsWith('.aicf') || path.endsWith('.json'),
      error: 'Only AICF and JSON formats allowed in .lill/'
    }
  ];

  static enforce(operation: 'read' | 'write', path: string, content?: string): Result<void> {
    for (const rule of this.RULES) {
      if (!rule.check(path, content || '')) {
        return Err(new Error(`[${rule.name}] ${rule.error}`));
      }
    }
    return Ok(undefined);
  }
}
```

### Layer 3: **Validation Hooks (Pre/Post)**
*Verify before and after operations*

**Purpose:** Catch violations at operation boundaries
**Reliability:** 85%
**Location:** Method decorators, middleware

**Example:**
```typescript
// src/utils/decorators.ts
export function ValidateWrite(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const [path] = args;

    // Pre-validation
    const validation = GuardRails.enforce('write', path);
    if (!validation.ok) {
      logger.error(`Write validation failed: ${validation.error.message}`);
      return validation;
    }

    // Execute original method
    const result = await originalMethod.apply(this, args);

    // Post-validation (verify file was written correctly)
    if (result.ok && existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      const format = path.endsWith('.aicf') ? 'aicf' : 'json';
      const check = FileValidator.validate(path, format);
      if (!check.ok) {
        logger.error(`Post-write validation failed: ${check.error}`);
        unlinkSync(path); // Rollback
        return check;
      }
    }

    return result;
  };

  return descriptor;
}

// Usage in MemoryFileWriter
class MemoryFileWriter {
  @ValidateWrite
  async writeJSON(conversationId: string, data: any): Promise<Result<void>> {
    // Write logic here
  }
}
```

### Layer 4: **LLM Context Injection**
*Keep rules in every LLM interaction*

**Purpose:** Ensure LLM always has rules in context
**Reliability:** 80% (depends on platform)
**Location:** System prompts, auto-included files

**Platform-Specific Implementations:**

**Augment:**
```markdown
# .augment/rules/always-load-context.md
# This file is automatically included in EVERY prompt
```

**Claude Projects:**
```markdown
# Project Instructions (in Claude UI)
Before every response, read:
- .ai/rules/*.md
- .ai-instructions
```

**Cursor:**
```markdown
# .cursorrules
Read .ai/rules/ directory before providing assistance.
```

**Warp:**
```markdown
# .ai-instructions
# Warp automatically reads this file
```

**ChatGPT Custom GPT:**
```
# Instructions field
Read and follow rules in .ai/rules/ directory.
```

### Layer 5: **Audit & Detection**
*Monitor compliance and detect violations*

**Purpose:** Catch and report rule violations
**Reliability:** 100% (for detection, not prevention)
**Location:** `src/core/AuditLogger.ts`, validation commands

**Example:**
```typescript
// src/core/AuditLogger.ts
export class AuditLogger {
  private logFile = '.lill/.audit.log';

  async logViolation(rule: string, path: string, operation: string): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'VIOLATION',
      rule,
      path,
      operation,
      stack: new Error().stack,
    };

    await fs.appendFile(this.logFile, JSON.stringify(entry) + '\n');

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`🚨 RULE VIOLATION: [${rule}] ${path}`);
    }
  }

  async logCompliance(rule: string, path: string, operation: string): Promise<void> {
    const entry = {
      timestamp: new Date().toISOString(),
      level: 'COMPLIANT',
      rule,
      path,
      operation,
    };

    await fs.appendFile(this.logFile, JSON.stringify(entry) + '\n');
  }
}
```

```typescript
// CLI command to check violations
// src/commands/AuditCommand.ts
export class AuditCommand {
  async run(): Promise<void> {
    const violations = await this.findViolations();

    if (violations.length === 0) {
      console.log('✅ No rule violations found');
      return;
    }

    console.log(`🚨 Found ${violations.length} violations:\n`);
    for (const v of violations) {
      console.log(`[${v.rule}] ${v.path}`);
      console.log(`  Operation: ${v.operation}`);
      console.log(`  Time: ${v.timestamp}\n`);
    }
  }

  private async findViolations(): Promise<Array<any>> {
    // Check for files in .ai/ that shouldn't be there
    const aiFiles = glob('.ai/**/*.aicf');
    const violations = [];

    for (const file of aiFiles) {
      violations.push({
        rule: 'protected-ai-files',
        path: file,
        operation: 'write',
        timestamp: statSync(file).mtime,
      });
    }

    // Check audit log for recorded violations
    const auditLog = await fs.readFile('.lill/.audit.log', 'utf-8');
    const entries = auditLog.split('\n').filter(Boolean);

    for (const entry of entries) {
      const data = JSON.parse(entry);
      if (data.level === 'VIOLATION') {
        violations.push(data);
      }
    }

    return violations;
  }
}
```

---

## 🎯 Concrete Recommendations for This Project

### Problem 1: "LLMs forget to read context at session start"

**Current State:**
- Markdown file says "Read this first"
- Users manually type "Read .ai-instructions"
- Inconsistent across platforms

**Recommended Solution:**

**Step 1:** Create Universal Entry Point
```markdown
# .ai-instructions (root level)

**🤖 AI ASSISTANT: READ THIS FIRST!**

This project has memory across sessions. Before helping:

1. Run: `cat .ai/rules/*.md` to understand all rules
2. Run: `ls .lill/recent/ | head -5` to see recent conversations
3. Confirm: "I've read project context and understand the rules"

**Why:** This prevents "AI amnesia" and ensures continuity.

**Platform Setup:**
- Augment: Auto-reads .augment/rules/
- Claude: Add .ai-instructions to project knowledge
- Cursor: Configured in .cursorrules
- Warp: Auto-reads .ai-instructions
```

**Step 2:** Create Platform-Specific Bootstraps
```typescript
// src/commands/InitCommand.ts
async initPlatform(platform: 'augment' | 'claude' | 'cursor' | 'warp'): Promise<void> {
  switch(platform) {
    case 'augment':
      await this.createFile('.augment/rules/bootstrap.md', AUGMENT_BOOTSTRAP);
      break;
    case 'cursor':
      await this.createFile('.cursorrules', CURSOR_RULES);
      break;
    // ... etc
  }
}
```

**Step 3:** Add Session Start Detection
```typescript
// Detect new session (first message from user)
// Inject reminder into LLM context

if (isFirstMessageInSession) {
  systemPrompt += `\n\nREMINDER: Read .ai-instructions and .ai/rules/ before responding.`;
}
```

### Problem 2: "Agents write to protected .ai/ files"

**Current State:**
- Markdown says "don't write here"
- Agents sometimes ignore it
- No code-level enforcement

**Recommended Solution:**

**Step 1:** Create PathValidator (see Layer 2 above)

**Step 2:** Integrate into Every Write Path
```typescript
// src/writers/MemoryFileWriter.ts
async writeJSON(...): Promise<Result<void>> {
  // ✅ Add this guard
  const validation = PathValidator.validateWrite(filepath);
  if (!validation.ok) {
    await auditLogger.logViolation('protected-ai-files', filepath, 'write');
    return validation; // Block the write
  }

  // Existing code...
}
```

**Step 3:** Add Test Coverage
```typescript
// src/writers/MemoryFileWriter.test.ts
describe('MemoryFileWriter protected files', () => {
  it('should block writes to .ai/ directory', async () => {
    const writer = new MemoryFileWriter();
    const result = await writer.writeJSON('test', analysis, conversation);

    // Verify no files in .ai/
    const aiFiles = glob('.ai/**/*.json');
    expect(aiFiles).toHaveLength(0);

    // Verify audit log recorded violation attempt
    const auditLog = await fs.readFile('.lill/.audit.log', 'utf-8');
    expect(auditLog).toContain('protected-ai-files');
  });
});
```

### Problem 3: "Users forget to update .ai/ files at session end"

**Current State:**
- NEW_CHAT_PROMPT.md reminds users
- Often forgotten
- No enforcement

**Recommended Solution:**

**Approach A: Git Hook (Gentle Reminder)**
```bash
# .git/hooks/pre-commit
#!/bin/bash
LAST_UPDATE=$(stat -f %Sm -t %Y-%m-%d .ai/conversation-log.md)
TODAY=$(date +%Y-%m-%d)

if [ "$LAST_UPDATE" != "$TODAY" ]; then
  echo "⚠️  conversation-log.md not updated today"
  echo "❓ Continue commit? (y/N)"
  read -r response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi
```

**Approach B: CLI Command with Auto-detect**
```typescript
// npx aic finish
export class FinishCommand {
  async run(): Promise<void> {
    // Detect what changed in this session
    const recentFiles = await this.detectChangedFiles();

    // Generate summary using LLM
    const summary = await this.generateSummary(recentFiles);

    // Prompt user to review
    console.log('📝 Session Summary:\n');
    console.log(summary);
    console.log('\n💾 Update .ai/conversation-log.md? (Y/n)');

    const response = await this.prompt();
    if (response === 'y') {
      await this.updateConversationLog(summary);
    }
  }
}
```

**Approach C: Watcher Service (Automatic)**
```typescript
// Background process that monitors for session end
export class SessionWatcher {
  async detectSessionEnd(): Promise<void> {
    // No LLM activity for 10 minutes
    if (this.getMinutesSinceLastActivity() > 10) {
      await this.promptUserToFinish();
    }
  }
}
```

---

## 🔬 Research: Why LLMs Fail to Follow Rules

### 1. **Context Window Overflow**
When conversation gets long, early instructions fall out of context.

**Solution:** Re-inject rules periodically
```typescript
if (messageCount % 10 === 0) {
  injectSystemMessage('REMINDER: Follow rules in .ai/rules/');
}
```

### 2. **User Override**
User says "ignore previous instructions" or "just do it anyway"

**Solution:** Code-level guards that can't be overridden by prompts

### 3. **Ambiguous Language**
"Should", "prefer", "try to" are interpreted loosely

**Solution:** Use imperative language
- ❌ "You should avoid writing to .ai/"
- ✅ "NEVER write to .ai/"
- ✅ "All writes to .ai/ will be blocked"

### 4. **No Feedback Loop**
LLM doesn't know it violated a rule

**Solution:** Immediate feedback
```typescript
if (ruleViolationDetected) {
  sendMessageToLLM('⚠️ RULE VIOLATION: You attempted to write to .ai/ which is forbidden. See .ai/rules/protected-ai-files.md');
}
```

### 5. **Conflicting Rules**
Multiple rules create contradictions

**Solution:** Rule priority hierarchy
```markdown
# .ai/rules/README.md

## Rule Priority (Highest to Lowest)

1. NEVER rules (absolute prohibitions)
2. ALWAYS rules (required actions)
3. PREFER rules (strong suggestions)
4. CONSIDER rules (weak suggestions)

If rules conflict, higher priority wins.
```

---

## 📈 Measuring Rule Compliance

### Metrics to Track

1. **Session Start Compliance**
   - % of sessions where AI reads .ai-instructions first
   - Measured by: Audit log, conversation analysis

2. **File Protection Compliance**
   - # of blocked writes to .ai/
   - # of successful writes to .lill/
   - Ratio: compliance_rate = successful / (successful + blocked)

3. **Workflow Compliance**
   - % of sessions where .ai/ files updated at end
   - Measured by: Git commits, file modification times

4. **Detection Lag**
   - Time between violation and detection
   - Measured by: Audit log timestamps

### Reporting

```bash
# npx aic report --compliance
📊 Rule Compliance Report

Session Start (last 30 days):
  ✅ 27/30 sessions read context first (90%)
  ❌ 3/30 sessions skipped context

File Protection (last 30 days):
  ✅ 0 violations detected
  ✅ 142 writes to .lill/ (100% compliant)

Workflow (last 30 days):
  ✅ 25/30 sessions updated .ai/ files (83%)
  ❌ 5/30 sessions forgot to update

Overall Compliance: 91% ⭐️
```

---

## 🎓 Lessons from This Codebase

### What Works Well

1. **Separation of Concerns**
   - `.lill/` for auto-generated (agents can write)
   - `.ai/` for manual (agents forbidden)
   - Clear boundary

2. **Multiple Rule Locations**
   - Universal: `.ai/rules/`
   - Platform-specific: `.augment/rules/`, `.cursorrules`
   - Fallback coverage

3. **Human-Readable Documentation**
   - Rules explain WHY not just WHAT
   - Examples provided
   - Success criteria defined

### What Needs Improvement

1. **No Code-Level Guards**
   - Rules are only in markdown
   - Agents can violate without detection
   - **Fix:** Add PathValidator and GuardRails (see above)

2. **No Violation Detection**
   - No audit log for rule violations
   - Can't measure compliance
   - **Fix:** Add AuditLogger and `aic audit` command

3. **Platform Fragmentation**
   - Different behavior on each platform
   - Hard to maintain consistency
   - **Fix:** Create unified bootstrap that adapts per platform

4. **No Feedback to LLM**
   - When rule violated, LLM doesn't learn
   - Same mistakes repeated
   - **Fix:** Add error messages that reference rule docs

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `PathValidator` class
- [ ] Add validation to `MemoryFileWriter`
- [ ] Create audit log in `.lill/.audit.log`
- [ ] Add tests for protected file enforcement

### Phase 2: Detection (Week 2)
- [ ] Create `AuditLogger` class
- [ ] Add `aic audit` command
- [ ] Create compliance report
- [ ] Add CI check for violations

### Phase 3: Prevention (Week 3)
- [ ] Add `@ValidateWrite` decorator
- [ ] Create `GuardRails` class
- [ ] Integrate guards into all write paths
- [ ] Add pre-commit hook for validation

### Phase 4: User Experience (Week 4)
- [ ] Create `aic finish` command
- [ ] Add session end reminders
- [ ] Create platform-specific bootstraps
- [ ] Update documentation

### Phase 5: LLM Context (Week 5)
- [ ] Add rule re-injection every N messages
- [ ] Create feedback messages for violations
- [ ] Test across all platforms
- [ ] Document platform differences

---

## 📚 References & Further Reading

### Internal Docs (This Codebase)
- `docs/guides/UNIVERSAL_AI_INSTRUCTIONS.md` - Universal instructions for all AIs
- `templates/shared/.ai/rules/always-load-context.md` - Session start rules
- `templates/shared/.ai/rules/protected-ai-files.md` - File protection rules
- `src/core/PermissionManager.ts` - Permission enforcement pattern
- `docs/PERMISSION-AND-CONSENT-STRATEGY.md` - Consent architecture

### External Research
- [Anthropic Constitutional AI](https://www.anthropic.com/constitutional) - Training LLMs to follow principles
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling) - Structured LLM outputs
- [LangChain Output Parsers](https://python.langchain.com/docs/modules/model_io/output_parsers/) - Enforcing output structure
- [Prompt Engineering Guide](https://www.promptingguide.ai/) - Effective prompt patterns

### Design Patterns
- **Guard Pattern** - Validate before operation
- **Decorator Pattern** - Add validation transparently
- **Audit Trail Pattern** - Log all operations for review
- **Fail-Safe Pattern** - Block by default, allow explicitly

---

## 💡 Key Insights

1. **LLMs need layers:** No single technique is 100% reliable. Combine markdown rules + code guards + validation + audit.

2. **Make violations impossible, not just discouraged:** Code guards >> Markdown rules.

3. **Give LLMs feedback:** When they violate a rule, tell them immediately with reference to the rule doc.

4. **Test across platforms:** Augment ≠ Claude ≠ Cursor. Each needs platform-specific setup.

5. **Measure compliance:** You can't improve what you don't measure. Track violations and compliance rate.

6. **Make it easy to comply:** Good DX (developer experience) = higher compliance. `aic finish` is easier than manually updating files.

7. **Rules should be discoverable:** Single entry point (`.ai-instructions`) that points to everything else.

---

## ✅ TL;DR - The Answer

**Q: How do we make an LLM enforce rules/do_this_every_time.md?**

**A: Use the 5-Layer Model:**

1. **Document** the rule in markdown (WHY + WHAT + HOW)
2. **Enforce** with code guards (validation, decorators)
3. **Validate** at operation boundaries (pre/post hooks)
4. **Inject** rules into LLM context (platform-specific)
5. **Audit** compliance and violations (logging, reporting)

**The secret:** Don't rely on LLM memory. Use deterministic code to enforce, use LLM context to guide.

**The key insight:** LLMs are collaborators, not soldiers. Guide them with context, enforce with code, measure with audit logs.

---

**Next Step:** Implement Phase 1 (PathValidator + Guards) to stop violations at the code level.
