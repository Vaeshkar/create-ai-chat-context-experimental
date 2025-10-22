import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import { estimateTokens, analyzeTokenUsage, shouldWrapUpSession } from './TokenMonitor';

const TEST_DIR = path.join(process.cwd(), '.test-monitor');

describe('TokenMonitor', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_DIR);
  });

  afterEach(async () => {
    await fs.remove(TEST_DIR);
  });

  describe('estimateTokens', () => {
    it('should estimate tokens from text length', () => {
      const text = 'a'.repeat(400); // 400 chars
      const tokens = estimateTokens(text);
      expect(tokens).toBe(100); // 400 / 4 = 100
    });

    it('should handle empty text', () => {
      const tokens = estimateTokens('');
      expect(tokens).toBe(0);
    });

    it('should increase estimate for code blocks', () => {
      const text = 'a'.repeat(400) + '```code```';
      const tokens = estimateTokens(text);
      expect(tokens).toBeGreaterThan(100); // Should be 1.2x multiplier
    });

    it('should decrease estimate for structured data', () => {
      const text = 'a'.repeat(400) + '|data|';
      const tokens = estimateTokens(text);
      expect(tokens).toBeLessThan(100); // Should be 0.8x multiplier
    });
  });

  describe('analyzeTokenUsage', () => {
    it('should return zero usage when no .ai directory exists', async () => {
      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.totalTokens).toBe(0);
      expect(analysis.aiTokens).toBe(0);
      expect(analysis.aicfTokens).toBe(0);
      expect(analysis.hasAICF).toBe(false);
    });

    it('should analyze .ai files', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      const content = 'word '.repeat(100);
      await fs.writeFile(path.join(aiDir, 'README.md'), content);

      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.aiTokens).toBeGreaterThan(0);
      expect(analysis.totalTokens).toBeGreaterThan(0);
      expect(Object.keys(analysis.files).length).toBeGreaterThan(0);
    });

    it('should track conversation tokens separately', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      const content = 'word '.repeat(100);
      await fs.writeFile(path.join(aiDir, 'conversation-log.md'), content);

      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.conversationTokens).toBeGreaterThan(0);
    });

    it('should detect AICF directory', async () => {
      const aicfDir = path.join(TEST_DIR, '.aicf');
      await fs.ensureDir(aicfDir);

      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.hasAICF).toBe(true);
    });

    it('should analyze AICF files', async () => {
      const aicfDir = path.join(TEST_DIR, '.aicf');
      await fs.ensureDir(aicfDir);

      const content = 'data|value|more';
      await fs.writeFile(path.join(aicfDir, 'index.aicf'), content);

      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.aicfTokens).toBeGreaterThan(0);
    });

    it('should generate appropriate recommendations', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create a large file to trigger HIGH recommendation (need ~400k chars for 100k tokens)
      const largeContent = 'word '.repeat(100000);
      await fs.writeFile(path.join(aiDir, 'conversation-log.md'), largeContent);

      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.recommendation).toContain('HIGH');
    });

    it('should calculate context window usage', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      const content = 'word '.repeat(100);
      await fs.writeFile(path.join(aiDir, 'README.md'), content);

      const analysis = await analyzeTokenUsage(TEST_DIR);

      expect(analysis.contextWindowUsage).toBeGreaterThan(0);
      expect(analysis.contextWindowUsage).toBeLessThanOrEqual(100);
    });
  });

  describe('shouldWrapUpSession', () => {
    it('should not wrap up when token usage is low', async () => {
      const decision = await shouldWrapUpSession(TEST_DIR);

      expect(decision.shouldWrapUp).toBe(false);
      expect(decision.reason).toContain('healthy');
    });

    it('should wrap up when tokens exceed 100k', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create a very large file (need ~400k chars to get 100k tokens)
      const largeContent = 'word '.repeat(100000);
      await fs.writeFile(path.join(aiDir, 'conversation-log.md'), largeContent);

      const decision = await shouldWrapUpSession(TEST_DIR);

      expect(decision.shouldWrapUp).toBe(true);
    });

    it('should wrap up when conversation tokens exceed 25k', async () => {
      const aiDir = path.join(TEST_DIR, '.ai');
      await fs.ensureDir(aiDir);

      // Create a large conversation log (need ~100k chars to get 25k tokens)
      const largeContent = 'word '.repeat(25000);
      await fs.writeFile(path.join(aiDir, 'conversation-log.md'), largeContent);

      const decision = await shouldWrapUpSession(TEST_DIR);

      expect(decision.shouldWrapUp).toBe(true);
    });

    it('should include analysis in decision', async () => {
      const decision = await shouldWrapUpSession(TEST_DIR);

      expect(decision.analysis).toBeDefined();
      expect(decision.analysis.totalTokens).toBeDefined();
    });
  });
});
