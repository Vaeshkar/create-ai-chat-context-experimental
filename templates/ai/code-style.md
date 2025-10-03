# Code Style Guide

**Last Updated:** [Date]  
**Status:** 🚧 To Be Defined  
**Project:** [Your Project Name]

---

## Overview

This document defines the coding standards and best practices for your project. Following these guidelines ensures consistency, maintainability, and quality.

**Customize this for your language and framework!**

---

## General Principles

### Code Quality Standards

1. **Readability First** - Code is read more than written
2. **Consistency** - Follow established patterns
3. **Simplicity** - Simple solutions over clever ones
4. **DRY** - Don't Repeat Yourself
5. **YAGNI** - You Aren't Gonna Need It
6. **KISS** - Keep It Simple, Stupid

---

## Language-Specific Standards

### JavaScript/TypeScript

**Variable Declarations:**
```javascript
// Use const by default
const API_URL = 'https://api.example.com';

// Use let when reassignment needed
let counter = 0;
counter++;

// Avoid var
// ❌ var x = 10;
```

**Function Declarations:**
```javascript
// Named functions for clarity
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Arrow functions for callbacks
const filtered = items.filter(item => item.active);
```

**Async/Await:**
```javascript
// Prefer async/await over promises
async function fetchData() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}
```

### Python

**Naming Conventions:**
```python
# snake_case for functions and variables
def calculate_total(items):
    return sum(item.price for item in items)

# PascalCase for classes
class UserProfile:
    pass

# UPPER_CASE for constants
MAX_RETRIES = 3
API_TIMEOUT = 30
```

**Type Hints:**
```python
def process_data(items: list[dict]) -> dict:
    """Process items and return summary."""
    return {"count": len(items)}
```

### Other Languages

**Add your language-specific conventions here:**
- Java
- Go
- Rust
- Ruby
- PHP
- etc.

---

## Naming Conventions

### General Rules

**Variables:**
- Use descriptive names: `userCount` not `uc`
- Boolean variables: `isActive`, `hasPermission`, `canEdit`
- Arrays/Lists: Plural names: `users`, `items`, `products`

**Functions:**
- Verb-based names: `getUser()`, `calculateTotal()`, `validateInput()`
- Boolean functions: `isValid()`, `hasAccess()`, `canDelete()`

**Classes:**
- Noun-based names: `UserProfile`, `OrderManager`, `DataValidator`
- Avoid generic names: `Manager`, `Handler`, `Processor` (be specific!)

**Constants:**
- UPPER_CASE with underscores: `MAX_RETRIES`, `API_ENDPOINT`

### Examples

✅ **GOOD:**
```javascript
const activeUsers = users.filter(user => user.isActive);
const totalPrice = calculateOrderTotal(items);
const canEditProfile = checkUserPermissions(user, 'edit');
```

❌ **BAD:**
```javascript
const au = users.filter(u => u.a);
const tp = calc(items);
const cep = check(user, 'edit');
```

---

## Code Formatting

### Indentation

**Choose one and be consistent:**
- 2 spaces (JavaScript/TypeScript common)
- 4 spaces (Python standard)
- Tabs (some projects prefer)

**Never mix tabs and spaces!**

### Line Length

- Maximum 80-120 characters per line
- Break long lines at logical points
- Use line breaks for readability

### Whitespace

```javascript
// Space after keywords
if (condition) {
  // code
}

// Space around operators
const sum = a + b;

// No space before function parentheses
function myFunction() {
  // code
}

// Space after commas
const array = [1, 2, 3, 4];
```

---

## Comments and Documentation

### When to Comment

**DO comment:**
- Complex algorithms
- Non-obvious business logic
- Workarounds for bugs/limitations
- Public API functions
- Regular expressions
- Magic numbers

**DON'T comment:**
- Obvious code
- What the code does (code should be self-explanatory)
- Redundant information

### Comment Style

**Single-line comments:**
```javascript
// Calculate the total including tax
const total = subtotal * (1 + TAX_RATE);
```

**Multi-line comments:**
```javascript
/**
 * Calculate order total with tax and shipping
 * 
 * @param {Object} order - Order object
 * @param {number} order.subtotal - Subtotal amount
 * @param {string} order.shippingMethod - Shipping method
 * @returns {number} Total amount including tax and shipping
 */
function calculateOrderTotal(order) {
  // implementation
}
```

**TODO comments:**
```javascript
// TODO: Optimize this query for large datasets
// FIXME: Handle edge case when user has no email
// HACK: Temporary workaround until API is fixed
```

---

## Error Handling

### Try-Catch Blocks

```javascript
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Log the error
  console.error('Operation failed:', error);
  
  // Handle gracefully
  return defaultValue;
  
  // Or re-throw if can't handle
  throw new Error(`Failed to process: ${error.message}`);
}
```

### Error Messages

- Be specific about what went wrong
- Include context (what was being attempted)
- Don't expose sensitive information
- Provide actionable guidance when possible

✅ **GOOD:**
```javascript
throw new Error('Failed to fetch user profile: User ID 123 not found');
```

❌ **BAD:**
```javascript
throw new Error('Error');
```

---

## Testing Standards

### Test Structure

```javascript
describe('UserService', () => {
  describe('getUser', () => {
    it('should return user when ID exists', async () => {
      // Arrange
      const userId = 123;
      
      // Act
      const user = await UserService.getUser(userId);
      
      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBe(userId);
    });
    
    it('should throw error when ID does not exist', async () => {
      // Arrange
      const invalidId = 999;
      
      // Act & Assert
      await expect(UserService.getUser(invalidId))
        .rejects.toThrow('User not found');
    });
  });
});
```

### Test Naming

- Use descriptive test names
- Follow pattern: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks

---

## File Organization

### Module Structure

```
src/
├── components/         # Reusable components
├── services/          # Business logic
├── utils/             # Helper functions
├── models/            # Data models
├── config/            # Configuration
├── constants/         # Constants
└── index.js           # Entry point
```

### Import Order

```javascript
// 1. External dependencies
import React from 'react';
import axios from 'axios';

// 2. Internal modules
import { UserService } from './services/UserService';
import { formatDate } from './utils/date';

// 3. Styles
import './styles.css';
```

---

## Git Commit Messages

### Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Examples

✅ **GOOD:**
```
feat(auth): add password reset functionality

Implemented password reset flow with email verification.
Users can now request password reset link via email.

Closes #123
```

❌ **BAD:**
```
fixed stuff
```

---

## Code Review Checklist

### Before Submitting

- [ ] Code follows style guide
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log() or debug code
- [ ] No commented-out code
- [ ] Error handling implemented
- [ ] Edge cases considered

### When Reviewing

- [ ] Code is readable and maintainable
- [ ] Logic is sound
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed

---

## Tools and Automation

### Linters

**JavaScript/TypeScript:**
- ESLint
- Prettier

**Python:**
- pylint
- black
- flake8

**Configure these in your project!**

### Pre-commit Hooks

```bash
# Run linter before commit
npm run lint

# Run tests before commit
npm test

# Format code before commit
npm run format
```

---

## Resources

### Style Guides

- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Google Style Guides](https://google.github.io/styleguide/)
- [PEP 8 (Python)](https://pep8.org/)

### Tools

- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- [EditorConfig](https://editorconfig.org/)

---

**Remember:** Consistency is more important than perfection. Choose a style and stick to it!

