/**
 * AICF 2.0 Compiler
 * Writes AI Context Format files from structured data
 */

const fs = require("fs-extra");
const path = require("path");

/**
 * Compile index.aicf
 */
function compileIndex(data) {
  let content = "";

  content += `@AICF_VERSION\n${data.version || "2.0.0"}\n\n`;

  content += `@PROJECT\n`;
  for (const [key, value] of Object.entries(data.project || {})) {
    content += `${key}=${value}\n`;
  }
  content += `\n`;

  content += `@COUNTS\n`;
  for (const [key, value] of Object.entries(data.counts || {})) {
    content += `${key}=${value}\n`;
  }
  content += `\n`;

  content += `@STATE\n`;
  for (const [key, value] of Object.entries(data.state || {})) {
    content += `${key}=${value}\n`;
  }
  content += `\n`;

  content += `@CONTEXT\n${data.context || ""}\n\n`;

  content += `@CURRENT_WORK\n`;
  for (const [key, value] of Object.entries(data.currentWork || {})) {
    content += `${key}=${value}\n`;
  }
  content += `\n`;

  content += `@RECENT_ACTIVITY\n`;
  for (const activity of data.recentActivity || []) {
    content += `${activity.timestamp}|${activity.type}|${activity.description}\n`;
  }
  content += `\n`;

  return content;
}

/**
 * Compile data file (conversations, decisions, tasks, etc.)
 */
function compileDataFile(data, type) {
  let content = "";

  // Header
  const typeUpper = type.toUpperCase();
  content += `@${typeUpper}\n`;

  // Schema
  content += `@SCHEMA\n`;
  content += data.schema.join("|") + "\n\n";

  // Data
  content += `@DATA\n`;
  for (const entry of data.entries || []) {
    const values = data.schema.map((field) => entry[field] || "");
    content += values.join("|") + "\n";
  }
  content += `\n`;

  // Links (if any)
  if (data.links && data.links.length > 0) {
    content += `@LINKS\n`;
    const linkStrings = data.links.map((link) => `${link.from}->${link.to}`);
    content += linkStrings.join("|") + "\n";
    content += `\n`;
  }

  return content;
}

/**
 * Compile .meta file (JSON)
 */
function compileMeta(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Write AICF directory
 */
async function writeAICF(context, aicfDir = ".aicf") {
  // Create directory
  await fs.ensureDir(aicfDir);

  // Write index (required)
  if (context.index) {
    const indexPath = path.join(aicfDir, "index.aicf");
    const content = compileIndex(context.index);
    await fs.writeFile(indexPath, content, "utf8");
  }

  // Write data files
  const files = {
    conversations: "conversations.aicf",
    decisions: "decisions.aicf",
    tasks: "tasks.aicf",
    issues: "issues.aicf",
    architecture: "architecture.aicf",
    knowledge: "knowledge.aicf",
  };

  for (const [key, filename] of Object.entries(files)) {
    if (context[key]) {
      const filePath = path.join(aicfDir, filename);
      const content = compileDataFile(context[key], key);
      await fs.writeFile(filePath, content, "utf8");
    }
  }

  // Write .meta
  if (context.meta) {
    const metaPath = path.join(aicfDir, ".meta");
    const content = compileMeta(context.meta);
    await fs.writeFile(metaPath, content, "utf8");
  }
}

/**
 * Add entry to AICF file
 */
async function addEntry(aicfDir, type, entry) {
  const filename = `${type}.aicf`;
  const filePath = path.join(aicfDir, filename);

  // Load existing data
  let data = { schema: [], entries: [], links: [] };
  if (await fs.pathExists(filePath)) {
    const content = await fs.readFile(filePath, "utf8");
    const { parseDataFile } = require("./aicf-parser");
    data = parseDataFile(content);
  }

  // Add new entry
  data.entries.push(entry);

  // Write back
  const content = compileDataFile(data, type);
  await fs.writeFile(filePath, content, "utf8");

  // Update index counts
  await updateIndexCounts(aicfDir);
}

/**
 * Update index counts
 */
async function updateIndexCounts(aicfDir) {
  const indexPath = path.join(aicfDir, "index.aicf");
  if (!(await fs.pathExists(indexPath))) return;

  const { parseIndex } = require("./aicf-parser");
  const content = await fs.readFile(indexPath, "utf8");
  const index = parseIndex(content);

  // Count entries in each file
  const files = {
    conversations: "conversations.aicf",
    decisions: "decisions.aicf",
    tasks: "tasks.aicf",
    issues: "issues.aicf",
    components: "architecture.aicf",
  };

  for (const [key, filename] of Object.entries(files)) {
    const filePath = path.join(aicfDir, filename);
    if (await fs.pathExists(filePath)) {
      const fileContent = await fs.readFile(filePath, "utf8");
      const { parseDataFile } = require("./aicf-parser");
      const data = parseDataFile(fileContent);
      index.counts[key] = data.entries.length;
    }
  }

  // Update timestamp
  index.project.last_update = new Date().toISOString().replace(/\.\d{3}/, "");

  // Write back
  const newContent = compileIndex(index);
  await fs.writeFile(indexPath, newContent, "utf8");
}

/**
 * Update index state
 */
async function updateIndexState(aicfDir, updates) {
  const indexPath = path.join(aicfDir, "index.aicf");
  if (!(await fs.pathExists(indexPath))) return;

  const { parseIndex } = require("./aicf-parser");
  const content = await fs.readFile(indexPath, "utf8");
  const index = parseIndex(content);

  // Apply updates
  if (updates.state) {
    index.state = { ...index.state, ...updates.state };
  }
  if (updates.currentWork) {
    index.currentWork = { ...index.currentWork, ...updates.currentWork };
  }
  if (updates.context) {
    index.context = updates.context;
  }

  // Update timestamp
  index.project.last_update = new Date().toISOString().replace(/\.\d{3}/, "");

  // Write back
  const newContent = compileIndex(index);
  await fs.writeFile(indexPath, newContent, "utf8");
}

/**
 * Add activity to index
 */
async function addActivity(aicfDir, type, description) {
  const indexPath = path.join(aicfDir, "index.aicf");
  if (!(await fs.pathExists(indexPath))) return;

  const { parseIndex } = require("./aicf-parser");
  const content = await fs.readFile(indexPath, "utf8");
  const index = parseIndex(content);

  // Add activity
  const timestamp = new Date().toISOString().replace(/\.\d{3}/, "");
  index.recentActivity.unshift({
    timestamp,
    type,
    description,
  });

  // Keep only last 20 activities
  index.recentActivity = index.recentActivity.slice(0, 20);

  // Update timestamp
  index.project.last_update = timestamp;

  // Write back
  const newContent = compileIndex(index);
  await fs.writeFile(indexPath, newContent, "utf8");
}

module.exports = {
  compileIndex,
  compileDataFile,
  compileMeta,
  writeAICF,
  addEntry,
  updateIndexCounts,
  updateIndexState,
  addActivity,
};

