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
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { WatcherCommand } from './WatcherCommand.js';

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
      console.log(chalk.cyan('🚀 Starting automatic watcher...'));
      console.log();

      // Start the watcher automatically
      const watcherCmd = new WatcherCommand({
        cwd: this.cwd,
        verbose: this.verbose,
        daemon: false,
        foreground: true,
      });

      await watcherCmd.start();

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
}
