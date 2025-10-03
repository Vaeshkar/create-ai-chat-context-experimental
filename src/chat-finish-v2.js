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

/**
 * Main chat-finish handler
 * Updates BOTH .ai/ (human-readable) and .aicf/ (AI-optimized) files
 */
async function handleChatFinish(cwd = process.cwd()) {
  console.log(chalk.cyan("\n🎬 Chat Finish - Update AI Memory\n"));

  const aiDir = path.join(cwd, ".ai");
  const aicfDir = path.join(cwd, ".aicf");

  // Check if directories exist
  if (!fs.existsSync(aiDir) || !fs.existsSync(aicfDir)) {
    console.log(
      chalk.red(
        "❌ Error: .ai/ or .aicf/ folder not found. Run 'aic init' first."
      )
    );
    process.exit(1);
  }

  try {
    // Phase 1: Gather information
    console.log(chalk.cyan("📊 Analyzing changes...\n"));
    const changes = await analyzeChanges(cwd);
    displayChanges(changes);

    // Phase 2: Get user input
    console.log(chalk.cyan("\n💬 Tell me about this session:\n"));
    const sessionInfo = await gatherSessionInfo(changes);

    // Phase 3: Update .ai/ files (human-readable)
    console.log(chalk.cyan("\n📝 Updating .ai/ files (human-readable)...\n"));
    await updateAIFiles(aiDir, sessionInfo, changes);

    // Phase 4: Update .aicf/ files (AI-optimized)
    console.log(chalk.cyan("\n🤖 Updating .aicf/ files (AI-optimized)...\n"));
    await updateAICFFiles(aicfDir, sessionInfo, changes);

    // Phase 5: Summary
    console.log(chalk.green("\n✨ Memory updated successfully!\n"));
    console.log(chalk.yellow("📋 Next steps:"));
    console.log(chalk.yellow("   1. Review changes: git diff .ai/ .aicf/"));
    console.log(chalk.yellow("   2. Commit: git add .ai/ .aicf/"));
    console.log(
      chalk.yellow('   3. Commit: git commit -m "Update AI memory"\n')
    );

    rl.close();
  } catch (error) {
    console.error(chalk.red("\n❌ Error:"), error.message);
    rl.close();
    process.exit(1);
  }
}

/**
 * Analyze git changes and file modifications
 */
async function analyzeChanges(cwd) {
  const changes = {
    hasGit: false,
    modifiedFiles: [],
    newFiles: [],
    deletedFiles: [],
    additions: 0,
    deletions: 0,
    commits: [],
  };

  try {
    // Check if git repo exists
    execSync("git rev-parse --git-dir", { cwd, stdio: "ignore" });
    changes.hasGit = true;

    // Get file changes (staged + unstaged)
    const status = execSync("git status --porcelain", {
      cwd,
      encoding: "utf-8",
    });

    status.split("\n").forEach((line) => {
      if (!line.trim()) return;
      const status = line.substring(0, 2);
      const file = line.substring(3);

      if (status.includes("M")) changes.modifiedFiles.push(file);
      if (status.includes("A") || status.includes("?"))
        changes.newFiles.push(file);
      if (status.includes("D")) changes.deletedFiles.push(file);
    });

    // Get diff stats
    try {
      const diffStats = execSync("git diff --stat HEAD", {
        cwd,
        encoding: "utf-8",
      });
      const match = diffStats.match(/(\d+) insertions?.*?(\d+) deletions?/);
      if (match) {
        changes.additions = parseInt(match[1]) || 0;
        changes.deletions = parseInt(match[2]) || 0;
      }
    } catch (e) {
      // No diff stats available
    }

    // Get recent commits (last 5)
    try {
      const log = execSync('git log -5 --pretty=format:"%h|%s|%ar"', {
        cwd,
        encoding: "utf-8",
      });
      changes.commits = log.split("\n").map((line) => {
        const [hash, message, time] = line.split("|");
        return { hash, message, time };
      });
    } catch (e) {
      // No commits yet
    }
  } catch (error) {
    // Not a git repo
    changes.hasGit = false;
  }

  return changes;
}

/**
 * Display changes summary
 */
function displayChanges(changes) {
  if (!changes.hasGit) {
    console.log(chalk.yellow("⚠️  Not a git repository"));
    return;
  }

  const totalFiles =
    changes.modifiedFiles.length +
    changes.newFiles.length +
    changes.deletedFiles.length;

  if (totalFiles === 0) {
    console.log(chalk.yellow("ℹ️  No file changes detected"));
    return;
  }

  console.log(chalk.green(`✅ Found ${totalFiles} changed file(s):`));
  if (changes.modifiedFiles.length > 0) {
    console.log(chalk.blue(`   📝 ${changes.modifiedFiles.length} modified`));
  }
  if (changes.newFiles.length > 0) {
    console.log(chalk.green(`   ✨ ${changes.newFiles.length} new`));
  }
  if (changes.deletedFiles.length > 0) {
    console.log(chalk.red(`   🗑️  ${changes.deletedFiles.length} deleted`));
  }
  if (changes.additions > 0 || changes.deletions > 0) {
    console.log(
      chalk.gray(`   📊 +${changes.additions} -${changes.deletions} lines`)
    );
  }
}

/**
 * Gather session information from user
 */
async function gatherSessionInfo(changes) {
  const info = {
    mainGoal: "",
    decisions: [],
    insights: [],
    issues: [],
    nextSteps: [],
    timestamp: new Date().toISOString().split("T")[0],
  };

  // Main goal
  const defaultGoal = inferMainGoal(changes);
  const goalInput = await question(chalk.cyan(`Main goal (${defaultGoal}): `));
  info.mainGoal = goalInput.trim() || defaultGoal;

  // Decisions (optional)
  const decisionsInput = await question(
    chalk.cyan("Key decisions (comma-separated, or Enter to skip): ")
  );
  if (decisionsInput.trim()) {
    info.decisions = decisionsInput
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d);
  }

  // Insights (optional)
  const insightsInput = await question(
    chalk.cyan("Key insights (comma-separated, or Enter to skip): ")
  );
  if (insightsInput.trim()) {
    info.insights = insightsInput
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i);
  }

  // Issues (optional)
  const issuesInput = await question(
    chalk.cyan("Issues found (comma-separated, or Enter to skip): ")
  );
  if (issuesInput.trim()) {
    info.issues = issuesInput
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i);
  }

  // Next steps (optional)
  const nextInput = await question(
    chalk.cyan("Next steps (comma-separated, or Enter to skip): ")
  );
  if (nextInput.trim()) {
    info.nextSteps = nextInput
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n);
  }

  return info;
}

/**
 * Infer main goal from changes
 */
function inferMainGoal(changes) {
  if (changes.commits.length > 0) {
    return changes.commits[0].message;
  }

  const allFiles = [
    ...changes.modifiedFiles,
    ...changes.newFiles,
    ...changes.deletedFiles,
  ];
  const hasTests = allFiles.some((f) => f.match(/test|spec/i));
  const hasDocs = allFiles.some((f) => f.match(/\.md$|doc/i));
  const hasConfig = allFiles.some((f) => f.match(/config|\.json$|\.yaml$/i));
  const hasSource = allFiles.some((f) => f.match(/\.js$|\.ts$|\.py$|\.java$/i));

  const types = [];
  if (hasSource) types.push("code");
  if (hasTests) types.push("tests");
  if (hasDocs) types.push("docs");
  if (hasConfig) types.push("config");

  return types.length > 0 ? `Updated ${types.join(", ")}` : "Development work";
}

/**
 * Update .ai/ files (human-readable markdown)
 */
async function updateAIFiles(aiDir, sessionInfo, changes) {
  // Update conversation-log.md
  await updateConversationLog(aiDir, sessionInfo, changes);
  console.log(chalk.green("   ✅ Updated conversation-log.md"));

  // Update technical-decisions.md (if decisions)
  if (sessionInfo.decisions.length > 0) {
    await updateTechnicalDecisions(aiDir, sessionInfo);
    console.log(chalk.green("   ✅ Updated technical-decisions.md"));
  }

  // Update known-issues.md (if issues)
  if (sessionInfo.issues.length > 0) {
    await updateKnownIssues(aiDir, sessionInfo);
    console.log(chalk.green("   ✅ Updated known-issues.md"));
  }

  // Update next-steps.md (if next steps)
  if (sessionInfo.nextSteps.length > 0) {
    await updateNextSteps(aiDir, sessionInfo);
    console.log(chalk.green("   ✅ Updated next-steps.md"));
  }
}

/**
 * Update conversation-log.md
 */
async function updateConversationLog(aiDir, sessionInfo, changes) {
  const logPath = path.join(aiDir, "conversation-log.md");
  let content = await fs.readFile(logPath, "utf-8");

  // Get next chat number
  const chatNumber = getNextChatNumber(content);

  // Build new entry
  const entry = buildConversationEntry(chatNumber, sessionInfo, changes);

  // Insert after "## 📋 CHAT HISTORY" line
  const insertPoint = content.indexOf("## 📋 CHAT HISTORY");
  if (insertPoint !== -1) {
    const afterHeader = content.indexOf("\n", insertPoint) + 1;
    const nextSection = content.indexOf("\n---\n", afterHeader);
    const insertAt = nextSection !== -1 ? nextSection + 5 : afterHeader;

    content =
      content.substring(0, insertAt) +
      entry +
      "\n" +
      content.substring(insertAt);
  } else {
    // Fallback: append to end
    content += "\n" + entry;
  }

  await fs.writeFile(logPath, content, "utf-8");
}

/**
 * Get next chat number from conversation log
 */
function getNextChatNumber(content) {
  const matches = content.match(/^### Chat #(\d+)/gm);
  if (!matches || matches.length === 0) return 1;

  const numbers = matches.map((m) => {
    const num = m.match(/\d+/);
    return num ? parseInt(num[0], 10) : 0;
  });

  return Math.max(...numbers) + 1;
}

/**
 * Build conversation log entry
 */
function buildConversationEntry(chatNumber, sessionInfo, changes) {
  const lines = [];

  lines.push(`### Chat #${chatNumber}`);
  lines.push(`**Date:** ${sessionInfo.timestamp}`);
  lines.push(`**Goal:** ${sessionInfo.mainGoal}`);
  lines.push("");

  if (sessionInfo.decisions.length > 0) {
    lines.push("**Decisions:**");
    sessionInfo.decisions.forEach((d) => lines.push(`- ${d}`));
    lines.push("");
  }

  if (sessionInfo.insights.length > 0) {
    lines.push("**Insights:**");
    sessionInfo.insights.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }

  if (sessionInfo.issues.length > 0) {
    lines.push("**Issues:**");
    sessionInfo.issues.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }

  if (changes.hasGit) {
    const totalFiles =
      changes.modifiedFiles.length +
      changes.newFiles.length +
      changes.deletedFiles.length;
    lines.push(`**Changes:** ${totalFiles} files modified`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  return lines.join("\n");
}

/**
 * Update technical-decisions.md
 */
async function updateTechnicalDecisions(aiDir, sessionInfo) {
  const decisionsPath = path.join(aiDir, "technical-decisions.md");
  let content = await fs.readFile(decisionsPath, "utf-8");

  // Build new decisions section
  const lines = [];
  lines.push(`### ${sessionInfo.timestamp} - ${sessionInfo.mainGoal}`);
  lines.push("");
  sessionInfo.decisions.forEach((d) => lines.push(`- ${d}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  const newSection = lines.join("\n");

  // Insert after "## 📋 DECISIONS" or similar header
  const insertPoint = content.indexOf("## ");
  if (insertPoint !== -1) {
    const afterHeader = content.indexOf("\n", insertPoint) + 1;
    const nextLine = content.indexOf("\n", afterHeader) + 1;
    content =
      content.substring(0, nextLine) + newSection + content.substring(nextLine);
  } else {
    content += "\n" + newSection;
  }

  await fs.writeFile(decisionsPath, content, "utf-8");
}

/**
 * Update known-issues.md
 */
async function updateKnownIssues(aiDir, sessionInfo) {
  const issuesPath = path.join(aiDir, "known-issues.md");
  let content = await fs.readFile(issuesPath, "utf-8");

  // Build new issues section
  const lines = [];
  lines.push(`### ${sessionInfo.timestamp} - ${sessionInfo.mainGoal}`);
  lines.push("");
  sessionInfo.issues.forEach((i) => lines.push(`- ${i}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  const newSection = lines.join("\n");

  // Insert after header
  const insertPoint = content.indexOf("## ");
  if (insertPoint !== -1) {
    const afterHeader = content.indexOf("\n", insertPoint) + 1;
    const nextLine = content.indexOf("\n", afterHeader) + 1;
    content =
      content.substring(0, nextLine) + newSection + content.substring(nextLine);
  } else {
    content += "\n" + newSection;
  }

  await fs.writeFile(issuesPath, content, "utf-8");
}

/**
 * Update next-steps.md
 */
async function updateNextSteps(aiDir, sessionInfo) {
  const nextStepsPath = path.join(aiDir, "next-steps.md");
  let content = await fs.readFile(nextStepsPath, "utf-8");

  // Build new next steps section
  const lines = [];
  lines.push(`### ${sessionInfo.timestamp}`);
  lines.push("");
  sessionInfo.nextSteps.forEach((n) => lines.push(`- [ ] ${n}`));
  lines.push("");
  lines.push("---");
  lines.push("");

  const newSection = lines.join("\n");

  // Insert after header
  const insertPoint = content.indexOf("## ");
  if (insertPoint !== -1) {
    const afterHeader = content.indexOf("\n", insertPoint) + 1;
    const nextLine = content.indexOf("\n", afterHeader) + 1;
    content =
      content.substring(0, nextLine) + newSection + content.substring(nextLine);
  } else {
    content += "\n" + newSection;
  }

  await fs.writeFile(nextStepsPath, content, "utf-8");
}

/**
 * Update .aicf/ files (AI-optimized format)
 */
async function updateAICFFiles(aicfDir, sessionInfo, changes) {
  // Update conversation-memory.aicf
  await updateConversationMemory(aicfDir, sessionInfo, changes);
  console.log(chalk.green("   ✅ Updated conversation-memory.aicf"));

  // Update technical-context.aicf (if decisions)
  if (sessionInfo.decisions.length > 0) {
    await updateTechnicalContext(aicfDir, sessionInfo);
    console.log(chalk.green("   ✅ Updated technical-context.aicf"));
  }

  // Update work-state.aicf
  await updateWorkState(aicfDir, sessionInfo, changes);
  console.log(chalk.green("   ✅ Updated work-state.aicf"));
}

/**
 * Update conversation-memory.aicf
 */
async function updateConversationMemory(aicfDir, sessionInfo, changes) {
  const memoryPath = path.join(aicfDir, "conversation-memory.aicf");
  let content = await fs.readFile(memoryPath, "utf-8");

  const timestamp = sessionInfo.timestamp;
  const goal = sessionInfo.mainGoal.replace(/\s+/g, "_");

  // Update @FLOW section
  const flowEntry = `${timestamp}|${goal}|completed`;
  content = addToSection(content, "@FLOW", flowEntry);

  // Update @INSIGHTS section (if insights)
  if (sessionInfo.insights.length > 0) {
    sessionInfo.insights.forEach((insight) => {
      const insightFormatted = insight.replace(/\s+/g, "_");
      const insightEntry = `${timestamp}|${insightFormatted}`;
      content = addToSection(content, "@INSIGHTS", insightEntry);
    });
  }

  // Update @DECISIONS section (if decisions)
  if (sessionInfo.decisions.length > 0) {
    sessionInfo.decisions.forEach((decision) => {
      const decisionFormatted = decision.replace(/\s+/g, "_");
      const decisionEntry = `${timestamp}|${decisionFormatted}|active`;
      content = addToSection(content, "@DECISIONS", decisionEntry);
    });
  }

  // Update @STATE section
  const stateEntry = `last_update=${timestamp}|status=active|files_changed=${
    changes.modifiedFiles.length + changes.newFiles.length
  }`;
  content = updateSection(content, "@STATE", stateEntry);

  await fs.writeFile(memoryPath, content, "utf-8");
}

/**
 * Update technical-context.aicf
 */
async function updateTechnicalContext(aicfDir, sessionInfo) {
  const contextPath = path.join(aicfDir, "technical-context.aicf");
  let content = await fs.readFile(contextPath, "utf-8");

  const timestamp = sessionInfo.timestamp;

  // Add decisions to technical context
  sessionInfo.decisions.forEach((decision) => {
    const decisionFormatted = decision.replace(/\s+/g, "_");
    const entry = `${timestamp}|decision|${decisionFormatted}`;
    content = addToSection(content, "@DECISIONS", entry);
  });

  await fs.writeFile(contextPath, content, "utf-8");
}

/**
 * Update work-state.aicf
 */
async function updateWorkState(aicfDir, sessionInfo, changes) {
  const statePath = path.join(aicfDir, "work-state.aicf");
  let content = await fs.readFile(statePath, "utf-8");

  const timestamp = sessionInfo.timestamp;
  const goal = sessionInfo.mainGoal.replace(/\s+/g, "_");

  // Update @CURRENT section
  const currentEntry = `task=${goal}|status=completed|date=${timestamp}`;
  content = updateSection(content, "@CURRENT", currentEntry);

  // Update @NEXT section (if next steps)
  if (sessionInfo.nextSteps.length > 0) {
    const nextStepsFormatted = sessionInfo.nextSteps
      .map((n) => n.replace(/\s+/g, "_"))
      .join("|");
    const nextEntry = `tasks=${nextStepsFormatted}|priority=high`;
    content = updateSection(content, "@NEXT", nextEntry);
  }

  await fs.writeFile(statePath, content, "utf-8");
}

/**
 * Add entry to AICF section (appends new line)
 */
function addToSection(content, sectionName, entry) {
  const sectionRegex = new RegExp(`(${sectionName}\\n)([\\s\\S]*?)(\\n@|$)`);
  const match = content.match(sectionRegex);

  if (match) {
    const before = match[1];
    const existing = match[2];
    const after = match[3];

    // Add new entry after existing content
    const updated = before + existing.trim() + "\n" + entry + "\n" + after;
    return content.replace(sectionRegex, updated);
  }

  return content;
}

/**
 * Update AICF section (replaces content)
 */
function updateSection(content, sectionName, entry) {
  const sectionRegex = new RegExp(`(${sectionName}\\n)([\\s\\S]*?)(\\n@|$)`);
  const match = content.match(sectionRegex);

  if (match) {
    const before = match[1];
    const after = match[3];

    // Replace section content
    const updated = before + entry + "\n" + after;
    return content.replace(sectionRegex, updated);
  }

  return content;
}

module.exports = { handleChatFinish };
