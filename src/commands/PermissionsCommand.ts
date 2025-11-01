/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Permissions Command
 * Manage platform consent and permissions
 *
 * Usage:
 *   aice permissions list
 *   aice permissions revoke <platform>
 *   aice permissions grant <platform>
 */

import chalk from 'chalk';
import { PermissionManager, type PlatformName } from '../core/PermissionManager.js';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface PermissionsCommandOptions {
  cwd?: string;
}

/**
 * Permissions command for managing platform consent
 */
export class PermissionsCommand {
  private cwd: string;
  private permissionManager: PermissionManager;

  constructor(options: PermissionsCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.permissionManager = new PermissionManager(this.cwd);
  }

  /**
   * Execute permissions command
   */
  async execute(action: string, platform?: string): Promise<Result<void>> {
    try {
      // Load permissions first
      const loadResult = await this.permissionManager.load();
      if (!loadResult.ok) {
        return Err(new Error('No permissions file found. Run "aether init" first.'));
      }

      switch (action) {
        case 'list':
          return this.listPermissions();
        case 'revoke':
          if (!platform) {
            return Err(new Error('Platform name required for revoke action'));
          }
          return this.revokePermission(platform as PlatformName);
        case 'grant':
          if (!platform) {
            return Err(new Error('Platform name required for grant action'));
          }
          return this.grantPermission(platform as PlatformName);
        default:
          return Err(new Error(`Unknown action: ${action}`));
      }
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Permissions command failed: ${String(error)}`)
      );
    }
  }

  /**
   * List all platform permissions
   */
  private async listPermissions(): Promise<Result<void>> {
    try {
      console.log();
      console.log(chalk.cyan('📋 Platform Permissions'));
      console.log();

      const platforms: PlatformName[] = ['augment', 'warp', 'claude-desktop', 'copilot', 'chatgpt'];

      for (const platform of platforms) {
        const result = this.permissionManager.getPermission(platform);
        if (result.ok) {
          const perm = result.value;
          const statusIcon = perm.status === 'active' ? '✅' : '❌';
          const consentType = perm.consent === 'explicit' ? '(explicit)' : `(${perm.consent})`;
          console.log(
            `${statusIcon} ${platform.padEnd(15)} ${perm.status.padEnd(10)} ${consentType}`
          );
          if (perm.revokedAt) {
            console.log(chalk.gray(`   Revoked at: ${perm.revokedAt}`));
          }
        }
      }

      console.log();
      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to list permissions: ${String(error)}`)
      );
    }
  }

  /**
   * Revoke permission for a platform
   */
  private async revokePermission(platform: PlatformName): Promise<Result<void>> {
    try {
      const result = await this.permissionManager.revokePermission(platform);
      if (!result.ok) {
        return result;
      }

      console.log();
      console.log(chalk.yellow(`🔒 Revoked permission for ${platform}`));
      console.log(chalk.gray('   The system will no longer access this platform'));
      console.log();

      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to revoke permission: ${String(error)}`)
      );
    }
  }

  /**
   * Grant permission for a platform
   */
  private async grantPermission(platform: PlatformName): Promise<Result<void>> {
    try {
      const result = await this.permissionManager.grantPermission(platform, 'explicit');
      if (!result.ok) {
        return result;
      }

      console.log();
      console.log(chalk.green(`🔓 Granted permission for ${platform}`));
      console.log(chalk.gray('   The system can now access this platform'));
      console.log();

      return Ok(undefined);
    } catch (error) {
      return Err(
        error instanceof Error ? error : new Error(`Failed to grant permission: ${String(error)}`)
      );
    }
  }
}
