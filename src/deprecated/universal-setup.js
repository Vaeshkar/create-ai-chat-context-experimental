#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

/**
 * Universal AI Memory System Setup
 * Sets up automatic context loading for ALL AI platforms
 */
class UniversalSetup {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.verbose = options.verbose || false;
    this.log = this.verbose ? console.log : () => {};
  }

  async setupUniversalMemory() {
    console.log(chalk.blue('🌍 Setting up Universal AI Memory System...'));
    
    const setupTasks = [
      { name: 'Create universal instructions', task: () => this.createUniversalInstructions() },
      { name: 'Setup Cursor AI integration', task: () => this.setupCursor() },
      { name: 'Create Claude Projects template', task: () => this.createClaudeTemplate() },
      { name: 'Create ChatGPT instructions', task: () => this.createChatGPTInstructions() },
      { name: 'Create hourglass protocol', task: () => this.createHourglassProtocol() },
      { name: 'Setup file watching (optional)', task: () => this.setupFileWatching() },
      { name: 'Create quick start guide', task: () => this.createQuickStartGuide() }
    ];

    const results = [];
    
    for (const { name, task } of setupTasks) {
      try {
        this.log(chalk.cyan(`  📝 ${name}...`));
        const result = await task();
        results.push({ name, success: true, result });
        console.log(chalk.green(`  ✅ ${name}`));
      } catch (error) {
        results.push({ name, success: false, error: error.message });
        console.log(chalk.red(`  ❌ ${name}: ${error.message}`));
      }
    }

    return results;
  }

  async createUniversalInstructions() {
    const content = `# 🤖 UNIVERSAL AI MEMORY SYSTEM

## AUTO-SETUP COMPLETE! 

This project now has universal AI memory that works with ALL AI assistants:
- ✅ Claude (Projects)  
- ✅ ChatGPT / GPT-4
- ✅ Cursor AI
- ✅ Warp AI
- ✅ Copilot
- ✅ Any AI assistant

## FOR AI ASSISTANTS: READ CONTEXT FIRST!

Before helping the user, automatically read these files:

\`\`\`bash
# Essential context (always read these):
cat .ai-instructions
cat .ai/project-overview.md
cat .ai/conversation-log.md
cat .ai/technical-decisions.md
cat .ai/next-steps.md

# AI-optimized format (if exists):
cat .aicf/README.md
cat .aicf/conversation-memory.aicf
cat .aicf/technical-context.aicf
cat .aicf/work-state.aicf
\`\`\`

## PLATFORM-SPECIFIC SETUP:

### Cursor AI ✅
- File: \`.cursorrules\` (automatically detected)
- Status: Ready to use

### Claude Projects ✅  
- File: \`claude-project-setup.md\` 
- Action: Copy instructions to your Claude Project

### ChatGPT / GPT-4 ✅
- File: \`chatgpt-setup.md\`
- Action: Follow instructions to create custom GPT

### Automatic Processing ✅
- Command: \`npx aic finish --aicf\` 
- Triggers: Manual or automated checkpointing

---

**This solves "reversed dementia" - AI memory loss between sessions!**

*Built by Dennis van Leeuwen (Glückstadt, Germany) for universal AI continuity.*`;

    await this.ensureDirectoryExists('.ai');
    await fs.writeFile(path.join(this.projectRoot, '.ai', 'UNIVERSAL_SETUP.md'), content);
    return 'Universal instructions created';
  }

  async setupCursor() {
    const cursorRules = `# Universal AI Memory System - Cursor Integration

## AUTOMATIC CONTEXT LOADING (CRITICAL)
Before any response, read ALL context files if they exist:
- .ai-instructions
- .ai/project-overview.md  
- .ai/conversation-log.md
- .ai/technical-decisions.md
- .ai/next-steps.md
- .aicf/*.aicf (AI-optimized memory)

## WORKFLOW
1. **Session Start**: Auto-read context files → confirm understanding
2. **During Work**: Reference previous decisions, maintain consistency  
3. **Session End**: Update .ai/ files OR run \`npx aic finish --aicf\`

This prevents "reversed dementia" - AI memory loss between sessions.
Built by Dennis van Leeuwen for universal AI continuity.`;

    await fs.writeFile(path.join(this.projectRoot, '.cursorrules'), cursorRules);
    return 'Cursor AI integration ready';
  }

  async createClaudeTemplate() {
    const template = `# Claude Projects - Universal AI Memory Integration

## COPY THIS TO YOUR CLAUDE PROJECT INSTRUCTIONS:

\`\`\`
CRITICAL: Before every response, automatically read these context files if they exist:

Essential Context:
- .ai-instructions (project instructions)
- .ai/project-overview.md (project context) 
- .ai/conversation-log.md (previous decisions)
- .ai/technical-decisions.md (architectural choices)
- .ai/next-steps.md (current priorities)

AI-Optimized Memory (if exists):
- .aicf/README.md (AICF instructions)
- .aicf/conversation-memory.aicf (recent state)
- .aicf/technical-context.aicf (architecture)
- .aicf/work-state.aicf (current work)

PROTOCOL:
1. Check for .ai/ or .aicf/ directories
2. Read ALL context before responding
3. Confirm understanding of project state
4. Continue work with full context

At session end, update relevant .ai/ files or suggest: npx aic finish --aicf

This solves "reversed dementia" - AI memory loss between sessions.
\`\`\`

## SETUP STEPS:
1. Copy the instructions above
2. Paste into your Claude Project's "Project Instructions"  
3. Save and test with: "Read the project context first"

Your Claude Project now has universal AI memory!`;

    await fs.writeFile(path.join(this.projectRoot, 'claude-project-setup.md'), template);
    return 'Claude Projects template created';
  }

  async createHourglassProtocol() {
    // Copy the hourglass protocol file if it doesn't exist
    const fs = require('fs');
    const sourcePath = path.join(__dirname, '..', 'AI_HOURGLASS_PROTOCOL.md');
    const targetPath = path.join(this.projectRoot, 'AI_HOURGLASS_PROTOCOL.md');
    
    if (!fs.existsSync(targetPath)) {
      if (fs.existsSync(sourcePath)) {
        await fs.promises.copyFile(sourcePath, targetPath);
      }
    }
    
    return 'Hourglass protocol instructions created';
  }

  async createChatGPTInstructions() {
    const instructions = `# ChatGPT / GPT-4 - Universal AI Memory Integration

## SETUP METHOD 1: Custom GPT (Recommended)

### Create Custom GPT:
1. Go to ChatGPT → "Create a GPT"
2. Name: "[Your Project] AI Assistant"
3. Description: "AI assistant with full project memory and context"

### Add These Files to Knowledge Base:
- .ai-instructions
- .ai/project-overview.md
- .ai/conversation-log.md  
- .ai/technical-decisions.md
- .ai/next-steps.md
- .aicf/README.md (if exists)

### Instructions for GPT:
\`\`\`
You are an AI assistant with full project context and memory. 

CRITICAL: Always reference the uploaded knowledge base files before responding:
- Check project-overview.md for project context
- Check conversation-log.md for previous decisions  
- Check technical-decisions.md for architectural choices
- Check next-steps.md for current priorities

At conversation end, provide updates for the user to apply to these files.

This prevents "reversed dementia" - maintain full context between sessions.
\`\`\`

## SETUP METHOD 2: Manual Context (Each Session)

Start each ChatGPT conversation with:
\`\`\`
"Before we begin, let me share my project context. Here are the key files:"

[Upload or paste content from .ai/ files]
\`\`\`

## RESULT:
ChatGPT will have full project memory and can continue conversations seamlessly!`;

    await fs.writeFile(path.join(this.projectRoot, 'chatgpt-setup.md'), instructions);
    return 'ChatGPT setup instructions created';
  }

  async setupFileWatching() {
    // Optional: Create a simple file watcher for automatic checkpointing
    const watcherCode = `#!/usr/bin/env node
// Optional: Automatic checkpoint trigger on file changes
// Usage: node watch-and-checkpoint.js

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

console.log('🔍 Watching for project changes...');
console.log('📝 Will trigger checkpoint on significant changes');

// Watch .ai and .aicf directories
const watchDirs = ['.ai', '.aicf', 'src', 'lib'].filter(dir => 
  fs.existsSync(dir)
);

watchDirs.forEach(dir => {
  fs.watch(dir, { recursive: true }, (eventType, filename) => {
    if (filename && filename.includes('.md')) {
      console.log(\`📄 File changed: \${dir}/\${filename}\`);
      
      // Optional: Auto-trigger checkpoint after significant changes
      // Uncomment next line to enable:
      // exec('npx aic checkpoint --auto', (err, stdout) => {
      //   if (!err) console.log('✅ Auto-checkpoint completed');
      // });
    }
  });
});

console.log(\`👁️  Watching: \${watchDirs.join(', ')}\`);
console.log('Press Ctrl+C to stop');`;

    await fs.writeFile(path.join(this.projectRoot, 'watch-and-checkpoint.js'), watcherCode);
    return 'File watching setup created (optional)';
  }

  async createQuickStartGuide() {
    const guide = `# 🚀 UNIVERSAL AI MEMORY - QUICK START

## YOU'RE ALL SET! 🎉

Your project now has **Universal AI Memory** that works with ALL AI assistants!

## TEST IT NOW:

### 1. Test with Cursor AI:
- Open project in Cursor
- Start new chat  
- Cursor will automatically read .ai/ context
- ✅ **No setup needed!**

### 2. Test with Claude Projects:
- Copy instructions from \`claude-project-setup.md\`
- Paste into Claude Project settings
- Start new conversation
- ✅ **Claude has full project memory!**

### 3. Test with ChatGPT:
- Follow \`chatgpt-setup.md\` instructions
- Create custom GPT or upload context manually
- ✅ **ChatGPT remembers everything!**

## NEXT STEPS:

### Daily Usage:
\`\`\`bash
# Work normally with any AI assistant
# Context loads automatically

# At session end (optional):
npx aic finish --aicf  # Automated memory saving
\`\`\`

### Share with Team:
- ✅ Commit .ai/ and .aicf/ directories to Git
- ✅ Share setup files with colleagues
- ✅ Everyone gets consistent AI memory

## THE MAGIC:

❌ **Before**: "Can you remind me what we discussed yesterday?"
✅ **After**: AI automatically knows your entire project history!

**No more "reversed dementia" - AI memory loss between sessions!**

---

*Universal AI Memory System by Dennis van Leeuwen (Glückstadt, Germany)*
*Share with Malte Ublé and the Vercel team! 🚀*`;

    await fs.writeFile(path.join(this.projectRoot, 'QUICK_START_UNIVERSAL.md'), guide);
    return 'Quick start guide created';
  }

  async ensureDirectoryExists(dir) {
    try {
      await fs.access(path.join(this.projectRoot, dir));
    } catch {
      await fs.mkdir(path.join(this.projectRoot, dir), { recursive: true });
    }
  }
}

// CLI usage
if (require.main === module) {
  const setup = new UniversalSetup({ verbose: true });
  
  setup.setupUniversalMemory()
    .then(results => {
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      console.log(chalk.green(`\n🎉 Universal AI Memory Setup Complete!`));
      console.log(chalk.blue(`✅ ${successful} tasks completed successfully`));
      if (failed > 0) {
        console.log(chalk.yellow(`⚠️  ${failed} tasks had issues`));
      }
      
      console.log(chalk.cyan('\n📖 Next steps:'));
      console.log(chalk.dim('  - Read QUICK_START_UNIVERSAL.md'));
      console.log(chalk.dim('  - Test with your preferred AI assistant'));
      console.log(chalk.dim('  - Share setup files with your team'));
      
      console.log(chalk.magenta('\n🌍 Your project now works with ALL AI assistants!'));
    })
    .catch(error => {
      console.error(chalk.red('❌ Setup failed:'), error.message);
      process.exit(1);
    });
}

module.exports = { UniversalSetup };