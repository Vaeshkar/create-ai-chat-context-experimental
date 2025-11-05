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

import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
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
 *
 * Supports glob patterns:
 * - * matches any characters except /
 * - ** matches any characters including /
 * - ? matches exactly one character except /
 *
 * Examples:
 * - .ai/**\/* matches .ai/file.md and .ai/dir/file.md
 * - .ai/*.md matches .ai/file.md but not .ai/dir/file.md
 */
export class PathValidator {
  /**
   * Protected paths that should never be written to automatically
   * Supports glob patterns
   */
  private static readonly PROTECTED_PATHS = [
    '.ai/*', // All files directly in .ai/ directory
    '.ai/**/*', // All files in .ai/ subdirectories (recursive)
    '.augment/project-overview.md', // Auto-generated, don't manually edit
  ];

  /**
   * Compiled regex patterns for protected paths (cached)
   */
  private static protectedPatterns: RegExp[] | null = null;

  /**
   * Allowed file extensions in .lill/ directory
   */
  private static readonly LILL_ALLOWED_EXTENSIONS = ['.aicf', '.json', '.log', '.pid'];

  /**
   * Convert glob pattern to regex
   * Supports: *, **, ?
   *
   * Algorithm:
   * 1. Replace glob wildcards with unique placeholders (before escaping)
   * 2. Escape special regex characters
   * 3. Convert placeholders to regex patterns
   * 4. Anchor the pattern
   *
   * @param pattern - Glob pattern (e.g., ".ai/**\/*")
   * @returns RegExp that matches the pattern
   */
  private static globToRegex(pattern: string): RegExp {
    // First, handle glob wildcards (before escaping)
    // Use unique placeholders that won't conflict with escaped chars
    let regex = pattern
      .replace(/\*\*\//g, '§GLOBSTAR_SLASH§') // **/ matches zero or more directories
      .replace(/\*\*/g, '§GLOBSTAR§') // ** matches anything
      .replace(/\*/g, '§STAR§') // * matches anything except /
      .replace(/\?/g, '§QUESTION§'); // ? matches single char except /

    // Now escape special regex characters
    regex = regex
      .replace(/\./g, '\\.') // Escape dots
      .replace(/\+/g, '\\+') // Escape plus
      .replace(/\^/g, '\\^') // Escape caret
      .replace(/\$/g, '\\$') // Escape dollar
      .replace(/\(/g, '\\(') // Escape parens
      .replace(/\)/g, '\\)')
      .replace(/\[/g, '\\[') // Escape brackets
      .replace(/\]/g, '\\]')
      .replace(/\{/g, '\\{') // Escape braces
      .replace(/\}/g, '\\}')
      .replace(/\|/g, '\\|'); // Escape pipe

    // Convert placeholders to regex patterns
    regex = regex
      .replace(/§GLOBSTAR_SLASH§/g, '(?:.*/)?') // **/ matches zero or more directories (optional)
      .replace(/§GLOBSTAR§/g, '.*') // ** matches anything including /
      .replace(/§STAR§/g, '[^/]*') // * matches anything except /
      .replace(/§QUESTION§/g, '[^/]'); // ? matches single char except /

    // Match pattern anywhere in the path (not anchored to start)
    // This allows matching .ai/test.md in paths like /tmp/.test-decorators/.ai/test.md
    return new RegExp(`(^|/)${regex}$`);
  }

  /**
   * Get compiled regex patterns for protected paths (lazy initialization)
   */
  private static getProtectedPatterns(): RegExp[] {
    if (!PathValidator.protectedPatterns) {
      PathValidator.protectedPatterns = PathValidator.PROTECTED_PATHS.map((p) =>
        PathValidator.globToRegex(p)
      );
    }
    return PathValidator.protectedPatterns;
  }

  /**
   * Validation rules
   */
  private static readonly RULES: ValidationRule[] = [
    {
      name: 'protected-ai-files',
      check: (path: string) => {
        const normalizedPath = normalize(path);
        const patterns = PathValidator.getProtectedPatterns();
        // Check if path matches any protected pattern (using glob matching)
        return !patterns.some((pattern) => pattern.test(normalizedPath));
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
   * Check if a path is protected (using glob pattern matching)
   * @param path - File path to check
   * @returns true if path is protected
   */
  static isProtected(path: string): boolean {
    const normalizedPath = normalize(path);
    const patterns = PathValidator.getProtectedPatterns();
    return patterns.some((pattern) => pattern.test(normalizedPath));
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

  /**
   * Get the violated rule message for a path (Guardian compatibility)
   * @param filePath - File path to check
   * @returns Human-readable rule violation message
   */
  static getViolatedRule(filePath: string): string {
    if (filePath.includes('.ai/')) {
      return 'Protected .ai/ folder - manual edits only';
    }
    if (filePath.includes('.augment/project-overview.md')) {
      return 'Auto-generated file - do not manually edit';
    }
    if (filePath.includes('.aether-health.json')) {
      return 'System health file - automated updates only';
    }
    return 'Protected file';
  }
}
