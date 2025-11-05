/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Decorators Tests
 * Phase 3 (Week 3) - Prevention
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ValidateWrite, ValidateWriteSync, ValidateRead, ValidateDelete } from './decorators.js';
import { GuardRails } from '../core/GuardRails.js';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

// Test classes must be defined outside describe blocks for decorators to work
class TestWriter {
  @ValidateWrite
  async writeFile(path: string, content: string): Promise<Result<void>> {
    // Simulate write
    const fs = await import('fs/promises');
    await fs.writeFile(path, content, 'utf-8');
    return Ok(undefined);
  }
}

class TestWriterSync {
  @ValidateWriteSync
  writeFile(path: string, content: string): { ok: boolean; error?: string } {
    // Simulate write
    writeFileSync(path, content, 'utf-8');
    return { ok: true };
  }
}

class TestReader {
  @ValidateRead
  async readFile(path: string): Promise<Result<string>> {
    // Simulate read
    const fs = await import('fs/promises');
    const content = await fs.readFile(path, 'utf-8');
    return Ok(content);
  }
}

class TestDeleter {
  @ValidateDelete
  async deleteFile(path: string): Promise<Result<void>> {
    // Simulate delete
    const fs = await import('fs/promises');
    await fs.unlink(path);
    return Ok(undefined);
  }
}

describe('Decorators', () => {
  const testDir = join(process.cwd(), '.test-decorators');
  const lillDir = join(testDir, '.lill');

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    if (!existsSync(lillDir)) {
      mkdirSync(lillDir, { recursive: true });
    }
    // Create .lill/raw/ directory
    const rawDir = join(lillDir, 'raw');
    if (!existsSync(rawDir)) {
      mkdirSync(rawDir, { recursive: true });
    }

    // Initialize GuardRails
    GuardRails.initialize(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('@ValidateWrite (async)', () => {
    it('should allow writes to .lill/raw/', async () => {
      const writer = new TestWriter();
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const result = await writer.writeFile(path, '{"test": true}');
      expect(result.ok).toBe(true);
      expect(existsSync(path)).toBe(true);
    });

    it('should block writes to .ai/ directory', async () => {
      const writer = new TestWriter();
      const path = join(testDir, '.ai', 'test.md');
      const result = await writer.writeFile(path, '# Test');
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
      expect(existsSync(path)).toBe(false);
    });

    it('should validate JSON format and rollback on invalid JSON', async () => {
      const writer = new TestWriter();
      const path = join(testDir, '.lill', 'raw', 'invalid.json');
      const result = await writer.writeFile(path, 'invalid json{');
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('Invalid JSON');
      expect(existsSync(path)).toBe(false); // Should be rolled back
    });

    it('should allow valid JSON', async () => {
      const writer = new TestWriter();
      const path = join(testDir, '.lill', 'raw', 'valid.json');
      const result = await writer.writeFile(path, '{"valid": true}');
      expect(result.ok).toBe(true);
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('@ValidateWriteSync', () => {
    it('should allow writes to .lill/raw/', () => {
      const writer = new TestWriterSync();
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const result = writer.writeFile(path, '{"test": true}');
      expect(result.ok).toBe(true);
      expect(existsSync(path)).toBe(true);
    });

    it('should block writes to .ai/ directory', () => {
      const writer = new TestWriterSync();
      const path = join(testDir, '.ai', 'test.md');
      const result = writer.writeFile(path, '# Test');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('protected-ai-files');
      expect(existsSync(path)).toBe(false);
    });

    it('should validate JSON format and rollback on invalid JSON', () => {
      const writer = new TestWriterSync();
      const path = join(testDir, '.lill', 'raw', 'invalid.json');
      const result = writer.writeFile(path, 'invalid json{');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Invalid JSON');
      expect(existsSync(path)).toBe(false); // Should be rolled back
    });

    it('should allow valid JSON', () => {
      const writer = new TestWriterSync();
      const path = join(testDir, '.lill', 'raw', 'valid.json');
      const result = writer.writeFile(path, '{"valid": true}');
      expect(result.ok).toBe(true);
      expect(existsSync(path)).toBe(true);
    });
  });

  describe('@ValidateRead', () => {
    it('should allow reads from .lill/', async () => {
      const reader = new TestReader();
      const path = join(testDir, '.lill', 'raw', 'test.json');
      writeFileSync(path, '{"test": true}', 'utf-8');
      const result = await reader.readFile(path);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('{"test": true}');
      }
    });

    it('should block reads from .ai/ (protected)', async () => {
      // .ai/ is protected for all operations (read, write, delete)
      const reader = new TestReader();
      const aiDir = join(testDir, '.ai');
      if (!existsSync(aiDir)) {
        mkdirSync(aiDir, { recursive: true });
      }
      const path = join(aiDir, 'test.md');
      writeFileSync(path, '# Test', 'utf-8');
      const result = await reader.readFile(path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
    });
  });

  describe('@ValidateDelete', () => {
    it('should allow deletes from .lill/raw/', async () => {
      const deleter = new TestDeleter();
      const path = join(testDir, '.lill', 'raw', 'test.json');
      writeFileSync(path, '{"test": true}', 'utf-8');
      const result = await deleter.deleteFile(path);
      expect(result.ok).toBe(true);
      expect(existsSync(path)).toBe(false);
    });

    it('should block deletes from .ai/', async () => {
      const deleter = new TestDeleter();
      const aiDir = join(testDir, '.ai');
      if (!existsSync(aiDir)) {
        mkdirSync(aiDir, { recursive: true });
      }
      const path = join(aiDir, 'test.md');
      writeFileSync(path, '# Test', 'utf-8');
      const result = await deleter.deleteFile(path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
      expect(existsSync(path)).toBe(true); // Should not be deleted
    });
  });

  describe('Error handling', () => {
    it('should throw error if first argument is not a string', async () => {
      // Create a test writer with invalid argument type
      const writer = new TestWriter();
      await expect(writer.writeFile(123 as any, 'content')).rejects.toThrow(
        '@ValidateWrite: First argument must be a string path'
      );
    });
  });
});
