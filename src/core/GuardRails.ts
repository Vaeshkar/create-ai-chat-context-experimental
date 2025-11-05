/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * GuardRails - Centralized rule enforcement
 * Phase 3 (Week 3) - Prevention
 * 
 * Layer 2: Code Guards (TypeScript)
 * Purpose: Deterministic enforcement at code level
 * Reliability: 95%
 * 
 * This class provides centralized rule enforcement for all file operations.
 * It works alongside PathValidator but provides a higher-level API for
 * operation-level validation (read, write, delete).
 */

import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';
import { PathValidator } from '../utils/PathValidator.js';
import { AuditLogger } from '../utils/AuditLogger.js';

/**
 * Rule definition
 */
interface Rule {
  name: string;
  check: (path: string, content?: string) => boolean;
  error: string;
  ruleDoc: string;
}

/**
 * GuardRails - Centralized rule enforcement
 */
export class GuardRails {
  private static auditLogger: AuditLogger | null = null;

  /**
   * All rules (delegates to PathValidator for consistency)
   */
  private static get RULES(): Rule[] {
    return PathValidator['RULES']; // Access private RULES from PathValidator
  }

  /**
   * Initialize GuardRails with audit logger
   * @param cwd - Current working directory
   */
  static initialize(cwd: string): void {
    GuardRails.auditLogger = new AuditLogger(cwd);
  }

  /**
   * Enforce rules for an operation
   * @param operation - Operation type (read, write, delete)
   * @param path - File path to validate
   * @param content - Optional file content to validate
   * @returns Result with error if validation fails
   */
  static async enforce(
    operation: 'read' | 'write' | 'delete',
    path: string,
    content?: string
  ): Promise<Result<void>> {
    // For write operations, use PathValidator
    if (operation === 'write') {
      const result = PathValidator.validateWrite(path, content);
      
      // Log to audit
      if (GuardRails.auditLogger) {
        if (result.ok) {
          await GuardRails.auditLogger.logCompliance('all-rules', path, operation);
        } else {
          const rule = PathValidator.getBlockingRule(path) || 'unknown';
          await GuardRails.auditLogger.logViolation(
            rule,
            path,
            operation,
            result.error.message
          );
        }
      }
      
      return result;
    }

    // For read/delete operations, check all rules
    for (const rule of GuardRails.RULES) {
      if (!rule.check(path, content)) {
        const errorMessage = [
          `🚨 RULE VIOLATION: [${rule.name}]`,
          ``,
          `${rule.error}`,
          ``,
          `Path: ${path}`,
          `Operation: ${operation}`,
          `Rule: See ${rule.ruleDoc}`,
          ``,
          `This ${operation} operation has been BLOCKED.`,
        ].join('\n');

        // Log violation
        if (GuardRails.auditLogger) {
          await GuardRails.auditLogger.logViolation(
            rule.name,
            path,
            operation,
            errorMessage
          );
        }

        return Err(new Error(errorMessage));
      }
    }

    // Log compliance
    if (GuardRails.auditLogger) {
      await GuardRails.auditLogger.logCompliance('all-rules', path, operation);
    }

    return Ok(undefined);
  }

  /**
   * Synchronous version of enforce (for decorators)
   * @param operation - Operation type (read, write, delete)
   * @param path - File path to validate
   * @param content - Optional file content to validate
   * @returns Result with error if validation fails
   */
  static enforceSync(
    operation: 'read' | 'write' | 'delete',
    path: string,
    content?: string
  ): Result<void> {
    // For write operations, use PathValidator
    if (operation === 'write') {
      return PathValidator.validateWrite(path, content);
    }

    // For read/delete operations, check all rules
    for (const rule of GuardRails.RULES) {
      if (!rule.check(path, content)) {
        const errorMessage = [
          `🚨 RULE VIOLATION: [${rule.name}]`,
          ``,
          `${rule.error}`,
          ``,
          `Path: ${path}`,
          `Operation: ${operation}`,
          `Rule: See ${rule.ruleDoc}`,
          ``,
          `This ${operation} operation has been BLOCKED.`,
        ].join('\n');

        return Err(new Error(errorMessage));
      }
    }

    return Ok(undefined);
  }

  /**
   * Get the rule that would block a path
   * @param path - File path to check
   * @returns Rule name or null if no rule blocks
   */
  static getBlockingRule(path: string): string | null {
    return PathValidator.getBlockingRule(path);
  }

  /**
   * Check if a path is allowed for an operation
   * @param operation - Operation type (read, write, delete)
   * @param path - File path to check
   * @returns true if allowed, false if blocked
   */
  static isAllowed(operation: 'read' | 'write' | 'delete', path: string): boolean {
    const result = GuardRails.enforceSync(operation, path);
    return result.ok;
  }
}

