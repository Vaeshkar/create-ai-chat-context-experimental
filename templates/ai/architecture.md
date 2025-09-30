# System Architecture

**Last Updated:** 2025-09-30
**Status:** Production-ready, actively evolving

---

## Overview

Toy Store AI System is an autonomous e-commerce platform with AI-powered customer service for small toy stores. Designed to scale to 1,500+ stores (VEDES network).

**Core Philosophy:** AI-first, autonomous, self-learning, GDPR-compliant

---

## Tech Stack

### Frontend

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (strict mode, no `any` types)
- **Styling:** Tailwind CSS
- **State:** Zustand (with persist middleware)
- **UI Components:** Radix UI, Lucide icons

### Backend

- **Runtime:** Node.js
- **API:** Next.js API routes
- **Database:** PostgreSQL (Prisma ORM)
- **Data Storage:** Hybrid (JSON files → Database migration in progress)

### AI/ML

- **LLM:** OpenAI GPT-4 (streaming responses)
- **Architecture:** Multi-agent orchestration (12 agents → consolidating to 4)
- **Learning:** Custom learning engine with pattern detection

### Infrastructure

- **Hosting:** Vercel (preferred for testing/mobile access)
- **Version Control:** Git (private GitHub repo)
- **Deployment:** CI/CD via Vercel

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │  Store   │  │  Admin   │  │  Chat Interface      │   │
│  │  Pages   │  │  Panel   │  │  (Toby AI)           │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  API Layer (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Products │  │  Orders  │  │  AI Chat             │   │
│  │ API      │  │  API     │  │  API                 │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
┌───────▼────────┐         ┌────────▼──────────────────┐
│   Database     │         │   AI Agent System         │
│   (Prisma)     │         │                           │
│                │         │  ┌─────────────────────┐  │
│ - Users        │         │  │  OrchestratorV2     │  │
│ - Orders       │         │  │  (Conductor)        │  │
│ - Reservations │         │  └──────────┬──────────┘  │
│ - Sessions     │         │             │             │
└────────────────┘         │  ┌──────────▼──────────┐  │
                           │  │  Specialized Agents │  │
                           │  │                     │  │
                           │  │  - SearchAgent      │  │
                           │  │  - ProductAgent     │  │
                           │  │  - InventoryAgent   │  │
                           │  │  - LearningAgent    │  │
                           │  └─────────────────────┘  │
                           │                           │
                           │  ┌─────────────────────┐  │
                           │  │  Learning Engine    │  │
                           │  │  (Self-improving)   │  │
                           │  └─────────────────────┘  │
                           └───────────────────────────┘
```

---

## Agent Architecture

### Current State (Consolidating)

- **From:** 12 agents (too many, high API costs)
- **To:** 4 agents (optimal balance)

### Target Agent Structure

#### 1. **OrchestratorV2** (Conductor)

- **Role:** Coordinates all other agents
- **Responsibilities:**
  - Route user queries to appropriate agents
  - Combine responses from multiple agents
  - Manage conversation flow
  - Handle error recovery

#### 2. **UnifiedSearchAgent** (Search & Discovery)

- **Role:** Product search and recommendations
- **Responsibilities:**
  - Fuzzy matching and synonyms
  - Compound query handling
  - Context-aware search
  - Product recommendations

#### 3. **InventoryAgent** (Stock & Availability)

- **Role:** Inventory management
- **Responsibilities:**
  - Stock level checking
  - Availability queries
  - Low stock alerts
  - Supplier information

#### 4. **LearningAgent** (Intelligence)

- **Role:** System improvement
- **Responsibilities:**
  - Pattern detection
  - Keyword learning
  - Conversation analysis
  - Negative feedback detection

---

## Data Flow

### User Query Flow

```
1. User sends message
   ↓
2. OrchestratorV2 receives query
   ↓
3. Orchestrator analyzes intent
   ↓
4. Routes to appropriate agent(s)
   ↓
5. Agent(s) process and respond
   ↓
6. Orchestrator combines responses
   ↓
7. LearningAgent records interaction
   ↓
8. Response sent to user
```

### Learning Flow

```
1. Conversation completes
   ↓
2. LearningAgent analyzes outcome
   ↓
3. Extracts patterns and keywords
   ↓
4. Updates learning data (batched)
   ↓
5. Flushes to disk periodically
   ↓
6. Future queries benefit from learning
```

---

## Key Design Decisions

### 1. **All-in-One Next.js App**

- **Decision:** Monolith over microservices
- **Rationale:** Simpler deployment, one seed per store
- **Trade-off:** Easier to maintain, harder to scale horizontally

### 2. **Hybrid Data Strategy**

- **Decision:** JSON files → Database migration
- **Rationale:** Fast prototyping, transition to production
- **Current:** Orders and inventory in JSON, users in DB

### 3. **Agent-Based AI Architecture**

- **Decision:** Multiple specialized agents vs single LLM
- **Rationale:** Better control, lower costs, specialized logic
- **Evolution:** 12 agents → 4 agents (consolidation in progress)

### 4. **No Online Payment (Yet)**

- **Decision:** Reserve → Pickup & Pay at store
- **Rationale:** Simpler MVP, builds trust
- **Future:** Add Stripe, PayPal, credit card

### 5. **SessionID-Based Tracking**

- **Decision:** SessionID for guests, accounts optional
- **Rationale:** GDPR compliance, no forced registration
- **Benefit:** Guest-to-registered transition possible

---

## Performance Requirements

### Response Time

- **Target:** 2-4 seconds maximum
- **Current:** ~2.1 seconds average
- **Critical:** User retention depends on speed

### Scalability

- **Target:** 1,500 stores (VEDES network)
- **Challenge:** Millions of products
- **Solution:** Hot cache (50MB for 10K items), Big O optimization

### Data Transfer

- **Target:** Minimal data transfer
- **Strategy:** Compact product cards, lazy loading
- **Optimization:** Only send what's needed

---

## Security & Compliance

### GDPR Compliance

- ✅ No personal data storage without consent
- ✅ SessionID-based tracking
- ✅ No chat history display in admin
- ✅ Anonymized learning data
- ✅ Data retention policies

### Authentication

- **System:** NextAuth.js
- **Providers:** Email/password, magic links
- **Roles:** SUPER_ADMIN, STORE_OWNER, STORE_STAFF, CUSTOMER

### API Security

- **OpenAI Key:** Environment variable, never committed
- **Rate Limiting:** Implemented on API routes
- **Input Validation:** All user inputs sanitized

---

## File Structure

```
toy-store-unified/
├─ src/
│  ├─ app/                    # Next.js pages
│  │  ├─ admin/              # Admin panel
│  │  ├─ api/                # API routes
│  │  └─ [store]/            # Store pages
│  ├─ components/            # React components
│  ├─ lib/                   # Utilities
│  │  ├─ agents/            # AI agents
│  │  ├─ learning/          # Learning engine
│  │  └─ database/          # Data managers
│  └─ stores/               # Zustand stores
├─ data/                     # JSON data storage
│  ├─ learning/             # Learning data
│  ├─ orders/               # Order data
│  └─ inventory/            # Product data
├─ prisma/                   # Database schema
└─ .ai/                      # AI knowledge base (this directory)
```

---

## Next Evolution

### Immediate (Q4 2025)

- ✅ Consolidate to 4 agents
- ✅ Complete dashboard with real data
- ⏳ Migrate orders to database
- ⏳ Optimize learning engine

### Short-term (Q1 2026)

- Add payment integration (Stripe, PayPal)
- Implement email threads for registered users
- Enhanced analytics and reporting
- Mobile app (React Native)

### Long-term (2026+)

- Scale to VEDES network (1,500 stores)
- Multi-language support (German, English, Dutch)
- Advanced AI features (voice, image recognition)
- Franchise management system

---

**For detailed agent orchestration, see `agent-orchestration.md`**
**For technical decisions, see `technical-decisions.md`**
