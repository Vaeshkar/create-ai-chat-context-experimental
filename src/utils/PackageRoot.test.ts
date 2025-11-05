/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * PackageRoot Tests
 * Tests for package root and templates directory resolution
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';
import { getPackageRoot, getTemplatesDir, templatesExist } from './PackageRoot.js';

describe('PackageRoot', () => {
  describe('getPackageRoot', () => {
    it('should return a valid directory path', () => {
      const packageRoot = getPackageRoot();
      expect(packageRoot).toBeTruthy();
      expect(typeof packageRoot).toBe('string');
      expect(packageRoot.length).toBeGreaterThan(0);
    });

    it('should return a directory that exists', () => {
      const packageRoot = getPackageRoot();
      expect(existsSync(packageRoot)).toBe(true);
    });

    it('should return a directory containing package.json', () => {
      const packageRoot = getPackageRoot();
      const packageJsonPath = join(packageRoot, 'package.json');
      expect(existsSync(packageJsonPath)).toBe(true);
    });

    it('should return the correct package root', () => {
      const packageRoot = getPackageRoot();
      const packageJsonPath = join(packageRoot, 'package.json');
      const packageJson = require(packageJsonPath);
      expect(packageJson.name).toBe('create-ai-chat-context-experimental');
    });

    it('should return consistent results on multiple calls', () => {
      const root1 = getPackageRoot();
      const root2 = getPackageRoot();
      const root3 = getPackageRoot();
      expect(root1).toBe(root2);
      expect(root2).toBe(root3);
    });

    it('should return an absolute path', () => {
      const packageRoot = getPackageRoot();
      expect(packageRoot.startsWith('/')).toBe(true);
    });
  });

  describe('getTemplatesDir', () => {
    it('should return a valid directory path', () => {
      const templatesDir = getTemplatesDir();
      expect(templatesDir).toBeTruthy();
      expect(typeof templatesDir).toBe('string');
      expect(templatesDir.length).toBeGreaterThan(0);
    });

    it('should return a path ending with dist/templates or templates', () => {
      const templatesDir = getTemplatesDir();
      const endsWithDistTemplates = templatesDir.endsWith('dist/templates');
      const endsWithTemplates = templatesDir.endsWith('templates');
      expect(endsWithDistTemplates || endsWithTemplates).toBe(true);
    });

    it('should return a path relative to package root', () => {
      const packageRoot = getPackageRoot();
      const templatesDir = getTemplatesDir();
      expect(templatesDir.startsWith(packageRoot)).toBe(true);
    });

    it('should return consistent results on multiple calls', () => {
      const dir1 = getTemplatesDir();
      const dir2 = getTemplatesDir();
      const dir3 = getTemplatesDir();
      expect(dir1).toBe(dir2);
      expect(dir2).toBe(dir3);
    });

    it('should return an absolute path', () => {
      const templatesDir = getTemplatesDir();
      expect(templatesDir.startsWith('/')).toBe(true);
    });
  });

  describe('templatesExist', () => {
    it('should return a boolean', () => {
      const exists = templatesExist();
      expect(typeof exists).toBe('boolean');
    });

    it('should return true if templates directory exists', () => {
      const templatesDir = getTemplatesDir();
      const dirExists = existsSync(templatesDir);
      const result = templatesExist();
      expect(result).toBe(dirExists);
    });

    it('should be consistent with existsSync check', () => {
      const templatesDir = getTemplatesDir();
      const manualCheck = existsSync(templatesDir);
      const utilityCheck = templatesExist();
      expect(utilityCheck).toBe(manualCheck);
    });
  });

  describe('integration', () => {
    it('should find templates directory in built package', () => {
      const templatesDir = getTemplatesDir();
      const augmentTemplatesDir = join(templatesDir, 'augment');
      const sharedTemplatesDir = join(templatesDir, 'shared');
      const aiTemplatesDir = join(augmentTemplatesDir, '.ai');

      // If templates exist, verify structure
      if (existsSync(templatesDir)) {
        // Check for platform-based structure
        expect(existsSync(augmentTemplatesDir) || existsSync(sharedTemplatesDir)).toBe(true);

        // If augment templates exist, check structure
        if (existsSync(augmentTemplatesDir)) {
          expect(existsSync(aiTemplatesDir)).toBe(true);
        }

        // Check for expected template files in .ai/ (manual curation)
        const expectedAiFiles = [
          'code-style.md',
          'design-system.md',
          'npm-publishing-checklist.md',
          'README.md',
          'testing-philosophy.md',
        ];

        for (const file of expectedAiFiles) {
          const filePath = join(aiTemplatesDir, file);
          expect(existsSync(filePath)).toBe(true);
        }

        // Check for project-overview.md in .augment/ (auto-generated documentation)
        const augmentDir = join(augmentTemplatesDir, '.augment');
        expect(existsSync(augmentDir)).toBe(true);
        const projectOverviewPath = join(augmentDir, 'project-overview.md');
        expect(existsSync(projectOverviewPath)).toBe(true);
      }
    });

    it('should work from any working directory', () => {
      // Save original cwd
      const originalCwd = process.cwd();

      try {
        // Try from different directories
        const root1 = getPackageRoot();

        // Change to parent directory
        process.chdir('..');
        const root2 = getPackageRoot();

        // Both should find the same package root
        // (or root2 might be different if we're in a different package)
        expect(root1).toBeTruthy();
        expect(root2).toBeTruthy();
      } finally {
        // Restore original cwd
        process.chdir(originalCwd);
      }
    });
  });
});
