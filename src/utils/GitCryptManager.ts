/**
 * This file is part of AETHER.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Git-Crypt Manager
 * Handles encryption setup for .lill/ directory using git-crypt
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import chalk from 'chalk';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface GitCryptSetupResult {
  installed: boolean;
  initialized: boolean;
  keyExported: boolean;
  keyPath?: string;
  gitattributesUpdated: boolean;
  gitignoreUpdated: boolean;
}

export class GitCryptManager {
  constructor(private cwd: string) {}

  /**
   * Check if git-crypt is installed
   */
  isInstalled(): boolean {
    try {
      execSync('which git-crypt', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if git-crypt is already initialized in this repo
   */
  isInitialized(): boolean {
    try {
      const gitDir = join(this.cwd, '.git');
      const gitCryptDir = join(gitDir, 'git-crypt');
      return existsSync(gitCryptDir);
    } catch {
      return false;
    }
  }

  /**
   * Install git-crypt (macOS only for now)
   */
  async install(): Promise<Result<void>> {
    try {
      console.log(chalk.cyan('📦 Installing git-crypt...'));
      console.log(chalk.dim('  Using Homebrew...'));

      execSync('brew install git-crypt', {
        cwd: this.cwd,
        stdio: 'inherit',
      });

      console.log(chalk.green('✓ git-crypt installed successfully'));
      return Ok(undefined);
    } catch (error) {
      return Err(
        new Error(
          `Failed to install git-crypt: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  /**
   * Initialize git-crypt in the repository
   */
  async initialize(): Promise<Result<void>> {
    try {
      console.log(chalk.cyan('🔐 Initializing git-crypt...'));

      execSync('git-crypt init', {
        cwd: this.cwd,
        stdio: 'pipe',
      });

      console.log(chalk.green('✓ git-crypt initialized'));
      return Ok(undefined);
    } catch (error) {
      return Err(
        new Error(
          `Failed to initialize git-crypt: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  /**
   * Export encryption key to a safe location
   */
  async exportKey(): Promise<Result<string>> {
    try {
      // Create .aether-keys directory in user's home
      const homeDir = process.env['HOME'] || process.env['USERPROFILE'] || '';
      const keysDir = join(homeDir, '.aether-keys');

      if (!existsSync(keysDir)) {
        mkdirSync(keysDir, { recursive: true });
      }

      // Generate key filename based on project name
      const projectName = this.getProjectName();
      const keyPath = join(keysDir, `${projectName}-git-crypt-key`);

      console.log(chalk.cyan('🔑 Exporting encryption key...'));
      console.log(chalk.dim(`  Key will be saved to: ${keyPath}`));

      execSync(`git-crypt export-key "${keyPath}"`, {
        cwd: this.cwd,
        stdio: 'pipe',
      });

      console.log(chalk.green('✓ Encryption key exported'));
      console.log();
      console.log(chalk.yellow('⚠️  IMPORTANT: Store this key safely!'));
      console.log(chalk.dim('  1. Add to password manager (1Password, Bitwarden, etc.)'));
      console.log(chalk.dim('  2. Print and store in safe'));
      console.log(chalk.dim('  3. Copy to USB drive (encrypted)'));
      console.log(chalk.dim('  4. Share with team members (secure channel only)'));
      console.log();
      console.log(chalk.red('  ⚠️  If you lose this key, your data is UNRECOVERABLE!'));

      return Ok(keyPath);
    } catch (error) {
      return Err(
        new Error(`Failed to export key: ${error instanceof Error ? error.message : String(error)}`)
      );
    }
  }

  /**
   * Update .gitattributes to encrypt .lill/ directory
   */
  updateGitattributes(): Result<void> {
    try {
      const gitattributesPath = join(this.cwd, '.gitattributes');
      let content = '';

      if (existsSync(gitattributesPath)) {
        content = readFileSync(gitattributesPath, 'utf-8');
      }

      // Check if .lill/ is already configured
      if (content.includes('.lill/**')) {
        console.log(chalk.dim('  .gitattributes already configured for .lill/'));
        return Ok(undefined);
      }

      // Add encryption rules for .lill/
      const rules = `
# AETHER Memory Encryption (git-crypt)
# Encrypt all files in .lill/ directory
.lill/** filter=git-crypt diff=git-crypt
.gitattributes !filter !diff
`;

      content += (content.endsWith('\n') ? '' : '\n') + rules;
      writeFileSync(gitattributesPath, content, 'utf-8');

      console.log(chalk.green('✓ .gitattributes updated'));
      return Ok(undefined);
    } catch (error) {
      return Err(
        new Error(
          `Failed to update .gitattributes: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  /**
   * Update .gitignore to ALLOW .lill/ (remove ignore rule)
   */
  updateGitignore(): Result<void> {
    try {
      const gitignorePath = join(this.cwd, '.gitignore');

      if (!existsSync(gitignorePath)) {
        console.log(chalk.dim('  No .gitignore found, skipping'));
        return Ok(undefined);
      }

      const content = readFileSync(gitignorePath, 'utf-8');
      const lines = content.split('\n');

      // Remove .lill/ from .gitignore (but keep subdirectories that should be ignored)
      const filteredLines = lines.filter((line) => {
        const trimmed = line.trim();
        // Remove exact match for .lill/ but keep specific subdirectories
        if (trimmed === '.lill/' || trimmed === '.lill') {
          return false;
        }
        return true;
      });

      // Add comment explaining that .lill/ is now encrypted and committed
      const newContent = filteredLines.join('\n');
      const comment = `
# AETHER Memory (.lill/) is encrypted with git-crypt and committed to repo
# Individual subdirectories can still be ignored:
.lill/.watcher-config.json
.lill/logs/
`;

      writeFileSync(gitignorePath, newContent + comment, 'utf-8');

      console.log(chalk.green('✓ .gitignore updated (removed .lill/ ignore rule)'));
      return Ok(undefined);
    } catch (error) {
      return Err(
        new Error(
          `Failed to update .gitignore: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  }

  /**
   * Full setup: install, initialize, configure
   */
  async setup(): Promise<Result<GitCryptSetupResult>> {
    const result: GitCryptSetupResult = {
      installed: false,
      initialized: false,
      keyExported: false,
      gitattributesUpdated: false,
      gitignoreUpdated: false,
    };

    try {
      // Step 1: Check/install git-crypt
      if (!this.isInstalled()) {
        const installResult = await this.install();
        if (!installResult.ok) {
          return Err(installResult.error);
        }
      }
      result.installed = true;

      // Step 2: Initialize git-crypt
      if (!this.isInitialized()) {
        const initResult = await this.initialize();
        if (!initResult.ok) {
          return Err(initResult.error);
        }
      }
      result.initialized = true;

      // Step 3: Export key
      const keyResult = await this.exportKey();
      if (!keyResult.ok) {
        return Err(keyResult.error);
      }
      result.keyExported = true;
      result.keyPath = keyResult.value;

      // Step 4: Update .gitattributes
      const gitattributesResult = this.updateGitattributes();
      if (!gitattributesResult.ok) {
        return Err(gitattributesResult.error);
      }
      result.gitattributesUpdated = true;

      // Step 5: Update .gitignore
      const gitignoreResult = this.updateGitignore();
      if (!gitignoreResult.ok) {
        return Err(gitignoreResult.error);
      }
      result.gitignoreUpdated = true;

      return Ok(result);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Get project name from package.json or directory name
   */
  private getProjectName(): string {
    try {
      const packageJsonPath = join(this.cwd, 'package.json');
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name) {
          return packageJson.name.replace(/[^a-z0-9-]/gi, '-');
        }
      }
    } catch {
      // Fall through to directory name
    }

    // Use directory name as fallback
    return dirname(this.cwd).split('/').pop() || 'aether-project';
  }
}
