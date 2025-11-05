/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Install Hooks Command - Install git hooks for session end reminders
 * Phase 4: User Experience Implementation
 *
 * Implements git hook installation from LLM-ENFORCE-RULES-DESIGN.md:
 * - Installs pre-commit hook that reminds users to update conversation log
 * - Makes hooks executable
 * - Provides backup/restore functionality
 */

import chalk from 'chalk';
import ora from 'ora';
import { existsSync, readFileSync, writeFileSync, chmodSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { getTemplatesDir } from '../utils/PackageRoot.js';

export interface InstallHooksCommandOptions {
  cwd?: string;
  verbose?: boolean;
  force?: boolean;
  backup?: boolean;
}

export interface InstallHooksResult {
  hooksInstalled: string[];
  backupsCreated: string[];
  message: string;
}

export class InstallHooksCommand {
  private cwd: string;
  private verbose: boolean;

  constructor(options: InstallHooksCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
  }

  async execute(options: InstallHooksCommandOptions = {}): Promise<Result<InstallHooksResult>> {
    try {
      const spinner = ora();

      console.log();
      console.log(chalk.cyan('🪝 Installing Git Hooks for Session Reminders'));
      console.log();

      // Step 1: Check if we're in a git repository
      const gitDir = join(this.cwd, '.git');
      if (!existsSync(gitDir)) {
        return Err(new Error('Not a git repository. Run "git init" first.'));
      }

      // Step 2: Check if .ai/ directory exists
      const aiDir = join(this.cwd, '.ai');
      if (!existsSync(aiDir)) {
        return Err(new Error('No .ai/ directory found. Run "aether init" first.'));
      }

      // Step 3: Create hooks directory if it doesn't exist
      const hooksDir = join(gitDir, 'hooks');
      if (!existsSync(hooksDir)) {
        spinner.start('Creating git hooks directory...');
        mkdirSync(hooksDir, { recursive: true });
        spinner.succeed('Git hooks directory created');
      }

      // Step 4: Install hooks
      const hooksToInstall = ['pre-commit'];
      const hooksInstalled: string[] = [];
      const backupsCreated: string[] = [];

      for (const hookName of hooksToInstall) {
        spinner.start(`Installing ${hookName} hook...`);

        const installResult = await this.installHook(hookName, options);
        if (!installResult.ok) {
          spinner.fail(`Failed to install ${hookName} hook`);
          return Err(new Error(`Failed to install ${hookName} hook`));
        }

        hooksInstalled.push(hookName);
        if (installResult.value.backupCreated && installResult.value.backupPath) {
          backupsCreated.push(installResult.value.backupPath);
        }

        spinner.succeed(`Installed ${hookName} hook`);
      }

      console.log();
      console.log(chalk.green('🎉 Git Hooks Installed Successfully!'));
      console.log();
      console.log(chalk.cyan('📋 What was installed:'));
      hooksInstalled.forEach((hook) => {
        console.log(`   ✅ ${hook} hook - reminds to update conversation log`);
      });

      if (backupsCreated.length > 0) {
        console.log();
        console.log(chalk.yellow('📦 Backups created:'));
        backupsCreated.forEach((backup) => {
          console.log(`   💾 ${backup}`);
        });
      }

      console.log();
      console.log(chalk.cyan('💡 How it works:'));
      console.log('   • Before each commit, checks if .ai/conversation-log.md was updated today');
      console.log('   • Gently reminds you to run "aether finish" if not updated');
      console.log('   • You can still commit if you choose to skip the reminder');
      console.log();

      return Ok({
        hooksInstalled,
        backupsCreated,
        message: 'Git hooks installed successfully',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async installHook(
    hookName: string,
    options: InstallHooksCommandOptions
  ): Promise<Result<{ backupCreated: boolean; backupPath?: string }>> {
    try {
      const templatesDir = getTemplatesDir();
      const sourceHookPath = join(templatesDir, 'shared', 'git-hooks', hookName);
      const targetHookPath = join(this.cwd, '.git', 'hooks', hookName);

      // Check if source hook exists
      if (!existsSync(sourceHookPath)) {
        return Err(new Error(`Hook template not found: ${sourceHookPath}`));
      }

      // Backup existing hook if it exists and backup is requested
      let backupCreated = false;
      let backupPath: string | undefined;

      if (existsSync(targetHookPath)) {
        if (options.backup !== false) {
          // Default to true
          backupPath = `${targetHookPath}.backup.${Date.now()}`;
          copyFileSync(targetHookPath, backupPath);
          backupCreated = true;
        } else if (!options.force) {
          return Err(
            new Error(
              `Hook already exists: ${targetHookPath}. Use --force to overwrite or --backup to create backup.`
            )
          );
        }
      }

      // Copy hook from template
      const hookContent = readFileSync(sourceHookPath, 'utf-8');
      writeFileSync(targetHookPath, hookContent);

      // Make hook executable
      chmodSync(targetHookPath, 0o755);

      return Ok({ backupCreated, backupPath });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
