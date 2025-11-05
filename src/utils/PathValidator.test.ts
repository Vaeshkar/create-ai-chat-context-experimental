/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import { describe, it, expect } from 'vitest';
import { PathValidator } from './PathValidator.js';

describe('PathValidator', () => {
  describe('validateWrite', () => {
    it('should block writes to .ai/ directory', () => {
      const result = PathValidator.validateWrite('.ai/code-style.md');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('protected-ai-files');
        expect(result.error.message).toContain('.ai/');
      }
    });

    it('should block writes to any file in .ai/ directory', () => {
      const paths = [
        '.ai/code-style.md',
        '.ai/design-system.md',
        '.ai/npm-publishing-checklist.md',
        '.ai/Testing-philosophy.md',
        '.ai/conversation-log.md',
        '.ai/project-security.md',
        '.ai/new-file.md',
      ];

      for (const path of paths) {
        const result = PathValidator.validateWrite(path);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('protected-ai-files');
        }
      }
    });

    it('should allow writes to .lill/ directory with valid extensions', () => {
      const paths = [
        '.lill/raw/2025-11-04_conversation.json',
        '.lill/snapshots/rolling-123.json',
        '.lill/.audit.log',
        '.lill/.watcher.pid',
      ];

      for (const path of paths) {
        const result = PathValidator.validateWrite(path);
        expect(result.ok).toBe(true);
      }
    });

    it('should block writes to .lill/ directory with invalid extensions', () => {
      const paths = [
        '.lill/raw/conversation.md',
        '.lill/raw/conversation.txt',
        '.lill/raw/conversation.html',
      ];

      for (const path of paths) {
        const result = PathValidator.validateWrite(path);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('lill-format-only');
        }
      }
    });

    it('should allow writes to allowed root files', () => {
      const paths = [
        'README.md',
        'PRIVACY.md',
        'SECURITY.md',
        'RELEASE-NOTES.md',
        'INSTALLATION-GUIDE.md',
        'LICENSE',
        '.gitignore',
        '.aether-health.json',
      ];

      for (const path of paths) {
        const result = PathValidator.validateWrite(path);
        expect(result.ok).toBe(true);
      }
    });

    it('should block writes to disallowed root files', () => {
      const paths = ['CLEANUP-PLAN.md', 'SESSION-123.md', 'PHASE-6-COMPLETE.md', 'random-file.md'];

      for (const path of paths) {
        const result = PathValidator.validateWrite(path);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.message).toContain('no-root-clutter');
        }
      }
    });

    it('should allow writes to other directories', () => {
      const paths = [
        'docs/guide.md',
        'packages/aice/src/test.ts',
        '.augment/guidelines.md',
        '.augment/rules/new-rule.md',
      ];

      for (const path of paths) {
        const result = PathValidator.validateWrite(path);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe('validateRead', () => {
    it('should allow all reads (no restrictions)', () => {
      const paths = [
        '.ai/code-style.md',
        '.lill/raw/conversation.json',
        'README.md',
        'packages/aice/src/test.ts',
      ];

      for (const path of paths) {
        const result = PathValidator.validateRead(path);
        expect(result.ok).toBe(true);
      }
    });
  });

  describe('isProtected', () => {
    it('should return true for protected paths', () => {
      const paths = ['.ai/code-style.md', '.ai/design-system.md', '.ai/new-file.md'];

      for (const path of paths) {
        expect(PathValidator.isProtected(path)).toBe(true);
      }
    });

    it('should return false for non-protected paths', () => {
      const paths = ['.lill/raw/conversation.json', 'README.md', 'docs/guide.md'];

      for (const path of paths) {
        expect(PathValidator.isProtected(path)).toBe(false);
      }
    });
  });

  describe('getBlockingRule', () => {
    it('should return rule name for blocked paths', () => {
      expect(PathValidator.getBlockingRule('.ai/code-style.md')).toBe('protected-ai-files');
      expect(PathValidator.getBlockingRule('.lill/raw/file.md')).toBe('lill-format-only');
      expect(PathValidator.getBlockingRule('CLEANUP-PLAN.md')).toBe('no-root-clutter');
    });

    it('should return null for allowed paths', () => {
      expect(PathValidator.getBlockingRule('.lill/raw/conversation.json')).toBeNull();
      expect(PathValidator.getBlockingRule('README.md')).toBeNull();
      expect(PathValidator.getBlockingRule('docs/guide.md')).toBeNull();
    });
  });

  describe('getProtectedPaths', () => {
    it('should return array of protected paths', () => {
      const paths = PathValidator.getProtectedPaths();
      expect(paths).toContain('.ai/**/*'); // Glob pattern for all .ai/ files
      expect(paths).toContain('.augment/project-overview.md');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('getLillAllowedExtensions', () => {
    it('should return array of allowed extensions', () => {
      const extensions = PathValidator.getLillAllowedExtensions();
      expect(extensions).toContain('.aicf');
      expect(extensions).toContain('.json');
      expect(extensions).toContain('.log');
      expect(extensions).toContain('.pid');
      expect(extensions.length).toBeGreaterThan(0);
    });
  });
});
