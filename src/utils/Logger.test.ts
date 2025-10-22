/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { getNextChatNumber, formatDate, buildLogEntry, appendToConversationLog } from './Logger';

const TEST_DIR = path.join(process.cwd(), '.test-logger');

describe('Logger', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('getNextChatNumber', () => {
    it('should return 1 when no log exists', async () => {
      const num = await getNextChatNumber(TEST_DIR);
      expect(num).toBe(1);
    });

    it('should return 1 when log exists but has no chats', async () => {
      const logPath = path.join(TEST_DIR, '.ai', 'conversation-log.md');
      await fs.ensureDir(path.dirname(logPath));
      await fs.writeFile(logPath, '# Conversation Log\n\nNo chats yet.');

      const num = await getNextChatNumber(TEST_DIR);
      expect(num).toBe(1);
    });

    it('should return next number after existing chats', async () => {
      const logPath = path.join(TEST_DIR, '.ai', 'conversation-log.md');
      await fs.ensureDir(path.dirname(logPath));
      const content = `## Chat #1\n\n**Date:** 2024-01-01\n\n## Chat #2\n\n**Date:** 2024-01-02\n\n`;
      await fs.writeFile(logPath, content);

      const num = await getNextChatNumber(TEST_DIR);
      expect(num).toBe(3);
    });

    it('should find highest chat number when not sequential', async () => {
      const logPath = path.join(TEST_DIR, '.ai', 'conversation-log.md');
      await fs.ensureDir(path.dirname(logPath));
      const content = `## Chat #1\n\n## Chat #5\n\n## Chat #3\n\n`;
      await fs.writeFile(logPath, content);

      const num = await getNextChatNumber(TEST_DIR);
      expect(num).toBe(6);
    });
  });

  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024-01-15');
    });

    it('should pad month and day with zeros', () => {
      const date = new Date('2024-01-05');
      const formatted = formatDate(date);
      expect(formatted).toBe('2024-01-05');
    });

    it('should use current date when not provided', () => {
      const formatted = formatDate();
      const today = new Date();
      const expected = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(formatted).toBe(expected);
    });
  });

  describe('buildLogEntry', () => {
    it('should build entry with accomplishments only', () => {
      const entry = buildLogEntry(1, '2024-01-01', ['- Task 1', '- Task 2'], [], []);

      expect(entry).toContain('## Chat #1');
      expect(entry).toContain('**Date:** 2024-01-01');
      expect(entry).toContain('### What We Did');
      expect(entry).toContain('- Task 1');
      expect(entry).toContain('- Task 2');
      expect(entry).not.toContain('### Key Decisions');
      expect(entry).not.toContain('### Next Steps');
    });

    it('should include decisions when provided', () => {
      const entry = buildLogEntry(1, '2024-01-01', ['- Task 1'], ['- Decision 1'], []);

      expect(entry).toContain('### Key Decisions');
      expect(entry).toContain('- Decision 1');
    });

    it('should include next steps when provided', () => {
      const entry = buildLogEntry(1, '2024-01-01', ['- Task 1'], [], ['- Step 1']);

      expect(entry).toContain('### Next Steps');
      expect(entry).toContain('- Step 1');
    });

    it('should end with separator', () => {
      const entry = buildLogEntry(1, '2024-01-01', ['- Task 1'], [], []);
      expect(entry).toContain('---');
    });
  });

  describe('appendToConversationLog', () => {
    it('should create new log file if it does not exist', async () => {
      const logPath = path.join(TEST_DIR, 'conversation-log.md');
      const entry = '## Chat #1\n\nTest entry\n\n---\n\n';

      await appendToConversationLog(logPath, entry);

      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toBe(entry);
    });

    it('should append to existing log', async () => {
      const logPath = path.join(TEST_DIR, 'conversation-log.md');
      const existing = '## Chat #1\n\nFirst entry\n\n---\n\n';
      const newEntry = '## Chat #2\n\nSecond entry\n\n---\n\n';

      await fs.writeFile(logPath, existing);
      await appendToConversationLog(logPath, newEntry);

      const content = await fs.readFile(logPath, 'utf-8');
      expect(content).toContain('First entry');
      expect(content).toContain('Second entry');
    });

    it('should insert before reminder section if it exists', async () => {
      const logPath = path.join(TEST_DIR, 'conversation-log.md');
      const existing =
        '## Chat #1\n\nFirst\n\n---\n\n## 📝 Reminder for AI Assistants\n\nReminder text';
      const newEntry = '## Chat #2\n\nSecond\n\n---\n\n';

      await fs.writeFile(logPath, existing);
      await appendToConversationLog(logPath, newEntry);

      const content = await fs.readFile(logPath, 'utf-8');
      const reminderIndex = content.indexOf('## 📝 Reminder for AI Assistants');
      const newEntryIndex = content.indexOf('## Chat #2');

      expect(newEntryIndex).toBeLessThan(reminderIndex);
    });
  });
});
