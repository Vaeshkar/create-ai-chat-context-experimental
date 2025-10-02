const fs = require("fs-extra");
const path = require("path");

async function test() {
  console.log("Testing file parsing...\n");

  // Test technical decisions
  console.log("1. Technical Decisions:");
  const techPath = path.join(".ai", "technical-decisions.md");
  const techContent = await fs.readFile(techPath, "utf8");
  const techSections = techContent.split(/^## /m).filter((s) => s.trim());
  console.log(`   Total sections: ${techSections.length}`);
  console.log(
    `   First section title: ${techSections[0]
      ?.split("\n")[0]
      ?.substring(0, 50)}`
  );

  let validSections = 0;
  for (const section of techSections) {
    if (
      !section.startsWith("#") &&
      !section.includes("IMPORTANT") &&
      !section.includes("Template")
    ) {
      const lines = section.split("\n");
      const title = lines[0].trim();
      let hasDecision = false;
      for (const line of lines) {
        if (line === "### Decision") {
          hasDecision = true;
          break;
        }
      }
      if (hasDecision) {
        validSections++;
        console.log(`   Valid: ${title.substring(0, 40)}`);
      }
    }
  }
  console.log(`   Valid decision sections: ${validSections}\n`);

  // Test known issues
  console.log("2. Known Issues:");
  const issuesPath = path.join(".ai", "known-issues.md");
  const issuesContent = await fs.readFile(issuesPath, "utf8");
  const issuesSections = issuesContent.split(/^### /m).filter((s) => s.trim());
  console.log(`   Total subsections: ${issuesSections.length}`);

  let validIssues = 0;
  for (const section of issuesSections) {
    if (
      !section.startsWith("#") &&
      !section.includes("Template") &&
      !section.includes("None Currently")
    ) {
      const lines = section.split("\n");
      const title = lines[0].trim();
      let hasProblem = false;
      for (const line of lines) {
        if (line.includes("**Problem:**")) {
          hasProblem = true;
          break;
        }
      }
      if (hasProblem) {
        validIssues++;
        console.log(`   Valid: ${title.substring(0, 40)}`);
      }
    }
  }
  console.log(`   Valid issue sections: ${validIssues}\n`);

  // Test next steps
  console.log("3. Next Steps:");
  const tasksPath = path.join(".ai", "next-steps.md.backup");
  if (await fs.pathExists(tasksPath)) {
    const tasksContent = await fs.readFile(tasksPath, "utf8");
    const taskLines = tasksContent.split("\n");
    let taskCount = 0;
    for (const line of taskLines) {
      if (line.trim().startsWith("- [ ]") || line.trim().startsWith("- [x]")) {
        taskCount++;
      }
    }
    console.log(`   Total tasks: ${taskCount}`);
  } else {
    console.log(`   Backup file not found`);
  }
}

test().catch((e) => console.error("ERROR:", e.message, e.stack));
