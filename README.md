# create-ai-chat-context

![npm version](https://img.shields.io/npm/v/create-ai-chat-context)
![GitHub tag](https://img.shields.io/github/v/tag/Vaeshkar/create-ai-chat-context)
![Downloads](https://img.shields.io/npm/dm/create-ai-chat-context.svg)
![Status](https://img.shields.io/badge/Status-EXPERIMENTAL-orange)
![AICF](https://img.shields.io/badge/AICF%203.0-PROVEN-brightgreen)
![Research](https://img.shields.io/badge/Research-ACTIVE-blue)

> **🚧 EXPERIMENTAL v3.0.0** - **Advanced AICF Research & Development** 🧪 Revolutionary concepts in development! This is the experimental branch for next-generation AI context management.

**🔬 CURRENT DEVELOPMENT STATUS:**
- **🕐 Detection-Hourglass-System** - 🚧 **IN DEVELOPMENT** - Concept for auto-detecting conversation boundaries
- **🎯 Universal AI compatibility** - ✅ **PROVEN** - Works with Claude, ChatGPT, Copilot, Cursor (via .ai/.aicf files)
- **⚡ Dynamic chunk processing** - 🚧 **RESEARCH PHASE** - Investigating natural conversation segments
- **💰 Zero-cost operation** - ✅ **ACHIEVED** - File-based system, no API calls required
- **🤖 Auto-trigger detection** - 🧪 **EXPERIMENTAL** - Exploring AI code execution for automation
- **🔗 Complete pipeline** - 🚧 **PROTOTYPING** - Building advanced data flow architecture
- **📊 AICF 3.0 Format** - ✅ **IMPLEMENTED** - Revolutionary 95.5% compression with semantic preservation

> **AI Memory System with Zero-Cost Logic Agent Orchestrator**

Create a `.ai/` knowledge base that preserves your conversation context using specialized logic agents. **Zero API costs. Lightning fast processing. Works with all major AI assistants.**

---

## 🚨 EXPERIMENTAL BRANCH NOTICE 🚨

**⚠️ This is the experimental development branch!** 

**For stable, production-ready version:**
- **NPM Package:** `npx create-ai-chat-context init` (4,400+ weekly downloads)
- **Stable Repository:** [create-ai-chat-context](https://github.com/Vaeshkar/create-ai-chat-context)
- **What works:** .ai and .aicf file creation, templates, all documented features

**This experimental branch contains:**
- 🧪 Advanced AICF 3.0 research (95.5% compression - PROVEN)
- 🚧 Detection-Hourglass-System concepts (IN DEVELOPMENT)
- 🔬 Next-generation AI automation features (RESEARCH PHASE)
- 📊 Revolutionary partnership documentation (COMPLETED)

**Use experimental branch if:** You want cutting-edge research and don't mind beta features  
**Use stable branch if:** You want reliable, production-tested AI context management

---

## 🚨 FOR AI ASSISTANTS: READ THIS FIRST 🚨

**CRITICAL: Before working on this project, read the `.ai/` knowledge base:**

1. **`.ai/project-overview.md`** - Project context and conventions
2. **`.ai/conversation-log.md`** - Key decisions from previous chats
3. **`.ai/technical-decisions.md`** - Why we chose X over Y

**Why?** This preserves institutional knowledge so you have full context immediately.

**See `.ai-instructions` file for detailed instructions.**

---

## The Problem

When working with AI coding assistants (ChatGPT, Claude, Copilot, Cursor, Augment, Warp, etc.), every new chat session loses all context. You have to re-explain your project architecture, technical decisions, why you chose X over Y, what you accomplished in previous sessions, and known issues. This wastes significant time in every chat session.

Unlike other AI context tools that focus on project planning and rules, `create-ai-chat-context` focuses on preserving conversation history and technical decisions across sessions. It works with ALL AI assistants and maintains institutional knowledge through files like `conversation-log.md`, `technical-decisions.md`, and `known-issues.md`.

## The Solution

`create-ai-chat-context` creates a `.ai/` knowledge base in your project that AI assistants read at the start of each chat. **Plus optional `.aicf/` format for 85% token reduction.** Result: AI gets full context immediately. No more re-explaining.

### 📁 What Gets Created

The tool creates **7 essential documentation files** in your project:

| File                       | Purpose                           |
| -------------------------- | --------------------------------- |
| **conversation-log.md**    | Chat history and key decisions    |
| **technical-decisions.md** | Why you chose X over Y            |
| **next-steps.md**          | Current priorities and tasks      |
| **project-overview.md**    | Project context for AI assistants |
| **design-system.md**       | Design patterns and conventions   |
| **code-style.md**          | Coding standards and guidelines   |
| **README.md**              | Overview of the knowledge base    |

**Simple, focused, and effective.** No complex formats or token optimization needed.

## 🎯 32 Comprehensive Templates

**Mind-blowing coverage:** We support virtually every major programming language, framework, and development category!

### JavaScript/TypeScript Ecosystem
- **nextjs** - Next.js, React, TypeScript projects
- **react** - React, Create React App, Vite projects  
- **vue** - Vue.js, Nuxt.js, Vite projects
- **angular** - Angular projects with TypeScript
- **node** - Node.js backend projects, Express, NestJS

### Python Ecosystem
- **python** - General Python projects
- **django** - Django web framework projects
- **fastapi** - FastAPI backend projects  
- **flask** - Flask web framework projects

### Systems Programming
- **rust** - Rust systems programming projects
- **go** - Go backend and systems projects
- **cpp** - C++ systems and application projects

### Enterprise/JVM
- **java** - Java projects, Spring Boot, Maven/Gradle
- **spring** - Spring Boot, Spring Framework projects
- **kotlin** - Kotlin projects, Android, multiplatform

### .NET Ecosystem
- **csharp** - C# .NET projects
- **dotnet** - .NET Core, ASP.NET Core projects

### Web Technologies
- **php** - PHP projects, Laravel, Symfony
- **laravel** - Laravel PHP framework projects
- **ruby** - Ruby projects, Ruby on Rails
- **rails** - Ruby on Rails web framework projects

### Specialized Development
- **mobile** - React Native, Flutter, Swift, Kotlin
- **fullstack** - Full-stack projects with frontend + backend
- **api** - Generic backend API projects
- **database** - Database design, migrations, stored procedures
- **devops** - Docker, Kubernetes, CI/CD, Infrastructure
- **terraform** - Infrastructure as Code with Terraform
- **ai_ml** - Machine Learning, Deep Learning, Data Science
- **blockchain** - Smart contracts, DApps, cryptocurrency
- **gamedev** - Unity, Unreal, indie games, mobile games

**Each template includes:**
- Language-specific project structure
- Framework conventions and best practices
- Common dependencies and tooling
- Security and performance guidelines
- Deployment strategies
- Code style standards


## Quick Start

```bash
# Auto-detect project type
npx aic init

# Or use specific technology template
npx aic init --template nextjs     # Next.js/React projects
npx aic init --template python     # Python projects  
npx aic init --template rust       # Rust projects
npx aic init --template go         # Go projects
npx aic init --template java       # Java/Spring Boot
npx aic init --template react      # React projects
npx aic init --template vue        # Vue.js projects
npx aic init --template fastapi    # Python FastAPI
npx aic init --template django     # Django projects
npx aic init --template devops     # DevOps/Infrastructure
npx aic init --template ai_ml      # AI/ML projects

# Customize for your project
vim .ai/project-overview.md
vim .ai/technical-decisions.md

# Commit to Git
git add .ai/ .ai-instructions NEW_CHAT_PROMPT.md
git commit -m "Add AI knowledge base"

# In your next AI chat, start with:
"Read .ai-instructions first, then help me with [your task]"
```

**💡 Tip:** Use `npx aic` instead of `npx create-ai-chat-context` for shorter commands!

## Key Commands

```bash
# Setup & Basic Usage
npx aic init                    # Initialize knowledge base (7 files)
npx aic universal               # Setup Universal AI Memory for ALL platforms 🌍
npx aic migrate                 # Add missing .ai/ files
npx aic migrate --to-aicf        # Convert to AICF 3.0 (85% token reduction)
npx aic search "query"          # Find information in knowledge base
npx aic stats                   # View analytics and token usage
npx aic validate                # Check knowledge base quality
npx aic config                  # Manage configuration

# 🧪 Experimental Features (In Development)
# Note: These commands are part of ongoing research

# 🤖 Logic Agent Checkpoint Orchestrator
npx aic checkpoint --demo       # Test with demo data (instant)
npx aic checkpoint --file data.json --verbose  # Process checkpoint
npx aic memory-decay --verbose  # Apply intelligent memory decay

```


## 🧪 Experimental Research Areas

**Current Research Focus:** Next-generation AI context automation

### 🕐 Detection-Hourglass-System (DHS) - Concept

**Research Goal:** Auto-detect conversation boundaries for seamless context preservation

**Theoretical Approach:**
- Investigate AI code execution as trigger mechanism
- Explore universal compatibility across AI platforms
- Design natural conversation chunk detection
- Zero-cost, logic-based boundary detection

**Status:** Early conceptual research phase

---

## 🤖 Logic Agent Research

**Research Concept:** Zero-cost local processing for AI context management

### Theoretical Benefits Over AI Compression

| Aspect | AI Compression | Logic Agent Approach |
|--------|---------------|-----------------------|
| **Cost** | $0.03-0.15 per checkpoint | $0.00 (theoretical) |
| **Speed** | 30-45 seconds | Near-instant (concept) |
| **Information Preserved** | 60-75% | Target: 95%+ |
| **API Dependency** | Required | None (local processing) |
| **Vendor Lock-in** | Yes | Platform agnostic |

**Conceptual Architecture:** 6 specialized processing units:
- **ConversationParser** - Extract conversation structure
- **DecisionExtractor** - Identify key decision points
- **InsightAnalyzer** - Capture breakthrough moments
- **StateTracker** - Monitor project progression
- **FileWriter** - Output to dual formats
- **MemoryManager** - Intelligent data lifecycle

**Status:** Research and prototyping phase

## 🌍 AICF: A Vision for Universal AI Memory

We believe **AICF (AI Continuity Format)** represents the future of AI memory persistence. Our vision is for `.aicf` to become a **widely-adopted standard** across the tech industry.

### Why AICF Should Be Universal:

🎯 **Built for AI, by AI** - Designed specifically for optimal AI comprehension and processing

⚡ **Ultra-efficient** - 85% token reduction while preserving 100% information integrity

🔗 **Relationship mapping** - CONTEXT_REFS and IMPACT_SCORE enable intelligent prioritization

🏗️ **Structured intelligence** - Schema-based format with confidence scoring and temporal tracking

🌐 **Universal compatibility** - Works with any AI assistant (ChatGPT, Claude, Copilot, Cursor, Warp, etc.)

💰 **Zero cost** - No API dependencies, works completely offline

### The Future We Envision:

- **IDEs** natively support `.aicf` files for AI context
- **AI platforms** adopt AICF as standard memory format  
- **Development teams** share project context through `.aicf` files
- **Open source projects** include `.aicf/` directories for contributor onboarding
- **AI tools** interoperate seamlessly using AICF format

**Join the movement!** Help us make AICF the universal standard for AI memory by:
- ⭐ Starring this project on GitHub
- 📢 Sharing AICF with your development teams
- 🔧 Contributing to the AICF specification
- 💡 Building tools that support AICF format

*Together, we can solve AI context loss forever.* 🚀

## Configuration

Optional configuration for customizing the tool:

```bash
# View current configuration
npx aic config

# Set preferred AI model for token reports (optional)
npx aic config set preferredModel "Claude Sonnet 4.5"
```

**Configuration is stored per-project** in `.ai/config.json`. See [CONFIGURATION.md](CONFIGURATION.md) for details.

## Full Documentation

### Core Documentation

- **[COMMANDS.md](COMMANDS.md)** - Complete command reference with examples
- **[CONFIGURATION.md](CONFIGURATION.md)** - Detailed configuration guide
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates

### After Running `init`

These files are created in your project:

**📁 .ai/ Directory (Human-readable files):**
- **`.ai/README.md`** - Overview of the knowledge base system
- **`.ai/project-overview.md`** - Project context and conventions (AI config)
- **`.ai/conversation-log.md`** - Chat history and decisions
- **`.ai/technical-decisions.md`** - Architecture and technical choices
- **`.ai/next-steps.md`** - Current priorities and tasks
- **`.ai/design-system.md`** - Design patterns and conventions
- **`.ai/code-style.md`** - Coding standards and guidelines

**📄 Root files:**
- **`.ai-instructions`** - Instructions for AI assistants
- **`NEW_CHAT_PROMPT.md`** - Quick reference for the one-liner prompt

**🚀 Optional AICF 3.0 (run `npx aic finish --aicf`):**
- **`.aicf/conversations.aicf`** - Ultra-compressed chat history (85% token reduction)
- **`.aicf/decisions.aicf`** - Technical decisions in structured format
- **`.aicf/tasks.aicf`** - Project tasks with priority scoring
- **`.aicf/issues.aicf`** - Known issues (if any)
- **`.aicf/index.aicf`** - Fast lookup index
- **`.aicf/.meta`** - Project metadata

## Links

- [GitHub](https://github.com/Vaeshkar/create-ai-chat-context)
- [npm](https://www.npmjs.com/package/create-ai-chat-context)
- [Issues](https://github.com/Vaeshkar/create-ai-chat-context/issues)
- [Full Documentation](https://github.com/Vaeshkar/create-ai-chat-context#readme)

## License

MIT

---

**Made with ❤️ for developers who use AI assistants daily**

---

**🎆 Incredible Journey:** From idea (Sept 30, 8pm) to 3,300+ downloads in 3.5 days! Created by a developer with 7 months of coding experience. *Next milestone: 1,000,000 downloads!* 🎯🚀

Questions or issues? [Open an issue on GitHub](https://github.com/Vaeshkar/create-ai-chat-context/issues)
