/**
 * Session Finish Tool
 * Processes current session, updates .ai/.aicf files, commits changes, and prepares handoff
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { execSync } = require("child_process");

/**
 * Process session finish and prepare for handoff
 */
async function finishSession(options = {}) {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, ".ai");
  const aicfDir = path.join(cwd, ".aicf");

  console.log(chalk.bold("\n🏁 Finishing AI Session & Preparing Handoff\n"));

  // 1. Check if project has AI memory system
  if (!fs.existsSync(aiDir)) {
    console.log(chalk.yellow("⚠️  No .ai/ directory found!"));
    console.log(chalk.gray("   Run 'npx aic init' to create AI memory system first\n"));
    return;
  }

  // 2. Analyze git changes for additional context
  const gitChanges = await analyzeGitChanges();
  
  // 3. Generate session summary
  const sessionSummary = await generateSessionSummary(options.sessionData, gitChanges);
  
  // 4. Update conversation log
  await updateConversationLog(aiDir, sessionSummary);
  
  // 5. Migrate to AICF 3.0 if requested
  if (options.migrateAicf) {
    const { migrateToAICF } = require("./aicf-migrate");
    try {
      await migrateToAICF(aiDir, aicfDir);
    } catch (error) {
      console.log(chalk.yellow("⚠️  AICF migration failed, continuing..."));
    }
  }
  
  // 6. Commit changes
  await commitChanges(sessionSummary, gitChanges);
  
  // 7. Generate handoff instructions
  const handoffContext = await generateHandoffContext();
  
  // 8. Display results
  displayFinishResults(sessionSummary, handoffContext);
}

/**
 * Analyze git changes to extract context
 */
async function analyzeGitChanges() {
  const gitData = {
    hasGit: false,
    stagedFiles: [],
    unstagedFiles: [],
    diffSummary: "",
    branchInfo: ""
  };

  try {
    // Check if git repository exists
    execSync("git rev-parse --git-dir", { stdio: "ignore" });
    gitData.hasGit = true;

    // Get branch info
    try {
      gitData.branchInfo = execSync("git branch --show-current", { encoding: "utf8" }).trim();
    } catch (e) {
      gitData.branchInfo = "main";
    }

    // Get staged files
    try {
      const staged = execSync("git diff --cached --name-only", { encoding: "utf8" });
      gitData.stagedFiles = staged.trim() ? staged.trim().split("\n") : [];
    } catch (e) {
      gitData.stagedFiles = [];
    }

    // Get unstaged files
    try {
      const unstaged = execSync("git diff --name-only", { encoding: "utf8" });
      gitData.unstagedFiles = unstaged.trim() ? unstaged.trim().split("\n") : [];
    } catch (e) {
      gitData.unstagedFiles = [];
    }

    // Get diff summary (key changes only)
    try {
      const diffStats = execSync("git diff --stat", { encoding: "utf8" });
      gitData.diffSummary = diffStats.trim().split("\n").slice(-1)[0] || "";
    } catch (e) {
      gitData.diffSummary = "";
    }

  } catch (error) {
    // Not a git repository or git not available
    gitData.hasGit = false;
  }

  return gitData;
}

/**
 * Generate session summary from provided data or interactive prompt
 */
async function generateSessionSummary(sessionData, gitChanges) {
  const timestamp = new Date().toISOString().split("T")[0];
  
  if (sessionData) {
    // Use provided session data
    return {
      date: timestamp,
      topic: sessionData.topic || "AI Development Session",
      what: sessionData.what || "Continued development work",
      why: sessionData.why || "Project development needs",
      outcome: sessionData.outcome || "Progress made on project goals",
      files: [...gitChanges.stagedFiles, ...gitChanges.unstagedFiles].slice(0, 5),
      gitInfo: gitChanges.hasGit ? `Branch: ${gitChanges.branchInfo}, Changes: ${gitChanges.diffSummary}` : ""
    };
  }

  // Default session summary based on git changes
  const changedFiles = [...gitChanges.stagedFiles, ...gitChanges.unstagedFiles];
  const topic = inferTopicFromFiles(changedFiles);
  
  return {
    date: timestamp,
    topic: topic,
    what: `Modified ${changedFiles.length} files including ${changedFiles.slice(0, 3).join(", ")}`,
    why: "Continued project development and improvements",
    outcome: gitChanges.diffSummary || "Files updated and changes ready for commit",
    files: changedFiles.slice(0, 5),
    gitInfo: gitChanges.hasGit ? `Branch: ${gitChanges.branchInfo}, ${gitChanges.diffSummary}` : ""
  };
}

/**
 * Infer topic from changed files
 */
function inferTopicFromFiles(files) {
  if (files.some(f => f.includes("src/"))) return "Source Code Development";
  if (files.some(f => f.includes("test"))) return "Testing and Quality Assurance";
  if (files.some(f => f.includes("doc") || f.includes("README"))) return "Documentation Updates";
  if (files.some(f => f.includes("package.json") || f.includes("config"))) return "Configuration and Dependencies";
  if (files.some(f => f.includes(".ai/") || f.includes(".aicf/"))) return "AI Memory System Updates";
  return "General Development Session";
}

/**
 * Update conversation log with session summary
 */
async function updateConversationLog(aiDir, summary) {
  const logPath = path.join(aiDir, "conversation-log.md");
  
  if (!fs.existsSync(logPath)) {
    console.log(chalk.yellow("⚠️  conversation-log.md not found, skipping update"));
    return;
  }

  const existingContent = await fs.readFile(logPath, "utf8");
  
  // Count existing chats to get next number
  const chatMatches = existingContent.match(/## Chat #(\d+)/g) || [];
  const nextChatNumber = chatMatches.length + 1;

  // Create new entry
  const newEntry = `
## Chat #${nextChatNumber}

**Date:** ${summary.date}
**Topic:** ${summary.topic}
**What:** ${summary.what}
**Why:** ${summary.why}
**Outcome:** ${summary.outcome}
${summary.files.length > 0 ? `**Files:** ${summary.files.join(", ")}` : ""}
${summary.gitInfo ? `**Git:** ${summary.gitInfo}` : ""}
`;

  // Append to file
  await fs.appendFile(logPath, newEntry);
  
  console.log(chalk.green(`✅ Updated conversation-log.md with Chat #${nextChatNumber}`));
}

/**
 * Commit changes with meaningful commit message
 */
async function commitChanges(summary, gitChanges) {
  if (!gitChanges.hasGit) {
    console.log(chalk.yellow("ℹ️  No git repository, skipping commit"));
    return;
  }

  try {
    // Add all changes including .ai/ files
    execSync("git add .ai/ .aicf/", { stdio: "inherit" });
    
    // Add other changed files
    if (gitChanges.unstagedFiles.length > 0) {
      execSync("git add .", { stdio: "inherit" });
    }

    // Create commit message
    const commitMsg = `feat: ${summary.topic}

${summary.what}

Files: ${summary.files.slice(0, 3).join(", ")}${summary.files.length > 3 ? " +more" : ""}
AI Session: ${summary.outcome}`;

    // Commit changes
    execSync(`git commit -m "${commitMsg}"`, { stdio: "inherit" });
    
    console.log(chalk.green("✅ Changes committed to git"));
    
  } catch (error) {
    console.log(chalk.yellow("⚠️  Git commit failed, changes staged but not committed"));
  }
}

/**
 * Generate context for next AI session
 */
async function generateHandoffContext() {
  const cwd = process.cwd();
  const aicfDir = path.join(cwd, ".aicf");
  const aiDir = path.join(cwd, ".ai");
  
  let context = {
    hasAICF: fs.existsSync(aicfDir),
    hasAI: fs.existsSync(aiDir),
    projectOverview: "",
    recentActivity: "",
    nextSteps: ""
  };

  // Read project overview
  const overviewPath = path.join(aiDir, "project-overview.md");
  if (fs.existsSync(overviewPath)) {
    const overview = await fs.readFile(overviewPath, "utf8");
    context.projectOverview = overview.slice(0, 500) + "...";
  }

  // Read recent conversation activity
  const logPath = path.join(aiDir, "conversation-log.md");
  if (fs.existsSync(logPath)) {
    const log = await fs.readFile(logPath, "utf8");
    const matches = log.match(/## Chat #\d+[\s\S]*?(?=## Chat #|\n$)/g) || [];
    context.recentActivity = matches.slice(-2).join("\n").slice(0, 800) + "...";
  }

  // Read next steps
  const stepsPath = path.join(aiDir, "next-steps.md");
  if (fs.existsSync(stepsPath)) {
    const steps = await fs.readFile(stepsPath, "utf8");
    context.nextSteps = steps.slice(0, 400) + "...";
  }

  return context;
}

/**
 * Display finish results and handoff instructions
 */
function displayFinishResults(summary, context) {
  console.log(chalk.bold("\n🎉 Session Finished Successfully!\n"));
  
  console.log(chalk.bold("📋 Session Summary:"));
  console.log(chalk.cyan(`   Topic: ${summary.topic}`));
  console.log(chalk.cyan(`   Outcome: ${summary.outcome}`));
  if (summary.files.length > 0) {
    console.log(chalk.cyan(`   Files: ${summary.files.slice(0, 3).join(", ")}${summary.files.length > 3 ? " +more" : ""}`));
  }
  
  console.log(chalk.bold("\n🔄 Next AI Session Setup:\n"));
  
  console.log(chalk.bold("📝 Copy this to your next AI chat:"));
  console.log(chalk.gray("─".repeat(60)));
  
  const handoffText = `I'm continuing from a previous AI session. Please read my AI memory system first:

${context.hasAICF ? "**AICF 3.0 Enhanced Memory Available** - Use .aicf/ files for fast context loading" : "**AI Memory System** - Review .ai/ files for context"}

**Project Status:**
${context.projectOverview.slice(0, 200)}...

**Recent Activity:**
${context.recentActivity.slice(0, 300)}...

**Next Steps:**
${context.nextSteps.slice(0, 200)}...

Please read the .ai-instructions file and .ai/ directory contents to get full context, then help me continue where we left off.`;

  console.log(chalk.white(handoffText));
  console.log(chalk.gray("─".repeat(60)));
  
  console.log(chalk.bold("\n🚀 Quick Commands for New Session:"));
  console.log(chalk.green("   npx aic context --ai    ") + chalk.gray("# Get AI-optimized context summary"));
  console.log(chalk.green("   npx aic stats           ") + chalk.gray("# View knowledge base statistics"));
  console.log(chalk.green("   npx aic check           ") + chalk.gray("# Quick health check"));
  
  if (context.hasAICF) {
    console.log(chalk.green("   # AICF 3.0 available - 85% more token efficient!"));
  }
  
  console.log(chalk.bold.cyan("\n✨ Seamless AI continuity achieved! ✨\n"));
}

module.exports = {
  finishSession,
};