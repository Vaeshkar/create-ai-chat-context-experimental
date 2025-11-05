/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Path Validator
 * Enforces file protection rules at code level
 * Implements Layer 2 (Code Guards) from LLM-ENFORCE-RULES-DESIGN.md
 *
 * Purpose: Deterministic enforcement of file protection rules
 * - Blocks writes to protected .ai/ files
 * - Validates file formats for .lill/ directory
 * - Provides clear error messages with rule references
 */

import { Result, Ok, Err } from '../types/index.js';
import { normalize, relative } from 'path';

/**
 * Rule definition for path validation
 */
interface ValidationRule {
  name: string;
  check: (path: string, content?: string) => boolean;
  error: string;
  ruleDoc: string; // Reference to rule documentation
}

/**
 * PathValidator - Enforces file protection rules
 *
 * Rules enforced:
 * 1. protected-ai-files: Never write to .ai/ directory
 * 2. lill-format-only: Only AICF/JSON formats in .lill/
 * 3. no-root-clutter: Don't write data files to project root
 */
export class PathValidator {
  /**
   * Protected paths that should never be written to automatically
   */
  private static readonly PROTECTED_PATHS = [
    '.ai/',
    '.ai/code-style.md',
    '.ai/design-system.md',
    '.ai/npm-publishing-checklist.md',
    '.ai/Testing-philosophy.md',
    '.ai/conversation-log.md',
    '.ai/project-security.md',
  ];

  /**
   * Allowed file extensions in .lill/ directory
   */
  private static readonly LILL_ALLOWED_EXTENSIONS = ['.aicf', '.json', '.log', '.pid'];

  /**
   * Validation rules
   */
  private static readonly RULES: ValidationRule[] = [
    {
      name: 'protected-ai-files',
      check: (path: string) => {
        const normalizedPath = normalize(path);
        return !PathValidator.PROTECTED_PATHS.some(
          (protectedPath) =>
            normalizedPath.includes(normalize(protectedPath)) ||
            normalizedPath.startsWith(normalize(protectedPath))
        );
      },
      error: 'Cannot write to protected .ai/ directory',
      ruleDoc: '.augment/rules/protected-ai-files.md',
    },
    {
      name: 'lill-format-only',
      check: (path: string) => {
        const normalizedPath = normalize(path);
        // Only check files in .lill/ directory
        if (!normalizedPath.includes(normalize('.lill/'))) {
          return true; // Not in .lill/, skip this rule
        }

        // Check if file has allowed extension
        return PathValidator.LILL_ALLOWED_EXTENSIONS.some((ext) => normalizedPath.endsWith(ext));
      },
      error: 'Only AICF, JSON, and log files allowed in .lill/ directory',
      ruleDoc: '.augment/rules/protected-ai-files.md',
    },
    {
      name: 'no-root-clutter',
      check: (path: string) => {
        const normalizedPath = normalize(path);
        // Allow specific root files
        const allowedRootFiles = [
          'README.md',
          'PRIVACY.md',
          'SECURITY.md',
          'RELEASE-NOTES.md',
          'INSTALLATION-GUIDE.md',
          'LICENSE',
          '.gitignore',
          '.aether-health.json',
        ];

        // Check if it's a root-level file (no directory separator after normalization)
        const relativePath = relative(process.cwd(), normalizedPath);
        const isRootLevel = !relativePath.includes('/') && !relativePath.includes('\\');

        if (!isRootLevel) {
          return true; // Not root level, allow
        }

        // Check if it's an allowed root file
        return allowedRootFiles.some((allowed) => relativePath === allowed);
      },
      error: 'Data files should go in .lill/ directory, not project root',
      ruleDoc: '.augment/rules/cleanup-after-completion.md',
    },
  ];

  /**
   * Validate a write operation
   * @param path - File path to validate
   * @param content - Optional file content to validate
   * @returns Result with error if validation fails
   */
  static validateWrite(path: string, content?: string): Result<void> {
    for (const rule of PathValidator.RULES) {
      if (!rule.check(path, content)) {
        const errorMessage = [
          `🚨 RULE VIOLATION: [${rule.name}]`,
          ``,
          `${rule.error}`,
          ``,
          `Path: ${path}`,
          `Rule: See ${rule.ruleDoc}`,
          ``,
          `This write operation has been BLOCKED.`,
        ].join('\n');

        return Err(new Error(errorMessage));
      }
    }

    return Ok(undefined);
  }

  /**
   * Validate a read operation
   * Currently allows all reads, but can be extended for read restrictions
   * @param _path - File path to validate (unused, prefixed with _ to indicate intentional)
   * @returns Result with error if validation fails
   */
  static validateRead(_path: string): Result<void> {
    // Currently no read restrictions
    // Can be extended in the future for sensitive files
    return Ok(undefined);
  }

  /**
   * Check if a path is protected
   * @param path - File path to check
   * @returns true if path is protected
   */
  static isProtected(path: string): boolean {
    const normalizedPath = normalize(path);
    return PathValidator.PROTECTED_PATHS.some(
      (protectedPath) =>
        normalizedPath.includes(normalize(protectedPath)) ||
        normalizedPath.startsWith(normalize(protectedPath))
    );
  }

  /**
   * Get the rule that would block a path
   * @param path - File path to check
   * @returns Rule name if blocked, null if allowed
   */
  static getBlockingRule(path: string): string | null {
    for (const rule of PathValidator.RULES) {
      if (!rule.check(path)) {
        return rule.name;
      }
    }
    return null;
  }

  /**
   * Get all protected paths
   * @returns Array of protected paths
   */
  static getProtectedPaths(): string[] {
    return [...PathValidator.PROTECTED_PATHS];
  }

  /**
   * Get allowed extensions for .lill/ directory
   * @returns Array of allowed extensions
   */
  static getLillAllowedExtensions(): string[] {
    return [...PathValidator.LILL_ALLOWED_EXTENSIONS];
  }
}
