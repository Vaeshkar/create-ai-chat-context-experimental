/**
 * FileValidator Tests
 * Phase 3.2: File I/O - Memory File Writing - October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { FileValidator } from './FileValidator.js';

describe('FileValidator', () => {
  let tempDir: string;
  let validator: FileValidator;

  beforeEach(() => {
    tempDir = join(process.cwd(), '.test-validator');
    mkdirSync(tempDir, { recursive: true });
    validator = new FileValidator();
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  describe('validateAICF', () => {
    it('should validate valid AICF file', () => {
      const filePath = join(tempDir, 'test.aicf');
      const content = `version|3.0.0-alpha
timestamp|2025-10-22T12:00:00Z
conversationId|test-conv-1
userIntents|intent1,intent2
aiActions|action1,action2`;

      writeFileSync(filePath, content);

      const result = validator.validateAICF(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(true);
      }
    });

    it('should detect missing required fields', () => {
      const filePath = join(tempDir, 'test.aicf');
      const content = `version|3.0.0-alpha
timestamp|2025-10-22T12:00:00Z`;

      writeFileSync(filePath, content);

      const result = validator.validateAICF(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should detect invalid version format', () => {
      const filePath = join(tempDir, 'test.aicf');
      const content = `version|invalid
timestamp|2025-10-22T12:00:00Z
conversationId|test-conv-1`;

      writeFileSync(filePath, content);

      const result = validator.validateAICF(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });

    it('should detect invalid timestamp format', () => {
      const filePath = join(tempDir, 'test.aicf');
      const content = `version|3.0.0-alpha
timestamp|invalid-date
conversationId|test-conv-1`;

      writeFileSync(filePath, content);

      const result = validator.validateAICF(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });

    it('should return error for non-existent file', () => {
      const filePath = join(tempDir, 'non-existent.aicf');

      const result = validator.validateAICF(filePath);

      expect(result.ok).toBe(false);
    });

    it('should detect empty file', () => {
      const filePath = join(tempDir, 'empty.aicf');
      writeFileSync(filePath, '');

      const result = validator.validateAICF(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('validateMarkdown', () => {
    it('should validate valid markdown file', () => {
      const filePath = join(tempDir, 'test.md');
      const content = `# Test Document

This is a **test** document with \`code\`.

## Section 2

More content here.`;

      writeFileSync(filePath, content);

      const result = validator.validateMarkdown(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(true);
      }
    });

    it('should warn about missing headers', () => {
      const filePath = join(tempDir, 'test.md');
      const content = 'Just plain text without headers.';

      writeFileSync(filePath, content);

      const result = validator.validateMarkdown(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'warnings' in result) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should detect empty markdown file', () => {
      const filePath = join(tempDir, 'empty.md');
      writeFileSync(filePath, '');

      const result = validator.validateMarkdown(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('validateJSON', () => {
    it('should validate valid JSON file', () => {
      const filePath = join(tempDir, 'test.json');
      const content = JSON.stringify({ key: 'value', number: 42 });

      writeFileSync(filePath, content);

      const result = validator.validateJSON(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(true);
      }
    });

    it('should detect invalid JSON', () => {
      const filePath = join(tempDir, 'test.json');
      const content = '{ invalid json }';

      writeFileSync(filePath, content);

      const result = validator.validateJSON(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });

    it('should detect empty JSON file', () => {
      const filePath = join(tempDir, 'empty.json');
      writeFileSync(filePath, '');

      const result = validator.validateJSON(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe('validateByExtension', () => {
    it('should validate AICF by extension', () => {
      const filePath = join(tempDir, 'test.aicf');
      const content = `version|3.0.0-alpha
timestamp|2025-10-22T12:00:00Z
conversationId|test-conv-1`;

      writeFileSync(filePath, content);

      const result = validator.validateByExtension(filePath);

      expect(result.ok).toBe(true);
    });

    it('should validate Markdown by extension', () => {
      const filePath = join(tempDir, 'test.md');
      const content = '# Test\n\nContent here.';

      writeFileSync(filePath, content);

      const result = validator.validateByExtension(filePath);

      expect(result.ok).toBe(true);
    });

    it('should validate JSON by extension', () => {
      const filePath = join(tempDir, 'test.json');
      const content = JSON.stringify({ test: true });

      writeFileSync(filePath, content);

      const result = validator.validateByExtension(filePath);

      expect(result.ok).toBe(true);
    });

    it('should warn about unknown extension', () => {
      const filePath = join(tempDir, 'test.unknown');
      writeFileSync(filePath, 'content');

      const result = validator.validateByExtension(filePath);

      expect(result.ok).toBe(true);
      if (result.ok && 'warnings' in result) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateContentLength', () => {
    it('should validate file within length limits', () => {
      const filePath = join(tempDir, 'test.txt');
      const content = 'This is a test file with some content.';

      writeFileSync(filePath, content);

      const result = validator.validateContentLength(filePath, 10, 1000);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(true);
      }
    });

    it('should detect file too short', () => {
      const filePath = join(tempDir, 'test.txt');
      writeFileSync(filePath, 'short');

      const result = validator.validateContentLength(filePath, 100, 1000);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });

    it('should detect file too long', () => {
      const filePath = join(tempDir, 'test.txt');
      const content = 'x'.repeat(2000);

      writeFileSync(filePath, content);

      const result = validator.validateContentLength(filePath, 10, 1000);

      expect(result.ok).toBe(true);
      if (result.ok && 'isValid' in result) {
        expect(result.isValid).toBe(false);
      }
    });
  });
});
