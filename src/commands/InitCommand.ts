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
import inquirer from 'inquirer';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { ClaudeCliWatcher } from '../watchers/ClaudeCliWatcher.js';
import { ClaudeDesktopWatcher } from '../watchers/ClaudeDesktopWatcher.js';
import { WatcherCommand } from './WatcherCommand.js';

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
  platforms?: string[];
  llmPrompt?: string;
}

export interface PlatformSelection {
  augment: boolean;
  warp: boolean;
  claudeDesktop: boolean;
  claudeCli: boolean;
  copilot: boolean;
  chatgpt: boolean;
}

/**
 * Initialize aicf-watcher in a project
 * Extends create-ai-chat-context init with automatic mode setup
 */
export class InitCommand {
  private cwd: string;
  private force: boolean;
  private verbose: boolean;
  private mode: 'manual' | 'automatic';
  private selectedPlatforms: PlatformSelection = {
    augment: false,
    warp: false,
    claudeDesktop: false,
    claudeCli: false,
    copilot: false,
    chatgpt: false,
  };

  constructor(options: InitCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.force = options.force || false;
    this.verbose = options.verbose || false;
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
        // Check if we need to migrate (existing .ai and .aicf but no .permissions.aicf)
        const aicfDir = join(this.cwd, '.aicf');
        const aiDir = join(this.cwd, '.ai');
        const permissionsFile = join(this.cwd, '.aicf', '.permissions.aicf');

        if (existsSync(aicfDir) && existsSync(aiDir) && !existsSync(permissionsFile)) {
          // Existing setup from base package - migrate it
          spinner.info('Found existing memory files. Switching to migration workflow...');
          return await this.migrateExistingSetup(spinner);
        }

        // Check for other initialization issues
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
    const permissionsFile = join(this.cwd, '.aicf', '.permissions.aicf');

    // If both .ai and .aicf exist AND .permissions.aicf exists, it's already in automatic mode
    if (existsSync(aicfDir) && existsSync(aiDir) && existsSync(permissionsFile)) {
      return Err(
        new Error('Project already initialized in automatic mode. Use --force to overwrite.')
      );
    }

    // If only .ai and .aicf exist (from base package), suggest migration
    if (existsSync(aicfDir) && existsSync(aiDir)) {
      return Err(
        new Error(
          'Project has existing memory files from create-ai-chat-context.\n' +
            'To upgrade to automatic mode, run: npx aice migrate\n' +
            'Or use --force to reinitialize from scratch.'
        )
      );
    }

    return Ok(undefined);
  }

  /**
   * Migrate existing setup from base package to experimental
   * Adds missing files and asks for mode preference
   */
  private async migrateExistingSetup(spinner: Ora): Promise<Result<InitResult>> {
    spinner.stop();

    try {
      console.log();
      console.log(chalk.cyan('🔄 Upgrading to automatic mode support...'));
      console.log();

      // Create missing directories
      const aicfDir = join(this.cwd, '.aicf');
      const aiDir = join(this.cwd, '.ai');
      const cacheLlmDir = join(this.cwd, '.cache', 'llm');

      spinner.start('Creating directory structure...');
      mkdirSync(aicfDir, { recursive: true });
      mkdirSync(aiDir, { recursive: true });
      mkdirSync(cacheLlmDir, { recursive: true });
      spinner.succeed('Directory structure ready');

      // Now ask for mode
      console.log();
      const mode = await this.askMode();

      if (mode === 'manual') {
        return await this.initManualMode(spinner);
      } else {
        return await this.initAutomaticMode(spinner);
      }
    } catch (error) {
      spinner.fail('Failed to migrate setup');
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Ask user for mode: manual or automatic
   */
  private async askMode(): Promise<'manual' | 'automatic'> {
    // If mode was explicitly set via CLI flag, use it
    if (this.mode !== 'automatic') {
      return this.mode;
    }

    console.log();
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'How do you want to capture conversations?',
        choices: [
          {
            name: 'Manual - I will ask my LLM to update memory files',
            value: 'manual',
          },
          {
            name: 'Automatic - Watch for new conversations automatically',
            value: 'automatic',
          },
        ],
        default: 'automatic',
      },
    ]);

    return answers.mode as 'manual' | 'automatic';
  }

  /**
   * Ask permission to scan library folders
   */
  private async askPermissionToScan(): Promise<boolean> {
    console.log();
    console.log(chalk.cyan('📁 Data Discovery'));
    console.log(chalk.dim('To set up automatic mode, we need to scan your LLM library folders.'));
    console.log(chalk.dim('This helps us find existing conversations to import.'));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'allowScan',
        message: 'Can we scan your library folders for existing conversations?',
        default: true,
      },
    ]);

    return answers.allowScan;
  }

  /**
   * Scan for available conversation data
   */
  private async scanForData(platforms: string[]): Promise<Map<string, number>> {
    const dataMap = new Map<string, number>();

    for (const platform of platforms) {
      try {
        if (platform === 'claude-cli') {
          const watcher = new ClaudeCliWatcher();
          if (watcher.isAvailable()) {
            const projectsResult = watcher.getAvailableProjects();
            if (projectsResult.ok) {
              dataMap.set('claude-cli', projectsResult.value.length);
            }
          }
        } else if (platform === 'claude-desktop') {
          const watcher = new ClaudeDesktopWatcher();
          if (watcher.isAvailable()) {
            // For now, just mark as available
            dataMap.set('claude-desktop', 1);
          }
        }
      } catch {
        // Silently skip if watcher fails
      }
    }

    return dataMap;
  }

  /**
   * Show data discovery results
   */
  private async showDataDiscovery(platforms: string[]): Promise<void> {
    const spinner = ora('Scanning for existing conversations...').start();

    try {
      const dataMap = await this.scanForData(platforms);

      spinner.succeed('Scan complete');
      console.log();
      console.log(chalk.cyan('📊 Found Data:'));

      if (dataMap.size === 0) {
        console.log(chalk.dim('  No existing conversations found (this is normal for new setups)'));
      } else {
        for (const [platform, count] of dataMap) {
          console.log(chalk.green(`  ✓ ${platform}: ${count} project(s)/database(s)`));
        }
      }

      console.log();
      console.log(chalk.dim('These will be imported when you run: npx aice watch'));
      console.log();
    } catch {
      spinner.fail('Error scanning for data');
      console.log(chalk.dim('(This is optional - you can continue without scanning)'));
      console.log();
    }
  }

  /**
   * Initialize manual mode
   * User will use create-ai-chat-context workflow
   */
  private async initManualMode(spinner: Ora): Promise<Result<InitResult>> {
    spinner.stop();

    try {
      // Ask which LLM they use
      console.log();
      const llmAnswers = await inquirer.prompt([
        {
          type: 'list',
          name: 'llm',
          message: 'Which LLM do you use?',
          choices: [
            { name: 'Augment', value: 'augment' },
            { name: 'Claude (Web)', value: 'claude-web' },
            { name: 'Claude Desktop', value: 'claude-desktop' },
            { name: 'Claude CLI', value: 'claude-cli' },
            { name: 'ChatGPT', value: 'chatgpt' },
            { name: 'Copilot', value: 'copilot' },
            { name: 'Warp', value: 'warp' },
          ],
          default: 'augment',
        },
      ]);

      spinner.start('Setting up manual mode...');

      // Create .ai and .aicf directories
      const aiDir = join(this.cwd, '.ai');
      const aicfDir = join(this.cwd, '.aicf');

      mkdirSync(aiDir, { recursive: true });
      mkdirSync(aicfDir, { recursive: true });

      // Generate LLM prompt
      const llmPrompt = this.generateLLMPrompt(llmAnswers.llm);

      spinner.succeed('Manual mode initialized');
      console.log();
      console.log(chalk.green('✅ Manual Mode Setup Complete'));
      console.log();
      console.log(chalk.cyan('📋 Use this prompt with your LLM:'));
      console.log(chalk.gray('─'.repeat(80)));
      console.log(llmPrompt);
      console.log(chalk.gray('─'.repeat(80)));
      console.log();
      console.log(chalk.dim('Next steps:'));
      console.log(chalk.dim('  1. Copy the prompt above'));
      console.log(chalk.dim('  2. Paste it into your ' + llmAnswers.llm + ' conversation'));
      console.log(chalk.dim('  3. Follow the LLM instructions to update memory files'));
      console.log(chalk.dim('  4. Commit changes to git'));
      console.log();

      return Ok({
        mode: 'manual',
        projectPath: this.cwd,
        filesCreated: [aiDir, aicfDir],
        message: 'Manual mode initialized. Use the prompt above to trigger LLM updates.',
        platforms: [llmAnswers.llm],
        llmPrompt,
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
    spinner.stop();

    try {
      // Ask which platforms they use
      console.log();
      const platformAnswers = await inquirer.prompt([
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

      // Ask permission to scan for existing data
      const allowScan = await this.askPermissionToScan();

      // Show data discovery results if permission granted
      if (allowScan) {
        await this.showDataDiscovery(platformAnswers.platforms);
      }

      spinner.start('Setting up automatic mode...');

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

      // Store selected platforms
      this.selectedPlatforms = {
        augment: platformAnswers.platforms.includes('augment'),
        warp: platformAnswers.platforms.includes('warp'),
        claudeDesktop: platformAnswers.platforms.includes('claude-desktop'),
        claudeCli: platformAnswers.platforms.includes('claude-cli'),
        copilot: platformAnswers.platforms.includes('copilot'),
        chatgpt: platformAnswers.platforms.includes('chatgpt'),
      };

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
      console.log(chalk.cyan('📊 Enabled Platforms:'));
      platformAnswers.platforms.forEach((p: string) => {
        console.log(chalk.dim(`  ✓ ${p}`));
      });
      console.log();
      console.log(chalk.cyan('📁 Library Data Scanning'));
      console.log(chalk.dim('The watcher will automatically scan your LLM library folders for:'));
      platformAnswers.platforms.forEach((p: string) => {
        if (p === 'claude-cli') {
          console.log(chalk.dim(`  • Claude CLI: ~/.claude/projects/`));
        } else if (p === 'claude-desktop') {
          console.log(chalk.dim(`  • Claude Desktop: ~/Library/Application Support/Claude/`));
        } else if (p === 'augment') {
          console.log(chalk.dim(`  • Augment: Augment LevelDB format`));
        }
      });
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
        mode: 'automatic',
        projectPath: this.cwd,
        filesCreated,
        message: 'Automatic mode initialized. Watcher is ready to start.',
        platforms: platformAnswers.platforms,
      });
    } catch (error) {
      spinner.fail('Failed to initialize automatic mode');
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Generate LLM prompt for manual mode
   */
  private generateLLMPrompt(llm: string): string {
    const projectPath = this.cwd;
    const timestamp = new Date().toISOString();

    return `You are helping me maintain an AI Context Format (AICF) memory system for my project.

📁 Project Path: ${projectPath}
🤖 LLM Platform: ${llm}
⏰ Initialized: ${timestamp}

Your task is to help me consolidate our conversation into structured memory files.

## What to do:

1. **Read the existing memory files** (if they exist):
   - \`.aicf/\` - Machine-readable AICF format files
   - \`.ai/\` - Human-readable markdown documentation

2. **Extract from our conversation**:
   - Key decisions we made
   - Technical work completed
   - Problems we solved
   - Next steps and action items
   - Important context for future sessions

3. **Update the memory files**:
   - Create/update \`.aicf/index.aicf\` with structured data
   - Create/update \`.ai/conversation-log.md\` with detailed notes
   - Create/update \`.ai/technical-decisions.md\` if we made technical choices
   - Create/update \`.ai/next-steps.md\` with planned work

4. **Format guidelines**:
   - AICF files use pipe-delimited format: \`@SECTION|key=value|key=value\`
   - Markdown files use standard markdown with clear sections
   - Be concise but comprehensive
   - Preserve all important context

5. **When you're done**:
   - Show me the updated files
   - I'll review and commit them to git

## Example AICF format:
\`\`\`
@CONVERSATION:C1-CP1
timestamp_start=2025-10-23T10:00:00Z
timestamp_end=2025-10-23T11:00:00Z
messages=50
tokens=12345

@DECISIONS
decision_name|reasoning|impact=HIGH
\`\`\`

Ready to help! Just ask me to "update memory files" when you want me to consolidate our conversation.`;
  }

  /**
   * Generate permissions file content
   */
  private generatePermissionsFile(): string {
    const platformStatuses = Object.entries(this.selectedPlatforms)
      .map(([platform, enabled]) => {
        const platformName = platform
          .replace(/([A-Z])/g, '-$1')
          .toLowerCase()
          .replace(/^-/, '');
        const status = enabled ? 'active' : 'inactive';
        const consent = enabled ? 'explicit' : 'pending';
        return `@PLATFORM|name=${platformName}|status=${status}|consent=${consent}|timestamp=${new Date().toISOString()}`;
      })
      .join('\n');

    return `@PERMISSIONS|version=1.0|format=aicf
${platformStatuses}
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
            enabled: this.selectedPlatforms.augment,
            cachePath: '.cache/llm/augment',
            checkInterval: 5000,
          },
          warp: {
            enabled: this.selectedPlatforms.warp,
            cachePath: '.cache/llm/warp',
            checkInterval: 5000,
          },
          'claude-cli': {
            enabled: this.selectedPlatforms.claudeCli,
            cachePath: '.cache/llm/claude-cli',
            checkInterval: 0,
            importMode: true,
          },
          'claude-desktop': {
            enabled: this.selectedPlatforms.claudeDesktop,
            cachePath: '.cache/llm/claude-desktop',
            checkInterval: 5000,
          },
          copilot: {
            enabled: this.selectedPlatforms.copilot,
            cachePath: '.cache/llm/copilot',
            checkInterval: 5000,
          },
          chatgpt: {
            enabled: this.selectedPlatforms.chatgpt,
            cachePath: '.cache/llm/chatgpt',
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
