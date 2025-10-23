# Code Style Guide - Toy Store AI System

**Last Updated:** 2025-10-21 (Q4 2025)
**Status:** ✅ Active - Mentor-Approved Standards

---

## 🎯 Core Philosophy

**Less is more. Don't bloat. Don't over-engineer.**

### Design Principles

1. ✅ **Simplicity first** - Solve the problem, don't build a framework
2. ✅ **YAGNI** - You Aren't Gonna Need It (no "just in case" features)
3. ✅ **Minimal abstractions** - Only abstract when you have 3+ similar cases
4. ✅ **Delete code aggressively** - Less code = fewer bugs
5. ✅ **Avoid premature optimization** - Make it work, then make it fast (if needed)
6. ✅ **Question every dependency** - Each package adds maintenance burden
7. ✅ **Prefer boring solutions** - Proven patterns over clever tricks

**Remember:** Every line of code is a liability. Write less, maintain less, ship faster.

### Communication Style

- Brief status updates (3-5 lines max)
- Key metrics only (e.g., "96/102 tests passing")
- No detailed breakdowns unless requested
- No excessive emoji or celebration text

---

## 🎯 Q4 2025 Standards (Non-Negotiable)

1. ✅ **TypeScript strict mode** - No `any` types allowed
2. ✅ **ESM imports only** - No CommonJS `require()`
3. ✅ **Node.js 20+** - Latest LTS features
4. ✅ **Result types** - Type-safe error handling, no throwing
5. ✅ **Pure functions** - Testable, no side effects
6. ✅ **Functions < 50 lines** - Split larger functions
7. ✅ **Next.js 15 App Router** - Server Components by default
8. ✅ **React 19** - Modern hooks and patterns

---

## Code Quality Tools

### Prettier (Code Formatting)

**Configuration:** `.prettierrc.json`

**Run before every commit:**

```bash
npm run format
```

**What it does:**

- ✅ Enforces consistent code formatting
- ✅ Removes debates about style (tabs vs spaces, semicolons, etc.)
- ✅ Auto-fixes formatting issues
- ✅ Integrates with VSCode/editors for format-on-save

**Rules:**

- Single quotes for strings
- 2-space indentation
- Trailing commas in multi-line objects/arrays
- Line width: 100 characters
- Semicolons: required

**Pre-commit hook:**

```bash
# Add to .husky/pre-commit or package.json
npm run format && git add -u
```

---

### ESLint (Code Quality)

**Configuration:** `eslint.config.js`

**Run before every commit:**

```bash
npm run lint
```

**What it does:**

- ✅ Catches bugs and code smells
- ✅ Enforces TypeScript best practices
- ✅ Prevents `any` types
- ✅ Detects unused variables
- ✅ Validates import/export patterns

**Critical Rules:**

- `@typescript-eslint/no-explicit-any: error` - No `any` types allowed
- `@typescript-eslint/no-unused-vars: error` - No unused variables (prefix with `_` if intentional)
- `no-console: warn` - Use proper logging instead of console.log
- `prefer-const: error` - Use `const` when variable isn't reassigned

**Zero tolerance policy:**

- ❌ **No ESLint errors allowed in production code**
- ⚠️ **Warnings should be fixed before PR merge**
- ✅ **All code must pass `npm run lint` with zero errors**

**Pre-commit hook:**

```bash
# Add to .husky/pre-commit or package.json
npm run lint || exit 1
```

---

### Testing (Vitest)

**Configuration:** `vitest.config.ts`

**Run tests:**

```bash
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage report
```

**What it does:**

- ✅ Validates code correctness
- ✅ Prevents regressions
- ✅ Documents expected behavior
- ✅ Enables confident refactoring

**Requirements:**

- ✅ **All new features must have tests**
- ✅ **All bug fixes must have regression tests**
- ✅ **Test coverage > 80%** for production code
- ✅ **All tests must pass before PR merge**

**Test file naming:**

- Unit tests: `*.test.ts` (e.g., `UserService.test.ts`)
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

**Test structure:**

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = createTestInput();

      // Act
      const result = methodName(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

**Pre-commit hook:**

```bash
# Add to .husky/pre-commit or package.json
npm test || exit 1
```

---

### Complete Pre-Commit Workflow

**Recommended `.husky/pre-commit` hook:**

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Format code
echo "📝 Formatting code..."
npm run format || exit 1

# 2. Lint code
echo "🔎 Linting code..."
npm run lint || exit 1

# 3. Run tests
echo "🧪 Running tests..."
npm test || exit 1

echo "✅ All checks passed!"
```


**This ensures:**

- ✅ Code is properly formatted
- ✅ No linting errors
- ✅ All tests pass
- ✅ Production-ready code only

---

## TypeScript Standards

### 🚫 NEVER USE `any` TYPE

**Most important rule in this codebase.**

❌ **Wrong:**

```typescript
function processData(data: any) {
  return data.map((item: any) => item.name);
}
```

✅ **Correct:**

```typescript
interface DataItem {
  name: string;
  id: number;
}

function processData(data: DataItem[]): string[] {
  return data.map((item) => item.name);
}
```

### Alternatives to `any`

**Unknown types:** Use `unknown` + type guards

```typescript
function processUnknown(data: unknown): string {
  if (typeof data === 'string') return data.toUpperCase();
  throw new Error('Expected string');
}
```

**Partial objects:** Use `Partial<T>`

```typescript
function updateProduct(id: string, updates: Partial<Product>) {
  // TypeScript knows updates can have any Product property
}
```

**Generic types:** Use generics

```typescript
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}
```

### Interface vs Type

**Prefer interfaces for objects:**

```typescript
interface User {
  id: string;
  name: string;
}
```

**Use types for unions/intersections:**

```typescript
type Status = 'pending' | 'active' | 'inactive';
type UserWithRole = User & { role: string };
```

### Strict Mode Required

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

---

## Function Size & Architecture

### The 50-Line Rule

**Keep functions under 50 lines.** If longer, split into smaller focused functions.

**Why:**

- Easier to test
- Easier to understand
- Easier for AI to reason about
- Single responsibility principle

❌ **Too long (82 lines):**

```typescript
function searchProducts(query: string) {
  // 82 lines of mixed logic
  // Validation + parsing + filtering + scoring + sorting
}
```

✅ **Split into focused functions:**

```typescript
function searchProducts(query: string): Result<Product[]> {
  const validated = validateQuery(query);
  if (!validated.ok) return validated;

  const parsed = parseQuery(validated.value);
  const filtered = filterProducts(parsed);
  const scored = scoreProducts(filtered, parsed);

  return { ok: true, value: sortByScore(scored) };
}

function validateQuery(query: string): Result<string> {
  if (!query.trim()) return { ok: false, error: new Error('Empty query') };
  return { ok: true, value: query.trim() };
}

function parseQuery(query: string): ParsedQuery {
  // 15 lines
}

function filterProducts(parsed: ParsedQuery): Product[] {
  // 20 lines
}
```

**Each function < 50 lines, single responsibility, testable.**

---

## Error Handling

### Use Result Types (No Throwing)

❌ **Don't throw:**

```typescript
function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
```

✅ **Return Result:**

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

function divide(a: number, b: number): Result<number> {
  if (b === 0) return { ok: false, error: new Error('Division by zero') };
  return { ok: true, value: a / b };
}

// Usage
const result = divide(10, 2);
if (result.ok) {
  console.log(result.value); // 5
} else {
  console.error(result.error.message);
}
```

**Why Result types:**

- Type-safe error handling
- Explicit error handling at call sites
- No silent failures
- No try/catch blocks

---

## Testability

### Pure Functions

**Pure functions are testable functions.**

✅ **Pure (testable):**

```typescript
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// Easy to test
expect(calculateTotal([{ price: 10, quantity: 2 }])).toBe(20);
```

❌ **Impure (hard to test):**

```typescript
function calculateTotal() {
  const items = getCartFromDatabase(); // Side effect
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

### Dependency Injection

**Inject dependencies, don't import them.**

✅ **Testable:**

```typescript
function processOrder(order: Order, emailService: EmailService) {
  // Can mock emailService in tests
  emailService.send(order.email, 'Order confirmed');
}
```

❌ **Not testable:**

```typescript
import { sendEmail } from './email-service';

function processOrder(order: Order) {
  // Can't mock sendEmail
  sendEmail(order.email, 'Order confirmed');
}
```

---

## File Naming

### Components

- `PascalCase.tsx` - React components
- `kebab-case.tsx` - Non-component files

### API Routes

- `route.ts` - Next.js 15 App Router
- `[id]/route.ts` - Dynamic routes

### Tests

- `*.test.ts` - Unit tests
- `*.test.tsx` - Component tests

---

## React Best Practices

### Server Components by Default

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const products = await fetchProducts(); // Server-side
  return <ProductList products={products} />;
}
```

### Client Components Only When Needed

```typescript
'use client'; // Only when you need interactivity

export function AddToCartButton() {
  const [loading, setLoading] = useState(false);
  // ...
}
```

### Hooks Rules

- Only call hooks at top level
- Only call hooks in React functions
- Use `useCallback` for functions passed to children
- Use `useMemo` for expensive calculations

---

## API Routes

### Structure

```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  const products = await db.product.findMany();
  return Response.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const product = await db.product.create({ data: body });
  return Response.json(product, { status: 201 });
}
```

### Error Handling

```typescript
export async function GET(request: Request) {
  try {
    const products = await db.product.findMany();
    return Response.json(products);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
```

---

## Git Commits

### Format

```
type(scope): subject

body (optional)
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### Examples

```
feat(cart): Add quantity selector
fix(search): Handle empty queries
docs: Update README with setup instructions
refactor(agents): Split 82-line function into 9 functions
```

---

## Security

### Input Validation

**Always validate user input.**

```typescript
function createProduct(data: unknown): Result<Product> {
  if (!isValidProduct(data)) {
    return { ok: false, error: new Error('Invalid product data') };
  }
  return { ok: true, value: data };
}
```

### Environment Variables

**Never commit secrets.**

```typescript
// ✅ Good
const apiKey = process.env.API_KEY;

// ❌ Bad
const apiKey = 'sk-1234567890';
```

---

## Summary

### Key Principles

1. **Less is more** - Don't bloat, don't over-engineer
2. **No `any` types** - TypeScript strict mode always
3. **Functions < 50 lines** - Split larger functions
4. **Result types** - No throwing errors
5. **Pure functions** - Testable, no side effects
6. **Simplicity first** - Solve the problem, don't build a framework

**Quality over speed.** Better to do it right first time than spend hours cleaning up.

---

**End of Code Style Guide**
