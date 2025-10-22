import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokens, countWordsInFile, getTokenUsage } from './TokenUtils';

const TEST_DIR = path.join(process.cwd(), '.test-tokens');

describe('TokenUtils', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('estimateTokens', () => {
    it('should estimate tokens from word count', () => {
      // 1 token ≈ 0.75 words (or 1.33 tokens per word)
      const tokens = estimateTokens(100);
      expect(tokens).toBe(133); // 100 * 1.33 = 133
    });

    it('should round up', () => {
      const tokens = estimateTokens(10);
      expect(tokens).toBe(14); // 10 * 1.33 = 13.3, rounded up to 14
    });

    it('should handle zero words', () => {
      const tokens = estimateTokens(0);
      expect(tokens).toBe(0);
    });

    it('should handle large word counts', () => {
      const tokens = estimateTokens(10000);
      expect(tokens).toBe(13300);
    });
  });

  describe('countWordsInFile', () => {
    it('should count words in a file', async () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      await fs.writeFile(filePath, 'hello world this is a test');

      const count = await countWordsInFile(filePath);
      expect(count).toBe(6);
    });

    it('should handle multiple spaces', async () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      await fs.writeFile(filePath, 'hello    world   test');

      const count = await countWordsInFile(filePath);
      expect(count).toBe(3);
    });

    it('should handle newlines', async () => {
      const filePath = path.join(TEST_DIR, 'test.txt');
      await fs.writeFile(filePath, 'hello\nworld\ntest');

      const count = await countWordsInFile(filePath);
      expect(count).toBe(3);
    });

    it('should return 0 for non-existent file', async () => {
      const count = await countWordsInFile(path.join(TEST_DIR, 'nonexistent.txt'));
      expect(count).toBe(0);
    });

    it('should handle empty file', async () => {
      const filePath = path.join(TEST_DIR, 'empty.txt');
      await fs.writeFile(filePath, '');

      const count = await countWordsInFile(filePath);
      expect(count).toBe(0);
    });
  });

  describe('getTokenUsage', () => {
    it('should return zero usage when no .ai directory exists', async () => {
      const usage = await getTokenUsage(TEST_DIR);

      expect(usage.totalWords).toBe(0);
      expect(usage.totalTokens).toBe(0);
      expect(usage.files.length).toBe(9);
      expect(usage.files.every((f) => !f.exists)).toBe(true);
    });

    it('should count tokens for existing files', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create a README with 100 words
      const readmeContent = 'word '.repeat(100);
      await fs.writeFile(path.join(aiDir, 'README.md'), readmeContent);

      const usage = await getTokenUsage(TEST_DIR);

      expect(usage.totalWords).toBeGreaterThan(0);
      expect(usage.totalTokens).toBeGreaterThan(0);

      const readmeFile = usage.files.find((f) => f.name === '.ai/README.md');
      expect(readmeFile?.exists).toBe(true);
      expect(readmeFile?.words).toBeGreaterThan(0);
    });

    it('should handle multiple files', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create multiple files
      await fs.writeFile(path.join(aiDir, 'README.md'), 'word '.repeat(50));
      await fs.writeFile(path.join(aiDir, 'architecture.md'), 'word '.repeat(75));

      const usage = await getTokenUsage(TEST_DIR);

      expect(usage.files.filter((f) => f.exists).length).toBe(2);
      expect(usage.totalWords).toBeGreaterThan(0);
    });

    it('should categorize files correctly', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      await fs.writeFile(path.join(aiDir, 'README.md'), 'word '.repeat(50));
      await fs.writeFile(path.join(aiDir, 'conversation-log.md'), 'word '.repeat(50));

      const usage = await getTokenUsage(TEST_DIR);

      const readme = usage.files.find((f) => f.name === '.ai/README.md');
      const log = usage.files.find((f) => f.name === '.ai/conversation-log.md');

      expect(readme?.category).toBe('core');
      expect(log?.category).toBe('history');
    });
  });
});
