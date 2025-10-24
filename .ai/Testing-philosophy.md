# Testing Philosophy

**Last Updated:** 2025-10-24  
**Author:** Dennis van Leeuwen  
**Principle:** Test YOUR logic, not the standard library

---

## The Core Principle

> "You don't test standard library functions. You trust them."
> — Linus Torvalds (paraphrased)

**We test the logic WE wrote. We trust Node.js, fs-extra, and other well-maintained libraries.**

---

## What We Test ✅

### 1. **Core Business Logic**
- Parsing conversations from different LLM platforms
- Extracting decisions, actions, state, flow, intent, technical work
- Orchestrating the full pipeline
- Version-aware file merging
- Permission management
- Configuration loading

### 2. **Integration Workflows**
- Checkpoint → Parse → Extract → Consolidate → Write
- End-to-end command execution
- Multi-platform watcher coordination

### 3. **Error Handling**
- Invalid input handling
- Missing file handling
- Malformed data handling
- Permission denied scenarios

### 4. **Edge Cases**
- Empty data
- Very large data
- Concurrent operations
- State transitions

---

## What We DON'T Test ❌

### 1. **Standard Library Functions**
```typescript
// ❌ DON'T TEST - fs-extra is well-maintained
it('should write file to disk', () => {
  writeFileSync(path, 'content');
  expect(readFileSync(path)).toBe('content');
});

// ✅ DO TEST - Our logic
it('should consolidate conversation into memory files', () => {
  const result = consolidator.consolidate(conversation);
  expect(result.decisions).toHaveLength(3);
});
```

### 2. **Trivial Wrappers**
```typescript
// ❌ DON'T TEST - Just wraps Node.js
export function fileExists(path: string): boolean {
  return existsSync(path);
}

// ✅ DO TEST - Has business logic
export function shouldArchiveConversation(path: string): boolean {
  const size = getFileSizeInTokens(path);
  return size > 100000; // Our logic
}
```

### 3. **Third-Party Libraries**
- Don't test `chalk` color output
- Don't test `fs-extra` file operations
- Don't test `better-sqlite3` database operations
- Don't test `commander` CLI parsing

### 4. **Simple Utilities**
```typescript
// ❌ DON'T TEST - Just error handling
export function handleError(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown';
}

// ✅ DO TEST - Complex logic
export function extractVersionFromHeader(content: string): Date | undefined {
  // Complex regex and date parsing logic
}
```

---

## Test Categories

### **Category 1: Core Logic (340 tests)** ⭐
- **Parsers** (121 tests) - Parse 8 LLM platforms
- **Extractors** (80 tests) - Extract 6 types of information
- **Orchestrators** (34 tests) - Analyze conversations
- **Commands** (63 tests) - CLI operations
- **Integration** (54 tests) - End-to-end workflows

**These are REAL tests. They test OUR logic.**

### **Category 2: Infrastructure (227 tests)**
- **Utils** (117 tests) - File I/O, tokens, logging
- **Permission/Config** (66 tests) - State management
- **Services** (30 tests) - Consolidation, writing
- **Watchers** (25 tests) - Platform watchers
- **Agents** (47 tests) - Routing, utilities

**These test integration between our components and libraries.**

---

## Testing Rules

### Rule 1: Test Behavior, Not Implementation
```typescript
// ❌ BAD - Tests implementation detail
it('should call writeFileSync', () => {
  const spy = jest.spyOn(fs, 'writeFileSync');
  writer.write(data);
  expect(spy).toHaveBeenCalled();
});

// ✅ GOOD - Tests behavior
it('should write memory files to disk', () => {
  writer.write(data);
  expect(fileExists(outputPath)).toBe(true);
  expect(readFile(outputPath)).toContain('expected content');
});
```

### Rule 2: Use Real Data, Not Mocks
```typescript
// ❌ BAD - Mocked data
const mockConversation = { messages: [] };
const result = parser.parse(mockConversation);

// ✅ GOOD - Real data
const realConversation = loadTestFixture('real-conversation.json');
const result = parser.parse(realConversation);
```

### Rule 3: Test One Thing Per Test
```typescript
// ❌ BAD - Tests multiple things
it('should parse and extract', () => {
  const parsed = parser.parse(data);
  const extracted = extractor.extract(parsed);
  expect(extracted.decisions).toBeDefined();
  expect(extracted.actions).toBeDefined();
});

// ✅ GOOD - One thing
it('should extract decisions from parsed conversation', () => {
  const parsed = parser.parse(data);
  const extracted = extractor.extract(parsed);
  expect(extracted.decisions).toHaveLength(3);
});
```

### Rule 4: Test Error Cases
```typescript
// ✅ GOOD - Test what happens when things go wrong
it('should handle malformed JSON gracefully', () => {
  const result = parser.parse('{ invalid json }');
  expect(result.ok).toBe(false);
  expect(result.error).toBeDefined();
});
```

---

## When to Skip Tests

✅ **Skip tests for:**
- Third-party library functions
- Simple getters/setters
- Trivial wrappers around Node.js
- Code that's just calling other tested functions

❌ **Never skip tests for:**
- Core business logic
- Data transformation
- Error handling
- Integration points

---

## Test Quality Over Quantity

**Good:** 100 tests that test real logic, run in 2 seconds  
**Bad:** 500 tests that test Node.js built-ins, run in 30 seconds

**Our goal:** Tests that catch real bugs, not tests that look impressive.

---

## References

- Linus Torvalds on testing standard libraries
- Google Testing Blog: "Test Behavior, Not Implementation"
- Kent C. Dodds: "Testing Library" philosophy

