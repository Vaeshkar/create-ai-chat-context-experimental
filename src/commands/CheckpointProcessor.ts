/**
 * This file is part of create-ai-chat-context-experimental.
 * Licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later).
 * See LICENSE file for details.
 */

/**
 * Checkpoint Processor Command
 * Phase 3: CLI Integration - October 2025
 *
 * Processes checkpoint files and generates memory files (.aicf and .ai)
 */

import { readFileSync, existsSync } from 'fs';
import { join, basename } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { ConversationOrchestrator } from '../orchestrators/ConversationOrchestrator.js';
import { MemoryFileWriter } from '../writers/MemoryFileWriter.js';
import { FileIOManager } from '../utils/FileIOManager.js';
import { FileValidator } from '../utils/FileValidator.js';
import type { Conversation } from '../types/conversation.js';

interface CheckpointProcessorOptions {
  output?: string;
  verbose?: boolean;
  backup?: boolean;
}

/**
 * Process checkpoint files and generate memory files
 */
export class CheckpointProcessor {
  private orchestrator: ConversationOrchestrator;
  private writer: MemoryFileWriter;
  private fileIO: FileIOManager;
  private validator: FileValidator;
  private options: CheckpointProcessorOptions;

  constructor(options: CheckpointProcessorOptions = {}) {
    this.orchestrator = new ConversationOrchestrator();
    this.writer = new MemoryFileWriter();
    this.fileIO = new FileIOManager();
    this.validator = new FileValidator();
    this.options = {
      output: '.aicf',
      verbose: false,
      backup: true,
      ...options,
    };
  }

  /**
   * Process a checkpoint file
   */
  async process(filePath: string): Promise<void> {
    const spinner = ora();

    try {
      // Validate file exists
      if (!existsSync(filePath)) {
        throw new Error(`Checkpoint file not found: ${filePath}`);
      }

      spinner.start(`📂 Reading checkpoint file: ${basename(filePath)}`);

      // Read checkpoint file
      const fileContent = readFileSync(filePath, 'utf-8');
      const checkpoint = JSON.parse(fileContent) as Checkpoint;

      spinner.succeed(`✅ Checkpoint loaded`);

      // Validate checkpoint structure
      if (!checkpoint.conversation || !Array.isArray(checkpoint.conversation.messages)) {
        throw new Error('Invalid checkpoint structure: missing conversation.messages');
      }

      // Extract conversation and raw data
      const conversation = checkpoint.conversation as Conversation;
      const rawData = checkpoint.rawData as string | undefined;

      spinner.start('🔍 Analyzing conversation...');

      // Run orchestrator analysis
      const analysisResult = this.orchestrator.analyze(conversation, rawData);

      if (!analysisResult.ok) {
        throw new Error(`Analysis failed: ${analysisResult.error.message}`);
      }

      spinner.succeed('✅ Analysis complete');

      // Generate memory files
      spinner.start('📝 Generating memory files...');

      const aicfContent = this.writer.generateAICF(analysisResult.value, conversation.id);
      const markdownContent = this.writer.generateMarkdown(analysisResult.value, conversation.id);

      spinner.succeed('✅ Memory files generated');

      // Write files
      spinner.start('💾 Writing files to disk...');

      const outputDir = this.options.output || '.aicf';
      const dirResult = this.fileIO.ensureDirectoryExists(outputDir);
      if (!dirResult.ok) {
        throw new Error(`Failed to create output directory: ${dirResult.error}`);
      }

      const aicfPath = join(outputDir, `${conversation.id}.aicf`);
      const aiPath = join(outputDir, `${conversation.id}.ai.md`);

      // Write AICF file with backup
      const aicfResult = this.fileIO.writeFile(aicfPath, aicfContent, {
        backup: this.options.backup,
        atomic: true,
      });
      if (!aicfResult.ok) {
        throw new Error(`Failed to write AICF file: ${aicfResult.error}`);
      }

      // Write Markdown file with backup
      const aiResult = this.fileIO.writeFile(aiPath, markdownContent, {
        backup: this.options.backup,
        atomic: true,
      });
      if (!aiResult.ok) {
        throw new Error(`Failed to write Markdown file: ${aiResult.error}`);
      }

      // Validate written files
      const aicfValidation = this.validator.validateAICF(aicfPath);
      if (aicfValidation.ok && !aicfValidation.isValid) {
        console.warn(
          chalk.yellow(`⚠️  AICF file validation warnings: ${aicfValidation.warnings.join(', ')}`)
        );
      }

      const aiValidation = this.validator.validateMarkdown(aiPath);
      if (aiValidation.ok && !aiValidation.isValid) {
        console.warn(
          chalk.yellow(`⚠️  Markdown file validation warnings: ${aiValidation.warnings.join(', ')}`)
        );
      }

      spinner.succeed('✅ Files written successfully');

      // Print summary
      console.log(chalk.green('\n✨ Checkpoint processing complete!\n'));
      console.log(chalk.bold('📊 Summary:'));
      console.log(`   ${chalk.cyan('Conversation ID:')} ${conversation.id}`);
      console.log(`   ${chalk.cyan('Messages:')} ${conversation.messages.length}`);
      console.log(`   ${chalk.cyan('AICF File:')} ${aicfPath}`);
      console.log(`   ${chalk.cyan('Markdown File:')} ${aiPath}`);
      console.log();

      if (this.options.verbose) {
        console.log(chalk.gray('Analysis Results:'));
        console.log(`   User Intents: ${analysisResult.value.userIntents.length}`);
        console.log(`   AI Actions: ${analysisResult.value.aiActions.length}`);
        console.log(`   Technical Work: ${analysisResult.value.technicalWork.length}`);
        console.log(`   Decisions: ${analysisResult.value.decisions.length}`);
        console.log();
      }
    } catch (error) {
      spinner.fail('❌ Processing failed');
      throw error;
    }
  }
}

/**
 * Checkpoint file structure
 */
interface Checkpoint {
  conversation: Conversation;
  rawData?: string;
  timestamp?: string;
  source?: string;
}
