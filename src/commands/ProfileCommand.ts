/**
 * Profile Command
 * View, edit, or clear user profile
 */

import chalk from 'chalk';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export interface ProfileCommandOptions {
  cwd?: string;
}

export class ProfileCommand {
  private readonly cwd: string;

  constructor(options?: ProfileCommandOptions) {
    this.cwd = options?.cwd ?? process.cwd();
  }

  /**
   * Show user profile
   */
  async show(): Promise<void> {
    const profilePath = join(this.cwd, '.aicf', 'user-profile.aicf');

    if (!existsSync(profilePath)) {
      console.log(chalk.yellow('❌ No user profile found'));
      console.log(chalk.gray('   Run extraction to create profile: aether watch'));
      return;
    }

    const content = readFileSync(profilePath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    if (lines.length === 0) {
      console.log(chalk.yellow('❌ User profile is empty'));
      return;
    }

    console.log(chalk.bold('🧠 User Profile\n'));

    // Group by type
    const preferences: string[] = [];
    const patterns: string[] = [];
    const triggers: string[] = [];
    const communication: string[] = [];

    for (const line of lines) {
      if (line.includes('@PREFERENCE')) preferences.push(line);
      else if (line.includes('@PATTERN')) patterns.push(line);
      else if (line.includes('@TRIGGER')) triggers.push(line);
      else if (line.includes('@COMMUNICATION')) communication.push(line);
    }

    // Display preferences
    if (preferences.length > 0) {
      console.log(chalk.bold('📌 Preferences:'));
      for (const pref of preferences) {
        const parts = pref.split('|');
        if (parts.length >= 4) {
          const category = parts[1]?.replace('@PREFERENCE', '').trim();
          const preference = parts[2];
          const confidence = parts[3];
          console.log(chalk.gray(`   [${confidence}] ${category}: ${preference}`));
        }
      }
      console.log();
    }

    // Display patterns
    if (patterns.length > 0) {
      console.log(chalk.bold('🔄 Patterns:'));
      for (const pattern of patterns) {
        const parts = pattern.split('|');
        if (parts.length >= 3) {
          const patternText = parts[1]?.replace('@PATTERN', '').trim();
          const frequency = parts[2];
          console.log(chalk.gray(`   [${frequency}] ${patternText}`));
        }
      }
      console.log();
    }

    // Display triggers
    if (triggers.length > 0) {
      console.log(chalk.bold('⚡ Triggers:'));
      for (const trigger of triggers) {
        const parts = trigger.split('|');
        if (parts.length >= 3) {
          const triggerText = parts[1]?.replace('@TRIGGER', '').trim();
          const response = parts[2];
          console.log(chalk.gray(`   [${response}] ${triggerText}`));
        }
      }
      console.log();
    }

    // Display communication styles
    if (communication.length > 0) {
      console.log(chalk.bold('💬 Communication Style:'));
      for (const comm of communication) {
        const parts = comm.split('|');
        if (parts.length >= 3) {
          const style = parts[1]?.replace('@COMMUNICATION', '').trim();
          const value = parts[2];
          console.log(chalk.gray(`   ${style}: ${value}`));
        }
      }
      console.log();
    }

    console.log(chalk.gray(`Total entries: ${lines.length}`));
  }

  /**
   * Clear user profile
   */
  async clear(): Promise<void> {
    const profilePath = join(this.cwd, '.aicf', 'user-profile.aicf');

    if (!existsSync(profilePath)) {
      console.log(chalk.yellow('❌ No user profile found'));
      return;
    }

    // Confirm deletion
    console.log(chalk.yellow('⚠️  This will delete your user profile'));
    console.log(chalk.gray('   You can recreate it by running: aether watch'));
    console.log();

    // For now, just delete (in production, add confirmation prompt)
    unlinkSync(profilePath);
    console.log(chalk.green('✅ User profile cleared'));
  }

  /**
   * Edit user profile (open in editor)
   */
  async edit(): Promise<void> {
    const profilePath = join(this.cwd, '.aicf', 'user-profile.aicf');

    if (!existsSync(profilePath)) {
      console.log(chalk.yellow('❌ No user profile found'));
      console.log(chalk.gray('   Run extraction to create profile: aether watch'));
      return;
    }

    console.log(chalk.blue('📝 User profile location:'));
    console.log(chalk.gray(`   ${profilePath}`));
    console.log();
    console.log(chalk.gray('   Open this file in your editor to make changes'));
  }

  /**
   * Show privacy information
   */
  async privacy(): Promise<void> {
    console.log(chalk.bold('🔒 Privacy & Data Storage\n'));

    console.log(chalk.bold('What is stored:'));
    console.log(chalk.gray('   • User preferences (development style, quality standards)'));
    console.log(chalk.gray('   • Behavioral patterns (observed from conversations)'));
    console.log(chalk.gray('   • Emotional triggers (frustration, excitement)'));
    console.log(chalk.gray('   • Communication style (tone, detail level)'));
    console.log();

    console.log(chalk.bold("Where it's stored:"));
    console.log(chalk.gray('   • Local file: .aicf/user-profile.aicf'));
    console.log(chalk.gray('   • Never uploaded or shared'));
    console.log(chalk.gray('   • Stays on your machine'));
    console.log();

    console.log(chalk.bold("Why it's stored:"));
    console.log(chalk.gray('   • Adapt AI responses to YOUR style'));
    console.log(chalk.gray('   • Remember your preferences across sessions'));
    console.log(chalk.gray('   • Improve context understanding'));
    console.log();

    console.log(chalk.bold('Your control:'));
    console.log(chalk.gray('   • View:  aether profile show'));
    console.log(chalk.gray('   • Edit:  aether profile edit'));
    console.log(chalk.gray('   • Clear: aether profile clear'));
    console.log();
  }
}
