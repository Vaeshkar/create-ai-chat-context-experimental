/**
 * AICF Migration Tool
 * Converts .ai/ directory to .aicf/ format
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { writeAICF } = require("./aicf-compiler");

/**
 * Convert conversation-log.md to conversations.aicf
 */
async function convertConversationLog(aiDir) {
  const logPath = path.join(aiDir, "conversation-log.md");
  if (!(await fs.pathExists(logPath))) return null;

  const content = await fs.readFile(logPath, "utf8");
  const entries = [];

  // Parse entries (supports AICF 1.0, YAML, and Markdown)
  const lines = content.split("\n");
  let chatNumber = 0;

  for (const line of lines) {
    // AICF 1.0 format: C#|DATE|TYPE|TOPIC|WHAT|WHY|OUTCOME|FILES
    if (/^\d+\|/.test(line)) {
      const parts = line.split("|");
      if (parts.length >= 7) {
        chatNumber = parseInt(parts[0]);
        const timestamp = parts[1].includes("T")
          ? parts[1]
          : parts[1] + "T120000Z";
        entries.push({
          "C#": parts[0],
          TIMESTAMP: timestamp,
          TYPE: parts[2] || "W",
          TOPIC: parts[3] || "",
          WHAT: parts[4] || "",
          WHY: parts[5] || "",
          OUTCOME: parts[6] || "",
          FILES: parts[7] || "",
        });
      }
    }
    // Markdown format: ## Chat #N
    else if (line.startsWith("## Chat #")) {
      chatNumber++;
    }
  }

  return {
    schema: [
      "C#",
      "TIMESTAMP",
      "TYPE",
      "TOPIC",
      "WHAT",
      "WHY",
      "OUTCOME",
      "FILES",
    ],
    entries,
    links: [],
  };
}

/**
 * Convert technical-decisions.md to decisions.aicf
 */
async function convertTechnicalDecisions(aiDir) {
  const filePath = path.join(aiDir, "technical-decisions.md");
  if (!(await fs.pathExists(filePath))) {
    console.log(chalk.gray(`    [DEBUG] File not found: ${filePath}`));
    return null;
  }

  const content = await fs.readFile(filePath, "utf8");
  const entries = [];
  const sections = content.split(/^## /m).filter((s) => s.trim());
  console.log(
    chalk.gray(
      `    [DEBUG] Found ${sections.length} sections in technical-decisions.md`
    )
  );

  let id = 1;
  for (const section of sections) {
    if (
      section.startsWith("#") ||
      section.includes("IMPORTANT FOR AI") ||
      section.includes("Template")
    )
      continue;

    const lines = section.split("\n");
    const title = lines[0].trim().substring(0, 60);
    console.log(
      chalk.gray(`    [DEBUG] Processing section: ${title.substring(0, 30)}...`)
    );

    let decision = "";
    let rationale = "";
    let impact = "";
    let status = "ACTIVE";
    let timestamp = new Date().toISOString().replace(/\.\d{3}/, "");

    // Parse the section
    let inDecisionSection = false;
    let inRationaleSection = false;
    let inImpactSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract date
      if (line.includes("**Date:**")) {
        const dateStr = line.split("**Date:**")[1].trim();
        timestamp = dateStr.replace(/-/g, "") + "T120000Z";
      }

      // Extract status
      if (line.includes("**Status:**")) {
        const statusStr = line.split("**Status:**")[1].trim();
        if (statusStr.includes("Implemented")) {
          status = "IMPLEMENTED";
        }
      }

      // Track sections
      if (line === "### Decision") {
        inDecisionSection = true;
        inRationaleSection = false;
        inImpactSection = false;
        continue;
      } else if (line === "### Rationale") {
        inDecisionSection = false;
        inRationaleSection = true;
        inImpactSection = false;
        continue;
      } else if (line === "### Impact") {
        inDecisionSection = false;
        inRationaleSection = false;
        inImpactSection = true;
        continue;
      } else if (line.startsWith("###")) {
        inDecisionSection = false;
        inRationaleSection = false;
        inImpactSection = false;
        continue;
      }

      // Collect content
      if (inDecisionSection && line && !line.startsWith("#")) {
        decision += (decision ? " " : "") + line;
      } else if (
        inRationaleSection &&
        line &&
        !line.startsWith("#") &&
        !line.startsWith("-")
      ) {
        rationale += (rationale ? " " : "") + line;
      } else if (
        inImpactSection &&
        line &&
        !line.startsWith("#") &&
        !line.startsWith("-")
      ) {
        impact += (impact ? " " : "") + line;
      }
    }

    if (title && decision) {
      console.log(
        chalk.gray(`    [DEBUG] ✓ Added decision: ${title.substring(0, 30)}`)
      );
      entries.push({
        "D#": id.toString(),
        TIMESTAMP: timestamp,
        TITLE: title.substring(0, 60),
        DECISION: decision.substring(0, 100),
        RATIONALE: rationale.substring(0, 100),
        IMPACT: impact.substring(0, 80),
        STATUS: status,
      });
      id++;
    } else {
      console.log(
        chalk.gray(
          `    [DEBUG] ✗ Skipped (no decision): ${title.substring(0, 30)}`
        )
      );
    }
  }

  console.log(
    chalk.gray(`    [DEBUG] Total decisions extracted: ${entries.length}`)
  );
  return {
    schema: [
      "D#",
      "TIMESTAMP",
      "TITLE",
      "DECISION",
      "RATIONALE",
      "IMPACT",
      "STATUS",
    ],
    entries,
    links: [],
  };
}

/**
 * Convert next-steps.md to tasks.aicf
 */
async function convertNextSteps(aiDir) {
  // Try backup first (in case file was already converted)
  let filePath = path.join(aiDir, "next-steps.md.backup");
  if (!(await fs.pathExists(filePath))) {
    filePath = path.join(aiDir, "next-steps.md");
  }
  if (!(await fs.pathExists(filePath))) return null;

  const content = await fs.readFile(filePath, "utf8");
  const entries = [];
  const sections = content.split(/^## /m).filter((s) => s.trim());

  let id = 1;
  const timestamp = new Date().toISOString().replace(/\.\d{3}/, "");

  for (const section of sections) {
    if (section.startsWith("#") || section.includes("IMPORTANT FOR AI"))
      continue;

    const lines = section.split("\n");
    const sectionTitle = lines[0].trim();

    let priority = "M";
    if (
      sectionTitle.includes("Immediate") ||
      sectionTitle.includes("🔥") ||
      sectionTitle.includes("High")
    ) {
      priority = "H";
    } else if (
      sectionTitle.includes("Long-term") ||
      sectionTitle.includes("Backlog") ||
      sectionTitle.includes("Low")
    ) {
      priority = "L";
    }

    let defaultStatus = "TODO";
    if (
      sectionTitle.includes("Completed") ||
      sectionTitle.includes("✅") ||
      sectionTitle.includes("Done")
    ) {
      defaultStatus = "DONE";
    }

    for (const line of lines.slice(1)) {
      const trimmed = line.trim();

      if (
        trimmed.startsWith("- [ ]") ||
        trimmed.startsWith("- [x]") ||
        trimmed.startsWith("- [/]") ||
        (trimmed.startsWith("-") && !trimmed.startsWith("---"))
      ) {
        const isCompleted = trimmed.startsWith("- [x]");
        const isInProgress = trimmed.startsWith("- [/]");
        const status = isCompleted
          ? "DONE"
          : isInProgress
          ? "DOING"
          : defaultStatus;

        let task = trimmed
          .replace(/^- \[[ x\/]\] /, "")
          .replace(/^- /, "")
          .trim();
        task = task.replace(/\*\*/g, "").substring(0, 100);

        if (task) {
          let effort = "M";
          if (
            task.length < 30 ||
            task.toLowerCase().includes("add") ||
            task.toLowerCase().includes("fix")
          ) {
            effort = "S";
          } else if (
            task.length > 60 ||
            task.toLowerCase().includes("implement") ||
            task.toLowerCase().includes("create")
          ) {
            effort = "L";
          }

          entries.push({
            "T#": id.toString(),
            PRIORITY: priority,
            EFFORT: effort,
            STATUS: status,
            TASK: task,
            DEPENDENCIES: "None",
            ASSIGNED: "",
            CREATED: timestamp,
            COMPLETED: isCompleted ? timestamp : "",
          });
          id++;
        }
      }
    }
  }

  return {
    schema: [
      "T#",
      "PRIORITY",
      "EFFORT",
      "STATUS",
      "TASK",
      "DEPENDENCIES",
      "ASSIGNED",
      "CREATED",
      "COMPLETED",
    ],
    entries,
    links: [],
  };
}

/**
 * Convert known-issues.md to issues.aicf
 */
async function convertKnownIssues(aiDir) {
  const filePath = path.join(aiDir, "known-issues.md");
  if (!(await fs.pathExists(filePath))) return null;

  const content = await fs.readFile(filePath, "utf8");
  const entries = [];

  // Split by ### (subsections)
  const subsections = content.split(/^### /m).filter((s) => s.trim());

  let id = 1;

  for (const section of subsections) {
    if (
      section.startsWith("#") ||
      section.includes("Template") ||
      section.includes("None Currently")
    )
      continue;

    const lines = section.split("\n");
    const title = lines[0].trim().substring(0, 60);

    let issue = "";
    let impact = "";
    let workaround = "";
    let status = "OPEN";
    let severity = "MEDIUM";
    let timestamp = new Date().toISOString().replace(/\.\d{3}/, "");

    // Track sections
    let inProblemSection = false;
    let inSolutionSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Extract metadata
      if (line.includes("**Date Discovered:**")) {
        const dateStr = line.split("**Date Discovered:**")[1].trim();
        timestamp = dateStr.replace(/-/g, "") + "T120000Z";
      }

      if (line.includes("**Date Resolved:**")) {
        status = "RESOLVED";
      }

      if (line.includes("**Severity:**")) {
        const sevStr = line.split("**Severity:**")[1].trim();
        if (sevStr.includes("🔴") || sevStr.includes("High")) {
          severity = "HIGH";
        } else if (sevStr.includes("🟡") || sevStr.includes("Medium")) {
          severity = "MEDIUM";
        } else if (sevStr.includes("🟢") || sevStr.includes("Low")) {
          severity = "LOW";
        }
      }

      // Track sections
      if (line === "**Problem:**") {
        inProblemSection = true;
        inSolutionSection = false;
        continue;
      } else if (
        line === "**Solution:**" ||
        line === "**Solution/Workaround:**"
      ) {
        inProblemSection = false;
        inSolutionSection = true;
        continue;
      } else if (line.startsWith("**") && line.endsWith(":**")) {
        inProblemSection = false;
        inSolutionSection = false;
        continue;
      }

      // Collect content
      if (
        inProblemSection &&
        line &&
        !line.startsWith("#") &&
        !line.startsWith("-")
      ) {
        issue += (issue ? " " : "") + line;
      } else if (
        inSolutionSection &&
        line &&
        !line.startsWith("#") &&
        !line.startsWith("-")
      ) {
        workaround += (workaround ? " " : "") + line;
      }
    }

    if (title && issue) {
      entries.push({
        "I#": id.toString(),
        TIMESTAMP: timestamp,
        SEVERITY: severity,
        TITLE: title.substring(0, 60),
        ISSUE: issue.substring(0, 100),
        IMPACT: impact || "See description",
        WORKAROUND: workaround.substring(0, 100),
        STATUS: status,
      });
      id++;
    }
  }

  return {
    schema: [
      "I#",
      "TIMESTAMP",
      "SEVERITY",
      "TITLE",
      "ISSUE",
      "IMPACT",
      "WORKAROUND",
      "STATUS",
    ],
    entries,
    links: [],
  };
}

/**
 * Generate index from converted data
 */
function generateIndex(packageJson, conversations, decisions, tasks, issues) {
  const timestamp = new Date().toISOString().replace(/\.\d{3}/, "");

  return {
    version: "2.0.0",
    project: {
      name: packageJson.name || "unknown",
      version: packageJson.version || "0.0.0",
      language: "javascript",
      repo: packageJson.repository?.url || "",
      last_update: timestamp,
    },
    counts: {
      conversations: conversations?.entries.length || 0,
      decisions: decisions?.entries.length || 0,
      tasks: tasks?.entries.length || 0,
      issues: issues?.entries.length || 0,
      components: 0,
    },
    state: {
      status: "active_development",
      phase: "migrated_to_aicf",
      last_chat: conversations?.entries.length || 0,
      last_commit: "",
    },
    context: packageJson.description || "No description available",
    currentWork: {
      task: "Migrated to AICF 2.0 format",
      priority: "HIGH",
      started: timestamp,
      blockers: "none",
    },
    recentActivity: [
      {
        timestamp,
        type: "MIGRATION",
        description: "Converted .ai/ to .aicf/ format",
      },
    ],
  };
}

/**
 * Main migration function
 */
async function migrateToAICF(aiDir = ".ai", aicfDir = ".aicf") {
  console.log(chalk.bold("\n🚀 Migrating to AICF 2.0\n"));

  // Check if .ai/ exists
  if (!(await fs.pathExists(aiDir))) {
    throw new Error(`.ai/ directory not found at ${aiDir}`);
  }

  // Convert all files
  console.log(chalk.cyan("Converting files..."));
  const conversations = await convertConversationLog(aiDir);
  console.log(
    chalk.gray(`  - Conversations: ${conversations?.entries?.length || 0}`)
  );

  const decisions = await convertTechnicalDecisions(aiDir);
  console.log(chalk.gray(`  - Decisions: ${decisions?.entries?.length || 0}`));

  const tasks = await convertNextSteps(aiDir);
  console.log(chalk.gray(`  - Tasks: ${tasks?.entries?.length || 0}`));

  const issues = await convertKnownIssues(aiDir);
  console.log(chalk.gray(`  - Issues: ${issues?.entries?.length || 0}`));

  // Load package.json for metadata
  let packageJson = {};
  const packagePath = path.join(process.cwd(), "package.json");
  if (await fs.pathExists(packagePath)) {
    packageJson = await fs.readJSON(packagePath);
  }

  // Generate index
  const index = generateIndex(
    packageJson,
    conversations,
    decisions,
    tasks,
    issues
  );

  // Generate .meta
  const meta = {
    aicf_version: "2.0.0",
    project: index.project,
    created: index.project.last_update,
    last_update: index.project.last_update,
    stats: index.counts,
    tools: {
      generator: "create-ai-chat-context",
      generator_version: packageJson.version || "0.12.0",
    },
  };

  // Build context object
  const context = {
    index,
    conversations,
    decisions,
    tasks,
    issues,
    meta,
  };

  // Write AICF directory
  await writeAICF(context, aicfDir);

  console.log(chalk.green("✔ Migration complete!\n"));
  console.log(chalk.bold("📊 Results:"));
  console.log(
    chalk.cyan(`   Conversations: ${conversations?.entries.length || 0}`)
  );
  console.log(chalk.cyan(`   Decisions: ${decisions?.entries.length || 0}`));
  console.log(chalk.cyan(`   Tasks: ${tasks?.entries.length || 0}`));
  console.log(chalk.cyan(`   Issues: ${issues?.entries.length || 0}\n`));

  return context;
}

module.exports = {
  migrateToAICF,
};
