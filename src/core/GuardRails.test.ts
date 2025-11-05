/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * GuardRails Tests
 * Phase 3 (Week 3) - Prevention
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GuardRails } from './GuardRails.js';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

describe('GuardRails', () => {
  const testDir = join(process.cwd(), '.test-guardrails');
  const lillDir = join(testDir, '.lill');

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    if (!existsSync(lillDir)) {
      mkdirSync(lillDir, { recursive: true });
    }

    // Initialize GuardRails with test directory
    GuardRails.initialize(testDir);
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('enforce (async)', () => {
    it('should allow writes to .lill/raw/', async () => {
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const result = await GuardRails.enforce('write', path);
      expect(result.ok).toBe(true);
    });

    it('should block writes to .ai/ directory', async () => {
      const path = join(testDir, '.ai', 'test.md');
      const result = await GuardRails.enforce('write', path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
    });

    it('should block writes to root planning docs', async () => {
      // Use process.cwd() to test root-level files (PathValidator uses process.cwd())
      const path = join(process.cwd(), 'CLEANUP-PLAN.md');
      const result = await GuardRails.enforce('write', path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('no-root-clutter');
    });

    it('should allow writes to README.md', async () => {
      // Use process.cwd() to test root-level files
      const path = join(process.cwd(), 'README.md');
      const result = await GuardRails.enforce('write', path);
      expect(result.ok).toBe(true);
    });

    it('should allow writes to .augment/ directory (not protected)', async () => {
      // .augment/ is not in PROTECTED_PATHS, so writes are allowed
      const path = join(testDir, '.augment', 'test.md');
      const result = await GuardRails.enforce('write', path);
      expect(result.ok).toBe(true);
    });
  });

  describe('enforceSync', () => {
    it('should allow writes to .lill/raw/', () => {
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const result = GuardRails.enforceSync('write', path);
      expect(result.ok).toBe(true);
    });

    it('should block writes to .ai/ directory', () => {
      const path = join(testDir, '.ai', 'test.md');
      const result = GuardRails.enforceSync('write', path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
    });

    it('should block writes to root planning docs', () => {
      // Use process.cwd() to test root-level files
      const path = join(process.cwd(), 'CLEANUP-PLAN.md');
      const result = GuardRails.enforceSync('write', path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('no-root-clutter');
    });
  });

  describe('getBlockingRule', () => {
    it('should return null for allowed paths', () => {
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const rule = GuardRails.getBlockingRule(path);
      expect(rule).toBeNull();
    });

    it('should return rule name for blocked paths', () => {
      const path = join(testDir, '.ai', 'test.md');
      const rule = GuardRails.getBlockingRule(path);
      expect(rule).toBe('protected-ai-files');
    });

    it('should return rule name for planning docs', () => {
      // Use process.cwd() to test root-level files
      const path = join(process.cwd(), 'CLEANUP-PLAN.md');
      const rule = GuardRails.getBlockingRule(path);
      expect(rule).toBe('no-root-clutter');
    });
  });

  describe('isAllowed', () => {
    it('should return true for allowed paths', () => {
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const allowed = GuardRails.isAllowed('write', path);
      expect(allowed).toBe(true);
    });

    it('should return false for blocked paths', () => {
      const path = join(testDir, '.ai', 'test.md');
      const allowed = GuardRails.isAllowed('write', path);
      expect(allowed).toBe(false);
    });

    it('should return false for planning docs', () => {
      // Use process.cwd() to test root-level files
      const path = join(process.cwd(), 'CLEANUP-PLAN.md');
      const allowed = GuardRails.isAllowed('write', path);
      expect(allowed).toBe(false);
    });
  });

  describe('read operations', () => {
    it('should allow reads from .lill/', async () => {
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const result = await GuardRails.enforce('read', path);
      expect(result.ok).toBe(true);
    });

    it('should block reads from .ai/ (protected)', async () => {
      // .ai/ is protected for writes, but also for reads/deletes
      const path = join(testDir, '.ai', 'test.md');
      const result = await GuardRails.enforce('read', path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
    });
  });

  describe('delete operations', () => {
    it('should allow deletes from .lill/raw/', async () => {
      const path = join(testDir, '.lill', 'raw', 'test.json');
      const result = await GuardRails.enforce('delete', path);
      expect(result.ok).toBe(true);
    });

    it('should block deletes from .ai/', async () => {
      const path = join(testDir, '.ai', 'test.md');
      const result = await GuardRails.enforce('delete', path);
      expect(result.ok).toBe(false);
      expect(result.error?.message).toContain('protected-ai-files');
    });
  });
});
