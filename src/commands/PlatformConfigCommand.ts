/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Platform Config Command - Generate platform-specific configuration files
 * Phase 4: User Experience Implementation
 *
 * Creates configuration files for different AI platforms:
 * - Augment: .augment/rules/always-load-context.md
 * - Cursor: .cursorrules
 * - Claude: claude-project-instructions.md (for manual setup)
 * - Warp: .ai-instructions (enhanced)
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { getTemplatesDir } from '../utils/PackageRoot.js';

export interface PlatformConfigCommandOptions {
  cwd?: string;
  verbose?: boolean;
  platforms?: string[];
  force?: boolean;
}

export interface PlatformConfigResult {
  configsCreated: Array<{ platform: string; file: string; path: string }>;
  message: string;
}

type SupportedPlatform = 'augment' | 'cursor' | 'claude' | 'warp' | 'all';

export class PlatformConfigCommand {
  private cwd: string;
  private verbose: boolean;

  constructor(options: PlatformConfigCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
  }

  async execute(options: PlatformConfigCommandOptions = {}): Promise<Result<PlatformConfigResult>> {
    try {
      const spinner = ora();

      console.log();
      console.log(chalk.cyan('🚀 Generating Platform-Specific Configuration Files'));
      console.log();

      // Step 1: Check if .ai/ directory exists
      const aiDir = join(this.cwd, '.ai');
      if (!existsSync(aiDir)) {
        return Err(new Error('No .ai/ directory found. Run "aether init" first.'));
      }

      // Step 2: Determine which platforms to configure
      let platforms: string[];
      if (options.platforms && options.platforms.length > 0) {
        platforms = options.platforms;
      } else {
        const platformChoice = await this.promptForPlatforms();
        platforms = platformChoice;
      }

      // Step 3: Generate configuration files
      const configsCreated: Array<{ platform: string; file: string; path: string }> = [];

      for (const platform of platforms) {
        if (platform === 'all') {
          // Generate all platform configs
          const allPlatforms = ['augment', 'cursor', 'claude', 'warp'];
          for (const p of allPlatforms) {
            spinner.start(`Generating ${p} configuration...`);
            const result = await this.generatePlatformConfig(p as SupportedPlatform, options);
            if (result.ok) {
              configsCreated.push(result.value);
              spinner.succeed(`Generated ${p} configuration`);
            } else {
              spinner.fail(`Failed to generate ${p} configuration`);
              if (this.verbose) {
                console.log(chalk.yellow(`  Error: Failed to generate ${p} configuration`));
              }
            }
          }
        } else {
          spinner.start(`Generating ${platform} configuration...`);
          const result = await this.generatePlatformConfig(platform as SupportedPlatform, options);
          if (result.ok) {
            configsCreated.push(result.value);
            spinner.succeed(`Generated ${platform} configuration`);
          } else {
            spinner.fail(`Failed to generate ${platform} configuration`);
            return Err(new Error(`Failed to generate ${platform} configuration`));
          }
        }
      }

      console.log();
      console.log(chalk.green('🎉 Platform Configurations Generated Successfully!'));
      console.log();
      console.log(chalk.cyan('📋 Files created:'));
      configsCreated.forEach((config) => {
        console.log(`   ✅ ${config.platform}: ${config.file}`);
      });

      console.log();
      console.log(chalk.cyan('💡 Next steps:'));
      configsCreated.forEach((config) => {
        console.log(`   • ${config.platform}: ${this.getSetupInstructions(config.platform)}`);
      });
      console.log();

      return Ok({
        configsCreated,
        message: 'Platform configurations generated successfully',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async promptForPlatforms(): Promise<string[]> {
    const answers = await inquirer.prompt({
      type: 'checkbox',
      name: 'platforms',
      message: 'Which AI platforms do you use?',
      choices: [
        { name: 'Augment (auto-includes rules)', value: 'augment' },
        { name: 'Cursor (IDE with AI)', value: 'cursor' },
        { name: 'Claude Projects', value: 'claude' },
        { name: 'Warp Terminal AI', value: 'warp' },
        { name: 'All platforms', value: 'all' },
      ],
      validate: (input: unknown) => {
        if (Array.isArray(input) && input.length === 0) {
          return 'Please select at least one platform';
        }
        return true;
      },
    });

    return answers.platforms;
  }

  private async generatePlatformConfig(
    platform: SupportedPlatform,
    options: PlatformConfigCommandOptions
  ): Promise<Result<{ platform: string; file: string; path: string }>> {
    try {
      const templatesDir = getTemplatesDir();

      let sourceFile: string;
      let targetFile: string;
      let targetDir: string;

      switch (platform) {
        case 'augment':
          sourceFile = join(templatesDir, 'shared', 'platform-configs', 'augment-bootstrap.md');
          targetDir = join(this.cwd, '.augment', 'rules');
          targetFile = join(targetDir, 'always-load-context.md');
          break;

        case 'cursor':
          sourceFile = join(templatesDir, 'shared', 'platform-configs', 'cursorrules');
          targetDir = this.cwd;
          targetFile = join(targetDir, '.cursorrules');
          break;

        case 'claude':
          sourceFile = join(
            templatesDir,
            'shared',
            'platform-configs',
            'claude-project-instructions.md'
          );
          targetDir = this.cwd;
          targetFile = join(targetDir, 'claude-project-instructions.md');
          break;

        case 'warp':
          sourceFile = join(templatesDir, 'shared', 'platform-configs', 'warp-ai-instructions');
          targetDir = this.cwd;
          targetFile = join(targetDir, '.ai-instructions');
          break;

        default:
          return Err(new Error(`Unsupported platform: ${platform}`));
      }

      // Check if source template exists
      if (!existsSync(sourceFile)) {
        return Err(new Error(`Template not found: ${sourceFile}`));
      }

      // Check if target file already exists
      if (existsSync(targetFile) && !options.force) {
        return Err(new Error(`File already exists: ${targetFile}. Use --force to overwrite.`));
      }

      // Create target directory if it doesn't exist
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      // Copy template to target location
      const templateContent = readFileSync(sourceFile, 'utf-8');
      writeFileSync(targetFile, templateContent);

      return Ok({
        platform,
        file: targetFile.replace(this.cwd + '/', ''),
        path: targetFile,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private getSetupInstructions(platform: string): string {
    const instructions = {
      augment: 'File auto-loaded by Augment',
      cursor: 'Restart Cursor to load new rules',
      claude: 'Copy content to Claude Project instructions',
      warp: 'File auto-loaded by Warp AI',
    };
    return instructions[platform as keyof typeof instructions] || 'Follow platform documentation';
  }
}
