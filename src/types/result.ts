/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Result type for type-safe error handling
 * Following code-style.md - No throwing errors
 * Phase 2: TypeScript rewrite - October 2025
 */

/**
 * Result type - either success with value or failure with error
 * Usage: const result = someFunction();
 *        if (result.ok) { console.log(result.value); }
 *        else { console.error(result.error); }
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

/**
 * Create a success result
 */
export function Ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Create an error result
 */
export function Err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Helper to check if result is ok
 */
export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

/**
 * Helper to check if result is error
 */
export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}
