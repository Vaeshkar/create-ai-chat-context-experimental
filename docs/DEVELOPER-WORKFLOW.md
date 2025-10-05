# Developer Workflow Guide - AI Chat Context v2.0

> **Quick Start**: `npx aic init && npx aic auto-update --start`  
> **Daily Use**: Code normally - files update automatically every 30 minutes!

---

## 🚀 **Getting Started (5 minutes)**

### **1. Initial Setup**
```bash
# Navigate to your project
cd my-awesome-project

# Initialize AI context system
npx aic init

# Start automatic updates (30-minute intervals)
npx aic auto-update --start

# Optional: Setup shell aliases for lightning-fast commands
source setup-aliases.sh
```

### **2. Verify Everything Works**
```bash
# Check all 6 connected AI sources
npx aic update --conversation

# Example output:
# "Available AI sources: warp, augment, claude, cursor, copilot, chatgpt" 
# "CHATGPT: 126 conversations, latest: 12:34:46 AM"
# "Using CLAUDE conversation: claude-session-000189"

# Or test with alias:
aicupdate
```

### **3. Check Your New Files**
```bash
ls -la .ai/        # Human-readable summaries
ls -la .aicf/      # AI-optimized memory files
```

---

## 🔄 **Daily Development Workflow**

### **Standard Day (Zero Overhead)**
```bash
# Start coding - nothing special required!
code .
git commit -m "Add feature X"

# Files automatically update every 30 minutes
# Check .ai/conversation-log.md for latest summaries

# At end of day (optional):
aicupdate    # Quick sync if you want latest changes
```

### **When You Need AI Help**
```bash
# System automatically preserves context from ALL your AI assistants:
# .ai/conversation-log.md    - Multi-AI conversation summaries
# .aicf/*.aicf              - Cross-AI memory files

# Switch between ANY AI assistant without re-explaining:
# - Used Warp for terminal work? Claude knows about it.
# - Discussed architecture in ChatGPT? Cursor has the context.
# - Made edits with Augment? All AIs see the changes.
```

---

## ⚡ **Command Reference**

### **Core Commands**
```bash
# Update conversation context manually (2 seconds)
npx aic update --conversation
aicupdate                              # Shell alias

# Auto-updater management
npx aic auto-update --start            # Start 30-min updates
npx aic auto-update --start -i 15      # Custom interval (15 min)
npx aic auto-update --stop             # Stop auto-updates
npx aic auto-update --status           # Check if running

# Diagnostics
npx aic extract-list                   # Show available AI sources
npx aic update --conversation --verbose # Debug mode
```

### **Project Setup**
```bash
# Initialize in new project
npx aic init

# Generate all memory files
npx aic generate

# Update specific components
npx aic update --project-overview
npx aic update --technical-decisions
npx aic update --next-steps
```

### **Shell Aliases (after `source setup-aliases.sh`)**
```bash
aicupdate                # npx aic update --conversation
aicauto                  # npx aic auto-update --start
aicstop                  # npx aic auto-update --stop
aicstatus                # npx aic auto-update --status
```

---

## 📁 **File Organization**

### **Generated Files Structure**
```
your-project/
├── .ai/                     # Human-readable summaries
│   ├── conversation-log.md  # Clean topic summaries (NEW!)
│   ├── project-overview.md  # High-level project context
│   ├── technical-decisions.md # Architecture & tech choices
│   ├── next-steps.md        # TODO and upcoming work
│   └── insights.md          # Learning and discoveries
├── .aicf/                   # AI-optimized memory files
│   ├── conversations.aicf   # Structured conversation data
│   ├── decisions.aicf       # Decision history with context
│   ├── problems.aicf        # Problem/solution pairs
│   └── project_memory.aicf  # Project metadata & insights
└── .gitignore              # Pre-configured to include .ai/ and .aicf/
```

### **New in v2.0: Beautiful Topic Summaries**
Instead of raw conversation dumps, you get clean summaries:

**Old format (v1.x):**
```
- issue: create_conversation_log.py, context: "def create_conversation_log(conversation_data):\n    # Process raw SQLite data...", file_path: /Users/dev/project/src/conversation_log.py, type: code_creation, timestamp: 2024-10-04T14:30:00Z, content: "Full conversation with 500+ lines of raw data..."
```

**New format (v2.0):**
```markdown
### What We Accomplished
- **Major work completed:** real-time auto-updates, topic summaries, multi-AI support (8 items)

### Key Decisions
- **Strategic decisions:** 30-minute update intervals, shell aliases for speed, topic-based format (5 total)

### Problems & Solutions  
- **Issues addressed:** text cleaning regex patterns, corrupted data filtering, markdown readability (4 resolved)
```

---

## 🎯 **AI Integration Patterns**

### **For AI Assistants Reading Your Context**
```markdown
## Conversation Context Available:
✅ Recent accomplishments (past 7 days)
✅ Technical decisions with rationale  
✅ Problems solved with solutions
✅ Key insights and learnings
✅ Project architecture overview
✅ Next steps and priorities

## Ask AI:
"Based on my conversation context, help me..."
"Looking at my recent decisions, should I..."
"Given the problems I've solved, how would you approach..."
```

### **Team Collaboration**
```bash
# Include AI context in version control
echo ".ai/" >> .gitignore     # Actually, DON'T ignore - share the context!
echo ".aicf/" >> .gitignore   # Share AI memory files too

git add .ai/ .aicf/
git commit -m "Add AI conversation context for team"

# Team members get instant project understanding
# No more "Can you explain the architecture again?"
```

---

## 🔧 **Customization & Configuration**

### **Update Intervals**
```bash
# Different intervals for different workflows
npx aic auto-update --start -i 15    # Every 15 minutes (active development)
npx aic auto-update --start -i 30    # Every 30 minutes (default)  
npx aic auto-update --start -i 60    # Every hour (background projects)
```

### **Manual Update Triggers**
```bash
# Update when you reach milestones
git commit && aicupdate

# Update before switching contexts
aicupdate && git checkout feature-branch

# Update before asking AI for help
aicupdate && code .
```

### **Content Filtering (Advanced)**
```bash
# View current content filters
cat src/agents/conversation-analyzer.js

# Filters automatically remove:
# - Raw API responses  
# - Hex dumps and base64 data
# - Massive file path listings
# - Corrupted or truncated text
# - Structured data dumps
```

---

## 🐛 **Troubleshooting Guide**

### **Common Issues**

#### **Auto-updater Not Running**
```bash
# Check if daemon is running
npx aic auto-update --status

# Restart if needed
npx aic auto-update --stop
npx aic auto-update --start

# Debug mode
npx aic auto-update --start --verbose
```

#### **No AI Sources Found**
```bash
# Check available sources
npx aic extract-list

# Should show: Warp (✓), Augment (✓), Cursor (?), Copilot (?)
# If empty, check if you have AI assistants installed
```

#### **Updates Too Slow**
```bash
# Test manual update speed
time npx aic update --conversation

# Should complete in ~2 seconds
# If slower, check conversation size:
npx aic extract --show-stats
```

#### **Shell Aliases Not Working**
```bash
# Re-source the aliases
source setup-aliases.sh

# Or add to your shell profile
echo 'source /path/to/setup-aliases.sh' >> ~/.zshrc
```

### **Performance Tuning**

#### **Large Conversation Databases**
```bash
# For 10,000+ messages, consider:
npx aic auto-update --start -i 60    # Longer intervals
npx aic update --conversation --limit 1000  # Process recent only
```

#### **Memory Usage**
```bash
# Monitor daemon memory usage
ps aux | grep auto-updater

# Should stay under 50MB
# If higher, restart daemon:
npx aic auto-update --stop && npx aic auto-update --start
```

---

## 📊 **Best Practices**

### **For Individual Developers**
- ✅ Set 15-30 minute update intervals for active projects
- ✅ Use shell aliases for frequent manual updates
- ✅ Include `.ai/` and `.aicf/` in version control
- ✅ Review conversation summaries before major decisions
- ✅ Update manually before context switching

### **For Teams**
- ✅ Standardize update intervals across team (30 min recommended)
- ✅ Commit AI context files regularly
- ✅ Use conversation summaries for onboarding new members
- ✅ Reference decision history in code reviews
- ✅ Share insights across similar projects

### **For AI Integration**
- ✅ Read `.ai/conversation-log.md` for human-readable context
- ✅ Parse `.aicf/*.aicf` files for structured data
- ✅ Check timestamps for recency
- ✅ Use decision rationale for consistency
- ✅ Reference previous solutions for similar problems

---

## 🎯 **Advanced Workflows**

### **Multi-Project Management**
```bash
# Setup for each project
cd project-a && npx aic auto-update --start
cd ../project-b && npx aic auto-update --start

# Each project gets independent AI context
# Switch between projects seamlessly
```

### **CI/CD Integration**
```bash
# In your CI pipeline
npx aic update --conversation
git add .ai/ .aicf/
git commit -m "Update AI context [skip ci]"
```

### **AI Workflow Integration**
```bash
# Before major development sessions
aicupdate && code .

# After resolving complex issues  
git commit -m "Fix complex issue" && aicupdate

# Before team meetings
aicupdate    # Ensure latest context available
```

---

## 🚀 **Next Steps**

### **Getting the Most Value**
1. **Week 1**: Let auto-updater run, check conversation summaries daily
2. **Week 2**: Use context when asking AI for help, notice reduced re-explanation
3. **Week 3**: Share context with team, onboard new members using summaries
4. **Week 4**: Customize intervals and filters for your workflow

### **Advanced Features (Coming Soon)**
- Full Cursor IDE integration
- GitHub Copilot conversation history  
- Claude Projects desktop app support
- Custom topic extraction rules
- Team collaboration features

---

## 📞 **Support & Community**

### **Get Help**
- **Issues**: [GitHub Issues](https://github.com/Vaeshkar/create-ai-chat-context/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Vaeshkar/create-ai-chat-context/discussions)
- **Documentation**: [Full docs](docs/)

### **Contribute**
- Test with your AI workflow and report issues
- Suggest improvements for topic summaries  
- Help implement Cursor/Copilot integration
- Share workflow patterns with the community

---

**🎉 You're all set! The system is now working automatically to preserve and organize your AI conversation context.**

**Never lose context again. Never re-explain your project. Focus on building amazing things! 🚀**