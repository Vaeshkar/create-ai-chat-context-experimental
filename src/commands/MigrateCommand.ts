/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Migrate Command - Upgrade from create-ai-chat-context to aice automatic mode
 * Preserves existing .ai/ and .aicf/ directories
 * Adds automatic mode configuration (.permissions.aicf, .watcher-config.json, .cache/llm/)
 */

import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, readdirSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
// BackgroundService removed - using Cache-First Architecture (Phase 6)

export interface MigrateCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

export interface MigrateResult {
  projectPath: string;
  filesCreated: string[];
  filesPreserved: string[];
  message: string;
}

interface PlatformSelection {
  augment: boolean;
  warp: boolean;
  claudeDesktop: boolean;
  claudeCli: boolean;
  copilot: boolean;
  chatgpt: boolean;
}

export class MigrateCommand {
  private cwd: string;
  private verbose: boolean;
  private selectedPlatforms: PlatformSelection = {
    augment: true,
    warp: false,
    claudeDesktop: false,
    claudeCli: false,
    copilot: false,
    chatgpt: false,
  };

  constructor(options: MigrateCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
  }

  async execute(): Promise<Result<MigrateResult>> {
    try {
      const spinner = ora();

      // Check if project has existing memory files
      const aicfDir = join(this.cwd, '.aicf');
      const aiDir = join(this.cwd, '.ai');

      if (!existsSync(aicfDir) || !existsSync(aiDir)) {
        return Err(
          new Error('No existing memory files found. Run: npx aice init --mode automatic')
        );
      }

      // Ask which platforms to enable
      await this.askPlatforms();

      spinner.info('Migrating to automatic mode...');

      const filesCreated: string[] = [];
      const filesPreserved: string[] = [aicfDir, aiDir];

      // Create .cache/llm directory
      const cacheLlmDir = join(this.cwd, '.cache', 'llm');
      mkdirSync(cacheLlmDir, { recursive: true });
      filesCreated.push(cacheLlmDir);

      // Create .permissions.aicf if it doesn't exist
      const permissionsFile = join(aicfDir, '.permissions.aicf');
      if (!existsSync(permissionsFile)) {
        const permissionsContent = this.generatePermissionsContent();
        writeFileSync(permissionsFile, permissionsContent);
        filesCreated.push(permissionsFile);
      }

      // Create .watcher-config.json if it doesn't exist
      const watcherConfigFile = join(this.cwd, '.watcher-config.json');
      if (!existsSync(watcherConfigFile)) {
        const watcherConfig = this.generateWatcherConfig(cacheLlmDir);
        writeFileSync(watcherConfigFile, JSON.stringify(watcherConfig, null, 2));
        filesCreated.push(watcherConfigFile);
      }

      // Copy template files
      this.copyTemplateFiles();

      // Update .gitignore
      const gitignorePath = join(this.cwd, '.gitignore');
      let gitignoreContent = '';
      if (existsSync(gitignorePath)) {
        gitignoreContent = readFileSync(gitignorePath, 'utf-8');
      }

      const entriesToAdd = ['.cache/llm/', '.watcher-config.json'];
      for (const entry of entriesToAdd) {
        if (!gitignoreContent.includes(entry)) {
          gitignoreContent += `\n${entry}`;
        }
      }

      writeFileSync(gitignorePath, gitignoreContent);
      filesCreated.push(gitignorePath);

      spinner.succeed('Migration complete');
      console.log();
      console.log(chalk.green('✅ Migration to Automatic Mode Complete'));
      console.log();
      console.log(chalk.dim('Preserved:'));
      filesPreserved.forEach((f) => console.log(chalk.dim(`  ✓ ${f}`)));
      console.log();
      console.log(chalk.dim('Created:'));
      filesCreated.forEach((f) => console.log(chalk.dim(`  ✓ ${f}`)));
      console.log();
      console.log(chalk.cyan('✅ Migration complete'));
      console.log();
      console.log(chalk.dim('To start watching for conversations, run:'));
      console.log(chalk.cyan('  aice watch'));
      console.log();

      return Ok({
        projectPath: this.cwd,
        filesCreated,
        filesPreserved,
        message: 'Successfully migrated to automatic mode',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async askPlatforms(): Promise<void> {
    console.log();
    console.log(chalk.cyan('📁 Data Discovery'));
    console.log(chalk.dim('To set up automatic mode, we need your permission to:'));
    console.log(chalk.dim('  • Read conversations from your LLM library folders'));
    console.log(chalk.dim('  • Extract and consolidate them into memory files'));
    console.log(chalk.dim('  • Store them locally in .aicf/ and .ai/ directories'));
    console.log();
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Which LLM platforms do you use? (Select all that apply)',
        choices: [
          { name: 'Augment', value: 'augment', checked: true },
          { name: 'Warp', value: 'warp' },
          { name: 'Claude Desktop', value: 'claude-desktop' },
          { name: 'Claude CLI', value: 'claude-cli' },
          { name: 'Copilot', value: 'copilot' },
          { name: 'ChatGPT', value: 'chatgpt' },
        ],
        validate: (answer) => {
          if (answer.length === 0) {
            return 'Please select at least one platform';
          }
          return true;
        },
      },
    ]);

    this.selectedPlatforms = {
      augment: answers.platforms.includes('augment'),
      warp: answers.platforms.includes('warp'),
      claudeDesktop: answers.platforms.includes('claude-desktop'),
      claudeCli: answers.platforms.includes('claude-cli'),
      copilot: answers.platforms.includes('copilot'),
      chatgpt: answers.platforms.includes('chatgpt'),
    };
  }

  private generatePermissionsContent(): string {
    const now = new Date().toISOString();
    const lines = [
      '# AICF Permissions File',
      '# Format: pipe-delimited',
      '# platform|status|last_updated|audit_log',
      '',
    ];

    if (this.selectedPlatforms.augment) {
      lines.push(`augment|active|${now}|Migrated from v2.0.1`);
    } else {
      lines.push(`augment|inactive|${now}|`);
    }

    if (this.selectedPlatforms.claudeDesktop) {
      lines.push(`claude-desktop|active|${now}|Migrated from v2.0.1`);
    } else {
      lines.push(`claude-desktop|inactive|${now}|`);
    }

    if (this.selectedPlatforms.claudeCli) {
      lines.push(`claude-cli|active|${now}|Migrated from v2.0.1`);
    } else {
      lines.push(`claude-cli|inactive|${now}|`);
    }

    if (this.selectedPlatforms.warp) {
      lines.push(`warp|active|${now}|Migrated from v2.0.1`);
    } else {
      lines.push(`warp|inactive|${now}|`);
    }

    if (this.selectedPlatforms.copilot) {
      lines.push(`copilot|active|${now}|Migrated from v2.0.1`);
    } else {
      lines.push(`copilot|inactive|${now}|`);
    }

    if (this.selectedPlatforms.chatgpt) {
      lines.push(`chatgpt|active|${now}|Migrated from v2.0.1`);
    } else {
      lines.push(`chatgpt|inactive|${now}|`);
    }

    return lines.join('\n') + '\n';
  }

  private generateWatcherConfig(cacheLlmDir: string) {
    return {
      version: '1.0.0',
      mode: 'automatic',
      platforms: {
        augment: {
          enabled: this.selectedPlatforms.augment,
          cachePath: cacheLlmDir,
          lastSync: new Date().toISOString(),
        },
        'claude-desktop': {
          enabled: this.selectedPlatforms.claudeDesktop,
          cachePath: join(this.cwd, '.cache', 'claude-desktop'),
        },
        'claude-cli': {
          enabled: this.selectedPlatforms.claudeCli,
          cachePath: join(this.cwd, '.cache', 'claude-cli'),
        },
        warp: {
          enabled: this.selectedPlatforms.warp,
          cachePath: join(this.cwd, '.cache', 'warp'),
        },
        copilot: {
          enabled: this.selectedPlatforms.copilot,
          cachePath: join(this.cwd, '.cache', 'copilot'),
        },
        chatgpt: {
          enabled: this.selectedPlatforms.chatgpt,
          cachePath: join(this.cwd, '.cache', 'chatgpt'),
        },
      },
      consolidationInterval: 300000,
      maxCheckpointAge: 86400000,
    };
  }

  /**
   * Copy template files from dist/templates to project directories
   * Smart merge: Only copies missing files or updates if template is newer
   */
  private copyTemplateFiles(): void {
    try {
      // Get the templates directory - it's in dist/templates after build
      const templatesDir = join(__dirname, '../templates');

      // Copy ai-instructions.md if it exists
      const aiInstructionsTemplate = join(templatesDir, 'ai-instructions.md');
      if (existsSync(aiInstructionsTemplate)) {
        const aiInstructionsPath = join(this.cwd, '.ai-instructions');
        if (!existsSync(aiInstructionsPath)) {
          copyFileSync(aiInstructionsTemplate, aiInstructionsPath);
        }
      }

      // Copy NEW_CHAT_PROMPT.md if it exists
      const newChatPromptTemplate = join(templatesDir, 'NEW_CHAT_PROMPT.md');
      if (existsSync(newChatPromptTemplate)) {
        const newChatPromptPath = join(this.cwd, 'NEW_CHAT_PROMPT.md');
        if (!existsSync(newChatPromptPath)) {
          copyFileSync(newChatPromptTemplate, newChatPromptPath);
        }
      }

      // Copy .ai/ template files (smart merge for critical files)
      const aiTemplateDir = join(templatesDir, 'ai');
      if (existsSync(aiTemplateDir)) {
        const aiDir = join(this.cwd, '.ai');
        mkdirSync(aiDir, { recursive: true });

        const aiFiles = readdirSync(aiTemplateDir);
        const criticalFiles = [
          'code-style.md',
          'design-system.md',
          'npm-publishing-checklist.md',
          'testing-philosophy.md',
          'README.md',
        ];

        for (const file of aiFiles) {
          const srcFile = join(aiTemplateDir, file);
          const destFile = join(aiDir, file);

          if (!existsSync(destFile)) {
            // File doesn't exist - copy template
            copyFileSync(srcFile, destFile);
          } else if (criticalFiles.includes(file)) {
            // Critical file exists - check if identical
            const isSame = this.filesAreIdentical(srcFile, destFile);

            if (isSame) {
              // Files are identical - no action needed
              continue;
            }

            // Files differ - check if template is newer
            const templateNewer = this.isTemplateNewer(srcFile, destFile);

            if (templateNewer) {
              // Template is newer - update user file with template
              copyFileSync(srcFile, destFile);
              if (this.verbose) {
                console.log(`📦 Updated ${file} (template is newer)`);
              }
            } else {
              // User file is newer or same version - preserve it
              if (this.verbose) {
                console.log(`⏭️  Skipped ${file} (user version is newer or customized)`);
              }
            }
          }
        }
      }

      // Copy .aicf/ template files (only if they don't exist)
      const aicfTemplateDir = join(templatesDir, 'aicf');
      if (existsSync(aicfTemplateDir)) {
        const aicfDir = join(this.cwd, '.aicf');
        mkdirSync(aicfDir, { recursive: true });

        const aicfFiles = readdirSync(aicfTemplateDir);
        for (const file of aicfFiles) {
          const srcFile = join(aicfTemplateDir, file);
          const destFile = join(aicfDir, file);
          if (!existsSync(destFile)) {
            copyFileSync(srcFile, destFile);
          }
        }
      }
    } catch (error) {
      // Silently fail if templates don't exist (e.g., in development)
      if (this.verbose) {
        console.warn('Warning: Could not copy template files:', error);
      }
    }
  }

  /**
   * Check if two files are identical (byte-for-byte)
   */
  private filesAreIdentical(file1: string, file2: string): boolean {
    try {
      const content1 = readFileSync(file1, 'utf-8');
      const content2 = readFileSync(file2, 'utf-8');
      return content1 === content2;
    } catch {
      return false;
    }
  }

  /**
   * Extract version/date from file header
   * Looks for patterns like:
   * - "Last Updated: 2025-10-21"
   * - "Last Updated: October 13, 2025"
   * - "Date: 2025-10-24"
   * - "version: 2.0.0"
   */
  private extractFileVersion(filePath: string): { date?: Date; version?: string } {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').slice(0, 20); // Check first 20 lines

      let date: Date | undefined;
      let version: string | undefined;

      for (const line of lines) {
        // Try to extract date (ISO format: YYYY-MM-DD)
        const isoMatch = line.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch && !date) {
          date = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`);
        }

        // Try to extract version (v1.0.0 or 1.0.0)
        const versionMatch = line.match(/v?(\d+\.\d+\.\d+)/);
        if (versionMatch && !version) {
          version = versionMatch[1];
        }

        // Try to extract month-based date (October 13, 2025)
        const monthMatch = line.match(
          /(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i
        );
        if (monthMatch && !date) {
          date = new Date(`${monthMatch[1]} ${monthMatch[2]}, ${monthMatch[3]}`);
        }
      }

      return { date, version };
    } catch {
      return {};
    }
  }

  /**
   * Check if template file is newer than user file
   */
  private isTemplateNewer(templatePath: string, userPath: string): boolean {
    const templateInfo = this.extractFileVersion(templatePath);
    const userInfo = this.extractFileVersion(userPath);

    // If both have dates, compare them
    if (templateInfo.date && userInfo.date) {
      return templateInfo.date > userInfo.date;
    }

    // If both have versions, compare them
    if (templateInfo.version && userInfo.version) {
      const templateVer = templateInfo.version.split('.').map(Number);
      const userVer = userInfo.version.split('.').map(Number);

      for (let i = 0; i < Math.min(3, templateVer.length, userVer.length); i++) {
        const tVal = templateVer[i] ?? 0;
        const uVal = userVer[i] ?? 0;
        if (tVal > uVal) return true;
        if (tVal < uVal) return false;
      }
    }

    return false;
  }
}
