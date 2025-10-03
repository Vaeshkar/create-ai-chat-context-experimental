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
const { handleChatFinish } = require("../src/chat-finish-v2");
const { handleConvertCommand } = require("../src/convert");
const { migrateToAICF } = require("../src/aicf-migrate");
const { handleContextCommand } = require("../src/aicf-context");
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
  .command("chat-finish")
  .description("Auto-update all knowledge base files at end of chat session")
  .action(async () => {
    try {
      await handleChatFinish();
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
  .description("Update knowledge base with latest template improvements")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options) => {
    try {
      await updateKnowledgeBase(options);
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
  .description("Convert .ai/ to .aicf/ format (AICF 2.0 - 88% token reduction)")
  .action(async () => {
    try {
      await migrateToAICF();
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

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
