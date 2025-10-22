/**
 * Permission Manager
 * Phase 4.5: Permission Management - October 2025
 *
 * Manages platform permissions, consent tracking, and audit logging
 * Reads/writes .aicf/.permissions.aicf file
 */

import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export type PlatformName = 'augment' | 'warp' | 'claude-desktop' | 'copilot' | 'chatgpt';
export type ConsentStatus = 'active' | 'inactive' | 'pending' | 'revoked';

export interface PlatformPermission {
  name: PlatformName;
  status: ConsentStatus;
  consent: 'implicit' | 'explicit' | 'pending';
  timestamp: string;
  revokedAt?: string;
}

export interface PermissionsData {
  version: string;
  platforms: Record<PlatformName, PlatformPermission>;
  auditLog: AuditEntry[];
}

export interface AuditEntry {
  event: string;
  timestamp: string;
  user: string;
  action: string;
  platform?: PlatformName;
  details?: string;
}

/**
 * Permission Manager for tracking platform consent and audit logging
 */
export class PermissionManager {
  private permissionsFile: string;
  private data: PermissionsData | null = null;

  constructor(projectPath: string = process.cwd()) {
    this.permissionsFile = join(projectPath, '.aicf', '.permissions.aicf');
  }

  /**
   * Load permissions from file
   */
  async load(): Promise<Result<PermissionsData>> {
    try {
      if (!existsSync(this.permissionsFile)) {
        return Err(new Error('Permissions file not found'));
      }

      const content = readFileSync(this.permissionsFile, 'utf-8');
      this.data = this.parsePermissionsFile(content);

      return Ok(this.data);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get permission for a platform
   */
  getPermission(platform: PlatformName): Result<PlatformPermission> {
    if (!this.data) {
      return Err(new Error('Permissions not loaded'));
    }

    const permission = this.data.platforms[platform];
    if (!permission) {
      return Err(new Error(`No permission found for platform: ${platform}`));
    }

    return Ok(permission);
  }

  /**
   * Check if platform is enabled
   */
  isEnabled(platform: PlatformName): boolean {
    const result = this.getPermission(platform);
    if (!result.ok) return false;
    return result.value.status === 'active';
  }

  /**
   * Grant permission for a platform
   */
  async grantPermission(
    platform: PlatformName,
    consentType: 'implicit' | 'explicit' = 'explicit'
  ): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Permissions not loaded'));
      }

      this.data.platforms[platform] = {
        name: platform,
        status: 'active',
        consent: consentType,
        timestamp: new Date().toISOString(),
      };

      await this.logAudit(
        'permission_granted',
        'system',
        `Granted ${consentType} consent`,
        platform
      );
      await this.save();

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Revoke permission for a platform
   */
  async revokePermission(platform: PlatformName): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Permissions not loaded'));
      }

      if (this.data.platforms[platform]) {
        this.data.platforms[platform].status = 'revoked';
        this.data.platforms[platform].revokedAt = new Date().toISOString();
      }

      await this.logAudit('permission_revoked', 'system', 'Revoked consent', platform);
      await this.save();

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Log audit entry
   */
  async logAudit(
    event: string,
    user: string,
    action: string,
    platform?: PlatformName,
    details?: string
  ): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('Permissions not loaded'));
      }

      const entry: AuditEntry = {
        event,
        timestamp: new Date().toISOString(),
        user,
        action,
        platform,
        details,
      };

      this.data.auditLog.push(entry);
      await this.save();
      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Save permissions to file
   */
  private async save(): Promise<Result<void>> {
    try {
      if (!this.data) {
        return Err(new Error('No data to save'));
      }

      const content = this.formatPermissionsFile(this.data);
      writeFileSync(this.permissionsFile, content, 'utf-8');

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Parse permissions file (AICF format)
   */
  private parsePermissionsFile(content: string): PermissionsData {
    const lines = content.split('\n').filter((line) => line.trim());
    const platforms: Partial<Record<PlatformName, PlatformPermission>> = {};
    const auditLog: AuditEntry[] = [];

    for (const line of lines) {
      if (line.startsWith('@PLATFORM|')) {
        const platform = this.parsePlatformLine(line);
        if (platform) {
          platforms[platform.name] = platform;
        }
      } else if (line.startsWith('@AUDIT|')) {
        const audit = this.parseAuditLine(line);
        if (audit) {
          auditLog.push(audit);
        }
      }
    }

    return {
      version: '1.0',
      platforms: platforms as Record<PlatformName, PlatformPermission>,
      auditLog,
    };
  }

  /**
   * Parse platform line from AICF format
   */
  private parsePlatformLine(line: string): PlatformPermission | null {
    const parts = line.split('|').slice(1);
    const data: Record<string, string> = {};

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        data[key] = value;
      }
    }

    if (!data['name']) return null;

    return {
      name: data['name'] as PlatformName,
      status: (data['status'] as ConsentStatus) || 'inactive',
      consent: (data['consent'] as 'implicit' | 'explicit' | 'pending') || 'pending',
      timestamp: data['timestamp'] || new Date().toISOString(),
      revokedAt: data['revokedAt'],
    };
  }

  /**
   * Parse audit line from AICF format
   */
  private parseAuditLine(line: string): AuditEntry | null {
    const parts = line.split('|').slice(1);
    const data: Record<string, string> = {};

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        data[key] = value;
      }
    }

    return {
      event: data['event'] || '',
      timestamp: data['timestamp'] || new Date().toISOString(),
      user: data['user'] || 'unknown',
      action: data['action'] || '',
      platform: data['platform'] as PlatformName | undefined,
      details: data['details'],
    };
  }

  /**
   * Format permissions data as AICF
   */
  private formatPermissionsFile(data: PermissionsData): string {
    let content = `@PERMISSIONS|version=${data.version}|format=aicf\n`;

    for (const platform of Object.values(data.platforms)) {
      content += `@PLATFORM|name=${platform.name}|status=${platform.status}|consent=${platform.consent}|timestamp=${platform.timestamp}`;
      if (platform.revokedAt) {
        content += `|revokedAt=${platform.revokedAt}`;
      }
      content += '\n';
    }

    for (const audit of data.auditLog) {
      content += `@AUDIT|event=${audit.event}|timestamp=${audit.timestamp}|user=${audit.user}|action=${audit.action}`;
      if (audit.platform) {
        content += `|platform=${audit.platform}`;
      }
      if (audit.details) {
        content += `|details=${audit.details}`;
      }
      content += '\n';
    }

    return content;
  }
}
