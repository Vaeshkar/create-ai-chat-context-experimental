const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { execSync } = require("child_process");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function handleChatFinish(cwd = process.cwd()) {
  console.log(
    chalk.cyan("\n🎬 Chat Finish - Automatic Knowledge Base Update\n")
  );

  // Check if .ai/ directory exists
  const aiDir = path.join(cwd, ".ai");
  if (!fs.existsSync(aiDir)) {
    console.log(
      chalk.red("⚠️  No .ai/ directory found. Run 'npx aic init' first.")
    );
    rl.close();
    return;
  }

  try {
    // Step 1: Analyze git changes
    console.log(chalk.yellow("📊 Analyzing changes...\n"));
    const changes = analyzeGitChanges(cwd);

    if (changes.hasChanges) {
      console.log(chalk.green("✅ Detected changes:"));
      console.log(chalk.gray(`   • ${changes.filesChanged} files changed`));
      console.log(chalk.gray(`   • ${changes.newFiles.length} new files`));
      console.log(
        chalk.gray(`   • ${changes.modifiedFiles.length} modified files\n`)
      );
    } else {
      console.log(
        chalk.yellow("ℹ️  No git changes detected (working directory clean)\n")
      );
    }

    // Step 2: Ask smart questions
    console.log(
      chalk.cyan(
        "📝 Please answer a few questions to update your knowledge base:\n"
      )
    );

    const chatNumber = await getChatNumber(aiDir);
    console.log(chalk.gray(`   Chat number: ${chatNumber}\n`));

    const devHandle = await question(
      chalk.white(
        "1️⃣  Your name or handle (e.g., @username)? (or press Enter to skip)\n   "
      )
    );

    const mainGoal = await question(
      chalk.white("\n2️⃣  What was the main goal of this chat session?\n   ")
    );
    if (!mainGoal.trim()) {
      console.log(chalk.red("\n❌ Main goal is required. Aborting."));
      rl.close();
      return;
    }

    const decisions = await question(
      chalk.white(
        "\n3️⃣  Any important technical decisions made? (or press Enter to skip)\n   "
      )
    );

    const issues = await question(
      chalk.white(
        "\n4️⃣  Any issues found or resolved? (or press Enter to skip)\n   "
      )
    );

    const nextSteps = await question(
      chalk.white(
        "\n5️⃣  What should be done next? (or press Enter to skip)\n   "
      )
    );

    rl.close();

    // Step 3: Generate updates
    console.log(chalk.cyan("\n\n🔄 Updating knowledge base files...\n"));

    const updates = {
      chatNumber,
      devHandle: devHandle.trim(),
      mainGoal: mainGoal.trim(),
      decisions: decisions.trim(),
      issues: issues.trim(),
      nextSteps: nextSteps.trim(),
      changes,
      timestamp: new Date().toISOString().split("T")[0],
    };

    // Update conversation-log.md
    await updateConversationLog(aiDir, updates);
    console.log(chalk.green("   ✅ Updated conversation-log.md"));

    // Update technical-decisions.md (if decisions were made)
    if (updates.decisions) {
      await updateTechnicalDecisions(aiDir, updates);
      console.log(chalk.green("   ✅ Updated technical-decisions.md"));
    }

    // Update known-issues.md (if issues mentioned)
    if (updates.issues) {
      await updateKnownIssues(aiDir, updates);
      console.log(chalk.green("   ✅ Updated known-issues.md"));
    }

    // Update next-steps.md (if next steps mentioned)
    if (updates.nextSteps) {
      await updateNextSteps(aiDir, updates);
      console.log(chalk.green("   ✅ Updated next-steps.md"));
    }

    // Update architecture.md (if new files detected)
    if (updates.changes.newFiles.length > 0) {
      await updateArchitecture(aiDir, updates);
      console.log(chalk.green("   ✅ Updated architecture.md"));
    }

    console.log(chalk.green("\n✨ Knowledge base updated successfully!\n"));
    console.log(chalk.cyan("💡 Next steps:"));
    console.log(chalk.gray("   1. Review the updated .ai/ files"));
    console.log(
      chalk.gray(
        "   2. Commit changes: git add .ai/ && git commit -m 'Update knowledge base'"
      )
    );
    console.log(chalk.gray("   3. Start your next chat with full context!\n"));
  } catch (error) {
    console.error(chalk.red("Error:"), error.message);
    rl.close();
    process.exit(1);
  }
}

function analyzeGitChanges(cwd) {
  try {
    // Check if git repo exists
    execSync("git rev-parse --git-dir", { cwd, stdio: "ignore" });

    // Get changed files
    const status = execSync("git status --porcelain", {
      cwd,
      encoding: "utf8",
    });
    const lines = status.split("\n").filter((line) => line.trim());

    const newFiles = [];
    const modifiedFiles = [];

    lines.forEach((line) => {
      const status = line.substring(0, 2).trim();
      const file = line.substring(3).trim();

      // Skip .ai/ directory files
      if (file.startsWith(".ai/")) return;

      if (status === "A" || status === "??") {
        newFiles.push(file);
      } else if (status === "M" || status === "MM") {
        modifiedFiles.push(file);
      }
    });

    return {
      hasChanges: lines.length > 0,
      filesChanged: lines.length,
      newFiles,
      modifiedFiles,
    };
  } catch (error) {
    // Not a git repo or git not available
    return {
      hasChanges: false,
      filesChanged: 0,
      newFiles: [],
      modifiedFiles: [],
    };
  }
}

async function getChatNumber(aiDir) {
  const logPath = path.join(aiDir, "conversation-log.md");

  if (!fs.existsSync(logPath)) {
    return 1;
  }

  const content = fs.readFileSync(logPath, "utf8");

  // Find all chat numbers using flexible regex
  const matches = content.match(/^##.*Chat\s*#?(\d+)/gim);

  if (!matches || matches.length === 0) {
    return 1;
  }

  // Extract numbers and find the highest
  const numbers = matches.map((match) => {
    const num = match.match(/(\d+)/);
    return num ? parseInt(num[1], 10) : 0;
  });

  return Math.max(...numbers) + 1;
}

async function updateConversationLog(aiDir, updates) {
  const logPath = path.join(aiDir, "conversation-log.md");
  let content = fs.readFileSync(logPath, "utf8");

  // Try to find the insertion point (after "## 📋 CHAT HISTORY")
  let insertMarker = "## 📋 CHAT HISTORY (Most Recent First)\n\n---\n\n";
  let insertIndex = content.indexOf(insertMarker);

  // If not found, try alternative format (after first "---")
  if (insertIndex === -1) {
    const firstSeparator = content.indexOf("\n---\n");
    if (firstSeparator !== -1) {
      insertMarker = "\n---\n\n";
      insertIndex = firstSeparator;
    }
  }

  if (insertIndex === -1) {
    throw new Error(
      "Could not find insertion point in conversation-log.md. Please ensure the file has a '---' separator after the header."
    );
  }

  // Generate new entry
  const entry = `## Chat #${updates.chatNumber} - [Date: ${updates.timestamp}]${
    updates.devHandle ? ` - ${updates.devHandle}` : ""
  } - ${updates.mainGoal}

### What We Did

${updates.mainGoal}

${updates.decisions ? `### Key Decisions\n\n${updates.decisions}\n\n` : ""}${
    updates.issues ? `### Issues\n\n${updates.issues}\n\n` : ""
  }${updates.nextSteps ? `### Next Steps\n\n${updates.nextSteps}\n\n` : ""}${
    updates.changes.hasChanges
      ? `### Files Changed\n\n${
          updates.changes.newFiles.length > 0
            ? `**New files:**\n${updates.changes.newFiles
                .map((f) => `- ${f}`)
                .join("\n")}\n\n`
            : ""
        }${
          updates.changes.modifiedFiles.length > 0
            ? `**Modified files:**\n${updates.changes.modifiedFiles
                .map((f) => `- ${f}`)
                .join("\n")}\n\n`
            : ""
        }`
      : ""
  }---

`;

  // Insert the new entry
  const insertPosition = insertIndex + insertMarker.length;
  content =
    content.slice(0, insertPosition) + entry + content.slice(insertPosition);

  // Update "Last Updated" at the bottom
  content = content.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${updates.timestamp} (Chat #${updates.chatNumber})`
  );

  fs.writeFileSync(logPath, content, "utf8");
}

async function updateTechnicalDecisions(aiDir, updates) {
  const decisionsPath = path.join(aiDir, "technical-decisions.md");
  let content = fs.readFileSync(decisionsPath, "utf8");

  // Find insertion point (before "## Template for New Decisions")
  const insertMarker = "## Template for New Decisions";
  const insertIndex = content.indexOf(insertMarker);

  if (insertIndex === -1) {
    // Append at the end
    const entry = `\n## ${updates.mainGoal}

**Date:** ${updates.timestamp}
**Status:** ✅ Implemented

### Decision

${updates.decisions}

### Impact

- ${updates.mainGoal}

---

`;
    content += entry;
  } else {
    const entry = `## ${updates.mainGoal}

**Date:** ${updates.timestamp}
**Status:** ✅ Implemented

### Decision

${updates.decisions}

### Impact

- ${updates.mainGoal}

---

`;
    content =
      content.slice(0, insertIndex) + entry + "\n" + content.slice(insertIndex);
  }

  // Update "Last Updated"
  content = content.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${updates.timestamp}`
  );

  fs.writeFileSync(decisionsPath, content, "utf8");
}

async function updateKnownIssues(aiDir, updates) {
  const issuesPath = path.join(aiDir, "known-issues.md");
  let content = fs.readFileSync(issuesPath, "utf8");

  // Add to resolved issues section
  const insertMarker = "## ✅ Resolved Issues\n\n";
  const insertIndex = content.indexOf(insertMarker);

  if (insertIndex !== -1) {
    const entry = `### ${updates.mainGoal}

**Date Discovered:** ${updates.timestamp}
**Date Resolved:** ${updates.timestamp}
**Severity:** 🟡 Medium

**Problem:**
${updates.issues}

**Solution:**
Resolved during Chat #${updates.chatNumber}

---

`;
    const insertPosition = insertIndex + insertMarker.length;
    content =
      content.slice(0, insertPosition) + entry + content.slice(insertPosition);
  }

  // Update "Last Updated"
  content = content.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${updates.timestamp}`
  );

  fs.writeFileSync(issuesPath, content, "utf8");
}

async function updateNextSteps(aiDir, updates) {
  const nextStepsPath = path.join(aiDir, "next-steps.md");
  let content = fs.readFileSync(nextStepsPath, "utf8");

  // Add to completed section
  const completedMarker = "## ✅ Completed\n\n";
  const completedIndex = content.indexOf(completedMarker);

  if (completedIndex !== -1) {
    const entry = `- [x] ${updates.mainGoal} - ${updates.timestamp}\n`;
    const insertPosition = completedIndex + completedMarker.length;
    content =
      content.slice(0, insertPosition) + entry + content.slice(insertPosition);
  }

  // Add next steps to immediate section if provided
  if (updates.nextSteps) {
    const immediateMarker = "## 🔥 Immediate (This Week)\n\n";
    const immediateIndex = content.indexOf(immediateMarker);

    if (immediateIndex !== -1) {
      const entry = `- [ ] ${updates.nextSteps}\n`;
      const insertPosition = immediateIndex + immediateMarker.length;
      content =
        content.slice(0, insertPosition) +
        entry +
        content.slice(insertPosition);
    }
  }

  // Update "Last Updated"
  content = content.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${updates.timestamp}`
  );

  fs.writeFileSync(nextStepsPath, content, "utf8");
}

async function updateArchitecture(aiDir, updates) {
  const archPath = path.join(aiDir, "architecture.md");
  let content = fs.readFileSync(archPath, "utf8");

  // Update "Last Updated"
  content = content.replace(
    /\*\*Last Updated:\*\* .*/,
    `**Last Updated:** ${updates.timestamp}`
  );

  fs.writeFileSync(archPath, content, "utf8");
}

module.exports = { handleChatFinish };
