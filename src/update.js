const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const readline = require("readline");

/**
 * Update knowledge base with latest template improvements
 */
async function updateKnowledgeBase(options = {}) {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, ".ai");

  // Check if .ai directory exists
  if (!(await fs.pathExists(aiDir))) {
    console.log(chalk.red("\n❌ No .ai/ directory found.\n"));
    console.log(chalk.gray("   Run: npx create-ai-chat-context init\n"));
    return;
  }

  console.log(chalk.bold.cyan("\n🔄 Checking for template updates...\n"));

  // Detect which template is being used
  const templateType = await detectTemplate(aiDir);
  console.log(chalk.gray(`   Detected template: ${chalk.cyan(templateType)}\n`));

  const templatesDir = path.join(__dirname, "../templates");
  const templateDir = path.join(templatesDir, templateType === "default" ? "ai" : templateType);

  const files = [
    "SETUP_GUIDE.md",
    "TOKEN_MANAGEMENT.md",
  ];

  const updatableFiles = [];

  // Check which files can be updated
  for (const file of files) {
    const userFilePath = path.join(aiDir, file);
    const templateFilePath = path.join(templateDir, file);

    // Skip if template file doesn't exist
    if (!(await fs.pathExists(templateFilePath))) {
      continue;
    }

    // Skip if user file doesn't exist
    if (!(await fs.pathExists(userFilePath))) {
      updatableFiles.push({
        file,
        status: "missing",
        action: "create",
      });
      continue;
    }

    // Check if files are different
    const userContent = await fs.readFile(userFilePath, "utf-8");
    const templateContent = await fs.readFile(templateFilePath, "utf-8");

    if (userContent !== templateContent) {
      updatableFiles.push({
        file,
        status: "outdated",
        action: "update",
      });
    }
  }

  if (updatableFiles.length === 0) {
    console.log(chalk.green("✅ Your knowledge base is up to date!\n"));
    console.log(chalk.gray("   No template updates available.\n"));
    return;
  }

  // Display available updates
  console.log(chalk.bold("📋 Available Updates:\n"));
  updatableFiles.forEach((item, index) => {
    const icon = item.status === "missing" ? "➕" : "🔄";
    const statusColor = item.status === "missing" ? "yellow" : "cyan";
    console.log(`   ${index + 1}. ${icon} ${chalk[statusColor](item.file)} - ${item.status}`);
  });
  console.log();

  // Ask user if they want to proceed
  if (!options.yes) {
    const proceed = await askYesNo("Do you want to apply these updates?");
    if (!proceed) {
      console.log(chalk.yellow("\n❌ Update cancelled.\n"));
      return;
    }
  }

  const spinner = ora("Applying updates...").start();

  try {
    let updated = 0;
    let created = 0;

    for (const item of updatableFiles) {
      const userFilePath = path.join(aiDir, item.file);
      const templateFilePath = path.join(templateDir, item.file);

      // Create backup if file exists
      if (await fs.pathExists(userFilePath)) {
        const backupPath = `${userFilePath}.backup`;
        await fs.copy(userFilePath, backupPath);
      }

      // Copy template file
      await fs.copy(templateFilePath, userFilePath);

      if (item.status === "missing") {
        created++;
      } else {
        updated++;
      }
    }

    spinner.succeed("Updates applied");

    console.log(chalk.green("\n✅ Knowledge base updated!\n"));
    console.log(chalk.bold("📊 Summary:\n"));
    if (created > 0) {
      console.log(`   ${chalk.green("➕")} Created: ${chalk.cyan(created)} file${created > 1 ? "s" : ""}`);
    }
    if (updated > 0) {
      console.log(`   ${chalk.cyan("🔄")} Updated: ${chalk.cyan(updated)} file${updated > 1 ? "s" : ""}`);
    }
    console.log();

    console.log(chalk.bold("💡 Notes:\n"));
    console.log("   • Backup files created with .backup extension");
    console.log("   • Review changes and customize as needed");
    console.log("   • Your custom content files were not modified");
    console.log();

    console.log(chalk.bold("🗑️  Cleanup:\n"));
    console.log(chalk.gray("   Remove backup files when satisfied:"));
    console.log(chalk.gray("   rm .ai/*.backup\n"));
  } catch (error) {
    spinner.fail("Failed to apply updates");
    throw error;
  }
}

/**
 * Detect which template is being used
 */
async function detectTemplate(aiDir) {
  const architecturePath = path.join(aiDir, "architecture.md");

  if (!(await fs.pathExists(architecturePath))) {
    return "default";
  }

  const content = await fs.readFile(architecturePath, "utf-8");

  // Check for template-specific markers
  if (content.includes("Next.js") || content.includes("App Router")) {
    return "nextjs";
  }
  if (content.includes("FastAPI") || content.includes("Django") || content.includes("Flask")) {
    return "python";
  }
  if (content.includes("Cargo") || content.includes("Rust")) {
    return "rust";
  }

  return "default";
}

/**
 * Ask yes/no question
 */
function askYesNo(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(chalk.bold(`${question} (y/n): `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

module.exports = {
  updateKnowledgeBase,
};

