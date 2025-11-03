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
import { StopCommand } from './commands/StopCommand.js';
import { StatusCommand } from './commands/StatusCommand.js';
import { QueryCommand } from './commands/QueryCommand.js';
import { ProfileCommand } from './commands/ProfileCommand.js';
import { MemoryCommand } from './commands/MemoryCommand.js';
import { SnapshotCommand } from './commands/SnapshotCommand.js';
import { RecoverCommand } from './commands/RecoverCommand.js';

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

// Watcher command
program
  .command('watch')
  .description('Start watcher for automatic conversation capture and consolidation')
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
  .option('--daemon', 'Run in background (daemon mode)')
  .option('--foreground', 'Run in foreground with minimal feedback (default)')
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
        daemon: options.daemon,
        foreground: options.foreground,
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

// Stop command
program
  .command('stop')
  .description('Stop the background watcher daemon')
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

// Status command
program
  .command('status')
  .description('Show watcher daemon status')
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
