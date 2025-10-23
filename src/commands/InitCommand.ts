/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Init Command - Initialize aicf-watcher
 * Phase 4.4: InitCommand Implementation - October 2025
 *
 * Extends create-ai-chat-context init with automatic mode setup
 * Asks user: Manual or Automatic mode?
 * If Automatic: Creates .cache/llm/, .permissions.aicf, .watcher-config.json
 */

import { join } from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

export interface InitCommandOptions {
  cwd?: string;
  force?: boolean;
  verbose?: boolean;
  mode?: 'manual' | 'automatic';
}

export interface InitResult {
  mode: 'manual' | 'automatic';
  projectPath: string;
  filesCreated: string[];
  message: string;
}

/**
 * Initialize aicf-watcher in a project
 * Extends create-ai-chat-context init with automatic mode setup
 */
export class InitCommand {
  private cwd: string;
  private force: boolean;
  private mode: 'manual' | 'automatic';

  constructor(options: InitCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.force = options.force || false;
    this.mode = options.mode || 'automatic';
  }

  /**
   * Execute init command
   */
  async execute(): Promise<Result<InitResult>> {
    try {
      const spinner = ora();

      // Step 1: Check if already initialized
      if (!this.force) {
        const checkResult = this.checkNotInitialized();
        if (!checkResult.ok) {
          return checkResult;
        }
      }

      // Step 2: Ask user for mode (manual or automatic)
      spinner.info('Initializing aicf-watcher...');
      const mode = await this.askMode();

      if (mode === 'manual') {
        return await this.initManualMode(spinner);
      } else {
        return await this.initAutomaticMode(spinner);
      }
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if project is not already initialized
   */
  private checkNotInitialized(): Result<void> {
    const aicfDir = join(this.cwd, '.aicf');
    const aiDir = join(this.cwd, '.ai');

    if (existsSync(aicfDir) || existsSync(aiDir)) {
      return Err(new Error('Project already initialized. Use --force to overwrite.'));
    }

    return Ok(undefined);
  }

  /**
   * Ask user for mode: manual or automatic
   */
  private async askMode(): Promise<'manual' | 'automatic'> {
    // Return the mode set in constructor
    // TODO: Implement interactive prompt using inquirer if mode not specified
    return this.mode;
  }

  /**
   * Initialize manual mode
   * User will use create-ai-chat-context workflow
   */
  private async initManualMode(spinner: Ora): Promise<Result<InitResult>> {
    spinner.start('Setting up manual mode...');

    try {
      // Create .ai and .aicf directories
      const aiDir = join(this.cwd, '.ai');
      const aicfDir = join(this.cwd, '.aicf');

      mkdirSync(aiDir, { recursive: true });
      mkdirSync(aicfDir, { recursive: true });

      spinner.succeed('Manual mode initialized');
      console.log();
      console.log(chalk.green('✅ Manual Mode Setup Complete'));
      console.log();
      console.log(chalk.dim('Next steps:'));
      console.log(chalk.dim('  1. Run: npx create-ai-chat-context init'));
      console.log(chalk.dim('  2. Ask your LLM to update memory files'));
      console.log(chalk.dim('  3. Commit changes to git'));
      console.log();

      return Ok({
        mode: 'manual',
        projectPath: this.cwd,
        filesCreated: [aiDir, aicfDir],
        message: 'Manual mode initialized. Use create-ai-chat-context workflow.',
      });
    } catch (error) {
      spinner.fail('Failed to initialize manual mode');
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Initialize automatic mode
   * Creates .cache/llm/, .permissions.aicf, .watcher-config.json
   */
  private async initAutomaticMode(spinner: Ora): Promise<Result<InitResult>> {
    spinner.start('Setting up automatic mode...');

    try {
      const filesCreated: string[] = [];

      // Step 1: Create directory structure
      spinner.text = 'Creating directory structure...';
      const cacheLlmDir = join(this.cwd, '.cache', 'llm');
      const aiDir = join(this.cwd, '.ai');
      const aicfDir = join(this.cwd, '.aicf');

      mkdirSync(cacheLlmDir, { recursive: true });
      mkdirSync(aiDir, { recursive: true });
      mkdirSync(aicfDir, { recursive: true });

      filesCreated.push(cacheLlmDir, aiDir, aicfDir);

      // Step 2: Create .permissions.aicf
      spinner.text = 'Creating permission tracking file...';
      const permissionsFile = join(aicfDir, '.permissions.aicf');
      const permissionsContent = this.generatePermissionsFile();
      writeFileSync(permissionsFile, permissionsContent, 'utf-8');
      filesCreated.push(permissionsFile);

      // Step 3: Create .watcher-config.json
      spinner.text = 'Creating watcher configuration...';
      const configFile = join(aicfDir, '.watcher-config.json');
      const configContent = this.generateWatcherConfig();
      writeFileSync(configFile, configContent, 'utf-8');
      filesCreated.push(configFile);

      // Step 4: Update .gitignore
      spinner.text = 'Updating .gitignore...';
      this.updateGitignore();

      spinner.succeed('Automatic mode initialized');
      console.log();
      console.log(chalk.green('✅ Automatic Mode Setup Complete'));
      console.log();
      console.log(chalk.dim('Next steps:'));
      console.log(chalk.dim('  1. Review .aicf/.permissions.aicf'));
      console.log(chalk.dim('  2. Review .aicf/.watcher-config.json'));
      console.log(chalk.dim('  3. Run: npx aice watch'));
      console.log(chalk.dim('  4. Commit changes to git'));
      console.log();

      return Ok({
        mode: 'automatic',
        projectPath: this.cwd,
        filesCreated,
        message: 'Automatic mode initialized. Watcher is ready to start.',
      });
    } catch (error) {
      spinner.fail('Failed to initialize automatic mode');
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Generate permissions file content
   */
  private generatePermissionsFile(): string {
    return `@PERMISSIONS|version=1.0|format=aicf
@PLATFORM|name=augment|status=active|consent=implicit|timestamp=${new Date().toISOString()}
@PLATFORM|name=warp|status=inactive|consent=pending|timestamp=${new Date().toISOString()}
@PLATFORM|name=claude|status=inactive|consent=pending|timestamp=${new Date().toISOString()}
@PLATFORM|name=claude-desktop|status=inactive|consent=pending|timestamp=${new Date().toISOString()}
@AUDIT|event=init|timestamp=${new Date().toISOString()}|user=system|action=created_permissions_file
`;
  }

  /**
   * Generate watcher config content
   */
  private generateWatcherConfig(): string {
    return JSON.stringify(
      {
        version: '1.0',
        platforms: {
          augment: {
            enabled: true,
            cachePath: '.cache/llm/augment',
            checkInterval: 5000,
          },
          warp: {
            enabled: false,
            cachePath: '.cache/llm/warp',
            checkInterval: 5000,
          },
          claude: {
            enabled: false,
            cachePath: '.cache/llm/claude',
            checkInterval: 0,
            importMode: true,
          },
          'claude-desktop': {
            enabled: false,
            cachePath: '.cache/llm/claude-desktop',
            checkInterval: 5000,
          },
        },
        watcher: {
          interval: 5000,
          verbose: false,
          daemonMode: true,
          pidFile: '.watcher.pid',
          logFile: '.watcher.log',
        },
        created: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * Update .gitignore to include .cache/llm/
   */
  private updateGitignore(): void {
    const gitignorePath = join(this.cwd, '.gitignore');
    const entries = ['.cache/llm/', '.watcher.pid', '.watcher.log'];

    let content = '';
    if (existsSync(gitignorePath)) {
      content = readFileSync(gitignorePath, 'utf-8');
    }

    for (const entry of entries) {
      if (!content.includes(entry)) {
        content += (content.endsWith('\n') ? '' : '\n') + entry + '\n';
      }
    }

    writeFileSync(gitignorePath, content, 'utf-8');
  }
}
