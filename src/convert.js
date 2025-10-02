const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const { estimateTokens } = require("./tokens");
const {
  yamlToAiNative,
  aiNativeToYaml,
  markdownToAiNative,
} = require("./ai-native-format");
const { convertAllToAICF } = require("./aicf-all-files");

/**
 * Detect format of conversation log entry
 */
function detectEntryFormat(entry) {
  const trimmed = entry.trim();

  // AI-native format: starts with number|
  if (/^\d+\|/.test(trimmed)) {
    return "ai-native";
  }

  // YAML format: starts with ```yaml or ---
  if (trimmed.startsWith("```yaml") || trimmed.startsWith("---")) {
    return "yaml";
  }

  // Markdown format: starts with ##
  if (trimmed.startsWith("##")) {
    return "markdown";
  }

  return "unknown";
}

/**
 * Split conversation log into entries
 */
function splitIntoEntries(content) {
  const entries = [];
  const lines = content.split("\n");
  let currentEntry = [];
  let inEntry = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is the start of a new entry
    const isEntryStart =
      line.startsWith("## Chat #") || // Markdown
      line.startsWith("```yaml") || // YAML
      /^\d+\|/.test(line); // AI-native

    if (isEntryStart) {
      // Save previous entry if exists
      if (currentEntry.length > 0) {
        entries.push(currentEntry.join("\n"));
      }
      currentEntry = [line];
      inEntry = true;
    } else if (inEntry) {
      currentEntry.push(line);

      // Check if entry ends
      if (
        line.trim() === "---" ||
        (line.trim() === "" &&
          i < lines.length - 1 &&
          lines[i + 1].trim() === "---")
      ) {
        entries.push(currentEntry.join("\n"));
        currentEntry = [];
        inEntry = false;
      }
    }
  }

  // Add last entry if exists
  if (currentEntry.length > 0) {
    entries.push(currentEntry.join("\n"));
  }

  return entries;
}

/**
 * Convert entry to target format
 */
function convertEntry(entry, targetFormat) {
  const sourceFormat = detectEntryFormat(entry);

  if (sourceFormat === targetFormat) {
    return entry; // No conversion needed
  }

  try {
    if (targetFormat === "ai-native") {
      if (sourceFormat === "yaml") {
        return yamlToAiNative(entry);
      } else if (sourceFormat === "markdown") {
        return markdownToAiNative(entry);
      }
    } else if (targetFormat === "yaml") {
      if (sourceFormat === "ai-native") {
        return aiNativeToYaml(entry);
      } else if (sourceFormat === "markdown") {
        // Convert markdown → ai-native → yaml
        const aiNative = markdownToAiNative(entry);
        return aiNativeToYaml(aiNative);
      }
    } else if (targetFormat === "markdown") {
      // Convert to YAML first, then format as markdown
      let yamlEntry = entry;
      if (sourceFormat === "ai-native") {
        yamlEntry = aiNativeToYaml(entry);
      } else if (sourceFormat === "markdown") {
        return entry; // Already markdown
      }

      // Parse YAML and format as markdown
      // This is a simplified conversion - you might want to enhance this
      return yamlEntry.replace(/```yaml\n/, "").replace(/\n```/, "");
    }
  } catch (error) {
    console.warn(chalk.yellow(`⚠️  Failed to convert entry: ${error.message}`));
    return entry; // Return original on error
  }

  return entry;
}

/**
 * Create backup of file
 */
async function createBackup(filePath) {
  const backupPath = `${filePath}.backup`;
  await fs.copy(filePath, backupPath);
  return backupPath;
}

/**
 * Calculate token savings
 */
function calculateTokenSavings(beforeContent, afterContent) {
  // Count words in content
  const beforeWords = beforeContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const afterWords = afterContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Estimate tokens from word count
  const beforeTokens = estimateTokens(beforeWords);
  const afterTokens = estimateTokens(afterWords);
  const savings = beforeTokens - afterTokens;
  const percentage = Math.round((savings / beforeTokens) * 100);

  return {
    before: beforeTokens,
    after: afterTokens,
    savings,
    percentage,
  };
}

/**
 * Handle convert command
 */
async function handleConvertCommand(options) {
  const cwd = process.cwd();

  // Handle --all-files option
  if (options.allFiles) {
    console.log(
      chalk.bold("\n🚀 Converting ALL Knowledge Base Files to AICF\n")
    );

    const aiDir = path.join(cwd, ".ai");
    if (!(await fs.pathExists(aiDir))) {
      console.log(chalk.red("❌ Error: .ai/ directory not found"));
      console.log(
        chalk.gray("\n💡 Run 'npx aic init' to create the knowledge base\n")
      );
      return;
    }

    const results = await convertAllToAICF(aiDir);

    // Display results
    if (results.converted.length > 0) {
      console.log(chalk.green("✔ Converted files:\n"));
      for (const file of results.converted) {
        console.log(chalk.cyan(`   ${file.file}`));
        console.log(chalk.gray(`   - ${file.entries} entries converted`));
        console.log(chalk.gray(`   - Backup: ${path.basename(file.backup)}\n`));
      }
    }

    if (results.skipped.length > 0) {
      console.log(chalk.yellow("⚠ Skipped:\n"));
      for (const skip of results.skipped) {
        console.log(chalk.gray(`   ${skip}`));
      }
      console.log();
    }

    if (results.errors.length > 0) {
      console.log(chalk.red("❌ Errors:\n"));
      for (const error of results.errors) {
        console.log(chalk.red(`   ${error}`));
      }
      console.log();
    }

    if (results.converted.length > 0) {
      console.log(chalk.bold.green("✅ Conversion completed successfully!\n"));
      console.log(chalk.bold("💡 Next steps:"));
      console.log("   1. Review the converted files");
      console.log("   2. Run 'npx aic tokens' to see token savings");
      console.log("   3. If satisfied, delete backups: rm .ai/*.backup\n");
    }

    return;
  }

  // Original conversation-log conversion logic
  const logPath = path.join(cwd, ".ai", "conversation-log.md");

  console.log(chalk.bold("\n📝 Converting Conversation Log\n"));

  // Check if file exists
  if (!(await fs.pathExists(logPath))) {
    console.log(chalk.red("❌ Error: .ai/conversation-log.md not found"));
    console.log(
      chalk.gray("\n💡 Run 'npx aic init' to create the knowledge base\n")
    );
    return;
  }

  // Determine target format
  let targetFormat;
  if (options.toAiNative) {
    targetFormat = "ai-native";
  } else if (options.toYaml) {
    targetFormat = "yaml";
  } else if (options.toMarkdown) {
    targetFormat = "markdown";
  } else {
    console.log(chalk.red("❌ Error: No target format specified"));
    console.log(
      chalk.gray("\n💡 Use --to-ai-native, --to-yaml, or --to-markdown\n")
    );
    return;
  }

  // Read current content
  const content = await fs.readFile(logPath, "utf8");

  // Detect current format
  const entries = splitIntoEntries(content);
  const formats = entries.map((e) => detectEntryFormat(e));
  const uniqueFormats = [...new Set(formats)];

  console.log(
    chalk.green(
      `✔ Detected current format${
        uniqueFormats.length > 1 ? "s" : ""
      }: ${uniqueFormats.join(", ")}`
    )
  );
  console.log(chalk.green(`✔ Converting to: ${targetFormat}`));
  console.log(chalk.green(`✔ Found ${entries.length} entries`));

  // Create backup if requested (default: true)
  if (options.backup !== false) {
    const backupPath = await createBackup(logPath);
    console.log(chalk.green(`✔ Created backup: ${backupPath}`));
  }

  // Convert entries
  const convertedEntries = entries.map((entry) =>
    convertEntry(entry, targetFormat)
  );

  // Reconstruct file
  const header = content.split("\n").slice(0, 10).join("\n"); // Keep header
  const newContent =
    header + "\n\n" + convertedEntries.join("\n\n---\n\n") + "\n";

  // Calculate token savings
  const tokenStats = calculateTokenSavings(content, newContent);

  // Write converted content
  await fs.writeFile(logPath, newContent, "utf8");

  console.log(chalk.green(`✔ Converted ${entries.length} entries`));

  console.log(chalk.bold.green("\n✅ Conversion completed successfully!\n"));

  // Show token savings
  console.log(chalk.bold("Token Savings:"));
  console.log(`   Before: ${chalk.cyan(tokenStats.before)} tokens`);
  console.log(`   After: ${chalk.cyan(tokenStats.after)} tokens`);
  console.log(
    `   Savings: ${chalk.green(tokenStats.savings)} tokens (${chalk.green(
      tokenStats.percentage + "%"
    )} reduction!)`
  );

  if (tokenStats.percentage >= 80) {
    console.log(
      chalk.bold.green(
        `\n🚀 Impact: Can keep ${Math.round(
          100 / (100 - tokenStats.percentage)
        )}x more history in context!\n`
      )
    );
  } else if (tokenStats.percentage >= 40) {
    console.log(
      chalk.bold.green(
        `\n🎯 Impact: Can keep ${Math.round(
          100 / (100 - tokenStats.percentage)
        )}x more history in context!\n`
      )
    );
  }

  // Next steps
  console.log(chalk.bold("💡 Next steps:"));
  console.log("   1. Review the converted log");
  console.log("   2. Run 'npx aic tokens' to see updated token usage");
  if (options.backup !== false) {
    console.log(
      "   3. If satisfied, delete backup: rm .ai/conversation-log.md.backup"
    );
  }
  console.log();
}

module.exports = {
  handleConvertCommand,
  detectEntryFormat,
  splitIntoEntries,
  convertEntry,
  createBackup,
  calculateTokenSavings,
};
