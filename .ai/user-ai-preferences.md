# User AI Preferences & Working Principles

> **🔒 PROTECTED FILE - Generated on 2025-10-05T17:30:44Z from Augment Data**  
> **Data Recovery:** Rebuilding lost context from original create-ai-chat-context project  
> **Source:** Augment-Memories (workspace: da1900ff993fd0b67bc8687c832c30a6)

---

## 🤖 AI Assistant Functionality Preferences

### Core Principles (From Augment Memory):

**Automated Knowledge Base Updates:**
- User expects AI assistants to automatically update ALL .ai/ knowledge base files at the end of chat sessions
- Files to update: technical-decisions.md, next-steps.md, architecture.md, known-issues.md
- Use full conversation history without requiring manual bullet points from the user
- This should happen automatically without asking for permission

**Verification-First Approach:**
- AI assistants should ALWAYS verify actual codebase state before trusting documentation
- Principle: "verify then please" NOT "please the user" 
- Check reality before giving advice
- Add '✅ Recently Completed (Last 2 Weeks)' section at TOP of next-steps.md to show completed work first

**Manual AICF Workflow Preference:**
- User prefers manual AICF approach over automated compression
- AI should write .aicf/ files directly at chat-finish/commit time
- NO compression agents - direct AI writing preferred
- Wants README documentation similar to .ai folder style
- Accepts time spent by AI on preserving its own memory in AI-optimized format

---

## 📁 Knowledge Base Configuration

### Hybrid Solution Decisions:
- Keep design-system.md and code-style.md as .md files (NOT .aicf)
- Current NPM package version was hollow/empty and needed proper release with cleanup
- Archive agents and remove test files from root directory
- Focus on dual-format strategy: .ai for humans, .aicf for AI

### Session Management Preferences:
- User wants to be reminded to update conversation logs before starting new chat session
- Save file changes before ending conversations
- Maintain continuity across infinite chat sessions

### AI-Optimized Format Philosophy:
- User prefers AI-optimized formats (even binary/compressed) for conversation summaries and logs
- Optimize for AI parsing efficiency, NOT human readability
- "Write for AI, not humans" - logs are FOR AI parsing
- Token efficiency is priority over human-readable prose

---

## 🔄 Workflow Integration Requirements

### For AI Assistants (YOU):
1. **Auto-update all .ai/ files at session end** (required, not optional)
2. **Check actual files before making recommendations** (verification first)
3. **Generate .aicf files for token efficiency** 
4. **Remind user about log updates before new sessions**
5. **Use structured data formats over natural language prose**

### Development Approach:
- Manual file management preferred over automation
- Verification before advice ("verify then please")
- Show completed work first in next-steps.md
- Maintain project memory across chat sessions

---

## 🎯 Token Efficiency Goals

Based on the original project learnings:

**Format Hierarchy (by efficiency):**
1. **AICF Format**: ~12 tokens per entry (92% reduction vs markdown)
2. **YAML Format**: ~80 tokens per entry (47% reduction vs markdown)  
3. **Markdown**: ~150 tokens per entry (baseline)

**Target:** Fit 6x more conversation history in context windows with AICF

---

## 🚨 Critical User Insights

### What Was Lost Yesterday:
- Rich conversation history and context
- Development progression and decision rationale  
- Command execution patterns and workflow preferences
- File access patterns and project evolution timeline

### What We're Rebuilding:
- Complete AI knowledge base with Augment data integration
- Chronological command history (180+ commands tracked)
- User preferences and AI interaction patterns
- Project evolution and architecture decisions

### Success Criteria:
- All Augment data successfully integrated
- Protected from future overwrites
- AI can seamlessly continue where we left off
- No context loss between chat sessions

---

**Remember:** This is data recovery. Every piece of Augment context helps rebuild what was lost. The user trusts AI to manage knowledge persistence automatically and efficiently.