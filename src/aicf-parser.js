/**
 * AICF 2.0 Parser
 * Reads AI Context Format files and provides structured data
 */

const fs = require("fs-extra");
const path = require("path");

/**
 * Parse AICF index file
 */
function parseIndex(content) {
  const index = {
    version: null,
    project: {},
    counts: {},
    state: {},
    context: "",
    currentWork: {},
    recentActivity: [],
  };

  const sections = content.split(/^@/m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split("\n").filter((l) => l.trim());
    const sectionName = lines[0].trim();

    if (sectionName === "AICF_VERSION") {
      index.version = lines[1]?.trim();
    } else if (sectionName === "PROJECT") {
      for (const line of lines.slice(1)) {
        const [key, value] = line.split("=");
        if (key && value) index.project[key.trim()] = value.trim();
      }
    } else if (sectionName === "COUNTS") {
      for (const line of lines.slice(1)) {
        const [key, value] = line.split("=");
        if (key && value) index.counts[key.trim()] = parseInt(value.trim());
      }
    } else if (sectionName === "STATE") {
      for (const line of lines.slice(1)) {
        const [key, value] = line.split("=");
        if (key && value) index.state[key.trim()] = value.trim();
      }
    } else if (sectionName === "CONTEXT") {
      index.context = lines.slice(1).join(" ").trim();
    } else if (sectionName === "CURRENT_WORK") {
      for (const line of lines.slice(1)) {
        const [key, value] = line.split("=");
        if (key && value) index.currentWork[key.trim()] = value.trim();
      }
    } else if (sectionName === "RECENT_ACTIVITY") {
      for (const line of lines.slice(1)) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          index.recentActivity.push({
            timestamp: parts[0].trim(),
            type: parts[1].trim(),
            description: parts[2].trim(),
          });
        }
      }
    }
  }

  return index;
}

/**
 * Parse AICF data file (conversations, decisions, tasks, etc.)
 */
function parseDataFile(content) {
  const data = {
    schema: [],
    entries: [],
    links: [],
  };

  const sections = content.split(/^@/m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split("\n").filter((l) => l.trim());
    const sectionName = lines[0].trim();

    if (sectionName === "SCHEMA") {
      // Schema line defines field names
      if (lines[1]) {
        data.schema = lines[1].split("|").map((f) => f.trim());
      }
    } else if (sectionName === "DATA") {
      // Parse data entries
      for (const line of lines.slice(1)) {
        if (line.includes("|")) {
          const values = line.split("|");
          const entry = {};
          data.schema.forEach((field, index) => {
            entry[field] = values[index]?.trim() || "";
          });
          data.entries.push(entry);
        }
      }
    } else if (sectionName === "LINKS") {
      // Parse relationship links
      for (const line of lines.slice(1)) {
        const linkParts = line.split("|");
        for (const linkPart of linkParts) {
          if (linkPart.includes("->")) {
            const [from, to] = linkPart.split("->");
            data.links.push({ from: from.trim(), to: to.trim() });
          }
        }
      }
    }
  }

  return data;
}

/**
 * Load entire AICF directory
 */
async function loadAICF(aicfDir = ".aicf") {
  const context = {
    index: null,
    conversations: null,
    decisions: null,
    tasks: null,
    issues: null,
    architecture: null,
    knowledge: null,
    meta: null,
  };

  // Check if directory exists
  if (!(await fs.pathExists(aicfDir))) {
    throw new Error(`.aicf/ directory not found at ${aicfDir}`);
  }

  // Load index (required)
  const indexPath = path.join(aicfDir, "index.aicf");
  if (await fs.pathExists(indexPath)) {
    const content = await fs.readFile(indexPath, "utf8");
    context.index = parseIndex(content);
  } else {
    throw new Error("index.aicf is required but not found");
  }

  // Load optional files
  const files = {
    conversations: "conversations.aicf",
    decisions: "decisions.aicf",
    tasks: "tasks.aicf",
    issues: "issues.aicf",
    architecture: "architecture.aicf",
    knowledge: "knowledge.aicf",
  };

  for (const [key, filename] of Object.entries(files)) {
    const filePath = path.join(aicfDir, filename);
    if (await fs.pathExists(filePath)) {
      const content = await fs.readFile(filePath, "utf8");
      context[key] = parseDataFile(content);
    }
  }

  // Load .meta (JSON)
  const metaPath = path.join(aicfDir, ".meta");
  if (await fs.pathExists(metaPath)) {
    const content = await fs.readFile(metaPath, "utf8");
    context.meta = JSON.parse(content);
  }

  return context;
}

/**
 * Query AICF data
 */
function query(context, type, filter = {}) {
  const data = context[type];
  if (!data || !data.entries) return [];

  let results = data.entries;

  // Apply filters
  for (const [key, value] of Object.entries(filter)) {
    results = results.filter((entry) => {
      if (typeof value === "function") {
        return value(entry[key]);
      }
      return entry[key] === value;
    });
  }

  return results;
}

/**
 * Get related items via links
 */
function getRelated(context, type, id) {
  const related = {
    from: [],
    to: [],
  };

  const data = context[type];
  if (!data || !data.links) return related;

  const prefix = type[0].toUpperCase() + ":";
  const targetId = prefix + id;

  for (const link of data.links) {
    if (link.from === targetId) {
      related.to.push(link.to);
    }
    if (link.to === targetId) {
      related.from.push(link.from);
    }
  }

  return related;
}

/**
 * Format context for AI consumption
 */
function formatForAI(context) {
  const { index } = context;

  let output = `# AI Context - ${index.project.name} v${index.project.version}\n\n`;

  // Project overview
  output += `## Project Overview\n`;
  output += `${index.context}\n\n`;

  // Current state
  output += `## Current State\n`;
  output += `Status: ${index.state.status}\n`;
  output += `Phase: ${index.state.phase}\n`;
  output += `Last Chat: #${index.state.last_chat}\n\n`;

  // Current work
  output += `## Current Work\n`;
  output += `Task: ${index.currentWork.task}\n`;
  output += `Priority: ${index.currentWork.priority}\n`;
  output += `Started: ${index.currentWork.started}\n`;
  output += `Blockers: ${index.currentWork.blockers}\n\n`;

  // Recent activity
  output += `## Recent Activity\n`;
  for (const activity of index.recentActivity.slice(0, 5)) {
    output += `- ${activity.timestamp}: ${activity.type} - ${activity.description}\n`;
  }
  output += `\n`;

  // Stats
  output += `## Statistics\n`;
  output += `- Conversations: ${index.counts.conversations}\n`;
  output += `- Decisions: ${index.counts.decisions}\n`;
  output += `- Tasks: ${index.counts.tasks}\n`;
  output += `- Issues: ${index.counts.issues}\n`;
  output += `- Components: ${index.counts.components}\n\n`;

  // Active tasks
  if (context.tasks) {
    const activeTasks = query(context, "tasks", {
      STATUS: (s) => s === "TODO" || s === "DOING",
    });
    if (activeTasks.length > 0) {
      output += `## Active Tasks\n`;
      for (const task of activeTasks.slice(0, 10)) {
        output += `- [${task.STATUS}] ${task.TASK} (Priority: ${task.PRIORITY})\n`;
      }
      output += `\n`;
    }
  }

  // Recent decisions
  if (context.decisions) {
    const recentDecisions = context.decisions.entries.slice(0, 5);
    if (recentDecisions.length > 0) {
      output += `## Recent Decisions\n`;
      for (const decision of recentDecisions) {
        output += `- ${decision.TITLE}: ${decision.DECISION}\n`;
      }
      output += `\n`;
    }
  }

  // Known issues
  if (context.issues) {
    const openIssues = query(context, "issues", { STATUS: "OPEN" });
    if (openIssues.length > 0) {
      output += `## Known Issues\n`;
      for (const issue of openIssues) {
        output += `- [${issue.SEVERITY}] ${issue.TITLE}: ${issue.ISSUE}\n`;
      }
      output += `\n`;
    }
  }

  output += `---\n`;
  output += `Full context available in .aicf/ directory\n`;
  output += `Use 'npx aic context --full' for complete details\n`;

  return output;
}

module.exports = {
  parseIndex,
  parseDataFile,
  loadAICF,
  query,
  getRelated,
  formatForAI,
};

