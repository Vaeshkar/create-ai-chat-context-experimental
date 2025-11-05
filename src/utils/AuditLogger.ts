/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Audit Logger
 * Logs rule violations and compliance for monitoring
 * Implements Layer 5 (Audit & Detection) from LLM-ENFORCE-RULES-DESIGN.md
 *
 * Purpose: Monitor compliance and detect violations
 * - Log all rule violations with stack traces
 * - Log successful compliance for metrics
 * - Provide audit trail for debugging
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Audit log entry
 */
interface AuditEntry {
  timestamp: string;
  level: 'VIOLATION' | 'COMPLIANT' | 'WARNING';
  rule: string;
  path: string;
  operation: 'read' | 'write' | 'delete';
  message?: string;
  stack?: string;
}

/**
 * AuditLogger - Logs rule violations and compliance
 */
export class AuditLogger {
  private logFile: string;
  private cwd: string;

  constructor(cwd: string = process.cwd()) {
    this.cwd = cwd;
    this.logFile = join(cwd, '.lill', '.audit.log');
  }

  /**
   * Log a rule violation
   * @param rule - Rule name that was violated
   * @param path - File path involved
   * @param operation - Operation attempted
   * @param message - Optional additional message
   */
  async logViolation(
    rule: string,
    path: string,
    operation: 'read' | 'write' | 'delete',
    message?: string
  ): Promise<void> {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      level: 'VIOLATION',
      rule,
      path,
      operation,
      message,
      stack: new Error().stack,
    };

    await this.writeEntry(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.error(`🚨 RULE VIOLATION: [${rule}] ${path}`);
      if (message) {
        console.error(`   ${message}`);
      }
    }
  }

  /**
   * Log successful compliance
   * @param rule - Rule name that was followed
   * @param path - File path involved
   * @param operation - Operation performed
   */
  async logCompliance(
    rule: string,
    path: string,
    operation: 'read' | 'write' | 'delete'
  ): Promise<void> {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      level: 'COMPLIANT',
      rule,
      path,
      operation,
    };

    await this.writeEntry(entry);
  }

  /**
   * Log a warning (not a violation, but noteworthy)
   * @param rule - Rule name
   * @param path - File path involved
   * @param operation - Operation performed
   * @param message - Warning message
   */
  async logWarning(
    rule: string,
    path: string,
    operation: 'read' | 'write' | 'delete',
    message: string
  ): Promise<void> {
    const entry: AuditEntry = {
      timestamp: new Date().toISOString(),
      level: 'WARNING',
      rule,
      path,
      operation,
      message,
    };

    await this.writeEntry(entry);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
      console.warn(`⚠️  RULE WARNING: [${rule}] ${path}`);
      console.warn(`   ${message}`);
    }
  }

  /**
   * Write an entry to the audit log
   * @param entry - Audit entry to write
   */
  private async writeEntry(entry: AuditEntry): Promise<void> {
    try {
      // Ensure .lill directory exists
      const lillDir = join(this.cwd, '.lill');
      if (!existsSync(lillDir)) {
        await fs.mkdir(lillDir, { recursive: true });
      }

      // Append entry as JSON line
      const line = JSON.stringify(entry) + '\n';
      await fs.appendFile(this.logFile, line, 'utf-8');
    } catch (error) {
      // Don't throw - audit logging should never break the application
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Read all audit entries
   * @returns Array of audit entries
   */
  async readEntries(): Promise<AuditEntry[]> {
    try {
      if (!existsSync(this.logFile)) {
        return [];
      }

      const content = await fs.readFile(this.logFile, 'utf-8');
      const lines = content.split('\n').filter(Boolean);

      return lines.map((line) => JSON.parse(line) as AuditEntry);
    } catch (error) {
      console.error('Failed to read audit log:', error);
      return [];
    }
  }

  /**
   * Get violations from audit log
   * @param since - Optional timestamp to filter from
   * @returns Array of violation entries
   */
  async getViolations(since?: Date): Promise<AuditEntry[]> {
    const entries = await this.readEntries();

    return entries.filter((entry) => {
      if (entry.level !== 'VIOLATION') {
        return false;
      }

      if (since) {
        const entryTime = new Date(entry.timestamp);
        return entryTime >= since;
      }

      return true;
    });
  }

  /**
   * Get compliance entries from audit log
   * @param since - Optional timestamp to filter from
   * @returns Array of compliance entries
   */
  async getCompliance(since?: Date): Promise<AuditEntry[]> {
    const entries = await this.readEntries();

    return entries.filter((entry) => {
      if (entry.level !== 'COMPLIANT') {
        return false;
      }

      if (since) {
        const entryTime = new Date(entry.timestamp);
        return entryTime >= since;
      }

      return true;
    });
  }

  /**
   * Get compliance rate
   * @param since - Optional timestamp to filter from
   * @returns Compliance rate (0-1)
   */
  async getComplianceRate(since?: Date): Promise<number> {
    const entries = await this.readEntries();

    const filtered = since
      ? entries.filter((entry) => new Date(entry.timestamp) >= since)
      : entries;

    const violations = filtered.filter((e) => e.level === 'VIOLATION').length;
    const compliant = filtered.filter((e) => e.level === 'COMPLIANT').length;

    const total = violations + compliant;
    if (total === 0) {
      return 1.0; // No operations = 100% compliant
    }

    return compliant / total;
  }

  /**
   * Clear audit log
   * WARNING: This deletes all audit history
   */
  async clear(): Promise<void> {
    try {
      if (existsSync(this.logFile)) {
        await fs.unlink(this.logFile);
      }
    } catch (error) {
      console.error('Failed to clear audit log:', error);
    }
  }

  /**
   * Get audit log file path
   * @returns Path to audit log file
   */
  getLogPath(): string {
    return this.logFile;
  }
}
