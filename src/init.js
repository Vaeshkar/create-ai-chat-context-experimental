const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const { getTokenUsage } = require("./tokens");

async function init(options = {}) {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, ".ai");
  const aiInstructions = path.join(cwd, ".ai-instructions");
  const newChatPrompt = path.join(cwd, "NEW_CHAT_PROMPT.md");

  console.log(
    chalk.bold.cyan("\n🚀 Initializing AI Knowledge Base System...\n")
  );

  // Check if .ai directory already exists
  if (fs.existsSync(aiDir) && !options.force) {
    console.log(chalk.yellow("⚠️  .ai/ directory already exists!"));
    console.log(chalk.gray("   Use --force to overwrite\n"));
    process.exit(1);
  }

  const spinner = ora("Creating directory structure...").start();

  try {
    // Create .ai directory
    await fs.ensureDir(aiDir);
    spinner.succeed("Created .ai/ directory");

    // Copy template files
    const templatesDir = path.join(__dirname, "../templates");

    spinner.start("Copying template files...");

    // Copy all template files to .ai directory
    const templateFiles = [
      "README.md",
      "architecture.md",
      "conversation-log.md",
      "technical-decisions.md",
      "known-issues.md",
      "next-steps.md",
      "SETUP_GUIDE.md",
      "TOKEN_MANAGEMENT.md",
    ];

    for (const file of templateFiles) {
      const src = path.join(templatesDir, "ai", file);
      const dest = path.join(aiDir, file);
      await fs.copy(src, dest);
    }

    // Copy .ai-instructions to root
    await fs.copy(
      path.join(templatesDir, "ai-instructions.md"),
      aiInstructions
    );

    // Copy NEW_CHAT_PROMPT.md to root
    await fs.copy(path.join(templatesDir, "NEW_CHAT_PROMPT.md"), newChatPrompt);

    spinner.succeed("Copied all template files");

    // Update README.md if it exists
    const readmePath = path.join(cwd, "README.md");
    if (fs.existsSync(readmePath)) {
      spinner.start("Updating README.md...");

      const readme = await fs.readFile(readmePath, "utf-8");

      // Check if AI section already exists
      if (!readme.includes("FOR AI ASSISTANTS")) {
        const aiSection = `
---

## 🚨 FOR AI ASSISTANTS: READ THIS FIRST 🚨

**CRITICAL: Before working on this project, read the \`.ai/\` knowledge base:**

1. **\`.ai/architecture.md\`** - Complete system architecture
2. **\`.ai/conversation-log.md\`** - Key decisions from previous chats
3. **\`.ai/technical-decisions.md\`** - Why we chose X over Y

**Why?** This preserves institutional knowledge so you have full context immediately.

**See \`.ai-instructions\` file for detailed instructions.**

---

`;

        // Insert after first heading
        const lines = readme.split("\n");
        const firstHeadingIndex = lines.findIndex((line) =>
          line.startsWith("#")
        );

        if (firstHeadingIndex !== -1) {
          // Find the end of the first section (next heading or empty line)
          let insertIndex = firstHeadingIndex + 1;
          while (
            insertIndex < lines.length &&
            lines[insertIndex].trim() !== "" &&
            !lines[insertIndex].startsWith("#")
          ) {
            insertIndex++;
          }

          lines.splice(insertIndex, 0, aiSection);
          await fs.writeFile(readmePath, lines.join("\n"));
          spinner.succeed("Updated README.md with AI section");
        } else {
          spinner.warn("Could not find heading in README.md, skipping update");
        }
      } else {
        spinner.info("README.md already has AI section");
      }
    } else {
      spinner.info("No README.md found, skipping");
    }

    // Git integration
    if (options.git !== false) {
      spinner.start("Checking Git status...");

      const gitDir = path.join(cwd, ".git");
      if (fs.existsSync(gitDir)) {
        spinner.info("Git repository detected (remember to commit changes)");
      } else {
        spinner.info("No Git repository found");
      }
    }

    // Success message
    console.log(
      chalk.bold.green(
        "\n✅ AI Knowledge Base System initialized successfully!\n"
      )
    );

    console.log(chalk.bold("📝 Next steps:\n"));
    console.log("1. Customize the files for your project:");
    console.log(
      chalk.gray(
        "   vim .ai/architecture.md        # Update with YOUR architecture"
      )
    );
    console.log(
      chalk.gray("   vim .ai/technical-decisions.md # Document YOUR decisions")
    );
    console.log(
      chalk.gray("   vim .ai/conversation-log.md    # Start YOUR log\n")
    );

    console.log("2. Commit to Git:");
    console.log(
      chalk.gray("   git add .ai/ .ai-instructions NEW_CHAT_PROMPT.md")
    );
    console.log(
      chalk.gray('   git commit -m "feat: Add .ai/ knowledge base system"\n')
    );

    console.log("3. Test it in a new AI chat:");
    console.log(
      chalk.cyan(
        '   "Read .ai-instructions first, then help me with [your project]."\n'
      )
    );

    console.log(chalk.bold("📚 For detailed instructions, see:"));
    console.log(chalk.gray("   .ai/SETUP_GUIDE.md\n"));

    console.log(
      chalk.bold.cyan("🎉 Happy coding with persistent AI context!\n")
    );

    // Check if existing conversation log is large
    if (!options.force) {
      const conversationLogPath = path.join(aiDir, "conversation-log.md");
      if (fs.existsSync(conversationLogPath)) {
        try {
          const usage = await getTokenUsage(cwd);
          if (usage.totalTokens > 15000) {
            console.log(
              chalk.yellow("⚠️  Tip: Your existing conversation log is large.")
            );
            console.log(
              chalk.gray(
                '   Run "npx create-ai-chat-context check" to see token usage.\n'
              )
            );
          }
        } catch (err) {
          // Silently ignore errors in token check
        }
      }
    }
  } catch (error) {
    spinner.fail("Failed to initialize");
    throw error;
  }
}

module.exports = { init };
