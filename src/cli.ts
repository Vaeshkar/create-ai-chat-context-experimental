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

// Version from package.json
const VERSION = '3.0.0-alpha';

const program = new Command();

program
  .name('create-ai-chat-context')
  .description('AI Chat Context & Memory System - TypeScript Edition')
  .version(VERSION);

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
  .description('Start background watcher for automatic checkpoint processing')
  .option('-i, --interval <ms>', 'Check interval in milliseconds (default: 5000)', '5000')
  .option(
    '-d, --dir <path>',
    'Directory to watch for checkpoints (default: ./checkpoints)',
    './checkpoints'
  )
  .option('-v, --verbose', 'Enable verbose output')
  .action(async (options) => {
    try {
      const watcher = new WatcherCommand(options);
      await watcher.start();
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
