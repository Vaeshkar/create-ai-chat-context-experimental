/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

export interface ChatEntry {
  number: number;
  startLine: number;
  content: string[];
}

export interface ArchiveOptions {
  keep?: number;
}

/**
 * Archive old conversation logs
 */
export async function archiveConversations(options: ArchiveOptions = {}): Promise<void> {
  const cwd = process.cwd();
  const aiDir = path.join(cwd, '.ai');
  const archiveDir = path.join(aiDir, 'archive');
  const conversationLogPath = path.join(aiDir, 'conversation-log.md');

  console.log(chalk.bold.cyan('\n📦 Archiving Conversation Logs\n'));

  // Check if .ai directory exists
  if (!(await fs.pathExists(aiDir))) {
    console.log(chalk.red('❌ No .ai/ directory found. Run "init" first.\n'));
    process.exit(1);
  }

  // Check if conversation log exists
  if (!(await fs.pathExists(conversationLogPath))) {
    console.log(chalk.yellow('⚠️  No conversation-log.md found. Nothing to archive.\n'));
    return;
  }

  const spinner = ora('Reading conversation log...').start();

  try {
    // Read conversation log
    const content = await fs.readFile(conversationLogPath, 'utf-8');

    // Parse chat entries (look for ## Chat #X patterns)
    const chatEntries: ChatEntry[] = [];
    const lines = content.split('\n');
    let currentEntry: ChatEntry | null = null;
    let inChatHistory = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || typeof line !== 'string') continue;

      const lineStr: string = line;

      // Check if we're in the chat history section
      if (lineStr.includes('## 📋 CHAT HISTORY')) {
        inChatHistory = true;
        continue;
      }

      // Look for chat entries
      const chatMatch = lineStr.match(/^## Chat #(\d+)/);
      if (inChatHistory && chatMatch && chatMatch[1]) {
        if (currentEntry) {
          chatEntries.push(currentEntry);
        }
        currentEntry = {
          number: parseInt(chatMatch[1]),
          startLine: i,
          content: [lineStr],
        };
      } else if (currentEntry) {
        currentEntry.content.push(lineStr);

        // Check if next line starts a new chat or section
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          if (nextLine && nextLine.match(/^## /) && !nextLine.match(/^## Chat #/)) {
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
      console.log(
        chalk.yellow(
          `⚠️  Only ${chatEntries.length} entries found. Keeping all (threshold: ${keepCount}).\n`
        )
      );
      return;
    }

    const toArchive = chatEntries.slice(0, chatEntries.length - keepCount);
    const toKeep = chatEntries.slice(chatEntries.length - keepCount);

    const firstEntry = toArchive[0];
    const lastEntry = toArchive[toArchive.length - 1];

    if (!firstEntry || !lastEntry) {
      spinner.fail('No entries to archive');
      return;
    }

    console.log(
      chalk.gray(
        `   Archiving: ${toArchive.length} entries (Chat #${firstEntry.number} - #${lastEntry.number})`
      )
    );
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
      `> Entries: Chat #${firstEntry.number} - #${lastEntry.number}`,
      '',
      '---',
      '',
      ...toArchive.flatMap((entry) => entry.content),
    ].join('\n');

    await fs.writeFile(archiveFilePath, archiveContent);
    spinner.succeed(`Created archive: ${chalk.cyan(archiveFileName)}`);

    // Update conversation log with only recent entries
    spinner.start('Updating conversation-log.md...');

    // Find the template section and header
    const templateStartIndex = lines.findIndex((line) =>
      line.includes('## Template for New Entries')
    );
    const chatHistoryIndex = lines.findIndex((line) => line.includes('## 📋 CHAT HISTORY'));

    const newContent = [
      ...lines.slice(0, chatHistoryIndex + 1),
      '',
      '---',
      '',
      ...toKeep.flatMap((entry) => entry.content),
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
    console.log(
      chalk.gray(`   Archived: ${toArchive.length} entries → .ai/archive/${archiveFileName}`)
    );
    console.log(chalk.gray(`   Kept: ${toKeep.length} recent entries in conversation-log.md`));
    console.log();
    console.log(chalk.bold('💡 Next steps:'));
    console.log(chalk.gray('   1. Review the archive file if needed'));
    console.log(
      chalk.gray('   2. Run "npx create-ai-chat-context tokens" to see updated token usage')
    );
    console.log(chalk.gray('   3. Commit the changes to Git\n'));
  } catch (error) {
    spinner.fail('Failed to archive conversations');
    throw error;
  }
}
