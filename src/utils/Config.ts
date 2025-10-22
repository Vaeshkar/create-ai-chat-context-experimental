/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

const CONFIG_FILE = '.ai/config.json';

/**
 * Configuration interface
 */
export interface AppConfig {
  preferredModel: string | null;
  showAllModels: boolean;
  useAiNativeFormat: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  preferredModel: null,
  showAllModels: false,
  useAiNativeFormat: false,
};

/**
 * Get configuration file path
 */
export function getConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILE);
}

/**
 * Load configuration
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<AppConfig> {
  const configPath = getConfigPath(cwd);

  try {
    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      return { ...DEFAULT_CONFIG, ...config };
    }
  } catch {
    // If config is corrupted, return defaults
    console.warn(chalk.yellow('⚠️  Config file corrupted, using defaults'));
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration
 */
export async function saveConfig(
  config: Partial<AppConfig>,
  cwd: string = process.cwd()
): Promise<AppConfig> {
  const configPath = getConfigPath(cwd);
  const aiDir = path.dirname(configPath);

  // Ensure .ai directory exists
  await fs.ensureDir(aiDir);

  // Merge with existing config
  const existingConfig = await loadConfig(cwd);
  const newConfig = { ...existingConfig, ...config };

  await fs.writeJson(configPath, newConfig, { spaces: 2 });
  return newConfig;
}

/**
 * Get a specific config value
 */
export async function getConfigValue(
  key: keyof AppConfig,
  cwd: string = process.cwd()
): Promise<string | boolean | null> {
  const config = await loadConfig(cwd);
  return config[key];
}

/**
 * Set a specific config value
 */
export async function setConfigValue(
  key: keyof AppConfig,
  value: string | boolean | null,
  cwd: string = process.cwd()
): Promise<AppConfig> {
  const config = await loadConfig(cwd);
  (config as unknown as Record<string, unknown>)[key] = value;
  await saveConfig(config, cwd);
  return config;
}

/**
 * List all configuration
 */
export async function listConfig(cwd: string = process.cwd()): Promise<void> {
  const config = await loadConfig(cwd);

  console.log(chalk.bold.cyan('\n⚙️  Configuration\n'));

  if (config.preferredModel) {
    console.log(`${chalk.bold('Preferred Model:')} ${chalk.cyan(config.preferredModel)}`);
  } else {
    console.log(`${chalk.bold('Preferred Model:')} ${chalk.gray('(not set)')}`);
  }

  console.log(
    `${chalk.bold('Show All Models:')} ${config.showAllModels ? chalk.green('Yes') : chalk.gray('No')}`
  );

  console.log(
    `${chalk.bold('AI-Native Format:')} ${
      config.useAiNativeFormat
        ? chalk.green('Enabled') + chalk.gray(' (85% token reduction!)')
        : chalk.gray('Disabled') + chalk.gray(' (using YAML)')
    }`
  );

  console.log();
  console.log(chalk.gray("💡 Tip: Use 'npx aic config set <key> <value>' to change settings"));
  console.log();
}

/**
 * Handle config command
 */
export async function handleConfigCommand(
  action?: string,
  key?: string,
  value?: string
): Promise<void> {
  const cwd = process.cwd();

  try {
    // Check if .ai directory exists
    const aiDir = path.join(cwd, '.ai');
    if (!(await fs.pathExists(aiDir))) {
      console.log(chalk.yellow("\n⚠️  No .ai/ directory found. Run 'npx aic init' first.\n"));
      return;
    }

    if (!action || action === 'list') {
      // List all config
      await listConfig(cwd);
      return;
    }

    if (action === 'get') {
      // Get specific value
      if (!key) {
        console.log(chalk.red('\n❌ Error: Please specify a config key\n'));
        console.log(chalk.gray('Usage: npx aic config get <key>\n'));
        return;
      }

      const configValue = await getConfigValue(key as keyof AppConfig, cwd);
      console.log(chalk.cyan(configValue || '(not set)'));
      return;
    }

    if (action === 'set') {
      // Set specific value
      if (!key || value === undefined) {
        console.log(chalk.red('\n❌ Error: Please specify both key and value\n'));
        console.log(chalk.gray('Usage: npx aic config set <key> <value>\n'));
        return;
      }

      // Validate known keys
      if (key === 'preferredModel') {
        await setConfigValue('preferredModel', value, cwd);
        console.log(chalk.green(`\n✅ Preferred model set to: ${chalk.cyan(value)}\n`));
        console.log(
          chalk.gray("💡 Run 'npx aic tokens' to see how your context fits in this model\n")
        );
      } else if (key === 'showAllModels') {
        const boolValue = value === 'true' || value === '1' || value === 'yes';
        await setConfigValue('showAllModels', boolValue, cwd);
        console.log(chalk.green(`\n✅ Show all models set to: ${chalk.cyan(String(boolValue))}\n`));
      } else if (key === 'useAiNativeFormat') {
        const boolValue = value === 'true' || value === '1' || value === 'yes';
        await setConfigValue('useAiNativeFormat', boolValue, cwd);
        console.log(
          chalk.green(`\n✅ AI-native format set to: ${chalk.cyan(String(boolValue))}\n`)
        );
        console.log(
          chalk.gray(
            boolValue
              ? '💡 chat-finish will now generate ultra-compact format (85% token reduction!)'
              : '💡 chat-finish will use YAML format (human-readable)'
          )
        );
        console.log(chalk.gray('\n'));
      } else {
        console.log(chalk.yellow(`\n⚠️  Unknown config key: ${key}\n`));
        console.log(chalk.gray('Available keys:'));
        console.log(chalk.gray('  - preferredModel'));
        console.log(chalk.gray('  - showAllModels'));
        console.log(chalk.gray('  - useAiNativeFormat\n'));
      }
      return;
    }

    // Unknown action
    console.log(chalk.red(`\n❌ Unknown action: ${action}\n`));
    console.log(chalk.gray('Available actions:'));
    console.log(chalk.gray('  - list (default)'));
    console.log(chalk.gray('  - get <key>'));
    console.log(chalk.gray('  - set <key> <value>\n'));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red('\n❌ Error:'), errorMessage);
    console.log();
  }
}
