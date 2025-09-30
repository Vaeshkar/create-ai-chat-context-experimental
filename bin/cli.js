#!/usr/bin/env node

const { Command } = require("commander");
const chalk = require("chalk");
const { init } = require("../src/init");
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

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
