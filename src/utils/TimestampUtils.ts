/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Timestamp Utilities
 * Consistent timestamp parsing and formatting
 * October 2025
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

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

/**
 * Get the last timestamp from the most recent raw JSON conversation file
 * Used for resuming watcher after downtime (continuous data collection)
 *
 * @param rawDir - Path to .aicf/raw/ directory
 * @returns ISO timestamp of the last saved conversation, or null if no files exist
 */
export function getLastTimestamp(rawDir: string): string | null {
  try {
    if (!existsSync(rawDir)) {
      return null;
    }

    // Get all JSON files sorted by modification time (newest first)
    const files = readdirSync(rawDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => ({
        name: f,
        path: join(rawDir, f),
        mtime: existsSync(join(rawDir, f)) ? statSync(join(rawDir, f)).mtime.getTime() : 0,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length === 0) {
      return null;
    }

    // Read the most recent file
    const latestFile = files[0];
    if (!latestFile) {
      return null;
    }

    const content = readFileSync(latestFile.path, 'utf-8');
    const conversation = JSON.parse(content);

    // Extract timestamp_end from metadata
    if (conversation.metadata && conversation.metadata.timestamp_end) {
      return conversation.metadata.timestamp_end;
    }

    // Fallback: use the last decision or key_exchange timestamp
    if (conversation.decisions && conversation.decisions.length > 0) {
      const lastDecision = conversation.decisions[conversation.decisions.length - 1];
      if (lastDecision && lastDecision.timestamp) {
        return lastDecision.timestamp;
      }
    }

    if (conversation.key_exchanges && conversation.key_exchanges.length > 0) {
      const lastExchange = conversation.key_exchanges[conversation.key_exchanges.length - 1];
      if (lastExchange && lastExchange.timestamp) {
        return lastExchange.timestamp;
      }
    }

    // No timestamp found
    return null;
  } catch (error) {
    console.warn(`Failed to get last timestamp: ${error}`);
    return null;
  }
}

/**
 * Calculate time difference in minutes
 */
export function getTimeDifferenceMinutes(start: string, end: string): number {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return Math.round((endDate.getTime() - startDate.getTime()) / 1000 / 60);
  } catch {
    return 0;
  }
}
