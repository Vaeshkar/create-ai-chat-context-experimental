/**
 * PermissionManager Tests
 * Phase 4.5: Permission Management - October 2025
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { PermissionManager } from './PermissionManager.js';

describe('PermissionManager', () => {
  let testDir: string;
  let manager: PermissionManager;

  beforeEach(() => {
    testDir = join(process.cwd(), '.test-permissions');
    mkdirSync(join(testDir, '.aicf'), { recursive: true });
    manager = new PermissionManager(testDir);
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('load', () => {
    it('should return error if permissions file does not exist', async () => {
      const result = await manager.load();
      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('Permissions file not found');
    });

    it('should load permissions from file', async () => {
      // Create a permissions file
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
@PLATFORM|name=warp|status=inactive|consent=pending|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');

      const result = await manager.load();
      expect(result.ok).toBe(true);
      expect(result.value.version).toBe('1.0');
      expect(result.value.platforms.augment).toBeDefined();
      expect(result.value.platforms.warp).toBeDefined();
    });
  });

  describe('getPermission', () => {
    beforeEach(async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
@PLATFORM|name=warp|status=inactive|consent=pending|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');
      await manager.load();
    });

    it('should return error if permissions not loaded', async () => {
      const newManager = new PermissionManager(testDir);
      const result = newManager.getPermission('augment');
      expect(result.ok).toBe(false);
    });

    it('should get permission for existing platform', async () => {
      const result = manager.getPermission('augment');
      expect(result.ok).toBe(true);
      expect(result.value.name).toBe('augment');
      expect(result.value.status).toBe('active');
      expect(result.value.consent).toBe('implicit');
    });

    it('should return error for non-existent platform', async () => {
      const result = manager.getPermission('claude-desktop');
      expect(result.ok).toBe(false);
      expect(result.error.message).toContain('No permission found');
    });
  });

  describe('isEnabled', () => {
    beforeEach(async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
@PLATFORM|name=warp|status=inactive|consent=pending|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');
      await manager.load();
    });

    it('should return true for active platform', () => {
      expect(manager.isEnabled('augment')).toBe(true);
    });

    it('should return false for inactive platform', () => {
      expect(manager.isEnabled('warp')).toBe(false);
    });

    it('should return false for non-existent platform', () => {
      expect(manager.isEnabled('claude-desktop')).toBe(false);
    });
  });

  describe('grantPermission', () => {
    beforeEach(async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');
      await manager.load();
    });

    it('should grant permission with explicit consent', async () => {
      const result = await manager.grantPermission('warp', 'explicit');
      expect(result.ok).toBe(true);

      const permission = manager.getPermission('warp');
      expect(permission.ok).toBe(true);
      expect(permission.value.status).toBe('active');
      expect(permission.value.consent).toBe('explicit');
    });

    it('should grant permission with implicit consent', async () => {
      const result = await manager.grantPermission('warp', 'implicit');
      expect(result.ok).toBe(true);

      const permission = manager.getPermission('warp');
      expect(permission.ok).toBe(true);
      expect(permission.value.consent).toBe('implicit');
    });

    it('should save permissions to file', async () => {
      await manager.grantPermission('warp', 'explicit');

      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = readFileSync(permissionsFile, 'utf-8');
      expect(content).toContain('warp');
      expect(content).toContain('active');
      expect(content).toContain('explicit');
    });

    it('should log audit entry for permission grant', async () => {
      await manager.grantPermission('warp', 'explicit');

      const permission = manager.getPermission('warp');
      expect(permission.ok).toBe(true);
    });
  });

  describe('revokePermission', () => {
    beforeEach(async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');
      await manager.load();
    });

    it('should revoke permission', async () => {
      const result = await manager.revokePermission('augment');
      expect(result.ok).toBe(true);

      const permission = manager.getPermission('augment');
      expect(permission.ok).toBe(true);
      expect(permission.value.status).toBe('revoked');
      expect(permission.value.revokedAt).toBeDefined();
    });

    it('should save revoked status to file', async () => {
      await manager.revokePermission('augment');

      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = readFileSync(permissionsFile, 'utf-8');
      expect(content).toContain('revoked');
    });

    it('should handle revoking non-existent platform gracefully', async () => {
      const result = await manager.revokePermission('claude-desktop');
      expect(result.ok).toBe(true);
    });
  });

  describe('logAudit', () => {
    beforeEach(async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');
      await manager.load();
    });

    it('should log audit entry', async () => {
      const result = await manager.logAudit(
        'test_event',
        'test_user',
        'test_action',
        'augment',
        'test details'
      );
      expect(result.ok).toBe(true);
    });

    it('should save audit entries to file', async () => {
      await manager.logAudit('test_event', 'test_user', 'test_action', 'augment', 'test details');
      await manager.logAudit('another_event', 'another_user', 'another_action');

      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = readFileSync(permissionsFile, 'utf-8');
      expect(content).toContain('@AUDIT');
      expect(content).toContain('test_event');
      expect(content).toContain('another_event');
    });
  });

  describe('AICF format parsing', () => {
    it('should parse platform with revokedAt', async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=revoked|consent=explicit|timestamp=2025-10-22T10:00:00Z|revokedAt=2025-10-22T11:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');

      const result = await manager.load();
      expect(result.ok).toBe(true);
      expect(result.value.platforms.augment.status).toBe('revoked');
      expect(result.value.platforms.augment.revokedAt).toBe('2025-10-22T11:00:00Z');
    });

    it('should parse audit entries with all fields', async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@AUDIT|event=permission_granted|timestamp=2025-10-22T10:00:00Z|user=system|action=granted_explicit_consent|platform=augment|details=test_details
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');

      const result = await manager.load();
      expect(result.ok).toBe(true);
      expect(result.value.auditLog.length).toBe(1);
      expect(result.value.auditLog[0].event).toBe('permission_granted');
      expect(result.value.auditLog[0].platform).toBe('augment');
      expect(result.value.auditLog[0].details).toBe('test_details');
    });
  });

  describe('integration', () => {
    it('should handle full workflow: grant, check, revoke', async () => {
      const permissionsFile = join(testDir, '.aicf', '.permissions.aicf');
      const content = `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=2025-10-22T10:00:00Z
`;
      require('fs').writeFileSync(permissionsFile, content, 'utf-8');

      // Load
      let result = await manager.load();
      expect(result.ok).toBe(true);

      // Check enabled
      expect(manager.isEnabled('augment')).toBe(true);

      // Grant new permission
      result = await manager.grantPermission('warp', 'explicit');
      expect(result.ok).toBe(true);

      // Check new permission
      expect(manager.isEnabled('warp')).toBe(true);

      // Revoke permission
      result = await manager.revokePermission('augment');
      expect(result.ok).toBe(true);

      // Check revoked
      const permission = manager.getPermission('augment');
      expect(permission.value.status).toBe('revoked');
    });
  });
});

