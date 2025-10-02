/**
 * AICF Context Command
 * Display AI context for starting new chat sessions
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { loadAICF, formatForAI, query } = require("./aicf-parser");

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "unknown";

  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  } catch (e) {
    return timestamp;
  }
}

/**
 * Display context summary (for humans)
 */
async function displayContextSummary(aicfDir = ".aicf") {
  try {
    const context = await loadAICF(aicfDir);
    const { index } = context;

    console.log(chalk.bold.cyan("\n📋 AI Context Ready - AICF 2.0\n"));

    // Project info
    console.log(
      chalk.bold(`Project: `) +
        chalk.white(`${index.project.name} v${index.project.version}`)
    );
    console.log(
      chalk.bold(`Status: `) + chalk.green(index.state.status.replace(/_/g, " "))
    );
    console.log(
      chalk.bold(`Last Update: `) +
        chalk.gray(formatTimestamp(index.project.last_update))
    );
    console.log();

    // Current work
    console.log(chalk.bold.yellow("🎯 Current Work:"));
    console.log(chalk.white(`   ${index.currentWork.task}`));
    console.log(
      chalk.gray(`   Priority: ${index.currentWork.priority} | Started: ${formatTimestamp(index.currentWork.started)}`)
    );
    if (index.currentWork.blockers && index.currentWork.blockers !== "none") {
      console.log(chalk.red(`   ⚠️  Blockers: ${index.currentWork.blockers}`));
    }
    console.log();

    // Stats
    console.log(chalk.bold.cyan("📊 Project Stats:"));
    console.log(
      chalk.white(`   ${index.counts.conversations} conversations`)
    );
    console.log(chalk.white(`   ${index.counts.decisions} decisions`));

    // Task breakdown
    if (context.tasks) {
      const todoTasks = query(context, "tasks", { STATUS: "TODO" });
      const doingTasks = query(context, "tasks", { STATUS: "DOING" });
      const doneTasks = query(context, "tasks", { STATUS: "DONE" });
      console.log(
        chalk.white(
          `   ${index.counts.tasks} tasks (${doingTasks.length} active, ${doneTasks.length} done, ${todoTasks.length} todo)`
        )
      );
    } else {
      console.log(chalk.white(`   ${index.counts.tasks} tasks`));
    }

    console.log(chalk.white(`   ${index.counts.issues} known issues`));
    console.log();

    // Recent activity
    console.log(chalk.bold.magenta("🔥 Recent Activity:"));
    for (const activity of index.recentActivity.slice(0, 5)) {
      const timeAgo = formatTimestamp(activity.timestamp);
      console.log(
        chalk.gray(`   ${timeAgo}: `) +
          chalk.cyan(activity.type) +
          chalk.white(` - ${activity.description}`)
      );
    }
    console.log();

    // Active tasks
    if (context.tasks) {
      const activeTasks = query(context, "tasks", {
        STATUS: (s) => s === "TODO" || s === "DOING",
      });
      if (activeTasks.length > 0) {
        console.log(chalk.bold.green("✅ Active Tasks:"));
        for (const task of activeTasks.slice(0, 5)) {
          const statusIcon = task.STATUS === "DOING" ? "🔄" : "⏳";
          const priorityColor =
            task.PRIORITY === "H"
              ? chalk.red
              : task.PRIORITY === "L"
                ? chalk.gray
                : chalk.yellow;
          console.log(
            chalk.white(`   ${statusIcon} `) +
              priorityColor(`[${task.PRIORITY}] `) +
              chalk.white(task.TASK)
          );
        }
        if (activeTasks.length > 5) {
          console.log(
            chalk.gray(`   ... and ${activeTasks.length - 5} more`)
          );
        }
        console.log();
      }
    }

    // Recent decisions
    if (context.decisions) {
      const recentDecisions = context.decisions.entries.slice(-3).reverse();
      if (recentDecisions.length > 0) {
        console.log(chalk.bold.blue("💡 Recent Decisions:"));
        for (const decision of recentDecisions) {
          console.log(
            chalk.white(`   • ${decision.TITLE}: `) +
              chalk.gray(decision.DECISION)
          );
        }
        console.log();
      }
    }

    // Known issues
    if (context.issues) {
      const openIssues = query(context, "issues", { STATUS: "OPEN" });
      if (openIssues.length > 0) {
        console.log(chalk.bold.red("⚠️  Known Issues:"));
        for (const issue of openIssues.slice(0, 3)) {
          const severityColor =
            issue.SEVERITY === "CRITICAL"
              ? chalk.red
              : issue.SEVERITY === "HIGH"
                ? chalk.yellow
                : chalk.gray;
          console.log(
            severityColor(`   [${issue.SEVERITY}] `) +
              chalk.white(`${issue.TITLE}: ${issue.ISSUE}`)
          );
        }
        if (openIssues.length > 3) {
          console.log(chalk.gray(`   ... and ${openIssues.length - 3} more`));
        }
        console.log();
      }
    }

    // Context summary
    console.log(chalk.bold.white("💭 Key Context:"));
    console.log(chalk.gray(`   ${index.context}`));
    console.log();

    console.log(chalk.dim("─".repeat(60)));
    console.log(
      chalk.bold.cyan("\n📝 For AI: ") +
        chalk.white("Read .aicf/ for full context")
    );
    console.log(
      chalk.gray("   Use 'npx aic context --ai' for AI-optimized format\n")
    );
  } catch (error) {
    if (error.message.includes("not found")) {
      console.log(chalk.red("\n❌ No .aicf/ directory found\n"));
      console.log(
        chalk.yellow("💡 Run 'npx aic migrate' to convert .ai/ to .aicf/\n")
      );
    } else {
      throw error;
    }
  }
}

/**
 * Display context for AI consumption
 */
async function displayContextForAI(aicfDir = ".aicf") {
  try {
    const context = await loadAICF(aicfDir);
    const formatted = formatForAI(context);
    console.log(formatted);
  } catch (error) {
    if (error.message.includes("not found")) {
      console.log("ERROR: No .aicf/ directory found");
      console.log("Run 'npx aic migrate' to convert .ai/ to .aicf/");
    } else {
      throw error;
    }
  }
}

/**
 * Display full context (all files)
 */
async function displayFullContext(aicfDir = ".aicf") {
  try {
    const context = await loadAICF(aicfDir);

    console.log(chalk.bold.cyan("\n📋 Full AI Context - AICF 2.0\n"));

    // Index
    console.log(chalk.bold("INDEX:"));
    console.log(JSON.stringify(context.index, null, 2));
    console.log();

    // Conversations
    if (context.conversations) {
      console.log(chalk.bold(`CONVERSATIONS (${context.conversations.entries.length}):`));
      for (const conv of context.conversations.entries.slice(-10)) {
        console.log(`  ${conv["C#"]}: ${conv.TOPIC} - ${conv.WHAT}`);
      }
      console.log();
    }

    // Decisions
    if (context.decisions) {
      console.log(chalk.bold(`DECISIONS (${context.decisions.entries.length}):`));
      for (const dec of context.decisions.entries) {
        console.log(`  ${dec["D#"]}: ${dec.TITLE} - ${dec.DECISION}`);
      }
      console.log();
    }

    // Tasks
    if (context.tasks) {
      console.log(chalk.bold(`TASKS (${context.tasks.entries.length}):`));
      const activeTasks = query(context, "tasks", {
        STATUS: (s) => s !== "DONE" && s !== "CANCELLED",
      });
      for (const task of activeTasks) {
        console.log(
          `  ${task["T#"]}: [${task.STATUS}] ${task.TASK} (${task.PRIORITY}/${task.EFFORT})`
        );
      }
      console.log();
    }

    // Issues
    if (context.issues) {
      console.log(chalk.bold(`ISSUES (${context.issues.entries.length}):`));
      for (const issue of context.issues.entries) {
        console.log(
          `  ${issue["I#"]}: [${issue.STATUS}] ${issue.TITLE} - ${issue.ISSUE}`
        );
      }
      console.log();
    }

    console.log(chalk.dim("─".repeat(60)));
    console.log(chalk.gray("\nFull data available in .aicf/ directory\n"));
  } catch (error) {
    if (error.message.includes("not found")) {
      console.log(chalk.red("\n❌ No .aicf/ directory found\n"));
      console.log(
        chalk.yellow("💡 Run 'npx aic migrate' to convert .ai/ to .aicf/\n")
      );
    } else {
      throw error;
    }
  }
}

/**
 * Handle context command
 */
async function handleContextCommand(options) {
  const cwd = process.cwd();
  const aicfDir = path.join(cwd, ".aicf");

  if (options.ai) {
    await displayContextForAI(aicfDir);
  } else if (options.full) {
    await displayFullContext(aicfDir);
  } else {
    await displayContextSummary(aicfDir);
  }
}

module.exports = {
  handleContextCommand,
  displayContextSummary,
  displayContextForAI,
  displayFullContext,
};

