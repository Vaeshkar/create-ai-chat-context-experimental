# Technical Decisions

This file documents important technical choices and their rationale.

**Purpose:** Understand WHY we made certain decisions, not just WHAT we built.

---

## Architecture Decisions

### All-in-One Next.js App (Not Microservices)

**Decision:** Build as monolithic Next.js application  
**Date:** Early 2025  
**Rationale:**
- Simpler deployment (one seed per store)
- Easier to maintain for small team
- Faster development iteration
- Customer hosting simplicity

**Trade-offs:**
- ✅ Easier to develop and debug
- ✅ Single deployment unit
- ✅ Shared code and types
- ❌ Harder to scale horizontally
- ❌ All services coupled

**Status:** Correct choice for current scale, may revisit at 500+ stores

---

### Hybrid Data Strategy (JSON → Database)

**Decision:** Start with JSON files, migrate to database  
**Date:** Early 2025  
**Rationale:**
- Rapid prototyping without database setup
- Easy to inspect and modify data
- Version control friendly
- Transition path to production

**Current State:**
- ✅ Users: PostgreSQL (Prisma)
- ✅ Sessions: PostgreSQL
- ✅ Reservations: PostgreSQL
- ⏳ Orders: JSON files (migrating)
- ⏳ Inventory: JSON files (migrating)
- ⏳ Learning data: JSON files (staying)

**Trade-offs:**
- ✅ Fast initial development
- ✅ Easy debugging
- ❌ Not suitable for high concurrency
- ❌ Manual data management

**Next Steps:** Migrate orders and inventory to database by Q1 2026

---

### Agent-Based AI Architecture

**Decision:** Multiple specialized agents vs single LLM  
**Date:** Mid 2025  
**Rationale:**
- Better control over responses
- Lower API costs (logic agents don't call OpenAI)
- Specialized expertise per domain
- Easier to debug and improve

**Evolution:**
1. **V1:** Single LLM (too generic)
2. **V2:** 12 specialized agents (too many, high costs)
3. **V3:** 4 consolidated agents (current target)

**Final Agent Structure:**
- **OrchestratorV2:** Coordinates everything
- **UnifiedSearchAgent:** Search and recommendations
- **InventoryAgent:** Stock and availability
- **LearningAgent:** Pattern detection and improvement

**Trade-offs:**
- ✅ Lower costs (fewer API calls)
- ✅ Better control
- ✅ Specialized logic
- ❌ More complex orchestration
- ❌ More code to maintain

**Status:** Consolidation to 4 agents in progress

---

### No TypeScript `any` Types

**Decision:** Strict TypeScript, no `any` allowed  
**Date:** Project start  
**Rationale:**
- Type safety prevents bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

**Enforcement:**
- Code reviews reject `any` usage
- Proper interfaces for all data structures
- Generic types when needed

**Trade-offs:**
- ✅ Fewer runtime errors
- ✅ Better maintainability
- ❌ Slower initial development
- ❌ More verbose code

**Status:** Strictly enforced, no exceptions

---

## Data & Storage Decisions

### SessionID-Based Tracking (Not Cookies)

**Decision:** Use SessionID for guest tracking  
**Date:** Early 2025  
**Rationale:**
- GDPR compliance
- No forced registration
- Guest-to-registered transition possible
- Privacy-friendly

**Implementation:**
- Generate UUID on first visit
- Store in localStorage
- Link to user account on registration
- No personal data without consent

**Trade-offs:**
- ✅ GDPR compliant
- ✅ User-friendly
- ✅ Privacy-respecting
- ❌ Can be cleared by user
- ❌ Not cross-device

**Status:** Working well, no changes planned

---

### Learning Data in JSON (Not Database)

**Decision:** Keep learning data in JSON files  
**Date:** Mid 2025  
**Rationale:**
- Easy to inspect and debug
- Version control friendly
- Fast read/write for learning engine
- No database overhead

**Structure:**
```
data/learning/
├─ conversations.json      # 534 conversations
├─ keywords.json          # Learned keywords
├─ intents.json           # Detected intents
├─ insights.json          # Inventory insights
└─ negative-feedback.json # Problem patterns
```

**Trade-offs:**
- ✅ Easy debugging
- ✅ Fast access
- ✅ Version control
- ❌ Not suitable for millions of records
- ❌ Manual backup needed

**Status:** Staying in JSON, works well for current scale

---

## AI & Learning Decisions

### Custom Learning Engine (Not OpenAI)

**Decision:** Build custom learning system, not OpenAI-based  
**Date:** Mid 2025  
**Rationale:**
- Lower costs (no API calls for learning)
- Full control over logic
- Privacy (no data sent to OpenAI)
- Faster (no network latency)

**Features:**
- Pattern detection (≥50% confidence threshold)
- Keyword learning with automatic discovery
- Conversation outcome analysis
- Negative feedback detection

**Trade-offs:**
- ✅ Zero API costs for learning
- ✅ Full control
- ✅ Privacy-friendly
- ❌ More code to maintain
- ❌ Less sophisticated than GPT

**Status:** Working well, continuously improving

---

### Conversation Outcome Scoring

**Decision:** Score conversations as success/partial/failure  
**Date:** Mid 2025  
**Rationale:**
- Simple, actionable metric
- Easy to calculate satisfaction
- Guides learning improvements
- Tracks AI performance

**Scoring:**
- **Success (5 points):** User found what they needed
- **Partial (3 points):** User engaged but didn't complete
- **Failure (1 point):** User left unsatisfied

**Satisfaction Calculation:**
```
satisfaction = (success*5 + partial*3 + failure*1) / total
```

**Trade-offs:**
- ✅ Simple to understand
- ✅ Actionable insights
- ❌ Subjective classification
- ❌ Doesn't capture nuance

**Status:** Working well, may add more granular metrics later

---

### Keyword Confidence Threshold (50%)

**Decision:** Only learn keywords with ≥50% confidence  
**Date:** Mid 2025  
**Rationale:**
- Avoid false positives
- Focus on strong patterns
- Reduce noise in learning data
- Improve search quality

**Implementation:**
```typescript
if (keyword.confidence >= 0.5) {
  learningEngine.addKeyword(keyword);
}
```

**Trade-offs:**
- ✅ High-quality keywords
- ✅ Fewer false positives
- ❌ May miss some valid patterns
- ❌ Slower learning

**Status:** Good balance, no changes planned

---

## UI/UX Decisions

### Vercel Deployment (Not Local)

**Decision:** Deploy to Vercel for testing, not local development  
**Date:** Early 2025  
**Rationale:**
- Easier mobile testing
- Real-world performance
- Shareable URLs
- Production-like environment

**Trade-offs:**
- ✅ Mobile access
- ✅ Real performance
- ✅ Easy sharing
- ❌ Slower iteration
- ❌ Deployment costs

**Status:** Working well, preferred workflow

---

### Calm, Muted Colors (Not Bright)

**Decision:** Use calm color palette, not vibrant  
**Date:** Early 2025  
**Rationale:**
- Professional appearance
- Reduces visual fatigue
- Better for long sessions
- Matches toy store aesthetic

**Color Preferences:**
- Muted backgrounds
- Consistent border thickness
- 60% backdrop opacity for modals
- Fully rounded buttons

**Trade-offs:**
- ✅ Professional look
- ✅ Easy on eyes
- ❌ Less "exciting"
- ❌ May seem boring to some

**Status:** Dennis is happy with it, no changes

---

### Compact Product Cards (Not Fixed Height)

**Decision:** Cards adjust to content, not fixed height  
**Date:** Mid 2025  
**Rationale:**
- Better space utilization
- Accommodates varying content
- More products visible
- Cleaner layout

**Implementation:**
- 4 products per row
- Height adjusts to content
- Consistent padding
- Responsive design

**Trade-offs:**
- ✅ Better space usage
- ✅ More flexible
- ❌ Uneven row heights
- ❌ Slightly harder to scan

**Status:** Working well, users like it

---

## Payment & Commerce Decisions

### Reserve → Pickup & Pay (No Online Payment Yet)

**Decision:** Start with reservation system, add payments later  
**Date:** Early 2025  
**Rationale:**
- Simpler MVP
- Builds trust with customers
- Reduces fraud risk
- Easier compliance

**Current Flow:**
1. User reserves product
2. 12-minute timer during checkout
3. Pickup at store
4. Pay in person

**Future Plans:**
- Add Stripe integration
- Add PayPal
- Add credit card
- Keep pickup option

**Trade-offs:**
- ✅ Simpler implementation
- ✅ Lower risk
- ✅ Builds trust
- ❌ Less convenient
- ❌ May lose some sales

**Status:** Working well, payments planned for Q1 2026

---

### 12-Minute Cart Timer (Not Per-Item)

**Decision:** Single timer for checkout, not per-item  
**Date:** Mid 2025  
**Rationale:**
- Simpler UX
- Less pressure on user
- Easier to implement
- Matches user mental model

**Implementation:**
- Timer starts at checkout
- Applies to entire cart
- Clear countdown display
- Grace period on expiry

**Trade-offs:**
- ✅ Better UX
- ✅ Less stressful
- ❌ May hold inventory longer
- ❌ Potential stock issues

**Status:** Working well, no complaints

---

## Security & Compliance Decisions

### No Personal Data in Learning System

**Decision:** Anonymize all learning data  
**Date:** Early 2025  
**Rationale:**
- GDPR compliance
- Privacy-first approach
- Reduces liability
- Builds trust

**Implementation:**
- Store queries, not names
- SessionID only, no personal info
- No chat history display
- Anonymized analytics

**Trade-offs:**
- ✅ GDPR compliant
- ✅ Privacy-friendly
- ✅ Lower risk
- ❌ Less detailed insights
- ❌ Can't personalize as much

**Status:** Strictly enforced, non-negotiable

---

### Private GitHub Repository

**Decision:** Keep repo private, not open source  
**Date:** Project start  
**Rationale:**
- Protect innovative IP
- Competitive advantage
- Control over distribution
- Potential VEDES deal

**Trade-offs:**
- ✅ IP protection
- ✅ Competitive advantage
- ❌ No community contributions
- ❌ No public portfolio piece

**Status:** Staying private until VEDES decision

---

## Performance Decisions

### 2-4 Second Response Time Target

**Decision:** Maximum 4 seconds for AI responses  
**Date:** Early 2025  
**Rationale:**
- User retention critical
- Attention span limits
- Competitive advantage
- Quality perception

**Current Performance:**
- Average: ~2.1 seconds
- 95th percentile: ~3.5 seconds
- Target: <4 seconds always

**Optimizations:**
- Streaming responses
- Agent caching
- Parallel agent calls
- Optimized queries

**Trade-offs:**
- ✅ Better user experience
- ✅ Higher retention
- ❌ More complex code
- ❌ Higher infrastructure costs

**Status:** Meeting targets, continuous optimization

---

## Next Major Decisions Needed

### 1. Database Migration Timeline
- **Question:** When to migrate orders/inventory to database?
- **Considerations:** Current scale, performance needs, development time
- **Target:** Q1 2026

### 2. Payment Integration Priority
- **Question:** Which payment provider first?
- **Options:** Stripe, PayPal, credit card direct
- **Considerations:** German market preferences, fees, complexity

### 3. Multi-Store Architecture
- **Question:** How to scale to 1,500 stores?
- **Options:** Multi-tenant DB, separate instances, hybrid
- **Considerations:** Performance, cost, maintenance

---

**Last Updated:** 2025-09-30  
**Review Frequency:** After major technical decisions

