const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");

/**
 * Summarize conversation log entries
 */
async function summarizeConversations(options = {}) {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, ".ai");
  const conversationLogPath = path.join(aiDir, "conversation-log.md");

  console.log(chalk.bold.cyan("\n📝 Summarizing Conversation Log\n"));

  // Check if .ai directory exists
  if (!(await fs.pathExists(aiDir))) {
    console.log(chalk.red('❌ No .ai/ directory found. Run "init" first.\n'));
    process.exit(1);
  }

  // Check if conversation log exists
  if (!(await fs.pathExists(conversationLogPath))) {
    console.log(
      chalk.yellow("⚠️  No conversation-log.md found. Nothing to summarize.\n")
    );
    return;
  }

  const spinner = ora("Reading conversation log...").start();

  try {
    // Read conversation log
    const content = await fs.readFile(conversationLogPath, "utf-8");

    // Parse chat entries
    const chatEntries = [];
    const lines = content.split("\n");
    let currentEntry = null;
    let inChatHistory = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes("## 📋 CHAT HISTORY")) {
        inChatHistory = true;
        continue;
      }

      if (inChatHistory && line.match(/^## Chat #(\d+)/)) {
        if (currentEntry) {
          chatEntries.push(currentEntry);
        }
        currentEntry = {
          number: parseInt(line.match(/^## Chat #(\d+)/)[1]),
          header: line,
          content: [],
        };
      } else if (
        currentEntry &&
        line.trim() !== "" &&
        !line.match(/^## /) &&
        !line.match(/^---$/)
      ) {
        currentEntry.content.push(line);
      } else if (
        currentEntry &&
        line.match(/^## /) &&
        !line.match(/^## Chat #/)
      ) {
        chatEntries.push(currentEntry);
        currentEntry = null;
      }
    }

    if (currentEntry) {
      chatEntries.push(currentEntry);
    }

    spinner.succeed(`Found ${chatEntries.length} chat entries`);

    if (chatEntries.length === 0) {
      console.log(chalk.yellow("⚠️  No chat entries found to summarize.\n"));
      return;
    }

    // Determine how many to keep detailed
    const keepDetailed = options.keep || 10;

    if (chatEntries.length <= keepDetailed) {
      console.log(
        chalk.yellow(
          `⚠️  Only ${chatEntries.length} entries found. All will remain detailed (threshold: ${keepDetailed}).\n`
        )
      );
      return;
    }

    const toSummarize = chatEntries.slice(0, chatEntries.length - keepDetailed);
    const toKeepDetailed = chatEntries.slice(chatEntries.length - keepDetailed);

    console.log(
      chalk.gray(
        `   Summarizing: ${toSummarize.length} entries (Chat #${
          toSummarize[0].number
        } - #${toSummarize[toSummarize.length - 1].number})`
      )
    );
    console.log(
      chalk.gray(
        `   Keeping detailed: ${toKeepDetailed.length} most recent entries\n`
      )
    );

    spinner.start("Creating summary...");

    // Create summary of old entries - OPTIMIZED FOR AI PARSING
    const summaryLines = [
      "## 📋 Summary of Earlier Chats (AI-Optimized Format)",
      "",
      `> Range: Chat #${toSummarize[0].number} - #${
        toSummarize[toSummarize.length - 1].number
      }`,
      `> Format: CHAT_NUM|DATE|TYPE|TOPIC|WHAT|WHY|OUTCOME`,
      `> Types: FEAT=feature, FIX=bugfix, REFACTOR=refactor, DOCS=documentation, RELEASE=version`,
      `> Purpose: Structured data for AI parsing - optimized for token efficiency`,
      "",
      "```",
    ];

    // Extract key information - STRUCTURED FOR AI PARSING
    toSummarize.forEach((entry) => {
      const whatWeDid = [];
      const keyDecisions = [];
      const problems = [];
      let inWhatWeDid = false;
      let inKeyDecisions = false;
      let inProblems = false;

      entry.content.forEach((line) => {
        if (line.includes("### What We Did")) {
          inWhatWeDid = true;
          inKeyDecisions = false;
          inProblems = false;
        } else if (line.includes("### Key Decisions")) {
          inWhatWeDid = false;
          inKeyDecisions = true;
          inProblems = false;
        } else if (
          line.includes("### Problems Solved") ||
          line.includes("### Issues")
        ) {
          inWhatWeDid = false;
          inKeyDecisions = false;
          inProblems = true;
        } else if (line.includes("###")) {
          inWhatWeDid = false;
          inKeyDecisions = false;
          inProblems = false;
        } else if (inWhatWeDid && line.trim().startsWith("-")) {
          whatWeDid.push(line.trim().replace(/^- /, ""));
        } else if (inKeyDecisions && line.trim().startsWith("-")) {
          keyDecisions.push(line.trim().replace(/^- /, ""));
        } else if (inProblems && line.trim().startsWith("-")) {
          problems.push(line.trim().replace(/^- /, ""));
        }
      });

      // Extract structured data
      const chatNum = entry.header.match(/Chat #(\d+)/)?.[1] || "?";
      const dateMatch = entry.header.match(/\[Date: ([\d-]+)\]/);
      const date = dateMatch ? dateMatch[1] : "unknown";

      // Extract topic (after last dash, remove @handle)
      const topicMatch = entry.header.match(/- ([^-]+)$/);
      let topic = topicMatch ? topicMatch[1].trim() : "work";
      // Remove @handle if present
      topic = topic.replace(/@\w+\s*-\s*/, "");

      // Determine type from topic
      let type = "WORK";
      if (topic.match(/v\d+\.\d+\.\d+/)) type = "RELEASE";
      else if (topic.match(/feat|feature|add/i)) type = "FEAT";
      else if (topic.match(/fix|bug/i)) type = "FIX";
      else if (topic.match(/refactor|improve/i)) type = "REFACTOR";
      else if (topic.match(/doc/i)) type = "DOCS";

      // Extract WHAT (most important action)
      let what = "";
      if (keyDecisions.length > 0) {
        what = keyDecisions[0];
      } else if (problems.length > 0) {
        what = problems[0];
      } else if (whatWeDid.length > 0) {
        what = whatWeDid.reduce((a, b) => (a.length > b.length ? a : b));
      }

      // Extract WHY (rationale from decisions)
      let why = "";
      if (keyDecisions.length > 0) {
        const rationaleMatch = keyDecisions[0].match(
          /[Rr]ationale:(.+?)(?:\n|$)/
        );
        if (rationaleMatch) {
          why = rationaleMatch[1].trim();
        } else {
          // Try to extract from parentheses
          const parenMatch = what.match(/\((.+?)\)/);
          if (parenMatch) {
            why = parenMatch[1];
            what = what.replace(/\s*\(.+?\)/, ""); // Remove from what
          }
        }
      }

      // Extract OUTCOME (result/impact)
      let outcome = "";
      if (problems.length > 0) {
        outcome = "RESOLVED";
      } else if (type === "RELEASE") {
        outcome = "SHIPPED";
      } else if (keyDecisions.length > 0) {
        outcome = "DECIDED";
      }

      // Escape pipe characters in content
      topic = topic.replace(/\|/g, "¦");
      what = what.replace(/\|/g, "¦");
      why = why.replace(/\|/g, "¦");

      // Truncate long strings for efficiency (but not mid-word)
      if (topic.length > 60) {
        topic = topic.substring(0, 60).trim();
      }
      if (what.length > 120) {
        what = what.substring(0, 120).trim();
      }
      if (why.length > 100) {
        why = why.substring(0, 100).trim();
      }

      // Format: CHAT_NUM|DATE|TYPE|TOPIC|WHAT|WHY|OUTCOME
      // Use | as delimiter for easy parsing
      summaryLines.push(
        `${chatNum}|${date}|${type}|${topic}|${what}|${why}|${outcome}`
      );
    });

    summaryLines.push("```");
    summaryLines.push("");
    summaryLines.push("---", "");

    spinner.succeed("Created summary");

    // Update conversation log
    spinner.start("Updating conversation-log.md...");

    const chatHistoryIndex = lines.findIndex((line) =>
      line.includes("## 📋 CHAT HISTORY")
    );
    const templateStartIndex = lines.findIndex((line) =>
      line.includes("## Template for New Entries")
    );

    const newContent = [
      ...lines.slice(0, chatHistoryIndex + 1),
      "",
      "---",
      "",
      ...summaryLines,
      ...toKeepDetailed.flatMap((entry) => [
        entry.header,
        ...entry.content,
        "",
        "---",
        "",
      ]),
      ...lines.slice(templateStartIndex),
    ].join("\n");

    await fs.writeFile(conversationLogPath, newContent);
    spinner.succeed("Updated conversation-log.md with summary");

    // Calculate token savings
    const originalWords = toSummarize.reduce(
      (sum, entry) => sum + entry.content.join(" ").split(/\s+/).length,
      0
    );
    const summaryWords = summaryLines.join(" ").split(/\s+/).length;
    const savedWords = originalWords - summaryWords;
    const savedTokens = Math.ceil(savedWords * 1.33);

    console.log(chalk.bold.green("\n✅ Summary completed successfully!\n"));
    console.log(chalk.bold("Summary:"));
    console.log(chalk.gray(`   Summarized: ${toSummarize.length} entries`));
    console.log(
      chalk.gray(`   Kept detailed: ${toKeepDetailed.length} recent entries`)
    );
    console.log(
      chalk.gray(
        `   Token savings: ~${savedTokens} tokens (${savedWords} words)`
      )
    );
    console.log();
    console.log(chalk.bold("💡 Next steps:"));
    console.log(chalk.gray("   1. Review the summarized log"));
    console.log(
      chalk.gray(
        '   2. Run "npx create-ai-chat-context tokens" to see updated token usage'
      )
    );
    console.log(chalk.gray("   3. Commit the changes to Git\n"));
  } catch (error) {
    spinner.fail("Failed to summarize conversations");
    throw error;
  }
}

module.exports = {
  summarizeConversations,
};
