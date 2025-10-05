#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const { init } = require("../src/init");
const { displayTokenUsage } = require("../src/tokens");
const { archiveConversations } = require("../src/archive");
const { summarizeConversations } = require("../src/summary");
const { healthCheck } = require("../src/check");
const { validateKnowledgeBase } = require("../src/validate");
const { generateCursorRules } = require("../src/cursor");
const { generateCopilotInstructions } = require("../src/copilot");
const { generateClaudeProject } = require("../src/claude-project");
const { searchKnowledgeBase } = require("../src/search");
const { showStats } = require("../src/stats");
const { exportKnowledgeBase } = require("../src/export");
const { updateKnowledgeBase } = require("../src/update");
const { installGitHooks } = require("../src/install-hooks");
const { handleConfigCommand } = require("../src/config");
const { handleConvertCommand } = require("../src/convert");
const { migrateProject } = require("../src/migrate");
const { migrateToAICF } = require("../src/aicf-migrate");
const { finishSession } = require("../src/finish");
const { analyzeTokenUsage, displayTokenReport, shouldWrapUpSession } = require("../src/token-monitor");
const { handleContextCommand } = require("../src/aicf-context");
const { processCheckpoint, processMemoryDecay } = require("../src/checkpoint-process");
const { ContextExtractor } = require("../src/context-extractor");
const packageJson = require("../package.json");

const program = new Command();

program
  .name("create-ai-chat-context")
  .description("Preserve AI chat context and history across sessions")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize AI knowledge base in current directory")
  .option("-f, --force", "Overwrite existing files")
  .option("--no-git", "Skip Git integration")
  .option(
    "-t, --template <name>",
    "Project template (default, nextjs, python, rust, api)"
  )
  .action(async (options) => {
    try {
      await init(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("cursor")
  .description("Generate .cursorrules file for Cursor AI integration")
  .option("-f, --force", "Overwrite existing .cursorrules file")
  .action(async (options) => {
    try {
      await generateCursorRules(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("copilot")
  .description("Generate GitHub Copilot instructions for integration")
  .option("-f, --force", "Overwrite existing copilot-instructions.md file")
  .action(async (options) => {
    try {
      await generateCopilotInstructions(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("claude-project")
  .description("Generate Claude Projects export")
  .option("-f, --force", "Overwrite existing CLAUDE_PROJECT.md file")
  .action(async (options) => {
    try {
      await generateClaudeProject(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("validate")
  .description("Validate knowledge base quality and completeness")
  .action(async () => {
    try {
      await validateKnowledgeBase();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("check")
  .description("Quick health check of knowledge base")
  .action(async () => {
    try {
      await healthCheck();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("config [action] [key] [value]")
  .description("Manage configuration (list, get, set)")
  .action(async (action, key, value) => {
    try {
      await handleConfigCommand(action, key, value);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("tokens")
  .description("Show token usage breakdown of knowledge base")
  .option("-a, --all", "Show all AI models (default: show top 4)")
  .action(async (options) => {
    try {
      await displayTokenUsage(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("archive")
  .description("Archive old conversation log entries to reduce token usage")
  .option(
    "-k, --keep <number>",
    "Number of recent chats to keep detailed",
    "10"
  )
  .action(async (options) => {
    try {
      await archiveConversations(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("summary")
  .description("Summarize old conversation log entries to reduce token usage")
  .option(
    "-k, --keep <number>",
    "Number of recent chats to keep detailed",
    "10"
  )
  .action(async (options) => {
    try {
      await summarizeConversations(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("search <query>")
  .description("Search across all knowledge base files")
  .option("-c, --case-sensitive", "Case-sensitive search")
  .action(async (query, options) => {
    try {
      await searchKnowledgeBase(query, options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("stats")
  .description("Show knowledge base statistics and insights")
  .action(async () => {
    try {
      await showStats();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("export")
  .description("Export knowledge base in various formats")
  .option(
    "-f, --format <format>",
    "Export format (markdown, json, html)",
    "markdown"
  )
  .option("-o, --output <file>", "Output file name")
  .option("--force", "Overwrite existing file")
  .action(async (options) => {
    try {
      await exportKnowledgeBase(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("update")
  .description("Update knowledge base with latest template improvements OR current conversation")
  .option("-y, --yes", "Skip confirmation prompt")
  .option("-c, --conversation", "Update with latest conversation instead of templates")
  .action(async (options) => {
    try {
      if (options.conversation) {
        // Quick conversation update with multi-source detection
        const extractor = new ContextExtractor();
        console.log(chalk.cyan('🔍 Finding latest conversation across all AI sources...\n'));
        
        const availableSources = extractor.getAvailableSources();
        console.log(chalk.blue(`   Available sources: ${availableSources.join(', ')}\n`));
        
        let latestConversation = null;
        let bestSource = null;
        let latestTimestamp = null;
        
        // Check all available AI sources for the most recent conversation
        for (const source of availableSources) {
          try {
            const conversations = await extractor.listConversations(source, { limit: 1 });
            if (conversations.length > 0) {
              const mostRecent = conversations[0];
              const timestamp = new Date(mostRecent.updated);
              
              console.log(chalk.gray(`   ${source.toUpperCase()}: Latest ${timestamp.toLocaleTimeString()}`));
              
              if (!latestTimestamp || timestamp > latestTimestamp) {
                latestConversation = mostRecent;
                bestSource = source;
                latestTimestamp = timestamp;
              }
            } else {
              console.log(chalk.gray(`   ${source.toUpperCase()}: No conversations`));
            }
          } catch (error) {
            console.log(chalk.yellow(`   ${source.toUpperCase()}: Error - ${error.message}`));
          }
        }
        
        if (!latestConversation) {
          console.log(chalk.yellow('⚠️  No conversations found across all AI sources.'));
          return;
        }
        
        console.log(chalk.blue(`\n📊 Using ${bestSource.toUpperCase()} conversation: ${latestConversation.id}`));
        if (bestSource === 'chatgpt') {
          console.log(chalk.yellow('   Note: ChatGPT data is encrypted - extracting metadata only'));
        }
        
        // Extract and process the latest conversation
        const conversation = await extractor.extractConversation(latestConversation.id, bestSource);
        
        // Save and process via checkpoint
        const fs = require('fs');
        const path = require('path');
        const tempFile = path.join(process.cwd(), `conversation-${bestSource}-${latestConversation.id}.json`);
        
        // Map message roles based on AI source
        const mapMessageRole = (msg, aiSource) => {
          switch (aiSource) {
            case 'warp':
              return msg.type === 'USER_QUERY' ? 'user' : 'assistant';
            case 'chatgpt':
            case 'claude':
              return 'assistant'; // Encrypted/storage data
            case 'cursor':
            case 'copilot':
              return msg.type === 'COPILOT_CHAT' ? 'assistant' : 'user';
            case 'augment':
              return 'assistant'; // Agent edit data
            default:
              return 'assistant';
          }
        };
        
        const checkpointData = {
          id: conversation.id,
          sessionId: conversation.id,
          checkpointNumber: 1,
          startTime: conversation.timespan.start,
          endTime: conversation.timespan.end,
          tokenCount: conversation.messageCount * 50,
          source: bestSource,
          aiAssistant: bestSource.toUpperCase(),
          extractionNote: bestSource === 'chatgpt' ? 'Encrypted data - metadata only' : 'Full extraction',
          messages: conversation.messages.map(msg => ({
            role: mapMessageRole(msg, bestSource),
            content: msg.content,
            timestamp: msg.timestamp,
            working_directory: msg.workingDirectory || conversation.workingDirectories?.[0] || process.cwd(),
            context: {
              ...msg.context,
              aiSource: bestSource,
              extractedAt: new Date().toISOString()
            }
          }))
        };
        
        fs.writeFileSync(tempFile, JSON.stringify(checkpointData, null, 2));
        
        // Process checkpoint
        await processCheckpoint({ file: tempFile, verbose: false });
        
        // Cleanup
        fs.unlinkSync(tempFile);
        console.log(chalk.green('✅ Conversation update complete!\n'));
      } else {
        // Standard template update
        await updateKnowledgeBase(options);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("auto-update")
  .description("Manage auto-updater daemon for real-time conversation updates")
  .option("--start", "Start the auto-updater daemon")
  .option("--stop", "Stop the auto-updater daemon")
  .option("--status", "Check auto-updater status")
  .option("-i, --interval <minutes>", "Update interval in minutes (default: 30)", "30")
  .action(async (options) => {
    try {
      const AutoUpdater = require('../src/auto-updater.js');
      
      if (options.start) {
        const interval = parseInt(options.interval) || 30;
        console.log(chalk.cyan(`🚀 Starting multi-AI auto-updater (${interval} min intervals)...\n`));
        console.log(chalk.blue('   Supported AI sources: Warp, Claude, Cursor, Copilot, ChatGPT, Augment'));
        console.log(chalk.gray('   Press Ctrl+C to stop\n'));
        
        const updater = new AutoUpdater(interval);
        await updater.start();
        
        // Keep the process running
        process.stdin.resume();
      } else if (options.stop) {
        console.log(chalk.yellow('🛑 Auto-updater stop command received'));
        console.log(chalk.gray('   Note: Use Ctrl+C to stop running daemon'));
      } else if (options.status) {
        console.log(chalk.cyan('🔍 Auto-updater Status Check'));
        console.log(chalk.gray('   No persistent status tracking implemented yet'));
        console.log(chalk.gray('   Use "ps aux | grep auto-updater" to check for running processes'));
      } else {
        console.log(chalk.bold('\n🤖 AI Auto-Updater\n'));
        console.log('Usage:');
        console.log(chalk.cyan('  npx aic auto-update --start [--interval N]'));
        console.log(chalk.gray('    Start daemon with N-minute intervals (default: 30)\n'));
        console.log('Examples:');
        console.log(chalk.green('  npx aic auto-update --start'));
        console.log(chalk.gray('    # Start with 30-minute intervals'));
        console.log(chalk.green('  npx aic auto-update --start -i 15'));
        console.log(chalk.gray('    # Start with 15-minute intervals'));
        console.log(chalk.green('  npx aic auto-update --status'));
        console.log(chalk.gray('    # Check if running'));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("install-hooks")
  .description("Install Git hooks for knowledge base maintenance")
  .option("-f, --force", "Overwrite existing hooks")
  .action(async (options) => {
    try {
      await installGitHooks(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("convert")
  .description("Convert conversation log format")
  .option("--to-ai-native", "Convert to AI-native format (85% token reduction)")
  .option("--to-yaml", "Convert to YAML format (human-readable)")
  .option("--to-markdown", "Convert to Markdown format (traditional)")
  .option(
    "--all-files",
    "Convert ALL knowledge base files to AICF (maximum efficiency)"
  )
  .option("--no-backup", "Skip creating backup file")
  .action(async (options) => {
    try {
      await handleConvertCommand(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("migrate")
  .description("Upgrade existing project to latest AI memory system")
  .option("--force", "Skip confirmation prompt")
  .option("--to-aicf", "Convert .ai/ directory to .aicf/ format (AICF 3.0)")
  .action(async (options) => {
    try {
      if (options.toAicf) {
        // First ensure .ai/ directory has all essential files
        console.log(chalk.cyan('🔍 Checking .ai/ directory completeness...\n'));
        await migrateProject({ force: true, silent: true });
        
        // Then convert .ai/ to .aicf/ (AICF 3.0)
        const fs = require('fs-extra');
        const path = require('path');
        
        const aiDir = path.join(process.cwd(), '.ai');
        const aicfDir = path.join(process.cwd(), '.aicf');
        
        if (!fs.existsSync(aiDir)) {
          console.log(chalk.yellow('⚠️  No .ai/ directory found!'));
          console.log(chalk.gray('   Run \'npx aic init\' to create a new project\n'));
          process.exit(1);
        }
        
        await migrateToAICF(aiDir, aicfDir);
      } else {
        // Traditional migration - add missing .ai/ files
        await migrateProject(options);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("context")
  .description("View AI context summary (for starting new chat sessions)")
  .option("--ai", "Output in AI-optimized format")
  .option("--full", "Show full context (all files)")
  .action(async (options) => {
    try {
      await handleContextCommand(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Context extraction commands
program
  .command("extract-list")
  .description("List recent AI conversations")
  .option("-s, --source <source>", "AI assistant source (warp, claude, chatgpt)", "warp")
  .option("-l, --limit <number>", "Number of conversations to show", "10")
  .action(async (options) => {
    try {
      const extractor = new ContextExtractor();
      
      if (!extractor.isSourceAvailable(options.source)) {
        console.log(chalk.yellow(`⚠️  ${options.source} context source not available`));
        console.log(chalk.gray(`Available sources: ${extractor.getAvailableSources().join(', ')}`));
        process.exit(1);
      }
      
      console.log(chalk.cyan(`🔍 Listing ${options.source} conversations...\n`));
      
      const conversations = await extractor.listConversations(options.source, { limit: parseInt(options.limit) });
      
      if (conversations.length === 0) {
        console.log(chalk.gray('No conversations found.'));
        return;
      }
      
      console.log(chalk.bold(`📋 Recent ${options.source.toUpperCase()} Conversations:\n`));
      
      conversations.forEach((conv, i) => {
        const created = new Date(conv.created).toLocaleString();
        const updated = new Date(conv.updated).toLocaleString();
        
        console.log(chalk.blue(`${i + 1}. ${conv.id}`));
        console.log(chalk.gray(`   Created: ${created}`));
        console.log(chalk.gray(`   Updated: ${updated}`));
        console.log(chalk.gray(`   Messages: ${conv.messageCount}, Queries: ${conv.queryCount}`));
        console.log();
      });
      
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("extract-conversation <id>")
  .description("Extract full conversation context and auto-process with checkpoint")
  .option("-s, --source <source>", "AI assistant source (warp, claude, chatgpt)", "warp")
  .option("--no-checkpoint", "Skip automatic checkpoint processing")
  .option("-v, --verbose", "Enable verbose output")
  .action(async (conversationId, options) => {
    try {
      const extractor = new ContextExtractor();
      
      if (!extractor.isSourceAvailable(options.source)) {
        console.log(chalk.yellow(`⚠️  ${options.source} context source not available`));
        console.log(chalk.gray(`Available sources: ${extractor.getAvailableSources().join(', ')}`));
        process.exit(1);
      }
      
      console.log(chalk.cyan(`🔍 Extracting ${options.source} conversation: ${conversationId}\n`));
      
      const conversation = await extractor.extractConversation(conversationId, options.source);
      
      // Display conversation summary
      console.log(chalk.bold("📊 Conversation Summary:"));
      console.log(chalk.blue(`   ID: ${conversation.id}`));
      console.log(chalk.blue(`   Messages: ${conversation.messageCount}`));
      console.log(chalk.blue(`   Working Directories: ${conversation.workingDirectories.join(', ')}`));
      console.log(chalk.blue(`   Timespan: ${conversation.timespan.start} - ${conversation.timespan.end}`));
      console.log(chalk.blue(`   Duration: ${Math.round(conversation.timespan.duration / (1000 * 60))} minutes\n`));
      
      // Save conversation to temporary file for checkpoint processing
      const fs = require('fs');
      const path = require('path');
      const tempFile = path.join(process.cwd(), `conversation-${conversationId}.json`);
      
          // Convert to checkpoint format with SQLite access info
          const checkpointData = {
            id: conversation.id, // Add ID for SQLite access
            sessionId: conversation.id,
            checkpointNumber: 1,
            startTime: conversation.timespan.start,
            endTime: conversation.timespan.end,
            tokenCount: conversation.messageCount * 50, // Rough estimate
            source: options.source, // Add source info
            messages: conversation.messages.map(msg => ({
              role: msg.type === 'USER_QUERY' ? 'user' : 'assistant',
              content: msg.content,
              timestamp: msg.timestamp,
              working_directory: msg.workingDirectory,
              context: msg.context
            }))
          };
      
      fs.writeFileSync(tempFile, JSON.stringify(checkpointData, null, 2));
      console.log(chalk.green(`💾 Conversation saved to: ${tempFile}\n`));
      
      // Auto-trigger checkpoint processing unless disabled
      if (!options.noCheckpoint) {
        console.log(chalk.cyan('🤖 Auto-triggering checkpoint processing...\n'));
        await processCheckpoint({ file: tempFile, verbose: options.verbose });
        
        // Clean up temp file
        fs.unlinkSync(tempFile);
        console.log(chalk.gray(`🧹 Cleaned up temporary file\n`));
      }
      
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command('conversations')
  .description('Process conversations from AI terminal (auto-extract and update docs)')
  .option('--daemon [minutes]', 'Run as daemon, checking every N minutes (default: 5)', '5')
  .option('--once', 'Process once and exit', false)
  .action(async (options) => {
    try {
      const ConversationProcessor = require('../src/conversation-processor');
      const processor = new ConversationProcessor();
      
      if (options.once) {
        console.log(chalk.cyan('🔍 Processing conversations once...\n'));
        await processor.runOnce();
        console.log(chalk.green('✅ Conversation processing complete'));
      } else if (options.daemon) {
        const interval = parseInt(options.daemon) || 5;
        console.log(chalk.cyan(`🚀 Starting conversation processor daemon (every ${interval} minutes)\n`));
        processor.startDaemon(interval);
      } else {
        // Default behavior - run once
        console.log(chalk.cyan('🔍 Processing conversations once...\n'));
        await processor.runOnce();
        console.log(chalk.green('✅ Conversation processing complete'));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Universal automation command (disabled - deprecated functionality)
// program
//   .command("automate")
//   .description("Start universal AI context automation (real-time background monitoring)")
//   .option("-v, --verbose", "Enable verbose logging")
//   .option("--status", "Show automation status instead of starting")
//   .action(async (options) => {
//     console.log(chalk.yellow('⚠️  The automate command has been deprecated.'));
//     console.log(chalk.dim('   Use "npx aic extract-conversation <id>" for manual extraction instead.'));
//   });

program
  .command("checkpoint")
  .description("Process conversation checkpoint using AI logic agents")
  .option("-f, --file <path>", "Load checkpoint from JSON file")
  .option("--demo", "Use demo data for testing (default if no file specified)")
  .option("-v, --verbose", "Enable verbose logging")
  .option("--show-memory", "Display memory statistics after processing")
  .action(async (options) => {
    try {
      await processCheckpoint(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("memory-decay")
  .description("Apply intelligent memory decay to optimize storage")
  .option("-v, --verbose", "Enable verbose logging")
  .action(async (options) => {
    try {
      await processMemoryDecay(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("finish")
  .description("Finish AI session and prepare handoff to new chat")
  .option("-t, --topic <topic>", "Session topic")
  .option("-w, --what <what>", "What was accomplished")
  .option("-y, --why <why>", "Why this work was done")
  .option("-o, --outcome <outcome>", "Session outcome")
  .option("--aicf", "Migrate to AICF 3.0 format")
  .option("--no-commit", "Skip git commit")
  .action(async (options) => {
    try {
      const sessionData = {
        topic: options.topic,
        what: options.what,
        why: options.why,
        outcome: options.outcome
      };
      
      await finishSession({
        sessionData: sessionData.topic ? sessionData : null,
        migrateAicf: options.aicf,
        skipCommit: options.noCommit
      });
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("monitor")
  .description("Monitor token usage and suggest session management")
  .option("--check-finish", "Check if session should be finished")
  .action(async (options) => {
    try {
      if (options.checkFinish) {
        const result = await shouldWrapUpSession();
        if (result.shouldWrapUp) {
          console.log(chalk.yellow(`\n⚠️  ${result.reason}\n`));
          console.log(chalk.bold("Consider running:"));
          console.log(chalk.green("   npx aic finish --aicf"));
          console.log();
        } else {
          console.log(chalk.green(`\n✅ ${result.reason}\n`));
        }
      } else {
        const analysis = await analyzeTokenUsage();
        displayTokenReport(analysis);
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("auto-update")
  .description("Start/stop automatic conversation updates every 30 minutes")
  .option("--start", "Start auto-updater daemon")
  .option("--stop", "Stop auto-updater daemon")
  .option("-i, --interval <minutes>", "Update interval in minutes (default: 30)", "30")
  .action(async (options) => {
    try {
      if (options.start) {
        const AutoUpdater = require('../src/auto-updater');
        const interval = parseInt(options.interval) || 30;
        const updater = new AutoUpdater(interval);
        await updater.start();
      } else if (options.stop) {
        console.log(chalk.yellow('To stop auto-updater, use Ctrl+C in the running terminal'));
        console.log(chalk.gray('Or kill the process using: pkill -f "auto-updater"'));
      } else {
        console.log(chalk.cyan('🤖 Auto-updater Commands:\n'));
        console.log(chalk.green('  npx aic auto-update --start'));
        console.log(chalk.gray('    Start 30-minute auto-updates\n'));
        console.log(chalk.green('  npx aic auto-update --start --interval 15'));
        console.log(chalk.gray('    Start 15-minute auto-updates\n'));
        console.log(chalk.green('  npx aic update --conversation'));
        console.log(chalk.gray('    Manual update (alias: quick update)\n'));
      }
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

// Disabled - deprecated universal setup command
// program
//   .command("universal")
//   .description("Setup Universal AI Memory System for ALL AI assistants")
//   .action(async (options) => {
//     console.log(chalk.yellow('⚠️  The universal command has been deprecated.'));
//     console.log(chalk.dim('   Use standard "npx aic init" instead.'));
//   });

// Disabled - deprecated session_dump command
// program
//   .command("session_dump")
//   .description("Auto session dump when conversation reaches ~12k tokens")
//   .action(async (options) => {
//     console.log(chalk.yellow('⚠️  The session_dump command has been deprecated.'));
//     console.log(chalk.dim('   Use "npx aic checkpoint --file <filename>" instead.'));
//   });

// Disabled - deprecated hourglass command
// program
//   .command("hourglass <action>")
//   .description("Detection-Hourglass-System (DHS) for automatic conversation chunking")
//   .action(async (action, options) => {
//     console.log(chalk.yellow('⚠️  The hourglass command has been deprecated.'));
//     console.log(chalk.dim('   Use "npx aic extract-conversation <id>" for SQLite-based extraction instead.'));
//   });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
