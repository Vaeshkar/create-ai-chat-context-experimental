#!/usr/bin/env node

/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * CLI Entry Point
 * Phase 6-8: Cache-First Architecture - October 2025
 *
 * Main CLI interface for automatic conversation capture and memory consolidation
 */

// Load environment variables from .env.local and .env (in that order)
// .env.local takes precedence over .env
import { config as dotenvConfig } from 'dotenv';
import { existsSync } from 'fs';
import { join as pathJoin } from 'path';

// Load .env first (lower priority)
const envPath = pathJoin(process.cwd(), '.env');
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });
}

// Load .env.local second (higher priority, overrides .env)
const envLocalPath = pathJoin(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  dotenvConfig({ path: envLocalPath, override: true });
}

import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { WatcherCommand } from './commands/WatcherCommand.js';
import { InitCommand } from './commands/InitCommand.js';
import { MigrateCommand } from './commands/MigrateCommand.js';
import { MigrateOldAICFCommand } from './commands/MigrateOldAICFCommand.js';
import { ImportClaudeCommand } from './commands/ImportClaudeCommand.js';
import { PermissionsCommand } from './commands/PermissionsCommand.js';
import { StartCommand } from './commands/StartCommand.js';
import { StopCommand } from './commands/StopCommand.js';
import { StatusCommand } from './commands/StatusCommand.js';
import { QueryCommand } from './commands/QueryCommand.js';
import { ProfileCommand } from './commands/ProfileCommand.js';
import { MemoryCommand } from './commands/MemoryCommand.js';
import { SnapshotCommand } from './commands/SnapshotCommand.js';
import { RecoverCommand } from './commands/RecoverCommand.js';
import { HealthCommand } from './commands/HealthCommand.js';
import { QuadIndexQueryCommand } from './commands/QuadIndexQueryCommand.js';
import { QuadIndexStatsCommand } from './commands/QuadIndexStatsCommand.js';
import { ValidateCommand } from './commands/ValidateCommand.js';
import { AuditCommand } from './commands/AuditCommand.js';
import { FinishCommand } from './commands/FinishCommand.js';
import { InstallHooksCommand } from './commands/InstallHooksCommand.js';
import { PlatformConfigCommand } from './commands/PlatformConfigCommand.js';
import { DeduplicateCommand } from './commands/DeduplicateCommand.js';

/**
 * Get version dynamically from package.json
 * Tries multiple locations to find package.json
 */
function getVersion(): string {
  let moduleDir = process.cwd();

  // Try to get the module directory from import.meta.url (ESM only)
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - import.meta is only available in ESM, not in CommonJS
    const __filename = new URL(import.meta.url).pathname;
    moduleDir = dirname(__filename);
    if (process.env['DEBUG_AICE'])
      console.error('[DEBUG] Got moduleDir from import.meta.url:', moduleDir);
  } catch (e) {
    // Fallback for CJS - use process.cwd()
    if (process.env['DEBUG_AICE'])
      console.error(
        '[DEBUG] Failed to get import.meta.url:',
        e instanceof Error ? e.message : String(e)
      );
  }

  const possiblePaths = [
    // Try common global install paths FIRST (most reliable)
    '/opt/homebrew/lib/node_modules/create-ai-chat-context-experimental/package.json',
    '/usr/local/lib/node_modules/create-ai-chat-context-experimental/package.json',
    '/usr/lib/node_modules/create-ai-chat-context-experimental/package.json',
    // For compiled ESM: dist/esm/cli.js -> dist/esm -> dist -> package.json
    join(moduleDir, '..', '..', 'package.json'),
    // For compiled CJS: dist/cjs/cli.js -> dist/cjs -> dist -> package.json
    join(moduleDir, '..', '..', 'package.json'),
    // Fallback: try from current working directory
    join(process.cwd(), 'package.json'),
    join(process.cwd(), '..', 'package.json'),
    join(process.cwd(), '..', '..', 'package.json'),
  ];

  for (const path of possiblePaths) {
    try {
      const packageJson = JSON.parse(readFileSync(path, 'utf-8'));
      if (packageJson.name === 'create-ai-chat-context-experimental') {
        if (process.env['DEBUG_AICE']) console.error('[DEBUG] Found version at:', path);
        return packageJson.version;
      }
    } catch {
      // Continue
    }
  }

  if (process.env['DEBUG_AICE']) console.error('[DEBUG] No package.json found');
  return 'unknown';
}

const program = new Command();

program
  .name('aether')
  .description('AETHER - Distributed AI Memory System with automatic learning')
  .version(getVersion());

// Init command
program
  .command('init')
  .description('Initialize aicf-watcher in a project')
  .option('-f, --force', 'Overwrite existing files')
  .option('-v, --verbose', 'Show detailed output')
  .option('-m, --mode <mode>', 'Mode: manual or automatic (default: automatic)', 'automatic')
  .option('-a, --automatic', 'Use automatic mode (alias for --mode automatic)')
  .action(async (options) => {
    try {
      const initCmd = new InitCommand({
        force: options.force,
        verbose: options.verbose,
      });

      const result = await initCmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Migrate command
program
  .command('migrate')
  .description('Migrate from create-ai-chat-context to automatic mode')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const migrateCmd = new MigrateCommand({
        verbose: options.verbose,
      });

      const result = await migrateCmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Migrate Old AICF command
program
  .command('migrate-aicf')
  .description('Convert old v3.0-alpha AICF files to new JSON format')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const migrateOldCmd = new MigrateOldAICFCommand({
        verbose: options.verbose,
      });

      await migrateOldCmd.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Watcher command (internal - used by watch-terminal)
program
  .command('watch')
  .description('Start watcher (internal command - use watch-terminal instead)')
  .option(
    '-i, --interval <ms>',
    'Check interval in milliseconds (default: 300000 / 5 minutes)',
    '300000'
  )
  .option(
    '-d, --dir <path>',
    'Directory to watch for LLM data (default: current directory)',
    process.cwd()
  )
  .option('-v, --verbose', 'Enable verbose output')
  .option('--augment', 'Enable Augment platform')
  .option('--warp', 'Enable Warp platform')
  .option('--claude-desktop', 'Enable Claude Desktop platform')
  .option('--claude-cli', 'Enable Claude CLI platform')
  .option('--copilot', 'Enable Copilot platform')
  .option('--chatgpt', 'Enable ChatGPT platform')
  .action(async (options) => {
    try {
      const watcher = new WatcherCommand({
        interval: options.interval,
        dir: options.dir,
        verbose: options.verbose,
        augment: options.augment,
        warp: options.warp,
        claudeDesktop: options.claudeDesktop,
        claudeCli: options.claudeCli,
        copilot: options.copilot,
        chatgpt: options.chatgpt,
      });
      await watcher.start();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Watch in Terminal command (macOS only)
program
  .command('watch-terminal')
  .description('Start watcher in a new Terminal window (macOS only)')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    try {
      const { spawn } = await import('child_process');

      // Get project root
      const projectRoot = process.cwd();

      // Build the command to run in the new terminal
      // Create a wrapper script that closes the window after watcher exits
      const verboseFlag = options.verbose ? '--verbose' : '';
      const watcherCommand = `npx tsx packages/aice/src/cli.ts watch ${verboseFlag}`;

      // Create a self-closing wrapper script
      // Use $PPID to get the Terminal tab/window process and close it
      const wrapperScript = `
cd '${projectRoot}'
clear
echo '🚀 Starting AETHER Watcher...'
echo ''

# Run the watcher
${watcherCommand}
WATCHER_EXIT=$?

# Show closing message
echo ''
echo 'Watcher stopped. Closing window in 2 seconds...'
sleep 2

# Close this Terminal tab by killing the parent shell
# This works reliably regardless of window title
kill -9 $PPID

exit $WATCHER_EXIT
`.trim();

      // Write wrapper script to temp file
      const { writeFileSync, chmodSync } = await import('fs');
      const { tmpdir } = await import('os');
      const { join } = await import('path');
      const tmpScript = join(tmpdir(), `aether-watcher-${Date.now()}.sh`);
      writeFileSync(tmpScript, wrapperScript, 'utf-8');
      chmodSync(tmpScript, 0o755);

      // AppleScript to open new Terminal window (without stealing focus)
      const appleScript = `
tell application "Terminal"
    set newWindow to do script "${tmpScript}"
    set custom title of newWindow to "AETHER Watcher"
end tell
`;

      // Execute AppleScript (fire and forget)
      const osascript = spawn('osascript', ['-e', appleScript], {
        detached: true,
        stdio: 'ignore',
      });

      osascript.unref();

      // Give it a moment to start
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log(chalk.green('✅ Watcher started in new terminal window'));
      console.log(chalk.dim('   Check the new Terminal window to see watcher output'));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Start command (unified watcher + guardian)
program
  .command('start')
  .description('Start AETHER services (watcher + guardian)')
  .option('-v, --verbose', 'Show detailed output')
  .option('--watcher-only', 'Start only the watcher')
  .option('--guardian-only', 'Start only the guardian')
  .action(async (options) => {
    try {
      const startCmd = new StartCommand({
        verbose: options.verbose,
        watcherOnly: options.watcherOnly,
        guardianOnly: options.guardianOnly,
      });

      const result = await startCmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Stop command (unified watcher + guardian)
program
  .command('stop')
  .description('Stop AETHER services (watcher + guardian)')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const stopCmd = new StopCommand({
        verbose: options.verbose,
      });

      const result = await stopCmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Restart command (unified watcher + guardian)
program
  .command('restart')
  .description('Restart AETHER services (watcher + guardian)')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      // Stop first
      const stopCmd = new StopCommand({
        verbose: options.verbose,
      });

      const stopResult = await stopCmd.execute();
      if (!stopResult.ok && !stopResult.error.message.includes('not running')) {
        console.error(chalk.red('❌ Error stopping:'), stopResult.error.message);
        process.exit(1);
      }

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Start again
      const startCmd = new StartCommand({
        verbose: options.verbose,
      });

      const startResult = await startCmd.execute();
      if (!startResult.ok) {
        console.error(chalk.red('❌ Error starting:'), startResult.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Status command (unified watcher + guardian)
program
  .command('status')
  .description('Show AETHER services status (watcher + guardian)')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const statusCmd = new StatusCommand({
        verbose: options.verbose,
      });

      const result = await statusCmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Import Claude command
program
  .command('import-claude <file>')
  .description('Import Claude conversation export and generate memory files')
  .option(
    '-o, --output <dir>',
    'Output directory for memory files (default: .cache/llm/claude)',
    '.cache/llm/claude'
  )
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (file, options) => {
    try {
      const cmd = new ImportClaudeCommand({
        output: options.output,
        verbose: options.verbose,
      });

      const result = await cmd.execute(file);

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }

      console.log(chalk.green('✅ Import successful'));
      console.log(chalk.dim(`   Conversation: ${result.value.conversationId}`));
      console.log(chalk.dim(`   Messages: ${result.value.messageCount}`));
      console.log(chalk.dim(`   Output: ${result.value.outputPath}`));
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats')
  .description('Show knowledge base statistics and insights')
  .action(async () => {
    try {
      const cwd = process.cwd();
      const { getKnowledgeBaseStats } = await import('./utils/StatsUtils.js');
      const stats = await getKnowledgeBaseStats(cwd);

      console.log(chalk.bold.cyan('\n📊 Knowledge Base Statistics\n'));
      console.log(chalk.bold('📝 Content:'));
      console.log(`   Total files:              ${stats.totalFiles}`);
      console.log(`   Total lines:              ${stats.totalLines.toLocaleString()}`);
      console.log(`   Total words:              ${stats.totalWords.toLocaleString()}`);
      console.log(`   Estimated tokens:         ~${stats.estimatedTokens.toLocaleString()}`);
      console.log(`   Conversation entries:     ${stats.conversationEntries}`);
      console.log();

      console.log(chalk.bold('📂 Directory Breakdown:'));
      console.log(`   .aicf/ files:             ${stats.aicfFiles}`);
      console.log(`   .ai/ files:               ${stats.aiFiles}`);
      console.log();

      console.log(chalk.bold('⏱️  Timestamps:'));
      console.log(`   Oldest entry:             ${stats.oldestEntry || 'N/A'}`);
      console.log(`   Newest entry:             ${stats.newestEntry || 'N/A'}`);
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Tokens command
program
  .command('tokens')
  .description('Show token usage breakdown of knowledge base')
  .option('-a, --all', 'Show all AI models (default: show top 4)')
  .action(async (options) => {
    try {
      const cwd = process.cwd();
      const { displayTokenUsage } = await import('./utils/TokenDisplayUtils.js');
      await displayTokenUsage(cwd, options.all);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Permissions command
program
  .command('permissions <action> [platform]')
  .description('Manage platform permissions (list, grant, revoke)')
  .action(async (action, platform) => {
    try {
      const cmd = new PermissionsCommand({ cwd: process.cwd() });
      const result = await cmd.execute(action, platform);

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Query command
program
  .command('query <text>')
  .description('Query conversations using ConversationRAG')
  .option('-k, --top-k <number>', 'Number of results to return (default: 5)', '5')
  .option('-t, --type <type>', 'Filter by type: conversation, decision, or insight')
  .option('--date-from <date>', 'Filter by date from (YYYY-MM-DD)')
  .option('--date-to <date>', 'Filter by date to (YYYY-MM-DD)')
  .option('-r, --reindex', 'Reindex conversations before querying')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (text, options) => {
    try {
      const cmd = new QueryCommand({ cwd: process.cwd() });
      await cmd.execute(text, {
        topK: parseInt(options.topK, 10),
        type: options.type,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        reindex: options.reindex,
        verbose: options.verbose,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Profile command
program
  .command('profile <action>')
  .description('Manage user profile (show, edit, clear, privacy)')
  .action(async (action) => {
    try {
      const cmd = new ProfileCommand({ cwd: process.cwd() });

      switch (action) {
        case 'show':
          await cmd.show();
          break;
        case 'edit':
          await cmd.edit();
          break;
        case 'clear':
          await cmd.clear();
          break;
        case 'privacy':
          await cmd.privacy();
          break;
        default:
          console.error(chalk.red('❌ Unknown action:'), action);
          console.log(chalk.gray('   Valid actions: show, edit, clear, privacy'));
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Memory command
program
  .command('memory <type> <query>')
  .description(
    'Query memory types (principles, decisions, profile, rejected, relationships, hypotheticals, all)'
  )
  .option('-k, --top-k <number>', 'Number of results to return (default: 5)', '5')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (type, query, options) => {
    try {
      const cmd = new MemoryCommand({ cwd: process.cwd() });
      await cmd.execute(type, query, {
        topK: parseInt(options.topK, 10),
        verbose: options.verbose,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Snapshot commands
program
  .command('snapshot <action>')
  .description('Manage QuadIndex snapshots (actions: take, list, restore, stats)')
  .option('-t, --type <type>', 'Snapshot type: rolling or golden (default: rolling)', 'rolling')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (action, options) => {
    try {
      const cmd = new SnapshotCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
      });

      const type = options.type as 'rolling' | 'golden';

      switch (action) {
        case 'take':
          await cmd.take(type);
          break;
        case 'list':
          await cmd.list();
          break;
        case 'restore':
          await cmd.restore(type);
          break;
        case 'stats':
          await cmd.stats();
          break;
        default:
          console.error(chalk.red('❌ Unknown action:'), action);
          console.log(chalk.gray('   Valid actions: take, list, restore, stats'));
          process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Recover command (Task 4e: Fallback Recovery)
// Rebuilds QuadIndex from raw JSON conversation files if snapshots are corrupted
program
  .command('recover')
  .description('Recover QuadIndex from raw JSON conversation files (fallback recovery)')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const cmd = new RecoverCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
      });

      const result = await cmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Health command (Task 2: Health Metrics Dashboard)
program
  .command('health')
  .description('Show QuadIndex health metrics and system status')
  .option('-v, --verbose', 'Show detailed metrics and analysis')
  .option('-s, --save', 'Save metrics to file')
  .action(async (options) => {
    try {
      const cmd = new HealthCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
        save: options.save,
      });

      const result = await cmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error?.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// QuadIndex query command
program
  .command('quad-query <text>')
  .description('Query QuadIndex (4 stores: Vector, Metadata, Graph, Reasoning)')
  .option(
    '-s, --store <type>',
    'Store to query: vector, metadata, graph, or reasoning (default: vector)'
  )
  .option('-k, --limit <number>', 'Number of results to return (default: 5)', '5')
  .option('-c, --min-confidence <number>', 'Minimum confidence threshold (0-1)', '0')
  .option('--status <status>', 'Filter by status (pending|validated|active|deprecated)')
  .option('-r, --include-relationships', 'Include relationships (graph store)')
  .option('--include-conversations', 'Include full conversation content (Phase 3)')
  .option('--max-conversation-messages <number>', 'Max messages per conversation (default: 5)', '5')
  .option('-i, --max-iterations <number>', 'Max reasoning iterations (reasoning store)', '3')
  .option('-m, --models <models>', 'Filter by models (comma-separated)')
  .option('-o, --offset <number>', 'Results offset for pagination', '0')
  .option('-j, --json', 'Output as JSON (for AI consumption)')
  .option('-v, --verbose', 'Show detailed output')
  .option('-q, --quadindex', 'Query all 4 stores (Vector, Metadata, Graph, Reasoning)')
  .option('-l, --lill', 'Full LILL context (4 stores + relationships + conversations + reasoning)')
  .option('--no-relevance-scoring', 'Disable new relevance scoring (use legacy confidence-only)')
  .option('--conversation-id <id>', 'Current conversation ID (for context boosting)')
  .option('--min-relevance-score <number>', 'Minimum final score threshold (0-1)', '0')
  .option('--show-scoring-breakdown', 'Show detailed scoring breakdown (Phase 1, 2, 3)')
  .action(async (text, options) => {
    try {
      // Phase 4c: Handle shortcut flags
      if (options.lill) {
        // Full LILL context: all 4 stores + relationships + conversations + reasoning
        options.includeRelationships = true;
        options.includeConversations = true;
        options.maxConversationMessages = options.maxConversationMessages || '5';
        options.maxIterations = options.maxIterations || '3';
        options.limit = options.limit || '10';
      } else if (options.quadindex) {
        // Query all 4 stores (but no extra context)
        options.limit = options.limit || '10';
      }

      const cmd = new QuadIndexQueryCommand({ cwd: process.cwd() });
      await cmd.execute(text, {
        store: options.store as 'vector' | 'metadata' | 'graph' | 'reasoning',
        limit: parseInt(options.limit, 10),
        minConfidence: parseFloat(options.minConfidence),
        status: options.status,
        includeRelationships: options.includeRelationships,
        includeConversations: options.includeConversations,
        maxConversationMessages: parseInt(options.maxConversationMessages, 10),
        maxIterations: parseInt(options.maxIterations, 10),
        models: options.models ? options.models.split(',') : undefined,
        offset: parseInt(options.offset, 10),
        json: options.json,
        verbose: options.verbose,
        // NEW: Relevance scoring options (Phase 1, 2, 3)
        useRelevanceScoring: options.relevanceScoring !== false, // Default: true
        currentConversationId: options.conversationId,
        minRelevanceScore: parseFloat(options.minRelevanceScore || '0'),
        showScoringBreakdown: options.showScoringBreakdown,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// QuadIndex stats command
program
  .command('quad-stats')
  .description('Show QuadIndex statistics (all 4 stores)')
  .option('-j, --json', 'Output as JSON (for AI consumption)')
  .option('-v, --verbose', 'Show detailed statistics')
  .action(async (options) => {
    try {
      const cmd = new QuadIndexStatsCommand({ cwd: process.cwd() });
      await cmd.execute({
        json: options.json,
        verbose: options.verbose,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Build reasoning index command (Phase 4a)
program
  .command('build-reasoning-index')
  .description('Build reasoning index from conversations (Phase 4a)')
  .option('-f, --force', 'Force rebuild even if data exists')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const { BuildReasoningIndexCommand } = await import(
        './commands/BuildReasoningIndexCommand.js'
      );
      const cmd = new BuildReasoningIndexCommand({
        cwd: process.cwd(),
        force: options.force,
        verbose: options.verbose,
      });
      await cmd.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Visualize graph command (Phase 4d)
program
  .command('visualize-graph')
  .description('Generate interactive D3.js visualization of QuadIndex (Phase 4d)')
  .option('-o, --output <file>', 'Output HTML file', 'quadindex-graph.html')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const { VisualizeGraphCommand } = await import('./commands/VisualizeGraphCommand.js');
      const cmd = new VisualizeGraphCommand({
        cwd: process.cwd(),
        output: options.output,
        verbose: options.verbose,
      });
      await cmd.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Reprocess conversations command
program
  .command('reprocess')
  .description('Reprocess conversations from LevelDB with fixed extractors (no truncation)')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--dry-run', 'Show what would be done without making changes')
  .action(async (options) => {
    try {
      const { reprocessConversations } = await import('./scripts/reprocess-conversations.js');
      await reprocessConversations({
        cwd: process.cwd(),
        verbose: options.verbose,
        dryRun: options.dryRun,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('build-index')
  .description('Build QuadIndex from all existing conversations in .lill/raw/')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--force', 'Force rebuild even if snapshot exists')
  .action(async (options) => {
    try {
      const { BuildIndexCommand } = await import('./commands/BuildIndexCommand.js');
      const command = new BuildIndexCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
        force: options.force,
      });
      await command.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('build-index-from-memories')
  .description('Build QuadIndex from Augment-Memories files (distilled insights)')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--force', 'Force rebuild even if snapshot exists')
  .action(async (options) => {
    try {
      const { BuildIndexFromMemoriesCommand } = await import(
        './commands/BuildIndexFromMemoriesCommand.js'
      );
      const command = new BuildIndexFromMemoriesCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
        force: options.force,
      });
      await command.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Build index from conversations command
program
  .command('build-index-from-conversations')
  .description('Index conversations from raw JSON files to QuadIndex')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--force', 'Force rebuild even if snapshot exists')
  .option('--no-link', 'Skip linking conversations to principles')
  .action(async (options) => {
    try {
      const { BuildIndexFromConversationsCommand } = await import(
        './commands/BuildIndexFromConversationsCommand.js'
      );
      const command = new BuildIndexFromConversationsCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
        force: options.force,
        linkToPrinciples: options.link !== false,
      });
      await command.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Validate principle command
program
  .command('validate <principle-id>')
  .description('Validate a principle and increase its confidence')
  .option('-c, --confidence <score>', 'Set specific confidence score (0.0-1.0)', parseFloat)
  .option('-r, --reason <text>', 'Reason for validation')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (principleId: string, options) => {
    try {
      const cmd = new ValidateCommand({ cwd: process.cwd(), verbose: options.verbose });
      await cmd.execute(principleId, {
        cwd: process.cwd(),
        verbose: options.verbose,
        confidence: options.confidence,
        reason: options.reason,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Validate multiple principles command
program
  .command('validate-batch <principle-ids...>')
  .description('Validate multiple principles at once')
  .option('-c, --confidence <score>', 'Set specific confidence score (0.0-1.0)', parseFloat)
  .option('-r, --reason <text>', 'Reason for validation')
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (principleIds: string[], options) => {
    try {
      const cmd = new ValidateCommand({ cwd: process.cwd(), verbose: options.verbose });
      await cmd.executeBatch(principleIds, {
        cwd: process.cwd(),
        verbose: options.verbose,
        confidence: options.confidence,
        reason: options.reason,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Audit command
program
  .command('audit')
  .description('Check rule compliance and violations')
  .option('-s, --since <date>', 'Show violations since date (ISO format)')
  .option('-v, --verbose', 'Show detailed information including stack traces')
  .option('-r, --report', 'Show detailed compliance report')
  .option('-j, --json', 'Output as JSON (for CI integration)')
  .option('--clear', 'Clear audit log')
  .option('--show-path', 'Show audit log file path')
  .action(async (options) => {
    try {
      const cmd = new AuditCommand({ cwd: process.cwd() });

      if (options.clear) {
        await cmd.clear();
        return;
      }

      if (options.showPath) {
        cmd.showLogPath();
        return;
      }

      await cmd.run({
        cwd: process.cwd(),
        since: options.since,
        verbose: options.verbose,
        report: options.report,
        json: options.json,
      });
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Finish command
program
  .command('finish')
  .description('Complete AI session and prepare handoff')
  .option('-t, --topic <topic>', 'Session topic')
  .option('-w, --what <what>', 'What was accomplished')
  .option('-y, --why <why>', 'Why this work was done')
  .option('-o, --outcome <outcome>', 'Session outcome')
  .option('--aicf', 'Migrate to AICF 3.0 format')
  .option('--no-commit', 'Skip git commit')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const finishCmd = new FinishCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
      });

      const result = await finishCmd.execute({
        topic: options.topic,
        what: options.what,
        why: options.why,
        outcome: options.outcome,
        aicf: options.aicf,
        noCommit: options.noCommit,
        verbose: options.verbose,
      });

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }

      // Show handoff text at the end
      console.log(chalk.green('💡 Copy the handoff text above for your next AI chat!'));
      console.log();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Install hooks command
program
  .command('install-hooks')
  .description('Install git hooks for session end reminders')
  .option('-f, --force', 'Overwrite existing hooks')
  .option('--no-backup', 'Skip creating backups of existing hooks')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const installHooksCmd = new InstallHooksCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
      });

      const result = await installHooksCmd.execute({
        force: options.force,
        backup: options.backup,
        verbose: options.verbose,
      });

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Platform config command
program
  .command('platform-config')
  .description('Generate platform-specific configuration files')
  .option(
    '-p, --platforms <platforms...>',
    'Platforms to configure (augment, cursor, claude, warp, all)'
  )
  .option('-f, --force', 'Overwrite existing configuration files')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const platformConfigCmd = new PlatformConfigCommand({
        cwd: process.cwd(),
        verbose: options.verbose,
      });

      const result = await platformConfigCmd.execute({
        platforms: options.platforms,
        force: options.force,
        verbose: options.verbose,
      });

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Deduplicate command
program
  .command('deduplicate')
  .description('Clean up duplicate principles in QuadIndex')
  .option('--dry-run', 'Show what would be removed without making changes')
  .option('-v, --verbose', 'Show detailed output')
  .action(async (options) => {
    try {
      const cmd = new DeduplicateCommand({
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
      await cmd.execute();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Help command
program
  .command('help')
  .description('Show help information')
  .action(() => {
    program.outputHelp();
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
