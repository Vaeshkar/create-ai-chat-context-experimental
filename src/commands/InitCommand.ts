/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Init Command - Initialize AETHER
 * Phase 6: November 2025
 *
 * AETHER: Adaptive External Thinking & Holistic Experiential Recall
 * Automatic-only mode with beautiful CLI flow
 */

import { join } from 'path';
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  copyFileSync,
  readdirSync,
  statSync,
} from 'fs';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import inquirer from 'inquirer';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { getTemplatesDir } from '../utils/PackageRoot.js';
import { PlatformDetector, type PlatformDetectionSummary } from '../utils/PlatformDetector.js';
import { ApiKeyScanner } from '../utils/ApiKeyScanner.js';
import { AetherWatcher } from '../watchers/AetherWatcher.js';
import { ClaudeCliWatcher } from '../watchers/ClaudeCliWatcher.js';
import { ClaudeDesktopWatcher } from '../watchers/ClaudeDesktopWatcher.js';
import { DaemonManager } from '../utils/DaemonManager.js';
import { spawn } from 'child_process';
import { showBanner } from '../utils/AetherBanner.js';

export interface InitCommandOptions {
  cwd?: string;
  force?: boolean;
  verbose?: boolean;
}

export interface InitResult {
  projectPath: string;
  filesCreated: string[];
  message: string;
  platforms: string[];
  watcherStarted: boolean;
}

export interface PlatformSelection {
  augment: boolean;
  warp: boolean;
  claudeDesktop: boolean;
  claudeCli: boolean;
  copilot: boolean;
  chatgpt: boolean;
}

// AETHER ASCII Logo
// AETHER banner is now in AetherBanner.ts utility

/**
 * Initialize AETHER in a project
 * Automatic-only mode with beautiful CLI flow
 */
export class InitCommand {
  private cwd: string;
  private force: boolean;
  private verbose: boolean;
  private selectedPlatforms: PlatformSelection = {
    augment: false,
    warp: false,
    claudeDesktop: false,
    claudeCli: false,
    copilot: false,
    chatgpt: false,
  };
  private aetherWatcher: AetherWatcher | null = null;

  constructor(options: InitCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.force = options.force || false;
    this.verbose = options.verbose || false;
  }

  /**
   * Execute init command - AETHER flow
   */
  async execute(): Promise<Result<InitResult>> {
    try {
      const spinner = ora();

      // Step 1: Check if already initialized (before showing banner)
      if (!this.force) {
        const checkResult = this.checkNotInitialized();
        if (!checkResult.ok) {
          return checkResult;
        }
      }

      // Step 2: Show AETHER logo and welcome (with shimmer animation)
      await this.showWelcome();

      // Step 3: Ask permission to access LLM libraries
      const hasPermission = await this.askPermission();
      if (!hasPermission) {
        return Err(
          new Error('Permission denied. Cannot initialize AETHER without access to LLM libraries.')
        );
      }

      // Step 4: Auto-detect platforms
      spinner.start('Scanning for LLM platforms...');
      const detector = new PlatformDetector();
      const detection = await detector.detectAll();
      spinner.succeed('Platform scan complete');

      // Show detection results
      this.showDetectionResults(detection);

      // Step 5: Ask user to select platforms
      const selectedPlatforms = await this.askPlatformSelection(detection);
      if (selectedPlatforms.length === 0) {
        return Err(
          new Error(
            'No platforms selected. Cannot initialize AETHER without at least one platform.'
          )
        );
      }

      // Step 6: Handle Claude API key
      const apiKeyResult = await this.handleApiKey();
      if (!apiKeyResult.ok) {
        console.log(
          chalk.yellow(
            '\n⚠️  PrincipleWatcher will be disabled until you add ANTHROPIC_API_KEY to .env'
          )
        );
      }

      // Step 7: Ask about initial import
      const shouldImport = await this.askInitialImport(detection);

      // Step 8: Create directory structure
      spinner.start('Creating directory structure...');
      const filesCreated = this.createDirectoryStructure();
      spinner.succeed('Directory structure created');

      // Step 9: Create configuration files
      spinner.start('Creating configuration files...');
      this.createConfigFiles(selectedPlatforms);
      spinner.succeed('Configuration files created');

      // Step 10: Update .gitignore
      spinner.start('Updating .gitignore...');
      this.updateGitignore();
      spinner.succeed('.gitignore updated');

      // Step 11: Copy template files
      spinner.start('Copying template files...');
      this.copyTemplateFiles();
      spinner.succeed('Template files copied');

      // Step 12: Initial import (if requested)
      if (shouldImport) {
        console.log(chalk.cyan('\n📦 Initial import will be performed when watcher starts...'));
      }

      // Step 13: Ask to start AETHER watcher
      const shouldStart = await this.askStartWatcher();
      let watcherStarted = false;

      if (shouldStart) {
        spinner.start('Starting AETHER watcher...');
        const startResult = await this.startAetherWatcher();
        if (startResult.ok) {
          spinner.succeed('AETHER watcher started');
          watcherStarted = true;
        } else {
          spinner.fail('Failed to start AETHER watcher');
          console.log(chalk.yellow(`\n⚠️  ${startResult.error.message}`));
        }
      }

      // Step 14: Show success summary
      this.showSuccessSummary(selectedPlatforms, watcherStarted);

      return Ok({
        projectPath: this.cwd,
        filesCreated,
        message: 'AETHER initialized successfully',
        platforms: selectedPlatforms,
        watcherStarted,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if project is not already initialized
   */
  private checkNotInitialized(): Result<void> {
    const aicfDir = join(this.cwd, '.aicf');
    const permissionsFile = join(this.cwd, '.aicf', '.permissions.aicf');

    // If .aicf and .permissions.aicf exist, it's already initialized
    if (existsSync(aicfDir) && existsSync(permissionsFile)) {
      return Err(new Error('AETHER already initialized. Use --force to reinitialize.'));
    }

    return Ok(undefined);
  }

  /**
   * Show AETHER welcome message with logo
   * Uses animated shimmer banner for first-time setup
   */
  private async showWelcome(): Promise<void> {
    // Show animated banner for first-time setup (beautiful neural signal effect)
    await showBanner(true);
  }

  /**
   * Ask permission to access LLM libraries
   */
  private async askPermission(): Promise<boolean> {
    console.log(chalk.cyan('📁 Data Access & Privacy'));
    console.log();
    console.log('AETHER needs to access your LLM library folders to capture conversations.');
    console.log();
    console.log(chalk.dim('What we access:'));
    console.log(
      chalk.dim('  • Augment: ~/Library/Application Support/Code/User/workspaceStorage/')
    );
    console.log(chalk.dim('  • Claude Desktop: ~/Library/Application Support/Claude/'));
    console.log(chalk.dim('  • Claude CLI: ~/.claude/'));
    console.log(chalk.dim('  • Warp: ~/Library/Application Support/warp-terminal/'));
    console.log();
    console.log(chalk.dim('What we do:'));
    console.log(chalk.dim('  ✓ Read conversation data from LevelDB/SQLite databases'));
    console.log(chalk.dim('  ✓ Extract and consolidate into .aicf/ format'));
    console.log(chalk.dim('  ✓ Store principles, decisions, and insights locally'));
    console.log();
    console.log(chalk.dim("What we DON'T do:"));
    console.log(chalk.dim('  ✗ Send data to external servers'));
    console.log(chalk.dim('  ✗ Modify your LLM databases'));
    console.log(chalk.dim('  ✗ Access any other files'));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'permission',
        message: 'Do you grant permission to access your LLM library folders?',
        default: true,
      },
    ]);

    return answers.permission;
  }

  /**
   * Show platform detection results
   */
  private showDetectionResults(detection: PlatformDetectionSummary): void {
    console.log();
    console.log(chalk.cyan('🔍 Found platforms:'));
    console.log();

    for (const platform of detection.platforms) {
      if (platform.available) {
        const name = platform.platform
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        const count = platform.conversationCount || 0;
        const size = platform.size || 'Unknown';
        const dbCount = platform.databaseCount || 0;

        console.log(chalk.green(`  ✓ ${name}`));
        if (count > 0) {
          console.log(chalk.dim(`    ${dbCount} database(s), ~${count} conversations, ${size}`));
        } else {
          console.log(chalk.dim(`    ${dbCount} database(s), ${size}`));
        }
      } else {
        const name = platform.platform
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase());
        console.log(chalk.dim(`  ✗ ${name} (not found)`));
      }
    }

    if (detection.totalConversations > 0) {
      console.log();
      console.log(
        chalk.cyan(
          `📊 Total: ~${detection.totalConversations} conversations, ${detection.totalSize}`
        )
      );
    }
    console.log();
  }

  /**
   * Ask user to select platforms
   */
  private async askPlatformSelection(detection: PlatformDetectionSummary): Promise<string[]> {
    const availablePlatforms = detection.platforms.filter((p) => p.available);

    if (availablePlatforms.length === 0) {
      console.log(
        chalk.yellow(
          '⚠️  No platforms detected. You can still initialize AETHER and add platforms later.'
        )
      );
      return [];
    }

    const choices = detection.platforms.map((p) => {
      const name = p.platform.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
      const count = p.conversationCount || 0;
      const label = count > 0 ? `${name} (~${count} conversations)` : name;

      return {
        name: label,
        value: p.platform,
        checked: p.available, // Auto-check available platforms
        disabled: !p.available ? 'not detected' : false,
      };
    });

    // @ts-expect-error - inquirer types are complex, but this works at runtime
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'platforms',
        message: 'Which platforms should AETHER monitor?',
        choices,
        validate: (answer: string[]) => {
          if (answer.length === 0) {
            return 'Please select at least one platform (or press Ctrl+C to cancel)';
          }
          return true;
        },
      },
    ]);

    return answers.platforms as string[];
  }

  /**
   * Handle Claude API key (scan or ask for input)
   */
  private async handleApiKey(): Promise<Result<void>> {
    console.log();
    console.log(chalk.cyan('🔑 Claude API Key'));
    console.log();
    console.log('AETHER uses Claude API to validate and improve extracted principles.');
    console.log();

    const scanner = new ApiKeyScanner(this.cwd);
    const scanResult = await scanner.scan();

    if (scanResult.found && scanResult.valid) {
      console.log(chalk.green(`✓ Found valid API key in ${scanResult.file}`));
      console.log(chalk.dim(`  Key: ${ApiKeyScanner.maskKey(scanResult.key!)}`));
      return Ok(undefined);
    }

    if (scanResult.found && !scanResult.valid) {
      console.log(chalk.yellow(`⚠️  Found invalid API key in ${scanResult.file}`));
      console.log(chalk.dim('  API keys should start with "sk-ant-"'));
    }

    // Ask user what to do
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to provide your Claude API key?',
        choices: [
          { name: 'Enter it now', value: 'enter' },
          { name: "I'll add it to .env later (PrincipleWatcher will be disabled)", value: 'later' },
        ],
        default: 'enter',
      },
    ]);

    if (answers.action === 'later') {
      await scanner.createExample();
      console.log(chalk.dim('\n  Created .env.example - copy it to .env and add your API key'));
      return Err(new Error('API key not provided'));
    }

    // Ask for API key
    const keyAnswers = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Enter your Claude API key:',
        mask: '*',
        validate: (input: string) => {
          if (!input || input.length === 0) {
            return 'API key cannot be empty';
          }
          if (!input.startsWith('sk-ant-')) {
            return 'Invalid API key format (should start with "sk-ant-")';
          }
          return true;
        },
      },
    ]);

    // Save key to .env
    const saveResult = await scanner.saveKey(keyAnswers.key);
    if (!saveResult.ok) {
      return saveResult;
    }

    await scanner.createExample();
    console.log(chalk.green('\n✓ API key saved to .env'));
    console.log(chalk.dim('  Created .env.example for reference'));

    return Ok(undefined);
  }

  /**
   * Ask about initial import
   */
  private async askInitialImport(detection: PlatformDetectionSummary): Promise<boolean> {
    if (detection.totalConversations === 0) {
      return false;
    }

    console.log();
    console.log(chalk.cyan('📦 Initial Import'));
    console.log();
    console.log('We found existing conversations in your LLM libraries:');
    console.log(
      chalk.dim(
        `  • Total: ~${detection.totalConversations} conversations (${detection.totalSize})`
      )
    );
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'import',
        message: 'Import existing conversations now?',
        default: true,
      },
    ]);

    return answers.import;
  }

  /**
   * Create directory structure
   */
  private createDirectoryStructure(): string[] {
    const filesCreated: string[] = [];

    // Create main directories
    const aicfDir = join(this.cwd, '.aicf');
    const aiDir = join(this.cwd, '.ai');
    const cacheLlmDir = join(this.cwd, '.cache', 'llm');

    mkdirSync(aicfDir, { recursive: true });
    mkdirSync(aiDir, { recursive: true });
    mkdirSync(cacheLlmDir, { recursive: true });

    filesCreated.push(aicfDir, aiDir, cacheLlmDir);

    // Create AICF subdirectories
    const rawDir = join(aicfDir, 'raw');
    const recentDir = join(aicfDir, 'recent');
    const sessionsDir = join(aicfDir, 'sessions');
    const mediumDir = join(aicfDir, 'medium');
    const oldDir = join(aicfDir, 'old');
    const archiveDir = join(aicfDir, 'archive');

    mkdirSync(rawDir, { recursive: true });
    mkdirSync(recentDir, { recursive: true });
    mkdirSync(sessionsDir, { recursive: true });
    mkdirSync(mediumDir, { recursive: true });
    mkdirSync(oldDir, { recursive: true });
    mkdirSync(archiveDir, { recursive: true });

    filesCreated.push(rawDir, recentDir, sessionsDir, mediumDir, oldDir, archiveDir);

    return filesCreated;
  }

  /**
   * Create configuration files
   */
  private createConfigFiles(selectedPlatforms: string[]): void {
    // Update selectedPlatforms object
    this.selectedPlatforms = {
      augment: selectedPlatforms.includes('augment'),
      warp: selectedPlatforms.includes('warp'),
      claudeDesktop: selectedPlatforms.includes('claude-desktop'),
      claudeCli: selectedPlatforms.includes('claude-cli'),
      copilot: selectedPlatforms.includes('copilot'),
      chatgpt: selectedPlatforms.includes('chatgpt'),
    };

    // Create .permissions.aicf
    const aicfDir = join(this.cwd, '.aicf');
    const permissionsFile = join(aicfDir, '.permissions.aicf');
    const permissionsContent = this.generatePermissionsFile();
    writeFileSync(permissionsFile, permissionsContent, 'utf-8');

    // Create .watcher-config.json
    const configFile = join(aicfDir, '.watcher-config.json');
    const configContent = this.generateWatcherConfig();
    writeFileSync(configFile, configContent, 'utf-8');

    // Create empty principles, decisions, insights files
    const principlesFile = join(aicfDir, 'principles.aicf');
    const decisionsFile = join(aicfDir, 'decisions.aicf');
    const insightsFile = join(aicfDir, 'insights.aicf');

    if (!existsSync(principlesFile)) {
      writeFileSync(principlesFile, '@PRINCIPLES|version=3.1|format=aicf\n', 'utf-8');
    }
    if (!existsSync(decisionsFile)) {
      writeFileSync(decisionsFile, '@DECISIONS|version=3.1|format=aicf\n', 'utf-8');
    }
    if (!existsSync(insightsFile)) {
      writeFileSync(insightsFile, '@INSIGHTS|version=3.1|format=aicf\n', 'utf-8');
    }
  }

  /**
   * Ask if user wants to start AETHER watcher
   */
  private async askStartWatcher(): Promise<boolean> {
    console.log();
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'start',
        message: 'Start AETHER watcher now?',
        default: true,
      },
    ]);

    return answers.start;
  }

  /**
   * Start AETHER watcher
   */
  private async startAetherWatcher(): Promise<Result<void>> {
    try {
      // Check if API key is available
      const apiKey = process.env['ANTHROPIC_API_KEY'];
      const enablePrincipleWatcher = !!apiKey;

      // Create AetherWatcher instance
      this.aetherWatcher = new AetherWatcher({
        cwd: this.cwd,
        verbose: this.verbose,
        enablePrincipleWatcher,
        pollInterval: 300000, // 5 minutes
      });

      // Start the watcher
      const result = await this.aetherWatcher.start();
      if (!result.ok) {
        return result;
      }

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Show success summary
   */
  private showSuccessSummary(platforms: string[], watcherStarted: boolean): void {
    console.log();
    console.log(chalk.green('✅ AETHER initialized successfully!'));
    console.log();

    if (watcherStarted) {
      console.log(chalk.cyan("🌌 What's running:"));
      console.log(chalk.dim('  • AETHER watcher daemon'));
      console.log(chalk.dim(`  • Monitoring: ${platforms.join(', ')}`));
      console.log(chalk.dim('  • Capturing conversations every 5 minutes'));
      console.log();
    }

    console.log(chalk.cyan('🎯 Next steps:'));
    if (watcherStarted) {
      console.log(chalk.dim('  • Check status: aether status'));
      console.log(chalk.dim('  • View logs: aether logs'));
      console.log(chalk.dim('  • Stop watcher: aether stop'));
    } else {
      console.log(chalk.dim('  • Start watcher: aether watch'));
      console.log(chalk.dim('  • Check status: aether status'));
    }
    console.log();

    console.log(
      chalk.cyan('💡 AETHER will now automatically capture and learn from your conversations.')
    );
    console.log(chalk.dim('   Everything stays local. Your data never leaves your machine.'));
    console.log();
    console.log(chalk.cyan('🎉 Happy thinking!'));
    console.log();
  }

  /**
   * Migrate existing setup from base package to experimental
   * Adds missing files and asks for mode preference
   * @deprecated - Old method, kept for compatibility
   */
  // @ts-expect-error - Deprecated method, kept for compatibility
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
   * @deprecated - Old method, kept for compatibility
   */
  private async askMode(): Promise<'manual' | 'automatic'> {
    // Always return automatic (AETHER is automatic-only)
    return 'automatic';
  }

  /**
   * Ask user for mode: manual or automatic (old implementation)
   * @deprecated - Old method, kept for compatibility
   */
  // @ts-expect-error - Deprecated method, kept for compatibility
  private async askModeOld(): Promise<'manual' | 'automatic'> {
    console.log();
    console.log(chalk.cyan('🔐 Conversation Capture Mode'));
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
            name: 'Automatic - Read conversations from my LLM libraries automatically',
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
      console.log(chalk.dim('These will be imported when you run: aether watch'));
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
            { name: 'Claude CLI', value: 'claude-cli' },
            { name: 'Claude Desktop', value: 'claude-desktop' },
            { name: 'Claude (Web) - Coming Soon', value: 'claude-web', disabled: true },
            { name: 'ChatGPT - Coming Soon', value: 'chatgpt', disabled: true },
            { name: 'Copilot - Coming Soon', value: 'copilot', disabled: true },
            { name: 'Warp - Coming Soon', value: 'warp', disabled: true },
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

      // Create Phase 6-8 directory structure
      const recentDir = join(aicfDir, 'recent');
      const sessionsDir = join(aicfDir, 'sessions');
      const mediumDir = join(aicfDir, 'medium');
      const oldDir = join(aicfDir, 'old');
      const archiveDir = join(aicfDir, 'archive');

      mkdirSync(recentDir, { recursive: true });
      mkdirSync(sessionsDir, { recursive: true });
      mkdirSync(mediumDir, { recursive: true });
      mkdirSync(oldDir, { recursive: true });
      mkdirSync(archiveDir, { recursive: true });

      // Copy template files
      this.copyTemplateFiles();

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
        projectPath: this.cwd,
        filesCreated: [aiDir, aicfDir, recentDir, sessionsDir, mediumDir, oldDir, archiveDir],
        message: 'Manual mode initialized. Use the prompt above to trigger LLM updates.',
        platforms: [llmAnswers.llm],
        watcherStarted: false,
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
      // Show consent information
      console.log();
      console.log(chalk.cyan('📁 Data Discovery'));
      console.log(chalk.dim('To set up automatic mode, we need your permission to:'));
      console.log(chalk.dim('  • Read conversations from your LLM library folders'));
      console.log(chalk.dim('  • Extract and consolidate them into memory files'));
      console.log(chalk.dim('  • Store them locally in .aicf/ and .ai/ directories'));
      console.log();

      // Ask which platforms they use
      console.log();
      const platformAnswers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'platforms',
          message: 'Which LLM platforms do you use? (Select all that apply)',
          choices: [
            { name: 'Augment', value: 'augment', checked: true },
            { name: 'Claude CLI', value: 'claude-cli' },
            { name: 'Claude Desktop', value: 'claude-desktop' },
            { name: 'Warp - Coming Soon', value: 'warp', disabled: true },
            { name: 'Copilot - Coming Soon', value: 'copilot', disabled: true },
            { name: 'ChatGPT - Coming Soon', value: 'chatgpt', disabled: true },
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

      // Create Phase 6-8 directory structure
      const recentDir = join(aicfDir, 'recent');
      const sessionsDir = join(aicfDir, 'sessions');
      const mediumDir = join(aicfDir, 'medium');
      const oldDir = join(aicfDir, 'old');
      const archiveDir = join(aicfDir, 'archive');

      mkdirSync(recentDir, { recursive: true });
      mkdirSync(sessionsDir, { recursive: true });
      mkdirSync(mediumDir, { recursive: true });
      mkdirSync(oldDir, { recursive: true });
      mkdirSync(archiveDir, { recursive: true });

      filesCreated.push(
        cacheLlmDir,
        aiDir,
        aicfDir,
        recentDir,
        sessionsDir,
        mediumDir,
        oldDir,
        archiveDir
      );

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

      // Step 5: Copy template files
      spinner.text = 'Copying template files...';
      this.copyTemplateFiles();

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
      console.log(chalk.cyan('✅ Automatic mode initialized'));
      console.log();

      // Auto-start watcher in background
      console.log(chalk.cyan('🚀 Starting watcher in background...'));
      const watcherStarted = await this.startWatcherDaemon();

      if (watcherStarted) {
        console.log(chalk.green('✅ Watcher started successfully'));
        console.log();
        console.log(chalk.dim('To check watcher status, run:'));
        console.log(chalk.cyan('  aether status'));
        console.log();
        console.log(chalk.dim('To stop the watcher, run:'));
        console.log(chalk.cyan('  aether stop'));
        console.log();
      } else {
        console.log(chalk.yellow('⚠️  Failed to start watcher automatically'));
        console.log();
        console.log(chalk.dim('To start the watcher manually, run:'));
        console.log(chalk.cyan('  aether watch'));
        console.log();
      }

      return Ok({
        projectPath: this.cwd,
        filesCreated,
        message: 'Automatic mode initialized. Watcher is running in background.',
        platforms: platformAnswers.platforms,
        watcherStarted: true,
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
    const FIVE_MINUTES = 300000; // 5 minutes in milliseconds
    return JSON.stringify(
      {
        version: '1.0',
        platforms: {
          augment: {
            enabled: this.selectedPlatforms.augment,
            cachePath: '.cache/llm/augment',
            checkInterval: FIVE_MINUTES,
          },
          warp: {
            enabled: this.selectedPlatforms.warp,
            cachePath: '.cache/llm/warp',
            checkInterval: FIVE_MINUTES,
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
            checkInterval: FIVE_MINUTES,
          },
          copilot: {
            enabled: this.selectedPlatforms.copilot,
            cachePath: '.cache/llm/copilot',
            checkInterval: FIVE_MINUTES,
          },
          chatgpt: {
            enabled: this.selectedPlatforms.chatgpt,
            cachePath: '.cache/llm/chatgpt',
            checkInterval: FIVE_MINUTES,
          },
        },
        watcher: {
          interval: FIVE_MINUTES,
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

  /**
   * Copy template files from dist/templates to project directories
   * Smart merge: Only copies missing files or updates if template is newer
   *
   * New structure:
   * - templates/augment/ - Augment-specific templates (includes .augment/, .ai/, .aicf/)
   * - templates/cursor/ - Cursor-specific templates (future)
   * - templates/warp/ - Warp-specific templates (future)
   * - templates/shared/ - Shared templates across all platforms
   */
  private copyTemplateFiles(): void {
    try {
      // Find templates directory using PackageRoot utility
      // This works in both development and production, ESM and CJS
      const templatesDir = getTemplatesDir();

      if (!existsSync(templatesDir)) {
        if (this.verbose) {
          console.warn('⚠️  Warning: Could not find templates directory at:', templatesDir);
        }
        return;
      }

      // Determine which platform templates to use
      // For now, we only support Augment, but this will expand
      const platformDirs: string[] = [];

      if (this.selectedPlatforms.augment) {
        platformDirs.push('augment');
      }
      // Future: if (this.selectedPlatforms.cursor) platformDirs.push('cursor');
      // Future: if (this.selectedPlatforms.warp) platformDirs.push('warp');

      // If no platform-specific templates, fall back to shared
      if (platformDirs.length === 0) {
        platformDirs.push('shared');
      }

      // Copy templates from each selected platform
      for (const platform of platformDirs) {
        const platformTemplateDir = join(templatesDir, platform);

        if (!existsSync(platformTemplateDir)) {
          if (this.verbose) {
            console.warn(`⚠️  Warning: Platform template directory not found: ${platform}`);
          }
          continue;
        }

        this.copyPlatformTemplates(platformTemplateDir, platform);
      }

      // Always copy shared templates (they apply to all platforms)
      const sharedTemplateDir = join(templatesDir, 'shared');
      if (existsSync(sharedTemplateDir)) {
        this.copyPlatformTemplates(sharedTemplateDir, 'shared');
      }
    } catch (error) {
      // Silently fail if templates don't exist (e.g., in development)
      if (this.verbose) {
        console.warn('Warning: Could not copy template files:', error);
      }
    }
  }

  /**
   * Copy templates from a specific platform directory
   */
  private copyPlatformTemplates(platformTemplateDir: string, platformName: string): void {
    // Copy ai-instructions.md if it exists
    const aiInstructionsTemplate = join(platformTemplateDir, 'ai-instructions.md');
    if (existsSync(aiInstructionsTemplate)) {
      const aiInstructionsPath = join(this.cwd, '.ai-instructions');
      if (!existsSync(aiInstructionsPath)) {
        copyFileSync(aiInstructionsTemplate, aiInstructionsPath);
        if (this.verbose) {
          console.log(`📝 Copied .ai-instructions from ${platformName}`);
        }
      }
    }

    // Copy NEW_CHAT_PROMPT.md if it exists
    const newChatPromptTemplate = join(platformTemplateDir, 'NEW_CHAT_PROMPT.md');
    if (existsSync(newChatPromptTemplate)) {
      const newChatPromptPath = join(this.cwd, 'NEW_CHAT_PROMPT.md');
      if (!existsSync(newChatPromptPath)) {
        copyFileSync(newChatPromptTemplate, newChatPromptPath);
        if (this.verbose) {
          console.log(`📝 Copied NEW_CHAT_PROMPT.md from ${platformName}`);
        }
      }
    }

    // Copy .ai/ directory (universal AI context)
    this.copyAiDirectory(platformTemplateDir, platformName);

    // Copy .aicf/ directory (AICF format config)
    this.copyAicfDirectory(platformTemplateDir, platformName);

    // Copy platform-specific directories (e.g., .augment/, .cursor/, .warp/)
    this.copyPlatformSpecificDirectories(platformTemplateDir, platformName);
  }

  /**
   * Copy .ai/ directory with smart merge for critical files
   */
  private copyAiDirectory(platformTemplateDir: string, platformName: string): void {
    const aiTemplateDir = join(platformTemplateDir, '.ai');

    if (!existsSync(aiTemplateDir)) {
      return;
    }

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

      // Skip directories - handle them separately
      if (statSync(srcFile).isDirectory()) {
        continue;
      }

      if (!existsSync(destFile)) {
        // File doesn't exist - copy template
        copyFileSync(srcFile, destFile);
        if (this.verbose) {
          console.log(`📝 Copied .ai/${file} from ${platformName}`);
        }
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
            console.log(`📦 Updated .ai/${file} (template is newer)`);
          }
        } else {
          // User file is newer or same version - preserve it
          if (this.verbose) {
            console.log(`⏭️  Skipped .ai/${file} (user version is newer or customized)`);
          }
        }
      }
    }

    // Copy .ai/rules/ directory
    const aiRulesTemplateDir = join(aiTemplateDir, 'rules');
    if (existsSync(aiRulesTemplateDir)) {
      const aiRulesDir = join(aiDir, 'rules');
      mkdirSync(aiRulesDir, { recursive: true });

      const ruleFiles = readdirSync(aiRulesTemplateDir);
      for (const file of ruleFiles) {
        const srcFile = join(aiRulesTemplateDir, file);
        const destFile = join(aiRulesDir, file);

        if (!existsSync(destFile)) {
          copyFileSync(srcFile, destFile);
          if (this.verbose) {
            console.log(`📝 Copied .ai/rules/${file} from ${platformName}`);
          }
        }
      }
    }
  }

  /**
   * Copy .aicf/ directory
   */
  private copyAicfDirectory(platformTemplateDir: string, platformName: string): void {
    const aicfTemplateDir = join(platformTemplateDir, '.aicf');

    if (!existsSync(aicfTemplateDir)) {
      return;
    }

    const aicfDir = join(this.cwd, '.aicf');
    mkdirSync(aicfDir, { recursive: true });

    const aicfFiles = readdirSync(aicfTemplateDir);
    for (const file of aicfFiles) {
      const srcFile = join(aicfTemplateDir, file);
      const destFile = join(aicfDir, file);

      if (!existsSync(destFile)) {
        copyFileSync(srcFile, destFile);
        if (this.verbose) {
          console.log(`📝 Copied .aicf/${file} from ${platformName}`);
        }
      }
    }
  }

  /**
   * Copy platform-specific directories (e.g., .augment/, .cursor/, .warp/)
   */
  private copyPlatformSpecificDirectories(platformTemplateDir: string, platformName: string): void {
    // Map platform names to their directory names
    const platformDirMap: Record<string, string> = {
      augment: '.augment',
      cursor: '.cursor',
      warp: '.warp',
      // Add more platforms as needed
    };

    const platformDir = platformDirMap[platformName];
    if (!platformDir) {
      // Not a platform with specific directory (e.g., 'shared')
      return;
    }

    const platformSpecificTemplateDir = join(platformTemplateDir, platformDir);
    if (!existsSync(platformSpecificTemplateDir)) {
      return;
    }

    const platformSpecificDir = join(this.cwd, platformDir);
    mkdirSync(platformSpecificDir, { recursive: true });

    // Copy project-overview.md if it exists (auto-generated documentation)
    const projectOverviewSrc = join(platformSpecificTemplateDir, 'project-overview.md');
    const projectOverviewDest = join(platformSpecificDir, 'project-overview.md');
    if (existsSync(projectOverviewSrc) && !existsSync(projectOverviewDest)) {
      copyFileSync(projectOverviewSrc, projectOverviewDest);
      if (this.verbose) {
        console.log(`📝 Copied ${platformDir}/project-overview.md from ${platformName}`);
      }
    }

    // Copy rules/ subdirectory if it exists
    const rulesTemplateDir = join(platformSpecificTemplateDir, 'rules');
    if (existsSync(rulesTemplateDir)) {
      const rulesDir = join(platformSpecificDir, 'rules');
      mkdirSync(rulesDir, { recursive: true });

      const ruleFiles = readdirSync(rulesTemplateDir);
      for (const file of ruleFiles) {
        const srcFile = join(rulesTemplateDir, file);
        const destFile = join(rulesDir, file);

        if (!existsSync(destFile)) {
          copyFileSync(srcFile, destFile);
          if (this.verbose) {
            console.log(`📝 Copied ${platformDir}/rules/${file} from ${platformName}`);
          }
        }
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

  /**
   * Start watcher daemon in background
   */
  private async startWatcherDaemon(): Promise<boolean> {
    try {
      // Check if daemon is already running BEFORE spawning a new one
      const daemonManager = new DaemonManager(this.cwd);
      const statusResult = daemonManager.getStatus();

      if (statusResult.ok && statusResult.value.running) {
        // Daemon already running - don't spawn another one!
        if (this.verbose) {
          console.log(
            chalk.yellow('⚠️  Watcher daemon already running (PID: ' + statusResult.value.pid + ')')
          );
        }
        return true;
      }

      // Spawn aether watch as a detached background process
      const child = spawn('aether', ['watch'], {
        detached: true,
        stdio: 'ignore',
        cwd: this.cwd,
      });

      // Detach the child process so it continues running after parent exits
      child.unref();

      // Wait a bit to see if it starts successfully
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return true;
    } catch (error) {
      if (this.verbose) {
        console.error(chalk.red('Failed to start watcher:'), error);
      }
      return false;
    }
  }
}
