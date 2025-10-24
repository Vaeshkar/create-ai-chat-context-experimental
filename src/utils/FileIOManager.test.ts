/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * FileIOManager Tests
 * Phase 3.2: File I/O - Memory File Writing - October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { FileIOManager } from './FileIOManager.js';

describe('FileIOManager', () => {
  let tempDir: string;
  let manager: FileIOManager;

  beforeEach(() => {
    tempDir = join(process.cwd(), '.test-fileio');
    mkdirSync(tempDir, { recursive: true });
    manager = new FileIOManager();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('writeFile', () => {
    it('should write file successfully', () => {
      const filePath = join(tempDir, 'test.txt');
      const content = 'Hello, World!';

      const result = manager.writeFile(filePath, content);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.filePath).toBe(filePath);
        expect(result.bytesWritten).toBeGreaterThan(0);
      }
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should create directory if it does not exist', () => {
      const filePath = join(tempDir, 'subdir', 'test.txt');
      const content = 'Test content';

      const result = manager.writeFile(filePath, content);

      expect(result.ok).toBe(true);
      expect(existsSync(filePath)).toBe(true);
    });

    it('should create backup of existing file', () => {
      const filePath = join(tempDir, 'test.txt');
      const originalContent = 'Original content';
      const newContent = 'New content';

      writeFileSync(filePath, originalContent);

      const result = manager.writeFile(filePath, newContent, { backup: true });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.backupPath).toBeDefined();
        expect(existsSync(result.backupPath!)).toBe(true);
        expect(readFileSync(result.backupPath!, 'utf-8')).toBe(originalContent);
      }
      expect(readFileSync(filePath, 'utf-8')).toBe(newContent);
    });

    it('should not create backup when backup is disabled', () => {
      const filePath = join(tempDir, 'test.txt');
      writeFileSync(filePath, 'Original');

      const result = manager.writeFile(filePath, 'New', { backup: false });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.backupPath).toBeUndefined();
      }
    });

    it('should handle atomic writes', () => {
      const filePath = join(tempDir, 'atomic.txt');
      const content = 'Atomic write test';

      const result = manager.writeFile(filePath, content, { atomic: true });

      expect(result.ok).toBe(true);
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath, 'utf-8')).toBe(content);
    });

    it('should set file permissions', () => {
      const filePath = join(tempDir, 'test.txt');
      const permissions = 0o600;

      const result = manager.writeFile(filePath, 'Test', { permissions });

      expect(result.ok).toBe(true);
    });
  });

  describe('readFile', () => {
    it('should read file successfully', () => {
      const filePath = join(tempDir, 'test.txt');
      const content = 'Test content';
      writeFileSync(filePath, content);

      const result = manager.readFile(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'content' in result) {
        expect(result.content).toBe(content);
      }
    });

    it('should return error for non-existent file', () => {
      const filePath = join(tempDir, 'non-existent.txt');

      const result = manager.readFile(filePath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('not found');
      }
    });
  });

  describe('getFileSize', () => {
    it('should return file size', () => {
      const filePath = join(tempDir, 'test.txt');
      const content = 'Test content';
      writeFileSync(filePath, content);

      const result = manager.getFileSize(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'size' in result) {
        expect(result.size).toBeGreaterThan(0);
      }
    });

    it('should return error for non-existent file', () => {
      const filePath = join(tempDir, 'non-existent.txt');

      const result = manager.getFileSize(filePath);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('not found');
      }
    });
  });

  describe('getFileModTime', () => {
    it('should return modification time', () => {
      const filePath = join(tempDir, 'test.txt');
      writeFileSync(filePath, 'Test');

      const result = manager.getFileModTime(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'mtime' in result) {
        expect(result.mtime).toBeInstanceOf(Date);
      }
    });
  });

  describe('ensureDirectoryExists', () => {
    it('should create directory if it does not exist', () => {
      const dirPath = join(tempDir, 'new-dir');

      const result = manager.ensureDirectoryExists(dirPath);

      expect(result.ok).toBe(true);
      expect(existsSync(dirPath)).toBe(true);
    });

    it('should not fail if directory already exists', () => {
      const dirPath = join(tempDir, 'existing-dir');
      mkdirSync(dirPath);

      const result = manager.ensureDirectoryExists(dirPath);

      expect(result.ok).toBe(true);
    });
  });

  describe('setPermissions', () => {
    it('should set file permissions', () => {
      const filePath = join(tempDir, 'test.txt');
      writeFileSync(filePath, 'Test');

      const result = manager.setPermissions(filePath, 0o600);

      expect(result.ok).toBe(true);
    });

    it('should return error for non-existent file', () => {
      const filePath = join(tempDir, 'non-existent.txt');

      const result = manager.setPermissions(filePath, 0o600);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('not found');
      }
    });
  });

  describe('getPermissions', () => {
    it('should get file permissions', () => {
      const filePath = join(tempDir, 'test.txt');
      writeFileSync(filePath, 'Test');

      const result = manager.getPermissions(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'permissions' in result) {
        expect(result.permissions).toBeGreaterThan(0);
      }
    });
  });
});
