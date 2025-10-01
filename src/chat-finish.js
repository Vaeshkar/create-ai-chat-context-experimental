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

function generateAutoSummary(changes) {
  const summary = {
    mainGoal: "",
    decisions: "",
    issues: "",
    nextSteps: "",
  };

  // Generate main goal from commits and file changes
  if (changes.recentCommits.length > 0) {
    const commitMessages = changes.recentCommits.map((c) => c.message);

    // Detect patterns in commit messages
    const hasFeature = commitMessages.some((m) => m.match(/feat|feature|add/i));
    const hasFix = commitMessages.some((m) => m.match(/fix|bug|resolve/i));
    const hasDocs = commitMessages.some((m) => m.match(/doc|readme|guide/i));
    const hasRefactor = commitMessages.some((m) =>
      m.match(/refactor|improve|enhance/i)
    );

    const activities = [];
    if (hasFeature) activities.push("new features");
    if (hasFix) activities.push("bug fixes");
    if (hasDocs) activities.push("documentation");
    if (hasRefactor) activities.push("refactoring");

    if (activities.length > 0) {
      summary.mainGoal = `Worked on ${activities.join(", ")}`;
    } else {
      summary.mainGoal = commitMessages[0] || "Development work";
    }

    // Extract decisions from commit messages
    const decisionCommits = commitMessages.filter((m) =>
      m.match(/feat:|implement|add|create|use|switch|migrate|enhance/i)
    );
    if (decisionCommits.length > 0) {
      summary.decisions = "- " + decisionCommits.join("\n- ");
    }

    // Extract issues from commit messages
    const issueCommits = commitMessages.filter((m) =>
      m.match(/fix:|resolve|bug|issue|problem/i)
    );
    if (issueCommits.length > 0) {
      summary.issues = "- " + issueCommits.join("\n- ");
    }
  }

  // Analyze file changes
  const allFiles = [...changes.modifiedFiles, ...changes.newFiles];
  const hasTests = allFiles.some((f) => f.match(/test|spec/i));
  const hasDocs = allFiles.some((f) => f.match(/\.md$|doc/i));
  const hasConfig = allFiles.some((f) => f.match(/config|\.json$|\.yaml$/i));
  const hasSource = allFiles.some((f) => f.match(/\.js$|\.ts$|\.py$|\.java$/i));

  const fileTypes = [];
  if (hasSource) fileTypes.push("source code");
  if (hasTests) fileTypes.push("tests");
  if (hasDocs) fileTypes.push("documentation");
  if (hasConfig) fileTypes.push("configuration");

  if (fileTypes.length > 0 && !summary.mainGoal) {
    summary.mainGoal = `Modified ${fileTypes.join(", ")}`;
  }

  return summary;
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
    console.log(
      chalk.yellow("📊 Analyzing ALL changes (committed + uncommitted)...\n")
    );
    const changes = analyzeGitChanges(cwd);

    if (changes.hasChanges) {
      console.log(chalk.green("✅ Found:\n"));

      if (changes.recentCommits.length > 0) {
        console.log(
          chalk.cyan(
            `   📝 ${changes.recentCommits.length} commit(s) in last 2 hours:`
          )
        );
        changes.recentCommits.forEach((commit) => {
          console.log(chalk.gray(`      ${commit.hash} - ${commit.message}`));
        });
        console.log();
      }

      if (changes.stagedFiles.length > 0) {
        console.log(
          chalk.green(`   ✓ ${changes.stagedFiles.length} staged file(s):`)
        );
        changes.stagedFiles
          .slice(0, 5)
          .forEach((f) => console.log(chalk.gray(`      ${f}`)));
        if (changes.stagedFiles.length > 5) {
          console.log(
            chalk.gray(`      ... and ${changes.stagedFiles.length - 5} more`)
          );
        }
        console.log();
      }

      if (changes.unstagedFiles.length > 0) {
        console.log(
          chalk.yellow(
            `   ⚡ ${changes.unstagedFiles.length} unstaged file(s):`
          )
        );
        changes.unstagedFiles
          .slice(0, 5)
          .forEach((f) => console.log(chalk.gray(`      ${f}`)));
        if (changes.unstagedFiles.length > 5) {
          console.log(
            chalk.gray(`      ... and ${changes.unstagedFiles.length - 5} more`)
          );
        }
        console.log();
      }

      if (changes.newFiles.length > 0) {
        console.log(chalk.blue(`   ✨ ${changes.newFiles.length} new file(s)`));
      }

      if (changes.diffStats.additions > 0 || changes.diffStats.deletions > 0) {
        console.log(
          chalk.gray(
            `   📊 ${changes.diffStats.additions} additions, ${changes.diffStats.deletions} deletions`
          )
        );
      }

      console.log();
    } else {
      console.log(
        chalk.yellow("ℹ️  No git changes detected (working directory clean)\n")
      );
    }

    // Step 2: Generate auto-summary
    console.log(chalk.cyan("🤖 Auto-generating summary from git history...\n"));
    const autoSummary = generateAutoSummary(changes);

    if (autoSummary.mainGoal) {
      console.log(chalk.green("📝 Auto-detected:\n"));
      console.log(chalk.white(`   Main goal: ${autoSummary.mainGoal}`));
      if (autoSummary.decisions) {
        const decisionsPreview = autoSummary.decisions
          .split("\n")[0]
          .substring(0, 80);
        console.log(chalk.white(`   Decisions: ${decisionsPreview}...`));
      }
      if (autoSummary.issues) {
        const issuesPreview = autoSummary.issues
          .split("\n")[0]
          .substring(0, 80);
        console.log(chalk.white(`   Issues: ${issuesPreview}...`));
      }
      console.log();
    }

    // Step 3: Only ask for dev handle (optional)
    const chatNumber = await getChatNumber(aiDir);
    console.log(chalk.gray(`   Chat number: ${chatNumber}\n`));

    const devHandle = await question(
      chalk.white("1️⃣  Your handle (optional, press Enter to skip): ")
    );

    rl.close();

    // Use auto-generated summary
    const mainGoal = autoSummary.mainGoal || "Development work";
    const decisions = autoSummary.decisions || "";
    const issues = autoSummary.issues || "";
    const nextSteps = "";

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

    // Get all uncommitted changes
    const status = execSync("git status --porcelain", {
      cwd,
      encoding: "utf8",
    });
    const lines = status.split("\n").filter((line) => line.trim());

    const newFiles = [];
    const modifiedFiles = [];
    const stagedFiles = [];
    const unstagedFiles = [];

    lines.forEach((line) => {
      const statusCode = line.substring(0, 2);
      const file = line.substring(3).trim();

      // Skip .ai/ directory files
      if (file.startsWith(".ai/")) return;

      // Check if staged (first character)
      if (statusCode[0] !== " " && statusCode[0] !== "?") {
        stagedFiles.push(file);
      }

      // Check if unstaged (second character)
      if (statusCode[1] !== " ") {
        unstagedFiles.push(file);
      }

      // Categorize by type
      if (statusCode === "??" || statusCode[0] === "A") {
        newFiles.push(file);
      } else if (statusCode.includes("M")) {
        modifiedFiles.push(file);
      }
    });

    // Get recent commits (last 2 hours)
    let recentCommits = [];
    try {
      const commits = execSync(
        'git log --since="2 hours ago" --pretty=format:"%h|%s"',
        { cwd, encoding: "utf8" }
      );
      if (commits.trim()) {
        recentCommits = commits
          .split("\n")
          .filter((c) => c.trim())
          .map((c) => {
            const [hash, message] = c.split("|");
            return { hash, message };
          });
      }
    } catch (e) {
      // No commits in last 2 hours
    }

    // Get diff stats for uncommitted changes
    let diffStats = { additions: 0, deletions: 0 };
    try {
      const diff = execSync("git diff --stat", { cwd, encoding: "utf8" });
      const stagedDiff = execSync("git diff --staged --stat", {
        cwd,
        encoding: "utf8",
      });
      const allDiff = diff + stagedDiff;

      // Parse stats (e.g., "5 files changed, 123 insertions(+), 45 deletions(-)")
      const match = allDiff.match(/(\d+) insertion.*?(\d+) deletion/);
      if (match) {
        diffStats.additions = parseInt(match[1]) || 0;
        diffStats.deletions = parseInt(match[2]) || 0;
      }
    } catch (e) {
      // No diff stats available
    }

    return {
      hasChanges: lines.length > 0 || recentCommits.length > 0,
      filesChanged: lines.length,
      newFiles,
      modifiedFiles,
      stagedFiles,
      unstagedFiles,
      recentCommits,
      diffStats,
    };
  } catch (error) {
    // Not a git repo or git not available
    return {
      hasChanges: false,
      filesChanged: 0,
      newFiles: [],
      modifiedFiles: [],
      stagedFiles: [],
      unstagedFiles: [],
      recentCommits: [],
      diffStats: { additions: 0, deletions: 0 },
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

  // Extract a better title from decisions
  let title = updates.mainGoal;
  if (updates.decisions) {
    // Try to extract a meaningful title from the first decision
    const firstDecision = updates.decisions.split("\n")[0].replace(/^-\s*/, "");
    // Remove conventional commit prefix and use the message
    const cleanTitle = firstDecision
      .replace(/^(feat|fix|docs|refactor|test|chore):\s*/i, "")
      .trim();
    if (cleanTitle.length > 10 && cleanTitle.length < 100) {
      title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }
  }

  // Find insertion point (before "## Template for New Decisions")
  const insertMarker = "## Template for New Decisions";
  const insertIndex = content.indexOf(insertMarker);

  // Create a more detailed entry
  const decisionsList = updates.decisions
    ? updates.decisions
        .split("\n")
        .filter((d) => d.trim())
        .map((d) =>
          d
            .replace(/^-\s*/, "")
            .replace(/^(feat|fix|docs|refactor|test|chore):\s*/i, "")
        )
        .map((d) => `- ${d}`)
        .join("\n")
    : "";

  if (insertIndex === -1) {
    // Append at the end
    const entry = `\n## ${title}

**Date:** ${updates.timestamp}
**Status:** ✅ Implemented
**Chat:** #${updates.chatNumber}

### Decision

${decisionsList || updates.mainGoal}

### Impact

Implemented during Chat #${updates.chatNumber}. ${
      updates.changes.filesChanged > 0
        ? `Modified ${updates.changes.filesChanged} file(s).`
        : ""
    }

---

`;
    content += entry;
  } else {
    const entry = `## ${title}

**Date:** ${updates.timestamp}
**Status:** ✅ Implemented
**Chat:** #${updates.chatNumber}

### Decision

${decisionsList || updates.mainGoal}

### Impact

Implemented during Chat #${updates.chatNumber}. ${
      updates.changes.filesChanged > 0
        ? `Modified ${updates.changes.filesChanged} file(s).`
        : ""
    }

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

  // Extract a better title from issues
  let title = updates.mainGoal;
  if (updates.issues) {
    const firstIssue = updates.issues.split("\n")[0].replace(/^-\s*/, "");
    const cleanTitle = firstIssue
      .replace(/^(feat|fix|docs|refactor|test|chore):\s*/i, "")
      .trim();
    if (cleanTitle.length > 10 && cleanTitle.length < 100) {
      title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }
  }

  // Format issues list
  const issuesList = updates.issues
    ? updates.issues
        .split("\n")
        .filter((i) => i.trim())
        .map((i) =>
          i
            .replace(/^-\s*/, "")
            .replace(/^(feat|fix|docs|refactor|test|chore):\s*/i, "")
        )
        .map((i) => `- ${i}`)
        .join("\n")
    : "";

  // Add to resolved issues section
  const insertMarker = "## ✅ Resolved Issues\n\n";
  const insertIndex = content.indexOf(insertMarker);

  if (insertIndex !== -1) {
    const entry = `### ${title}

**Date Discovered:** ${updates.timestamp}
**Date Resolved:** ${updates.timestamp}
**Severity:** 🟡 Medium
**Chat:** #${updates.chatNumber}

**Problem:**
${issuesList || updates.issues}

**Solution:**
Resolved during Chat #${updates.chatNumber}. ${
      updates.changes.filesChanged > 0
        ? `Modified ${updates.changes.filesChanged} file(s).`
        : ""
    }

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
