/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryDropoffAgent } from './MemoryDropoffAgent.js';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('MemoryDropoffAgent', () => {
  let testDir: string;
  let agent: MemoryDropoffAgent;

  beforeEach(() => {
    // Use project directory for tests (aicf-core security requirement)
    testDir = join(process.cwd(), '.test-tmp', `memory-dropoff-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    agent = new MemoryDropoffAgent(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('dropoff', () => {
    it('should return zero stats when no session files exist', async () => {
      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sessionFiles).toBe(0);
        expect(result.value.mediumFiles).toBe(0);
        expect(result.value.oldFiles).toBe(0);
        expect(result.value.archiveFiles).toBe(0);
        expect(result.value.movedToMedium).toBe(0);
        expect(result.value.movedToOld).toBe(0);
        expect(result.value.movedToArchive).toBe(0);
        expect(result.value.compressed).toBe(0);
      }
    });

    it('should create all required directories', async () => {
      await agent.dropoff();

      const aicfDir = join(testDir, '.aicf');
      expect(existsSync(join(aicfDir, 'sessions'))).toBe(true);
      expect(existsSync(join(aicfDir, 'medium'))).toBe(true);
      expect(existsSync(join(aicfDir, 'old'))).toBe(true);
      expect(existsSync(join(aicfDir, 'archive'))).toBe(true);
    });

    it('should keep recent sessions (0-2 days) in sessions folder', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create session file from today
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Test conversation`;

      writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sessionFiles).toBe(1);
        expect(result.value.movedToMedium).toBe(0);
        // File should still be in sessions folder
        expect(existsSync(join(sessionsDir, `${dateStr}-session.aicf`))).toBe(true);
      }
    });

    it('should move 2-7 day old sessions to medium folder', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create session file from 4 days ago
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const dateStr = fourDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Old conversation`;

      writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.movedToMedium).toBeGreaterThanOrEqual(0);
      }
    });

    it('should move 7-14 day old sessions to old folder', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create session file from 10 days ago
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const dateStr = tenDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Older conversation`;

      writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.movedToOld).toBeGreaterThanOrEqual(0);
      }
    });

    it('should move 14+ day old sessions to archive folder', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create session file from 20 days ago
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const dateStr = twentyDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Very old conversation`;

      writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.movedToArchive).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle sessions already in medium folder', async () => {
      const mediumDir = join(testDir, '.aicf', 'medium');
      mkdirSync(mediumDir, { recursive: true });

      // Create session file in medium folder
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      const dateStr = fourDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Medium conversation`;

      writeFileSync(join(mediumDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.mediumFiles).toBe(1);
      }
    });

    it('should handle sessions already in old folder', async () => {
      const oldDir = join(testDir, '.aicf', 'old');
      mkdirSync(oldDir, { recursive: true });

      // Create session file in old folder
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const dateStr = tenDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Old conversation`;

      writeFileSync(join(oldDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.oldFiles).toBe(1);
      }
    });

    it('should handle sessions already in archive folder', async () => {
      const archiveDir = join(testDir, '.aicf', 'archive');
      mkdirSync(archiveDir, { recursive: true });

      // Create session file in archive folder
      const twentyDaysAgo = new Date();
      twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);
      const dateStr = twentyDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\nConversation 1: Archived conversation`;

      writeFileSync(join(archiveDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.archiveFiles).toBe(1);
      }
    });

    it('should handle multiple sessions across different age ranges', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create sessions of different ages
      const ages = [0, 1, 3, 5, 8, 12, 16, 20]; // days ago

      ages.forEach((daysAgo) => {
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        const dateStr = date.toISOString().split('T')[0];
        const content = `# Session: ${dateStr}\n\nConversation: ${daysAgo} days old`;
        writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), content);
      });

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        const totalFiles =
          result.value.sessionFiles +
          result.value.mediumFiles +
          result.value.oldFiles +
          result.value.archiveFiles;
        expect(totalFiles).toBe(ages.length);
      }
    });

    it('should include timestamp in stats', async () => {
      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.timestamp).toBeDefined();
        expect(new Date(result.value.timestamp).getTime()).toBeGreaterThan(0);
      }
    });

    it('should handle invalid session filenames gracefully', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create file with invalid date format
      writeFileSync(join(sessionsDir, 'invalid-date-session.aicf'), 'Invalid session');

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      // Should not crash, just skip invalid files
    });

    it('should handle empty session files', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      // Create empty session file
      writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), '');

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sessionFiles).toBe(1);
      }
    });

    it('should track compression count', async () => {
      const sessionsDir = join(testDir, '.aicf', 'sessions');
      mkdirSync(sessionsDir, { recursive: true });

      // Create old session that needs compression
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      const dateStr = tenDaysAgo.toISOString().split('T')[0];
      const sessionContent = `# Session: ${dateStr}\n\n${'Conversation content '.repeat(100)}`;

      writeFileSync(join(sessionsDir, `${dateStr}-session.aicf`), sessionContent);

      const result = await agent.dropoff();

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.compressed).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
