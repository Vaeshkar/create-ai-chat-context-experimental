#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const { init } = require("../src/init");
const { displayTokenUsage } = require("../src/tokens");
const { archiveConversations } = require("../src/archive");
const { summarizeConversations } = require("../src/summary");
const { healthCheck } = require("../src/check");
const packageJson = require("../package.json");

const program = new Command();

program
  .name("create-ai-chat-context")
  .description("Preserve AI chat context and history across sessions")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize .ai/ knowledge base system in current directory")
  .option("-f, --force", "Overwrite existing files")
  .option("--no-git", "Skip Git integration")
  .action(async (options) => {
    try {
      await init(options);
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("check")
  .description("Quick health check of .ai/ knowledge base")
  .action(async () => {
    try {
      await healthCheck();
    } catch (error) {
      console.error(chalk.red("Error:"), error.message);
      process.exit(1);
    }
  });

program
  .command("tokens")
  .description("Show detailed token usage breakdown of .ai/ knowledge base")
  .action(async () => {
    try {
      await displayTokenUsage();
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

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
