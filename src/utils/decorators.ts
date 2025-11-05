/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Decorators for validation and enforcement
 * Phase 3 (Week 3) - Prevention
 *
 * Layer 3: Validation Hooks (Pre/Post)
 * Purpose: Catch violations at operation boundaries
 * Reliability: 85%
 *
 * This module provides decorators for automatic validation of file operations.
 * Decorators wrap methods to add pre-validation, post-validation, and rollback.
 */

import { GuardRails } from '../core/GuardRails.js';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import type { Result } from '../types/index.js';

/**
 * ValidateWrite decorator (async version)
 *
 * Wraps an async method to validate write operations before and after execution.
 *
 * Pre-validation:
 * - Checks if path is allowed for writing
 * - Blocks operation if validation fails
 *
 * Post-validation:
 * - Verifies file was written correctly
 * - Validates file format (JSON, AICF)
 * - Rolls back on validation failure
 *
 * Usage:
 * ```typescript
 * class MyWriter {
 *   @ValidateWrite
 *   async writeFile(path: string, content: string): Promise<Result<void>> {
 *     // Write logic here
 *   }
 * }
 * ```
 *
 * @param target - Class prototype
 * @param propertyKey - Method name
 * @param descriptor - Property descriptor
 * @returns Modified property descriptor
 */
export function ValidateWrite(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = async function (this: any, ...args: unknown[]): Promise<Result<unknown>> {
    // Extract path from first argument (convention: path is always first)
    const path = args[0];

    if (typeof path !== 'string') {
      throw new Error(`@ValidateWrite: First argument must be a string path (got ${typeof path})`);
    }

    // PRE-VALIDATION: Check if write is allowed
    const validation = GuardRails.enforceSync('write', path);
    if (!validation.ok) {
      console.error(`[${propertyKey}] Write validation failed: ${validation.error.message}`);
      return validation; // Return the error Result
    }

    // EXECUTE: Call original method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await originalMethod.apply(this, args as any[]);

    // POST-VALIDATION: Verify file was written correctly
    if (result.ok && existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8');

        // Validate format based on file extension
        if (path.endsWith('.json')) {
          // Validate JSON format
          try {
            JSON.parse(content);
          } catch {
            console.error(`[${propertyKey}] Post-write validation failed: Invalid JSON`);
            unlinkSync(path); // Rollback
            return {
              ok: false,
              error: new Error(`Invalid JSON written to ${path}`),
            } as Result<unknown>;
          }
        } else if (path.endsWith('.aicf')) {
          // Validate AICF format (basic check: should have pipe-delimited structure)
          if (!content.includes('|')) {
            console.error(`[${propertyKey}] Post-write validation failed: Invalid AICF format`);
            unlinkSync(path); // Rollback
            return {
              ok: false,
              error: new Error(`Invalid AICF format written to ${path}`),
            } as Result<unknown>;
          }
        }

        // Additional validation: Check file size (warn if > 10MB)
        const { statSync } = await import('fs');
        const stats = statSync(path);
        if (stats.size > 10 * 1024 * 1024) {
          console.warn(
            `[${propertyKey}] Warning: Large file written (${(stats.size / 1024 / 1024).toFixed(2)}MB): ${path}`
          );
        }
      } catch (error) {
        console.error(`[${propertyKey}] Post-write validation error:`, error);
        // Don't rollback on validation errors (file might be valid)
      }
    }

    return result;
  };

  return descriptor;
}

/**
 * ValidateWriteSync decorator (synchronous version)
 *
 * Wraps a synchronous method to validate write operations before and after execution.
 *
 * Pre-validation:
 * - Checks if path is allowed for writing
 * - Blocks operation if validation fails
 *
 * Post-validation:
 * - Verifies file was written correctly
 * - Validates file format (JSON, AICF)
 * - Rolls back on validation failure
 *
 * Usage:
 * ```typescript
 * class MyWriter {
 *   @ValidateWriteSync
 *   writeFile(path: string, content: string): WriteResult {
 *     // Write logic here
 *   }
 * }
 * ```
 *
 * @param target - Class prototype
 * @param propertyKey - Method name
 * @param descriptor - Property descriptor
 * @returns Modified property descriptor
 */
export function ValidateWriteSync(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = function (this: any, ...args: unknown[]): unknown {
    // Extract path from first argument (convention: path is always first)
    const path = args[0];

    if (typeof path !== 'string') {
      throw new Error(
        `@ValidateWriteSync: First argument must be a string path (got ${typeof path})`
      );
    }

    // PRE-VALIDATION: Check if write is allowed
    const validation = GuardRails.enforceSync('write', path);
    if (!validation.ok) {
      console.error(`[${propertyKey}] Write validation failed: ${validation.error.message}`);
      // Return error in WriteResult format
      return {
        ok: false,
        error: validation.error.message,
      };
    }

    // EXECUTE: Call original method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = originalMethod.apply(this, args as any[]);

    // POST-VALIDATION: Verify file was written correctly
    if (result.ok && existsSync(path)) {
      try {
        const content = readFileSync(path, 'utf-8');

        // Validate format based on file extension
        if (path.endsWith('.json')) {
          // Validate JSON format
          try {
            JSON.parse(content);
          } catch {
            console.error(`[${propertyKey}] Post-write validation failed: Invalid JSON`);
            unlinkSync(path); // Rollback
            return {
              ok: false,
              error: `Invalid JSON written to ${path}`,
            };
          }
        } else if (path.endsWith('.aicf')) {
          // Validate AICF format (basic check: should have pipe-delimited structure)
          if (!content.includes('|')) {
            console.error(`[${propertyKey}] Post-write validation failed: Invalid AICF format`);
            unlinkSync(path); // Rollback
            return {
              ok: false,
              error: `Invalid AICF format written to ${path}`,
            };
          }
        }

        // Additional validation: Check file size (warn if > 10MB)
        const { statSync: fsStatSync } = require('fs') as typeof import('fs');
        const stats = fsStatSync(path);
        if (stats.size > 10 * 1024 * 1024) {
          console.warn(
            `[${propertyKey}] Warning: Large file written (${(stats.size / 1024 / 1024).toFixed(2)}MB): ${path}`
          );
        }
      } catch (error) {
        console.error(`[${propertyKey}] Post-write validation error:`, error);
        // Don't rollback on validation errors (file might be valid)
      }
    }

    return result;
  };

  return descriptor;
}

/**
 * ValidateRead decorator
 *
 * Wraps a method to validate read operations before execution.
 *
 * Pre-validation:
 * - Checks if path is allowed for reading
 * - Blocks operation if validation fails
 *
 * Usage:
 * ```typescript
 * class MyReader {
 *   @ValidateRead
 *   async readFile(path: string): Promise<Result<string>> {
 *     // Read logic here
 *   }
 * }
 * ```
 *
 * @param target - Class prototype
 * @param propertyKey - Method name
 * @param descriptor - Property descriptor
 * @returns Modified property descriptor
 */
export function ValidateRead(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = async function (this: any, ...args: unknown[]): Promise<Result<unknown>> {
    // Extract path from first argument
    const path = args[0];

    if (typeof path !== 'string') {
      throw new Error(`@ValidateRead: First argument must be a string path (got ${typeof path})`);
    }

    // PRE-VALIDATION: Check if read is allowed
    const validation = GuardRails.enforceSync('read', path);
    if (!validation.ok) {
      console.error(`[${propertyKey}] Read validation failed: ${validation.error.message}`);
      return validation; // Return the error Result
    }

    // EXECUTE: Call original method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await originalMethod.apply(this, args as any[]);
  };

  return descriptor;
}

/**
 * ValidateDelete decorator
 *
 * Wraps a method to validate delete operations before execution.
 *
 * Pre-validation:
 * - Checks if path is allowed for deletion
 * - Blocks operation if validation fails
 *
 * Usage:
 * ```typescript
 * class MyDeleter {
 *   @ValidateDelete
 *   async deleteFile(path: string): Promise<Result<void>> {
 *     // Delete logic here
 *   }
 * }
 * ```
 *
 * @param target - Class prototype
 * @param propertyKey - Method name
 * @param descriptor - Property descriptor
 * @returns Modified property descriptor
 */
export function ValidateDelete(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptor.value = async function (this: any, ...args: unknown[]): Promise<Result<unknown>> {
    // Extract path from first argument
    const path = args[0];

    if (typeof path !== 'string') {
      throw new Error(`@ValidateDelete: First argument must be a string path (got ${typeof path})`);
    }

    // PRE-VALIDATION: Check if delete is allowed
    const validation = GuardRails.enforceSync('delete', path);
    if (!validation.ok) {
      console.error(`[${propertyKey}] Delete validation failed: ${validation.error.message}`);
      return validation; // Return the error Result
    }

    // EXECUTE: Call original method
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await originalMethod.apply(this, args as any[]);
  };

  return descriptor;
}
