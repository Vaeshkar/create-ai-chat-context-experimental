/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Reprocess Conversations Script
 *
 * Reprocesses old conversations from LevelDB with fixed extractors (no truncation).
 * Replaces old truncated JSON files in .lill/raw/ with new full-content versions.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { AugmentLevelDBReader } from '../readers/AugmentLevelDBReader.js';
import { getTimeDifferenceMinutes } from '../utils/TimestampUtils.js';

interface ReprocessOptions {
  cwd?: string;
  verbose?: boolean;
  dryRun?: boolean;
  conversationId?: string; // Optional: reprocess specific conversation
}

interface ConversationFile {
  filename: string;
  path: string;
  conversationId: string;
  date: string;
  size: number;
}

export class ConversationReprocessor {
  private cwd: string;
  private dryRun: boolean;
  private reader: AugmentLevelDBReader;

  constructor(options: ReprocessOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.dryRun = options.dryRun || false;
    this.reader = new AugmentLevelDBReader(this.cwd);
  }

  /**
   * Reprocess all conversations in .lill/raw/
   */
  async reprocessAll(): Promise<void> {
    console.log(chalk.cyan('\n🔄 Reprocessing conversations from LevelDB...\n'));

    const rawDir = join(this.cwd, '.lill', 'raw');
    if (!existsSync(rawDir)) {
      console.log(chalk.red('❌ No .lill/raw/ directory found'));
      return;
    }

    // Get all conversation files
    const files = this.getConversationFiles(rawDir);
    console.log(chalk.gray(`   Found ${files.length} conversation files\n`));

    if (this.dryRun) {
      console.log(chalk.yellow('🔍 DRY RUN MODE - No files will be modified\n'));
    }

    let processed = 0;
    let skipped = 0;
    let errors = 0;

    for (const file of files) {
      try {
        const result = await this.reprocessConversation(file);
        if (result.success) {
          processed++;
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.log(
          chalk.red(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
        );
      }
    }

    console.log(chalk.cyan('\n📊 Reprocessing Summary:\n'));
    console.log(chalk.green(`   ✅ Processed: ${processed}`));
    console.log(chalk.yellow(`   ⏭️  Skipped: ${skipped}`));
    console.log(chalk.red(`   ❌ Errors: ${errors}`));
    console.log();
  }

  /**
   * Reprocess a single conversation
   */
  async reprocessConversation(
    file: ConversationFile
  ): Promise<{ success: boolean; reason?: string }> {
    console.log(chalk.cyan(`🔄 Processing: ${file.filename}`));
    console.log(chalk.gray(`   Conversation ID: ${file.conversationId}`));
    console.log(chalk.gray(`   Current size: ${(file.size / 1024).toFixed(1)}K`));

    // Read existing file to get metadata
    const existingData = JSON.parse(readFileSync(file.path, 'utf-8'));

    // Query LevelDB for this conversation
    const conversationResult = await this.reader.readConversation(file.conversationId);

    if (!conversationResult.ok) {
      console.log(chalk.yellow(`   ⏭️  Skipped: ${conversationResult.error.message}`));
      return { success: false, reason: conversationResult.error.message };
    }

    const conversation = conversationResult.value;

    if (!conversation.messages || conversation.messages.length === 0) {
      console.log(chalk.yellow(`   ⏭️  Skipped: No messages in LevelDB`));
      return { success: false, reason: 'No messages' };
    }

    console.log(chalk.gray(`   Messages in LevelDB: ${conversation.messages.length}`));

    // Filter messages by date (only messages from this specific date)
    const targetDate = file.date; // e.g., "2025-11-04"
    const startOfDay = new Date(`${targetDate}T00:00:00.000Z`).getTime();
    const endOfDay = new Date(`${targetDate}T23:59:59.999Z`).getTime();

    const messagesForDate = conversation.messages.filter((msg) => {
      const msgTime = new Date(msg.timestamp).getTime();
      return msgTime >= startOfDay && msgTime <= endOfDay;
    });

    console.log(chalk.gray(`   Messages for ${targetDate}: ${messagesForDate.length}`));

    if (messagesForDate.length === 0) {
      console.log(chalk.yellow(`   ⏭️  Skipped: No messages for this date`));
      return { success: false, reason: 'No messages for this date' };
    }

    // Note: We're just replacing the messages with full content
    // The watcher will re-extract decisions and insights when it processes this file
    console.log(chalk.gray(`   Replacing with full message content (no truncation)`));

    // Format as conversation JSON (same format as existing files)
    const conversationData = {
      metadata: {
        conversationId: conversation.conversationId,
        date:
          existingData.metadata.date ||
          new Date(conversation.timestamp).toISOString().split('T')[0],
        platform: 'augment-leveldb',
        user: existingData.metadata.user || 'dennis_van_leeuwen',
        status: 'completed',
        timestamp_start: messagesForDate[0]?.timestamp || conversation.timestamp,
        timestamp_end:
          messagesForDate[messagesForDate.length - 1]?.timestamp || conversation.lastModified,
        duration_minutes: getTimeDifferenceMinutes(
          messagesForDate[0]?.timestamp || conversation.timestamp,
          messagesForDate[messagesForDate.length - 1]?.timestamp || conversation.lastModified
        ),
        message_count: messagesForDate.length,
        reprocessed: true,
        reprocessed_at: new Date().toISOString(),
      },
      decisions: existingData.decisions || [],
      insights: existingData.insights || [],
      key_exchanges: messagesForDate.map((msg) => ({
        timestamp: msg.timestamp,
        role: msg.role,
        content: msg.content, // Full content, no truncation!
      })),
    };

    const newSize = JSON.stringify(conversationData, null, 2).length;
    console.log(chalk.gray(`   New size: ${(newSize / 1024).toFixed(1)}K`));

    const sizeDiff = newSize - file.size;
    const sizeChange =
      sizeDiff > 0
        ? chalk.green(`+${(sizeDiff / 1024).toFixed(1)}K`)
        : chalk.red(`${(sizeDiff / 1024).toFixed(1)}K`);
    console.log(chalk.gray(`   Size change: ${sizeChange}`));

    if (this.dryRun) {
      console.log(chalk.yellow(`   🔍 DRY RUN: Would replace ${file.filename}`));
      console.log();
      return { success: true };
    }

    // Backup old file
    const backupPath = file.path.replace('.json', '.backup.json');
    renameSync(file.path, backupPath);
    console.log(chalk.gray(`   💾 Backed up to: ${backupPath.split('/').pop()}`));

    // Write new file
    writeFileSync(file.path, JSON.stringify(conversationData, null, 2), 'utf-8');
    console.log(chalk.green(`   ✅ Replaced with full content`));
    console.log();

    return { success: true };
  }

  /**
   * Get all conversation files in .lill/raw/
   */
  private getConversationFiles(rawDir: string): ConversationFile[] {
    const files: ConversationFile[] = [];

    const allFiles = readdirSync(rawDir).filter(
      (f) => f.endsWith('.json') && !f.endsWith('.backup.json')
    );

    for (const filename of allFiles) {
      const path = join(rawDir, filename);
      const size = existsSync(path) ? readFileSync(path, 'utf-8').length : 0;

      // Extract conversation ID from filename
      // Format: 2025-11-04_89ac87f4-ddb1-4048-975f-07ab0f5e0391.json
      const match = filename.match(/(\d{4}-\d{2}-\d{2})_([a-f0-9-]+)\.json/);

      if (match && match[1] && match[2]) {
        files.push({
          filename,
          path,
          conversationId: match[2],
          date: match[1],
          size,
        });
      }
    }

    return files;
  }
}

/**
 * CLI entry point
 */
export async function reprocessConversations(options: ReprocessOptions = {}): Promise<void> {
  const reprocessor = new ConversationReprocessor(options);
  await reprocessor.reprocessAll();
}
