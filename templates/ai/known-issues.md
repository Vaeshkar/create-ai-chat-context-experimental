# Known Issues & Solutions

This file tracks problems encountered and their solutions.

**Purpose:** Prevent re-discovering the same issues, share solutions across chat sessions.

---

## Active Issues

### None Currently

All known issues have been resolved. New issues will be added here as they're discovered.

---

## Resolved Issues

### Issue #1: learningStorage.loadAll() Method Not Found

**Date:** 2025-09-30  
**Severity:** High (API breaking)  
**Status:** ✅ Resolved

**Problem:**
```typescript
// This doesn't exist:
const data = await learningStorage.loadAll();
// TypeError: learningStorage.loadAll is not a function
```

**Root Cause:**
- Incorrect method name used in `/api/admin/ai/stats`
- Actual method is `loadLearningData()`, not `loadAll()`

**Solution:**
```typescript
// Correct usage:
const data = await learningStorage.loadLearningData();
```

**Files Changed:**
- `src/app/api/admin/ai/stats/route.ts`

**Commit:** `c568fb7`

**Prevention:**
- Check `learning-storage.ts` for correct method names
- Use TypeScript autocomplete
- Test API endpoints after changes

---

### Issue #2: Dashboard Showing Mock Data

**Date:** 2025-09-30  
**Severity:** Medium (misleading metrics)  
**Status:** ✅ Resolved

**Problem:**
- Dashboard displayed fake AI statistics
- Hardcoded conversation counts, satisfaction scores
- No connection to real data

**Root Cause:**
- `/api/admin/ai/stats` returned mock data
- Never connected to learning storage

**Solution:**
- Connected API to `learningStorage.loadLearningData()`
- Calculate real metrics from conversation outcomes
- Analyze actual conversation patterns

**Files Changed:**
- `src/app/api/admin/ai/stats/route.ts` (140 → 194 lines)

**Commits:** `e1ab839`, `c568fb7`

**Result:**
- Dashboard now shows real data from 534 conversations
- Accurate satisfaction scores
- Real language distribution
- Actual top questions

---

### Issue #3: GDPR Violation in AI Chat Tab

**Date:** 2025-09-30  
**Severity:** Critical (legal risk)  
**Status:** ✅ Resolved

**Problem:**
- Admin Analytics had "AI Chat" tab
- Displayed customer names and conversation history
- No consent, no encryption
- GDPR violation

**Root Cause:**
- Feature built for monitoring without considering privacy
- Mock data included personal information

**Solution:**
- Removed entire AI Chat tab (209 lines)
- Deleted all mock customer data
- Use Learning Engine for anonymized insights instead

**Files Changed:**
- `src/app/admin/analytics/page.tsx`

**Commit:** `34b2f10`

**Prevention:**
- Always consider GDPR before displaying user data
- Use anonymized data for analytics
- No personal data without explicit consent

---

### Issue #4: Redundant Site Analytics Tab

**Date:** 2025-09-30  
**Severity:** Low (code quality)  
**Status:** ✅ Resolved

**Problem:**
- Analytics page had "Site Analytics" tab
- Duplicated Dashboard metrics (revenue, orders, products)
- 234 lines of redundant code
- Confusing for users (where to find metrics?)

**Root Cause:**
- Poor separation of concerns
- Dashboard and Analytics both showing business metrics

**Solution:**
- Removed Site Analytics tab entirely
- Renamed page to "AI Analytics" (focused purpose)
- Removed tab navigation (only one section now)

**Files Changed:**
- `src/app/admin/analytics/page.tsx` (496 → 96 lines, 80% reduction)
- `src/components/admin/DashboardLayout.tsx` (navigation label)

**Commit:** `688a961`

**Result:**
- Clear architecture: Dashboard = overview, AI Analytics = deep dive
- 400+ lines of code removed
- Better user experience

---

### Issue #5: AI Learning & Data Lifecycle in Wrong Place

**Date:** 2025-09-30  
**Severity:** Low (architecture)  
**Status:** ✅ Resolved

**Problem:**
- AI Learning System dashboard in Settings/AI
- Data Lifecycle Management in Settings/AI
- These are performance metrics, not settings

**Root Cause:**
- Initial placement without considering purpose
- Settings = configuration, Analytics = monitoring

**Solution:**
- Moved both dashboards to Analytics/AI
- Cleaned up Settings/AI page (removed 66 lines)

**Files Changed:**
- `src/app/admin/settings/ai/page.tsx`
- `src/app/admin/analytics/page.tsx`

**Commit:** `c1b2681`

**Result:**
- Better separation: Settings (config) vs Analytics (metrics)
- More intuitive navigation

---

## Common Pitfalls

### 1. Using `any` Type in TypeScript

**Problem:** Lazy typing breaks type safety

**Solution:**
```typescript
// ❌ Bad:
const data: any = await fetchData();

// ✅ Good:
interface DataResponse {
  id: string;
  name: string;
  value: number;
}
const data: DataResponse = await fetchData();
```

**Enforcement:** Code reviews reject `any` usage

---

### 2. Forgetting to Check Method Names

**Problem:** Assuming method names without checking

**Solution:**
- Always check the actual class/module
- Use TypeScript autocomplete
- Read the interface/type definitions

**Example:**
```typescript
// Check learning-storage.ts first!
// ❌ Wrong: learningStorage.loadAll()
// ✅ Correct: learningStorage.loadLearningData()
```

---

### 3. Hardcoding Mock Data in APIs

**Problem:** Mock data makes it to production

**Solution:**
- Always connect to real data sources
- Use environment flags for mock data if needed
- Document when data is mocked

**Example:**
```typescript
// ❌ Bad:
const stats = { totalConversations: 1247 }; // hardcoded

// ✅ Good:
const conversations = await learningStorage.loadLearningData();
const stats = { totalConversations: conversations.length };
```

---

### 4. Displaying Personal Data Without Consent

**Problem:** GDPR violations

**Solution:**
- Never display personal data in admin panels
- Use anonymized data for analytics
- SessionID only, no names/emails
- Get explicit consent before storing personal info

**Example:**
```typescript
// ❌ Bad:
{ name: "John Doe", message: "I want LEGO" }

// ✅ Good:
{ sessionId: "abc123", query: "I want LEGO", outcome: "success" }
```

---

## Debugging Tips

### 1. API Route Errors

**Check:**
1. Console logs in API route
2. Network tab in browser DevTools
3. Vercel deployment logs
4. TypeScript compilation errors

**Common Issues:**
- Wrong method names
- Missing imports
- Type mismatches
- Async/await errors

---

### 2. Learning Storage Issues

**Check:**
1. File exists: `data/learning/conversations.json`
2. File is valid JSON
3. Correct method name: `loadLearningData()`
4. Proper error handling

**Common Issues:**
- File not found
- JSON parse errors
- Method name typos
- Missing await

---

### 3. Agent Orchestration Issues

**Check:**
1. Agent is registered in orchestrator
2. Agent has correct interface
3. Orchestration rules are correct
4. Error handling in place

**Common Issues:**
- Agent not found
- Wrong agent called
- Missing error handling
- Timeout issues

---

## Performance Issues

### None Currently

Performance is meeting targets (2-4 second response time). Will document issues here if they arise.

---

## Future Concerns

### 1. Scaling to 1,500 Stores

**Potential Issues:**
- Database performance with millions of products
- API rate limits
- Memory usage
- Response time degradation

**Mitigation:**
- Hot cache strategy (50MB for 10K items)
- Database indexing
- Query optimization
- Load testing before rollout

---

### 2. Learning Data Growth

**Potential Issues:**
- JSON files getting too large
- Slow read/write operations
- Memory issues

**Mitigation:**
- Archive old conversations
- Implement data retention policies
- Consider database migration for learning data
- Monitor file sizes

---

### 3. API Cost Management

**Potential Issues:**
- OpenAI API costs with 1,500 stores
- Unexpected usage spikes
- Budget overruns

**Mitigation:**
- Agent consolidation (12 → 4)
- Caching strategies
- Rate limiting
- Usage monitoring

---

## How to Report New Issues

### Template:

```markdown
### Issue #X: Brief Title

**Date:** YYYY-MM-DD
**Severity:** Critical/High/Medium/Low
**Status:** 🔴 Active / ✅ Resolved

**Problem:**
- What's broken?
- What's the error message?
- When does it happen?

**Root Cause:**
- Why is this happening?
- What's the underlying issue?

**Solution:**
- How to fix it?
- Code examples if applicable

**Files Changed:**
- List of modified files

**Commit:** Git hash

**Prevention:**
- How to avoid this in the future?
```

---

**Last Updated:** 2025-09-30  
**Review Frequency:** After resolving issues

