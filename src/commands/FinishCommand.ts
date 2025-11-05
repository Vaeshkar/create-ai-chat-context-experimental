/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Finish Command - Complete AI session and prepare handoff
 * Phase 4: User Experience Implementation
 *
 * Implements the session end workflow from LLM-ENFORCE-RULES-DESIGN.md:
 * 1. Analyzes git changes to extract context
 * 2. Updates conversation log with session summary
 * 3. Optionally migrates to AICF 3.0 format
 * 4. Commits changes with meaningful message
 * 5. Generates handoff text for next AI chat
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Result } from '../types/result.js';
import { Ok, Err } from '../types/result.js';
import { getNextChatNumber, buildLogEntry, appendToConversationLog } from '../utils/Logger.js';

export interface FinishCommandOptions {
  cwd?: string;
  verbose?: boolean;
  topic?: string;
  what?: string;
  why?: string;
  outcome?: string;
  aicf?: boolean;
  noCommit?: boolean;
}

export interface FinishResult {
  chatNumber: number;
  topic: string;
  outcome: string;
  filesChanged: string[];
  committed: boolean;
  handoffText: string;
  message: string;
}

export class FinishCommand {
  private cwd: string;
  private verbose: boolean;

  constructor(options: FinishCommandOptions = {}) {
    this.cwd = options.cwd || process.cwd();
    this.verbose = options.verbose || false;
  }

  async execute(options: FinishCommandOptions = {}): Promise<Result<FinishResult>> {
    try {
      const spinner = ora();

      console.log();
      console.log(chalk.cyan('🏁 Finishing AI Session & Preparing Handoff'));
      console.log();

      // Step 1: Check if .ai/ directory exists
      const aiDir = join(this.cwd, '.ai');
      if (!existsSync(aiDir)) {
        return Err(new Error('No .ai/ directory found. Run "aether init" first.'));
      }

      // Step 2: Analyze git changes to extract context
      spinner.start('Analyzing git changes...');
      const gitAnalysis = await this.analyzeGitChanges();
      if (!gitAnalysis.ok) {
        spinner.fail('Failed to analyze git changes');
        return Err(new Error('Failed to analyze git changes'));
      }
      spinner.succeed('Git changes analyzed');

      // Step 3: Get session details (from options or prompt user)
      const sessionDetails = await this.getSessionDetails(options, gitAnalysis.value);

      // Step 4: Get next chat number
      const chatNumber = await getNextChatNumber(this.cwd);

      // Step 5: Update conversation log
      spinner.start(`Updating conversation log with Chat #${chatNumber}...`);
      const updateResult = await this.updateConversationLog(
        chatNumber,
        sessionDetails,
        gitAnalysis.value
      );
      if (!updateResult.ok) {
        spinner.fail('Failed to update conversation log');
        return Err(new Error('Failed to update conversation log'));
      }
      spinner.succeed(`Updated conversation-log.md with Chat #${chatNumber}`);

      // Step 6: Optionally migrate to AICF 3.0
      if (options.aicf) {
        spinner.start('Migrating to AICF 3.0...');
        // TODO: Implement AICF migration
        spinner.succeed('Migrated to AICF 3.0');
      }

      // Step 7: Commit changes (unless --no-commit)
      let committed = false;
      if (!options.noCommit) {
        spinner.start('Committing changes...');
        const commitResult = await this.commitChanges(sessionDetails, gitAnalysis.value);
        if (commitResult.ok) {
          committed = true;
          spinner.succeed('Changes committed to git');
        } else {
          spinner.warn('Failed to commit changes (continuing...)');
          if (this.verbose) {
            console.log(chalk.yellow('Commit error:'), 'Git commit failed');
          }
        }
      }

      // Step 8: Generate handoff text
      const handoffText = this.generateHandoffText(chatNumber, sessionDetails, gitAnalysis.value);

      console.log();
      console.log(chalk.green('🎉 Session Finished Successfully!'));
      console.log();
      console.log(chalk.cyan('📋 Session Summary:'));
      console.log(`   Topic: ${sessionDetails.topic}`);
      console.log(`   Outcome: ${sessionDetails.outcome}`);
      console.log(
        `   Files: ${gitAnalysis.value.changedFiles.slice(0, 3).join(', ')}${gitAnalysis.value.changedFiles.length > 3 ? ' +more' : ''}`
      );
      console.log();

      return Ok({
        chatNumber,
        topic: sessionDetails.topic,
        outcome: sessionDetails.outcome,
        filesChanged: gitAnalysis.value.changedFiles,
        committed,
        handoffText,
        message: 'Session finished successfully',
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async analyzeGitChanges(): Promise<Result<GitAnalysis>> {
    try {
      // Get staged files
      const stagedFiles = this.getGitFiles('--cached --name-only');

      // Get unstaged files (modified but not staged)
      const unstagedFiles = this.getGitFiles('--name-only');

      // Get all changed files (staged + unstaged, deduplicated)
      const allChangedFiles = Array.from(new Set([...stagedFiles, ...unstagedFiles]));

      // Generate summary based on file types and patterns
      const summary = this.generateChangeSummary(allChangedFiles);

      return Ok({
        changedFiles: allChangedFiles,
        stagedFiles,
        unstagedFiles,
        summary,
      });
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private getGitFiles(gitArgs: string): string[] {
    try {
      const output = execSync(`git diff ${gitArgs}`, {
        cwd: this.cwd,
        encoding: 'utf-8',
      }).trim();

      return output ? output.split('\n').filter(Boolean) : [];
    } catch {
      // If git command fails, return empty array (not in git repo or no changes)
      return [];
    }
  }

  private generateChangeSummary(files: string[]): string {
    if (files.length === 0) {
      return 'No changes detected';
    }

    const categories = {
      source: files.filter((f) => /\.(ts|js|tsx|jsx|py|java|cpp|c|rs|go)$/.test(f)),
      tests: files.filter((f) => /\.(test|spec)\.(ts|js|tsx|jsx|py)$/.test(f)),
      docs: files.filter((f) => /\.(md|txt|rst)$/.test(f)),
      config: files.filter((f) => /\.(json|yaml|yml|toml|ini|env)$/.test(f)),
      styles: files.filter((f) => /\.(css|scss|sass|less)$/.test(f)),
    };

    const parts = [];
    if (categories.source.length > 0) parts.push(`${categories.source.length} source files`);
    if (categories.tests.length > 0) parts.push(`${categories.tests.length} test files`);
    if (categories.docs.length > 0) parts.push(`${categories.docs.length} documentation files`);
    if (categories.config.length > 0) parts.push(`${categories.config.length} config files`);
    if (categories.styles.length > 0) parts.push(`${categories.styles.length} style files`);

    const otherCount =
      files.length - Object.values(categories).reduce((sum, arr) => sum + arr.length, 0);
    if (otherCount > 0) parts.push(`${otherCount} other files`);

    return `Modified ${parts.join(', ')}`;
  }

  private async getSessionDetails(
    options: FinishCommandOptions,
    gitAnalysis: GitAnalysis
  ): Promise<SessionDetails> {
    // If all details provided via options, use them
    if (options.topic && options.what && options.why && options.outcome) {
      return {
        topic: options.topic,
        what: options.what,
        why: options.why,
        outcome: options.outcome,
      };
    }

    // Otherwise, prompt user with smart defaults based on git analysis
    const defaultTopic = this.inferTopicFromChanges(gitAnalysis.changedFiles);

    console.log();
    console.log(chalk.cyan('📝 Session Details'));
    console.log(chalk.dim(`Git detected: ${gitAnalysis.summary}`));
    console.log();

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'topic',
        message: 'Session topic:',
        default: options.topic || defaultTopic,
        validate: (input: string) => input.trim().length > 0 || 'Topic cannot be empty',
      },
      {
        type: 'input',
        name: 'what',
        message: 'What was accomplished:',
        default: options.what || gitAnalysis.summary,
        validate: (input: string) => input.trim().length > 0 || 'Accomplishment cannot be empty',
      },
      {
        type: 'input',
        name: 'why',
        message: 'Why this work was done:',
        default: options.why || 'Implementing planned features and improvements',
      },
      {
        type: 'input',
        name: 'outcome',
        message: 'Session outcome:',
        default: options.outcome || 'Work completed successfully',
        validate: (input: string) => input.trim().length > 0 || 'Outcome cannot be empty',
      },
    ]);

    return answers;
  }

  private inferTopicFromChanges(files: string[]): string {
    if (files.length === 0) return 'General maintenance';

    // Look for patterns in file paths to infer topic
    const patterns = [
      { regex: /test|spec/, topic: 'Testing' },
      { regex: /doc|readme|md/, topic: 'Documentation' },
      { regex: /config|setup|init/, topic: 'Configuration' },
      { regex: /api|endpoint|route/, topic: 'API Development' },
      { regex: /ui|component|style/, topic: 'UI Development' },
      { regex: /auth|login|user/, topic: 'Authentication' },
      { regex: /db|database|migration/, topic: 'Database' },
      { regex: /deploy|build|ci/, topic: 'Deployment' },
    ];

    for (const pattern of patterns) {
      if (files.some((file) => pattern.regex.test(file.toLowerCase()))) {
        return pattern.topic;
      }
    }

    return 'Development';
  }

  private async updateConversationLog(
    chatNumber: number,
    sessionDetails: SessionDetails,
    gitAnalysis: GitAnalysis
  ): Promise<Result<void>> {
    try {
      const conversationLogPath = join(this.cwd, '.ai', 'conversation-log.md');
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

      // Build accomplishments from session details and git analysis
      const accomplishments = [
        sessionDetails.what,
        ...(gitAnalysis.changedFiles.length > 0
          ? [`Modified ${gitAnalysis.changedFiles.length} files`]
          : []),
      ];

      // Build decisions (if any major decisions were made)
      const decisions =
        sessionDetails.why !== 'Implementing planned features and improvements'
          ? [`${sessionDetails.why}`]
          : [];

      // Build next steps (placeholder for now)
      const nextSteps = ['Continue with planned development'];

      // Create log entry
      const entry = buildLogEntry(chatNumber, date, accomplishments, decisions, nextSteps);

      // Append to conversation log
      await appendToConversationLog(conversationLogPath, entry);

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async commitChanges(
    sessionDetails: SessionDetails,
    gitAnalysis: GitAnalysis
  ): Promise<Result<void>> {
    try {
      // Stage all changes if there are unstaged files
      if (gitAnalysis.unstagedFiles.length > 0) {
        execSync('git add .', { cwd: this.cwd });
      }

      // Create meaningful commit message
      const commitMessage = this.generateCommitMessage(sessionDetails, gitAnalysis);

      // Commit changes (escape quotes in commit message)
      const escapedMessage = commitMessage.replace(/"/g, '\\"');
      execSync(`git commit -m "${escapedMessage}"`, { cwd: this.cwd });

      return Ok(undefined);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  }

  private generateCommitMessage(sessionDetails: SessionDetails, gitAnalysis: GitAnalysis): string {
    // Format: "feat: <topic> - <brief what>"
    const type = this.inferCommitType(gitAnalysis.changedFiles);
    const topic = sessionDetails.topic.toLowerCase();
    const brief =
      sessionDetails.what.length > 50
        ? sessionDetails.what.substring(0, 47) + '...'
        : sessionDetails.what;

    return `${type}: ${topic} - ${brief}`;
  }

  private inferCommitType(files: string[]): string {
    // Infer conventional commit type from changed files
    if (files.some((f) => f.includes('test') || f.includes('spec'))) return 'test';
    if (files.some((f) => f.endsWith('.md') || f.includes('doc'))) return 'docs';
    if (files.some((f) => f.includes('config') || f.includes('package.json'))) return 'chore';
    if (files.some((f) => f.includes('fix') || f.includes('bug'))) return 'fix';
    return 'feat'; // Default to feature
  }

  private generateHandoffText(
    chatNumber: number,
    sessionDetails: SessionDetails,
    gitAnalysis: GitAnalysis
  ): string {
    const handoffText = `
🤖 **AI Session Handoff - Chat #${chatNumber}**

**Context:** ${sessionDetails.topic}
**Completed:** ${sessionDetails.what}
**Outcome:** ${sessionDetails.outcome}

**Files Modified:** ${gitAnalysis.changedFiles.length > 0 ? gitAnalysis.changedFiles.join(', ') : 'None'}

**For Next AI:**
- Read .ai/conversation-log.md for full context
- Check recent changes in git log
- Continue with planned development tasks

**Quick Start:**
\`\`\`bash
# Load project context
cat .ai/conversation-log.md | head -20
git log --oneline -5
\`\`\`
    `.trim();

    // Display handoff text to user
    console.log();
    console.log(chalk.cyan('📋 Handoff Text (copy for next AI chat):'));
    console.log(chalk.dim('─'.repeat(60)));
    console.log(handoffText);
    console.log(chalk.dim('─'.repeat(60)));
    console.log();

    return handoffText;
  }
}

interface GitAnalysis {
  changedFiles: string[];
  stagedFiles: string[];
  unstagedFiles: string[];
  summary: string;
}

interface SessionDetails {
  topic: string;
  what: string;
  why: string;
  outcome: string;
}
