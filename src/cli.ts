#!/usr/bin/env node

/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * CLI Entry Point
 * Phase 3: CLI Integration - October 2025
 *
 * Main CLI interface for checkpoint processing and memory file generation
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { CheckpointProcessor } from './commands/CheckpointProcessor.js';
import { WatcherCommand } from './commands/WatcherCommand.js';
import { InitCommand } from './commands/InitCommand.js';
import { MigrateCommand } from './commands/MigrateCommand.js';
import { ImportClaudeCommand } from './commands/ImportClaudeCommand.js';

// Version - automatically updated during build
const VERSION = '3.0.0-alpha.11';

const program = new Command();

program
  .name('aice')
  .description('AI Chat Context Experimental - Automatic mode with watchers')
  .version(VERSION);

// Init command
program
  .command('init')
  .description('Initialize aicf-watcher in a project')
  .option('-f, --force', 'Overwrite existing files')
  .option('-v, --verbose', 'Show detailed output')
  .option('-m, --mode <mode>', 'Mode: manual or automatic (default: automatic)', 'automatic')
  .action(async (options) => {
    try {
      const initCmd = new InitCommand({
        force: options.force,
        verbose: options.verbose,
        mode: options.mode as 'manual' | 'automatic',
      });

      const result = await initCmd.execute();

      if (!result.ok) {
        console.error(chalk.red('❌ Error:'), result.error.message);
        process.exit(1);
      }

      if (result.value.mode === 'manual') {
        console.log(chalk.blue('ℹ️  Manual Mode:'));
        console.log(chalk.dim('   Use create-ai-chat-context for manual memory updates'));
        console.log(chalk.dim('   Link: https://github.com/Vaeshkar/create-ai-chat-context'));
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

// Checkpoint processing command
program
  .command('checkpoint <file>')
  .description('Process checkpoint file and generate memory files (.aicf and .ai)')
  .option('-o, --output <dir>', 'Output directory for memory files (default: .aicf/)', '.aicf')
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-backup', 'Skip creating backup of existing files')
  .action(async (file, options) => {
    try {
      const processor = new CheckpointProcessor(options);
      await processor.process(file);
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Watcher command
program
  .command('watch')
  .description('Start watcher for automatic checkpoint processing')
  .option(
    '-i, --interval <ms>',
    'Check interval in milliseconds (default: 300000 / 5 minutes)',
    '300000'
  )
  .option(
    '-d, --dir <path>',
    'Directory to watch for checkpoints (default: ./checkpoints)',
    './checkpoints'
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
