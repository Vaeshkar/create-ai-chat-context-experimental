/**
 * Error Utilities
 * Consistent error handling across parsers and watchers
 * October 2025
 */

import { ExtractionError } from '../types/index.js';
import type { Result } from '../types/index.js';
import { Ok, Err } from '../types/index.js';

/**
 * Handle error consistently
 */
export function handleError(error: unknown, context: string): ExtractionError {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return new ExtractionError(`${context}: ${message}`, error);
}

/**
 * Wrap operation in Result type
 */
export function wrapResult<T>(fn: () => T, context: string): Result<T> {
  try {
    const result = fn();
    return Ok(result);
  } catch (error) {
    return Err(handleError(error, context));
  }
}

/**
 * Wrap async operation in Result type
 */
export async function wrapAsyncResult<T>(
  fn: () => Promise<T>,
  context: string
): Promise<Result<T>> {
  try {
    const result = await fn();
    return Ok(result);
  } catch (error) {
    return Err(handleError(error, context));
  }
}

/**
 * Get error message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

