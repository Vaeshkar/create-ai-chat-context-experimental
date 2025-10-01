const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');

/**
 * Archive old conversation logs
 */
async function archiveConversations(options = {}) {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, '.ai');
  const archiveDir = path.join(aiDir, 'archive');
  const conversationLogPath = path.join(aiDir, 'conversation-log.md');

  console.log(chalk.bold.cyan('\n📦 Archiving Conversation Logs\n'));

  // Check if .ai directory exists
  if (!await fs.pathExists(aiDir)) {
    console.log(chalk.red('❌ No .ai/ directory found. Run "init" first.\n'));
    process.exit(1);
  }

  // Check if conversation log exists
  if (!await fs.pathExists(conversationLogPath)) {
    console.log(chalk.yellow('⚠️  No conversation-log.md found. Nothing to archive.\n'));
    return;
  }

  const spinner = ora('Reading conversation log...').start();

  try {
    // Read conversation log
    const content = await fs.readFile(conversationLogPath, 'utf-8');
    
    // Parse chat entries (look for ## Chat #X patterns)
    const chatEntries = [];
    const lines = content.split('\n');
    let currentEntry = null;
    let inChatHistory = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're in the chat history section
      if (line.includes('## 📋 CHAT HISTORY')) {
        inChatHistory = true;
        continue;
      }

      // Look for chat entries
      if (inChatHistory && line.match(/^## Chat #(\d+)/)) {
        if (currentEntry) {
          chatEntries.push(currentEntry);
        }
        currentEntry = {
          number: parseInt(line.match(/^## Chat #(\d+)/)[1]),
          startLine: i,
          content: [line],
        };
      } else if (currentEntry) {
        currentEntry.content.push(line);
        
        // Check if next line starts a new chat or section
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine.match(/^## /) && !nextLine.match(/^## Chat #/)) {
            // End of chat entries
            chatEntries.push(currentEntry);
            currentEntry = null;
          }
        }
      }
    }

    // Add last entry if exists
    if (currentEntry) {
      chatEntries.push(currentEntry);
    }

    spinner.succeed(`Found ${chatEntries.length} chat entries`);

    if (chatEntries.length === 0) {
      console.log(chalk.yellow('⚠️  No chat entries found to archive.\n'));
      return;
    }

    // Determine how many to keep
    const keepCount = options.keep || 10;
    
    if (chatEntries.length <= keepCount) {
      console.log(chalk.yellow(`⚠️  Only ${chatEntries.length} entries found. Keeping all (threshold: ${keepCount}).\n`));
      return;
    }

    const toArchive = chatEntries.slice(0, chatEntries.length - keepCount);
    const toKeep = chatEntries.slice(chatEntries.length - keepCount);

    console.log(chalk.gray(`   Archiving: ${toArchive.length} entries (Chat #${toArchive[0].number} - #${toArchive[toArchive.length - 1].number})`));
    console.log(chalk.gray(`   Keeping: ${toKeep.length} most recent entries\n`));

    // Create archive directory
    await fs.ensureDir(archiveDir);

    // Generate archive filename with date range
    const today = new Date().toISOString().split('T')[0];
    const archiveFileName = `conversation-log-archive-${today}.md`;
    const archiveFilePath = path.join(archiveDir, archiveFileName);

    spinner.start('Creating archive file...');

    // Create archive content
    const archiveContent = [
      '# Conversation Log Archive',
      '',
      `> Archived on: ${today}`,
      `> Entries: Chat #${toArchive[0].number} - #${toArchive[toArchive.length - 1].number}`,
      '',
      '---',
      '',
      ...toArchive.flatMap(entry => entry.content),
    ].join('\n');

    await fs.writeFile(archiveFilePath, archiveContent);
    spinner.succeed(`Created archive: ${chalk.cyan(archiveFileName)}`);

    // Update conversation log with only recent entries
    spinner.start('Updating conversation-log.md...');

    // Find the template section and header
    const templateStartIndex = lines.findIndex(line => line.includes('## Template for New Entries'));
    const chatHistoryIndex = lines.findIndex(line => line.includes('## 📋 CHAT HISTORY'));
    
    const newContent = [
      ...lines.slice(0, chatHistoryIndex + 1),
      '',
      '---',
      '',
      ...toKeep.flatMap(entry => entry.content),
      '',
      '---',
      '',
      ...lines.slice(templateStartIndex),
    ].join('\n');

    await fs.writeFile(conversationLogPath, newContent);
    spinner.succeed('Updated conversation-log.md with recent entries');

    // Summary
    console.log(chalk.bold.green('\n✅ Archive completed successfully!\n'));
    console.log(chalk.bold('Summary:'));
    console.log(chalk.gray(`   Archived: ${toArchive.length} entries → .ai/archive/${archiveFileName}`));
    console.log(chalk.gray(`   Kept: ${toKeep.length} recent entries in conversation-log.md`));
    console.log();
    console.log(chalk.bold('💡 Next steps:'));
    console.log(chalk.gray('   1. Review the archive file if needed'));
    console.log(chalk.gray('   2. Run "npx create-ai-chat-context tokens" to see updated token usage'));
    console.log(chalk.gray('   3. Commit the changes to Git\n'));

  } catch (error) {
    spinner.fail('Failed to archive conversations');
    throw error;
  }
}

module.exports = {
  archiveConversations,
};

