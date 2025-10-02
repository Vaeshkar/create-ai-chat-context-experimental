/**
 * AICF (AI-Native Conversation Format) for ALL Knowledge Base Files
 *
 * Extends AICF beyond conversation-log.md to all knowledge base files
 * for maximum token efficiency across the entire .ai/ directory.
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");

/**
 * AICF Format Specifications
 */
const AICF_FORMATS = {
  // Technical Decisions: D#|YYYYMMDD|TITLE|DECISION|RATIONALE|IMPACT
  "technical-decisions": {
    separator: "|",
    fields: ["id", "date", "title", "decision", "rationale", "impact"],
    example:
      "1|20251001|Config location|Store in .ai/config.json|Keep AI config together|Per-project preferences",
  },

  // Known Issues: I#|YYYYMMDD|TITLE|ISSUE|IMPACT|WORKAROUND|STATUS
  "known-issues": {
    separator: "|",
    fields: ["id", "date", "title", "issue", "impact", "workaround", "status"],
    example:
      "1|20251001|Token accuracy|Estimates ±10%|May be slightly off|Use --all flag|KNOWN",
  },

  // Next Steps: T#|PRIORITY|EFFORT|STATUS|TASK|DEPENDENCIES|ASSIGNED
  "next-steps": {
    separator: "|",
    fields: [
      "id",
      "priority",
      "effort",
      "status",
      "task",
      "dependencies",
      "assigned",
    ],
    example: "1|H|M|TODO|Test v0.10.0 and publish to npm|None|",
  },

  // Architecture: C#|NAME|PURPOSE|LOCATION|DEPENDENCIES|KEY_FUNCTIONS|INTERFACES
  architecture: {
    separator: "|",
    fields: [
      "id",
      "name",
      "purpose",
      "location",
      "dependencies",
      "key_functions",
      "interfaces",
    ],
    example:
      "1|CLI System|Handle commands|bin/cli.js|commander,chalk|parse,help,errors|src/*",
  },
};

/**
 * Convert technical-decisions.md to AICF
 */
function convertTechnicalDecisions(content) {
  const entries = [];
  const sections = content.split(/^## /m).filter((s) => s.trim());

  let id = 1;
  for (const section of sections) {
    if (section.startsWith("#") || section.includes("IMPORTANT FOR AI"))
      continue;

    const lines = section.split("\n");
    const title = lines[0].trim();

    let decision = "";
    let rationale = "";
    let impact = "";
    let date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    for (const line of lines) {
      if (line.includes("**Decision:**")) {
        decision = line.split("**Decision:**")[1].trim().substring(0, 60);
      } else if (line.includes("**Rationale:**")) {
        rationale = line.split("**Rationale:**")[1].trim().substring(0, 60);
      } else if (line.includes("**Impact:**")) {
        impact = line.split("**Impact:**")[1].trim().substring(0, 50);
      } else if (line.includes("**Date:**")) {
        const dateStr = line.split("**Date:**")[1].trim();
        date = dateStr.replace(/-/g, "");
      }
    }

    if (title && decision) {
      entries.push(
        `${id}|${date}|${title.substring(
          0,
          40
        )}|${decision}|${rationale}|${impact}`
      );
      id++;
    }
  }

  return entries;
}

/**
 * Convert known-issues.md to AICF
 */
function convertKnownIssues(content) {
  const entries = [];
  const sections = content.split(/^## /m).filter((s) => s.trim());

  let id = 1;
  for (const section of sections) {
    if (section.startsWith("#") || section.includes("IMPORTANT FOR AI"))
      continue;

    const lines = section.split("\n");
    const title = lines[0].trim();

    let issue = "";
    let impact = "";
    let workaround = "";
    let status = "KNOWN";
    let date = new Date().toISOString().split("T")[0].replace(/-/g, "");

    for (const line of lines) {
      if (line.includes("**Issue:**")) {
        issue = line.split("**Issue:**")[1].trim().substring(0, 60);
      } else if (line.includes("**Impact:**")) {
        impact = line.split("**Impact:**")[1].trim().substring(0, 50);
      } else if (line.includes("**Workaround:**")) {
        workaround = line.split("**Workaround:**")[1].trim().substring(0, 50);
      } else if (line.includes("**Status:**")) {
        status = line.split("**Status:**")[1].trim().substring(0, 20);
      } else if (line.includes("**Reported:**")) {
        const dateStr = line.split("**Reported:**")[1].trim();
        date = dateStr.replace(/-/g, "");
      }
    }

    if (title && issue) {
      entries.push(
        `${id}|${date}|${title.substring(
          0,
          40
        )}|${issue}|${impact}|${workaround}|${status}`
      );
      id++;
    }
  }

  return entries;
}

/**
 * Convert next-steps.md to AICF
 * Handles bullet list format: - [ ] Task or - [x] Completed task
 */
function convertNextSteps(content) {
  const entries = [];
  const sections = content.split(/^## /m).filter((s) => s.trim());

  let id = 1;
  for (const section of sections) {
    if (section.startsWith("#") || section.includes("IMPORTANT FOR AI"))
      continue;

    const lines = section.split("\n");
    const sectionTitle = lines[0].trim();

    // Determine priority from section title
    let priority = "M";
    if (sectionTitle.includes("Immediate") || sectionTitle.includes("🔥")) {
      priority = "H";
    } else if (
      sectionTitle.includes("Long-term") ||
      sectionTitle.includes("Ideas") ||
      sectionTitle.includes("Backlog")
    ) {
      priority = "L";
    }

    // Determine status from section title
    let defaultStatus = "TODO";
    if (sectionTitle.includes("Completed") || sectionTitle.includes("✅")) {
      defaultStatus = "DONE";
    }

    // Parse bullet points
    for (const line of lines.slice(1)) {
      const trimmed = line.trim();

      // Check for task items: - [ ] or - [x] or just -
      if (
        trimmed.startsWith("- [ ]") ||
        trimmed.startsWith("- [x]") ||
        (trimmed.startsWith("-") && !trimmed.startsWith("---"))
      ) {
        const isCompleted = trimmed.startsWith("- [x]");
        const status = isCompleted ? "DONE" : defaultStatus;

        // Extract task text
        let task = trimmed
          .replace(/^- \[[ x]\] /, "")
          .replace(/^- /, "")
          .trim();

        // Remove markdown formatting
        task = task.replace(/\*\*/g, "").substring(0, 80);

        if (task) {
          // Estimate effort based on task complexity
          let effort = "M";
          if (
            task.length < 30 ||
            task.includes("Add") ||
            task.includes("Fix")
          ) {
            effort = "S";
          } else if (
            task.length > 60 ||
            task.includes("Complete") ||
            task.includes("Implement") ||
            task.includes("Create")
          ) {
            effort = "L";
          }

          entries.push(`${id}|${priority}|${effort}|${status}|${task}|None|`);
          id++;
        }
      }
    }
  }

  return entries;
}

/**
 * Convert architecture.md to AICF
 */
function convertArchitecture(content) {
  const entries = [];
  const sections = content.split(/^## /m).filter((s) => s.trim());

  let id = 1;
  for (const section of sections) {
    if (section.startsWith("#") || section.includes("IMPORTANT FOR AI"))
      continue;

    const lines = section.split("\n");
    const name = lines[0].trim();

    let purpose = "";
    let location = "";
    let dependencies = "";
    let keyFunctions = "";
    let interfaces = "";

    for (const line of lines) {
      if (line.includes("**Purpose:**")) {
        purpose = line.split("**Purpose:**")[1].trim().substring(0, 50);
      } else if (line.includes("**Location:**")) {
        location = line.split("**Location:**")[1].trim().substring(0, 40);
      } else if (line.includes("**Dependencies:**")) {
        dependencies = line
          .split("**Dependencies:**")[1]
          .trim()
          .substring(0, 40);
      } else if (line.includes("**Key Functions:**")) {
        // Next lines are bullet points
        keyFunctions = "see-doc";
      } else if (line.includes("**Interfaces:**")) {
        interfaces = line.split("**Interfaces:**")[1].trim().substring(0, 40);
      }
    }

    if (name && purpose) {
      entries.push(
        `${id}|${name.substring(
          0,
          30
        )}|${purpose}|${location}|${dependencies}|${keyFunctions}|${interfaces}`
      );
      id++;
    }
  }

  return entries;
}

/**
 * Generate AICF header for a file type
 */
function generateHeader(fileType) {
  const format = AICF_FORMATS[fileType];
  if (!format) return "";

  const fieldNames = format.fields.join("|").toUpperCase();

  return `# ${fileType
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")}

> **📝 IMPORTANT FOR AI ASSISTANTS:**
> Format: AICF (AI-Native Conversation Format) - Ultra-compact for maximum token efficiency
> Each line: ${fieldNames}
> Example: ${format.example}

---

`;
}

/**
 * Convert all knowledge base files to AICF
 */
async function convertAllToAICF(aiDir = ".ai") {
  const results = {
    converted: [],
    skipped: [],
    errors: [],
  };

  const files = {
    "technical-decisions.md": convertTechnicalDecisions,
    "known-issues.md": convertKnownIssues,
    "next-steps.md": convertNextSteps,
    "architecture.md": convertArchitecture,
  };

  for (const [filename, converter] of Object.entries(files)) {
    const filePath = path.join(aiDir, filename);

    try {
      if (!(await fs.pathExists(filePath))) {
        results.skipped.push(`${filename} (not found)`);
        continue;
      }

      // Read original
      const content = await fs.readFile(filePath, "utf8");

      // Create backup
      const backupPath = `${filePath}.backup`;
      await fs.copy(filePath, backupPath);

      // Convert to AICF
      const fileType = filename.replace(".md", "");
      const entries = converter(content);

      if (entries.length === 0) {
        results.skipped.push(`${filename} (no entries found)`);
        continue;
      }

      // Generate new content
      const header = generateHeader(fileType);
      const newContent = header + entries.join("\n\n---\n\n") + "\n";

      // Write converted content
      await fs.writeFile(filePath, newContent, "utf8");

      results.converted.push({
        file: filename,
        entries: entries.length,
        backup: backupPath,
      });
    } catch (error) {
      results.errors.push(`${filename}: ${error.message}`);
    }
  }

  return results;
}

module.exports = {
  convertAllToAICF,
  AICF_FORMATS,
};
