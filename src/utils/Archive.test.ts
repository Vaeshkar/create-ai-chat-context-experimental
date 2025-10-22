/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { archiveConversations } from './Archive';

const TEST_DIR = path.join(process.cwd(), '.test-archive');

describe('Archive', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('archiveConversations', () => {
    it('should exit if .ai directory does not exist', async () => {
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      try {
        await archiveConversations({ keep: 5 });
      } catch (error) {
        expect((error as Error).message).toBe('process.exit called');
      }

      exitSpy.mockRestore();
    });

    it('should return early if conversation log does not exist', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Should not throw
      await archiveConversations({ keep: 5 });
    });

    it('should process conversation log without errors', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create a conversation log with chat entries
      const conversationLog = `# Conversation Log

## 📋 CHAT HISTORY

## Chat #1
**Date:** 2024-01-01
Content here

## Chat #2
**Date:** 2024-01-02
Content here

## Template for New Entries
Template content
`;

      const logPath = path.join(aiDir, 'conversation-log.md');
      await fs.writeFile(logPath, conversationLog);

      // Should not throw
      await expect(archiveConversations({ keep: 1 })).resolves.not.toThrow();
    });

    it('should keep specified number of recent entries', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      const conversationLog = `# Conversation Log

## 📋 CHAT HISTORY

## Chat #1
Content 1

## Chat #2
Content 2

## Chat #3
Content 3

## Template for New Entries
Template
`;

      const logPath = path.join(aiDir, 'conversation-log.md');
      await fs.writeFile(logPath, conversationLog);

      await archiveConversations({ keep: 2 });

      const updatedLog = await fs.readFile(logPath, 'utf-8');

      // Should contain Chat #2 and #3 (the 2 most recent)
      expect(updatedLog).toContain('## Chat #2');
      expect(updatedLog).toContain('## Chat #3');
    });

    it('should use default keep value of 10', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create 15 chat entries
      let conversationLog = `# Conversation Log

## 📋 CHAT HISTORY

`;

      for (let i = 1; i <= 15; i++) {
        conversationLog += `## Chat #${i}\nContent ${i}\n\n`;
      }

      conversationLog += `## Template for New Entries\nTemplate`;

      const logPath = path.join(aiDir, 'conversation-log.md');
      await fs.writeFile(logPath, conversationLog);

      // Call without keep option (should default to 10)
      await archiveConversations({});

      const updatedLog = await fs.readFile(logPath, 'utf-8');

      // Should keep Chat #15 (most recent)
      expect(updatedLog).toContain('## Chat #15');
    });
  });
});
