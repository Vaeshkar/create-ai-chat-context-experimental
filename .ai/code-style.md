# Code Style Guide - create-ai-chat-context

**Last Updated:** 2025-10-03  
**Status:** ✅ Current  
**Project:** create-ai-chat-context NPM package

---

## Overview

This document defines the coding standards and best practices for the create-ai-chat-context project. Following these guidelines ensures consistency, maintainability, and quality.

---

## JavaScript/Node.js Standards

### Module System

**Use CommonJS for Node.js compatibility:**

✅ **CORRECT:**
```javascript
const fs = require('fs');
const path = require('path');

module.exports = {
  processCheckpoint,
  validateFormat,
};
```

❌ **AVOID (unless using ES modules):**
```javascript
import fs from 'fs';
import path from 'path';

export { processCheckpoint, validateFormat };
```

### Variable Declarations

**Use `const` by default, `let` when reassignment needed:**

✅ **CORRECT:**
```javascript
const filePath = path.join(__dirname, 'file.txt');
let counter = 0;
counter++;
```

❌ **AVOID:**
```javascript
var filePath = path.join(__dirname, 'file.txt'); // Don't use var
```

### Function Declarations

**Use descriptive names, prefer function declarations for top-level functions:**

✅ **CORRECT:**
```javascript
function processCheckpoint(checkpoint) {
  // Implementation
}

async function readAICFFile(filePath) {
  // Implementation
}
```

✅ **ALSO CORRECT (for callbacks/inline):**
```javascript
const files = await fs.readdir(dir);
const aicfFiles = files.filter(f => f.endsWith('.aicf'));
```

---

## File Naming Conventions

### Source Files

**Format:** kebab-case  
**Examples:**
- `checkpoint-agent-sdk.js`
- `format-validator.js`
- `file-utils.js`

### Test Files

**Format:** `*.test.js` or `*.spec.js`  
**Examples:**
- `checkpoint-agent.test.js`
- `format-validator.spec.js`

### Configuration Files

**Format:** Standard names  
**Examples:**
- `package.json`
- `.gitignore`
- `.eslintrc.js`

---

## Code Organization

### File Structure

```javascript
// 1. Imports
const fs = require('fs').promises;
const path = require('path');

// 2. Constants
const DEFAULT_TIMEOUT = 5000;
const AICF_VERSION = '1.0';

// 3. Helper functions (private)
function parseAICFSection(text) {
  // Implementation
}

// 4. Main functions (public)
async function processCheckpoint(checkpoint) {
  // Implementation
}

// 5. Exports
module.exports = {
  processCheckpoint,
  AICF_VERSION,
};
```

### Separation of Concerns

**Keep functions focused and single-purpose:**

✅ **CORRECT:**
```javascript
function readFile(filePath) {
  return fs.readFile(filePath, 'utf-8');
}

function parseAICF(content) {
  // Parse AICF format
}

async function loadAICFFile(filePath) {
  const content = await readFile(filePath);
  return parseAICF(content);
}
```

❌ **AVOID (doing too much in one function):**
```javascript
async function loadAICFFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const sections = {};
  // 50 lines of parsing logic...
  return sections;
}
```

---

## Error Handling

### Always Handle Errors

✅ **CORRECT:**
```javascript
async function readAICFFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseAICF(content);
  } catch (error) {
    console.error(`Failed to read AICF file: ${filePath}`);
    throw new Error(`AICF read error: ${error.message}`);
  }
}
```

### Provide Helpful Error Messages

✅ **CORRECT:**
```javascript
if (!fs.existsSync(filePath)) {
  throw new Error(`AICF file not found: ${filePath}`);
}

if (!content.includes('@CONVERSATION')) {
  throw new Error('Invalid AICF format: missing @CONVERSATION section');
}
```

❌ **AVOID:**
```javascript
if (!fs.existsSync(filePath)) {
  throw new Error('File not found'); // Too vague
}
```

---

## Async/Await Patterns

### Use async/await for Promises

✅ **CORRECT:**
```javascript
async function processFiles(directory) {
  const files = await fs.readdir(directory);
  const results = [];
  
  for (const file of files) {
    const content = await fs.readFile(path.join(directory, file), 'utf-8');
    results.push(content);
  }
  
  return results;
}
```

❌ **AVOID (callback hell):**
```javascript
function processFiles(directory, callback) {
  fs.readdir(directory, (err, files) => {
    if (err) return callback(err);
    // Nested callbacks...
  });
}
```

### Handle Promise Rejections

✅ **CORRECT:**
```javascript
async function main() {
  try {
    await processCheckpoint();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
```

---

## AICF Format Standards

### Section Naming

**Use UPPERCASE for section headers:**

✅ **CORRECT:**
```
@CONVERSATION:identifier
@FLOW
@DETAILS:tag
@INSIGHTS
@DECISIONS
@STATE
```

❌ **AVOID:**
```
@conversation:identifier
@Flow
@details:tag
```

### Key Naming

**Use snake_case for keys:**

✅ **CORRECT:**
```
working_on=current_task_description
current_phase=implementation_phase
next_action=create_test_files
```

❌ **AVOID:**
```
workingOn=current_task_description  // camelCase
working-on=current_task_description // kebab-case
```

### Value Formatting

**Use underscores instead of spaces:**

✅ **CORRECT:**
```
model=claude_sonnet_4_20250514
cost=$14.63_per_month
success_rate=87_5_percent
```

❌ **AVOID:**
```
model=claude sonnet 4 20250514  // Spaces break parsing
cost=$14.63 per month
```

---

## CLI Output Standards

### Use Consistent Emoji Indicators

```javascript
console.log('✅ Success: Files created');
console.log('❌ Error: File not found');
console.log('⚠️  Warning: File already exists');
console.log('ℹ️  Info: Processing...');
console.log('🔄 Loading...');
```

### Provide Clear Feedback

✅ **CORRECT:**
```javascript
console.log('✅ Created .ai/ folder');
console.log('✅ Created .aicf/ folder');
console.log('✅ Initialized 6 documentation files');
console.log('\nNext steps:');
console.log('1. Review the files in .ai/ and .aicf/');
console.log('2. Customize templates for your project');
console.log('3. Commit to version control');
```

❌ **AVOID:**
```javascript
console.log('Done'); // Too vague
```

---

## Testing Standards

### Test File Structure

```javascript
const { describe, it, expect } = require('@jest/globals');
const { processCheckpoint } = require('./checkpoint-agent');

describe('processCheckpoint', () => {
  it('should process valid AICF file', async () => {
    const result = await processCheckpoint('test.aicf');
    expect(result.success).toBe(true);
  });

  it('should throw error for invalid format', async () => {
    await expect(processCheckpoint('invalid.aicf'))
      .rejects
      .toThrow('Invalid AICF format');
  });
});
```

### Test Coverage

**Aim for:**
- Core functionality: 80%+ coverage
- Utility functions: 90%+ coverage
- Error handling: Test all error paths

---

## Comments & Documentation

### When to Comment

✅ **DO comment:**
- Complex algorithms
- Non-obvious logic
- Business rules
- Public APIs

❌ **DON'T comment:**
- Obvious code
- What the code does (code should be self-explanatory)

### Good Comments

```javascript
// AICF format requires 6 mandatory sections
// Missing any section will cause validation to fail
const requiredSections = [
  '@CONVERSATION',
  '@FLOW',
  '@DETAILS',
  '@INSIGHTS',
  '@DECISIONS',
  '@STATE',
];

// Calculate token count (1 token ≈ 4 characters)
const tokenCount = Math.floor(content.length / 4);
```

### JSDoc for Public APIs

```javascript
/**
 * Process an AICF checkpoint file
 * 
 * @param {string} filePath - Path to AICF file
 * @param {Object} options - Processing options
 * @param {boolean} options.verbose - Enable verbose logging
 * @returns {Promise<Object>} Processing result
 * @throws {Error} If file format is invalid
 * 
 * @example
 * const result = await processCheckpoint('checkpoint.aicf', { verbose: true });
 */
async function processCheckpoint(filePath, options = {}) {
  // Implementation
}
```

---

## Git Commit Standards

### Commit Message Format

```
<type>: <short description>

<optional longer description>

<optional footer>
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Maintenance

### Examples

```
feat: add AICF format validation

Implemented validation for all 6 mandatory sections and proper
key-value pair formatting. Includes helpful error messages.

Closes #12
```

```
fix: handle missing @STATE section gracefully

Previously threw unclear error. Now provides specific message
about which section is missing.

Fixes #15
```

---

## Performance Guidelines

### File I/O

**Read files efficiently:**

✅ **CORRECT:**
```javascript
// Read all files in parallel
const files = await Promise.all(
  filePaths.map(f => fs.readFile(f, 'utf-8'))
);
```

❌ **AVOID:**
```javascript
// Reading files sequentially (slower)
const files = [];
for (const f of filePaths) {
  files.push(await fs.readFile(f, 'utf-8'));
}
```

### Memory Management

**Stream large files:**

```javascript
const stream = fs.createReadStream('large-file.aicf');
stream.on('data', chunk => {
  // Process chunk
});
```

---

## Security Best Practices

### Input Validation

**Always validate user input:**

```javascript
function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path');
  }
  
  // Prevent directory traversal
  const normalized = path.normalize(filePath);
  if (normalized.includes('..')) {
    throw new Error('Invalid file path: directory traversal detected');
  }
  
  return normalized;
}
```

### File System Operations

**Check file existence before operations:**

```javascript
async function safeReadFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  return await fs.readFile(filePath, 'utf-8');
}
```

---

## Summary

### Key Principles

1. ✅ **Use CommonJS** for Node.js compatibility
2. ✅ **Descriptive naming** for functions and variables
3. ✅ **Error handling** in all async operations
4. ✅ **Consistent formatting** for AICF files
5. ✅ **Clear CLI output** with emoji indicators
6. ✅ **Test coverage** for core functionality
7. ✅ **JSDoc comments** for public APIs
8. ✅ **Security validation** for user input

### Before Committing

- [ ] Code follows naming conventions
- [ ] All async operations have error handling
- [ ] Tests pass
- [ ] No console.log for debugging (use proper logging)
- [ ] Documentation updated if needed
- [ ] AICF format validated

---

**This is a living document** - Update as coding standards evolve.

