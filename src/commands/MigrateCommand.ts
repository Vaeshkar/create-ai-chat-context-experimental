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
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';

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

export class MigrateCommand {
  private cwd: string;

  constructor(options: MigrateCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
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
        const permissionsContent = `# AICF Permissions File
# Format: pipe-delimited
# platform|status|last_updated|audit_log

augment|active|${new Date().toISOString()}|Migrated from v2.0.1
claude-desktop|inactive|${new Date().toISOString()}|
claude-cli|inactive|${new Date().toISOString()}|
warp|inactive|${new Date().toISOString()}|
`;
        writeFileSync(permissionsFile, permissionsContent);
        filesCreated.push(permissionsFile);
      }

      // Create .watcher-config.json if it doesn't exist
      const watcherConfigFile = join(this.cwd, '.watcher-config.json');
      if (!existsSync(watcherConfigFile)) {
        const watcherConfig = {
          version: '1.0.0',
          mode: 'automatic',
          platforms: {
            augment: {
              enabled: true,
              cachePath: cacheLlmDir,
              lastSync: new Date().toISOString(),
            },
            'claude-desktop': {
              enabled: false,
              cachePath: join(this.cwd, '.cache', 'claude-desktop'),
            },
            'claude-cli': {
              enabled: false,
              cachePath: join(this.cwd, '.cache', 'claude-cli'),
            },
            warp: {
              enabled: false,
              cachePath: join(this.cwd, '.cache', 'warp'),
            },
          },
          consolidationInterval: 300000,
          maxCheckpointAge: 86400000,
        };
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
      console.log(chalk.dim('Next steps:'));
      console.log(chalk.dim('  1. Review .aicf/.permissions.aicf'));
      console.log(chalk.dim('  2. Review .watcher-config.json'));
      console.log(chalk.dim('  3. Run: npx aice watch'));
      console.log(chalk.dim('  4. Commit changes to git'));
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
}
