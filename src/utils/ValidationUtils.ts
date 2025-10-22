/**
 * Validation Utilities
 * Common validation functions for parsers
 * October 2025
 */

import type { Message } from '../types/index.js';

/**
 * Validate content is not empty
 */
export function isValidContent(content: unknown): boolean {
  if (typeof content === 'string') {
    return content.trim().length > 0;
  }
  return false;
}

/**
 * Validate message structure
 */
export function isValidMessage(msg: unknown): msg is Message {
  if (typeof msg !== 'object' || msg === null) {
    return false;
  }

  const m = msg as Record<string, unknown>;

  return (
    typeof m['id'] === 'string' &&
    typeof m['conversationId'] === 'string' &&
    typeof m['timestamp'] === 'string' &&
    (m['role'] === 'user' || m['role'] === 'assistant') &&
    typeof m['content'] === 'string'
  );
}

/**
 * Validate array is not empty
 */
export function isValidArray<T>(arr: unknown): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

/**
 * Validate object structure
 */
export function isValidObject(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

/**
 * Validate string is not empty
 */
export function isValidString(str: unknown): str is string {
  return typeof str === 'string' && str.trim().length > 0;
}
