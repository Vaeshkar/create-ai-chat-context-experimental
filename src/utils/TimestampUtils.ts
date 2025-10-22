/**
 * Timestamp Utilities
 * Consistent timestamp parsing and formatting
 * October 2025
 */

/**
 * Parse timestamp from various formats to ISO 8601
 */
export function parseTimestamp(timestamp: string | undefined): string {
  if (!timestamp) {
    return getCurrentTimestamp();
  }

  try {
    // Try "YYYY-MM-DD HH:MM:SS" format (Claude export)
    if (timestamp.includes(' ') && !timestamp.includes('T')) {
      const date = new Date(timestamp.replace(' ', 'T'));
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // Try ISO 8601 format
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }

    // Try Unix timestamp (milliseconds)
    const num = Number(timestamp);
    if (!isNaN(num) && num > 0) {
      return new Date(num).toISOString();
    }

    // Fallback
    return getCurrentTimestamp();
  } catch {
    return getCurrentTimestamp();
  }
}

/**
 * Convert timestamp to ISO 8601
 */
export function toISO8601(timestamp: string): string {
  return parseTimestamp(timestamp);
}

/**
 * Get current timestamp in ISO 8601
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}
