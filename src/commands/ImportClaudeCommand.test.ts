/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Import Claude Command Tests
 * Phase 5.4: Import Command Implementation - October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { ImportClaudeCommand } from './ImportClaudeCommand.js';

describe('ImportClaudeCommand', () => {
  let testDirCounter = 0;
  const testDirsToCleanup: string[] = [];

  function createTestDir(): string {
    const testDir = join(process.cwd(), `.test-import-claude-${testDirCounter++}`);
    mkdirSync(testDir, { recursive: true });
    testDirsToCleanup.push(testDir);
    return testDir;
  }

  function cleanupTestDir(testDir: string): void {
    if (!existsSync(testDir)) return;

    // Retry cleanup up to 3 times with delays (handles file locks)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        rmSync(testDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
        return; // Success
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          console.warn(`Failed to cleanup ${testDir} after ${maxAttempts} attempts:`, error);
        }
      }
    }
  }

  function createTestExportFile(testDir: string, data: unknown): string {
    const filePath = join(testDir, 'export.json');
    writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    return filePath;
  }

  // Clean up ALL test directories after each test
  afterEach(() => {
    for (const testDir of testDirsToCleanup) {
      cleanupTestDir(testDir);
    }
    testDirsToCleanup.length = 0; // Clear the array
  });

  describe('execute()', () => {
    it('should import valid Claude export', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'Test Conversation',
          },
          chats: [
            {
              index: 0,
              type: 'prompt',
              message: [{ type: 'p', data: 'Hello Claude' }],
            },
            {
              index: 1,
              type: 'response',
              message: [{ type: 'p', data: 'Hello! How can I help?' }],
            },
          ],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.messageCount).toBe(2);
          expect(result.value.conversationId).toBe('test-conversation');
          expect(result.value.filesCreated.length).toBeGreaterThan(0);
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create checkpoint file', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'Checkpoint Test',
          },
          chats: [
            {
              index: 0,
              type: 'prompt',
              message: [{ type: 'p', data: 'Test' }],
            },
          ],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          // Check that at least one checkpoint file was created
          expect(result.value.filesCreated.length).toBeGreaterThanOrEqual(3);

          const checkpointFile = result.value.filesCreated.find((f) => f.includes('checkpoint-'));
          expect(checkpointFile).toBeDefined();

          if (checkpointFile) {
            const checkpointContent = readFileSync(checkpointFile, 'utf-8');
            const checkpoint = JSON.parse(checkpointContent);
            expect(checkpoint.source).toBe('claude');
            expect(checkpoint.messages).toHaveLength(1);
          }
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create AICF file', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'AICF Test',
          },
          chats: [
            {
              index: 0,
              type: 'prompt',
              message: [{ type: 'p', data: 'Test' }],
            },
          ],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          const aicfFiles = result.value.filesCreated.filter((f) => f.endsWith('.aicf'));
          expect(aicfFiles.length).toBe(1);

          const aicfContent = readFileSync(aicfFiles[0], 'utf-8');
          expect(aicfContent).toContain('@CONVERSATION');
          expect(aicfContent).toContain('source=claude');
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should create Markdown file', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'Markdown Test',
          },
          chats: [
            {
              index: 0,
              type: 'prompt',
              message: [{ type: 'p', data: 'Hello' }],
            },
            {
              index: 1,
              type: 'response',
              message: [{ type: 'p', data: 'Hi there' }],
            },
          ],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          const mdFiles = result.value.filesCreated.filter((f) => f.endsWith('.md'));
          expect(mdFiles.length).toBe(1);

          const mdContent = readFileSync(mdFiles[0], 'utf-8');
          expect(mdContent).toContain('# markdown-test');
          expect(mdContent).toContain('👤 User');
          expect(mdContent).toContain('🤖 Claude');
          expect(mdContent).toContain('Hello');
          expect(mdContent).toContain('Hi there');
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should handle empty export', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'Empty',
          },
          chats: [],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.messageCount).toBe(0);
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should reject non-existent file', async () => {
      const testDir = createTestDir();
      try {
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute('/non/existent/file.json');

        expect(result.ok).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should reject invalid JSON', async () => {
      const testDir = createTestDir();
      try {
        const filePath = join(testDir, 'invalid.json');
        writeFileSync(filePath, 'not valid json', 'utf-8');

        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(filePath);

        expect(result.ok).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should reject invalid Claude export format', async () => {
      const testDir = createTestDir();
      try {
        const exportData = { invalid: 'format' };
        const exportFile = createTestExportFile(testDir, exportData);

        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(false);
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should use custom output directory', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'Custom Output',
          },
          chats: [
            {
              index: 0,
              type: 'prompt',
              message: [{ type: 'p', data: 'Test' }],
            },
          ],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const customOutput = '.custom/output';
        const cmd = new ImportClaudeCommand({ cwd: testDir, output: customOutput });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.value.outputPath).toBe(customOutput);
          const customDir = join(testDir, customOutput);
          expect(existsSync(customDir)).toBe(true);
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });

    it('should handle code blocks in messages', async () => {
      const testDir = createTestDir();
      try {
        const exportData = {
          meta: {
            exported_at: '2024-03-19 16:03:09',
            title: 'Code Test',
          },
          chats: [
            {
              index: 0,
              type: 'response',
              message: [
                { type: 'p', data: 'Here is code:' },
                { type: 'pre', language: 'javascript', data: 'console.log("test");' },
              ],
            },
          ],
        };

        const exportFile = createTestExportFile(testDir, exportData);
        const cmd = new ImportClaudeCommand({ cwd: testDir });
        const result = await cmd.execute(exportFile);

        expect(result.ok).toBe(true);
        if (result.ok) {
          const mdFiles = result.value.filesCreated.filter((f) => f.endsWith('.md'));
          const mdContent = readFileSync(mdFiles[0], 'utf-8');
          expect(mdContent).toContain('```javascript');
          expect(mdContent).toContain('console.log');
        }
      } finally {
        cleanupTestDir(testDir);
      }
    });
  });
});
