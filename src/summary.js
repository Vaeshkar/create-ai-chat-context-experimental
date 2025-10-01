const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Summarize conversation log entries
 */
async function summarizeConversations(options = {}) {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, '.ai');
  const conversationLogPath = path.join(aiDir, 'conversation-log.md');

  console.log(chalk.bold.cyan('\n📝 Summarizing Conversation Log\n'));

  // Check if .ai directory exists
  if (!await fs.pathExists(aiDir)) {
    console.log(chalk.red('❌ No .ai/ directory found. Run "init" first.\n'));
    process.exit(1);
  }

  // Check if conversation log exists
  if (!await fs.pathExists(conversationLogPath)) {
    console.log(chalk.yellow('⚠️  No conversation-log.md found. Nothing to summarize.\n'));
    return;
  }

  const spinner = ora('Reading conversation log...').start();

  try {
    // Read conversation log
    const content = await fs.readFile(conversationLogPath, 'utf-8');
    
    // Parse chat entries
    const chatEntries = [];
    const lines = content.split('\n');
    let currentEntry = null;
    let inChatHistory = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('## 📋 CHAT HISTORY')) {
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
      } else if (currentEntry && line.trim() !== '' && !line.match(/^## /) && !line.match(/^---$/)) {
        currentEntry.content.push(line);
      } else if (currentEntry && line.match(/^## /) && !line.match(/^## Chat #/)) {
        chatEntries.push(currentEntry);
        currentEntry = null;
      }
    }

    if (currentEntry) {
      chatEntries.push(currentEntry);
    }

    spinner.succeed(`Found ${chatEntries.length} chat entries`);

    if (chatEntries.length === 0) {
      console.log(chalk.yellow('⚠️  No chat entries found to summarize.\n'));
      return;
    }

    // Determine how many to keep detailed
    const keepDetailed = options.keep || 10;
    
    if (chatEntries.length <= keepDetailed) {
      console.log(chalk.yellow(`⚠️  Only ${chatEntries.length} entries found. All will remain detailed (threshold: ${keepDetailed}).\n`));
      return;
    }

    const toSummarize = chatEntries.slice(0, chatEntries.length - keepDetailed);
    const toKeepDetailed = chatEntries.slice(chatEntries.length - keepDetailed);

    console.log(chalk.gray(`   Summarizing: ${toSummarize.length} entries (Chat #${toSummarize[0].number} - #${toSummarize[toSummarize.length - 1].number})`));
    console.log(chalk.gray(`   Keeping detailed: ${toKeepDetailed.length} most recent entries\n`));

    spinner.start('Creating summary...');

    // Create summary of old entries
    const summaryLines = [
      '## 📋 Summary of Earlier Chats',
      '',
      `> Chats #${toSummarize[0].number} - #${toSummarize[toSummarize.length - 1].number} (summarized for token efficiency)`,
      '',
    ];

    // Extract key information from each entry
    toSummarize.forEach(entry => {
      const whatWeDid = [];
      const keyDecisions = [];
      let inWhatWeDid = false;
      let inKeyDecisions = false;

      entry.content.forEach(line => {
        if (line.includes('### What We Did')) {
          inWhatWeDid = true;
          inKeyDecisions = false;
        } else if (line.includes('### Key Decisions')) {
          inWhatWeDid = false;
          inKeyDecisions = true;
        } else if (line.includes('###')) {
          inWhatWeDid = false;
          inKeyDecisions = false;
        } else if (inWhatWeDid && line.trim().startsWith('-')) {
          whatWeDid.push(line.trim());
        } else if (inKeyDecisions && line.trim().startsWith('-')) {
          keyDecisions.push(line.trim());
        }
      });

      if (whatWeDid.length > 0 || keyDecisions.length > 0) {
        summaryLines.push(`**${entry.header.replace('## ', '')}:**`);
        if (whatWeDid.length > 0) {
          summaryLines.push(...whatWeDid.slice(0, 2)); // Keep top 2 items
        }
        if (keyDecisions.length > 0) {
          summaryLines.push(...keyDecisions.slice(0, 1)); // Keep top 1 decision
        }
        summaryLines.push('');
      }
    });

    summaryLines.push('---', '');

    spinner.succeed('Created summary');

    // Update conversation log
    spinner.start('Updating conversation-log.md...');

    const chatHistoryIndex = lines.findIndex(line => line.includes('## 📋 CHAT HISTORY'));
    const templateStartIndex = lines.findIndex(line => line.includes('## Template for New Entries'));

    const newContent = [
      ...lines.slice(0, chatHistoryIndex + 1),
      '',
      '---',
      '',
      ...summaryLines,
      ...toKeepDetailed.flatMap(entry => [
        entry.header,
        ...entry.content,
        '',
        '---',
        '',
      ]),
      ...lines.slice(templateStartIndex),
    ].join('\n');

    await fs.writeFile(conversationLogPath, newContent);
    spinner.succeed('Updated conversation-log.md with summary');

    // Calculate token savings
    const originalWords = toSummarize.reduce((sum, entry) => sum + entry.content.join(' ').split(/\s+/).length, 0);
    const summaryWords = summaryLines.join(' ').split(/\s+/).length;
    const savedWords = originalWords - summaryWords;
    const savedTokens = Math.ceil(savedWords * 1.33);

    console.log(chalk.bold.green('\n✅ Summary completed successfully!\n'));
    console.log(chalk.bold('Summary:'));
    console.log(chalk.gray(`   Summarized: ${toSummarize.length} entries`));
    console.log(chalk.gray(`   Kept detailed: ${toKeepDetailed.length} recent entries`));
    console.log(chalk.gray(`   Token savings: ~${savedTokens} tokens (${savedWords} words)`));
    console.log();
    console.log(chalk.bold('💡 Next steps:'));
    console.log(chalk.gray('   1. Review the summarized log'));
    console.log(chalk.gray('   2. Run "npx create-ai-chat-context tokens" to see updated token usage'));
    console.log(chalk.gray('   3. Commit the changes to Git\n'));

  } catch (error) {
    spinner.fail('Failed to summarize conversations');
    throw error;
  }
}

module.exports = {
  summarizeConversations,
};

