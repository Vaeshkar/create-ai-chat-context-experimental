/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Migrate Old AICF Command
 * Converts old v3.0-alpha AICF files to new JSON format
 */

import chalk from 'chalk';
import ora from 'ora';
import { migrateOldAICF } from '../scripts/migrate-old-aicf.js';

export interface MigrateOldAICFCommandOptions {
  cwd?: string;
  verbose?: boolean;
}

export class MigrateOldAICFCommand {
  private cwd: string;

  constructor(options: MigrateOldAICFCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
  }

  async execute(): Promise<void> {
    console.log();
    console.log(chalk.cyan('🔄 Migrating Old AICF Files'));
    console.log();
    console.log(chalk.dim('This will convert old v3.0-alpha AICF files to the new JSON format.'));
    console.log(chalk.dim('Old files will be moved to .aicf/archive/migrated/'));
    console.log();

    const spinner = ora('Scanning for old AICF files...').start();

    try {
      const result = await migrateOldAICF(this.cwd);

      spinner.succeed('Migration complete');
      console.log();
      console.log(chalk.cyan('📊 Migration Summary:'));
      console.log(chalk.green(`   ✅ Migrated: ${result.migrated}`));
      console.log(chalk.yellow(`   ⏭️  Skipped: ${result.skipped}`));
      if (result.errors > 0) {
        console.log(chalk.red(`   ❌ Errors: ${result.errors}`));
      }
      console.log();

      if (result.migrated > 0) {
        console.log(chalk.green('🎉 Migration successful!'));
        console.log();
        console.log(chalk.dim('The new JSON files are in .aicf/raw/'));
        console.log(chalk.dim('The watchers will process them automatically.'));
        console.log();
        console.log(chalk.dim('To start the watchers, run:'));
        console.log(chalk.cyan('  aether watch'));
        console.log();
      } else {
        console.log(chalk.yellow('No files to migrate.'));
        console.log();
      }
    } catch (error) {
      spinner.fail('Migration failed');
      console.error();
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      console.error();
      process.exit(1);
    }
  }
}
